// Keep response adaptation and local filtering separate from the mobile layout.
export const readRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ["items", "data", "rows"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  throw new Error("The report response format is not supported. Please try again.");
};

const text = (value) => typeof value === "string" || typeof value === "number" ? String(value) : "";
export const numberValue = (value) => value === "" || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
export const formatNumber = (value) => numberValue(value) == null ? "—" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 });
export const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const workDateKey = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : localDate(date);
};
export const displayDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const normalizeReports = (works, segments = []) => {
  const byId = new Map(segments.map((segment) => [String(segment.id), segment]));
  return works.map((work, index) => {
    const segment = work.segment || byId.get(String(work.segmentId)) || {};
    return {
      id: text(work.id || work.workId) || `report-${index}`,
      date: workDateKey(work.workDate),
      location: text(work.locationCode ?? segment.locationCode),
      label: text(work.label ?? segment.label),
      start: text(work.startNode ?? segment.startNode),
      end: text(work.endNode ?? work.stopNode ?? segment.endNode ?? segment.stopNode),
      material: text(work.material ?? segment.material),
      design: numberValue(work.diameterMm ?? segment.diameterMm),
      actual: numberValue(work.actualDiameterMm),
      from: numberValue(work.chainageFromM),
      to: numberValue(work.chainageToM),
      laid: numberValue(work.laidLengthM ?? work.lengthLaidM),
      type: text(work.workType),
      contractor: text(work.contractorName ?? work.contractor?.name ?? work.contractor),
      remark: text(work.remark),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
};

export const filterReports = (rows, { search = "", location = "All", label = "All", from = "", to = "" }) => {
  const query = search.trim().toLowerCase();
  return rows.filter((row) =>
    (!query || `${row.start} ${row.end} ${row.label}`.toLowerCase().includes(query)) &&
    (location === "All" || row.location === location) &&
    (label === "All" || row.label === label) &&
    (!from || row.date >= from) && (!to || (row.date && row.date <= to)),
  );
};
