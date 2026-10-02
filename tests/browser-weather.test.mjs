import assert from 'node:assert/strict';
import {publicWeatherRequest,WEATHER_URL} from '../lib/client-api.ts';
import {SOURCE,normalizeBrowserWeather} from '../lib/core.ts';
assert.equal(WEATHER_URL,SOURCE);
const now='2026-10-01T23:58:00.000Z';
const raw={latitude:36.35,longitude:127.375,utc_offset_seconds:0,current_units:{temperature_2m:'°C'},current:{time:'2026-10-01T23:45',temperature_2m:12.9}};
const good=await publicWeatherRequest(async url=>{assert.equal(url,SOURCE);return Response.json(raw)});
const reading=normalizeBrowserWeather(good.raw,now);
assert.equal(reading.record_date,'2026-10-02');
assert.equal(reading.fetched_at,now);
assert.equal(reading.normalized_value,12.9);
for(const [status,code] of [[429,'rate_limit'],[401,'auth'],[403,'auth'],[503,'upstream']]){
 const result=await publicWeatherRequest(async()=>new Response('',{status,headers:{'Retry-After':'60'}}));
 assert.equal(result.error_code,code);assert.equal(result.retry_after,60);assert.equal(result.action,'live_browser');
}
assert.equal((await publicWeatherRequest(async()=>new Response('not-json'))).error_code,'schema_error');
assert.equal((await publicWeatherRequest(async()=>{throw new DOMException('timeout','TimeoutError')})).error_code,'timeout');
assert.deepEqual(await publicWeatherRequest(async()=>{throw new TypeError('CORS')}),{action:'live'});
for(const bad of [{...raw,latitude:0},{...raw,current:{time:'2026-09-30T00:00',temperature_2m:12.9}},{...raw,current:{time:'2026-10-02T01:00',temperature_2m:12.9}},{...raw,current_units:{temperature_2m:'F'}}])assert.throws(()=>normalizeBrowserWeather(bad,now),/schema_error/);
console.log('Browser weather checks passed: source, KST date, HTTP errors, timeout, CORS fallback, stale/future/location/unit rejection');
