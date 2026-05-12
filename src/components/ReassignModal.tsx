import { useEffect, useState } from 'react'
import { fetchFishDatabase, reassignFish } from '../api'
import type { FishCatalogFamily } from '../api'
import type { ReassignTarget, SpeciesEntry } from '../types'

interface ReassignModalProps {
  target: ReassignTarget
  onClose: () => void
  onSuccess: (imageURL: string, newFamily: string, species: SpeciesEntry) => void
}

export default function ReassignModal({ target, onClose, onSuccess }: ReassignModalProps) {
  const [catalog, setCatalog] = useState<FishCatalogFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<FishCatalogFamily | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFishDatabase()
      .then(setCatalog)
      .catch(() => setError('Could not load species database.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredFamilies = catalog.filter((f) => {
    const q = search.toLowerCase()
    return (
      f.latinName.toLowerCase().includes(q) ||
      f.commonName.toLowerCase().includes(q) ||
      f.species.some(
        (s) =>
          s.latinName.toLowerCase().includes(q) || s.commonName.toLowerCase().includes(q)
      )
    )
  })

  async function handleSave() {
    if (!selectedSpecies) return
    setSaving(true)
    setError(null)
    try {
      const res = await reassignFish({
        uploadName: target.uploadName,
        imageURL: target.imageURL,
        species: selectedSpecies,
        toFamilyName: selectedFamily?.latinName,
      })
      if (res.success) {
        onSuccess(target.imageURL, selectedFamily?.latinName ?? target.currentFamily, selectedSpecies)
        onClose()
      } else {
        setError(res.message || 'Save failed.')
      }
    } catch {
      setError('Network error — could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Reassign Fish</h3>
            <p className="body-small">Currently: {target.currentFamily}</p>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: '4px 10px', fontSize: '18px' }}
          >
            ×
          </button>
        </div>

        {/* Crop preview */}
        {target.imageURL && (
          <img
            src={target.imageURL}
            alt="fish crop"
            style={{
              width: '100%',
              height: '160px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              backgroundColor: 'var(--color-surface-light)',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <input
          type="search"
          placeholder="Search families or species…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedFamily(null); setSelectedSpecies(null) }}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-surface-light)',
            fontSize: '15px',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: '16px',
          }}
        />

        {loading && <p className="body-small">Loading species database…</p>}

        {!loading && !selectedFamily && (
          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredFamilies.slice(0, 40).map((family) => (
              <button
                key={family.uid}
                onClick={() => setSelectedFamily(family)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-surface-light)',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-bg)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
              >
                <img
                  src={family.imageUrl}
                  alt={family.latinName}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-black)' }}>{family.latinName}</p>
                  <p className="body-small">{family.commonName} · {family.species.length} species</p>
                </div>
              </button>
            ))}
            {filteredFamilies.length === 0 && (
              <p className="body-small" style={{ padding: '12px 0' }}>No families match your search.</p>
            )}
          </div>
        )}

        {!loading && selectedFamily && !selectedSpecies && (
          <div>
            <button
              className="btn-secondary"
              onClick={() => setSelectedFamily(null)}
              style={{ marginBottom: '12px' }}
            >
              ← Back to families
            </button>
            <p style={{ fontWeight: 600, marginBottom: '10px' }}>{selectedFamily.latinName}</p>
            <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedFamily.species.map((sp, i) => (
                <button
                  key={sp.uid ?? i}
                  onClick={() => setSelectedSpecies(sp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-surface-light)',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-bg)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', fontStyle: 'italic', color: 'var(--color-black)' }}>
                      {sp.latinName}
                    </p>
                    <p className="body-small">{sp.commonName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && selectedSpecies && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-bg)',
              marginBottom: '16px',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '14px' }}>Selected:</p>
            <p style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>{selectedSpecies.latinName}</p>
            <p className="body-small">{selectedSpecies.commonName}</p>
            <button className="btn-secondary" onClick={() => setSelectedSpecies(null)} style={{ marginTop: '6px', fontSize: '13px' }}>
              Change
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: '#c00', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!selectedSpecies || saving}
          >
            {saving ? 'Saving…' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}
