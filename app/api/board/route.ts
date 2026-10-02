import { load, success, failure, reset } from "@/lib/storage";
import { SOURCE, normalizeWeather, normalizeBrowserWeather, outcome } from "@/lib/core";
import a from "@/data/t04/fixtures/normal-d1-a.json";import b from "@/data/t04/fixtures/normal-d1-b.json";import d2 from "@/data/t04/fixtures/normal-d2.json";import recover from "@/data/t04/fixtures/recover-d2.json";import timeout from "@/data/t04/fixtures/timeout.json";import auth from "@/data/t04/fixtures/auth-401.json";import rate from "@/data/t04/fixtures/rate-429.json";import offline from "@/data/t04/fixtures/offline.json";import schema from "@/data/t04/fixtures/schema-break.json";
const fixtures=[a,b,d2,recover,timeout,auth,rate,offline,schema];
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"86400"};
function json(value:any,status=200){return Response.json(value,{status,headers:{"Cache-Control":"no-store",...cors}})}
export async function OPTIONS(){return new Response(null,{status:204,headers:cors});}
function scopeFor(id:unknown){if(typeof id!=="string"||!/^[0-9a-f-]{36}$/.test(id))throw new Error("invalid_session");return "replay-"+id;}
export async function GET(request:Request){try{const id=new URL(request.url).searchParams.get("session");return json(await load(id?scopeFor(id):"live"))}catch{return json({error:"저장된 기록을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."},503)}}
export async function POST(request:Request){let body:any;try{body=await request.json()}catch{return json({error:"잘못된 요청입니다."},400)}
 try{
 if(body.action==="live_browser"){
  const now=new Date().toISOString();
  if(body.error_code){const code=["timeout","auth","rate_limit","offline","schema_error","upstream"].includes(body.error_code)?body.error_code:"schema_error";return json(await failure("live",code,now,typeof body.retry_after==="number"&&body.retry_after>0?body.retry_after:null));}
  let reading;try{if(JSON.stringify(body.raw).length>20000)throw new Error("schema_error");reading=normalizeBrowserWeather(body.raw,now)}catch{return json(await failure("live","schema_error",now,null));}
  return json(await success("live",reading,body.raw));
 }
 if(body.action==="live"){
  let raw:any;let reading:any;let retry:number|null=null;let error="none";
  try{const res=await fetch(SOURCE,{signal:AbortSignal.timeout(8000),headers:{Accept:"application/json"},cache:"no-store"});retry=Number(res.headers.get("Retry-After"))||null;if([401,403].includes(res.status))throw new Error("auth");if(res.status===429)throw new Error("rate_limit");if(!res.ok)throw new Error("upstream");raw=await res.json();reading=normalizeWeather(raw,new Date().toISOString());}catch(e:any){error=e?.name==="TimeoutError"||e?.name==="AbortError"?"timeout":["auth","rate_limit","schema_error","upstream"].includes(e.message)?e.message:"offline";}
  if(error!=="none")return json(await failure("live",error,new Date().toISOString(),retry));
  return json(await success("live",reading,raw));
 }
 const scope=scopeFor(body.session);
 if(body.action==="reset")return json(await reset(scope));
 if(body.action==="fixture") {const fixture=fixtures.find(f=>f.fixture_id===body.fixture_id);if(!fixture)return json({error:"알 수 없는 시험 항목입니다."},400);const result=outcome(fixture);return json(result.reading?await success(scope,result.reading,fixture):await failure(scope,result.error!,fixture.virtual_now,Number((fixture.transport.headers as any)["retry-after"])||null));}
 return json({error:"지원하지 않는 동작입니다."},400);
 }catch(e){console.error("Board storage operation failed",e);return json({error:"기록 저장에 실패했습니다. 기존 정상 기록은 유지됩니다. 다시 시도해 주세요."},503)}
}
