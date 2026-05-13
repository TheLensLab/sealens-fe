import type { ProgressData, SpeciesEntry, VideoSummary } from './types'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export async function fetchProgress(name: string): Promise<ProgressData> {
  const res = await fetch(`${BASE}/check_progress/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<ProgressData>
}

export async function reassignFish(payload: {
  uploadName: string
  imageURL: string
  species: SpeciesEntry
  toFamilyName?: string
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/api/fish/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<{ success: boolean; message: string }>
}

export interface FishCatalogFamily {
  uid: string
  latinName: string
  commonName: string
  imageUrl: string
  sourceUrl: string
  attribution: string
  species: SpeciesEntry[]
}

export type SortField = 'name' | 'createdAt' | 'status' | 'totalDetections' | 'familyCount' | 'totalFish' | 'fileSize'
export type SortOrder = 'asc' | 'desc'

export interface FetchVideosParams {
  page?: number
  limit?: number
  sortBy?: SortField
  sortOrder?: SortOrder
}

export async function fetchVideosList(params?: FetchVideosParams): Promise<VideoSummary[]> {
  const query = new URLSearchParams()
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.limit != null) query.set('limit', String(params.limit))
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder)

  const qs = query.toString()
  const res = await fetch(`${BASE}/api/videos${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as { data?: VideoSummary[] }
  return json.data ?? []
}

export async function fetchFishDatabase(): Promise<FishCatalogFamily[]> {
  const res = await fetch(`${BASE}/api/fish-species/database`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as { data?: { catalog?: FishCatalogFamily[] } }
  return json.data?.catalog ?? []
}
