import { useEffect, useState } from 'react'

export interface Route {
  trackId: string | null
  lessonId: string | null
}

function parse(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (!hash) return { trackId: null, lessonId: null }
  const [trackId, lessonId] = hash.split('/')
  return { trackId: trackId || null, lessonId: lessonId || null }
}

export function navigate(trackId?: string, lessonId?: string) {
  if (!trackId) {
    window.location.hash = '/'
  } else if (!lessonId) {
    window.location.hash = `/${trackId}`
  } else {
    window.location.hash = `/${trackId}/${lessonId}`
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
