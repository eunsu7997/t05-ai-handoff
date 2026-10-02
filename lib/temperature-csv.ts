import type { Reading } from './core';

const HEADER = [
  '조회 날짜', '기온', '단위', '출처 이름', '출처 URL',
  '출처 시각 (UTC)', '조회 시각 (UTC)', '기록 시간대',
];

function cell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** A checkpoint: pure CSV conversion only. Not connected to the public UI yet.
 * B must finish formula protection and live/replay validation before release.
 */
export function exportTemperatureCsv(readings: readonly Reading[], mode: string = 'live'): string {
  // The scope argument is part of the frozen contract; B will enforce it.
  void mode;
  const sorted = [...readings].sort((a, b) => a.record_date.localeCompare(b.record_date));
  const rows: (string | number | null)[][] = [HEADER, ...sorted.map(r => [
    r.record_date, r.normalized_value, r.unit, r.source_name, r.source_url,
    r.source_time, r.fetched_at, r.record_timezone,
  ])];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
