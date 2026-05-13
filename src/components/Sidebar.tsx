import type { AppStage } from '../types'

interface SidebarProps {
  stage: AppStage
  onNavigate: (stage: AppStage) => void
}

const NAV_ITEMS: { key: AppStage; label: string; icon: string }[] = [
  { key: 'upload', label: 'Upload', icon: 'arrow.up.doc' },
  { key: 'library', label: 'Video Library', icon: 'film' },
]

function SidebarIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    'arrow.up.doc': 'M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12',
    film: 'M7 4v16M17 4v16M3 8h4m6 0h8M3 12h18M3 16h4m6 0h8M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] ?? ''} />
    </svg>
  )
}

export default function Sidebar({ stage, onNavigate }: SidebarProps) {
  const isActive = (key: AppStage) => {
    if (key === 'upload') return stage === 'upload' || stage === 'uploading'
    if (key === 'library') return stage === 'library'
    return stage === key
  }

  const showProcessing = stage === 'processing'
  const showResults = stage === 'results'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <button
        className="sidebar-logo"
        onClick={() => onNavigate('upload')}
      >
        <span style={{ fontSize: '20px' }}>🐟</span>
        <span className="logo-text" style={{ fontSize: '17px' }}>SeaLens</span>
      </button>

      {/* Favourites section */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">Favourites</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item${isActive(item.key) ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <SidebarIcon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Active session */}
      {(showProcessing || showResults) && (
        <div className="sidebar-section">
          <p className="sidebar-section-label">Current Session</p>
          {showProcessing && (
            <button className="sidebar-item active">
              <span className="sidebar-status-dot processing" />
              <span>Processing</span>
            </button>
          )}
          {showResults && (
            <button className="sidebar-item active">
              <span className="sidebar-status-dot complete" />
              <span>Results</span>
            </button>
          )}
        </div>
      )}

      {/* Tags / status legend */}
      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <p className="sidebar-section-label">Tags</p>
        <div className="sidebar-tag-list">
          <span className="sidebar-tag">
            <span className="sidebar-tag-dot" style={{ backgroundColor: '#34c759' }} />
            Complete
          </span>
          <span className="sidebar-tag">
            <span className="sidebar-tag-dot" style={{ backgroundColor: 'var(--color-primary)' }} />
            Processing
          </span>
          <span className="sidebar-tag">
            <span className="sidebar-tag-dot" style={{ backgroundColor: '#ff3b30' }} />
            Failed
          </span>
        </div>
      </div>

      {/* Badge at bottom */}
      <div className="sidebar-footer">
        <span className="badge" style={{ fontSize: '12px', padding: '4px 10px' }}>ML-Powered</span>
      </div>
    </aside>
  )
}
