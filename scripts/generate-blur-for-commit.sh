#!/bin/sh

# Generate missing blur data on every commit and periodically offer a full
# refresh for images that may have changed without changing filename.

REMINDER_INTERVAL_SECONDS=${BLUR_REMINDER_INTERVAL_SECONDS:-2592000}
REMINDER_NOW=${BLUR_REMINDER_NOW:-$(date +%s)}
REMINDER_STATE_FILE=${BLUR_REMINDER_STATE_FILE:-"$(git rev-parse --git-dir)/bakerbeanie-last-full-blur-prompt"}

LAST_REMINDER=0
if [ -f "$REMINDER_STATE_FILE" ]; then
  LAST_REMINDER=$(cat "$REMINDER_STATE_FILE")
fi

case "$LAST_REMINDER" in
  ''|*[!0-9]*) LAST_REMINDER=0 ;;
esac

case "$REMINDER_NOW" in
  ''|*[!0-9]*) REMINDER_NOW=$(date +%s) ;;
esac

GENERATOR_SCRIPT=generate-blur
REMINDER_ANSWERED=0

if [ $((REMINDER_NOW - LAST_REMINDER)) -ge "$REMINDER_INTERVAL_SECONDS" ]; then
  ANSWER=
  ANSWER_AVAILABLE=0

  if [ "${BLUR_REMINDER_ANSWER+x}" = x ]; then
    ANSWER=$BLUR_REMINDER_ANSWER
    ANSWER_AVAILABLE=1
  elif [ -t 1 ] && [ -r /dev/tty ] && [ -w /dev/tty ]; then
    printf 'Run a full regeneration of all blur placeholders? [y/N] ' > /dev/tty
    IFS= read -r ANSWER < /dev/tty || ANSWER=
    ANSWER_AVAILABLE=1
  else
    echo "⚠️  Full blur regeneration reminder deferred until an interactive commit"
  fi

  if [ "$ANSWER_AVAILABLE" -eq 1 ]; then
    REMINDER_ANSWERED=1
    case "$ANSWER" in
      y|Y|yes|YES|Yes) GENERATOR_SCRIPT=generate-blur:force ;;
    esac
  fi
fi

echo ""
if [ "$GENERATOR_SCRIPT" = generate-blur:force ]; then
  echo "🔮 Regenerating all blur placeholders..."
else
  echo "🔮 Generating missing blur placeholders..."
fi

if ! npm run "$GENERATOR_SCRIPT" --silent; then
  echo "⚠️  Blur data generation failed; continuing commit"
  return 0 2>/dev/null || exit 0
fi

if ! git add blur-data.json; then
  echo "⚠️  Could not stage blur-data.json; continuing commit"
  return 0 2>/dev/null || exit 0
fi

echo "✅ Blur data updated"

if [ "$REMINDER_ANSWERED" -eq 1 ]; then
  if ! mkdir -p "$(dirname "$REMINDER_STATE_FILE")" || ! printf '%s\n' "$REMINDER_NOW" > "$REMINDER_STATE_FILE"; then
    echo "⚠️  Could not save the blur reminder date; it will remain due"
  fi
fi

return 0 2>/dev/null || exit 0
