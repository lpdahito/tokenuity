'use client'

import { useEffect, useState } from 'react'
import type { Dashboard } from './../dashboard'

export function useDashboard(initial: Dashboard) {
  const [data, setData] = useState(initial)

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      try {
        const res = await fetch('/api/v1/dashboard', { signal: controller.signal })
        if (res.ok) setData(await res.json())
      } catch {}
      timer = setTimeout(poll, 10_000)
    }

    timer = setTimeout(poll, 10_000)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  return data
}