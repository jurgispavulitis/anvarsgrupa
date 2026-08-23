#!/usr/bin/env bash
# ------------------------------------------------------------
# Darbojas UZ OCI SERVERA, nevis uz GitHub darbinātāja.
# Pārkopē repozitorija saturu uz nginx saknes mapi.
# Palaiž GitHub Actions (skat. .github/workflows/deploy.yml),
# bet var palaist arī ar roku:  bash ~/anvarsgrupa/scripts/deploy.sh
# ------------------------------------------------------------
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/anvarsgrupa}"

if [ ! -d "$WEB_ROOT" ]; then
  echo "KĻŪDA: mape $WEB_ROOT neeksistē. Skat. DEPLOY.md 5. soli." >&2
  exit 1
fi

# --delete: serverī pazūd tas, kas repozitorijā vairs nav (spoguļattēls).
# Izslēgtie faili netiek ne augšupielādēti, ne dzēsti serverī.
rsync -a --delete \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.gitignore' \
  --exclude='.htmlvalidate.json' \
  --exclude='scripts' \
  --exclude='*.md' \
  --exclude='.well-known' \
  "$REPO_DIR"/ "$WEB_ROOT"/

echo "Publicēts: $(git -C "$REPO_DIR" rev-parse --short HEAD) -> $WEB_ROOT"
