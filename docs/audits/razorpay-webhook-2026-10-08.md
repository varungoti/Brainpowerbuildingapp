# Razorpay webhook boundary: blocked-release candidate

Date: 8 October 2026. Repository: `varungoti/Brainpowerbuildingapp`.

## Decision and scope

**This is a fail-closed code/contract candidate for independent review, not a deployable webhook fix.** It removes unsafe direct ledger inserts and requires an atomic database contract that does not yet exist in this patch. Deploying this candidate alone would return 503 for authentic settlement events. No migration, database query, ledger mutation, secret/configuration change, provider request, payment, deployment, merge, commit or push was performed.

The production Edge source, live database schema, merchant account, webhook subscriptions, signing-secret configuration and existing payment records have not been verified. No runtime safety or production remediation is claimed. The in-memory contract tests below are not evidence of database transaction safety or durability.

Canonical `main` was rechecked at `836da44bcb96faab395ce2bf15df7d312b4eea63`. The existing separate consent PR #1 remains open/draft at `8fde2bd7f151f10eb09c5e3c234ac286853e496f`, with the same base. Its changed files do not overlap this patch. No consent-owner files were changed.

### Actual patch paths

- `supabase/functions/razorpay-webhook/index.ts`: runtime wiring only
- `supabase/functions/razorpay-webhook/webhook.ts`: HMAC, classification, normalization, atomic persistence adapter, strict acknowledgement boundary
- `supabase/functions/razorpay-webhook/webhook.test.mjs`: package-free synthetic regression and contract-model tests
- `docs/audits/razorpay-webhook-2026-10-08.md`: this requirement/evidence/gate record

The shared CORS/admin-client modules, migration 00018, RLS, all configuration, dependency manifests and legacy hosting package are unchanged.

## Source and ownership evidence

The complete Git tree was returned without truncation. Relevant baseline contents were fetched at the pinned commit and independently checked against their Git blob hashes:

| Source | Git blob |
|---|---|
| `supabase/functions/razorpay-webhook/index.ts` | `50fb8dadddb60def09026b7f1711ca8f312192b1` |
| `supabase/migrations/00018_marketing_os.sql` | `cd44712bea697a7c20b9c0eab328d7541a21f8db` |
| `supabase/functions/_shared/supabase.ts` | `224d8d3e1f90c0e017b4ed26cc66ee4f3544c7ca` |
| `supabase/functions/_shared/cors.ts` | `a7db1cf4e4c4720458074d2c5830e2787036b057` |
| `supabase/functions/marketing-os/index.ts` | `f2abaeb977daa482048b1c3d578e40c9b3c99c14` |
| `nurospark_supabase_edge_hosting_package/supabase/functions/razorpay-webhook/index.ts` | `ea43ba2b3a127b99f392c7ec1024502bf17b1a9b` |

The last file is a separate, vulnerable legacy copy: it also accepts requests when the secret is missing and inserts every event as Paid. It is not modified because the active deployment source/owner is unknown. Deployment-source reconciliation must prevent an old package from restoring the vulnerable handler.

The root README/package scripts were read. No root AGENTS.md exists at the pin. The repository's available `.agents/skills` concern frontend/UI, Neon and Railway rather than this bounded handler. Existing Edge TypeScript configuration includes only `server/**/*`; it does not establish a typecheck for `razorpay-webhook`.

The seven previously referenced missing documents are still absent in the complete pinned tree: `docs/PRODUCT_ANALYTICS.md`, `docs/README.md`, `docs/ENVIRONMENT_AND_STAGING.md`, `docs/PWA_OFFLINE.md`, `docs/CONTENT_MEDIA_ORCHESTRATION.md`, `docs/THREAT_MODEL.md`, `docs/RELEASE_CHECKLIST.md`. Their unknown requirements remain open.

### Requirement inputs

- Project Master Registry, Library version 7, internally declares registry version 8: SHA-256 `ee5fb38f63d5d7dc8020c8d07c0f23004364042d3e0b0d983b2a02be72ff1691`
- NuroSpark consolidated master version 3: SHA-256 `a5f3a8cf0eddbf2cf271f8aacd841fbdd18783d53517e4d563e151a13d9d7c6f`
- Retained-source companion version 1: SHA-256 `0c5d3019fba39f8e8fb8f0d43e96810f07fbb65e4aa88f6854133d236abe3203`

## Reproduced baseline defects

The exact original handler was evaluated after TypeScript stripping with mocked Deno environment/server and mocked Supabase insert. Network entrypoints were blocked; only synthetic records were used.

