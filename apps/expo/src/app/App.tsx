import React, { useRef, useState, useEffect } from 'react'
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
} from 'react-native'
import { createPersistentQueryCacheForOpSqlite } from '@patwoz/react-query-cache-persistent-adapter-op-sqlite'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'

import {
  ANDROID_DATABASE_PATH,
  IOS_LIBRARY_PATH,
  open,
} from '@op-engineering/op-sqlite'

const db = open({
  name: 'queryCache.sqlite3',
  location: Platform.OS === 'ios' ? IOS_LIBRARY_PATH : ANDROID_DATABASE_PATH,
})

console.log(`db path = "${db.getDbPath()}".`)

db.executeSync(`PRAGMA journal_mode = WAL;`)
db.executeSync(`PRAGMA busy_timeout = 50;`)
db.executeSync(`PRAGMA synchronous = normal;`)
db.executeSync(`PRAGMA cache_size = -20000;`)
db.executeSync(`PRAGMA temp_store = memory;`)
db.executeSync(`PRAGMA foreign_keys = ON;`)
db.executeSync(`PRAGMA mmap_size = 2147483648;`) // 2GB
db.executeSync(`PRAGMA auto_vacuum = INCREMENTAL;`)

const queryCache = createPersistentQueryCacheForOpSqlite(db)

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
    },
  },
})

console.log(db.executeSync(`SELECT * FROM query_cache;`))

export const App = () => {
  const scrollViewRef = useRef<null | ScrollView>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          ref={(ref) => {
            scrollViewRef.current = ref
          }}
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <OpSqliteTestSection />
        </ScrollView>
      </SafeAreaView>
    </QueryClientProvider>
  )
}

const dateQuery = queryOptions({
  queryKey: ['/date'],
  queryFn: () => {
    console.log(`queryFn /date`)
    return new Date().toISOString()
  },
})

const OpSqliteTestSection = () => {
  const [date, setDate] = useState<string>()

  useEffect(() => {
    // Doesn't work after hot reload
    const remove = db.reactiveExecute({
      query: 'SELECT * FROM query_cache WHERE query_hash = ?',
      arguments: ['["/date"]'],
      fireOn: [{ table: 'query_cache' }],
      callback: (response) => {
        const data = JSON.parse(response.rows[0].query_state)
        setDate(data.data)
      },
    })

    return remove
  }, [])

  const { data, refetch } = useQuery(dateQuery)
  console.log(`data="${data}"`)

  useEffect(() => {
    const timer = setInterval(() => {
      refetch()
    }, 5_000)
    return () => {
      clearTimeout(timer)
    }
  }, [refetch])

  const renders = useRef(0)
  useEffect(() => {
    console.log(`renders()`)
    renders.current += 1
  })

  return (
    <View style={styles.section}>
      <Text style={{ marginBottom: 12 }}>Renders: {renders.current}</Text>
      <Text>React Query: useQuery()</Text>
      <View style={styles.codeBlock}>
        <Text style={[styles.monospace]}>RQ Counter: {data}</Text>
      </View>
      <Text>OPSqlite: Reactive Execute</Text>
      <View style={styles.codeBlock}>
        <Text style={[styles.monospace]}>OP Counter: {date}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  codeBlock: {
    backgroundColor: 'rgba(55, 65, 81, 1)',
    marginVertical: 12,
    padding: 12,
    borderRadius: 4,
  },
  monospace: {
    color: '#ffffff',
    fontFamily: 'Courier New',
    marginVertical: 4,
  },
  comment: {
    color: '#cccccc',
  },
  marginBottomSm: {
    marginBottom: 6,
  },
  marginBottomMd: {
    marginBottom: 18,
  },
  marginBottomLg: {
    marginBottom: 24,
  },
  textLight: {
    fontWeight: '300',
  },
  textBold: {
    fontWeight: '500',
  },
  textCenter: {
    textAlign: 'center',
  },
  text2XS: {
    fontSize: 12,
  },
  textXS: {
    fontSize: 14,
  },
  textSm: {
    fontSize: 16,
  },
  textMd: {
    fontSize: 18,
  },
  textLg: {
    fontSize: 24,
  },
  textXL: {
    fontSize: 48,
  },
  textContainer: {
    marginVertical: 12,
  },
  textSubtle: {
    color: '#6b7280',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
  },
  shadowBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  appTitleText: {
    paddingTop: 12,
    fontWeight: '500',
  },
  hero: {
    borderRadius: 12,
    backgroundColor: '#143055',
    padding: 36,
    marginBottom: 24,
  },
  heroTitle: {
    flex: 1,
    flexDirection: 'row',
  },
  heroTitleText: {
    color: '#ffffff',
    marginLeft: 12,
  },
  heroText: {
    color: '#ffffff',
    marginVertical: 12,
  },
  whatsNextButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 8,
    width: '50%',
    marginTop: 24,
  },
  learning: {
    marginVertical: 12,
  },
  love: {
    marginTop: 12,
    justifyContent: 'center',
  },
})

export default App
