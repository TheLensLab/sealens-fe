interface NavbarProps {
  onLogoClick: () => void
}

export default function Navbar({ onLogoClick }: NavbarProps) {
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
      <button
        className="nav-logo"
        onClick={onLogoClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontSize: '24px' }}>🐟</span>
        <span className="logo-text">SeaLens</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="badge">ML-Powered Detection</span>
      </div>
    </nav>
  )
}
