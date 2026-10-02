export const SITE_ORIGIN = "https://today-real-information-board.eunsu7997.chatgpt.site";
export const BOARD_URL = SITE_ORIGIN + "/api/board";
export const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=36.35&longitude=127.38&current=temperature_2m&timezone=UTC";
// Fetch public data from the visitor's browser, so unrelated traffic sharing
// the deployment's outbound IP does not exhaust this visitor's source quota.
export async function publicWeatherRequest(fetcher:typeof fetch=fetch):Promise<any> {
 try {
  const response=await fetcher(WEATHER_URL,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)});
  const retry=Number(response.headers.get("Retry-After"))||null;
  if(!response.ok)return {action:"live_browser",error_code:response.status===429?"rate_limit":[401,403].includes(response.status)?"auth":"upstream",retry_after:retry};
  try{return {action:"live_browser",raw:await response.json()}}catch{return {action:"live_browser",error_code:"schema_error"}};
 }catch(e:any){
  if(e?.name==="TimeoutError"||e?.name==="AbortError")return {action:"live_browser",error_code:"timeout"};
  // CORS/network restrictions may prevent a browser request; retain the
  // original server transport as a single fallback, never a retry loop.
  return {action:"live"};
 }
}
export async function parseBoardResponse(response:Response):Promise<any> {
 const text=await response.text();
 if(!response.headers.get("content-type")?.includes("application/json"))throw new Error("정보판의 데이터 주소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
 let data:any;try{data=JSON.parse(text)}catch{throw new Error("데이터 응답을 읽을 수 없습니다. 다시 시도해 주세요.")}
 if(!response.ok)throw new Error(typeof data?.error==="string"?data.error:"데이터 요청에 실패했습니다. 다시 시도해 주세요.");
 if(!data||!Array.isArray(data.daily_readings)||!("status" in data))throw new Error("데이터 응답 형식이 올바르지 않습니다. 기존 기록은 유지됩니다.");
 return data;
}
