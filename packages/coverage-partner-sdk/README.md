# `@neurospark/coverage-partner-sdk`

> Tiny Node SDK that lets a third-party experience grant **NeuroSpark coverage credit** to a child's profile.

## Install

```bash
npm install @neurospark/coverage-partner-sdk
```

## Usage

```ts
import { CoverageClient } from "@neurospark/coverage-partner-sdk";

const client = new CoverageClient({
  baseUrl: "https://api.neurospark.app",
  partnerSlug: "roblox-edu",
  signingSecret: process.env.NEUROSPARK_SIGNING_SECRET!, // hex string from admin UI
});

await client.credit({
  anonToken: "abc123",                 // opaque token issued by parent device
  partnerEventId: "challenge-42",      // idempotent — replays return "duplicate"
  durationSeconds: 240,
  brainRegion: "Logical-Mathematical",
  competencyIds: ["executive-function", "creative-generation"],
  modality: "screen",
});
```

## Modality values

`voice | screen | tactile | audio-only | outdoor | mixed`

## Brain regions (15)

`Creative, Logical-Mathematical, Linguistic, Bodily-Kinesthetic, Emotional, Interpersonal, Intrapersonal, Spatial-Visual, Musical-Rhythmic, Naturalist, Digital-Technological, Pronunciation, Coordination, Existential` (plus the always-credited `General`).

## Caps & rate limits

Each partner has a daily-minutes-per-child cap and a global RPM limit. The default is 60 min/child and 600 req/min. Crossing the cap returns HTTP 429 with `{ error: "daily_cap_exceeded", usedSeconds, capSeconds }`.

## Security

- Per-partner HMAC-SHA256 over `<timestamp>.<rawBody>`.
- Timestamp must be within ±5 minutes of server time.
- Signature header: `x-neurospark-signature` (hex).
- Timestamp header: `x-neurospark-timestamp` (ms epoch).
- Replays of the same `partnerEventId` are deduped.

## License

MIT — fork it, embed it, ship it.
