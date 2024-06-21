import { QueryCache, type Query, type QueryCacheNotifyEvent } from "@tanstack/react-query"

export type QueryCachePersistor = {
  add: (query: Query) => void
  updated: (query: Query) => void
  removed: (query: Query) => void
}

export class PersistQueryCache extends QueryCache {
  persistor: QueryCachePersistor

  constructor(persistor: QueryCachePersistor) {
    super()
    this.persistor = persistor
  }

  override add(query: Query<any, any, any, any>): void {
    this.persistor.add(query)
    super.add(query)
  }

  override remove(query: Query<any, any, any, any>): void {
    super.remove(query)
    this.persistor.removed(query)
  }

  override notify(event: QueryCacheNotifyEvent) {
    super.notify(event)

    if (event.type === 'updated') {
      const query = event.query
      this.persistor.updated(query)
    } else if (event.type === 'observerResultsUpdated') {
      const query = event.query
      this.persistor.updated(query)
    }
  }
}
