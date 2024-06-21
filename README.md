# react-query-cache-persistent

This persistor extends [QueryCache](https://tanstack.com/query/v5/docs/reference/QueryCache) to persist the cache in a simple way without hydration/dehydration phase.

The biggest advantage in terms of performance is, that the persistor stores the queries by each single query instead of storing the whole cache on each change.

This is huge if your cache is several megabytes in size.

> ⚠️  The only drawback is that this only works in a synchronous way. You cannot use this if your storage only provides asynchronous methods to get/set the cache. See [How it works](#how-it-works)

## Example

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

    window.localStorage.setItem(`queryCache.${query.queryHash}`, JSON.stringify(query.state))
  },
  updated: (query) => {
    window.localStorage.setItem(`queryCache.${query.queryHash}`, JSON.stringify(query.state))
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

```ts
import {
  ANDROID_DATABASE_PATH,
  IOS_LIBRARY_PATH,
  PreparedStatementObj,
  open,
} from '@op-engineering/op-sqlite'
import { Query } from '@tanstack/react-query'
import { Platform } from 'react-native'

import { PersistentQueryCache } from 'react-query-cache-persistent'

const tableName = 'queryCache'

const connect = () => {
  return open({
    name: 'queryCache.sqlite3',
    location: Platform.OS === 'ios' ? IOS_LIBRARY_PATH : ANDROID_DATABASE_PATH,
  })
}

let db = connect()

db.execute(
  `CREATE TABLE IF NOT EXISTS ${tableName} (queryHash TEXT NOT NULL UNIQUE, queryState TEXT) STRICT;`
)

const selectStmt = db.prepareStatement(`SELECT queryState FROM ${tableName} WHERE queryHash = ?;`)
const insertStmt = db.prepareStatement(
  `INSERT INTO ${tableName} (queryHash, queryState) VALUES (?, ?) ON CONFLICT(queryHash) DO UPDATE SET queryState=excluded.queryState;`
)
const deleteStmt = db.prepareStatement(`DELETE FROM ${tableName} WHERE queryHash = ?;`)

/**
 * Executes the prepared statement with the given parameters
 *
 * Will retry once if it throws `[OP-SQLite] DB is not open`
 */
const runStmt = (stmt: PreparedStatementObj, params: string[]) => {
  try {
    stmt.bind(params)
    return stmt.execute()
  } catch (error: unknown) {
    if (`${error}`.includes('[OP-SQLite] DB is not open')) {
      // retry once (on iOS the first execution fails on first start, but only in the context of PersistQueryCache::add)
      db = connect()
      stmt.bind(params)
      const result = stmt.execute()
      console.warn(`First execution failed. Second try worked.`)
      return result
    }
    console.warn(`Failed to execute query: "${error}".`)
    throw error
  }
}

export const queryCache = new PersistQueryCache({
  add: (query: Query) => {
    const result = runStmt(selectStmt, [query.queryHash])

    const firstRow = result.rows?._array[0]
    if (firstRow != null) {
      try {
        query.state = JSON.parse(firstRow.queryState)
      } catch (error: unknown) {
        console.warn(`Failed to hydrate state for query "${query.queryHash}": ${error}`)
      }
    }

    runStmt(insertStmt, [query.queryHash, JSON.stringify(query.state)])
  },

  updated: (query: Query) => {
    runStmt(insertStmt, [query.queryHash, JSON.stringify(query.state)])
  },

  removed: (query: Query) => {
    runStmt(deleteStmt, [query.queryHash])
  },
})
```




# How it works

> TODO

# License

MIT License.
