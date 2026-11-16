#!/usr/bin/env bash
# Installa il kit: skill in <destinazione>/skills, regole in <destinazione>/CLAUDE.md.
# Uso: ./install.sh [destinazione]   (predefinita: ~/.claude)
# Per un solo progetto: ./install.sh /percorso/progetto/.claude
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$HOME/.claude}"
mkdir -p "$DEST/skills"
for d in "$SRC"/skills/*/; do
  name="$(basename "$d")"
  if [ -e "$DEST/skills/$name" ]; then
    echo "salto skills/$name (esiste già)"
  else
    cp -r "$d" "$DEST/skills/$name"
    echo "installata skills/$name"
  fi
done
if [ -e "$DEST/CLAUDE.md" ]; then
  cp "$SRC/CLAUDE.md" "$DEST/CLAUDE.fable-kit.md"
  echo "CLAUDE.md esiste già: regole copiate in $DEST/CLAUDE.fable-kit.md, da unire a mano"
else
  cp "$SRC/CLAUDE.md" "$DEST/CLAUDE.md"
  echo "installato CLAUDE.md"
fi
