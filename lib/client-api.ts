export const SITE_ORIGIN = "https://today-real-information-board.eunsu7997.chatgpt.site";
export const BOARD_URL = SITE_ORIGIN + "/api/board";
export async function parseBoardResponse(response:Response):Promise<any> {
 const text=await response.text();
 if(!response.headers.get("content-type")?.includes("application/json"))throw new Error("정보판의 데이터 주소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
 let data:any;try{data=JSON.parse(text)}catch{throw new Error("데이터 응답을 읽을 수 없습니다. 다시 시도해 주세요.")}
 if(!response.ok)throw new Error(typeof data?.error==="string"?data.error:"데이터 요청에 실패했습니다. 다시 시도해 주세요.");
 if(!data||!Array.isArray(data.daily_readings)||!("status" in data))throw new Error("데이터 응답 형식이 올바르지 않습니다. 기존 기록은 유지됩니다.");
 return data;
}
