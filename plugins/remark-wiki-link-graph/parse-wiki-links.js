/**
 * Parse wiki-style links from markdown content
 * Supports multiple formats:
 * 1. Double-bracket links: [[some-note]] or [[some-note|Link text]]
 * 2. Wikilinks format: [Link text](some-note)
 * 3. Regular markdown links to other docs: [Link text](/docs/some-note)
 */

function parseWikiLinks(content) {
  const links = [];
  
  // Pattern 1: [[some-note]] or [[some-note|Link text]]
  const doubleBracketPattern = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
  let match;
  
  while ((match = doubleBracketPattern.exec(content)) !== null) {
    const target = match[1].trim();
    const text = match[2] ? match[2].trim() : target;
    
    links.push({
      target,
      text,
      original: match[0],
      type: 'double-bracket'
    });
  }
  
  // Pattern 2: [Link text](some-note) - without http/https/www
  const wikiLinkPattern = /\[(.*?)\]\((?!https?:\/\/|www\.|\/)(.*?)\)/g;
  
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    const text = match[1].trim();
    const target = match[2].trim();
    
    links.push({
      target,
      text,
      original: match[0],
      type: 'wiki-link'
    });
  }
  
  // Pattern 3: [Link text](/docs/some-note)
  const docsLinkPattern = /\[(.*?)\]\(\/docs\/(.*?)\)/g;
  
  while ((match = docsLinkPattern.exec(content)) !== null) {
    const text = match[1].trim();
    const target = match[2].trim();
    
    links.push({
      target,
      text,
      original: match[0],
      type: 'docs-link'
    });
  }
  
  return links;
}

module.exports = parseWikiLinks;