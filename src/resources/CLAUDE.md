# src/resources — reads, one card per entity

- Copy `product.ts`; it is the exemplar every recipe points at. Do not write a page: list, editor and detail routes come from the registry.
- `data.cache` is required and is a class (`list` | `detail` | `lookup` | `calc`), never a number. A resource that must always be fresh overrides with `0` and a comment.
- Query keys come from `keysFor(name)`: `[name, storeId, …]`, store id read at call time.
- Reads only. Writes are commands referenced by id in `commands.page / row / bulk / more / primary`.
- Custom sections and cells name a `ComponentId` string; `features/components.tsx` resolves it. `extension:<target>` renders that target.
- Filters speak domain names in `toQuery`; the api module encodes them for its service.
- Features without a backend get a `capability` flag that is off, not a fake.
