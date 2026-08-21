#!/usr/bin/env bash
#
# Runs the same checks as .github/workflows/ci.yml, locally.
#
# Exists so a GitHub Actions outage is not a release blocker: if this passes,
# the three CI jobs are expected to pass. Keep it in step with ci.yml — if a job
# is added there, add it here.
#
#   ./scripts/ci-local.sh            all jobs
#   ./scripts/ci-local.sh schemas    a single job (transformer | schemas | website)
#
set -uo pipefail
cd "$(dirname "$0")/.."

ONLY="${1:-all}"
FAILED=()
run_job() { [[ "$ONLY" == "all" || "$ONLY" == "$1" ]]; }

# A job name that matches nothing runs nothing — and a run of nothing used to
# end in "ALL CHECKS PASSED". A filter that silently selects the empty set is
# the same defect this suite exists to catch, so an unknown name is an error.
case "$ONLY" in
  all|transformer|schemas|website) ;;
  *) printf 'unknown job "%s" — expected transformer, schemas, website or all\n' "$ONLY" >&2; exit 2 ;;
esac

# This script's promise is "green here means green there". A different Node
# major quietly voids it: V8 changes the wording of its own error messages
# between releases, and a check that compares a recorded message byte for byte
# then passes locally and fails in CI. That has happened once already.
#
# A warning rather than a failure — the divergence is usually harmless, and
# refusing to run would be worse than saying so.
CI_NODE=$(grep -m1 'node-version:' .github/workflows/ci.yml | tr -dc '0-9')
LOCAL_NODE=$(node -v 2>/dev/null | sed 's/^v//; s/\..*//')
if [[ -n "$CI_NODE" && -n "$LOCAL_NODE" && "$CI_NODE" != "$LOCAL_NODE" ]]; then
  printf '\033[33m  note  Node %s here, Node %s in CI. Green here is weaker evidence than usual.\033[0m\n' \
    "$LOCAL_NODE" "$CI_NODE"
fi

hdr() { printf '\n\033[1m── %s ─────────────────────────────\033[0m\n' "$1"; }
step() { printf '  %-46s' "$1"; }
ok()   { printf '\033[32mPASS\033[0m\n'; }
bad()  { printf '\033[31mFAIL\033[0m\n'; FAILED+=("$1"); }

# Run a command quietly; print its output only when it fails.
try() {
  local label="$1"; shift
  step "$label"
  local out
  if out=$("$@" 2>&1); then ok; else bad "$label"; printf '%s\n' "$out" | tail -25 | sed 's/^/      /'; fi
}

# ── transformer ────────────────────────────────────────────────────────────────
if run_job transformer; then
  hdr "transformer — typecheck, test, build"
  pushd packages/fds-transformer >/dev/null
  try "npm ci"        npm ci --no-fund --no-audit
  try "typecheck"     npm run typecheck
  try "tests"         npm run test:run
  try "build"         npm run build
  popd >/dev/null

  # Runs here rather than in the schemas job because it packs the transformer,
  # and packing runs `prepack`, which needs the dependencies the job above just
  # installed. It covers both packages: the skill needs neither.
  try "packages contain what they claim" npm run check:packages
fi

