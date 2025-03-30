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
import { createPersistentQueryCacheForBunSqlite } from '@patwoz/react-query-cache-persistent-adapter-bun-sqlite'

const db = new Database(':memory:')

const queryClient = new QueryClient({
  queryCache: createPersistentQueryCacheForBunSqlite(db),
  // Do not forget to set a staleTime, otherwise you will not take advantage of the synchronous cache
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour (just an example)
    },
  },
})

// All your queries are automatically cached in your sqlite database
```
