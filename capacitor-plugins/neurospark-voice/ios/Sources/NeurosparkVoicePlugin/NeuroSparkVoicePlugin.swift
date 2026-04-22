import AVFoundation
import Capacitor
import Foundation
import Speech

/**
 * NeuroSparkVoice — iOS TTS (AVSpeechSynthesizer) and on-device STT (SFSpeechRecognizer).
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

    private let synth = AVSpeechSynthesizer()
    private var activeSpeakCall: CAPPluginCall?
    private var speaking = false

    private var sttAudioEngine: AVAudioEngine?
    private var sttBufferRequest: SFSpeechAudioBufferRecognitionRequest?
    private var sttRecognitionTask: SFSpeechRecognitionTask?
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

            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
                try session.setActive(true, options: [])
            } catch {
                call.reject("audio_session", "Failed to activate AVAudioSession", error)
                return
            }

            self.activeSpeakCall = call
            self.speaking = true

            let utterance = AVSpeechUtterance(string: text)
            let localeId = call.getString("locale") ?? "en-US"
            utterance.voice = AVSpeechSynthesisVoice(language: localeId.replacingOccurrences(of: "_", with: "-"))

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
                        self.beginStreamingListen(call: call)
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
        beginStreamingListen(call: call)
    }

    private func beginStreamingListen(call: CAPPluginCall) {
        let localeId = (call.getString("locale") ?? "en-US").replacingOccurrences(of: "_", with: "-")
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId)) else {
            call.reject("stt_unavailable", "No speech recognizer for locale", nil)
            return
        }
        guard recognizer.isAvailable else {
            call.reject("stt_unavailable", "Speech recognizer unavailable", nil)
            return
        }
        if !recognizer.supportsOnDeviceRecognition {
            call.reject("stt_on_device_unavailable", "On-device speech recognition is not supported on this device", nil)
            return
        }

        teardownStt(sendFinalEmpty: false)

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.requiresOnDeviceRecognition = true
        request.shouldReportPartialResults = call.getBool("partialResults", true)

        let engine = AVAudioEngine()
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
            try session.setActive(true, options: [])
        } catch {
            call.reject("audio_session", "Failed to set up recording session", error)
            return
        }

        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.sttBufferRequest?.append(buffer)
        }

        sttAudioEngine = engine
        sttBufferRequest = request

        listening = true

        sttRecognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }
            DispatchQueue.main.async {
                if let error = error {
                    let ns = error as NSError
                    if ns.domain == "kAFAssistantErrorDomain" && ns.code == 216 {
                        // Canceled — ignore
                        return
                    }
                    self.notifySttError(code: "stt_error")
                    self.notifyListeners("sttFinal", data: ["text": ""])
                    self.teardownStt(sendFinalEmpty: false)
                    return
                }
                guard let result = result else { return }
                let text = result.bestTranscription.formattedString
                if result.isFinal {
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
            call.resolve()
        } catch {
            listening = false
            teardownStt(sendFinalEmpty: false)
            call.reject("stt_start_failed", error.localizedDescription, error)
        }
    }

    private func teardownStt(sendFinalEmpty: Bool) {
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
