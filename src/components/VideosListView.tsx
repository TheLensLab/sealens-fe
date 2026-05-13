import { useEffect, useMemo, useState } from 'react'
import { fetchVideosList } from '../api'
import type { SortField, SortOrder } from '../api'
import type { VideoSummary } from '../types'

interface VideosListViewProps {
  onSelectVideo: (name: string) => void
  onUploadNew: () => void
}

const PAGE_SIZE = 12

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'totalDetections', label: 'Detections' },
  { value: 'familyCount', label: 'Families' },
  { value: 'totalFish', label: 'Fish Count' },
  { value: 'fileSize', label: 'File Size' },
]

const MB = 1024 * 1024
type SizeFilter = 'all' | 'small' | 'medium' | 'large'
const SIZE_OPTIONS: { value: SizeFilter; label: string; min: number; max: number }[] = [
  { value: 'all', label: 'Any size', min: 0, max: Infinity },
  { value: 'small', label: 'Small (< 50 MB)', min: 0, max: 50 * MB },
  { value: 'medium', label: 'Medium (50–200 MB)', min: 50 * MB, max: 200 * MB },
  { value: 'large', label: 'Large (> 200 MB)', min: 200 * MB, max: Infinity },
]

function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${(bytes / (1024 * MB)).toFixed(2)} GB`
}

function compareFn(a: VideoSummary, b: VideoSummary, field: SortField, order: SortOrder): number {
  let cmp = 0
  switch (field) {
    case 'name':
      cmp = a.displayName.localeCompare(b.displayName)
      break
    case 'createdAt': {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      cmp = da - db
      break
    }
    case 'status':
      cmp = a.status.localeCompare(b.status)
      break
    case 'totalDetections':
      cmp = a.totalDetections - b.totalDetections
      break
    case 'familyCount':
      cmp = a.familyCount - b.familyCount
      break
    case 'totalFish':
      cmp = a.totalFish - b.totalFish
      break
    case 'fileSize':
      cmp = (a.fileSize ?? 0) - (b.fileSize ?? 0)
      break
  }
  return order === 'asc' ? cmp : -cmp
}

function StatusBadge({ status }: { status: string }) {
  const isFinished = status === 'Finished'
  const isFailed = status === 'Failed'
  const bg = isFinished
    ? 'var(--color-surface-green)'
    : isFailed
    ? 'var(--color-surface-peach)'
    : 'var(--color-primary-bg)'
  const color = isFinished
    ? 'var(--color-card-green)'
    : isFailed
    ? 'var(--color-card-red)'
    : 'var(--color-primary)'

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: bg,
        color,
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      {isFinished ? 'Complete' : isFailed ? 'Failed' : 'Processing'}
    </span>
  )
}

function VideoCard({ video, onSelect }: { video: VideoSummary; onSelect: () => void }) {
  const [imgError, setImgError] = useState(false)

  const date = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <button
      onClick={onSelect}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-white)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          aspectRatio: '16/9',
          backgroundColor: 'var(--color-surface-light)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {video.thumbnail && !imgError ? (
          <img
            src={video.thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: '36px', opacity: 0.4 }}>🎬</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-black)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
            title={video.displayName}
          >
            {video.displayName}
          </p>
          <StatusBadge status={video.status} />
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-subtle)' }}>
          <span>{video.totalDetections} detections</span>
          <span>{video.familyCount} families</span>
          <span>{video.totalFish} fish</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--color-subtle)',
            marginTop: 'auto',
          }}
        >
          {date && <span>{date}</span>}
          {formatBytes(video.fileSize) && <span>{formatBytes(video.fileSize)}</span>}
        </div>
      </div>
    </button>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  // Build page numbers with ellipsis
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        marginTop: '32px',
      }}
    >
      <button
        className="btn-ghost"
        style={{ padding: '6px 10px', fontSize: '13px' }}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '6px 4px', color: 'var(--color-subtle)', fontSize: '13px' }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: p === page ? 600 : 400,
              fontFamily: 'inherit',
              backgroundColor: p === page ? 'var(--color-primary)' : 'transparent',
              color: p === page ? 'var(--color-white)' : 'var(--color-mid)',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => {
              if (p !== page) e.currentTarget.style.backgroundColor = 'var(--color-surface-light)'
            }}
            onMouseLeave={(e) => {
              if (p !== page) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn-ghost"
        style={{ padding: '6px 10px', fontSize: '13px' }}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

export default function VideosListView({ onSelectVideo, onUploadNew }: VideosListViewProps) {
  const [videos, setVideos] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchVideosList({ sortBy, sortOrder })
      .then((data) => {
        if (!cancelled) {
          setVideos(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [sortBy, sortOrder])

  // Reset to page 1 whenever search, sort, or size filter changes
  useEffect(() => { setPage(1) }, [search, sortBy, sortOrder, sizeFilter])

  const sorted = useMemo(
    () => [...videos].sort((a, b) => compareFn(a, b, sortBy, sortOrder)),
    [videos, sortBy, sortOrder],
  )

  const filtered = useMemo(() => {
    const sizeOpt = SIZE_OPTIONS.find((o) => o.value === sizeFilter) ?? SIZE_OPTIONS[0]
    return sorted.filter((v) => {
      if (search) {
        const q = search.toLowerCase()
        if (!v.displayName.toLowerCase().includes(q) && !v.name.toLowerCase().includes(q)) {
          return false
        }
      }
      if (sizeFilter !== 'all') {
        if (v.fileSize == null) return false
        if (v.fileSize < sizeOpt.min || v.fileSize >= sizeOpt.max) return false
      }
      return true
    })
  }, [sorted, search, sizeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const finishedCount = videos.filter((v) => v.status === 'Finished').length

  function toggleSortOrder() {
    setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  const selectStyle: React.CSSProperties = {
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-surface-light)',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--color-dark)',
    backgroundColor: 'var(--color-white)',
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ marginBottom: '4px' }}>Video Library</h2>
          <p className="body-large" style={{ color: 'var(--color-subtle)' }}>
            {finishedCount} of {videos.length} videos processed
          </p>
        </div>
        <button className="btn-primary" onClick={onUploadNew}>
          + Upload New Video
        </button>
      </div>

      {/* Search + Sort controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            maxWidth: '400px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-surface-light)',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-subtle)', whiteSpace: 'nowrap' }}>
            Size
          </label>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
            style={selectStyle}
          >
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label style={{ fontSize: '13px', color: 'var(--color-subtle)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            style={selectStyle}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            style={{
              ...selectStyle,
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Result summary when searching */}
      {!loading && search && (
        <p className="body-small" style={{ marginBottom: '16px' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* Pagination summary */}
      {!loading && filtered.length > PAGE_SIZE && (
        <p className="body-small" style={{ marginBottom: '16px', color: 'var(--color-subtle)' }}>
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} videos
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ fontSize: '18px', color: 'var(--color-subtle)' }}>Loading videos...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fff0f0',
            border: '1px solid #ffd0d0',
            color: '#c00',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          Failed to load videos: {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && videos.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</p>
          <h3 style={{ marginBottom: '8px' }}>No videos yet</h3>
          <p className="body-large">Upload a video to get started with fish detection.</p>
        </div>
      )}

      {/* No search results */}
      {!loading && filtered.length === 0 && videos.length > 0 && search && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-subtle)' }}>
          <p>No videos matching "{search}"</p>
        </div>
      )}

      {/* Video grid — paginated */}
      {!loading && paged.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {paged.map((video) => (
            <VideoCard
              key={video.name}
              video={video}
              onSelect={() => onSelectVideo(video.name)}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {!loading && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}
