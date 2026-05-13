interface NavbarProps {
  onLogoClick: () => void
  onLibraryClick?: () => void
}

export default function Navbar({ onLogoClick, onLibraryClick }: NavbarProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-surface-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          className="nav-logo"
          onClick={onLogoClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontSize: '24px' }}>🐟</span>
          <span className="logo-text">SeaLens</span>
        </button>

        {onLibraryClick && (
          <button
            onClick={onLibraryClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-mid)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Video Library
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge">ML-Powered Detection</span>
      </div>
    </nav>
  )
}
