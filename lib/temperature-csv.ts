import type { Reading } from './core';

const HEADER = [
  '조회 날짜', '기온', '단위', '출처 이름', '출처 URL',
  '출처 시각 (UTC)', '조회 시각 (UTC)', '기록 시간대',
];

function cell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  if (typeof value === 'string' && /^(?:[\t\r]|\s*[=+\-@])/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Pure CSV conversion of stored live readings; replay data is rejected. */
export function exportTemperatureCsv(readings: readonly Reading[], mode: string = 'live'): string {
  if (mode !== 'live') throw new Error('실제(live) 저장 기록만 내보낼 수 있습니다.');
  const sorted = [...readings].sort((a, b) => a.record_date.localeCompare(b.record_date));
  const rows: (string | number | null)[][] = [HEADER, ...sorted.map(r => [
    r.record_date, r.normalized_value, r.unit, r.source_name, r.source_url,
    r.source_time, r.fetched_at, r.record_timezone,
  ])];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
