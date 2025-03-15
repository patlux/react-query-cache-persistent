import type { Query } from '@tanstack/query-core'
import { Database } from 'bun:sqlite'

import { PersistentQueryCache } from 'react-query-cache-persistent'

type Props = {
  tableName?: string
  onError?: (error: unknown) => void
}

export const createBunSqlitePersistentQueryCache = (
  db: Database,
  { tableName = 'query_cache', onError }: Props = {},
) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      query_hash TEXT NOT NULL UNIQUE,
      query_state TEXT
    ) STRICT;
  `)
  const selectStmt = db.prepare(
    `SELECT query_state FROM ${tableName} WHERE query_hash = ?;`,
  )
  const insertStmt = db.prepare(`
    INSERT INTO ${tableName} (query_hash, query_state)
    VALUES (?, ?)
    ON CONFLICT(query_hash) DO UPDATE SET
    query_state=excluded.query_state;
  `)
  const deleteStmt = db.prepare(`
    DELETE FROM ${tableName} WHERE query_hash = ?;
  `)

  return new PersistentQueryCache({
    add: (query: Query) => {
      const rows = selectStmt.all(query.queryHash)

      const firstRow = rows[0] as any
      if (firstRow != null && 'queryState') {
        try {
          query.state = JSON.parse(firstRow.queryState)
        } catch (error: unknown) {
          onError?.(error)
        }
      }

      insertStmt.run(query.queryHash, JSON.stringify(query.state))
    },

    updated: (query: Query) => {
      insertStmt.run(query.queryHash, JSON.stringify(query.state))
    },

    removed: (query: Query) => {
      deleteStmt.run(query.queryHash)
    },
  })
}
