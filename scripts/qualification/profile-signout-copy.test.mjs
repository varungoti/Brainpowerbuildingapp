/**
 * Source-copy contract only: no React rendering, Vitest or typecheck claim.
 * Run: node --test scripts/qualification/profile-signout-copy.test.mjs
 * Optional PROFILE_SOURCE_FILE points to an exact historical file for a negative control.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const file = process.env.PROFILE_SOURCE_FILE
  ? resolve(process.env.PROFILE_SOURCE_FILE)
  : new URL('../../src/app/screens/ProfileScreen.tsx', import.meta.url);
const source = readFileSync(file, 'utf8');
const section = source.match(/\{\/\* Sign out \*\/\}([\s\S]*?)Yes, Sign Out<\/button>/)?.[1];
assert.ok(section, 'Expected the existing sign-out confirmation surface');
const normalized = section.replace(/\s+/g, ' ');
const heading = section.match(/<p\b[^>]*>([^<]*)<\/p>/)?.[1]?.trim();
assert.ok(heading, 'Expected the existing sign-out heading');

test('sign-out heading does not imply device-only scope for global auth sign-out', () => {
  assert.doesNotMatch(heading, /\b(?:device|browser|computer|local|only|just)\b/i);
  assert.equal(heading, 'Sign out?');
});
test('sign-out confirmation does not promise to delete all local data', () => {
  assert.doesNotMatch(normalized, /clear all local data/i);
});
test('sign-out confirmation explains local retention and the cloud deletion boundary', () => {
  assert.match(normalized, /Cloud sync will stop\./);
  assert.match(normalized, /Local child profiles and activity logs will be cleared\./);
  assert.match(normalized, /Some saved data, including reports, stays on this device\./);
  assert.match(normalized, /Earlier cloud uploads are not deleted\./);
});
test('the existing confirm and cancel actions remain connected', () => {
  assert.match(normalized, /onClick=\{logoutUser\}/);
  assert.match(normalized, /onClick=\{\(\) => setConfirmLogout\(false\)\}/);
});
