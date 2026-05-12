export interface FishImageData {
  fishImageID?: string
  imageURL: string | null
  timestamp: string
  objectDetection: number | null
  confidence: Array<{
    familyName: string
    classifyConfidence: number
  }>
}

export interface IndividualFish {
  fishID: string
  fish: FishImageData[]
  assignedFamilyName?: string
  assignedSpecies?: SpeciesEntry
  lastReassignedAt?: string
}

export interface FishFamily {
  familyName: string
  fishCount: number
  individualFish: IndividualFish[]
}

export interface VideoMetadata {
  fps?: number
  total_frames?: number
  duration_seconds?: number
  resolution?: { width: number; height: number } | null
}

export interface ProgressData {
  success: boolean
  statusCode: number
  message: string
  processPrecentage: number
  stage: string
  data: {
    annotatedVideoURL: string | null
    originalVideo?: string | null
    fishFamilies: FishFamily[]
    totalDetections: number
    trackingStatistics?: Record<string, unknown> | null
    trackingSummary?: Record<string, unknown> | null
    videoMetadata?: VideoMetadata | null
    processingInfo?: {
      model: string
      created_at?: string
      updated_at?: string
    }
  }
}

export interface SpeciesEntry {
  uid?: string
  latinName: string
  commonName: string
  imageUrl?: string
  sourceUrl?: string
  Attribution?: string
}

export interface FishSpeciesFamily {
  uid: string
  latinName: string
  commonName: string
  imageUrl: string
  sourceUrl: string
  attribution: string
  species: SpeciesEntry[]
}

export type AppStage = 'upload' | 'uploading' | 'processing' | 'results'

export interface ReassignTarget {
  uploadName: string
  imageURL: string
  fishID: string
  currentFamily: string
}
