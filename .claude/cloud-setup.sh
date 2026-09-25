#!/usr/bin/env bash
# Setup script for a claude.ai/code cloud environment, run as root through
# the dialog's field text in .claude/README.md, "Cloud sessions"; the result
# is cached. No Docker image pull here: the
# Docker daemon may not run during setup.
set -euo pipefail

cd "$(dirname "$0")/.."

NVM_VERSION=v0.40.3
GITLEAKS_VERSION=8.30.1
RTK_VERSION=0.48.0

# 1. Node from .nvmrc through nvm (the image ships an older Node).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
fi
# nvm.sh reads unset variables, so -u is off while it runs. Without
# --no-use, sourcing it beside an .nvmrc whose version is not installed yet
# returns 3 and set -e ends the script (measured 2026-09-24).
set +u
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh" --no-use
nvm install "$(cat .nvmrc)"
nvm alias default "$(cat .nvmrc)"
nvm use default
set -u
# The Bash tool never sources nvm and puts the image's Node 22 ahead of
# /usr/local/bin; ~/.local/bin is the first PATH entry.
mkdir -p "$HOME/.local/bin"
for tool in node npm npx; do
  ln -sf "$(dirname "$(nvm which default)")/$tool" "$HOME/.local/bin/$tool"
done

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

# 3b. rtk, the version bash-guard.mjs's reader rules are measured against,
# and its Claude Code hook in ~/.claude/settings.json.
rtk_base="https://github.com/rtk-ai/rtk/releases/download/v${RTK_VERSION}"
rtk_tarball="rtk-x86_64-unknown-linux-musl.tar.gz"
curl -fsSL -o "$tmp/$rtk_tarball" "$rtk_base/$rtk_tarball"
curl -fsSL -o "$tmp/rtk-checksums.txt" "$rtk_base/checksums.txt"
(cd "$tmp" && grep " $rtk_tarball\$" rtk-checksums.txt | sha256sum -c -)
tar -xzf "$tmp/$rtk_tarball" -C "$tmp" rtk
install -m 0755 "$tmp/rtk" /usr/local/bin/rtk
rtk init -g --hook-only --auto-patch

# 4. The Supabase CLI pinned in package.json.
npx supabase --version

# 4b. The proxy's authorities in the NSS store Chrome for Testing reads (the
# hosted E2E's browser half); its own file, so a session can re-run it.
bash .claude/cloud-nss.sh

# 5. The versions the SessionStart hook checks.
echo "node $(node --version) (.nvmrc $(cat .nvmrc))"
echo "npm $(npm --version)"
echo "gitleaks $(gitleaks version)"
echo "$(rtk --version)"
echo "supabase $(npx supabase --version)"
