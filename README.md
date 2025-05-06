# Jun-Hyun Bae's Personal Website

This repository contains the source code for my personal website, built with [Docusaurus](https://docusaurus.io/).

## Content

- **About Me** - Personal introduction and information
- **Paper Reviews** - Summaries and analyses of research papers
- **Research Notes** - Blog posts about research topics and experiments

## Zettelkasten-style Wiki Links

This website implements a Zettelkasten-style note-taking system with automatic link detection. You can create connections between documents using several types of links:

1. **Double-bracket links**: `[[note-id]]` or `[[note-id|Custom text]]`
2. **Wiki-style links**: `[Link text](note-id)`
3. **Standard Docusaurus links**: `[Link text](/docs/note-id)`

All links are automatically detected and visualized in an interactive graph view next to each document. This helps discover connections between ideas and navigate related content.

For examples and a guide on how to use this system, see:
- [Zettelkasten Example](/docs/zettelkasten-example)
- [Zettelkasten Guide](/docs/zettelkasten-guide)

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
