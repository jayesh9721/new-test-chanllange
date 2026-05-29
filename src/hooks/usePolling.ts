'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface PollingOptions<T> {
  table: string
  rowId: string | null
  interval?: number
  onDone?: (row: T) => void
}

interface PollingState<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  status: string | null
}

export function usePolling<T extends { status: string }>({
  table,
  rowId,
  interval = 3000,
  onDone,
}: PollingOptions<T>): PollingState<T> {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRow = useCallback(async () => {
    if (!rowId) return
    const { data: row } = await getSupabaseClient()
      .from(table)
      .select('*')
      .eq('id', rowId)
      .single()

    if (!row) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any
    setData(r as T)
    setStatus(r.status as string)

    if (r.status === 'done') {
      onDone?.(r as T)
      return
    }
    if (r.status === 'error') return
    timerRef.current = setTimeout(fetchRow, interval)
  }, [rowId, table, interval, onDone])

  useEffect(() => {
    if (!rowId) return
    fetchRow()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [rowId, fetchRow])

  return {
    data,
    isLoading: status === 'pending' || status === 'processing',
    isError: status === 'error',
    status,
  }
}
