#!/bin/bash

# Configuration
DOCS_DIR="/Users/junhyun/JunhyunB.github.io/docs"
INTRO_FILE="$DOCS_DIR/intro.md"
MAX_RECENT_FILES=5  # Maximum number of recent reviews to show

# Find the most recently modified .md files (excluding intro.md and template files)
echo "Finding recent paper reviews..."
# Use stat instead of -printf for macOS compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS version
  RECENT_FILES=$(find "$DOCS_DIR" -name "*.md" -not -path "*/node_modules/*" -not -name "intro.md" -not -name "*template*" -type f | xargs stat -f "%m %N" | sort -nr | head -n "$MAX_RECENT_FILES" | cut -d' ' -f2-)
else
  # Linux version
  RECENT_FILES=$(find "$DOCS_DIR" -name "*.md" -not -path "*/node_modules/*" -not -name "intro.md" -not -name "*template*" -type f -printf "%T@ %p\n" | sort -nr | head -n "$MAX_RECENT_FILES" | cut -d' ' -f2-)
fi

# Create a temporary file for the new Latest Reviews section
TEMP_FILE=$(mktemp)

# Write the header to the temp file
cat << EOF > "$TEMP_FILE"
## Latest Reviews

Here are some of my latest paper reviews:

EOF

# Process each file and extract information
for file in $RECENT_FILES; do
  # Extract relative path for link creation
  REL_PATH=${file#"$DOCS_DIR/"}
  
  # Extract title from frontmatter
  TITLE=$(grep -m 1 "title:" "$file" | sed 's/title: "//g' | sed 's/"//g' | sed 's/title://g' | xargs)
  
  # Try to extract H1 heading as title
  if [ -z "$TITLE" ]; then
    HEADING=$(grep -m 1 "^# " "$file" | sed 's/^# //g')
    if [ -n "$HEADING" ]; then
      TITLE="$HEADING"
    fi
  fi
  
  # Extract id from frontmatter as backup if title not found
  if [ -z "$TITLE" ]; then
    ID=$(grep -m 1 "id:" "$file" | sed 's/id://g' | xargs)
    if [ -n "$ID" ]; then
      TITLE=$(echo "$ID" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g') # Capitalize each word
    fi
  fi
  
  # Use filename as a last resort
  if [ -z "$TITLE" ]; then
    FILENAME=$(basename "$file" .md)
    TITLE=$(echo "$FILENAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g') # Capitalize each word
    # Don't use "index" as a title
    if [ "$TITLE" = "Index" ]; then
      # Try to get directory name
      DIR_NAME=$(dirname "$REL_PATH" | xargs basename)
      if [ -n "$DIR_NAME" ] && [ "$DIR_NAME" != "." ]; then
        TITLE=$(echo "$DIR_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')" Overview"
      fi
    fi
  fi
  
  # Try different sections for description in order of preference
  
  # 1. Try TL;DR section (in various formats)
  TLDR=$(sed -n '/## TL;DR/,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  if [ -z "$TLDR" ]; then
    TLDR=$(sed -n '/## TL; DR/,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  fi
  if [ -z "$TLDR" ]; then  
    TLDR=$(sed -n '/## TLDR/,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  fi
  
  # 2. Try Abstract section
  ABSTRACT=$(sed -n '/## Abstract/,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  
  # 3. Try Summary section
  SUMMARY=$(sed -n '/## Summary/,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  
  # 4. Try first paragraph after frontmatter that's not a heading
  FIRST_PARA=$(sed -n '/---/,/---/d;p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  
  # 5. Try first paragraph after H1 title
  AFTER_TITLE=$(sed -n '/^# /,/^$/p' "$file" | grep -v "^#" | grep -v "^$" | head -n 1)
  
  # Use the first non-empty description found
  if [ -n "$TLDR" ]; then
    DESCRIPTION=$TLDR
  elif [ -n "$ABSTRACT" ]; then
    DESCRIPTION=$ABSTRACT
  elif [ -n "$SUMMARY" ]; then
    DESCRIPTION=$SUMMARY
  elif [ -n "$FIRST_PARA" ]; then
    DESCRIPTION=$FIRST_PARA
  elif [ -n "$AFTER_TITLE" ]; then
    DESCRIPTION=$AFTER_TITLE
  else
    # For index files, give a better description
    if [[ "$file" == *"/index.md" ]]; then
      DESCRIPTION="Collection of papers related to $(dirname "$REL_PATH" | xargs basename | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')"
    else
      # Default description with title
      DESCRIPTION="Review of $TITLE"
    fi
  fi
  
  # Trim description if too long
  if [ ${#DESCRIPTION} -gt 100 ]; then
    DESCRIPTION="${DESCRIPTION:0:100}..."
  fi
  
  # Skip files without a title
  if [ -z "$TITLE" ]; then
    echo "Skipping file without title: $file"
    continue
  fi

  # Format link path correctly
  LINK_PATH=${REL_PATH%.md}
  
  # Add entry to temp file
  echo "- [${TITLE}](/docs/${LINK_PATH}) - ${DESCRIPTION}" >> "$TEMP_FILE"
done

# Add placeholder comment
cat << EOF >> "$TEMP_FILE"

<!--
  - [Paper Title 1](/docs/category/paper-title-1) - Brief description
  - [Paper Title 2](/docs/category/paper-title-2) - Brief description
  - [Paper Title 3](/docs/category/paper-title-3) - Brief description
-->
EOF

# Replace the Latest Reviews section in intro.md
sed -i '' -e '/^## Latest Reviews/,/^-->/d' "$INTRO_FILE"
sed -i '' -e '/^$/d' "$INTRO_FILE"
echo "" >> "$INTRO_FILE"
cat "$TEMP_FILE" >> "$INTRO_FILE"

# Clean up
rm "$TEMP_FILE"

echo "Updated latest reviews in $INTRO_FILE"