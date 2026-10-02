import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { normalizeWeather } from '../lib/core.ts';

// T05: frozen before either AI begins. Do not delete, relax, or edit these ten checks.
const make = (value, now, sourceTime) => normalizeWeather({
  current: { temperature_2m: value, time: sourceTime },
  current_units: { temperature_2m: '°C' }, utc_offset_seconds: 0,
}, now);
const d1 = make(17.4, '2026-10-01T01:05:08Z', '2026-10-01T01:00');
const d2 = make(13.3, '2026-10-02T00:04:55Z', '2026-10-02T00:00');
const header = ['조회 날짜', '기온', '단위', '출처 이름', '출처 URL', '출처 시각 (UTC)', '조회 시각 (UTC)', '기록 시간대'];

// Independent parser: quoted commas, doubled quotes and embedded newlines are parsed.
function parse(csv) {
  const rows = []; let row = [], cell = '', quoted = false;
  const s = csv.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && c === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (c === '\r' || c === '\n')) {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  assert.equal(quoted, false, 'unclosed CSV quote');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

let exportTemperatureCsv;
try { ({ exportTemperatureCsv } = await import('../lib/temperature-csv.ts')); }
catch (e) { console.log('CSV module unavailable:', e.code ?? e.message); }
const csv = (rows, mode = 'live') => {
  assert.equal(typeof exportTemperatureCsv, 'function', 'CSV export not implemented');
  return exportTemperatureCsv(rows, mode);
};
const checks = [
  ['T05-F01', 'UTF-8 BOM, fixed eight-column header, empty input is header only', () => {
    const result = csv([]); assert.equal(typeof result, 'string');
    assert.ok(result.startsWith('\uFEFF')); assert.deepEqual(parse(result), [header]);
  }],
  ['T05-F02', 'Saved value/unit/date/source/UTC timestamps/timezone are preserved', () => {
    assert.deepEqual(parse(csv([d2])), [header, [d2.record_date, '13.3', '°C', d2.source_name,
      d2.source_url, d2.source_time, d2.fetched_at, 'Asia/Seoul']]);
    assert.equal(parse(csv([{ ...d2, normalized_value: -5.25 }]))[1][1], '-5.25');
  }],
  ['T05-F03', 'Records are ascending by date without changing the caller input', () => {
    const input = Object.freeze([Object.freeze({ ...d2 }), Object.freeze({ ...d1 })]);
    const before = JSON.stringify(input); const rows = parse(csv(input));
    assert.deepEqual(rows.slice(1).map(r => r[0]), ['2026-10-01', '2026-10-02']);
    assert.equal(JSON.stringify(input), before);
  }],
  ['T05-F04', 'Commas, quotes, CR/LF and Korean text survive CSV parsing', () => {
    const name = '공개, "기온"\r\n두 번째 줄';
    assert.equal(parse(csv([{ ...d2, source_name: name }]))[1][3], name);
  }],
  ['T05-F05', 'Spreadsheet formulas in text are neutralized; negative numbers stay numeric', () => {
    for (const name of ['=1+1', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '\t=1+1', '\r=1+1', ' =1+1']) {
      assert.equal(parse(csv([{ ...d2, source_name: name, normalized_value: -5.25 }]))[1][3], "'" + name);
      assert.equal(parse(csv([{ ...d2, source_name: name, normalized_value: -5.25 }]))[1][1], '-5.25');
    }
  }],
  ['T05-F06', 'Missing source timestamp exports a blank cell without inventing a timestamp', () => {
    const row = parse(csv([{ ...d2, source_time: null }]))[1];
    assert.equal(row[5], ''); assert.equal(row[6], d2.fetched_at); assert.equal(row.length, 8);
  }],
  ['T05-F07', 'Replay scope is rejected explicitly even with plausible weather data', () => {
    assert.throws(() => csv([d2], 'replay'), /실제|live/);
  }],
  ['T05-F08', 'Only the eight public fields export; no raw payload/session/credentials', () => {
    const result = csv([{ ...d2, raw: { token: 'PRIVATE_SENTINEL' }, session: 'PRIVATE_SESSION', secret: 'PRIVATE_SECRET' }]);
    assert.ok(!result.includes('PRIVATE_')); assert.equal(parse(result)[1].length, 8);
  }],
  ['T05-F09', 'Last stored records remain exportable after a failed refresh; no network request', () => {
    const state = { daily_readings: [d2, d1], status: { freshness: 'stale', error_code: 'timeout' } };
    const before = JSON.stringify(state); const oldFetch = globalThis.fetch;
    globalThis.fetch = () => { throw Error('Export must not fetch'); };
    try { assert.equal(parse(csv(state.daily_readings)).length, 3); }
    finally { globalThis.fetch = oldFetch; }
    assert.equal(JSON.stringify(state), before);
  }],
  ['T05-F10', 'Existing core, SQL storage, API response and browser weather regression suites pass', () => {
    for (const test of ['core', 'storage', 'client-api', 'browser-weather']) {
      const run = spawnSync(process.execPath, [`tests/${test}.test.mjs`], { encoding: 'utf8' });
      assert.equal(run.status, 0, `${test}: ${run.stdout}\n${run.stderr}`);
    }
  }],
];
const results = checks.map(([id, description, run]) => {
  try { run(); console.log(`${id} PASS ${description}`); return { id, description, result: 'PASS' }; }
  catch (e) { console.log(`${id} FAIL ${e.message}`); return { id, description, result: 'FAIL', detail: e.message }; }
});
const report = { at: new Date().toISOString(), total: 10, passed: results.filter(r => r.result === 'PASS').length, results };
if (process.argv[2]) { mkdirSync('evidence', { recursive: true }); writeFileSync(process.argv[2], JSON.stringify(report, null, 2)); }
console.log(`Fixed checks: ${report.passed}/10`);
process.exitCode = report.passed === 10 ? 0 : 1;
