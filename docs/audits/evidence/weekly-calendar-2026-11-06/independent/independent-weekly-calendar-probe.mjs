// Independent, synthetic, dependency-free review probe. Node 24+.
// SOURCE_ROOT: candidate checkout. SOURCE_REVISION: optional pinned git revision.
// EXTENDED=1 additionally checks the 2026 Lord Howe spring DST week.

import assert from 'node:assert/strict';
import { registerHooks, stripTypeScriptTypes, syncBuiltinESMExports } from 'node:module';
import { execFileSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
const denyNetwork=()=>{throw new Error('Network disabled during independent report review');};
net.connect=net.createConnection=tls.connect=denyNetwork;
net.Socket.prototype.connect=denyNetwork;
http.request=http.get=https.request=https.get=denyNetwork;
globalThis.fetch=denyNetwork;
syncBuiltinESMExports();
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
registerHooks({ resolve(specifier, context, nextResolve) {
 if (specifier.startsWith('.') && context.parentURL) {
  const u = new URL(specifier + '.ts', context.parentURL);
  if (existsSync(fileURLToPath(u))) return nextResolve(u.href, context);
 }
 return nextResolve(specifier, context);
}});
const root=resolve(process.env.SOURCE_ROOT ?? './nurospark-weekly-20261106');
if(process.env.SOURCE_REVISION){
 registerHooks({load(url,context,nextLoad){
  const prefix=pathToFileURL(root+'/').href;
  if(url.startsWith(prefix)&&url.endsWith('.ts')){
   const path=relative(root,fileURLToPath(url));
   const source=execFileSync('git',['-C',root,'show',process.env.SOURCE_REVISION+':'+path],{encoding:'utf8',env:{...process.env,GIT_NO_LAZY_FETCH:'1'}});
   return {format:'module',source:stripTypeScriptTypes(source),shortCircuit:true};
  }
  return nextLoad(url,context);
 }});
}
const {buildWeeklyReport}=await import(pathToFileURL(root+'/src/lib/reports/weeklyReportData.ts'));
const scheduler=await import(pathToFileURL(root+'/src/lib/reports/reportScheduler.ts'));
const child={id:'synthetic-review',name:'Synthetic Review',dob:'2018-06-01',brainPoints:0,level:1};
let count=0,failures=[];
function check(name,fn){count++;try{fn();}catch(e){failures.push({name,error:e.message});}}
const mk=(date,overrides={})=>({childId:child.id,date,completed:true,duration:5,engagementRating:3,intelligences:[],region:'Frontal',competencyTags:['ethical-judgment'],...overrides});
function key(d){return String(d.getFullYear()).padStart(4,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const tz=process.env.TZ;
for(const [y,m,d,startExpected,endExpected] of [[2026,3,2,'2026-03-30','2026-04-05'],[2026,2,8,'2026-03-02','2026-03-08'],[2026,10,1,'2026-10-26','2026-11-01'],[2026,11,31,'2026-12-28','2027-01-03'],[2024,1,29,'2024-02-26','2024-03-03'],...(process.env.EXTENDED==='1'?[[2026,9,4,'2026-09-28','2026-10-04']]:[])]){
 const ref=new Date(y,m,d,12),original=ref.getTime();
 const [sy,sm,sd]=startExpected.split('-').map(Number),start=new Date(sy,sm-1,sd),next=new Date(sy,sm-1,sd+7),end=new Date(next.getTime()-1);
 const stamp=dt=>dt.toISOString();
 const report=buildWeeklyReport(child,[mk(stamp(new Date(start.getTime()-1))),mk(stamp(start)),mk(stamp(end)),mk(stamp(next)),mk(stamp(ref),{completed:false}),mk(stamp(ref),{childId:'another-synthetic'})],ref);
 check('labels '+startExpected,()=>assert.deepEqual([report.weekStart,report.weekEnd],[startExpected,endExpected]));
 check('boundaries '+startExpected,()=>{assert.equal(report.totalActivities,2);assert.equal(report.totalMinutes,10);assert.equal(report.streakDays,2);assert.equal(report.competencyCoverage.find(x=>x.id==='ethical-judgment').weekActivities,2);});
 check('no reference mutation '+startExpected,()=>assert.equal(ref.getTime(),original));
 for(const h of [0,12,23]){const dayRef=new Date(y,m,d,h,59);check('scheduler '+startExpected+' hour'+h,()=>assert.deepEqual([scheduler.getWeekStartForDate(dayRef),scheduler.getWeekEndForDate(dayRef)],[startExpected,endExpected]));}
 const dateOnly=buildWeeklyReport(child,[mk(startExpected),mk(endExpected)],ref);
 check('date-only boundaries '+startExpected,()=>{assert.equal(dateOnly.totalActivities,2);assert.equal(dateOnly.streakDays,2);});
}
const ref=new Date(2026,3,2,12);
check('same local day across UTC keys',()=>assert.equal(buildWeeklyReport(child,[mk(new Date(2026,2,30,0,1).toISOString()),mk(new Date(2026,2,30,23,59).toISOString())],ref).streakDays,1));
check('two local days sharing UTC key',()=>assert.equal(buildWeeklyReport(child,[mk(new Date(2026,2,30,23,59).toISOString()),mk(new Date(2026,2,31,0,1).toISOString())],ref).streakDays,2));
check('seven logs on one day not daily',()=>assert.ok(!buildWeeklyReport(child,Array.from({length:7},()=>mk(new Date(2026,3,1,12).toISOString())),ref).highlights.includes('Completed an activity every day this week!')));
check('seven local days is daily',()=>{const r=buildWeeklyReport(child,Array.from({length:7},(_,i)=>mk(new Date(2026,2,30+i,23,30).toISOString())),ref);assert.equal(r.streakDays,7);assert.ok(r.highlights.includes('Completed an activity every day this week!'));});
check('invalid date-only excluded',()=>assert.equal(buildWeeklyReport(child,[mk('2026-02-30'),mk(''),mk('not-a-date')],new Date(2026,2,4,12)).totalActivities,0));
check('valid leap day supported',()=>assert.equal(buildWeeklyReport(child,[mk('2024-02-29')],new Date(2024,1,29,12)).totalActivities,1));
check('invalid nonleap day excluded',()=>assert.equal(buildWeeklyReport(child,[mk('2026-02-29')],new Date(2026,2,1,12)).totalActivities,0));
console.log(JSON.stringify({tz,count,passed:count-failures.length,failures}));
if(failures.length) process.exitCode=1;