1. Missing secret plus unsigned captured event returned HTTP 200 and performed one ledger insert
2. `payment.authorized` produced a Paid row worth INR 500, although authorization is not captured revenue
3. The same INR 500 payment delivered twice as `payment.captured` and once as `order.paid` produced three Paid rows, totalling INR 1,500
4. A processed INR 100 partial refund against an INR 500 payment was stored as a separate INR 500 Refunded row. The original Paid row remained INR 500; expected net was INR 400

Migration 00018 has no uniqueness for provider payment identities. Its revenue view sums only rows with status Paid. The Marketing OS overview separately selects only Paid rows and sums their amounts. Thus a new Refunded insert neither corrects the original payment nor fixes the overview. A generic upsert keyed only by payment ID would also fail to model multiple partial refunds and could regress a refunded state on a late capture.

## Candidate behavior

- Missing/blank webhook secret: HTTP 503, configuration unavailable; never skip authentication
- Signature absent, malformed, wrong or for altered bytes: HTTP 401; WebCrypto HMAC verification over the original byte buffer
- Authentic invalid JSON/UTF-8/envelope: HTTP 400; never disclose parser/database details
- Recognized non-settlement event: HTTP 200, explicitly ignored, no ledger call. This includes authorized/failed/pending payments and created/failed/speed-changed refunds. A `payment.authorized` event is never promoted to capture, even if a contradictory captured flag is present
- Authentic supported settlement: require merchant account ID, event identity, event timestamp, payment identity, positive integer minor-unit amount and documented INR currency. For `order.paid`, also require matching paid order/payment identity
- Processed refunds use their own refund ID and amount. When a payment entity is included, require matching payment ID, currency and a sufficient payment amount. Cumulative `amount_refunded` is never added as another refund
- Unsupported authentic events (including legacy `payment.refunded`), other currencies and unreconcilable fields: HTTP 503, reconciliation required, with no invented ledger row
- Settlement persistence uses exactly `ingest_razorpay_payment_event_v1({p_event})`; there is no insert/upsert fallback or preflight-read duplicate check
- A response is HTTP 200 processed/duplicate only when the returned receipt is version 1, committed, has the matching provider/account/event/body hash/event type/payment/order/refund/currency identity and exact individual event amount, and carries a self-consistent captured/refunded projection. Nullable order identity must be echoed explicitly. Pending, unknown, malformed and mismatched receipts return 503
- A missing RPC, database failure or uncertain acknowledgement returns sanitized HTTP 503. Payloads and raw database errors are not returned or logged by the candidate

The public 200 response contains only the terminal outcome and event ID, not the payment payload. Normalized plan notes remain descriptive labels; they must not authorize a product, price, customer binding or entitlement. No entitlement is issued by this handler.

**503 is not durable quarantine.** No inbox exists merely because this code returns unavailable. Razorpay documents a finite retry window (24 hours), subsequent webhook disabling, and retries after timeouts. Before any rollout, establish a durable and audited reconciliation procedure, owner and alerting. Missing the retry window can lose automatic delivery; do not deploy this candidate as a temporary long-lived queue.

## Exact proposed atomic database contract (proposal only)

No migration filename, SQL migration or deployed RPC is included. Create a future migration through the supported Supabase CLI only after source/owner/data reconciliation and approval. The proposed RPC must return one JSON object, not a list. It must validate its input independently; TypeScript validation is not a database security boundary.

### Required durable identities and constraints

All identities are scoped by provider and merchant account. Never use the unsigned event-ID header as the sole financial idempotency key.

1. **Event receipts**: unique `(provider, account_id, event_id)`; stored raw-body SHA-256, event type, payment ID, nullable refund ID, normalized input, occurrence time, receipt time and processing state. Exact replay is allowed. The same event key with a different body hash is a conflict requiring reconciliation, never a successful duplicate
2. **Captures**: unique `(provider, account_id, payment_id)`; immutable captured amount in integer minor units, currency and available order identity; descriptive plan fields and provider occurrence time. `payment.captured` and `order.paid` are aliases of this one capture. Changed event IDs, repeated delivery, concurrent calls and alias order must never add another capture
3. **Refunds**: unique `(provider, account_id, refund_id)`; immutable payment ID, individual refund amount in integer minor units and currency. A repeated refund cannot increment the total twice. The same refund ID with conflicting fields is a reconciliation conflict. Distinct partial-refund IDs accumulate once each
4. **Payment projection**: one identity matching Captures; `captured_amount_minor`, `refunded_amount_minor`, net minor units and state. Net = captured minus sum of individually committed refunds. Enforce integer/nonnegative balances and refunded <= captured. State is `captured`, `partially_refunded` or `refunded` exactly according to that balance. A late capture/alias cannot reset refunds
5. **Account/currency binding**: independently verify permitted merchant account/currency and the expected environment. A cryptographically authentic provider event is not a blanket permission to map an arbitrary note to an entitlement

