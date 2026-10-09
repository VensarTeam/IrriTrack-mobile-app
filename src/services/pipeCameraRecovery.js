import RNFS from "react-native-fs";

const RECOVERY_PATH = `${RNFS.DocumentDirectoryPath}/pipe-camera-recovery.json`;
const CAPTURE_PREFIX = `${RNFS.DocumentDirectoryPath}/pipe-camera-capture-`;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const readPipeCameraRecovery = async () => {
  try {
    if (!(await RNFS.exists(RECOVERY_PATH))) return null;
    const value = JSON.parse(await RNFS.readFile(RECOVERY_PATH, "utf8"));
    if (!value?.ownerUserId || !value?.photoCheckId ||
      (!value?.routeParams?.projectId && !value?.routeParams?.submissionDetail?.packageId)) return null;
    if (Date.now() - Number(value.createdAt || 0) > MAX_AGE_MS) return null;
    return value;
  } catch (error) {
    console.warn("[PipeCameraRecovery] Could not read saved draft", error?.message);
    return null;
  }
};

export const savePipeCameraRecovery = async (value) => {
  const recovery = { ...value, createdAt: value.createdAt || Date.now() };
  await RNFS.writeFile(RECOVERY_PATH, JSON.stringify(recovery), "utf8");
  return recovery;
};

export const savePipeCameraCapturedAsset = async (recovery, asset) => {
  if (!asset?.uri) return recovery;
  const sourcePath = String(asset.uri).replace(/^file:\/\//, "");
  const extension = sourcePath.match(/\.(jpe?g|png|heic)$/i)?.[1]?.toLowerCase() || "jpg";
  const capturePath = `${CAPTURE_PREFIX}${Date.now()}.${extension}`;
  let durableAsset = asset;
  try {
    await RNFS.copyFile(sourcePath, capturePath);
    durableAsset = { ...asset, uri: `file://${capturePath}` };
  } catch (error) {
    console.warn("[PipeCameraRecovery] Could not preserve raw capture", error?.message);
  }
  return savePipeCameraRecovery({ ...recovery, asset: durableAsset });
};

export const clearPipeCameraRecovery = async () => {
  const recovery = await readPipeCameraRecovery();
  const capturePath = String(recovery?.asset?.uri || "").replace(/^file:\/\//, "");
  if (capturePath.startsWith(CAPTURE_PREFIX) && await RNFS.exists(capturePath)) {
    await RNFS.unlink(capturePath).catch(() => {});
  }
  if (await RNFS.exists(RECOVERY_PATH)) await RNFS.unlink(RECOVERY_PATH);
};
