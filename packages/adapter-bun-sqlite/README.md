# @patwoz/react-query-cache-persistent-adapter-bun-sqlite

Adapter for `bun:sqlite` to use [react-query-cache-persistent](../../README.md).

## Installation

```sh
bun add react-query-cache-persistent @patwoz/react-query-cache-persistent-adapter-bun-sqlite
```

## Example

Take also a look into the [tests](./src/lib/adapter-bun-sqlite.test.ts).

```ts
import { Database } from 'bun:sqlite'
import { QueryClient } from '@tanstack/query-core'
import { createBunSqlitePersistentQueryCache } from '@patwoz/react-query-cache-persistent-adapter-bun-sqlite'

const db = new Database(':memory:')

const queryClient = new QueryClient({
  queryCache: createBunSqlitePersistentQueryCache(db),
})

// All your queries are automatically cached in your sqlite database
```

## Development

This library was generated with [Nx](https://nx.dev).

### Building

Run `nx build @patwoz/react-query-cache-persistent-adapter-bun-sqlite` to build the library.
