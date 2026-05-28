import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tus from 'tus-js-client'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { API_BASE } from '../utils/api'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function UploadView() {
  const navigate = useNavigate()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Compression States
  const [compressVideo, setCompressVideo] = useState(true)
  const [compressionQuality, setCompressionQuality] = useState<'standard' | 'high'>('standard')
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [compressorStatus, setCompressorStatus] = useState<string>('')
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: string
    compressedSize: string
    savings: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<tus.Upload | null>(null)
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg())

  const compressVideoFile = async (inputFile: File): Promise<File> => {
    setIsCompressing(true)
    setCompressionProgress(0)
    setCompressorStatus('Initializing WebAssembly engine...')

    const ffmpeg = ffmpegRef.current

    if (!ffmpeg.loaded) {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })
      } catch (err: any) {
        throw new Error(`Failed to load WebAssembly engine from CDN: ${err.message || err}. Ensure your internet connection is active.`)
      }
    }

    // Set up progress listener
    ffmpeg.on('progress', ({ progress }) => {
      setCompressionProgress(Math.round(progress * 100))
    })

    setCompressorStatus('Reading video file...')
    const inputExt = inputFile.name.split('.').pop() || 'mp4'
    const inputName = `input.${inputExt}`
    const outputName = 'output.mp4'

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile))

    setCompressorStatus('Compressing video frames locally...')
    const crf = compressionQuality === 'standard' ? '28' : '23'
    const preset = compressionQuality === 'standard' ? 'veryfast' : 'fast'

    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', preset,
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      outputName
    ])

    setCompressorStatus('Packaging output stream...')
    const data = await ffmpeg.readFile(outputName)
    const compressedBlob = new Blob([data as any], { type: 'video/mp4' })

    // Check stats
    const originalMB = (inputFile.size / (1024 * 1024)).toFixed(1)
    const compressedMB = (compressedBlob.size / (1024 * 1024)).toFixed(1)
    const savings = Math.round(((inputFile.size - compressedBlob.size) / inputFile.size) * 100)

    setCompressionStats({
      originalSize: `${originalMB} MB`,
      compressedSize: `${compressedMB} MB`,
      savings: `${savings}%`
    })

    // Cleanup FS
    try {
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } catch (e) {
      console.warn('Failed to delete virtual file', e)
    }

    return new File([compressedBlob], inputFile.name, { type: 'video/mp4' })
  }

  const startUpload = useCallback(
    (selectedFile: File) => {
      setError(null)
      setProgress(0)
      setIsUploading(true)

      const footageUID = generateUUID()

      const upload = new tus.Upload(selectedFile, {
        endpoint: `${API_BASE}/files/`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 50 * 1024 * 1024, // 50 MB chunks
        metadata: {
          filename: `${footageUID}.mp4`,
          filetype: selectedFile.type || 'video/mp4',
          classify: 'true',
          similarity_threshold: '0.85',
          conf_threshold: '0.25',
          iou_threshold: '0.45',
          padding: '10',
          remote_output: 'true',
          remote_endpoint: 'https://dummyjson.com/c/a716-9f12-4ca7-b9da',
          footage_uid: footageUID,
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
          navigate(`/processing/${footageUID}`)
        },
      })

      uploadRef.current = upload
      upload.start()
    },
    [navigate]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setCompressionStats(null)
    setCompressionProgress(0)
    setError(null)
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
    setCompressionStats(null)
    setCompressionProgress(0)
    setError(null)
  }

  async function handleSubmit() {
    if (!file) return

    let fileToUpload = file

    if (compressVideo) {
      try {
        const compressed = await compressVideoFile(file)
        fileToUpload = compressed
      } catch (err: any) {
        console.error('[Compression] Error, falling back to original file upload:', err)
        setError(`Local compression failed: ${err.message || err}. Uploading your original file instead.`)
        fileToUpload = file
      } finally {
        setIsCompressing(false)
      }
    }

    startUpload(fileToUpload)
  }

  function handleCancel() {
    if (isCompressing) {
      try {
        ffmpegRef.current.terminate()
        ffmpegRef.current = new FFmpeg()
      } catch (e) {
        console.error('Error terminating FFmpeg', e)
      }
      setIsCompressing(false)
      setProgress(0)
      setFile(null)
    } else {
      uploadRef.current?.abort()
      setIsUploading(false)
      setProgress(0)
      setFile(null)
    }
  }

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null
  const isLargeFile = file ? file.size > 200 * 1024 * 1024 : false

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 24px',
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
      {!isUploading && !isCompressing && (
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

      {/* Compression Options Panel */}
      {file && !isUploading && !isCompressing && (
        <div className="card" style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--color-surface-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>
              <input
                type="checkbox"
                checked={compressVideo}
                onChange={(e) => setCompressVideo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
              Compress video before upload (Highly Recommended)
            </label>
            <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--color-surface-green)', color: 'var(--color-card-green)', fontWeight: 600 }}>
              Saves Bandwidth
            </span>
          </div>

          {compressVideo && (
            <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="compressionQuality"
                    value="standard"
                    checked={compressionQuality === 'standard'}
                    onChange={() => setCompressionQuality('standard')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Standard Compression (Faster, ~70% smaller)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  <input
                    type="radio"
                    name="compressionQuality"
                    value="high"
                    checked={compressionQuality === 'high'}
                    onChange={() => setCompressionQuality('high')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  High Quality (Slower, ~50% smaller)
                </label>
              </div>

              {isLargeFile && (
                <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff7e6', border: '1px solid #ffe7b8', color: '#b25900', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>⚠️</span>
                  <div>
                    <strong>Large file detected ({fileSizeMB} MB):</strong> Compression inside the browser runs in WebAssembly and is constrained by browser memory. We recommend skipping compression or ensuring your browser tab has sufficient memory.
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--color-surface-light)', paddingTop: '12px', fontSize: '13px', color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ℹ️</span>
            Compression runs entirely locally on your device using WebAssembly. Your files are never sent to third parties, ensuring maximum privacy.
          </div>
        </div>
      )}

      {/* Compression progress */}
      {isCompressing && (
        <div className="card" style={{ width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sidebar-status-dot processing" style={{ width: '12px', height: '12px' }} />
              ⚡ Compressing video locally…
            </span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{compressionProgress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${compressionProgress}%` }} />
          </div>
          <p className="body-small" style={{ color: 'var(--color-primary-mid)', fontWeight: 500 }}>
            {compressorStatus}
          </p>
          <p className="body-small" style={{ fontSize: '12px' }}>
            Processing on-device via WebAssembly. Please keep this tab active.
          </p>
          <button
            className="btn-ghost"
            style={{ alignSelf: 'flex-start' }}
            onClick={handleCancel}
          >
            Cancel Compression
          </button>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="card" style={{ width: '100%', padding: '32px' }}>
          {compressionStats && (
            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-green)', border: '1px solid #cce8b5', color: 'var(--color-card-green)', fontSize: '13px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontWeight: 600 }}>🎉 Video Compressed Successfully!</div>
              <div>
                Reduced size from <strong>{compressionStats.originalSize}</strong> to <strong>{compressionStats.compressedSize}</strong> (<strong>{compressionStats.savings} saved</strong>). This will upload significantly faster!
              </div>
            </div>
          )}
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
          <button
            className="btn-ghost"
            style={{ marginTop: '16px' }}
            onClick={handleCancel}
          >
            Cancel Upload
          </button>
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
