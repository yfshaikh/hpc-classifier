import { useCallback, useEffect, useState } from 'react'

const KEY = 'hpc-lab-progress-v1'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function save(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

let store = load()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function useProgress() {
  const [, force] = useState(0)

  useEffect(() => {
    const cb = () => force((n) => n + 1)
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }, [])

  const isDone = useCallback((id: string) => store.has(id), [])

  const toggle = useCallback((id: string) => {
    const next = new Set(store)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    store = next
    save(store)
    emit()
  }, [])

  const markDone = useCallback((id: string) => {
    if (store.has(id)) return
    const next = new Set(store)
    next.add(id)
    store = next
    save(store)
    emit()
  }, [])

  const reset = useCallback(() => {
    store = new Set()
    save(store)
    emit()
  }, [])

  return { done: store, isDone, toggle, markDone, reset }
}
