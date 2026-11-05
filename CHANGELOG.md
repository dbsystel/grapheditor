# Changelog

All notable changes to this project will be documented in this file.

## 2026.11.1

- Initial import and export of nodes and relations
- Improved metamodel documentation
- Improved styling of nodes, prioritize properties sort order
- Improved export and import
- Improved metamodel documentation
- Custom procedures to validate a graph against a metamodel
- Paraqueries utilize the ComboBox component for parameters with suggestions
- Paraqueries support parameter suggestions live filtering
- Auto-panning of graph view when dragging nodes to the edge of the viewport
- Functions to validate content according to metamodel


## 2026.9.1

- Local development switched to Node.js v24.18.0
- Global loading indicator (progress dot) added next to the database info in header
- Node position scaling
- When suggesting relation types while creating/editing a relation, show in the first
  place those inferred by the selected source and/or target nodes and any corresponding
  restrictions available in the metamodel.
- When suggesting source/target nodes while creating/editing a relation, show in the first
  place those inferred by the selected opposite node and/or relation type and any corresponding
  restrictions available in the metamodel.
- Stoppable requests (enables canceling requests on both client and server side)

## 2026.6.1

- Context menu - node horizontal/vertical spread/center, top/right/bottom/left alignment
- Basic documentation for the meta model
- Graph scaling
- Automated node arrangement

## 2026.5.1

- Version info is available in the debug menu
- New graph node/relation is now focused in graph and open in detail window
- Persistent user preferences for initially expanded sections in item detail views (items
  drawer and mouseover)
- Relations can be selected by clicking on the label
- Perspective for dummy data
- Perspective menu is only shown when uuid mechanism is in place
- Zoom speed stays persistent
- Debug menu on the left side
- Paraqueries now support integer parameters
- Relation info and its type meta info are now directly accessible
- Perspectives are saved completely, even when just names are modified

## 2026.4.1

- Variable width sidebars

## 2026.3.1

- Node-only perspectives
- Multistatement cypher queries
- Self loops are shown in graph dispay
- Werkzeug can be forced for development
- Improved item info
- Parameterless paraqueries, improved listing
- SSO Support
- Editing of all neo4j types, except vectors
- Markdown handling in tables
- Improved perspective management

## 2025.12.1

- Startpage with customizable queries
- Multi tenancy for
  - Startpage
  - Style file
  - Translations
  - Logos
- Hover for properties filter
- Reset button for properties filter
- Default theme styling improvement
- Bug fixes around expired sessions

## 2025.11.3

- dropped neo4j 4.x support
- speed improvements
- fixes to styling
- use gunicorn on unix
- fix crashes

## 2025.11.2

- better sorting of lists
- improved preview for nodes and relations
- fulltext search can now support lucene syntax
- centering of nodes and relations in graph view
- Bugfixing

## 2025.11.1

- Context menu with many new features
- Bugfix when duplicating tabs in browser
- Improved handling of .grass files
- Improved security

## 2025.10.3

- Improved nodefinder widget
- Improved title display for nodes everywhere

## 2025.10.2

- MVP of Parameterized Queries (ParaQueries)
- UX improvements

## 2025.10.1

- MVP of set based browsing
- Improved detail view on nodes and relations
- Better connection handling
- Improved CONTRIBUTORS.md

## 20250820_0

- History for cypher queries

## August 2025

Initial release

- Cypher queries
- Fulltext search
- Graph display, WebGL, HTML Nodes
- Semantic support
- Usable result tables
