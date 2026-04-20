import pg from "pg";

const { Pool } = pg;
const url = process.env.LEDGER_PG_URL;
const pool = url ? new Pool({ connectionString: url, max: 4 }) : null;

let inited = false;
async function init() {
  if (!pool || inited) return;
  await pool.query(`
    create table if not exists studio_cost_ledger (
      id           bigserial primary key,
      service      text not null,
      provider     text not null,
      job_id       text,
      cost_usd     numeric(10,5) not null,
      latency_ms   int,
      created_at   timestamptz not null default now()
    );
    create index if not exists studio_cost_ledger_service_month
      on studio_cost_ledger(service, date_trunc('month', created_at));
  `);
  inited = true;
}

export async function recordCost(opts: {
  service: string;
  provider: string;
  jobId?: string;
  costUSD: number;
  latencyMs?: number;
}) {
  if (!pool) return;
  await init();
  await pool.query(
    "insert into studio_cost_ledger (service, provider, job_id, cost_usd, latency_ms) values ($1,$2,$3,$4,$5)",
    [opts.service, opts.provider, opts.jobId ?? null, opts.costUSD, opts.latencyMs ?? null],
  );
}

export async function monthSpend(service: string): Promise<number> {
  if (!pool) return 0;
  await init();
  const r = await pool.query<{ sum: string | null }>(
    "select coalesce(sum(cost_usd),0)::text as sum from studio_cost_ledger where service=$1 and created_at >= date_trunc('month', now())",
    [service],
  );
  return Number(r.rows[0]?.sum ?? "0");
}
