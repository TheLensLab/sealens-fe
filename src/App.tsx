import { useState } from 'react'
import { fetchProgress } from './api'
import type { AppStage, ProgressData } from './types'
import Sidebar from './components/Sidebar'
import UploadView from './components/UploadView'
import ProgressView from './components/ProgressView'
import ResultsView from './components/ResultsView'
import VideosListView from './components/VideosListView'

const STAGE_TITLES: Record<string, string> = {
  upload: 'Upload',
  uploading: 'Uploading',
  processing: 'Processing',
  results: 'Analysis Results',
  library: 'Video Library',
}

export default function App() {
  const [stage, setStage] = useState<AppStage>('upload')
  const [uploadName, setUploadName] = useState<string>('')
  const [results, setResults] = useState<ProgressData | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)

  function handleUploadStart(cleanName: string) {
    setUploadName(cleanName)
    setStage('uploading')
  }

  function handleUploadComplete(cleanName: string) {
    setUploadName(cleanName)
    setStage('processing')
  }

  function handleProcessingDone(data: ProgressData) {
    setResults(data)
    setStage('results')
  }

  function handleReset() {
    setStage('upload')
    setUploadName('')
    setResults(null)
  }

  function handleNavigate(target: AppStage) {
    if (target === 'upload') {
      handleReset()
    } else if (target === 'library') {
      setStage('library')
      setUploadName('')
      setResults(null)
    }
  }

  async function handleSelectVideo(name: string) {
    setLoadingVideo(true)
    try {
      const data = await fetchProgress(name)
      setUploadName(name)
      if (data.stage === 'Finished' || data.processPrecentage >= 100) {
        setResults(data)
        setStage('results')
      } else if (data.stage === 'Failed') {
        setResults(data)
        setStage('results')
      } else {
        setStage('processing')
      }
    } catch {
      setUploadName(name)
      setStage('processing')
    } finally {
      setLoadingVideo(false)
    }
  }

  const breadcrumb = uploadName
    ? `${STAGE_TITLES[stage] ?? stage} — ${uploadName.replace(/_/g, ' ')}`
    : STAGE_TITLES[stage] ?? stage

  return (
    <div className="app-shell">
      <Sidebar stage={stage} onNavigate={handleNavigate} />

      <div className="main-area">
        {/* Top toolbar */}
        <header className="toolbar">
          <div className="toolbar-left">
            <button
              className="toolbar-nav-btn"
              onClick={handleReset}
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="toolbar-nav-btn"
              disabled
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

        {/* Main content */}
        <main className="content-area">
          {(stage === 'upload' || stage === 'uploading') && (
            <UploadView
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {stage === 'processing' && (
            <ProgressView
              uploadName={uploadName}
              onDone={handleProcessingDone}
            />
          )}

          {stage === 'results' && results && (
            <ResultsView
              data={results}
              uploadName={uploadName}
              onReset={handleReset}
            />
          )}

          {stage === 'library' && (
            <>
              {loadingVideo && (
                <div className="loading-overlay">
                  Loading video results...
                </div>
              )}
              <VideosListView
                onSelectVideo={handleSelectVideo}
                onUploadNew={handleReset}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
