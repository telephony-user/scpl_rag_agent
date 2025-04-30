#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define a default commit message
COMMIT_MESSAGE="Auto-sync via script"

echo ">>> Running Git Auto-Push Script <<<"

# 1. Add all changes (including untracked files)
echo "1. Adding all changes ('git add .')..."
git add .

# 2. Commit changes if there are any staged
echo "2. Checking for staged changes..."
# Use 'git diff --staged --quiet' which exits 0 if nothing staged, 1 if changes are staged.
# We proceed if the exit status is non-zero (changes exist).
if ! git diff --staged --quiet; then
    echo "   Staged changes detected. Committing..."
    git commit -m "$COMMIT_MESSAGE"
    echo "   Commit successful."
else
    echo "   No changes staged for commit. Skipping commit."
fi

# 3. Push changes to the remote repository (current branch)
echo "3. Pushing changes ('git push')..."
git push
echo "   Push successful."

echo ">>> Script finished. <<< 