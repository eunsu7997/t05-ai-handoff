import assert from 'node:assert/strict';
import fs from 'node:fs';
import {comparison} from '../lib/core.ts';
import {createExport,exportFile,canExport} from '../lib/export-data.ts';
const cases=JSON.parse(fs.readFileSync(new URL('../data/t05/fixed-checks.json',import.meta.url)));
assert.equal(cases.length,10);assert.equal(new Set(cases.map(c=>c.id)).size,10);
const now='2026-10-02T00:00:00.000Z';
function row(date,value){const reading={signal_id:'daejeon-temperature-2m',normalized_value:value,unit:'°C',source_name:'test-only weather fixture',source_url:'https://api.open-meteo.com/v1/forecast?latitude=36.35&longitude=127.38&current=temperature_2m&timezone=UTC',source_time:date+'T00:00:00Z',fetched_at:date+'T00:05:00Z',record_timezone:'Asia/Seoul',record_date:date};return {reading,raw:{current:{temperature_2m:value,time:date+'T00:00'},current_units:{temperature_2m:'°C'}},record_id:'replay-11111111-1111-1111-1111-111111111111-'+date,first_fetched_at:reading.fetched_at,last_fetched_at:reading.fetched_at}}
const rows=[row('2026-10-02',13.3),row('2026-10-01',17.4)];
function state(daily=rows){return {daily_readings:daily,current_reading:daily[0]?.reading??null,status:{freshness:'fresh',error_code:'none',attempted_at:now,retry_after_seconds:null},last_comparison:comparison(daily.map(x=>x.reading)),session:'11111111-1111-1111-1111-111111111111',cookie:'test-cookie',token:'test-token'}}
const original=state();const results=[];
function check(id,fn){try{fn();results.push({id,data:'PASS'})}catch(e){results.push({id,data:'FAIL',error:e.message});}}
check('E01',()=>{assert.equal(canExport(null),false);assert.throws(()=>exportFile(null,'live',now));});
check('E02',()=>{assert.deepEqual(JSON.parse(exportFile(state([]),'live',now).text).daily_readings,[])});
check('E03',()=>{assert.deepEqual(createExport(original,'live',now).daily_readings.map(x=>[x.normalized.record_date,x.normalized.normalized_value,x.normalized.unit]),[['2026-10-02',13.3,'°C'],['2026-10-01',17.4,'°C']])});
check('E04',()=>{const out=createExport(original,'live',now);rows.forEach((r,i)=>{assert.deepEqual(out.daily_readings[i].normalized,r.reading);assert.deepEqual(out.daily_readings[i].raw,r.raw)})});
check('E05',()=>{assert.deepEqual(createExport(original,'live',now).last_comparison,{state:'comparable',signed:-4.1,magnitude:4.1,unit:'°C',dates:['2026-10-01','2026-10-02']})});
check('E06',()=>{const failed=state();failed.status={freshness:'stale',error_code:'rate_limit',attempted_at:now,retry_after_seconds:60};const out=createExport(failed,'live',now);assert.deepEqual(out.status,failed.status);assert.deepEqual(out.current_reading,failed.current_reading);assert.equal(out.daily_readings.length,2)});
check('E07',()=>{const one=state([row('2026-10-01',18)]);const out=createExport(one,'live',now);assert.equal(out.daily_readings.length,1);assert.equal(out.daily_readings[0].normalized.normalized_value,18)});
check('E08',()=>{const replay=state([row('2026-08-25',120)]);assert.equal(createExport(original,'live',now).daily_readings[0].normalized.normalized_value,13.3);const out=createExport(replay,'replay',now);assert.equal(out.dataset,'replay');assert.equal(out.daily_readings.length,1);assert.equal(out.daily_readings[0].normalized.normalized_value,120)});
check('E09',()=>{const file=exportFile(original,'live',now);assert.match(file.filename,/\.json$/);assert.equal(file.mime,'application/json');assert.doesNotThrow(()=>JSON.parse(file.text))});
check('E10',()=>{const before=JSON.stringify(original);const out=createExport(original,'live',now);out.daily_readings[0].raw.current.temperature_2m=999;assert.equal(JSON.stringify(original),before);const text=exportFile(original,'live',now).text;for(const sensitive of [original.session,original.cookie,original.token])assert.ok(!text.includes(sensitive))});
// These are DATA-LAYER results. UI/browser parts are still pending AI B;
// do not turn data PASS into a claim that all fixed end-to-end checks passed.
const report={phase:'AI A',execution_round:1,executed_at:new Date().toISOString(),data_checks:results,browser_checks:cases.filter(c=>['E01','E02','E08','E09'].includes(c.id)).map(c=>({id:c.id,result:'NOT_RUN',reason:'UI download connection belongs to AI B'})),full_fixed_suite:'INCOMPLETE',failed_execution_rounds:results.some(r=>r.data==='FAIL')?1:0};
if(process.argv.includes('--record'))fs.writeFileSync(new URL('../data/t05/a-check-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(results.some(r=>r.data==='FAIL'))process.exitCode=1;
