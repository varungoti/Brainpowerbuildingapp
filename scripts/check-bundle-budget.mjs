#!/usr/bin/env node
/**
 * Fails if built JS assets exceed conservative budgets (helps catch bundle regressions).
 * Run after `pnpm run build`: `node scripts/check-bundle-budget.mjs`
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");

/** Single chunk must not exceed this (bytes). Main app chunk is usually `index-*.js`. */
const MAX_SINGLE_CHUNK_BYTES = 650 * 1024;

/** Sum of all *.js in dist/assets (rough total shipped JS, excluding HTML/CSS). */
const MAX_TOTAL_JS_BYTES = 1.45 * 1024 * 1024;

function main() {
  let files;
  try {
    files = readdirSync(DIST_ASSETS).filter((f) => f.endsWith(".js"));
  } catch (e) {
    console.error("check-bundle-budget: dist/assets not found. Run `pnpm run build` first.");
    process.exit(1);
  }

  let total = 0;
  let worst = { name: "", size: 0 };

  for (const f of files) {
    const p = join(DIST_ASSETS, f);
    const size = statSync(p).size;
    total += size;
    if (size > worst.size) worst = { name: f, size };
    if (size > MAX_SINGLE_CHUNK_BYTES) {
      console.error(
        `check-bundle-budget: FAIL — ${f} is ${(size / 1024).toFixed(1)} KiB (max ${MAX_SINGLE_CHUNK_BYTES / 1024} KiB per chunk).`,
      );
      process.exit(1);
    }
  }

  if (total > MAX_TOTAL_JS_BYTES) {
    console.error(
      `check-bundle-budget: FAIL — total JS is ${(total / 1024).toFixed(1)} KiB (max ${MAX_TOTAL_JS_BYTES / 1024} KiB).`,
    );
    process.exit(1);
  }

  console.log(
    `check-bundle-budget: OK — ${files.length} JS chunks, largest ${worst.name} ${(worst.size / 1024).toFixed(1)} KiB, total ${(total / 1024).toFixed(1)} KiB.`,
  );
}

main();
