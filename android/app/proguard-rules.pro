# NeuroSpark / Capacitor — rules for release builds when minifyEnabled is true.
# Today `minifyEnabled` is often false for Capacitor WebView apps; keep this file ready
# for Play Store hardening (R8 full mode).

# Preserve line numbers in crash reports (optional; uncomment for production debugging)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor core & plugins (bridge, Cordova compatibility)
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }

# Cordova legacy namespace used by some Capacitor plugins
-keep class org.apache.cordova.** { *; }

# Preserve JavaScript interface for WebView (if you add @JavascriptInterface later)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Gson / JSON (if any plugin uses reflection)
-keepattributes Signature
-keepattributes *Annotation*

# App entry
-keep class com.neurospark.app.MainActivity { *; }
