package com.neurospark.app.neurosparkvoice;

import android.Manifest;
import android.content.Intent;
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
import java.util.Locale;
import java.util.UUID;

/**
 * NeuroSparkVoice — Android TTS ({@link TextToSpeech}) and on-device-preferring STT
 * ({@link SpeechRecognizer}).
 */
@CapacitorPlugin(
    name = "NeuroSparkVoice",
    permissions = @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "speechRecognition"))
public class NeuroSparkVoicePlugin extends Plugin {
    private static final String TAG = "NeuroSparkVoice";

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private volatile boolean speaking = false;
    private PluginCall activeSpeakCall;
    private long speakGeneration = 0;
    private String currentUtteranceId;

    private SpeechRecognizer speechRecognizer;
    private volatile boolean listening = false;

    @Override
    public void load() {
        super.load();
        mainHandler.post(
            () ->
                tts =
                    new TextToSpeech(
                        getContext(),
                        status -> {
                            if (status == TextToSpeech.SUCCESS) {
                                ttsReady = true;
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                                    tts.setOnUtteranceProgressListener(
                                        new UtteranceProgressListener() {
                                            @Override
                                            public void onStart(String utteranceId) {
                                                speaking = true;
                                            }

                                            @Override
                                            public void onDone(String utteranceId) {
                                                finishSpeakCall(true, utteranceId);
                                            }

                                            @Override
                                            public void onError(String utteranceId) {
                                                finishSpeakCall(false, utteranceId);
                                            }
                                        });
                                }
                            } else {
                                Log.e(TAG, "TextToSpeech init failed status=" + status);
                            }
                        }));
    }

    @Override
    protected void handleOnDestroy() {
        mainHandler.post(
            () -> {
                destroySpeechRecognizer();
                if (tts != null) {
                    tts.stop();
                    tts.shutdown();
                    tts = null;
                }
            });
        ttsReady = false;
        super.handleOnDestroy();
    }

    private void finishSpeakCall(boolean success, String utteranceId) {
        mainHandler.post(
            () -> {
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
                    else c.reject("tts_error");
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

        mainHandler.post(
            () -> {
                if (!ttsReady || tts == null) {
                    call.reject("tts_not_ready", "TextToSpeech is still initializing");
                    return;
                }

                if (activeSpeakCall != null) {
                    PluginCall prev = activeSpeakCall;
                    activeSpeakCall = null;
                    prev.resolve();
                }

                tts.stop();
                speakGeneration++;

                activeSpeakCall = call;

                String localeTag = call.getString("locale", "en-US");
                Locale locale = localeForTag(localeTag);
                int langResult = tts.setLanguage(locale);
                if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.w(TAG, "Language not fully supported: " + localeTag + " result=" + langResult);
                }

                Double rd = call.getDouble("rate", 1.0);
                float rate = clamp((float) (rd != null ? rd.doubleValue() : 1.0d), 0.5f, 2.0f);
                tts.setSpeechRate(rate);

                Double pd = call.getDouble("pitch", 1.0);
                float pitch = clamp((float) (pd != null ? pd.doubleValue() : 1.0d), 0.5f, 2.0f);
                tts.setPitch(pitch);

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    String utteranceId = UUID.randomUUID().toString();
                    currentUtteranceId = utteranceId;
                    Bundle params = new Bundle();
                    int result = tts.speak(utterText, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                    if (result == TextToSpeech.ERROR) {
                        currentUtteranceId = null;
                        activeSpeakCall = null;
                        call.reject("tts_speak_failed");
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
                        mainHandler.postDelayed(
                            () -> {
                                if (gen != speakGeneration) return;
                                finishSpeakCall(true, null);
                            },
                            delayMs);
                    }
                }
            });
    }

    @PluginMethod
    public void cancelSpeech(PluginCall call) {
        mainHandler.post(
            () -> {
                speakGeneration++;
                currentUtteranceId = null;
                if (tts != null) {
                    tts.stop();
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
        mainHandler.post(
            () -> {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    notifySttError("stt_unavailable");
                    call.reject("stt_unavailable", "Speech recognition not available on this device");
                    return;
                }

                destroySpeechRecognizer();

                final String localeTag = call.getString("locale", "en-US");
                Boolean partialObj = call.getBoolean("partialResults", true);
                final boolean partial = partialObj == null || partialObj;
                Integer silence = call.getInt("silenceTimeoutMs");
                final int silenceMs = silence != null && silence > 0 ? silence : 2200;

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                speechRecognizer.setRecognitionListener(
                    new RecognitionListener() {
                        @Override
                        public void onReadyForSpeech(Bundle params) {
                            listening = true;
                        }

                        @Override
                        public void onBeginningOfSpeech() {}

                        @Override
                        public void onRmsChanged(float rmsdB) {}

                        @Override
                        public void onBufferReceived(byte[] buffer) {}

                        @Override
                        public void onEndOfSpeech() {}

                        @Override
                        public void onError(int error) {
                            listening = false;
                            if (error != SpeechRecognizer.ERROR_NO_MATCH) {
                                notifySttError(speechRecognizerErrorString(error));
                            }
                            JSObject fin = new JSObject();
                            fin.put("text", "");
                            notifyListeners("sttFinal", fin);
                            destroySpeechRecognizer();
                        }

                        @Override
                        public void onResults(Bundle results) {
                            listening = false;
                            String text = bestTextFromResults(results);
                            JSObject fin = new JSObject();
                            fin.put("text", text);
                            notifyListeners("sttFinal", fin);
                            destroySpeechRecognizer();
                        }

                        @Override
                        public void onPartialResults(Bundle partialResults) {
                            if (!partial) return;
                            String text = bestTextFromResults(partialResults);
                            if (!text.isEmpty()) {
                                JSObject p = new JSObject();
                                p.put("text", text);
                                notifyListeners("sttPartial", p);
                            }
                        }

                        @Override
                        public void onEvent(int eventType, Bundle params) {}
                    });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, partial);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag.replace('_', '-'));
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                }
                intent.putExtra(
                    RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, silenceMs);
                intent.putExtra(
                    RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS,
                    silenceMs);

                try {
                    speechRecognizer.startListening(intent);
                    call.resolve();
                } catch (Exception e) {
                    Log.e(TAG, "startListening failed", e);
                    notifySttError("stt_start_failed");
                    call.reject("stt_start_failed", e.getMessage());
                    destroySpeechRecognizer();
                }
            });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        mainHandler.post(
            () -> {
                listening = false;
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
        if (tts != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            v = v || tts.isSpeaking();
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
                return "stt_error_unknown";
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

    private static float clamp(float v, float min, float max) {
        return Math.max(min, Math.min(max, v));
    }
}
