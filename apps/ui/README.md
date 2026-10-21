# Shared UI layer

Apps extend this layer with `extends: ["../ui"]`. Nuxt auto-imports its components, composables, and
utilities.

Use relative imports inside the layer. In consuming apps, use the named layer alias for explicit
imports, including JSON assets:

```ts
import states from "#layers/ui/app/assets/data/bundeslaender.json";
import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";
```

The boundary JSON files are bundled imports under `app/assets/data`; they do not need to be copied
into each app or served from `public`.

`SimpleHeatMap` accepts `features` and `nameKey` props so each caller selects its geometry.
`VariantGroupingCard` accepts an optional `formatCount` callback for apps that count places instead
of answers. The cards use the consuming app's Vue I18n messages and Nuxt UI styling.

`useVariantGroups` exposes shared grouping helpers. Dataset and map state stays in the consuming
app; LexVAD keeps it in `useVariantGroupStore`.
