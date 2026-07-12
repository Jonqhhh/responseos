import { useState, useEffect } from 'react'

export function useData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err  => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, deps)

  function refetch() {
    setLoading(true)
    fetcher()
      .then(result => { setData(result); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }

  return { data, loading, error, refetch }
}