import { useState } from 'react'
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import UploadView from './pages/UploadView'
import ProgressView from './pages/ProgressView'
import ResultsView from './pages/ResultsView'
import VideosListView from './pages/VideosListView'
import SignIn from './pages/SignIn'
import OnboardingForm from './pages/OnboardingForm'

function useBreadcrumb(): string {
  const { pathname } = useLocation()
  if (pathname === '/upload') return 'Upload'
  if (pathname === '/library') return 'balls'
  if (pathname.startsWith('/processing/')) {
    const name = decodeURIComponent(pathname.slice('/processing/'.length))
    return `Processing — ${name.replace(/_/g, ' ')}`
  }
  if (pathname.startsWith('/results/')) {
    const name = decodeURIComponent(pathname.slice('/results/'.length))
    return `Analysis Results — ${name.replace(/_/g, ' ')}`
  }
  return ''
}

function AppLayout() {
  const navigate = useNavigate()
  const breadcrumb = useBreadcrumb()

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <header className="toolbar">
          <div className="toolbar-left">
            <button
              className="toolbar-nav-btn"
              onClick={() => navigate(-1)}
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="toolbar-nav-btn"
              onClick={() => navigate(1)}
              title="Forward"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <span className="toolbar-title">{breadcrumb}</span>
          </div>

          <div className="toolbar-right">
            <span className="badge">ML-Powered Detection</span>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ProtectedRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  return isAuthenticated ? <Outlet /> : <Navigate to="/sign-in" replace />
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn onSignIn={() => setIsAuthenticated(true)} />} />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/onboarding" element={<OnboardingForm />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadView />} />
          <Route path="/processing/:name" element={<ProgressView />} />
          <Route path="/results/:name" element={<ResultsView />} />
          <Route path="/library" element={<VideosListView />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/upload" replace />} />
    </Routes>
  )
}
