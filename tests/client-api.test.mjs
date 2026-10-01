import assert from 'node:assert/strict';
import {BOARD_URL,parseBoardResponse} from '../lib/client-api.ts';
assert.equal(new URL(BOARD_URL).origin,'https://today-real-information-board.eunsu7997.chatgpt.site');
await assert.rejects(()=>parseBoardResponse(new Response('<!DOCTYPE html><html></html>',{headers:{'content-type':'text/html'}})),/데이터 주소/);
await assert.rejects(()=>parseBoardResponse(Response.json({error:'저장 실패'},{status:503})),/저장 실패/);
assert.deepEqual(await parseBoardResponse(Response.json({daily_readings:[],status:null})),{daily_readings:[],status:null});
await assert.rejects(()=>parseBoardResponse(Response.json({wrong:true})),/형식/);
console.log('5 embedded-view API checks passed: absolute origin, HTML response, server failure, valid payload, invalid schema');
