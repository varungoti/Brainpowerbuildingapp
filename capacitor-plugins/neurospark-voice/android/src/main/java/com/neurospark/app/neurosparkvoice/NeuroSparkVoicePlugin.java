package com.neurospark.app.neurosparkvoice;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * NeuroSparkVoice — Android TTS ({@link TextToSpeech}) and STT via the system
 * {@link SpeechRecognizer}.
 *
 * <p><b>Reliability hardening:</b>
 * <ul>
 *   <li>STT performs up to two automatic retries: first relaxes the offline-only hint
 *       (when supported), then drops the language tag entirely so the OS can pick the best
 *       installed engine. Transient errors (busy, client, network) and {@code SPEECH_TIMEOUT}
 *       are treated as recoverable, while {@code NO_MATCH} is surfaced as an empty final.</li>
 *   <li>A 12 second watchdog catches stuck recognizers (some OEM builds never fire onError or
 *       onResults) and emits {@code stt_speech_timeout} instead of leaving the UI spinning.</li>
 *   <li>TTS auto-recovers if the engine fails to initialize at boot: every {@code speak} call
 *       attempts a one-time re-init before rejecting. The locale falls back along
 *       requested → language-only → device default → US.</li>
 * </ul>
 */
@CapacitorPlugin(
    name = "NeuroSparkVoice",
    permissions = @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "speechRecognition"))
public class NeuroSparkVoicePlugin extends Plugin {
    private static final String TAG = "NeuroSparkVoice";
    private static final long STT_WATCHDOG_MS = 12_000L;
    private static final int STT_MAX_ATTEMPTS = 3;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private boolean ttsInitInFlight = false;
    private volatile boolean speaking = false;
    private PluginCall activeSpeakCall;
    private long speakGeneration = 0;
    private String currentUtteranceId;

    private SpeechRecognizer speechRecognizer;
    private volatile boolean listening = false;
    /** Bumped for each STT session so stale {@link RecognitionListener} callbacks are ignored. */
    private int sttSessionGeneration = 0;
    private Runnable sttWatchdog;

    @Override
    public void load() {
        super.load();
        mainHandler.post(this::initTextToSpeech);
    }

