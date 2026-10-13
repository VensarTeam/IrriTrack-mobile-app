import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { isDocumentUrl, LEGAL_DOCUMENTS } from "../constants/legalDocuments";
import ConsentIcon from "./ConsentIcon";

const DocumentContent = ({ document, onClose, onOpenDocument }) => {
  const failed = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const markFailed = (message) => {
    failed.current = true;
    setLoading(false);
    setError(message);
  };

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => markFailed("This page is taking too long to load. Check your connection and try again."), 25000);
    return () => clearTimeout(timer);
  }, [loading, attempt]);

  const retry = () => {
    failed.current = false;
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  };

  const openRequestEmail = async () => {
    const notice = document.notice;
    if (!notice?.email) return;
    const url = `mailto:${notice.email}?subject=${encodeURIComponent(notice.emailSubject || "")}&body=${encodeURIComponent(notice.emailBody || "")}`;
    try {
      await Linking.openURL(url);
    } catch (emailError) {
      Alert.alert("Email app unavailable", `Please email ${notice.email} with your registered mobile number or account ID to request deletion.`);
    }
  };

  const handleNavigation = (request) => {
    if (request.url === "about:blank" || isDocumentUrl(request.url, document)) return true;
    const next = Object.values(LEGAL_DOCUMENTS).find((item) => isDocumentUrl(request.url, item));
    if (next) {
      onOpenDocument?.(next);
      return false;
    }
    if (/^(mailto:|tel:)/i.test(request.url)) {
      Linking.openURL(request.url).catch(() => Alert.alert("Unable to open", "Please check that an email or phone app is available."));
    }
    // Keep the supplied legal/support pages in-app and block unrelated sites.
    return false;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>IRRITRACK</Text>
          <Text style={styles.title}>{document.title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close document" onPress={onClose} style={styles.close}>
          <ConsentIcon name="close" />
        </Pressable>
      </View>
      {document.notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{document.notice.title}</Text>
          <Text style={styles.noticeText}>{document.notice.message}</Text>
          {document.notice.email ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Draft account deletion request to ${document.notice.email}`}
              onPress={openRequestEmail} style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}>
              <ConsentIcon name="support" size={18} />
              <Text style={styles.emailButtonText}>Email request · {document.notice.email}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.content}>
        <WebView
          key={attempt}
          source={{ uri: document.url }}
          style={styles.webView}
          incognito
          thirdPartyCookiesEnabled={false}
          sharedCookiesEnabled={false}
          mixedContentMode="never"
          allowFileAccess={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
          originWhitelist={["https://*", "mailto:*", "tel:*"]}
          onShouldStartLoadWithRequest={handleNavigation}
          onLoadStart={() => setLoading(true)}
          onLoad={(event) => {
            if (failed.current || !isDocumentUrl(event.nativeEvent.url, document)) return;
            setLoading(false);
          }}
          onError={() => markFailed("We couldn't load this page. Check your internet connection and try again.")}
          onHttpError={(event) => {
            if (isDocumentUrl(event.nativeEvent.url, document)) markFailed(`This page is unavailable (HTTP ${event.nativeEvent.statusCode}). Please try again.`);
          }}
          onContentProcessDidTerminate={() => markFailed("The page closed unexpectedly. Please reload it.")}
          onRenderProcessGone={() => markFailed("The page closed unexpectedly. Please reload it.")}
        />
        {loading || error ? (
          <View style={styles.overlay}>
            {error ? (
              <>
                <ConsentIcon name="file" size={34} />
                <Text style={styles.errorTitle}>Unable to open {document.title.toLowerCase()}</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
                  <ConsentIcon name="refresh" size={19} color={colors.white} />
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </>
            ) : (
              <><ActivityIndicator color={colors.primaryBlue} /><Text style={styles.errorMessage}>Loading {document.title.toLowerCase()}…</Text></>
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const LegalDocumentViewer = ({ document, onClose, ...props }) => (
  <Modal visible={Boolean(document)} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    {document ? <SafeAreaProvider><DocumentContent key={document.id} document={document} onClose={onClose} {...props} /></SafeAreaProvider> : null}
  </Modal>
);

export default LegalDocumentViewer;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { minHeight: 74, paddingVertical: 13, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", gap: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerCopy: { flex: 1 },
  brand: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 1.8, marginBottom: 5 },
  title: { color: colors.textDark, fontFamily: fonts.bold, fontSize: 19 },
  close: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceBluePale },
  content: { flex: 1 },
  notice: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 10, backgroundColor: colors.surfaceBluePale, gap: 8 },
  noticeTitle: { fontFamily: fonts.semiBold, color: colors.textDark, fontSize: 14, lineHeight: 20 },
  noticeText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  emailButton: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 8 },
  emailButtonText: { flex: 1, color: colors.primaryBlue, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.72 },
  webView: { flex: 1, backgroundColor: colors.white },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", padding: 30, gap: 16 },
  errorTitle: { fontFamily: fonts.bold, color: colors.textDark, fontSize: 19, textAlign: "center" },
  errorMessage: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  retry: { minHeight: 48, flexDirection: "row", gap: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: colors.primaryBlue, alignItems: "center", justifyContent: "center" },
  retryText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});
