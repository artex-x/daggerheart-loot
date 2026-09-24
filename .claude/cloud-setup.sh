#!/usr/bin/env bash
# Setup script for a claude.ai/code cloud environment. The environment
# dialog runs `bash .claude/cloud-setup.sh` as root; the result is cached.
# See .claude/README.md, "Cloud sessions". No Docker image pull here: the
# Docker daemon may not run during setup.
set -euo pipefail

cd "$(dirname "$0")/.."

NVM_VERSION=v0.40.3
GITLEAKS_VERSION=8.30.1

# 1. Node from .nvmrc through nvm (the image ships an older Node).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
fi
# nvm.sh reads unset variables, so -u is off while it runs.
set +u
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm install "$(cat .nvmrc)"
nvm alias default "$(cat .nvmrc)"
nvm use default
set -u

# 2. Dependencies; puppeteer downloads Chrome for Testing to ~/.cache/puppeteer.
npm ci

# 3. gitleaks, checked against the release's checksum file.
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
base="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}"
tarball="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
curl -fsSL -o "$tmp/$tarball" "$base/$tarball"
curl -fsSL -o "$tmp/checksums.txt" "$base/gitleaks_${GITLEAKS_VERSION}_checksums.txt"
(cd "$tmp" && sha256sum -c --ignore-missing checksums.txt)
tar -xzf "$tmp/$tarball" -C "$tmp" gitleaks
install -m 0755 "$tmp/gitleaks" /usr/local/bin/gitleaks
gitleaks version

# 4. The Supabase CLI pinned in package.json.
npx supabase --version

# 5. The versions the SessionStart hook checks.
echo "node $(node --version) (.nvmrc $(cat .nvmrc))"
echo "npm $(npm --version)"
echo "gitleaks $(gitleaks version)"
echo "supabase $(npx supabase --version)"
