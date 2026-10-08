# Authentic upstream skills — setup

The archive DOES NOT contain upstream Impeccable or Ponytail source code; network restrictions prevented vendoring the repositories. It contains integration instructions and a project-specific pair of ORIGINAL helper skills under `.agents/skills/access-*`, clearly not represented as the upstream packages.

## Impeccable (upstream)
Official source: https://github.com/pbakaus/impeccable and https://impeccable.style . From project root with internet access: `npx impeccable install` (follow interactive installer). Then in your coding agent invoke `/impeccable init` if supported. It should read the existing `docs/PRODUCT.md` and `docs/DESIGN.md` and reconcile them with any generated root `PRODUCT.md`/`DESIGN.md` rather than overwrite product truth. Use the skill on task 01 and task 07. Verify installed instructions before running unfamiliar scripts.

## Ponytail (upstream)
Official source: https://github.com/DietrichGebert/ponytail . Current Codex distribution may be installed with `codex plugin marketplace add DietrichGebert/ponytail` followed by `codex plugin add ponytail@ponytail`; consult upstream README if Codex CLI version uses a different plugin command. Review any requested hooks before enabling. Use `@ponytail` or corresponding plugin guidance when available. `AGENTS.md` already enforces a safe subset of YAGNI guidance if official skill isn't installed.

## Install helper
`bash scripts/install-skills.sh` prints and optionally executes the documented official installers. Use `INSTALL_UPSTREAM=1 bash scripts/install-skills.sh` on a machine with Node/Codex CLI/internet. It is NOT safe to assume third-party hook permission; inspect prompts carefully.

## Local project skills
`.agents/skills/access-product/SKILL.md` and `.agents/skills/access-design/SKILL.md` are custom project-specific instructions, not copies of Ponytail or Impeccable. Never claim the official skills are installed until you have successfully installed them.
