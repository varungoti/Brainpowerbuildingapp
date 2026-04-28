import AVFoundation
import Capacitor
import Foundation
import Speech

/**
 * NeuroSparkVoice — iOS TTS (AVSpeechSynthesizer) and STT (SFSpeechRecognizer, system on-device when available).
 *
 * Reliability hardening:
 *  - STT retries: first attempt prefers on-device; on transient failure we relax to cloud-permitted, then
 *    drop down to the next best available recognizer (en-US fallback) before surfacing an error.
 *  - 12s watchdog catches stuck recognition tasks (some iOS releases silently stall after the request
 *    is appended to but never produces results).
 *  - Audio session is force-deactivated and re-configured between TTS and STT, with a `.playAndRecord`
 *    fallback when `.record` rejects (e.g. another app holds the input).
 *  - TTS voice resolution falls back along requested → language-only → en-US so a missing voice never blocks playback.
 *  - Benign cancellation codes (`kAFAssistantErrorDomain` 203/216/1110) are surfaced as empty finals
 *    rather than fatal errors.
 */
@objc(NeuroSparkVoicePlugin)
public class NeuroSparkVoicePlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "NeuroSparkVoicePlugin"
    public let jsName = "NeuroSparkVoice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelSpeech", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSpeaking", returnType: CAPPluginReturnPromise)
    ]

    private static let sttWatchdogSeconds: TimeInterval = 12

    private let synth = AVSpeechSynthesizer()
    private var activeSpeakCall: CAPPluginCall?
    private var speaking = false

    private var sttAudioEngine: AVAudioEngine?
    private var sttBufferRequest: SFSpeechAudioBufferRecognitionRequest?
    private var sttRecognitionTask: SFSpeechRecognitionTask?
    private var sttSessionId: Int = 0
    private var sttWatchdogWorkItem: DispatchWorkItem?
    private var listening = false

    public override func load() {
        super.load()
        synth.delegate = self
    }

    deinit {
        teardownStt(sendFinalEmpty: false)
    }

    // MARK: - Permissions

    @objc public func checkPermissions(_ call: CAPPluginCall) {
        let speech = SFSpeechRecognizer.authorizationStatus()
        let mic = AVAudioSession.sharedInstance().recordPermission
        call.resolve(["speechRecognition": Self.combinedPermission(speech: speech, mic: mic)])
    }

    @objc public func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                if status != .authorized {
                    call.resolve(["speechRecognition": Self.speechOnlyPermissionString(status)])
                    return
                }
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    DispatchQueue.main.async {
                        call.resolve(["speechRecognition": granted ? "granted" : "denied"])
                    }
                }
            }
        }
    }

    // MARK: - Plugin methods

    @objc public func capabilities(_ call: CAPPluginCall) {
        call.resolve([
            "tts": true,
            "stt": true,
            "bargeIn": true,
            "wakeWord": "platform",
            "platform": "ios"
        ])
    }

    @objc public func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if let prev = self.activeSpeakCall {
                self.activeSpeakCall = nil
                prev.resolve()
            }

            // Hard-deactivate any prior session before flipping into playback.
            try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])

            let session = AVAudioSession.sharedInstance()
            var sessionOk = false
            do {
                try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
                try session.setActive(true, options: [])
                sessionOk = true
            } catch {
                // Some iPad multitasking states reject `.playback`; fall back to ambient so we still talk.
                do {
                    try session.setCategory(.ambient, mode: .default, options: [])
                    try session.setActive(true, options: [])
                    sessionOk = true
                } catch {
                    NSLog("NeuroSparkVoice: AVAudioSession setup failed for TTS: \(error)")
                }
            }
            if !sessionOk {
                call.reject("audio_session", "Failed to activate AVAudioSession")
                return
            }

            self.activeSpeakCall = call
            self.speaking = true

            let utterance = AVSpeechUtterance(string: text)
            let lang = Self.normalizedLocaleIdentifier(call.getString("locale") ?? "en-US")
            utterance.voice = Self.bestVoice(forRequested: lang)

            let rate = call.getDouble("rate", 1.0)
            utterance.rate = self.clampedSpeechRate(Float(rate))

            let pitch = call.getDouble("pitch", 1.0)
            utterance.pitchMultiplier = self.clampedPitch(Float(pitch))

            self.synth.stopSpeaking(at: .immediate)
            self.synth.speak(utterance)
        }
    }

    @objc public func cancelSpeech(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.synth.stopSpeaking(at: .immediate)
            self.speaking = false
            if let c = self.activeSpeakCall {
                self.activeSpeakCall = nil
                c.resolve()
            }
            call.resolve()
        }
    }

    @objc public func startListening(_ call: CAPPluginCall) {
        let speech = SFSpeechRecognizer.authorizationStatus()
        if speech == .notDetermined {
            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if status == .authorized {
                        self.ensureMicThenListen(call: call)
                    } else {
                        self.notifySttError(code: "speech_recognition_permission_denied")
                        call.reject("permission_denied", "Speech recognition not authorized", nil)
                    }
                }
            }
            return
        }
        if speech != .authorized {
            notifySttError(code: "speech_recognition_permission_denied")
            call.reject("permission_denied", "Speech recognition not authorized", nil)
            return
        }
        ensureMicThenListen(call: call)
    }

    @objc public func stopListening(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.teardownStt(sendFinalEmpty: true)
            call.resolve()
        }
    }

    @objc public func isListening(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            call.resolve(["value": self?.listening ?? false])
        }
    }

    @objc public func isSpeaking(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let v = (self?.synth.isSpeaking ?? false) || (self?.speaking ?? false)
            call.resolve(["value": v])
        }
    }

    // MARK: - STT internals

    private func ensureMicThenListen(call: CAPPluginCall) {
        let mic = AVAudioSession.sharedInstance().recordPermission
        if mic == .undetermined {
            AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if granted {
                        self.beginStreamingListen(call: call, requireOnDevice: true, attempt: 0)
                    } else {
                        self.notifySttError(code: "speech_recognition_permission_denied")
                        call.reject("permission_denied", "Microphone permission denied", nil)
                    }
                }
            }
            return
        }
        if mic != .granted {
            notifySttError(code: "speech_recognition_permission_denied")
            call.reject("permission_denied", "Microphone permission denied", nil)
            return
        }
        beginStreamingListen(call: call, requireOnDevice: true, attempt: 0)
    }

    /// - Parameters:
    ///   - requireOnDevice: Prefer on-device models when supported; relaxed automatically on transient failures.
    ///   - attempt: 0 = first try, 1 = relaxed/cloud, 2 = en-US fallback. After that we surface the error.
    private func beginStreamingListen(call: CAPPluginCall, requireOnDevice: Bool, attempt: Int) {
        if attempt > 2 {
            notifySttError(code: "stt_failed_after_retry")
            return
        }

        let rawLocale = call.getString("locale") ?? "en-US"
        let candidate = attempt >= 2 ? "en-US" : rawLocale
        guard let pair = Self.bestRecognizerPair(forRequested: candidate) else {
            if attempt < 2 {
                beginStreamingListen(call: call, requireOnDevice: false, attempt: attempt + 1)
                return
            }
            call.reject("stt_unavailable", "No speech recognizer available for this language", nil)
            return
        }
        let recognizer = pair.0

        teardownStt(sendFinalEmpty: false)

        sttSessionId &+= 1
        let sessionId = sttSessionId

        let request = SFSpeechAudioBufferRecognitionRequest()
        let wantOnDevice = requireOnDevice && recognizer.supportsOnDeviceRecognition
        request.requiresOnDeviceRecognition = wantOnDevice
        request.shouldReportPartialResults = call.getBool("partialResults", true)
        if #available(iOS 13.0, *) {
            request.taskHint = .dictation
        }

        let engine = AVAudioEngine()
        let input = engine.inputNode
        var format = input.outputFormat(forBus: 0)
        if format.sampleRate == 0 || format.channelCount == 0 {
            format = input.inputFormat(forBus: 0)
        }
        guard format.sampleRate > 0, format.channelCount > 0 else {
            if attempt < 2 {
                beginStreamingListen(call: call, requireOnDevice: false, attempt: attempt + 1)
            } else {
                call.reject("stt_unavailable", "Invalid microphone audio format", nil)
            }
            return
        }

        if !setupRecordSession(allowPlayAndRecord: attempt >= 1) {
            if attempt < 2 {
                beginStreamingListen(call: call, requireOnDevice: false, attempt: attempt + 1)
            } else {
                call.reject("audio_session", "Failed to set up recording session", nil)
            }
            return
        }

        // installTap can raise NSException ("required condition is false: nullptr == Tap()") if a tap
        // is still attached. Calling removeTap inside installInputTap defends against that.
        installInputTap(on: input, format: format)

        sttAudioEngine = engine
        sttBufferRequest = request
        listening = true

        sttRecognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            DispatchQueue.main.async {
                guard sessionId == self.sttSessionId else { return }
                if let error = error {
                    let ns = error as NSError
                    if Self.isBenignCancellation(ns) {
                        // Cancellation / "no speech detected" — surface as empty final, not error.
                        self.cancelSttWatchdog()
                        self.notifyListeners("sttFinal", data: ["text": ""])
                        self.teardownStt(sendFinalEmpty: false)
                        return
                    }
                    if attempt < 2, Self.shouldRetry(ns, hadRequiredOnDevice: wantOnDevice) {
                        self.cancelSttWatchdog()
                        self.teardownStt(sendFinalEmpty: false)
                        self.beginStreamingListen(
                            call: call,
                            requireOnDevice: false,
                            attempt: attempt + 1)
                        return
                    }
                    self.cancelSttWatchdog()
                    self.notifySttError(code: Self.speechErrorCode(ns))
                    self.teardownStt(sendFinalEmpty: false)
                    return
                }
                guard let result = result else { return }
                let text = result.bestTranscription.formattedString
                if result.isFinal {
                    self.cancelSttWatchdog()
                    self.notifyListeners("sttFinal", data: ["text": text])
                    self.teardownStt(sendFinalEmpty: false)
                } else if request.shouldReportPartialResults {
                    self.notifyListeners("sttPartial", data: ["text": text])
                }
            }
        }

        do {
            engine.prepare()
            try engine.start()
            armSttWatchdog(sessionId: sessionId)
            if attempt == 0 {
                call.resolve()
            }
        } catch {
            listening = false
            teardownStt(sendFinalEmpty: false)
            if attempt < 2 {
                beginStreamingListen(call: call, requireOnDevice: false, attempt: attempt + 1)
            } else {
                call.reject("stt_start_failed", error.localizedDescription, error)
            }
        }
    }

    private func installInputTap(on input: AVAudioInputNode, format: AVAudioFormat) {
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, _ in
            self?.sttBufferRequest?.append(buffer)
        }
    }

    private func setupRecordSession(allowPlayAndRecord: Bool) -> Bool {
        let session = AVAudioSession.sharedInstance()
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
        do {
            try session.setCategory(.record, mode: .measurement, options: [.duckOthers, .allowBluetooth])
            try session.setActive(true, options: [])
            return true
        } catch {
            if !allowPlayAndRecord { return false }
            do {
                try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .duckOthers, .allowBluetooth])
                try session.setActive(true, options: [])
                return true
            } catch {
                NSLog("NeuroSparkVoice: AVAudioSession setup failed for STT: \(error)")
                return false
            }
        }
    }

    private func armSttWatchdog(sessionId: Int) {
        cancelSttWatchdog()
        let work = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            guard sessionId == self.sttSessionId else { return }
            NSLog("NeuroSparkVoice: STT watchdog fired (no result within \(Self.sttWatchdogSeconds)s)")
            self.notifySttError(code: "stt_speech_timeout")
            self.teardownStt(sendFinalEmpty: false)
        }
        sttWatchdogWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.sttWatchdogSeconds, execute: work)
    }

    private func cancelSttWatchdog() {
        sttWatchdogWorkItem?.cancel()
        sttWatchdogWorkItem = nil
    }

    // MARK: - Locale / recognizer resolution (STT hardening)

    private static func normalizedLocaleIdentifier(_ raw: String) -> String {
        var t = raw.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "_", with: "-")
        if t.isEmpty { t = "en-US" }
        let segs = t.split(separator: "-")
        if segs.count == 1, let lang = segs.first, lang.count == 2 {
            let l = String(lang).lowercased()
            let map = ["en": "en-US", "es": "es-ES", "fr": "fr-FR", "de": "de-DE", "hi": "hi-IN", "pt": "pt-BR", "ja": "ja-JP", "zh": "zh-CN", "ar": "ar-SA", "ta": "ta-IN", "te": "te-IN", "kn": "kn-IN", "ml": "ml-IN"]
            if let full = map[l] { return full }
            if let preferred = Locale.preferredLanguages.first {
                let p = preferred.replacingOccurrences(of: "_", with: "-")
                if p.lowercased().hasPrefix(l + "-") { return p }
            }
            return "\(l)-US"
        }
        return t
    }

    private static func languagePrefix(fromLocaleId id: String) -> String {
        String(id.split(separator: "-").first ?? "en").lowercased()
    }

    /// Picks an available `SFSpeechRecognizer` and resolved BCP-47 id (never a bare two-letter code).
    private static func bestRecognizerPair(forRequested raw: String) -> (SFSpeechRecognizer, String)? {
        let primary = normalizedLocaleIdentifier(raw)
        var candidates: [String] = [primary]
        if primary != "en-US" { candidates.append("en-US") }

        for id in candidates {
            let lid = id.replacingOccurrences(of: "_", with: "-")
            if let r = SFSpeechRecognizer(locale: Locale(identifier: lid)), r.isAvailable {
                return (r, lid)
            }
        }

        let wantLang = languagePrefix(fromLocaleId: primary)
        let sorted = SFSpeechRecognizer.supportedLocales().sorted { $0.identifier < $1.identifier }
        for loc in sorted {
            let lid = loc.identifier.replacingOccurrences(of: "_", with: "-")
            let locLang = languagePrefix(fromLocaleId: lid)
            if locLang == wantLang, let r = SFSpeechRecognizer(locale: loc), r.isAvailable {
                return (r, lid)
            }
        }

        if let r = SFSpeechRecognizer(locale: Locale(identifier: "en-US")), r.isAvailable {
            return (r, "en-US")
        }
        return nil
    }

    /// Try requested → language-only → en-US → device default.
    private static func bestVoice(forRequested lang: String) -> AVSpeechSynthesisVoice? {
        if let v = AVSpeechSynthesisVoice(language: lang) { return v }
        let prefix = languagePrefix(fromLocaleId: lang)
        for voice in AVSpeechSynthesisVoice.speechVoices() {
            if voice.language.lowercased().hasPrefix(prefix) {
                return voice
            }
        }
        if let en = AVSpeechSynthesisVoice(language: "en-US") { return en }
        return AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode())
    }

    private static func shouldRetry(_ error: NSError, hadRequiredOnDevice: Bool) -> Bool {
        // `kAFAssistantErrorDomain` 1 = permissions issue; never retry.
        if error.domain == "SFSpeechRecognizerErrorDomain", error.code == 1 { return false }
        // Generic `kAFAssistantErrorDomain` failures (not the benign 203/216/1110 we already filter)
        // are usually transient — relax constraints and retry.
        if error.domain == "kAFAssistantErrorDomain" { return true }
        // If we required on-device and the OS rejected it, retrying with cloud-permitted helps.
        if hadRequiredOnDevice { return true }
        return true
    }

    /// Codes that indicate "no speech / cancelled" on iOS — surface as benign empty final.
    private static func isBenignCancellation(_ error: NSError) -> Bool {
        if error.domain == "kAFAssistantErrorDomain" {
            switch error.code {
            case 203, // Retry — user did not speak
                 216, // The operation couldn't be completed (cancelled)
                 1110, // No speech detected
                 1700: // Recognition was cancelled
                return true
            default:
                return false
            }
        }
        return false
    }

    private static func speechErrorCode(_ error: NSError) -> String {
        "stt_error_\(error.domain)_\(error.code)"
    }

    private func teardownStt(sendFinalEmpty: Bool) {
        sttSessionId &+= 1
        cancelSttWatchdog()

        if sendFinalEmpty {
            notifyListeners("sttFinal", data: ["text": ""])
        }

        sttRecognitionTask?.cancel()
        sttRecognitionTask = nil
        sttBufferRequest?.endAudio()
        sttBufferRequest = nil

        if let engine = sttAudioEngine {
            engine.inputNode.removeTap(onBus: 0)
            engine.stop()
            sttAudioEngine = nil
        }

        listening = false

        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    private func notifySttError(code: String) {
        notifyListeners("sttError", data: ["error": code])
    }

    private static func combinedPermission(speech: SFSpeechRecognizer.AuthorizationStatus, mic: AVAudioSession.RecordPermission) -> String {
        switch speech {
        case .denied, .restricted:
            return "denied"
        case .notDetermined:
            return "prompt"
        case .authorized:
            switch mic {
            case .undetermined:
                return "prompt"
            case .denied:
                return "denied"
            case .granted:
                return "granted"
            @unknown default:
                return "prompt"
            }
        @unknown default:
            return "prompt"
        }
    }

    private static func speechOnlyPermissionString(_ status: SFSpeechRecognizer.AuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "granted"
        case .denied, .restricted:
            return "denied"
        case .notDetermined:
            return "prompt"
        @unknown default:
            return "prompt"
        }
    }

    // MARK: - AVSpeechSynthesizerDelegate

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        finishActiveSpeak(success: true)
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        finishActiveSpeak(success: true)
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {}

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didContinue utterance: AVSpeechUtterance) {}

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, willSpeakRangeOfSpeechString characterRange: NSRange, utterance: AVSpeechUtterance) {}

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        speaking = true
    }

    private func finishActiveSpeak(success: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.speaking = false
            try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
            guard let c = self.activeSpeakCall else { return }
            self.activeSpeakCall = nil
            if success {
                c.resolve()
            } else {
                c.reject("tts_error")
            }
        }
    }

    private func clampedSpeechRate(_ rate: Float) -> Float {
        let minR = AVSpeechUtteranceMinimumSpeechRate
        let maxR = AVSpeechUtteranceMaximumSpeechRate
        let def = AVSpeechUtteranceDefaultSpeechRate
        let scaled = def * rate
        return min(max(scaled, minR), maxR)
    }

    private func clampedPitch(_ pitch: Float) -> Float {
        min(max(pitch, 0.5), 2.0)
    }
}