Use durable PostgreSQL UNIQUE constraints and a single transaction, with per-payment row locking (or equivalent proven serialization). No application-process mutex, read-before-write race or separately committed receipt-then-insert sequence qualifies. Atomically create/select the identity row before locking it; `SELECT FOR UPDATE` of a missing row alone does not serialize first delivery. Acquire locks in a documented consistent order and prove contention/deadlock retry behavior.

### Transaction and retry rules

1. Validate all fields and identity/state relationships again in the RPC
2. Claim/check event identity and digest within the transaction; preserve conflicts without falsely marking them complete
3. Serialize on the payment business identity and claim/check capture or refund uniqueness
4. For duplicate identities, compare immutable business fields before deciding there is no new financial effect. A changed header or changed body hash must not bypass capture/refund uniqueness
5. Recompute/refold the authoritative balance. Reject/quarantine conflicting totals without corrupting the accepted projection. Never use a cumulative refund snapshot as an incremental amount
6. Commit the normalized event receipt, financial transition, CRM projection and terminal status atomically. If database mutation fails, no terminal acknowledgement may survive
7. If a valid refund arrives before its capture, persist it in a durable pending state without fabricating a capture from refund data. Return a nonterminal receipt. A later capture must reconcile pending refunds within the same serialized path. An internal pending reconciler plus an explicit retry/audit policy is necessary; webhook retries alone are insufficient
8. If a commit succeeds but HTTP acknowledgement is lost, the replay must return a matching terminal duplicate receipt without a second effect. Replays may report the current reconciled projection but must retain the matching original event identity/digest
9. Legacy `payment.refunded` aggregate snapshots need an independently specified reconciliation path before support. Do not combine cumulative amounts with individual refunds using addition or an unproved `max(sum, snapshot)` shortcut

The version-1 terminal receipt must exactly echo `provider`, `account_id`, `event_id`, `body_sha256`, `event_type`, `payment_id`, `order_id` (including explicit null), `refund_id`, `amount_minor` (the individual event amount, not a cumulative balance), and `currency`. It must also include `contract_version: 1`, `processing_state: "committed"`, `outcome: "processed" | "duplicate"`, `captured_amount_minor`, `refunded_amount_minor`, and `ledger_state`. Pending/conflict/unavailable outcomes must not imitate a terminal receipt. The adapter verifies only this protocol; the database owns the truth of the commit.

### CRM projection, revenue and historical data gate

Do not add a UNIQUE index blindly to the existing ledger. First inventory duplicates, aliases, authorized-but-unsettled rows, refunds and conflicting data using authorized read-only access. Prepare a reviewed preservation/backfill/reconciliation report. Do not delete or rewrite actual financial history under this patch.

The future migration must explicitly decide how the canonical projection maps to `crm_payments`, `revenue_ledger_v` and the Marketing OS overview. A workable proposal is to preserve gross/refunded/net minor-unit fields and use one CRM row per provider/account/payment; its revenue-facing amount is net, it remains Paid while net > 0, and becomes Refunded when net is zero. Keep gross/capture/refund counts and timestamps separately so net revenue is not mislabeled as gross sales. This proposal needs product/accounting review and all-reader tests, including refunds of earlier-period sales. Do not silently treat a negative refund row as another Paid transaction.

Until the projection/readers and existing records are reconciled, no dashboard/revenue correctness gate is closed. Currency aggregation and the hard-coded approximate INR/USD conversion remain separate accounting limitations.

### Privileges and schema checks

Prefer a SECURITY INVOKER RPC with explicitly restricted execute privileges. Revoke PUBLIC/anon/authenticated execution; grant only the approved service role. Keep payment tables service-only and RLS enabled. Do not introduce SECURITY DEFINER as a convenience, expose receipts to public clients or expand existing grants. Actual ACL/RLS/advisor verification, PostgREST schema-cache visibility and independent unauthorized-role tests are required before deployment. None ran here.

## Requirement → code → tests → gate mapping

