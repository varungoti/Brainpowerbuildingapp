import PgBoss from "pg-boss";

const url = process.env.PG_BOSS_URL ?? process.env.NEON_DATABASE_URL;

let _boss: PgBoss | null = null;
export async function getBoss(): Promise<PgBoss> {
  if (_boss) return _boss;
  if (!url) throw new Error("PG_BOSS_URL or NEON_DATABASE_URL not set");
  _boss = new PgBoss({ connectionString: url, retentionDays: 14 });
  await _boss.start();
  return _boss;
}

export const QUEUE_RENDER = "studio:render";
export const QUEUE_DRAFT = "studio:draft";
