import type { Lesson, Track } from './types'
import { track0 } from '../content/track0'
import { track1 } from '../content/track1'
import { track2 } from '../content/track2'
import { track3 } from '../content/track3'
import { track4 } from '../content/track4'
import { track5 } from '../content/track5'
import { track6 } from '../content/track6'
import { track7 } from '../content/track7'
import { track8 } from '../content/track8'
import { track9 } from '../content/track9'

export const tracks: Track[] = [
  track0,
  track1,
  track2,
  track3,
  track4,
  track5,
  track6,
  track7,
  track8,
  track9,
]

export interface FlatLesson {
  track: Track
  lesson: Lesson
  globalIndex: number
}

export const flatLessons: FlatLesson[] = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ track, lesson, globalIndex: 0 })),
)
flatLessons.forEach((f, i) => (f.globalIndex = i))

export const totalLessons = flatLessons.length

export function findLesson(
  trackId: string | null,
  lessonId: string | null,
): FlatLesson | null {
  if (!trackId) return null
  if (!lessonId) {
    const t = tracks.find((tr) => tr.id === trackId)
    if (!t) return null
    return (
      flatLessons.find(
        (f) => f.track.id === trackId && f.lesson.id === t.lessons[0].id,
      ) ?? null
    )
  }
  return (
    flatLessons.find((f) => f.track.id === trackId && f.lesson.id === lessonId) ??
    null
  )
}

export function neighbours(globalIndex: number) {
  return {
    prev: globalIndex > 0 ? flatLessons[globalIndex - 1] : null,
    next:
      globalIndex < flatLessons.length - 1 ? flatLessons[globalIndex + 1] : null,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}
