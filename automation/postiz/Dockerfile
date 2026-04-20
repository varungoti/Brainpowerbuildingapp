# Thin wrapper around upstream so we can deploy to Railway with one click.
# The official image already includes server, frontend, worker, and cron in
# a single process tree; we just inherit it.
FROM ghcr.io/gitroomhq/postiz-app:latest

# Railway injects PORT — Postiz frontend is on 5000 by default.
ENV PORT=5000
EXPOSE 5000
