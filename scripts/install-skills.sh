#!/usr/bin/env bash
set -euo pipefail
cat <<'TXT'
Official upstream installers (require internet):
  Impeccable: npx impeccable install
  Ponytail: codex plugin marketplace add DietrichGebert/ponytail
            codex plugin add ponytail@ponytail
See docs/SKILLS.md and verify upstream README for current command names.
TXT
if [[ "${INSTALL_UPSTREAM:-0}" != "1" ]]; then
  echo "Dry run. Set INSTALL_UPSTREAM=1 to invoke installers."
  exit 0
fi
command -v npx >/dev/null || { echo 'npx missing'; exit 1; }
command -v codex >/dev/null || { echo 'codex missing'; exit 1; }
npx impeccable install
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
printf 'Review any Codex hook trust prompts and skill files.
'
