const assert = require("node:assert/strict");
const vm = require("node:vm");
const babel = require("@babel/core");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
function loadModule(file, dependencies = {}) {
  const exports = {};
  const { code } = babel.transformFileSync(path.join(project, file), {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  }, Date, JSON });
  return exports;
}

async function verify() {
  const legal = loadModule("src/constants/legalDocuments.js");
  let stored = null;
  let failWrite = false;
  const storage = loadModule("src/services/consentStorage.js", {
    "../constants/legalDocuments": legal,
    "expo-secure-store": {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
      getItemAsync: async () => stored,
      setItemAsync: async (key, value) => { if (failWrite) throw new Error("Storage unavailable"); stored = value; },
    },
  });
  assert.equal(await storage.hasPrivacyConsent(), false);
  stored = "invalid-json";
  assert.equal(await storage.hasPrivacyConsent(), false);
  stored = JSON.stringify({ accepted: true, version: 1 });
  assert.equal(await storage.hasPrivacyConsent(), false);
  failWrite = true;
  await assert.rejects(storage.savePrivacyConsent());
  failWrite = false;
  // Direct acknowledgement saves successfully without a page-scroll/read event.
  await storage.savePrivacyConsent();
  assert.equal(await storage.hasPrivacyConsent(), true);
  const record = JSON.parse(stored);
  assert.equal(record.termsAccepted, true);
  assert.equal(record.privacyPolicyUrl, legal.LEGAL_DOCUMENTS.privacy.url);
  assert.equal("privacyReadAt" in record, false);
  assert.ok(!Number.isNaN(Date.parse(record.acceptedAt)));
  stored = JSON.stringify({ ...record, privacyPolicyUrl: "https://example.com" });
  assert.equal(await storage.hasPrivacyConsent(), false);
  stored = JSON.stringify({ ...record, accepted: false });
  assert.equal(await storage.hasPrivacyConsent(), false);
  stored = JSON.stringify({ ...record, termsAccepted: false });
  assert.equal(await storage.hasPrivacyConsent(), false);
  console.log("Consent verification passed: direct acknowledgement, version/URL validation and failed storage writes.");
}
verify().catch((error) => { console.error(error); process.exitCode = 1; });
