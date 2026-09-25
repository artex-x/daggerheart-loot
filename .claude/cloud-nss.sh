#!/usr/bin/env bash
# Puts the cloud proxy's certificate authorities in the NSS store Chrome for
# Testing reads (~/.pki/nssdb), so the browser half of the hosted E2E can
# reach the test project. The file holds more than one CA: each is stored
# under its own nickname and compared by sha256 fingerprint. Idempotent;
# `--check` installs nothing and exits 1 when a CA is missing or differs.
# cloud-setup.sh runs it and session-start.mjs runs `--check`.
# .claude/README.md, "Cloud sessions".
set -euo pipefail

CA=/root/.ccr/agent-proxy-ca.crt
NICK=ccr-agent-proxy
DB="$HOME/.pki/nssdb"
CHECK=0
[ "${1:-}" = --check ] && CHECK=1

if [ ! -f "$CA" ]; then
  echo "cloud-nss: no proxy authority on this host ($CA), nothing to do"
  exit 0
fi
if ! command -v certutil > /dev/null 2>&1; then
  if [ "$CHECK" = 1 ]; then
    echo "cloud-nss: certutil is not installed"
    exit 1
  fi
  apt-get update -qq
  apt-get install -y -qq libnss3-tools
fi
if [ ! -f "$DB/cert9.db" ]; then
  if [ "$CHECK" = 1 ]; then
    echo "cloud-nss: no NSS store at $DB"
    exit 1
  fi
  mkdir -p "$DB"
  certutil -d "sql:$DB" -N --empty-password
fi

# The first version stored only the file's first CA, as `ccr-agent-proxy`.
# Removed before the loop: it is the same certificate as `-ca1`, so deleting
# it afterwards would take `-ca1` with it.
if [ "$CHECK" = 0 ] && certutil -d "sql:$DB" -L -n "$NICK" > /dev/null 2>&1; then
  certutil -d "sql:$DB" -D -n "$NICK"
  echo "cloud-nss: $NICK (the old single entry) removed"
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
awk -v d="$tmp" '/BEGIN CERT/{n++} n{print > (d "/ca" n ".pem")}' "$CA"

missing=0
for pem in "$tmp"/ca*.pem; do
  nick="$NICK-$(basename "$pem" .pem)"
  want=$(openssl x509 -in "$pem" -noout -fingerprint -sha256)
  have=$(certutil -d "sql:$DB" -L -n "$nick" -a 2> /dev/null |
    openssl x509 -noout -fingerprint -sha256 2> /dev/null || true)
  if [ "$have" = "$want" ]; then
    echo "cloud-nss: $nick already trusted"
    continue
  fi
  if [ "$CHECK" = 1 ]; then
    echo "cloud-nss: $nick missing or different"
    missing=1
    continue
  fi
  certutil -d "sql:$DB" -D -n "$nick" > /dev/null 2>&1 || true
  certutil -d "sql:$DB" -A -t 'C,,' -n "$nick" -i "$pem"
  echo "cloud-nss: $nick added"
done

exit "$missing"
