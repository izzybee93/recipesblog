#!/bin/bash

# Sync recipe images to GitHub Pages backup repository
# This script mirrors public/images/recipes/ to the bakerbeanie-images repo

# Configuration
BACKUP_REPO_PATH="/Users/Izzy/Documents/Apps/bakerbeanie-images"
SOURCE_PATH="public/images/recipes"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔄 Syncing recipe images to backup repository..."

# Check if backup repo exists
if [ ! -d "$BACKUP_REPO_PATH" ]; then
  echo -e "${YELLOW}⚠️  Backup repo not found at: $BACKUP_REPO_PATH${NC}"
  echo "   Skipping backup sync. To set up:"
  echo "   1. Clone: git clone git@github.com:izzybee93/bakerbeanie-images.git"
  echo "   2. Move to: $BACKUP_REPO_PATH"
  exit 0
fi

# Check if source directory exists
if [ ! -d "$SOURCE_PATH" ]; then
  echo -e "${YELLOW}⚠️  Source directory not found: $SOURCE_PATH${NC}"
  exit 0
fi

# Sync images using rsync
# --delete: Remove files in destination that don't exist in source
# --exclude: Skip the originals folder and hidden files
# -av: Archive mode, verbose
rsync -av --delete \
  --exclude='originals/' \
  --exclude='.*' \
  "$SOURCE_PATH/" "$BACKUP_REPO_PATH/"

# Check if there are any changes in the backup repo
cd "$BACKUP_REPO_PATH"

# Get git status
CHANGES=$(git status --porcelain)

if [ -z "$CHANGES" ]; then
  echo -e "${GREEN}✅ Backup repo already in sync${NC}"
  exit 0
fi

# Count changes
ADDED=$(echo "$CHANGES" | grep "^??" | wc -l | tr -d ' ')
MODIFIED=$(echo "$CHANGES" | grep "^ M\|^M " | wc -l | tr -d ' ')
DELETED=$(echo "$CHANGES" | grep "^ D\|^D " | wc -l | tr -d ' ')

echo ""
echo "📊 Changes detected:"
[ "$ADDED" -gt 0 ] && echo "   Added:    $ADDED"
[ "$MODIFIED" -gt 0 ] && echo "   Modified: $MODIFIED"
[ "$DELETED" -gt 0 ] && echo "   Deleted:  $DELETED"
echo ""

# Stage all changes
git add -A

# Create commit message
if [ "$ADDED" -gt 0 ] && [ "$MODIFIED" -eq 0 ] && [ "$DELETED" -eq 0 ]; then
  COMMIT_MSG="Add $ADDED new image(s)"
elif [ "$DELETED" -gt 0 ] && [ "$ADDED" -eq 0 ] && [ "$MODIFIED" -eq 0 ]; then
  COMMIT_MSG="Remove $DELETED image(s)"
elif [ "$MODIFIED" -gt 0 ] && [ "$ADDED" -eq 0 ] && [ "$DELETED" -eq 0 ]; then
  COMMIT_MSG="Update $MODIFIED image(s)"
else
  COMMIT_MSG="Sync images (+$ADDED -$DELETED ~$MODIFIED)"
fi

# Commit
git commit -m "$COMMIT_MSG"

# Push
echo "⬆️  Pushing to GitHub..."
if git push; then
  echo -e "${GREEN}✅ Backup repo synced successfully${NC}"
else
  echo -e "${RED}❌ Failed to push to backup repo${NC}"
  echo "   You may need to push manually: cd $BACKUP_REPO_PATH && git push"
  exit 1
fi

exit 0
