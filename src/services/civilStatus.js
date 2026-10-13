// Civil status is read-only. Keys are scoped to one project register.
export const civilKey = (record, checklistId) => JSON.stringify([
  record.structureType, Number(record.structureNumber), record.processId, record.stepId,
  ...(checklistId === undefined ? [] : [checklistId]),
]);
export const civilNumber = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
export const formatCivilNumber = (value) => civilNumber(value) === null ? "Not recorded" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
export const civilSummary = (items) => {
  const total = items.reduce((sum, item) => sum + (item.total ?? 1), 0);
  const sum = items.reduce((value, item) => value + (item.sum ?? item.percent ?? 0), 0);
  const completed = items.reduce((value, item) => value + (item.completed ?? Number(item.status === "completed")), 0);
  const started = items.reduce((value, item) => value + (item.started ?? Number(item.status === "in_progress")), 0);
  return { total, sum, completed, started, notStarted: total - completed - started, percent: total ? Math.round(sum / total) : 0 };
};
export function activityStatus(config, rollup, history) {
  const latest = history[0]?.result;
  const answer = typeof latest?.value === "string" ? latest.value.trim().toLowerCase().replace(/[_-]/g, " ") : "";
  const statusAnswer = config.inputType === "dropdown" && ["not started", "in progress", "done"].includes(answer);
  if (statusAnswer) {
    if (answer === "not started") return { status: "not_started", percent: 0 };
    const rl = civilNumber(latest?.rl);
    const target = civilNumber(config.rlSetPoint);
    const rlIncomplete = config.recordRl && target !== null && (rl === null || Math.abs(rl - target) > 0.0005);
    if (answer === "done" && !rlIncomplete) return { status: "completed", percent: 100 };
    return { status: "in_progress", percent: 50 };
  }
  if (!rollup) return { status: "not_started", percent: 0 };
  if (rollup.isComplete === true) return { status: "completed", percent: 100 };
  const target = civilNumber(config.targetValue);
  const quantity = civilNumber(rollup.completedQuantity) ?? 0;
  return { status: "in_progress", percent: target > 0 && config.measurementType !== "level" ? Math.max(0, Math.min(99, Math.round(quantity / target * 100))) : 50 };
}
export function buildCivilStatus(register) {
  const rollups = new Map((register.checklistProgress || []).map(item => [civilKey(item, item.checklistId), item]));
  const rows = new Map((register.rows || []).map(item => [civilKey(item), item]));
  const histories = new Map();
  const seen = new Set();
  for (const record of [...(register.history || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    const entry = record.snapshot?.entry;
    const submissionKey = `${civilKey(record)}:${entry?.submissionId || record.id}`;
    if (seen.has(submissionKey)) continue;
    seen.add(submissionKey);
    for (const result of entry?.checklistResults || []) {
      if (!result.checked) continue;
      const key = civilKey(record, result.checklistId);
      if (!histories.has(key)) histories.set(key, []);
      histories.get(key).push({ ...record, entry, result });
    }
  }
  const groups = (register.groups || []).map(group => {
    const structures = Array.from({ length: Math.min(1000, Math.max(0, Math.floor(Number(group.count) || 0))) }, (_, index) => {
      const number = index + 1;
      const processes = (group.processes || []).map(process => {
        const phases = (process.steps || []).map(phase => {
          const identity = { structureType: group.type, structureNumber: number, processId: process.id, stepId: phase.id };
          const activities = (phase.checklistItems || []).map(config => {
            const key = civilKey(identity, config.id);
            const history = histories.get(key) || [];
            const rollup = rollups.get(key);
            return { ...config, key, history, rollup, ...activityStatus(config, rollup, history) };
          });
          return { ...phase, activities, row: rows.get(civilKey(identity)), ...civilSummary(activities) };
        });
        return { ...process, phases, ...civilSummary(phases) };
      });
      return { id: `${group.type}:${number}`, name: `${({ intake: "IPS", delivery: "DC", boosting: "BPS" })[group.type] || group.label}-${number}`, processes, ...civilSummary(processes) };
    });
    return { ...group, structures, ...civilSummary(structures) };
  });
  return { groups, ...civilSummary(groups) };
}
