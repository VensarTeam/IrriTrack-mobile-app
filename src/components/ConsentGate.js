import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, Image, Platform, Pressable,
  ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import typography from "../constants/typography";
import { LEGAL_DOCUMENTS } from "../constants/legalDocuments";
import { hasPrivacyConsent, savePrivacyConsent } from "../services/consentStorage";
import ConsentIcon from "./ConsentIcon";
import LegalDocumentViewer from "./LegalDocumentViewer";

const features = [
  { icon: "monitor", title: "Track work" },
  { icon: "checklist", title: "Fill checklists" },
  { icon: "offline", title: "Work offline" },
];

const Brand = () => (
  <Image source={require("../assets/images/logo.png")} style={styles.brand}
    resizeMode="contain" accessibilityLabel="Vensar" />
);

const StepIndicator = ({ step }) => (
  <View style={styles.steps} accessible accessibilityLabel={`Step ${step} of 2`}>
    <View style={[styles.step, step === 1 && styles.activeStep]} />
    <View style={[styles.step, step === 2 && styles.activeStep]} />
  </View>
);

const PrimaryButton = ({ title, onPress, disabled = false, busy = false }) => (
  <Pressable
    accessibilityRole="button" accessibilityLabel={title}
    accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [
      styles.primaryButton, disabled && styles.primaryButtonDisabled,
      busy && styles.primaryButtonBusy, pressed && styles.pressed,
    ]}
  >
    {busy ? <ActivityIndicator color={colors.white} /> : (
      <><Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>{title}</Text>
        <ConsentIcon name="arrow" size={20} color={disabled ? colors.textSecondary : colors.white} /></>
    )}
  </Pressable>
);

const WelcomeImage = ({ compact }) => (
  <View style={[styles.artwork, compact && styles.artworkCompact]} accessible
    accessibilityLabel="Smart irrigation field with OMS units and solar-powered site monitoring">
    <Image
      source={require("../assets/images/welcome-irrigation.png")}
      style={styles.artworkImage}
      resizeMode="cover"
      accessible={false}
    />
    <View style={styles.artworkBadge}>
      <View style={styles.artworkBadgeIcon}>
        <ConsentIcon name="checklist" size={21} color={colors.primaryGreen} />
      </View>
      <View>
        <Text style={styles.artworkBadgeTitle}>Site progress</Text>
        <Text style={styles.artworkBadgeText}>Checklists & work updates</Text>
      </View>
    </View>
  </View>
);

