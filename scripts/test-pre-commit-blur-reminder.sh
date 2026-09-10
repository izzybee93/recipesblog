#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
HELPER="$SCRIPT_DIR/generate-blur-for-commit.sh"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_file_contains() {
  grep -F "$2" "$1" >/dev/null 2>&1 || fail "$1 does not contain: $2"
}

make_stubs() {
  case_dir=$1
  mkdir -p "$case_dir/bin"

  cat > "$case_dir/bin/npm" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >> "$BLUR_TEST_NPM_LOG"
exit "${BLUR_TEST_NPM_EXIT:-0}"
STUB

  cat > "$case_dir/bin/git" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >> "$BLUR_TEST_GIT_LOG"
exit "${BLUR_TEST_GIT_EXIT:-0}"
STUB

  chmod +x "$case_dir/bin/npm" "$case_dir/bin/git"
}

run_helper() {
  case_dir=$1
  answer=$2
  npm_exit=$3
  git_exit=$4
  make_stubs "$case_dir"

  if [ "$answer" = "UNSET" ]; then
    env \
      PATH="$case_dir/bin:$PATH" \
      BLUR_REMINDER_STATE_FILE="$case_dir/state" \
      BLUR_REMINDER_NOW=3000000 \
      BLUR_TEST_NPM_LOG="$case_dir/npm.log" \
      BLUR_TEST_GIT_LOG="$case_dir/git.log" \
      BLUR_TEST_NPM_EXIT="$npm_exit" \
      BLUR_TEST_GIT_EXIT="$git_exit" \
      "$HELPER" >"$case_dir/output.log" 2>&1
  else
    env \
      PATH="$case_dir/bin:$PATH" \
      BLUR_REMINDER_STATE_FILE="$case_dir/state" \
      BLUR_REMINDER_NOW=3000000 \
      BLUR_REMINDER_ANSWER="$answer" \
      BLUR_TEST_NPM_LOG="$case_dir/npm.log" \
      BLUR_TEST_GIT_LOG="$case_dir/git.log" \
      BLUR_TEST_NPM_EXIT="$npm_exit" \
      BLUR_TEST_GIT_EXIT="$git_exit" \
      "$HELPER" >"$case_dir/output.log" 2>&1
  fi
}

case_yes="$TEST_ROOT/overdue-yes"
run_helper "$case_yes" yes 0 0
assert_file_contains "$case_yes/npm.log" "run generate-blur:force --silent"
assert_file_contains "$case_yes/git.log" "add blur-data.json"
[ "$(cat "$case_yes/state")" = "3000000" ] || fail "yes did not record reminder date"

case_no="$TEST_ROOT/overdue-no"
run_helper "$case_no" no 0 0
assert_file_contains "$case_no/npm.log" "run generate-blur --silent"
[ "$(cat "$case_no/state")" = "3000000" ] || fail "no did not record reminder date"

case_default_no="$TEST_ROOT/overdue-default-no"
run_helper "$case_default_no" "" 0 0
assert_file_contains "$case_default_no/npm.log" "run generate-blur --silent"
[ "$(cat "$case_default_no/state")" = "3000000" ] || fail "default no did not record reminder date"

case_generate_failure="$TEST_ROOT/generate-failure"
run_helper "$case_generate_failure" yes 1 0
[ ! -e "$case_generate_failure/state" ] || fail "generation failure recorded reminder date"
[ ! -e "$case_generate_failure/git.log" ] || fail "generation failure attempted to stage blur data"
assert_file_contains "$case_generate_failure/output.log" "Blur data generation failed; continuing commit"

case_stage_failure="$TEST_ROOT/stage-failure"
run_helper "$case_stage_failure" yes 0 1
[ ! -e "$case_stage_failure/state" ] || fail "staging failure recorded reminder date"
assert_file_contains "$case_stage_failure/output.log" "Could not stage blur-data.json; continuing commit"

case_recent="$TEST_ROOT/recent"
mkdir -p "$case_recent"
printf '%s\n' 2999999 > "$case_recent/state"
run_helper "$case_recent" UNSET 0 0
assert_file_contains "$case_recent/npm.log" "run generate-blur --silent"
[ "$(cat "$case_recent/state")" = "2999999" ] || fail "recent reminder date changed"

case_noninteractive="$TEST_ROOT/noninteractive"
mkdir -p "$case_noninteractive"
printf '%s\n' 1 > "$case_noninteractive/state"
run_helper "$case_noninteractive" UNSET 0 0
assert_file_contains "$case_noninteractive/npm.log" "run generate-blur --silent"
[ "$(cat "$case_noninteractive/state")" = "1" ] || fail "non-interactive run changed overdue reminder date"
assert_file_contains "$case_noninteractive/output.log" "Full blur regeneration reminder deferred"

echo "PASS: monthly blur reminder behavior"
