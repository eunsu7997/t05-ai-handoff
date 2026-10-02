import type {Reading} from './core';

export type ExportMode='live'|'replay';
export type BoardSnapshot={daily_readings:Array<{reading:Reading;raw:unknown;first_fetched_at:string;last_fetched_at:string;record_id?:string}>;current_reading:Reading|null;status:unknown;last_comparison:unknown};
export function canExport(snapshot:BoardSnapshot|null|undefined):boolean {
 return !!snapshot && Array.isArray(snapshot.daily_readings);
}
export function createExport(snapshot:BoardSnapshot|null|undefined,mode:ExportMode,exportedAt:string){
 if(!canExport(snapshot))throw new Error('기록을 불러온 뒤 다운로드할 수 있습니다.');
 if(mode!=='live'&&mode!=='replay')throw new Error('잘못된 데이터 선택입니다.');
 if(!Number.isFinite(new Date(exportedAt).getTime()))throw new Error('잘못된 내보내기 시각입니다.');
 const value={schema_version:'1.0',dataset:mode,exported_at:exportedAt,record_timezone:'Asia/Seoul',
  daily_readings:snapshot!.daily_readings.map(row=>({
   // Storage IDs include replay session UUIDs; use a portable data ID instead.
   record_id:`${row.reading.signal_id}-${row.reading.record_date}`,
   first_fetched_at:row.first_fetched_at,last_fetched_at:row.last_fetched_at,
   normalized:row.reading,raw:row.raw,
  })),current_reading:snapshot!.current_reading,status:snapshot!.status,last_comparison:snapshot!.last_comparison};
 // Detach every nested value so exports cannot change in-memory board state.
 return JSON.parse(JSON.stringify(value));
}
export function exportFile(snapshot:BoardSnapshot|null|undefined,mode:ExportMode,exportedAt=new Date().toISOString()){
 return {filename:`information-board-${mode}-${exportedAt.slice(0,10)}.json`,mime:'application/json',text:JSON.stringify(createExport(snapshot,mode,exportedAt),null,2)+'\n'};
}
