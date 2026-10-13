import * as SecureStore from "expo-secure-store";
import { CONSENT_NOTICE_VERSION, LEGAL_DOCUMENTS } from "../constants/legalDocuments";

// Change the version when a revised app privacy notice needs fresh consent.
const CONSENT_KEY = "irritrack.privacy-consent.v2";

export const hasPrivacyConsent = async () => {
  const storedValue = await SecureStore.getItemAsync(CONSENT_KEY);
  if (!storedValue) return false;

  try {
    const consent = JSON.parse(storedValue);
    return consent.accepted === true && consent.version === CONSENT_NOTICE_VERSION
      && consent.privacyPolicyUrl === LEGAL_DOCUMENTS.privacy.url
      && consent.termsUrl === LEGAL_DOCUMENTS.terms.url
      && consent.termsAccepted === true;
  } catch (error) {
    return false;
  }
};

export const savePrivacyConsent = async () => {
  await SecureStore.setItemAsync(
    CONSENT_KEY,
    JSON.stringify({
      accepted: true,
      version: CONSENT_NOTICE_VERSION,
      privacyPolicyUrl: LEGAL_DOCUMENTS.privacy.url,
      termsUrl: LEGAL_DOCUMENTS.terms.url,
      termsAccepted: true,
      acceptedAt: new Date().toISOString(),
    }),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
  );
};
