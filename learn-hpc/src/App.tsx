import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRoute } from './lib/router'
import { findLesson } from './lib/curriculum'
import { Sidebar } from './components/Sidebar'
import { Home } from './components/Home'
import { LessonView } from './components/LessonView'

export function App() {
  const route = useRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const item = findLesson(route.trackId, route.lessonId)

  return (
    <div className="scanlines flex min-h-screen bg-graticule">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-line bg-panel/60 backdrop-blur lg:block">
        <Sidebar activeTrack={route.trackId} activeLesson={route.lessonId} />
      </aside>

      {/* mobile sidebar overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-panel lg:hidden"
            >
              <Sidebar
                activeTrack={route.trackId}
                activeLesson={route.lessonId}
                onNavigate={() => setMenuOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main */}
      <main className="min-w-0 flex-1">
        {/* mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted"
          >
            ☰
          </button>
          <span className="font-display text-sm font-700 tracking-wide text-ink">
            HPC<span className="text-signal"> CLASSIFIER LAB</span>
          </span>
        </div>

        <AnimatePresence mode="wait">
          {item ? (
            <LessonView
              key={`${route.trackId}-${route.lessonId}`}
              item={item}
            />
          ) : (
            <Home key="home" />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
