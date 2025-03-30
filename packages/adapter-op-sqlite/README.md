# @patwoz/react-query-cache-persistent-adapter-op-sqlite

Adapter for [OP-SQLite](https://op-engineering.github.io/op-sqlite/) to use [react-query-cache-persistent](../../README.md).

## Installation

```sh
bun add react-query-cache-persistent @patwoz/react-query-cache-persistent-adapter-op-sqlite
```

## Example

Take also a look into the [tests](./src/lib/adapter-bun-sqlite.test.ts).

```ts
import { QueryClient } from '@tanstack/query-core'
import { createPersistentQueryCacheForOpSqlite } from '@patwoz/react-query-cache-persistent-adapter-op-sqlite'

import {
  ANDROID_DATABASE_PATH,
  IOS_LIBRARY_PATH,
  open,
} from '@op-engineering/op-sqlite'

const db = open({
  name: 'queryCache.sqlite3',
  location: Platform.OS === 'ios' ? IOS_LIBRARY_PATH : ANDROID_DATABASE_PATH,
})

const queryClient = new QueryClient({
  queryCache: createPersistentQueryCacheForOpSqlite(db),
  // Do not forget to set a staleTime, otherwise you will not take advantage of the synchronous cache
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour (just an example)
    },
  },
})

// All your queries are automatically cached in your sqlite database
```
