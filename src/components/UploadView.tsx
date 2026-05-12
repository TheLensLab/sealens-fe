import { useRef, useState, useCallback } from 'react'
import * as tus from 'tus-js-client'

interface UploadViewProps {
  onUploadStart: (cleanName: string) => void
  onUploadComplete: (cleanName: string) => void
}

function deriveCleanName(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, '')
  return withoutExt.replace(/ /g, '_').replace(/\./g, '_')
}

export default function UploadView({ onUploadStart, onUploadComplete }: UploadViewProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<tus.Upload | null>(null)

  const startUpload = useCallback(
    (selectedFile: File) => {
      setError(null)
      setProgress(0)
      setIsUploading(true)
      const cleanName = deriveCleanName(selectedFile.name)
      onUploadStart(cleanName)

      const upload = new tus.Upload(selectedFile, {
        endpoint: '/files/',
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 50 * 1024 * 1024, // 50 MB chunks
        metadata: {
          filename: selectedFile.name,
          filetype: selectedFile.type || 'video/mp4',
        },
        onError(err) {
          console.error('[TUS] Upload error', err)
          setError(`Upload failed: ${err.message}`)
          setIsUploading(false)
        },
        onProgress(bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100)
          setProgress(pct)
        },
        onSuccess() {
          setProgress(100)
          setIsUploading(false)
          onUploadComplete(cleanName)
        },
      })

      uploadRef.current = upload
      upload.start()
    },
    [onUploadStart, onUploadComplete]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (!dropped.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    setFile(dropped)
  }

  function handleSubmit() {
    if (!file) return
    startUpload(file)
  }

  function handleCancel() {
    uploadRef.current?.abort()
    setIsUploading(false)
    setProgress(0)
    setFile(null)
  }

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '560px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>
          Identify marine fish <span style={{ color: 'var(--color-primary)' }}>automatically</span>
        </h1>
        <p className="body-large">
          Upload an underwater video and SeaLens will detect, track, and classify every fish
          using state-of-the-art computer vision.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['YOLO v12 Detection', 'Siamese Tracking', 'Family Classification'].map((f) => (
          <span
            key={f}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-surface-green)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-card-green)',
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Drop zone */}
      {!isUploading && (
        <div
          className={`upload-zone${dragging ? ' drag-over' : ''}`}
          style={{ width: '100%' }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '40px' }}>🎬</span>
              <p style={{ fontWeight: 600, color: 'var(--color-black)' }}>{file.name}</p>
              <p className="body-small">{fileSizeMB} MB</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleSubmit() }}>
                  Analyse Video
                </button>
                <button
                  className="btn-ghost"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '48px' }}>📹</span>
              <p style={{ fontWeight: 600, fontSize: '17px', color: 'var(--color-black)' }}>
                Drop your video here
              </p>
              <p className="body-small">or click to browse — MP4, MOV, AVI up to 20 GB</p>
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="card" style={{ width: '100%', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>
              {file?.name}
            </span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="body-small" style={{ marginTop: '12px' }}>
            Uploading via TUS resumable protocol…
          </p>
          {isUploading && (
            <button
              className="btn-ghost"
              style={{ marginTop: '16px' }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fff0f0',
            border: '1px solid #ffd0d0',
            color: '#c00',
            fontSize: '14px',
            width: '100%',
          }}
        >
          {error}
        </div>
      )}

      {/* Info cards */}
      {!isUploading && !file && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', width: '100%' }}>
          {[
            { icon: '🔍', title: 'Object Detection', desc: 'YOLOv12x identifies every fish in every frame' },
            { icon: '🏷️', title: 'Classification', desc: 'Siamese networks group fish by family and species' },
            { icon: '📊', title: 'Results Export', desc: 'Review detections and correct assignments manually' },
          ].map((c) => (
            <div key={c.title} className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{c.icon}</div>
              <p style={{ fontWeight: 600, marginBottom: '6px' }}>{c.title}</p>
              <p className="body-small">{c.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
