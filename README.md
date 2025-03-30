# react-query-cache-persistent

This persistor extends [QueryCache](https://tanstack.com/query/v5/docs/reference/QueryCache) to persist the cache in a simple way without hydration/dehydration phase.

The biggest advantage in terms of performance is, that the persistor stores the queries by each single query instead of storing the whole cache on each change.

This is huge if your cache is several megabytes in size.

> ⚠️ The only drawback is that this only works in a synchronous way. You cannot use this if your storage only provides asynchronous methods to get/set the cache. See [How it works](#how-it-works)

## Adapters

- [bun:sqlite](./packages/adapter-bun-sqlite/README.md)
- [OP-SQLite](./packages/adapter-op-sqlite/README.md)

## Create your own adapter

```ts
import { PersistentQueryCache } from 'react-query-cache-persistent'

// Your implementation. See below for examples.
const persistentQueryCache = new PersistentQueryCache({
  add: (query) => {},
  updated: (query) => {},
  removed: (query) => {},
})

const queryClient = new QueryClient({ queryCache: persistentQueryCache })
```

### Web

Uses `localStorage` as storage.

![localStorage](https://github.com/patlux/react-query-cache-persistent/assets/4481570/5c7c1ebf-9c94-4171-b411-224debe1b7fb)

```ts
import { PersistentQueryCache } from 'react-query-cache-persistent'

const persistentQueryCache = new PersistentQueryCache({
  add: (query) => {
    const item = window.localStorage.getItem(`queryCache.${query.queryHash}`)

    if (item != null) {
      query.state = JSON.parse(item)
    }

    window.localStorage.setItem(
      `queryCache.${query.queryHash}`,
      JSON.stringify(query.state),
    )
  },
  updated: (query) => {
    window.localStorage.setItem(
      `queryCache.${query.queryHash}`,
      JSON.stringify(query.state),
    )
  },
  removed: (query) => {
    window.localStorage.removeItem(`queryCache.${query.queryHash}`)
  },
})

const queryClient = new QueryClient({ queryCache: persistentQueryCache })
```

### React Native

Uses `@op-engineering/op-sqlite` as storage. But you can use any sqlite solution as long it supports synchronous get/set.

The example below writes each query as a table row into a sqlite database

![queryCache.sqlite3](https://github.com/patlux/react-query-cache-persistent/assets/4481570/8913de2a-4af8-46e1-858f-478d8ce9914d)

# License

MIT License.
