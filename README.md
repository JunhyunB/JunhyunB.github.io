# Jun-Hyun Bae's Personal Website

This repository contains the source code for my personal website, built with [Docusaurus](https://docusaurus.io/).

## Content

- **About Me** - Personal introduction and information
- **Paper Reviews** - Summaries and analyses of research papers
- **Research Notes** - Blog posts about research topics and experiments

## Zettelkasten-style Wiki Links

This website implements a Zettelkasten-style note-taking system with automatic link detection. You can create connections between documents using several types of links:

### IMPORTANT: Link Format Guidelines

To ensure proper graph visualization and prevent broken links, follow these rules:

✅ **DO**:
- Use absolute paths with the `/docs/` prefix: `[Link Text](/docs/path/to/page)`
- For index pages, link to the directory with trailing slash: `[Section Name](/docs/path/to/section/)`

❌ **DON'T**:
- Don't use relative paths: `[Link Text](./page)` or `[Link Text](../other-section/page)`
- Don't include file extensions: `[Link Text](/docs/path/to/page.md)`
- Don't directly link to index files: `[Link Text](/docs/path/to/section/index)`

All links are automatically detected and visualized in an interactive graph view next to each document. This helps discover connections between ideas and navigate related content.

### Updating Content

After adding or modifying content:

1. Run `npm run update-reviews` to update the latest paper reviews list
2. Run `npm run update-graph` to update the relationship graph
3. Or use `npm run update-all` to do both at once

## Development

### Prerequisites

- Node.js version 18 or above
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/JunhyunB/JunhyunB.github.io.git
cd JunhyunB.github.io

# Install dependencies
npm install
```

### Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
