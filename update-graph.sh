#!/bin/bash
# Script to update the graph data when adding new markdown files

echo "Building site to regenerate graph data..."
npm run build

echo "Copying updated graph data to static folder..."
cp build/docusaurus-graph.json static/docusaurus-graph.json

echo "Graph data updated successfully!"
echo "You can now run 'npm start' to see the changes."