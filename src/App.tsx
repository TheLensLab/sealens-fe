import { useState } from 'react'
import type { AppStage, ProgressData } from './types'
import Navbar from './components/Navbar'
import UploadView from './components/UploadView'
import ProgressView from './components/ProgressView'
import ResultsView from './components/ResultsView'

export default function App() {
  const [stage, setStage] = useState<AppStage>('upload')
  const [uploadName, setUploadName] = useState<string>('')
  const [results, setResults] = useState<ProgressData | null>(null)

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onLogoClick={handleReset} />

      <main style={{ flex: 1 }}>
        {/* Keep UploadView mounted for both 'upload' and 'uploading' so the
            TUS client instance is not destroyed mid-transfer. */}
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
      </main>
    </div>
  )
}
