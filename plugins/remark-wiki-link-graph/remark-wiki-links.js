/**
 * A remark plugin to transform wiki-style links into regular markdown links
 * This enables the links to work in the rendered HTML
 */
const visit = require('unist-util-visit');
const parseWikiLinks = require('./parse-wiki-links');

module.exports = function remarkWikiLinks(options = {}) {
  const {
    pageResolver = defaultPageResolver,
    hrefTemplate = defaultHrefTemplate,
  } = options;
  
  return function transformer(tree, file) {
    const { value } = file;
    
    // Process the content and find all wiki-style links
    const wikiLinks = parseWikiLinks(value);
    
    // Replace the original markdown with transformed links
    let transformedContent = value;
    
    // Process them in reverse order to avoid position shifts
    for (let i = wikiLinks.length - 1; i >= 0; i--) {
      const link = wikiLinks[i];
      
      // Skip regular links
      if (link.type === 'docs-link') {
        continue;
      }
      
      const pageName = pageResolver(link.target);
      const href = hrefTemplate(pageName);
      
      // Create the replacement markdown link
      const newLink = `[${link.text}](${href})`;
      
      // Replace in the content
      transformedContent = transformedContent.replace(link.original, newLink);
    }
    
    // Update the file value
    file.value = transformedContent;
  };
};

// Default resolver turns wiki links into paths
function defaultPageResolver(name) {
  return name;
}

// Default template prefixes with /docs/
function defaultHrefTemplate(permalink) {
  return `/docs/${permalink}`;
}