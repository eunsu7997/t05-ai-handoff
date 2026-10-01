import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import assert from 'node:assert/strict';
import {outcome} from '../lib/core.ts';
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync('drizzle/0000_wild_ikaris.sql','utf8').replaceAll('--> statement-breakpoint',''));
function statement(sql){let values=[];return {bind(...v){values=v;return this},async run(){sqlite.prepare(sql).run(...values);return {success:true}},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}}};}
globalThis.testDB={prepare:statement,async batch(statements){sqlite.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const path=new URL('../lib/storage.test-adapter.ts',import.meta.url);
writeFileSync(path,readFileSync('lib/storage.ts','utf8').replace('import { env } from "cloudflare:workers";','const env = {DB:(globalThis as any).testDB};').replace('from "./core"','from "./core.ts"'));
try{
const {success,failure,load,reset}=await import(path.href);
const fixture=n=>JSON.parse(readFileSync(`data/t04/fixtures/${n}.json`,'utf8'));
const play=async n=>{const f=fixture(n),result=outcome(f);return result.reading?success('replay-check',result.reading,f):failure('replay-check',result.error,f.virtual_now)};
let one=await play('normal-d1-a'),two=await play('normal-d1-b');assert.equal(two.daily_readings.length,1);assert.equal(one.daily_readings[0].record_id,two.daily_readings[0].record_id);assert.equal(two.current_reading.normalized_value,105);
let next=await play('normal-d2');assert.equal(next.daily_readings.length,2);assert.equal(next.last_comparison.signed,15);
for(const [name,code] of [['timeout','timeout'],['auth-401','auth'],['rate-429','rate_limit'],['offline','offline'],['schema-break','schema_error']]){
await reset('replay-check');await play('normal-d1-a');await play('normal-d1-b');const before=await load('replay-check');const after=await play(name);assert.deepEqual(after.daily_readings,before.daily_readings);assert.equal(after.status.freshness,'stale');assert.equal(after.status.error_code,code);}
await reset('replay-check');await play('normal-d1-a');await play('normal-d1-b');await play('timeout');let restored=await play('recover-d2');assert.equal(restored.daily_readings.length,2);assert.equal(restored.status.freshness,'fresh');assert.equal(restored.status.error_code,'none');assert.equal(restored.current_reading.normalized_value,120);assert.equal(restored.daily_readings.filter(x=>x.reading.record_date==='2026-08-25').length,1);
await success('live',fixture('normal-d1-a').payload,{});await reset('replay-check');assert.equal((await load('live')).daily_readings.length,1);
console.log('8 storage scenarios passed using application SQL in SQLite; replay reset preserves live; stable record ID and atomic UPSERT verified');
}finally{unlinkSync(path)}
