import { Database } from 'bun:sqlite'
import { expect, test } from 'bun:test'
import { QueryClient } from '@tanstack/query-core'
import { createBunSqlitePersistentQueryCache } from './adapter-bun-sqlite.js'

const db = new Database(':memory:')

const queryClient = new QueryClient({
  queryCache: createBunSqlitePersistentQueryCache(db),
})

test('Should insert query cache', async () => {
  await queryClient.fetchQuery({
    queryKey: ['/test'],
    queryFn: () => {
      return 'test'
    },
  })

  const result = db.query('SELECT COUNT(*) FROM query_cache').get()
  expect(result).toEqual({
    'COUNT(*)': 1,
  })
})

test('Should update query cache', async () => {
  const get = () => {
    const result = db
      .query<
        { data: string; dataUpdatedAt: number },
        []
      >(`SELECT json_extract(query_state, '$.data') as data, json_extract(query_state, '$.dataUpdatedAt') as dataUpdatedAt FROM query_cache LIMIT 1`)
      .get()

    if (result == null) {
      throw new Error(`Expected to get a result, but got nothing`)
    }

    return result
  }

  const before = get()
  expect(before.data).toBe('test')

  await Bun.sleep(100)
  await queryClient.fetchQuery({
    queryKey: ['/test'],
    queryFn: () => {
      return 'test 2'
    },
  })

  const after = get()
  expect(after.dataUpdatedAt).toBeGreaterThan(before.dataUpdatedAt)
  expect(after.data).toBe('test 2')
})

test('Should delete query', () => {
  queryClient.removeQueries({
    queryKey: ['/test'],
  })

  const result = db.query('SELECT COUNT(*) FROM query_cache').get()
  expect(result).toEqual({
    'COUNT(*)': 0,
  })
})
