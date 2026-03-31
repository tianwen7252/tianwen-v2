import { useState, useEffect, useCallback, useRef } from 'react'
import type { Database } from './lib/database'
import { DEFAULT_CONFIG } from './lib/database'
import { sqliteWasmFactory } from './lib/sqlite-wasm'
import { initSchema } from './lib/schema'

type Status = 'loading' | 'ready' | 'error'

interface TestResult {
  readonly operation: string
  readonly success: boolean
  readonly duration: number
  readonly detail?: string
}

/**
 * POC App — validates SQLite WASM + OPFS in the browser.
 * This is a temporary component for Phase 0 validation only.
 */
export function App() {
  const [status, setStatus] = useState<Status>('loading')
  const [db, setDb] = useState<Database | null>(null)
  const dbRef = useRef<Database | null>(null)
  const [error, setError] = useState<string>('')
  const [results, setResults] = useState<readonly TestResult[]>([])
  const [persistenceCount, setPersistenceCount] = useState<number | null>(null)

  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      // Request persistent storage to prevent iOS 7-day eviction
      if (navigator.storage?.persist) {
        const persisted = await navigator.storage.persist()
        if (!cancelled) setStoragePersisted(persisted)
      }

      // Initialize SQLite WASM database
      try {
        const database = await sqliteWasmFactory.init(DEFAULT_CONFIG)
        if (cancelled) {
          database.close()
          return
        }
        initSchema(sql => database.exec(sql))
        dbRef.current = database
        setDb(database)
        setStatus('ready')

        const existing = database.exec<{ cnt: number }>(
          'SELECT COUNT(*) as cnt FROM commodities',
        )
        setPersistenceCount(existing.rows[0]?.cnt ?? 0)
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
      dbRef.current?.close()
    }
  }, [])

  const runCrudTests = useCallback(() => {
    if (!db) return

    const newResults: TestResult[] = []

    // INSERT test
    const insertStart = performance.now()
    try {
      db.exec(
        `INSERT INTO commodities (id, type_id, name, price, priority, on_market)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['poc-1', 'main-dish', 'POC Test Item', 100, 1, 1],
      )
      newResults.push({
        operation: 'INSERT',
        success: true,
        duration: performance.now() - insertStart,
      })
    } catch (err) {
      newResults.push({
        operation: 'INSERT',
        success: false,
        duration: performance.now() - insertStart,
        detail: String(err),
      })
    }

    // SELECT test
    const selectStart = performance.now()
    try {
      const result = db.exec<{ id: string; name: string; price: number }>(
        'SELECT id, name, price FROM commodities WHERE id = ?',
        ['poc-1'],
      )
      newResults.push({
        operation: 'SELECT',
        success:
          result.rows.length === 1 && result.rows[0]?.name === 'POC Test Item',
        duration: performance.now() - selectStart,
        detail: `Found ${result.rows.length} row(s)`,
      })
    } catch (err) {
      newResults.push({
        operation: 'SELECT',
        success: false,
        duration: performance.now() - selectStart,
        detail: String(err),
      })
    }

    // UPDATE test
    const updateStart = performance.now()
    try {
      db.exec('UPDATE commodities SET price = ? WHERE id = ?', [200, 'poc-1'])
      const verify = db.exec<{ price: number }>(
        'SELECT price FROM commodities WHERE id = ?',
        ['poc-1'],
      )
      newResults.push({
        operation: 'UPDATE',
        success: verify.rows[0]?.price === 200,
        duration: performance.now() - updateStart,
      })
    } catch (err) {
      newResults.push({
        operation: 'UPDATE',
        success: false,
        duration: performance.now() - updateStart,
        detail: String(err),
      })
    }

    // DELETE test
    const deleteStart = performance.now()
    try {
      db.exec('DELETE FROM commodities WHERE id = ?', ['poc-1'])
      const verify = db.exec<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM commodities WHERE id = ?',
        ['poc-1'],
      )
      newResults.push({
        operation: 'DELETE',
        success: verify.rows[0]?.cnt === 0,
        duration: performance.now() - deleteStart,
      })
    } catch (err) {
      newResults.push({
        operation: 'DELETE',
        success: false,
        duration: performance.now() - deleteStart,
        detail: String(err),
      })
    }

    // Bulk INSERT performance test — clean up first to handle re-entrancy
    const bulkStart = performance.now()
    try {
      db.exec("DELETE FROM commodities WHERE id LIKE 'bulk-%'")
      db.exec('BEGIN TRANSACTION')
      for (let i = 0; i < 100; i++) {
        db.exec(
          `INSERT INTO commodities (id, type_id, name, price, priority, on_market)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`bulk-${i}`, 'main-dish', `Bulk Item ${i}`, i * 10, i, 1],
        )
      }
      db.exec('COMMIT')
      const count = db.exec<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM commodities WHERE id LIKE 'bulk-%'",
      )
      newResults.push({
        operation: 'BULK INSERT (100 rows)',
        success: count.rows[0]?.cnt === 100,
        duration: performance.now() - bulkStart,
        detail: `${count.rows[0]?.cnt} rows inserted`,
      })

      // Cleanup bulk data
      db.exec("DELETE FROM commodities WHERE id LIKE 'bulk-%'")
    } catch (err) {
      try {
        db.exec('ROLLBACK')
      } catch {
        /* already committed or no active txn */
      }
      newResults.push({
        operation: 'BULK INSERT (100 rows)',
        success: false,
        duration: performance.now() - bulkStart,
        detail: String(err),
      })
    }

    setResults(newResults)
  }, [db])

  // Persistence test: insert data that survives page reload
  const writePersistenceData = useCallback(() => {
    if (!db) return
    try {
      const timestamp = Date.now()
      db.exec(
        `INSERT OR REPLACE INTO commodities (id, type_id, name, price, priority, on_market)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['persist-test', 'main-dish', `Persisted at ${timestamp}`, 999, 0, 1],
      )
      setPersistenceCount(prev => (prev ?? 0) + 1)
    } catch (err) {
      setError(String(err))
    }
  }, [db])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Tianwen V2 — SQLite WASM + OPFS POC</h1>

      <section>
        <h2>Status</h2>
        <p>
          Database: <strong>{status}</strong>
          {status === 'error' && (
            <span style={{ color: 'red' }}> — {error}</span>
          )}
        </p>
        <p>
          Storage Persistence:{' '}
          <strong>
            {storagePersisted === null
              ? 'Not requested'
              : storagePersisted
                ? 'Granted (protected from eviction)'
                : 'Denied'}
          </strong>
        </p>
        {persistenceCount !== null && (
          <p>
            Existing rows in commodities table:{' '}
            <strong>{persistenceCount}</strong>
            {persistenceCount > 0 && ' (data persisted from previous session!)'}
          </p>
        )}
      </section>

      {status === 'ready' && (
        <>
          <section>
            <h2>CRUD Tests</h2>
            <button onClick={runCrudTests}>Run CRUD Tests</button>
            {results.length > 0 && (
              <table style={{ borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>
                      Operation
                    </th>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>
                      Result
                    </th>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>
                      Duration
                    </th>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.operation}>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>
                        {r.operation}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>
                        {r.success ? 'PASS' : 'FAIL'}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>
                        {r.duration.toFixed(2)}ms
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>
                        {r.detail ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Persistence Test</h2>
            <p>Write data, then reload the page to verify OPFS persistence.</p>
            <button onClick={writePersistenceData}>
              Write Persistence Data
            </button>
          </section>
        </>
      )}
    </div>
  )
}