const DocumentRow = ({ icon, title, description, onPress, last }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`}
    onPress={onPress} style={({ pressed }) => [styles.documentRow, pressed && styles.rowPressed]}>
    <View style={styles.documentIcon}><ConsentIcon name={icon} size={22} /></View>
    <View style={[styles.documentCopy, !last && styles.documentSeparator]}>
      <View style={styles.documentText}>
        <Text style={styles.documentTitle}>{title}</Text>
        <Text style={styles.documentDescription}>{description}</Text>
      </View>
      <ConsentIcon name="chevron" size={18} color={colors.tabInactive} />
    </View>
  </Pressable>
);

const ConsentGate = ({ children }) => {
  const [step, setStep] = useState("loading");
  const [checked, setChecked] = useState(false);
  const [document, setDocument] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { height } = useWindowDimensions();
  const compact = height < 740;

  const restoreConsent = useCallback(async () => {
    setStep("loading");
    setLoadError(false);
    try {
      setStep((await hasPrivacyConsent()) ? "accepted" : "welcome");
    } catch (error) {
      console.warn("Unable to read privacy consent", error);
      setLoadError(true);
    }
  }, []);

  useEffect(() => { restoreConsent(); }, [restoreConsent]);

  useEffect(() => {
    if (Platform.OS !== "android" || step !== "privacy") return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!saving) setStep("welcome");
      return true;
    });
    return () => subscription.remove();
  }, [saving, step]);

  const acceptConsent = async () => {
    if (!checked || saving) return;
    setSaving(true);
    try {
      await savePrivacyConsent();
      setStep("accepted");
    } catch (error) {
      console.warn("Unable to save privacy consent", error);
      Alert.alert("Couldn't save your choice", "Please try again to continue.");
    } finally {
      setSaving(false);
    }
  };

  if (step === "accepted") return children;

  if (step === "loading") {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Brand />
        {loadError ? (
          <View style={styles.loadingMessage}>
            <Text style={styles.loadingText}>We couldn't check your privacy choice on this device.</Text>
            <PrimaryButton title="Try again" onPress={restoreConsent} />
          </View>
        ) : <ActivityIndicator color={colors.primaryBlue} />}
      </SafeAreaView>
    );
  }

  if (step === "welcome") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Brand />
          <StepIndicator step={1} />
        </View>
        <ScrollView style={styles.fill} contentContainerStyle={styles.welcomeScroll}
          showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.contentWidth}>
            <WelcomeImage compact={compact} />
            <View style={[styles.welcomeCopy, compact && styles.welcomeCopyCompact]}>
              <Image source={require("../assets/images/logo_new.png")} style={styles.appLogo}
                resizeMode="contain" accessibilityLabel="IrriTrack" />
              <Text style={styles.welcomeTitle}>Smart irrigation.{"\n"}Better tomorrow.</Text>
              <Text style={styles.welcomeDescription}>
                Your projects, checklists and site updates.{"\n"}All in one place.
              </Text>
            </View>
            <View style={styles.features}>
              {features.map((feature, index) => (
                <React.Fragment key={feature.title}>
                  {index > 0 ? <View style={styles.featureDivider} /> : null}
                  <View style={styles.feature}>
                    <ConsentIcon name={feature.icon} size={22} color={colors.primaryGreen} />
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={styles.welcomeFooter}>
          <View style={styles.contentWidth}>
            <PrimaryButton title="Get started" onPress={() => setStep("privacy")} />
            <Text style={styles.footerHint}>Built for your work on site</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.privacyTopBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to welcome"
          disabled={saving} onPress={() => setStep("welcome")} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ConsentIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>Before you begin</Text>
        <StepIndicator step={2} />
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.privacyScroll, compact && styles.privacyScrollCompact]}
        showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.contentWidth}>
          <View style={styles.privacyHero}>
            <View style={styles.fill}>
              <Text style={styles.privacyTitle}>Your privacy.{"\n"}Your choice.</Text>
            </View>
            <View style={styles.privacyMark}>
              <ConsentIcon name="shield" size={40} color={colors.primaryGreen} />
            </View>
          </View>
          <Text style={styles.privacyDescription}>
            IrriTrack uses your account details, site photos, location and work records for project work. Face verification is used when you sign in.
          </Text>

          <View style={styles.documents}>
            <DocumentRow icon="shield" title="Privacy Policy"
              description="How we handle your information" onPress={() => setDocument(LEGAL_DOCUMENTS.privacy)} />
            <DocumentRow icon="file" title="Terms & Conditions"
              description="Using IrriTrack responsibly" onPress={() => setDocument(LEGAL_DOCUMENTS.terms)} />
            <DocumentRow icon="support" title="Contact support"
              description="We're here to help" last onPress={() => setDocument(LEGAL_DOCUMENTS.support)} />
          </View>

          <View style={styles.permissionsNote}>
            <ConsentIcon name="lock" size={18} color={colors.textSecondary} />
            <View style={styles.fill}>
              <Text style={styles.permissionsTitle}>Permissions stay in your control</Text>
              <Text style={styles.permissionsText}>Camera, photos and location access can be managed in your device settings.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.privacyFooter}>
        <View style={styles.contentWidth}>
          <Pressable accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled: saving }}
            accessibilityLabel="I have read the Privacy Policy and agree to the Terms and Conditions"
            disabled={saving} onPress={() => setChecked((value) => !value)}
            style={({ pressed }) => [
              styles.consentRow, checked && styles.consentRowChecked, pressed && styles.pressed,
            ]}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <ConsentIcon name="check" size={17} color={colors.white} />}
            </View>
            <Text style={styles.consentText}>I have read the Privacy Policy and agree to the Terms & Conditions.</Text>
          </Pressable>
          <PrimaryButton title="Agree & continue" onPress={acceptConsent} disabled={!checked} busy={saving} />
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => setStep("welcome")}
            style={({ pressed }) => [styles.notNowButton, pressed && styles.pressed]}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        </View>
      </View>
      <LegalDocumentViewer document={document} onClose={() => setDocument(null)} onOpenDocument={setDocument} />
    </SafeAreaView>
  );
};

export default ConsentGate;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.white },
  contentWidth: { width: "100%", maxWidth: 400, alignSelf: "center" },
  loadingScreen: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", gap: 24 },
  loadingMessage: { width: "100%", maxWidth: 400, paddingHorizontal: 24, gap: 16 },
  loadingText: { color: colors.textSecondary, fontSize: typography.onboardingBody, lineHeight: 22, textAlign: "center" },
  brand: { width: 100, height: 40 },
  topBar: { width: "100%", maxWidth: 448, alignSelf: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  steps: { flexDirection: "row", gap: 5, alignItems: "center", minHeight: 24 },
  step: { width: 17, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder },
  activeStep: { width: 25, backgroundColor: colors.primaryBlue },
  welcomeScroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 8 },
  artwork: { width: "100%", maxWidth: 360, height: 190, alignSelf: "center" },
  artworkCompact: { height: 150 },
  artworkImage: { width: "100%", height: "100%", borderRadius: 24, borderCurve: "continuous", backgroundColor: colors.surfaceBlueSoft },
  artworkBadge: { position: "absolute", top: 22, left: 8, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.white, borderRadius: 14, borderCurve: "continuous", boxShadow: "0 4px 16px rgba(18,59,99,0.08)" },
  artworkBadgeIcon: { width: 32, height: 32, borderRadius: 10, borderCurve: "continuous", backgroundColor: colors.surfaceMintSoft, alignItems: "center", justifyContent: "center" },
  artworkBadgeTitle: { fontFamily: fonts.semiBold, color: colors.textDark, fontSize: typography.caption, lineHeight: 17 },
  artworkBadgeText: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 17 },
  welcomeCopy: { alignItems: "center", paddingTop: 12 },
  welcomeCopyCompact: { paddingTop: 12 },
  appLogo: { width: 132, height: 44, marginBottom: 10 },
  welcomeTitle: { fontFamily: fonts.bold, color: colors.textDark, fontSize: typography.onboardingTitle, lineHeight: 38, letterSpacing: -0.5, textAlign: "center" },
  welcomeDescription: { color: colors.textSecondary, fontSize: typography.onboardingBody, lineHeight: 22, textAlign: "center", marginTop: 12 },
  features: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  feature: { flex: 1, alignItems: "center", gap: 9, paddingVertical: 4, paddingHorizontal: 4 },
  featureTitle: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: typography.caption, lineHeight: 18, textAlign: "center" },
  featureDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: colors.cardBorder },
  welcomeFooter: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  footerHint: { color: colors.textSecondary, fontSize: typography.caption, textAlign: "center", marginTop: 12 },
  primaryButton: { minHeight: 56, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.primaryBlue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  primaryButtonDisabled: { backgroundColor: colors.filterIconDisabledSurface },
  primaryButtonBusy: { backgroundColor: colors.primaryBlue },
  primaryButtonText: { fontFamily: fonts.semiBold, color: colors.white, fontSize: typography.body },
  primaryButtonTextDisabled: { color: colors.textSecondary },
  pressed: { opacity: 0.72 },
  rowPressed: { backgroundColor: colors.surfaceBlue },
  privacyTopBar: { width: "100%", maxWidth: 448, alignSelf: "center", minHeight: 56, paddingHorizontal: 24, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -12 },
  headerTitle: { flex: 1, color: colors.textDark, fontFamily: fonts.semiBold, fontSize: typography.onboardingBody },
  privacyScroll: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  privacyScrollCompact: { paddingTop: 16, paddingBottom: 16 },
  privacyHero: { flexDirection: "row", alignItems: "center", gap: 20 },
  privacyTitle: { fontFamily: fonts.bold, color: colors.textDark, fontSize: typography.onboardingTitle, lineHeight: 38, letterSpacing: -0.5 },
  privacyMark: { width: 76, height: 76, borderRadius: 24, borderCurve: "continuous", backgroundColor: colors.surfaceMintSoft, alignItems: "center", justifyContent: "center" },
  privacyDescription: { color: colors.textSecondary, fontSize: typography.onboardingBody, lineHeight: 22, marginTop: 20 },
  documents: { borderRadius: 20, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.filterPanelSurface, marginTop: 24 },
  documentRow: { flexDirection: "row", alignItems: "center", paddingLeft: 16, gap: 12 },
  documentIcon: { width: 34, height: 38, alignItems: "center", justifyContent: "center" },
  documentCopy: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingRight: 16, paddingVertical: 12 },
  documentSeparator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  documentText: { flex: 1 },
  documentTitle: { color: colors.textDark, fontFamily: fonts.semiBold, fontSize: typography.onboardingBody, lineHeight: 21 },
  documentDescription: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18, marginTop: 3 },
  permissionsNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 20, paddingHorizontal: 4 },
  permissionsTitle: { color: colors.textDark, fontFamily: fonts.medium, fontSize: typography.caption, lineHeight: 18 },
  permissionsText: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18, marginTop: 4 },
  privacyFooter: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: colors.white },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: 70, backgroundColor: colors.filterPanelSurface, borderWidth: 1, borderColor: colors.transparent, borderRadius: 16, borderCurve: "continuous", marginBottom: 12 },
  consentRowChecked: { backgroundColor: colors.surfaceBluePale, borderColor: colors.cardBorder },
  checkbox: { width: 23, height: 23, borderRadius: 6, borderCurve: "continuous", borderWidth: 1.5, borderColor: colors.tabInactive, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  checkboxChecked: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  consentText: { flex: 1, color: colors.textDark, fontSize: typography.caption, lineHeight: 19 },
  notNowButton: { alignSelf: "center", minHeight: 44, paddingHorizontal: 20, justifyContent: "center" },
  notNowText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: typography.onboardingBody },
});
