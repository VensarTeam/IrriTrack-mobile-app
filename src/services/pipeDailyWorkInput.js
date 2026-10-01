const numericInput = (value) => {
  const text = String(value ?? "").trim();
  return text ? Number(text) : NaN;
};

export const formatWorkDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Returns field errors without changing the engineer's draft.
export const validateDailyWork = (input) => {
  const errors = {};
  const from = numericInput(input.chainageFromM);
  const to = numericInput(input.chainageToM);
  const length = numericInput(input.lengthLaidM);
  if (!input.projectId) errors.projectId = "Open this form from a project.";
  if (!input.segmentId) errors.segmentId = "Select a pipe segment.";
  if (!input.contractorId) errors.contractorId = "Select a contractor.";
  if (!Number.isFinite(from)) errors.chainageFromM = "Enter a valid starting chainage.";
  if (!Number.isFinite(to) || to <= from) errors.chainageToM = "End chainage must be greater than start.";
  if (!Number.isFinite(length) || length <= 0 || length > to - from) {
    errors.lengthLaidM = "Length must be greater than zero and within the selected range.";
  }
  if (length > 0 && length < to - from && !String(input.remark ?? "").trim()) {
    errors.remark = "Explain the gap between selected range and laid length.";
  }
  if (String(input.actualDiameterMm ?? "").trim()) {
    const diameter = numericInput(input.actualDiameterMm);
    if (!Number.isFinite(diameter) || diameter <= 0) {
      errors.actualDiameterMm = "Enter a positive diameter or leave it empty.";
    }
  }
  return errors;
};

// Coverage must be supplied for the selected segment and work process.
// Merge overlaps before subtracting, so adjacent records cannot create false gaps.
export const availableChainageRanges = (start, end, coveredIntervals) => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const intervals = coveredIntervals
    .filter(([from, to]) => Number.isFinite(from) && Number.isFinite(to) && to > from)
    .map(([from, to]) => [Math.max(start, from), Math.min(end, to)])
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0]);
  const available = [];
  let cursor = start;
  for (const [from, to] of intervals) {
    if (from > cursor) available.push([cursor, from]);
    cursor = Math.max(cursor, to);
  }
  if (cursor < end) available.push([cursor, end]);
  return available;
};
