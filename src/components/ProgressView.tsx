import { useEffect, useRef, useState } from 'react'
import { fetchProgress } from '../api'
import type { ProgressData } from '../types'

interface ProgressViewProps {
  uploadName: string
  onDone: (data: ProgressData) => void
}

const STAGE_LABELS: Record<string, string> = {
  yolo: 'Running YOLO detection',
  classifying: 'Classifying fish families',
  tracking: 'Building tracking database',
  pipeline: 'Running analysis pipeline',
  Finished: 'Processing complete',
  Failed: 'Processing failed',
}

const STEPS = [
  { key: 'upload', label: 'Video uploaded' },
  { key: 'yolo', label: 'Detection' },
  { key: 'classifying', label: 'Classification' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'Finished', label: 'Complete' },
]

function stepIndex(stage: string): number {
  const order = ['upload', 'yolo', 'classifying', 'tracking', 'Finished']
  const idx = order.indexOf(stage)
  return idx === -1 ? 1 : idx
}

export default function ProgressView({ uploadName, onDone }: ProgressViewProps) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dots, setDots] = useState('.')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    dotsRef.current = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => { if (dotsRef.current) clearInterval(dotsRef.current) }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const result = await fetchProgress(uploadName)
        if (cancelled) return
        setData(result)

        const done = result.stage === 'Finished' || result.processPrecentage >= 100
        const failed = result.stage === 'Failed'

        if (done || failed) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (!failed) onDone(result)
          else setError(result.message || 'Processing failed on the server.')
        }
      } catch (err) {
        if (cancelled) return
        console.warn('[poll] error:', err)
        // Keep polling — server may not have the file yet
      }
    }

    // Poll immediately, then every 3 s
    void poll()
    timerRef.current = setInterval(poll, 3000)

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [uploadName, onDone])

  const stage = data?.stage ?? 'yolo'
  const pct = data?.processPrecentage ?? 0
  const stageLabel = STAGE_LABELS[stage] ?? 'Processing'
  const currentStep = stepIndex(stage)

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🐠</div>
        <h2 style={{ marginBottom: '8px' }}>Analysing your video</h2>
        <p className="body-large">{uploadName.replace(/_/g, ' ')}</p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: '100%' }}>
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div
              key={step.key}
              style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: done
                      ? 'var(--color-primary)'
                      : active
                      ? 'var(--color-primary-bg)'
                      : 'var(--color-surface-light)',
                    border: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: done ? '#fff' : active ? 'var(--color-primary)' : 'var(--color-subtle)',
                    transition: 'background-color 0.3s',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: active || done ? 600 : 400,
                    color: active ? 'var(--color-primary)' : done ? 'var(--color-mid)' : 'var(--color-subtle)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: done ? 'var(--color-primary)' : 'var(--color-surface-light)',
                    margin: '0 4px',
                    marginBottom: '20px',
                    transition: 'background-color 0.3s',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="card" style={{ width: '100%', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 600 }}>
            {stageLabel}
            {stage !== 'Finished' && stage !== 'Failed' ? dots : ''}
          </span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {data?.data.totalDetections != null && data.data.totalDetections > 0 && (
          <p className="body-small" style={{ marginTop: '12px' }}>
            {data.data.totalDetections} detections found so far
          </p>
        )}
      </div>

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

      <p className="body-small" style={{ textAlign: 'center', color: 'var(--color-subtle)' }}>
        Large videos may take several minutes to process. This page polls automatically.
      </p>
    </div>
  )
}
