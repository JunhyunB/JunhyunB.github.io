#!/bin/bash
# Script to update the graph data and latest reviews when adding new markdown files

echo "Updating latest paper reviews in intro.md..."
bash ./update-latest-reviews.sh

echo "Building site to regenerate graph data..."
npm run build

echo "Fixing duplicate nodes in graph data..."
node fix-duplicate-nodes.js

echo "Copying updated graph data to static folder..."
cp build/docusaurus-graph.json static/docusaurus-graph.json

echo "All data updated successfully!"
echo "You can now run 'npm start' to see the changes."