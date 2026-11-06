import { registerHooks, syncBuiltinESMExports } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
const deny = () => { throw new Error('Network forbidden'); };
net.connect = net.createConnection = tls.connect = deny;
net.Socket.prototype.connect = deny;
http.request = http.get = https.request = https.get = deny;
globalThis.fetch = deny;
syncBuiltinESMExports();
registerHooks({resolve(specifier, context, nextResolve) {
  if(context.parentURL?.endsWith('/supabase/functions/server/printable_guide.ts')) {
    if(specifier === './ai_provider.ts') return {url: 'data:text/javascript,export async function chatJson(){return null;}export async function generateImage(){throw new Error("Forbidden");}', shortCircuit:true};
    if(specifier === './ai_schemas.ts') return {url:'data:text/javascript,export const printableGuideSchema={};',shortCircuit:true};
    throw new Error('Unexpected server dependency');
  }
  return nextResolve(specifier,context);
}});
const activity={id:'synthetic',name:'Synthetic',description:'Synthetic activity',parentTip:'Synthetic tip',duration:10,materials:['Paper'],intelligences:['Spatial'],instructions:['One','Two'],region:'Global',emoji:'S'};
const variants = [
 ['valid pair', ['First caution.', 'Last caution.']],
 ['valid-null-valid', ['First caution.', null, 'Last caution.']],
 ['valid-number-valid', ['First caution.', 123, 'Last caution.']],
 ['valid-object-valid', ['First caution.', {}, 'Last caution.']],
 ['all null', [null]],
 ['wrong collection string', 'First caution.'],
 ['wrong collection object', {0:'First caution.'}],
 ['explicit null', null],
 ['empty', []],
];
for (const [label,root] of [['baseline',process.argv[2]],['candidate',process.argv[3]]]) {
 for (const [side,path] of [['client','src/lib/printables/guideFallback.ts'],['server','supabase/functions/server/printable_guide.ts']]) {
  const {buildPrintableGuideFallback: build} = await import(pathToFileURL(resolve(root,path)).href);
  for (const [kind,contraindications] of variants) {
   try {console.log(JSON.stringify({label,side,kind,result:build({childName:'Synthetic',ageTier:3,activities:[{...activity,contraindications}]}).activities[0].safetyNote}));}
   catch (e) {console.log(JSON.stringify({label,side,kind,error:e.message}));}
  }
  for (const [kind,instructions] of [['empty',[]],['missing',undefined],['null',null]]) {
   try {console.log(JSON.stringify({label,side,instructions:kind,result:build({childName:'Synthetic',ageTier:3,activities:[{...activity,instructions}]}).activities[0].steps}));}
   catch (e) {console.log(JSON.stringify({label,side,instructions:kind,error:e.message}));}
  }
 }
}
