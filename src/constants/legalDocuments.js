export const CONSENT_NOTICE_VERSION = 2;

export const LEGAL_DOCUMENTS = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    url: "https://irritrack.vensar.com/privacy-policy",
    contentId: "policy",
  },
  terms: {
    id: "terms",
    title: "Terms & Conditions",
    url: "https://irritrack.vensar.com/terms-and-conditions",
    contentId: "terms",
  },
  support: {
    id: "support",
    title: "Support",
    url: "https://www.vensar.com/contact.html",
  },
};

// Keep this separate from the general legal links shown on Login/onboarding.
export const ACCOUNT_DELETION_CONTACT = {
  id: "account-deletion",
  title: "Request account deletion",
  url: LEGAL_DOCUMENTS.support.url,
  notice: {
    title: "Account & personal data deletion",
    message: "Email our privacy team with your registered mobile number or account ID to request deletion. Opening this page does not submit a request or delete your account.",
    email: "it@vensar.com",
    emailSubject: "IrriTrack account deletion request",
    emailBody: "Hello Vensar Privacy Team,\n\nI would like to request deletion of my IrriTrack account and associated personal data.\n\nRegistered mobile number or account ID: \n\nPlease explain any records that must be retained and confirm once my request is processed.",
  },
};

export const isDocumentUrl = (url, document) =>
  String(url || "").split(/[?#]/)[0].replace(/\/$/, "") === document.url;
