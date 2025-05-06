# Contributing Guidelines

## Adding Content

When adding new content to this site, please follow these guidelines to ensure proper functionality.

## Markdown Links

To ensure proper graph visualization and prevent broken links, follow these link formatting rules:

### ✅ Do
- Use absolute paths with the `/docs/` prefix:
  ```md
  [Link Text](/docs/path/to/page)
  ```
- For index pages, link to the directory with trailing slash:
  ```md
  [Section Name](/docs/path/to/section/)
  ```

### ❌ Don't
- Don't use relative paths:
  ```md
  [Link Text](./page)
  [Link Text](../other-section/page)
  ```
- Don't include file extensions in links:
  ```md
  [Link Text](/docs/path/to/page.md)
  ```
- Don't directly link to index files:
  ```md
  [Link Text](/docs/path/to/section/index)
  ```

## Updating the Site

After adding or modifying content:

1. Run `npm run update-reviews` to update the latest paper reviews list
2. Run `npm run update-graph` to update the relationship graph
3. Or simply run `npm run update-all` to do both at once

## File Structure

- Place paper reviews in the appropriate topic directory
- Use consistent frontmatter in your Markdown files:
  ```md
  ---
  id: unique-id
  title: "Your Paper Title"
  tags: [tag1, tag2]
  ---
  ```

## Sections to Include in Paper Reviews

- Paper Information (authors, publication, date, links)
- TL;DR
- Abstract
- Key Contributions
- Method
- Results
- Discussion