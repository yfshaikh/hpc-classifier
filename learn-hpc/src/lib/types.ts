import type { ReactNode } from 'react'

export type Accent = 'signal' | 'attack' | 'data'

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface ImplementationTask {
  title: string
  description: ReactNode
  files?: string[]
  successCheck?: string
}

export interface Implementation {
  intro?: ReactNode
  tasks: ImplementationTask[]
  estimatedHours?: string
}

export interface VideoLink {
  title: string
  url: string
  duration?: string
  note?: string
}

export interface Lesson {
  id: string
  title: string
  kicker: string
  minutes: number
  body: ReactNode
  quiz?: QuizQuestion[]
  implementation?: Implementation
  videos?: VideoLink[]
}

export interface Track {
  id: string
  index: number
  title: string
  subtitle: string
  accent: Accent
  glyph: string
  /** A short "what you'll be able to do after this module" string for the Home grid */
  outcome?: string
  lessons: Lesson[]
}
