### Custom hooks (the ./hooks directory)

Each custom hooks performing API calls must consume a fetch function defined in the __./fetch__ directory. This rule is enforced in
order to prevent different API call implementation details between regular fetch functions and their React.js counterparts.

### Helpers

Global helper functions can be found in the __./helpers__ directory. Global means they can be consumed by multiple components.
If you have component-specific helpers, please feel free to create a __helpers.ts(x)__ file in the root directory of the component
and place you helper functions there.
