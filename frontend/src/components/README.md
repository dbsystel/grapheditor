### Component Naming Guidelines

If your component is placed directly inside one of the components sub-directories (e.g., **/components/table**), please use the directory name as both the component filename and the export variable.

Example for a component placed directly inside the **components/table** directory:

- filename: `Table.tsx`
- component export: `export const Table = () => { ... }`

If your component is nested within one of the components sub-directories (e.g., **/components/connections/tabs/add-relation**), use the root sub-directory name combined with the deepest directory name as the component filename and export variable.

Example for a component placed deeply inside the **components/connections/tabs/add-relation** directory:

- filename: `ConnectionsAddRelation.tsx`
- component export: `export const ConnectionsAddRelation = () => { ... }`

This naming convention, while not perfect, aims to maintain consistency across components. Additionally, it helps identify a component's origin without needing to check its import path explicitly.