| Existing requirement/source IDs | Meaning for this slice | Candidate/evidence | Remaining acceptance |
|---|---|---|---|
| NS-D02, NS-D08, NS-R01–NS-R02 | Reconcile architecture/source and prove current state | Pinned blobs, separate hosting copy and PR-owner check; no deployment assertion | Active Edge source/hash, schema, account/environment/subscription and rollback receipts |
| NS-R23; NS-S19-P0067, NS-S19-P0074, NS-S19-P0082 | Server payment verification and webhook/reconciliation boundary | Raw HMAC, captured-state normalization, strict atomic receipt tests | Real atomic RPC, user/order/entitlement authority and native receipt validation remain open |
| NS-D03, NS-D06 | Server-bound secrets; minimize purpose-bound data | Fail-closed secret handling; no payload/error echo; normalized input omits payer/contact/card fields | Secret rotation/retry policy, logs/retention and actual access audit |
| NS-S05-P0008, NS-D05 | Hosting package webhook is a scaffold with independent release authorization | Legacy copy identified and untouched; candidate blocked on atomic contract | Canonical deployment path/owner, approved migration and rollout |
| NS-S30-P0063; NS-D04, NS-D10, NS-R15–NS-R16 | Revenue ledger claim needs real, correctly measured evidence | Baseline replay/partial-refund reproductions; capture/refund identities, minor units and receipt checks | Unique constraints, transaction concurrency, historical reconciliation, net/gross reporting and reader tests |
| NS-S25-P0009, NS-S28-P0006, NS-S28-P0024 | Live billing, refunds and reconciliation require operational/legal readiness | Explicit finite-retry warning and refund contract proposal | Refund policy, tax/business review, named operations owner and approved provider/device verification |
| NS-S31-P0022, NS-S31-P0023 | Document actual webhook mode, INR and test/live environment | INR-only normalization and non-settlement ignore behavior | Confirm provider account, key mode and subscribed event set; no live configuration read occurred |

The mapping covers this bounded webhook slice only. It does not mark whole master requirements complete or assert that all NuroSpark requirements were audited.

## Executed verification and limits

- Exact baseline: four deterministic vulnerability reproductions; pinned Git blob verified before execution
- Candidate v1: 84 package-free Node 24.19.0 tests passed, zero failed, with fetch/TCP/TLS connection entrypoints denied
- Coverage: absent secret; absent/malformed/incorrect signature; exact raw whitespace/Unicode body; malformed JSON/UTF-8; non-settlement events; unsupported authentic events; missing event identity; malformed capture/account/time/amount/currency; matching order alias; individual partial/full refunds; mismatched refund references; nonterminal/invalid/conflicting receipt; missing/throwing RPC; matching duplicate; OPTIONS/method boundaries
- Three explicitly labeled contract-model tests exercise alias/replay protocol, out-of-order partial-refund accumulation and event-ID collision handling. The model executes in memory and cannot establish PostgreSQL uniqueness/locking, races, durability, rollback, RLS or PostgREST behavior
- Independent review rejected the initial 76-test v0 receipt boundary: wrong/missing order IDs and a contradictory or missing individual refund amount could still be acknowledged. V0 is preserved as rejected evidence. V1 checks order identity and individual amount exactly, with eight new signed negative cases including missing fields and a refund amount that was improperly replaced by a larger cumulative total. Independent re-review is required before acceptance
- Source-only checks: no insert fallback, no configuration/migration/dependency/consent changes; patch application checked against pinned isolated baseline
- Not run: full build, dependency install, npm audit, complete repository tests, locked compiler typecheck, Deno execution, Supabase integration, actual database/provider/production calls, browser/mobile billing, deployment or secret rotation

Reproduce the tiny suite in a complete candidate tree (Node >=24, no installation):

```sh
timeout 20s node --test --test-reporter=tap supabase/functions/razorpay-webhook/webhook.test.mjs
```

The test file explicitly blocks network entrypoints. The test run does not import the production admin client's remote Supabase dependency.

## Release stopping conditions

Remain blocked until independent review is accepted; the exact atomic RPC/migration and CRM projection are implemented and separately approved; real disposable-DB tests prove concurrent duplicate/alias/refund ordering, rollback and role isolation; historical data is reconciled without unauthorized loss; actual active source/schema/account mapping is verified; Deno/locked typecheck plus the appropriate full suite pass; and the authorized owner approves production rollout with alerting/replay/rollback receipts. Resource-intensive work remains outside this bounded task.

## Public technical references checked

- [Razorpay validation and idempotency](https://razorpay.com/docs/webhooks/validate-test/): raw-body HMAC, unique event header, duplicate and out-of-order delivery
- [Razorpay payment events](https://razorpay.com/docs/webhooks/payments/): capture and paid-order events refer to captured payment; authorization is a different state
- [Razorpay refund events](https://razorpay.com/docs/webhooks/refunds/): processed refunds carry refund ID, parent payment ID and individual amount
- [Razorpay delivery practices](https://razorpay.com/docs/webhooks/best-practices/): finite retry/disabling and timeout behavior
- [Supabase upsert](https://supabase.com/docs/reference/javascript/upsert): upsert semantics do not replace the required multi-record atomic contract
- [Supabase changelog](https://supabase.com/changelog): current platform changes reviewed; no new Supabase feature or migration was installed. The lightweight `.md` endpoint failed, so the official HTML index was used
