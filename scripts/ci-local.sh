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
fi

# ── schemas ────────────────────────────────────────────────────────────────────
if run_job schemas; then
  hdr "schemas — drift check + standalone validation"
  try "published schemas match sources" npm run check:schemas
  try "metrics guide covers the vocabulary" npm run check:metrics

  # Ajv CLI is installed on demand, mirroring the workflow.
  if [[ ! -d node_modules/ajv-cli ]]; then
    step "install ajv-cli"
    if npm install --no-save --no-fund --no-audit ajv@8 ajv-cli@5 ajv-formats@3 >/dev/null 2>&1; then ok; else bad "install ajv-cli"; fi
  fi

  try "prescription fixtures match their definitions" npm run check:prescription
  try "RFCs and schemas agree" npm run check:rfc
  try "every matrix scenario has an example" npm run check:scenarios

  S=specification/schemas
  total=0; failed=0
  validate() {
    local schema="$1" dir="$2" example
    for example in "$dir"/*.example*.json; do
      [ -e "$example" ] || continue
      total=$((total + 1))
      step "validate $(basename "$example")"
      if npx --no-install ajv validate --spec=draft2020 -c ajv-formats \
           -s "$schema" -d "$example" >/dev/null 2>&1; then ok
      else bad "validate $(basename "$example")"; failed=$((failed + 1)); fi
    done
  }
  validate "$S/exercises/v1.1.0/exercise.schema.json"                     "$S/exercises/v1.1.0"
  validate "$S/equipment/v1.1.0/equipment.schema.json"                    "$S/equipment/v1.1.0"
  validate "$S/muscle/v1.0.0/muscle.schema.json"                          "$S/muscle/v1.0.0"
  validate "$S/muscle/muscle-category/v1.0.0/muscle-category.schema.json" "$S/muscle/muscle-category/v1.0.0"
  validate "$S/atlas/v1.0.0/body-atlas.schema.json"                       "$S/atlas/v1.0.0"
  validate "$S/workout/v1.0.0/workout.schema.json"                        "$S/workout/v1.0.0"
  printf '  %d examples validated standalone, %d failed\n' "$total" "$failed"
fi

# ── website ────────────────────────────────────────────────────────────────────
if run_job website; then
  hdr "website — build"
  pushd website >/dev/null
  try "npm ci"  npm ci --no-fund --no-audit
  try "build"   npm run build
  popd >/dev/null
fi

# ── result ─────────────────────────────────────────────────────────────────────
printf '\n'
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[32mALL CHECKS PASSED\033[0m — equivalent to a green CI run.\n'
  exit 0
fi
printf '\033[31m%d CHECK(S) FAILED\033[0m\n' "${#FAILED[@]}"
printf '  - %s\n' "${FAILED[@]}"
exit 1
