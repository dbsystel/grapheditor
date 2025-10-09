### Zustand store reset method

When defining reset method for a Zustand store, please use the `Omit` TypeScript utility type instead of the `Pick`.
That way, TypeScript will automatically "remind" us to check which properties should be re-initialized when adding or removing
properties to the store.
For example, if we go with the `Pick` type and we add one new property to a store, we have to always remind ourselves to about the
reset method. But if we use the `Omit` type, TypeScript will automatically remind us that the new property is missing in the reset
method type definition.

### TODOs
1. Migrate perspectives to a separate store
