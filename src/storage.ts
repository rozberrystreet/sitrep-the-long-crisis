// One read/write transaction compares and replaces the whole record atomically.
async function access(
  expected?: string | null,
  replacement?: string | null
): Promise<string | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sitrep-issues', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('desk')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const writing = expected !== undefined
      const tx = db.transaction('desk', writing ? 'readwrite' : 'readonly')
      const store = tx.objectStore('desk')
      const read = store.get('current')
      let result: string | null = null
      let conflict = false
      read.onsuccess = () => {
        result = read.result ?? null
        if (!writing) return
        if (expected !== result) {
          conflict = true
          tx.abort()
          return
        }
        result = replacement ?? null
        if (result === null) store.delete('current')
        else store.put(result, 'current')
      }
      tx.oncomplete = () => resolve(result)
      tx.onabort = () =>
        reject(
          new Error(
            conflict
              ? 'Another tab changed this issue. Reload to read its latest edition.'
              : 'Device storage could not commit this change. Try again.'
          )
        )
    })
  } finally {
    db.close()
  }
}
export const readSave = () => access()
export function replaceRecord(expected: string | null, replacement: string | null) {
  return access(expected, replacement)
}