    private void initTextToSpeech() {
        if (ttsReady || ttsInitInFlight) return;
        ttsInitInFlight = true;
        try {
            tts = new TextToSpeech(getContext(), status -> mainHandler.post(() -> {
                ttsInitInFlight = false;
                if (status == TextToSpeech.SUCCESS) {
                    ttsReady = true;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && tts != null) {
                        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override
                            public void onStart(String utteranceId) {
                                speaking = true;
                            }

                            @Override
                            public void onDone(String utteranceId) {
                                finishSpeakCall(true, utteranceId, null);
                            }

                            @Override
                            public void onError(String utteranceId) {
                                finishSpeakCall(false, utteranceId, "tts_error");
                            }
                        });
                    }
                } else {
                    Log.e(TAG, "TextToSpeech init failed status=" + status);
                    if (tts != null) {
                        try { tts.shutdown(); } catch (Exception ignored) {}
                        tts = null;
                    }
                }
            }));
        } catch (Exception e) {
            ttsInitInFlight = false;
            Log.e(TAG, "TextToSpeech construction threw", e);
            tts = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        mainHandler.post(() -> {
            destroySpeechRecognizer();
            cancelSttWatchdog();
            ttsReady = false;
            if (tts != null) {
                try { tts.stop(); } catch (Exception ignored) {}
                try { tts.shutdown(); } catch (Exception ignored) {}
                tts = null;
            }
        });
        super.handleOnDestroy();
    }

    private void finishSpeakCall(boolean success, String utteranceId, String errCode) {
        mainHandler.post(() -> {
            if (utteranceId != null
                && currentUtteranceId != null
                && !utteranceId.equals(currentUtteranceId)) {
                return;
            }
            speaking = false;
            PluginCall c = activeSpeakCall;
            activeSpeakCall = null;
            currentUtteranceId = null;
            if (c != null) {
                if (success) c.resolve();
                else c.reject(errCode != null ? errCode : "tts_error");
            }
        });
    }

    @PluginMethod
    public void capabilities(PluginCall call) {
        JSObject o = new JSObject();
        o.put("tts", true);
        o.put("stt", true);
        o.put("bargeIn", true);
        o.put("wakeWord", "porcupine");
        o.put("platform", "android");
        call.resolve(o);
    }

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject o = new JSObject();
        o.put("speechRecognition", permissionStateToString(getPermissionState("speechRecognition")));
        call.resolve(o);
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
            JSObject o = new JSObject();
            o.put("speechRecognition", "granted");
            call.resolve(o);
            return;
        }
        requestPermissionForAlias("speechRecognition", call, "speechRecognitionRequestPermsCallback");
    }

    @PermissionCallback
    private void speechRecognitionRequestPermsCallback(PluginCall call) {
        JSObject o = new JSObject();
        o.put("speechRecognition", permissionStateToString(getPermissionState("speechRecognition")));
        call.resolve(o);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        final String raw = call.getString("text", "");
        final String utterText = raw == null ? "" : raw;

        mainHandler.post(() -> attemptSpeak(call, utterText, 0));
    }

    private void attemptSpeak(PluginCall call, String utterText, int attempt) {
        if (!ttsReady || tts == null) {
            if (attempt == 0) {
                initTextToSpeech();
                mainHandler.postDelayed(() -> {
                    if (!ttsReady) {
                        call.reject("tts_not_ready", "TextToSpeech is still initializing");
                    } else {
                        attemptSpeak(call, utterText, attempt + 1);
                    }
                }, 600);
                return;
            }
            call.reject("tts_not_ready", "TextToSpeech is still initializing");
            return;
        }

        if (activeSpeakCall != null) {
            PluginCall prev = activeSpeakCall;
            activeSpeakCall = null;
            prev.resolve();
        }

        try { tts.stop(); } catch (Exception ignored) {}
        speakGeneration++;

        activeSpeakCall = call;

        String localeTag = normalizeSpeechLocale(call.getString("locale", "en-US"));
        if (!setTtsLanguageWithFallback(localeTag)) {
            activeSpeakCall = null;
            Log.e(TAG, "TTS language unavailable for any fallback: " + localeTag);
            call.reject(
                "tts_language_unavailable",
                "Install this language's text-to-speech voice in Android system settings");
            return;
        }

        Double rd = call.getDouble("rate", 1.0);
        float rate = clamp((float) (rd != null ? rd.doubleValue() : 1.0d), 0.5f, 2.0f);
        try { tts.setSpeechRate(rate); } catch (Exception ignored) {}

        Double pd = call.getDouble("pitch", 1.0);
        float pitch = clamp((float) (pd != null ? pd.doubleValue() : 1.0d), 0.5f, 2.0f);
        try { tts.setPitch(pitch); } catch (Exception ignored) {}

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            String utteranceId = UUID.randomUUID().toString();
            currentUtteranceId = utteranceId;
            Bundle params = new Bundle();
            int result;
            try {
                result = tts.speak(utterText, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
            } catch (Exception e) {
                Log.e(TAG, "tts.speak threw", e);
                result = TextToSpeech.ERROR;
            }
            if (result == TextToSpeech.ERROR) {
                currentUtteranceId = null;
                activeSpeakCall = null;
                if (attempt == 0) {
                    Log.w(TAG, "tts.speak ERROR; reinitializing engine and retrying once");
                    try { tts.shutdown(); } catch (Exception ignored) {}
                    tts = null;
                    ttsReady = false;
                    initTextToSpeech();
                    mainHandler.postDelayed(() -> attemptSpeak(call, utterText, attempt + 1), 700);
                } else {
                    call.reject("tts_speak_failed");
                }
            }
        } else {
            @SuppressWarnings("deprecation")
            int result = tts.speak(utterText, TextToSpeech.QUEUE_FLUSH, null);
            currentUtteranceId = null;
            if (result == TextToSpeech.ERROR) {
                activeSpeakCall = null;
                call.reject("tts_speak_failed");
            } else {
                speaking = true;
                final long gen = speakGeneration;
                final long delayMs =
                    Math.min(120_000, Math.max(500, (long) utterText.length() * 80L));
                mainHandler.postDelayed(() -> {
                    if (gen != speakGeneration) return;
                    finishSpeakCall(true, null, null);
                }, delayMs);
            }
        }
    }

    /** Try the requested locale, then language-only, then device default, then US. */
    private boolean setTtsLanguageWithFallback(String localeTag) {
        if (tts == null) return false;
        List<Locale> tries = new ArrayList<>();
        tries.add(localeForTag(localeTag));
        String langOnly = localeTag != null && localeTag.contains("-")
            ? localeTag.substring(0, localeTag.indexOf('-'))
            : localeTag;
        if (langOnly != null && !langOnly.isEmpty()) tries.add(new Locale(langOnly));
        Locale def = Locale.getDefault();
        if (def != null) tries.add(def);
        tries.add(Locale.US);

        for (Locale loc : tries) {
            if (loc == null) continue;
            try {
                int r = tts.setLanguage(loc);
                if (r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED) {
                    return true;
                }
            } catch (Exception e) {
                Log.w(TAG, "setLanguage threw for " + loc, e);
            }
        }
        return false;
    }

    @PluginMethod
    public void cancelSpeech(PluginCall call) {
        mainHandler.post(() -> {
            speakGeneration++;
            currentUtteranceId = null;
            if (tts != null) {
                try { tts.stop(); } catch (Exception ignored) {}
            }
            speaking = false;
            if (activeSpeakCall != null) {
                PluginCall c = activeSpeakCall;
                activeSpeakCall = null;
                c.resolve();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("speechRecognition") != PermissionState.GRANTED) {
            requestPermissionForAlias("speechRecognition", call, "speechRecognitionPermsForListenCallback");
            return;
        }
        beginStartListening(call);
    }

    @PermissionCallback
    private void speechRecognitionPermsForListenCallback(PluginCall call) {
        if (getPermissionState("speechRecognition") == PermissionState.GRANTED) {
            beginStartListening(call);
        } else {
            notifySttError("speech_recognition_permission_denied");
            call.reject("permission_denied", "Microphone permission denied");
        }
    }

    private void beginStartListening(PluginCall call) {
        mainHandler.post(() -> {
            Context ctx = getSpeechRecognizerContext();
            if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
                notifySttError("stt_unavailable");
                call.reject("stt_unavailable", "Speech recognition not available on this device");
                return;
            }

            final String localeTag =
                normalizeSpeechLocale(call.getString("locale", "en-US"));
            Boolean partialObj = call.getBoolean("partialResults", true);
            final boolean partial = partialObj == null || partialObj;
            Integer silence = call.getInt("silenceTimeoutMs");
            final int silenceMs = silence != null && silence > 0 ? silence : 2200;

            boolean preferOnDevice =
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    && SpeechRecognizer.isOnDeviceRecognitionAvailable(ctx);
            if (preferOnDevice) {
                Log.i(TAG, "STT: using on-device recognition hint (offline-capable pack present)");
            }

            startSttSession(call, ctx, localeTag, partial, silenceMs, preferOnDevice, /*omitLanguage*/ false, /*attempt*/ 0);
        });
    }

    private void startSttSession(
        final PluginCall call,
        final Context ctx,
        final String localeTag,
        final boolean partial,
        final int silenceMs,
        final boolean preferOffline,
        final boolean omitLanguage,
        final int attempt) {
        final int sessionId = ++sttSessionGeneration;
        destroySpeechRecognizer();
        cancelSttWatchdog();

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(ctx);
        } catch (Exception e) {
            Log.e(TAG, "createSpeechRecognizer failed", e);
            notifySttError("stt_unavailable");
            if (!callResolved(call, attempt)) call.reject("stt_unavailable");
            return;
        }
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                if (sessionId != sttSessionGeneration) return;
                listening = true;
            }

            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                if (sessionId != sttSessionGeneration) return;
                listening = false;
                cancelSttWatchdog();
                Log.e(TAG, "SpeechRecognizer onError code=" + error
                    + " preferOffline=" + preferOffline
                    + " omitLanguage=" + omitLanguage
                    + " attempt=" + attempt);

                // Treat "no input" classes as benign empty finals so the UI can recover.
                if (error == SpeechRecognizer.ERROR_NO_MATCH
                    || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    JSObject fin = new JSObject();
                    fin.put("text", "");
                    notifyListeners("sttFinal", fin);
                    destroySpeechRecognizer();
                    return;
                }

                if (attempt + 1 < STT_MAX_ATTEMPTS && shouldRetrySttError(error)) {
                    boolean nextOffline = preferOffline && !shouldRelaxOfflineHint(error);
                    boolean nextOmitLanguage = omitLanguage
                        || error == SpeechRecognizer.ERROR_CLIENT
                        || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                            && (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED
                                || error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE));
                    // Force at least one differentiator from the previous attempt.
                    if (nextOffline == preferOffline && nextOmitLanguage == omitLanguage) {
                        if (preferOffline) {
                            nextOffline = false;
                        } else {
                            nextOmitLanguage = true;
                        }
                    }
                    final boolean retryOffline = nextOffline;
                    final boolean retryOmitLanguage = nextOmitLanguage;
                    destroySpeechRecognizer();
                    final int nextAttempt = attempt + 1;
                    long backoff = error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ? 350 : 150;
                    mainHandler.postDelayed(() -> startSttSession(
                        call, ctx, localeTag, partial, silenceMs,
                        retryOffline, retryOmitLanguage, nextAttempt), backoff);
                    return;
                }

                notifySttError(speechRecognizerErrorString(error));
                destroySpeechRecognizer();
            }

            @Override
            public void onResults(Bundle results) {
                if (sessionId != sttSessionGeneration) return;
                listening = false;
                cancelSttWatchdog();
                String text = bestTextFromResults(results);
                JSObject fin = new JSObject();
                fin.put("text", text);
                notifyListeners("sttFinal", fin);
                destroySpeechRecognizer();
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                if (sessionId != sttSessionGeneration) return;
                if (!partial) return;
                String text = bestTextFromResults(partialResults);
                if (!text.isEmpty()) {
                    JSObject p = new JSObject();
                    p.put("text", text);
                    notifyListeners("sttPartial", p);
                }
            }

            @Override public void onEvent(int eventType, Bundle params) {}
        });

        final Intent listenIntent = buildRecognizerIntent(localeTag, partial, silenceMs, preferOffline, omitLanguage);

        if (attempt == 0) {
            call.resolve();
        }

        armSttWatchdog(sessionId);

        mainHandler.postDelayed(() -> {
            if (sessionId != sttSessionGeneration || speechRecognizer == null) return;
            try {
                speechRecognizer.startListening(listenIntent);
            } catch (Exception e) {
                Log.e(TAG, "startListening failed", e);
                cancelSttWatchdog();
                if (attempt + 1 < STT_MAX_ATTEMPTS) {
                    destroySpeechRecognizer();
                    final int nextAttempt = attempt + 1;
                    mainHandler.postDelayed(() -> startSttSession(
                        call, ctx, localeTag, partial, silenceMs,
                        /*preferOffline*/ false, /*omitLanguage*/ true, nextAttempt), 200);
                    return;
                }
                notifySttError("stt_start_failed");
                destroySpeechRecognizer();
            }
        }, 80);
    }

    private boolean callResolved(PluginCall call, int attempt) {
        return attempt > 0 || call == null;
    }

    private void armSttWatchdog(final int sessionId) {
        cancelSttWatchdog();
        sttWatchdog = () -> {
            if (sessionId != sttSessionGeneration) return;
            Log.w(TAG, "STT watchdog fired (no result within " + STT_WATCHDOG_MS + "ms)");
            listening = false;
            try { if (speechRecognizer != null) speechRecognizer.cancel(); } catch (Exception ignored) {}
            notifySttError("stt_speech_timeout");
            destroySpeechRecognizer();
        };
        mainHandler.postDelayed(sttWatchdog, STT_WATCHDOG_MS);
    }

    private void cancelSttWatchdog() {
        if (sttWatchdog != null) {
            mainHandler.removeCallbacks(sttWatchdog);
            sttWatchdog = null;
        }
    }

    private Intent buildRecognizerIntent(
        String localeTag, boolean partial, int silenceMs, boolean preferOffline, boolean omitLanguage) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(
            RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, partial);
        if (!omitLanguage && localeTag != null && !localeTag.isEmpty()) {
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag.replace('_', '-'));
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, localeTag.replace('_', '-'));
        }
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        if (preferOffline && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        }
        try {
            intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
        } catch (Exception ignored) {
        }
        intent.putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, silenceMs);
        intent.putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, silenceMs);
        intent.putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 600);
        return intent;
    }

    /** Errors that always justify an automatic retry (with relaxed hints if possible). */
    private static boolean shouldRetrySttError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_CLIENT:
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_SERVER:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
            case SpeechRecognizer.ERROR_AUDIO:
                return true;
            default:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    return error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
                        || error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED
                        || error == SpeechRecognizer.ERROR_SERVER_DISCONNECTED;
                }
                return false;
        }
    }

    /** Errors where dropping the offline-only hint specifically helps. */
    private static boolean shouldRelaxOfflineHint(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
            case SpeechRecognizer.ERROR_SERVER:
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return false; // network/busy isn't fixed by switching modes
            default:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    return error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
                        || error == SpeechRecognizer.ERROR_SERVER_DISCONNECTED;
                }
                return true;
        }
    }

    /** Prefer the foreground {@link Activity} — avoids ERROR_CLIENT on some OEM builds. */
    private Context getSpeechRecognizerContext() {
        Activity a = getActivity();
        if (a != null) return a;
        return getContext();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        mainHandler.post(() -> {
            listening = false;
            cancelSttWatchdog();
            if (speechRecognizer != null) {
                try {
                    speechRecognizer.stopListening();
                } catch (Exception e) {
                    Log.w(TAG, "stopListening", e);
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void isListening(PluginCall call) {
        JSObject o = new JSObject();
        o.put("value", listening);
        call.resolve(o);
    }

    @PluginMethod
    public void isSpeaking(PluginCall call) {
        JSObject o = new JSObject();
        boolean v = speaking;
        if (tts != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try { v = v || tts.isSpeaking(); } catch (Exception ignored) {}
        }
        o.put("value", v);
        call.resolve(o);
    }

    private void destroySpeechRecognizer() {
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception e) {
                Log.w(TAG, "destroySpeechRecognizer", e);
            }
            speechRecognizer = null;
        }
        listening = false;
    }

    private void notifySttError(String code) {
        JSObject o = new JSObject();
        o.put("error", code);
        mainHandler.post(() -> notifyListeners("sttError", o));
    }

    private static String bestTextFromResults(Bundle results) {
        if (results == null) return "";
        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null || matches.isEmpty()) return "";
        return matches.get(0) != null ? matches.get(0) : "";
    }

    private static String speechRecognizerErrorString(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO:
                return "stt_error_audio";
            case SpeechRecognizer.ERROR_CLIENT:
                return "stt_error_client";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "speech_recognition_permission_denied";
            case SpeechRecognizer.ERROR_NETWORK:
                return "stt_error_network";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "stt_error_network_timeout";
            case SpeechRecognizer.ERROR_NO_MATCH:
                return "stt_no_match";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "stt_busy";
            case SpeechRecognizer.ERROR_SERVER:
                return "stt_error_server";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "stt_speech_timeout";
            default:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (error == SpeechRecognizer.ERROR_SERVER_DISCONNECTED) {
                        return "stt_server_disconnected";
                    }
                    if (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED) {
                        return "stt_language_not_supported";
                    }
                    if (error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE) {
                        return "stt_language_unavailable";
                    }
                }
                return "stt_error_" + error;
        }
    }

    private static String permissionStateToString(PermissionState s) {
        if (s == null) return "prompt";
        if (s == PermissionState.GRANTED) return "granted";
        if (s == PermissionState.DENIED) return "denied";
        return "prompt";
    }

    private static Locale localeForTag(String tag) {
        if (tag == null || tag.isEmpty()) return Locale.US;
        Locale out = Locale.forLanguageTag(tag.replace('_', '-'));
        if (out.getLanguage().isEmpty()) return Locale.US;
        return out;
    }

    /**
     * Bare ISO-639 codes (e.g. {@code en}) are not valid for {@link RecognizerIntent#EXTRA_LANGUAGE}
     * on many devices — expand to a full BCP-47 tag.
     */
    private static String normalizeSpeechLocale(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            raw = "en-US";
        }
        String t = raw.trim().replace('_', '-');
        int dash = t.indexOf('-');
        if (dash < 0 && t.length() == 2) {
            String lang = t.toLowerCase(Locale.ROOT);
            Locale device = Locale.getDefault();
            if (lang.equals(device.getLanguage())
                && device.getCountry() != null
                && !device.getCountry().isEmpty()) {
                return lang + "-" + device.getCountry().toUpperCase(Locale.ROOT);
            }
            switch (lang) {
                case "en": return "en-US";
                case "es": return "es-ES";
                case "fr": return "fr-FR";
                case "de": return "de-DE";
                case "hi": return "hi-IN";
                case "pt": return "pt-BR";
                case "ja": return "ja-JP";
                case "zh": return "zh-CN";
                case "ar": return "ar-SA";
                default: return lang + "-US";
            }
        }
        return t;
    }

    private static float clamp(float v, float min, float max) {
        return Math.max(min, Math.min(max, v));
    }
}
