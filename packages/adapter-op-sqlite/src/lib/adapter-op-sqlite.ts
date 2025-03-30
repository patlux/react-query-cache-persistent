import type { Query } from '@tanstack/query-core'
import { DB } from '@op-engineering/op-sqlite'

import { PersistentQueryCache } from 'react-query-cache-persistent'

type Props = {
  tableName?: string
  onError?: (error: unknown) => void
}

export const createPersistentQueryCacheForOpSqlite = (
  db: DB,
  { tableName = 'query_cache', onError }: Props = {},
) => {
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      query_hash TEXT NOT NULL UNIQUE,
      query_state TEXT
    ) STRICT;
  `)

  return new PersistentQueryCache({
    add: (query: Query) => {
      const result = db.executeSync(
        `SELECT query_state FROM ${tableName} WHERE query_hash = ?;`,
        [query.queryHash],
      )

      const firstRow = result.rows[0]
      console.log({ result: JSON.stringify(firstRow) })
      if (
        firstRow &&
        firstRow.query_state != null &&
        typeof firstRow.query_state === 'string'
      ) {
        try {
          query.state = JSON.parse(firstRow.query_state)
        } catch (error: unknown) {
          onError?.(error)
        }
      } else {
        onError?.(
          new Error(
            `Couldn't hydrate query "${query.queryHash}" because unexpected value type: "${typeof firstRow?.query_state}". Value: "${firstRow?.query_state}"`,
          ),
        )
      }
      console.log(`###########`, query.state)

      console.log(`addQuery("${query.queryHash}")`)
      db.executeSync(
        `
        INSERT INTO ${tableName} (query_hash, query_state)
        VALUES (?, ?)
        ON CONFLICT(query_hash) DO UPDATE SET
        query_state=excluded.query_state;
      `,
        [query.queryHash, JSON.stringify(query.state)],
      )
    },

    updated: (query: Query) => {
      console.log(`updateQuery("${query.queryHash}")`)

      db.transaction(async () => {
        await db.execute(
          `
        INSERT INTO ${tableName} (query_hash, query_state)
        VALUES (?, ?)
        ON CONFLICT(query_hash) DO UPDATE SET
        query_state=excluded.query_state;
      `,
          [query.queryHash, JSON.stringify(query.state)],
        )
      })
    },

    removed: (query: Query) => {
      console.log(`removeQuery("${query.queryHash}")`)
      db.transaction(async () => {
        await db.execute(`DELETE FROM ${tableName} WHERE query_hash = ?;`, [
          query.queryHash,
        ])
      })
    },
  })
}
