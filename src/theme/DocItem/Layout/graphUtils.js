// Utility functions for graph operations

/**
 * Normalize a document ID by removing /index suffix and handling special cases
 * This ensures consistent ID comparison across the application
 */
export function normalizeId(id) {
  if (!id || typeof id !== 'string') return '';
  
  // Remove /index suffix
  let normalized = id.replace(/\/index$/, '');
  
  // Remove leading/trailing slashes
  normalized = normalized.replace(/^\/+|\/+$/g, '');
  
  // Remove /docs/ prefix if present
  normalized = normalized.replace(/^docs\//, '');
  
  return normalized;
}

/**
 * Generate a clean URL for navigation from a node ID
 * Handles index pages and section paths correctly
 */
export function generateDocUrl(nodeId, graphData = []) {
  if (!nodeId) return '/docs';
  
  // Start with base docs path
  let url = '/docs/';
  
  // Normalize the node ID
  const normalizedId = normalizeId(nodeId);
  
  // Check if this node exists in graph data
  const nodeExists = graphData.some(item => 
    normalizeId(item.id) === normalizedId
  );
  
  if (nodeExists) {
    url += normalizedId;
  } else {
    // If node doesn't exist directly, use the ID as-is
    url += normalizedId;
  }
  
  // Handle index pages - add trailing slash
  const node = graphData.find(n => normalizeId(n.id) === normalizedId);
  if (node && node.linkTo && node.linkTo.length > 0) {
    // Check if this is a parent node (has children)
    const hasChildren = node.linkTo.some(childId => 
      normalizeId(childId).startsWith(normalizedId + '/')
    );
    
    if (hasChildren && !url.endsWith('/')) {
      url += '/';
    }
  }
  
  return url;
}

/**
 * Check if two nodes have a bidirectional relationship
 */
export function hasBidirectionalRelationship(nodeId1, nodeId2, links) {
  if (!nodeId1 || !nodeId2 || !Array.isArray(links)) return false;
  
  const norm1 = normalizeId(nodeId1);
  const norm2 = normalizeId(nodeId2);
  
  // Check both directions
  const hasForward = links.some(link => {
    const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
    const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
    return sourceId === norm1 && targetId === norm2;
  });
  
  const hasBackward = links.some(link => {
    const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
    const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
    return sourceId === norm2 && targetId === norm1;
  });
  
  return hasForward && hasBackward;
}

/**
 * Safely get property from an object with null checks
 */
export function safeGet(obj, path, defaultValue = null) {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result ?? defaultValue;
}

/**
 * Deduplicate graph data by normalized IDs
 */
export function deduplicateGraphData(graphData) {
  if (!Array.isArray(graphData)) return [];
  
  const seen = new Map();
  const result = [];
  
  for (const node of graphData) {
    if (!node || !node.id) continue;
    
    const normalizedId = normalizeId(node.id);
    
    if (!seen.has(normalizedId)) {
      // First occurrence of this normalized ID
      seen.set(normalizedId, {
        ...node,
        id: normalizedId,
        linkTo: [],
        referencedBy: []
      });
      result.push(seen.get(normalizedId));
    }
    
    // Merge linkTo and referencedBy arrays
    const existing = seen.get(normalizedId);
    
    if (Array.isArray(node.linkTo)) {
      node.linkTo.forEach(targetId => {
        const normalizedTarget = normalizeId(targetId);
        if (!existing.linkTo.includes(normalizedTarget)) {
          existing.linkTo.push(normalizedTarget);
        }
      });
    }
    
    if (Array.isArray(node.referencedBy)) {
      node.referencedBy.forEach(sourceId => {
        const normalizedSource = normalizeId(sourceId);
        if (!existing.referencedBy.includes(normalizedSource)) {
          existing.referencedBy.push(normalizedSource);
        }
      });
    }
    
    // Keep the best title (prefer non-lowercase titles)
    if (node.title && (!existing.title || existing.title === existing.title.toLowerCase())) {
      existing.title = node.title;
    }
  }
  
  // Normalize all link references
  result.forEach(node => {
    // Remove self-references
    node.linkTo = node.linkTo.filter(id => id !== node.id);
    node.referencedBy = node.referencedBy.filter(id => id !== node.id);
  });
  
  return result;
}

/**
 * Find the current document in graph data with multiple fallback strategies
 */
export function findCurrentDocument(currentDocId, graphData) {
  if (!currentDocId || !Array.isArray(graphData)) return null;
  
  const normalizedCurrent = normalizeId(currentDocId);
  
  // Try exact match first
  let match = graphData.find(node => 
    normalizeId(node.id) === normalizedCurrent
  );
  
  if (match) return match;
  
  // Try with /index suffix
  match = graphData.find(node => 
    normalizeId(node.id) === normalizedCurrent + '/index' ||
    normalizeId(node.id) === normalizedCurrent.replace(/\/index$/, '')
  );
  
  if (match) return match;
  
  // Try partial matches
  const lastSegment = normalizedCurrent.split('/').pop();
  match = graphData.find(node => {
    const nodeLastSegment = normalizeId(node.id).split('/').pop();
    return nodeLastSegment === lastSegment;
  });
  
  return match;
}

/**
 * Get node type based on its relationship to the current document
 */
export function getNodeType(nodeId, currentDocId, links, graphData) {
  if (!nodeId || !currentDocId) return 'unrelated';
  
  const normalizedNodeId = normalizeId(nodeId);
  const normalizedCurrentId = normalizeId(currentDocId);
  
  // Current document
  if (normalizedNodeId === normalizedCurrentId) {
    return 'current';
  }
  
  // Check if it's a placeholder
  const node = graphData?.find(n => normalizeId(n.id) === normalizedNodeId);
  if (node?.isPlaceholder) {
    return 'placeholder';
  }
  
  // Check relationships
  if (!Array.isArray(links)) return 'unrelated';
  
  const hasOutgoing = links.some(link => {
    const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
    const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
    return sourceId === normalizedCurrentId && targetId === normalizedNodeId;
  });
  
  const hasIncoming = links.some(link => {
    const sourceId = normalizeId(typeof link.source === 'object' ? link.source.id : link.source);
    const targetId = normalizeId(typeof link.target === 'object' ? link.target.id : link.target);
    return sourceId === normalizedNodeId && targetId === normalizedCurrentId;
  });
  
  if (hasOutgoing && hasIncoming) return 'both';
  if (hasOutgoing) return 'outgoing';
  if (hasIncoming) return 'incoming';
  
  return 'unrelated';
}

/**
 * Create safe node object for D3 rendering
 */
export function createSafeNode(node) {
  if (!node || !node.id) return null;
  
  return {
    id: node.id,
    title: node.title || node.id,
    type: node.type || 'unrelated',
    isPlaceholder: Boolean(node.isPlaceholder),
    x: node.x || 0,
    y: node.y || 0,
    fx: node.fx || null,
    fy: node.fy || null
  };
}

/**
 * Create safe link object for D3 rendering
 */
export function createSafeLink(link, nodeMap) {
  if (!link || !link.source || !link.target || !nodeMap) return null;
  
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  
  const sourceNode = nodeMap.get(sourceId);
  const targetNode = nodeMap.get(targetId);
  
  if (!sourceNode || !targetNode) return null;
  
  return {
    source: sourceNode,
    target: targetNode,
    isPlaceholder: Boolean(link.isPlaceholder)
  };
}