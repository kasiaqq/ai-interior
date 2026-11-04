import { defineStore } from 'pinia'
import type { ChangeDescription, PhotoAnalysis, RoomTypeId, StyleId } from '#shared/types'

export interface SessionPhoto {
  blob: Blob
  url: string
  fileName: string
  fileSize: number
  width: number
  height: number
}

export interface SessionResult {
  id: string
  style: StyleId
  roomType: RoomTypeId
  blob: Blob
  url: string
  description: ChangeDescription | null
  createdAt: number
}

const MAX_COMPARED = 2

/** Everything lives in memory only: a refresh or closed tab ends the session. */
export const useSessionStore = defineStore('session', {
  state: () => ({
    photo: null as SessionPhoto | null,
    analysis: null as PhotoAnalysis | null,
    roomType: null as RoomTypeId | null,
    style: null as StyleId | null,
    results: [] as SessionResult[],
    reportCount: 0,
    compareIds: [] as string[],
  }),

  getters: {
    resultById: (state) => (id: string) => state.results.find((r) => r.id === id),
    variantNumber: (state) => (id: string) => {
      const result = state.results.find((r) => r.id === id)
      if (!result) return 0
      return state.results.filter((r) => r.style === result.style).indexOf(result) + 1
    },
  },

  actions: {
    setPhoto(photo: Omit<SessionPhoto, 'url'>) {
      this.reset()
      this.photo = { ...photo, url: URL.createObjectURL(photo.blob) }
    },
    setAnalysis(analysis: PhotoAnalysis) {
      this.analysis = analysis
    },
    setRoomType(roomType: RoomTypeId) {
      this.roomType = roomType
    },
    setStyle(style: StyleId) {
      this.style = style
    },
    addResult(result: Pick<SessionResult, 'style' | 'roomType' | 'blob' | 'description'>): SessionResult {
      const created: SessionResult = {
        ...result,
        id: crypto.randomUUID(),
        url: URL.createObjectURL(result.blob),
        createdAt: Date.now(),
      }
      this.results.push(created)
      return created
    },
    registerReport() {
      this.reportCount++
    },
    toggleCompare(id: string) {
      if (this.compareIds.includes(id)) this.compareIds = this.compareIds.filter((c) => c !== id)
      else if (this.compareIds.length < MAX_COMPARED) this.compareIds.push(id)
    },
    reset() {
      for (const url of [this.photo?.url, ...this.results.map((r) => r.url)]) if (url) URL.revokeObjectURL(url)
      this.$reset()
    },
  },
})
