import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

// Resolve only this checkout's existing, extensionless local TypeScript imports.
// No application modules, values, package dependencies or types are substituted.
const repo = new URL('../repo/', import.meta.url);
registerHooks({ resolve(specifier, context, nextResolve) {
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.') || !context.parentURL?.startsWith(repo.href)) throw error;
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (!candidate.href.startsWith(repo.href) || !existsSync(candidate)) throw error;
    return nextResolve(candidate.href, context);
  }
}});
const ownershipPath = new URL('src/lib/sync/cloudSyncOwnership.ts', repo);
const sessionPath = new URL('src/app/logic/sessionSync.ts', repo);
const backupPath = new URL('src/utils/neurosparkBackup.ts', repo);
const {initializeCloudSyncOwnership, withCloudSyncAccount, getCloudSyncSnapshotOwner} = await import(ownershipPath.href);
const {syncPersistedSessionUser, clearPersistedRemoteSession} = await import(sessionPath.href);
const {buildNeurosparkBackupFile, parseNeurosparkBackupFile} = await import(backupPath.href);
for (const url of [ownershipPath, sessionPath, backupPath]) {
 console.log('EXACT_SOURCE',fileURLToPath(url).slice(fileURLToPath(repo).length),createHash('sha256').update(readFileSync(url)).digest('hex'));
}
const empty = () => ({user:null,children:[],activeChildId:null,activityLogs:[],materialInventory:['paper'],credits:0,lastPackGeneratedOn:null,kycData:{},outcomeChecklists:{},milestoneChecks:{},adaptiveModel:null,reportHistory:[],siblingGroups:[],collaborationLogs:[],portfolioEntries:[],locale:'en',sensoryProfiles:{},communityRatingCache:null,routineConfig:null,quests:[],enhancedStreak:null,notificationPrefs:null,usagePattern:null,caregivers:[],bondingScores:[],narrativeCache:{}});
const session = (id) => ({user:{id,email:`${id}@example.test`,user_metadata:{full_name:'Synthetic Parent'},created_at:'2026-10-31'}});
const known = (id) => syncPersistedSessionUser(empty(),session(id));

test('genuinely empty state binds once, then round-trips its matching provenance',()=>{
 const a=known('synthetic-a');
 assert.equal(getCloudSyncSnapshotOwner(a),'synthetic-a');
 assert.equal(getCloudSyncSnapshotOwner(initializeCloudSyncOwnership(JSON.parse(JSON.stringify(a)))),'synthetic-a');
});
test('unmarked derived collections are quarantined without deletion',()=>{
 for (const patch of [{narrativeCache:{week:'Synthetic A report'}},{reportHistory:[{generatedAt:'2026-01-01',weekStart:'2026-01-01',weekEnd:'2026-01-07'}]},{unknownFutureFamilyData:{marker:'synthetic-a'}},{credits:1}]) {
  const before={...empty(),...patch};const after=syncPersistedSessionUser(before,session('synthetic-b'));
  assert.equal(after.cloudSyncQuarantined,true);assert.equal(getCloudSyncSnapshotOwner(after),null);
  for(const key of Object.keys(patch)) assert.deepEqual(after[key],before[key]);
 }
});
test('legacy signed-in label is not ownership proof',()=>{
 const a=known('synthetic-a'); delete a.cloudSyncOwnerId; delete a.cloudSyncQuarantined;
 assert.equal(getCloudSyncSnapshotOwner(initializeCloudSyncOwnership(a)),null);
});
test('A logout/B login retains provenance and denies re-labeling',()=>{
 const a={...known('synthetic-a'),narrativeCache:{week:'Synthetic A'}};
 const b=syncPersistedSessionUser(clearPersistedRemoteSession(a),session('synthetic-b'));
 assert.equal(b.user.supabaseUid,'synthetic-b'); assert.equal(b.cloudSyncOwnerId,'synthetic-a');
 assert.equal(getCloudSyncSnapshotOwner(b),null); assert.deepEqual(b.narrativeCache,a.narrativeCache);
});
test('same owner returns after logout when no mixed-owner transition occurred',()=>{
 const a=known('synthetic-a');
 assert.equal(getCloudSyncSnapshotOwner(syncPersistedSessionUser(clearPersistedRemoteSession(a),session('synthetic-a'))),'synthetic-a');
});
test('quarantine is monotonic through account transitions, serialize/reload and metadata refresh',()=>{
 for(const sequence of [['synthetic-b','synthetic-a'],['synthetic-b','synthetic-c','synthetic-a'],[null,'synthetic-a']]) {
  let s=known('synthetic-a');
  for(const id of sequence) {
   s=withCloudSyncAccount(s,id);s={...s,user:id?{id,supabaseUid:id,email:`${id}@example.test`,name:'Synthetic',createdAt:'2026-10-31'}:null};
   s=initializeCloudSyncOwnership(JSON.parse(JSON.stringify(s)));
   assert.equal(s.cloudSyncOwnerId,'synthetic-a');assert.equal(s.cloudSyncQuarantined,true);assert.equal(getCloudSyncSnapshotOwner(s),null);
  }
 }
});
test('backup import always quarantines even a valid matching-owner backup',()=>{
 const a=known('synthetic-a');const parsed=parseNeurosparkBackupFile(buildNeurosparkBackupFile(a));
 assert.equal(parsed.ok,true);assert.equal(parsed.payload.cloudSyncOwnerId,'synthetic-a');assert.equal(parsed.payload.cloudSyncQuarantined,true);assert.equal(getCloudSyncSnapshotOwner(parsed.payload),null);
});
test('malformed owner and quarantine metadata cannot establish cloud eligibility',()=>{
 for(const owner of ['', ' ', 0, false, {}, []]) {
  const s={...known('synthetic-a'),cloudSyncOwnerId:owner};assert.equal(getCloudSyncSnapshotOwner(s),null);
 }
 for(const value of [null,0,1,'false',{},[]]) {
  const s={...known('synthetic-a'),cloudSyncQuarantined:value};assert.equal(getCloudSyncSnapshotOwner(s),null);
 }
});
test('an ownership marker alone cannot authorize a missing or mismatched signed-in user',()=>{
 assert.equal(getCloudSyncSnapshotOwner({...known('synthetic-a'),user:null}),null);
 assert.equal(getCloudSyncSnapshotOwner({...known('synthetic-a'),user:session('synthetic-b').user}),null);
});
test('local-only account is preserved and not silently assigned remote family ownership',()=>{
 const s={...empty(),user:{id:'local',email:'local@example.test',name:'Synthetic Local',createdAt:'2026-10-31'}};
 assert.equal(clearPersistedRemoteSession(s),s);
 const out=syncPersistedSessionUser(s,session('synthetic-b'));
 assert.deepEqual(out.user,s.user);assert.equal(getCloudSyncSnapshotOwner(out),null);
});
