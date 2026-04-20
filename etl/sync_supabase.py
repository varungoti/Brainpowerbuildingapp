"""
Mirror Supabase tables to Neon `raw.*` schema using simple full-refresh COPY.

Designed to run nightly inside the GitHub Action `analytics-nightly.yml`.
For tables that grow unboundedly (events, activity_attempts) we do an
incremental upsert based on `id`/`occurred_at`; everything else is full refresh.

Env:
  SOURCE_PG_URL   postgres://postgres:pass@db.YOUR_PROJECT.supabase.co:5432/postgres
  TARGET_NEON_URL postgres://user:pass@neon-host/analytics
"""
from __future__ import annotations

import io
import os
import sys
from contextlib import contextmanager
from typing import Iterable

import psycopg2
import psycopg2.extras

FULL_REFRESH = [
    "profiles",
    "children",
    "subscriptions",
    "caregiver_links",
    "feedback",
    "studio_jobs",
]
INCREMENTAL = [
    ("events", "occurred_at"),
    ("activity_attempts", "occurred_at"),
    ("studio_cost_ledger", "occurred_at"),
    ("marketing_costs", "occurred_at"),
]


@contextmanager
def conn(url: str):
    c = psycopg2.connect(url)
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()


def column_list(cur, schema: str, table: str) -> list[str]:
    cur.execute(
        """
        select column_name
        from information_schema.columns
        where table_schema = %s and table_name = %s
        order by ordinal_position
        """,
        (schema, table),
    )
    return [r[0] for r in cur.fetchall()]


def ensure_raw_schema(cur):
    cur.execute("create schema if not exists raw")


def full_refresh(src_cur, dst_cur, table: str):
    cols = column_list(src_cur, "public", table)
    if not cols:
        print(f"[skip] {table}: no columns at source")
        return
    dst_cur.execute(f"create table if not exists raw.{table} (like public.{table})")
    dst_cur.execute(f"truncate raw.{table}")
    print(f"[full] {table}")
    buf = io.StringIO()
    src_cur.copy_expert(
        f"copy (select {', '.join(cols)} from public.{table}) to stdout with csv header",
        buf,
    )
    buf.seek(0)
    dst_cur.copy_expert(f"copy raw.{table} ({', '.join(cols)}) from stdin with csv header", buf)


def incremental(src_cur, dst_cur, table: str, ts_col: str):
    cols = column_list(src_cur, "public", table)
    if not cols:
        print(f"[skip] {table}: no columns at source")
        return
    dst_cur.execute(f"create table if not exists raw.{table} (like public.{table})")
    dst_cur.execute(f"select coalesce(max({ts_col}), '1970-01-01') from raw.{table}")
    cutoff = dst_cur.fetchone()[0]
    print(f"[incr] {table} since {cutoff}")
    buf = io.StringIO()
    src_cur.copy_expert(
        f"copy (select {', '.join(cols)} from public.{table} where {ts_col} > '{cutoff}') to stdout with csv header",
        buf,
    )
    buf.seek(0)
    if buf.read(1) == "":
        return
    buf.seek(0)
    dst_cur.execute(f"create temp table tmp_{table} (like raw.{table} including defaults) on commit drop")
    dst_cur.copy_expert(f"copy tmp_{table} ({', '.join(cols)}) from stdin with csv header", buf)
    dst_cur.execute(
        f"insert into raw.{table} ({', '.join(cols)}) "
        f"select {', '.join(cols)} from tmp_{table} on conflict do nothing"
    )


def main() -> int:
    src_url = os.environ["SOURCE_PG_URL"]
    dst_url = os.environ["TARGET_NEON_URL"]
    with conn(src_url) as src, conn(dst_url) as dst:
        with src.cursor() as src_cur, dst.cursor() as dst_cur:
            ensure_raw_schema(dst_cur)
            for t in FULL_REFRESH:
                try:
                    full_refresh(src_cur, dst_cur, t)
                except Exception as e:
                    print(f"[warn] full {t}: {e}")
            for t, col in INCREMENTAL:
                try:
                    incremental(src_cur, dst_cur, t, col)
                except Exception as e:
                    print(f"[warn] incr {t}: {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