# ── schemas ────────────────────────────────────────────────────────────────────
if run_job schemas; then
  hdr "schemas — drift check + standalone validation"
  try "published schemas match sources" npm run check:schemas
  try "metrics guide covers the vocabulary" npm run check:metrics

  # Ajv CLI is installed on demand, mirroring the workflow. It sits above the
  # first check that needs Ajv rather than beside the one that needs the CLI,
  # because the doc-example check runs earlier and uses the library directly.
  if [[ ! -d node_modules/ajv-cli ]]; then
    step "install ajv-cli"
    if npm install --no-save --no-fund --no-audit ajv@8 ajv-cli@5 ajv-formats@3 >/dev/null 2>&1; then ok; else bad "install ajv-cli"; fi
  fi

  try "documented examples validate" npm run check:doc-examples
  try "the mapping schema names what the tool reads" npm run check:mapping

  # The round trip runs the built CLI. The transformer job above builds it, but
  # this job runs standalone too (`ci-local.sh schemas`), so build on demand —
  # the same shape as the ajv-cli install above. In CI the two jobs do not share
  # a filesystem and the workflow step installs and builds unconditionally.
  if [[ ! -f packages/fds-transformer/dist/bin/fds-transformer.js ]]; then
    step "build the transformer for the round trip"
    if npm --prefix packages/fds-transformer ci --no-fund --no-audit >/dev/null 2>&1 &&
       npm --prefix packages/fds-transformer run build >/dev/null 2>&1; then ok
    else bad "build the transformer for the round trip"; fi
  fi

  try "the transformer produces valid FDS" npm run check:transform
  try "prescription fixtures match their definitions" npm run check:prescription
  try "RFCs and schemas agree" npm run check:rfc
  try "references carry what they copy" npm run check:refs

  # Runs the published validation commands rather than reading them, from a
  # scratch directory with no node_modules. Slower than everything around it and
  # the only check here that needs the npm registry — see the doc comment in
  # scripts/check-doc-commands.mjs for why that trade was taken.
  try "the documented commands run" npm run check:commands
  try "website pages match their sources" npm run check:mirrors
  try "the licence ships and the footer links it" npm run check:license
  try "use-case pages stay honest" npm run check:usecases
  try "every matrix scenario has an example" npm run check:scenarios
  try "recommended values are in a registry" npm run check:registries
  try "skill knowledge names real fields" npm run check:skill
  try "every version claim matches the manifest" npm run check:versions
  try "the publish-credential rules can fail" npm run check:publish-auth

  # The schemas to validate against come from the release manifest, which is
  # generated from the published tree — publishing an entity adds it here with
  # no edit to this file or to ci.yml. See scripts/list-entity-schemas.mjs.
  total=0; failed=0
  validate() {
    local schema="$1" dir example
    dir="$(dirname "$schema")"
    for example in "$dir"/*.example*.json; do
      [ -e "$example" ] || continue
      total=$((total + 1))
      step "validate $(basename "$example")"
      if npx --no-install ajv validate --spec=draft2020 -c ajv-formats \
           -s "$schema" -d "$example" >/dev/null 2>&1; then ok
      else bad "validate $(basename "$example")"; failed=$((failed + 1)); fi
    done
  }

  step "list published entity schemas"
  if ENTITY_SCHEMAS=$(node scripts/list-entity-schemas.mjs 2>&1); then ok
  else bad "list published entity schemas"; printf '%s\n' "$ENTITY_SCHEMAS" | sed 's/^/      /'; ENTITY_SCHEMAS=""; fi

  while IFS= read -r schema; do
    [ -n "$schema" ] || continue
    validate "$schema"
  done <<< "$ENTITY_SCHEMAS"

  # A loop over an empty list exits zero and reports success. That is the shape
  # of the failure this whole change is about, so it is named rather than passed.
  if [ "$total" -eq 0 ]; then bad "no examples were validated"; fi
  printf '  %d examples validated standalone, %d failed\n' "$total" "$failed"
fi

# ── website ────────────────────────────────────────────────────────────────────
if run_job website; then
  hdr "website — build"
  pushd website >/dev/null
  try "npm ci"  npm ci --no-fund --no-audit
  popd >/dev/null
  # Between install and build, as in the workflow: the check re-runs the
  # string extraction, which needs the dependencies just installed.
  try "translations current with their sources" npm run check:translations
  pushd website >/dev/null
  try "build"   npm run build
  popd >/dev/null
  # After the build, because it reads the built output: the /en/* redirect
  # stubs are emitted by the default locale's build.
  try "/en/* answers with the page it means" npm run check:redirects
fi

# ── result ─────────────────────────────────────────────────────────────────────
printf '\n'
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[32mALL CHECKS PASSED\033[0m — equivalent to a green CI run.\n'
  exit 0
fi
printf '\033[31m%d CHECK(S) FAILED\033[0m\n' "${#FAILED[@]}"
printf '  - %s\n' "${FAILED[@]}"
# The verdict again, on stderr: a run captured with `> log` or piped through
# a filter has already had "verify was green" asserted about it on the
# strength of output nobody saw. The duplicate line in a plain terminal is
# the cost of the failure surviving any single-stream redirect.
{ printf '%d CHECK(S) FAILED: ' "${#FAILED[@]}"; printf '%s; ' "${FAILED[@]}"; printf '\n'; } >&2
exit 1
