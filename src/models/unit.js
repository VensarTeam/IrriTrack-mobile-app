export const createUnit = (data) => ({
  id: data.id,
  unitNo: data.unitNo,
  zone: data.zone,
  distributor: data.distributor,
  village: data.village,
  villageId: data.villageId,
  chakName: data.chakName,
  latitude: data.latitude,
  longitude: data.longitude,
  inlet: data.inlet,
  inletPipeLaying: data.inletPipeLaying,
  outlet: data.outlet,
  outletPipeLaying: data.outletPipeLaying,
  mechanical: data.mechanical,
  pedestalEnclosureInstallation: data.pedestalEnclosureInstallation,
  mechanicalAccessoriesInstallation: data.mechanicalAccessoriesInstallation,
  controller: data.controller,
  automationInstallation: data.automationInstallation,
  flushing: data.flushing,
  pipeFlushing: data.pipeFlushing,
  dry: data.dry,
  dryCommissioning: data.dryCommissioning,
  wet: data.wet,
  wetCommissioning: data.wetCommissioning,
  locationUpdatedAt: data.locationUpdatedAt,
  mechanicalRectification: data.mechanicalRectification,
  controllerRectification: data.controllerRectification,
  automationWorkRectification: data.automationWorkRectification,
  theftDamageReinstallation: data.theftDamageReinstallation,
  area: data.area,
  chakArea: data.chakArea,
  subChakQuantity: data.subChakQuantity,
  designedFlow: data.designedFlow,
  designedPressure: data.designedPressure,
  processSummary: data.processSummary,
  processes: data.processes,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const DEFAULT_PAGE_META = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const toSafeNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const formatAreaValue = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return `${numericValue} ha`;
};

export const createOmsUnit = (data = {}) =>
  createUnit({
    id: data.id,
    unitNo: data.nodeName || data.unitNo || "",
    zone: data.zoneName || data.zone || "",
    distributor: data.distributory || data.distributor || "",
    village: data.villageName || data.village || data.chakname || "",
    villageId: data.villageId || "",
    chakName: data.chakname || "",
    latitude: data.latitude,
    longitude: data.longitude,
    area: formatAreaValue(data.chakArea),
    chakArea: data.chakArea,
    subChakQuantity: data.subChakQty ?? data.subChakQuantity ?? "",
    designedFlow: data.designedFlow,
    designedPressure: data.designedPressure,
    processSummary: data.processSummary || {},
    processes: Array.isArray(data.processes) ? data.processes : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });

export const createUnitListMeta = (meta = {}) => {
  const mergedMeta = {
    ...DEFAULT_PAGE_META,
    ...(meta || {}),
  };

  const page = Math.max(1, toSafeNumber(mergedMeta.page, DEFAULT_PAGE_META.page));
  const limit = Math.max(
    1,
    toSafeNumber(mergedMeta.limit, DEFAULT_PAGE_META.limit)
  );
  const totalItems = Math.max(0, toSafeNumber(mergedMeta.totalItems, 0));
  const totalPages = Math.max(0, toSafeNumber(mergedMeta.totalPages, 0));

  return {
    ...mergedMeta,
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: Boolean(mergedMeta.hasNextPage),
    hasPreviousPage: Boolean(mergedMeta.hasPreviousPage),
  };
};

export const createOmsUnitListPage = (response = {}) => ({
  data: Array.isArray(response?.data)
    ? response.data.map((item) => createOmsUnit(item))
    : [],
  meta: createUnitListMeta(response?.meta),
});
