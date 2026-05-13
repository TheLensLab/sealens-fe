import { useState } from 'react'
import type { FishFamily, FishImageData, ProgressData, ReassignTarget, SpeciesEntry } from '../types'
import ReassignModal from './ReassignModal'

interface ResultsViewProps {
  data: ProgressData
  uploadName: string
  onReset: () => void
}

function ConfidencePill({ pct }: { pct: number }) {
  const color =
    pct >= 0.7 ? 'var(--color-card-green)' : pct >= 0.45 ? '#7c5c00' : 'var(--color-card-red)'
  const bg =
    pct >= 0.7
      ? 'var(--color-surface-green)'
      : pct >= 0.45
      ? '#fff8e0'
      : 'var(--color-surface-peach)'

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: bg,
        color,
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      {Math.round(pct * 100)}%
    </span>
  )
}

function FishCard({
  image,
  uploadName,
  familyName,
  onReassign,
}: {
  image: FishImageData
  uploadName: string
  familyName: string
  onReassign: (target: ReassignTarget) => void
}) {
  const [imgError, setImgError] = useState(false)
  const topGuess = image.confidence[0]

  return (
    <div
      className="card"
      style={{ overflow: 'visible', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <div
        style={{
          aspectRatio: '4/3',
          backgroundColor: 'var(--color-surface-light)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {image.imageURL && !imgError ? (
          <img
            src={image.imageURL}
            alt="fish crop"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🐟
          </div>
        )}

        {/* Detection confidence overlay */}
        {image.objectDetection != null && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
            }}
          >
            <ConfidencePill pct={image.objectDetection} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <p style={{ fontSize: '11px', color: 'var(--color-subtle)', marginBottom: '4px' }}>
          {image.timestamp}
        </p>
        {topGuess && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topGuess.familyName}
            </p>
            <ConfidencePill pct={topGuess.classifyConfidence} />
          </div>
        )}
      </div>

      {/* Reassign button */}
      {image.imageURL && (
        <button
          className="btn-ghost"
          style={{ margin: '0 12px 12px', fontSize: '12px', padding: '5px 10px' }}
          onClick={() =>
            onReassign({
              uploadName,
              imageURL: image.imageURL!,
              fishID: '',
              currentFamily: familyName,
            })
          }
        >
          Reassign
        </button>
      )}
    </div>
  )
}

function FamilySection({
  family,
  uploadName,
  onReassign,
}: {
  family: FishFamily
  uploadName: string
  onReassign: (target: ReassignTarget) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const allImages: FishImageData[] = family.individualFish.flatMap((f) => f.fish)

  return (
    <section style={{ marginBottom: '40px' }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 16px',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <h3 style={{ fontSize: '22px', fontStyle: 'italic' }}>{family.familyName}</h3>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-primary-bg)',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 600,
            fontStyle: 'normal',
          }}
        >
          {family.fishCount} fish
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--color-subtle)', fontSize: '18px' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          {allImages.map((img, i) => (
            <FishCard
              key={img.fishImageID ?? i}
              image={img}
              uploadName={uploadName}
              familyName={family.familyName}
              onReassign={onReassign}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function ResultsView({ data, uploadName, onReset }: ResultsViewProps) {
  const [reassignTarget, setReassignTarget] = useState<ReassignTarget | null>(null)
  const [families, setFamilies] = useState<FishFamily[]>(data.data.fishFamilies)

  const { annotatedVideoURL, originalVideo, totalDetections, videoMetadata } = data.data
  const duration = videoMetadata?.duration_seconds
    ? `${Math.round(videoMetadata.duration_seconds)}s`
    : null
  const resolution = videoMetadata?.resolution
    ? `${videoMetadata.resolution.width}×${videoMetadata.resolution.height}`
    : null

  function handleReassignSuccess(imageURL: string, newFamily: string, species: SpeciesEntry) {
    setFamilies((prev) =>
      prev.map((fam) => ({
        ...fam,
        individualFish: fam.individualFish.map((fish) => ({
          ...fish,
          fish: fish.fish.map((img) =>
            img.imageURL === imageURL
              ? {
                  ...img,
                  confidence: [{ familyName: newFamily, classifyConfidence: 1.0 }, ...img.confidence],
                }
              : img
          ),
          assignedSpecies: fish.fish.some((i) => i.imageURL === imageURL) ? species : fish.assignedSpecies,
          assignedFamilyName: fish.fish.some((i) => i.imageURL === imageURL) ? newFamily : fish.assignedFamilyName,
        })),
      }))
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ marginBottom: '4px' }}>Analysis Results</h2>
          <p className="body-large" style={{ fontStyle: 'italic' }}>
            {uploadName.replace(/_/g, ' ')}
          </p>
        </div>
        <button className="btn-primary" onClick={onReset}>
          ← Analyse Another Video
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {[
          { label: 'Total Detections', value: totalDetections ?? '—' },
          { label: 'Fish Families', value: families.length },
          { label: 'Individual Fish', value: families.reduce((s, f) => s + f.fishCount, 0) },
          ...(duration ? [{ label: 'Video Duration', value: duration }] : []),
          ...(resolution ? [{ label: 'Resolution', value: resolution }] : []),
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            <p className="stat-number" style={{ fontSize: '36px', marginBottom: '4px' }}>
              {stat.value}
            </p>
            <p className="body-small">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Video players */}
      {(annotatedVideoURL || originalVideo) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: annotatedVideoURL && originalVideo ? '1fr 1fr' : '1fr',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {annotatedVideoURL && (
            <div>
              <p style={{ fontWeight: 600, marginBottom: '10px' }}>Annotated Video</p>
              <video
                src={annotatedVideoURL}
                controls
                style={{ width: '100%', borderRadius: 'var(--radius-lg)', backgroundColor: '#000' }}
              />
            </div>
          )}
          {originalVideo && (
            <div>
              <p style={{ fontWeight: 600, marginBottom: '10px' }}>Original Video</p>
              <video
                src={originalVideo}
                controls
                style={{ width: '100%', borderRadius: 'var(--radius-lg)', backgroundColor: '#000' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Fish families */}
      {families.length > 0 ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h3>Detected Families</h3>
            <p className="body-small">Click a fish to reassign its classification</p>
          </div>

          {families.map((family) => (
            <FamilySection
              key={family.familyName}
              family={family}
              uploadName={uploadName}
              onReassign={setReassignTarget}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
          <h3 style={{ marginBottom: '8px' }}>No fish detected</h3>
          <p className="body-large">Try adjusting the confidence threshold or check the video quality.</p>
        </div>
      )}

      {/* Reassign modal */}
      {reassignTarget && (
        <ReassignModal
          target={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onSuccess={handleReassignSuccess}
        />
      )}
    </div>
  )
}
