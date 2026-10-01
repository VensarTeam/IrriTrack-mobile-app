const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const modulePromise = import(`data:text/javascript;base64,${fs.readFileSync(path.join(__dirname, "report-data.js")).toString("base64")}`);

test("accept supported list envelopes and reject malformed responses", async () => {
  const { readRows } = await modulePromise;
  for (const value of [[], { items: [] }, { data: [] }, { rows: [] }]) assert.deepEqual(readRows(value), []);
  assert.throws(() => readRows({ unexpected: true }));
});

test("join segment metadata, preserve zero and sort newest first", async () => {
  const { normalizeReports, formatNumber } = await modulePromise;
  const rows = normalizeReports([
    { id: "1", segmentId: "s", workDate: "2026-09-01", chainageFromM: 0, lengthLaidM: "24.31" },
    { id: "2", workDate: "2026-09-15", contractor: { name: "Contractor" } },
  ], [{ id: "s", locationCode: "M0001", label: "P1", startNode: "J1", stopNode: "J2", diameterMm: 1600 }]);
  assert.equal(rows[0].id, "2");
  assert.equal(rows[0].contractor, "Contractor");
  assert.equal(rows[1].from, 0);
  assert.equal(rows[1].laid, 24.31);
  assert.equal(rows[1].end, "J2");
  assert.equal(rows[1].design, 1600);
  assert.equal(formatNumber(null), "—");
  assert.equal(formatNumber(0), "0");
});

test("combine search, location, label and inclusive date filters", async () => {
  const { filterReports } = await modulePromise;
  const rows = [
    { start: "JN-411", end: "JN-394", label: "P1", location: "M0001", date: "2026-09-15" },
    { start: "JN-411", end: "JN-394", label: "P2", location: "M0002", date: "2026-09-16" },
  ];
  assert.equal(filterReports(rows, {}).length, 2);
  assert.equal(filterReports(rows, { search: " jn-394 ", location: "M0001", label: "P1", from: "2026-09-15", to: "2026-09-15" }).length, 1);
  assert.equal(filterReports(rows, { search: "missing" }).length, 0);
  assert.equal(filterReports(rows, { from: "2026-09-17" }).length, 0);
});

test("format local calendar dates without UTC conversion", async () => {
  const { localDate, displayDate } = await modulePromise;
  assert.equal(localDate(new Date(2026, 9, 1)), "2026-10-01");
  assert.equal(displayDate(""), "—");
});

test("map direct works response without a separate segment request", async () => {
  const { normalizeReports, workDateKey, localDate } = await modulePromise;
  const date = "2026-09-30T18:30:00.000Z";
  const [row] = normalizeReports([{ id: "work-1", workDate: date, locationCode: "M0028", label: "P-340", startNode: "JN-434", stopNode: "JN-447", diameterMm: 275.8, actualDiameterMm: 315, contractor: "NARAYAN TRADERS", chainageFromM: 0, chainageToM: 216, lengthLaidM: 216, remark: null }]);
  assert.equal(row.end, "JN-447");
  assert.equal(row.contractor, "NARAYAN TRADERS");
  assert.equal(row.design, 275.8);
  assert.equal(row.date, localDate(new Date(date)));
  assert.equal(workDateKey("2026-10-01"), "2026-10-01");
  assert.equal(workDateKey("invalid"), "");
});
