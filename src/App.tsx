import { useState, useCallback, useEffect } from 'react'
import UploadScreen from './components/UploadScreen'
import ReaderLayout from './components/ReaderLayout'
import LibraryPage from './components/LibraryPage'
import { parseNovel, type ParsedNovel } from './utils/novelParser'

type Page = 'library' | 'upload' | 'reader'

export default function App() {
  const [page, setPage] = useState<Page>('library')
  const [novel, setNovel] = useState<ParsedNovel | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Test mode: auto-load novel via ?test=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('test') === '1') {
      var x = new XMLHttpRequest()
      x.open('GET', '/novel_full.txt', false)
      try {
        x.send()
        if (x.status === 200) {
          const parsed = parseNovel('初三的六一儿童节', x.responseText)
          setNovel(parsed)
          setPage('reader')
        }
      } catch(e) { console.error('test load failed:', e) }
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      let text = new TextDecoder('utf-8').decode(buffer)
      if (text.includes('\ufffd')) {
        try { text = new TextDecoder('gbk').decode(buffer) } catch { /* keep utf-8 */ }
      }
      const parsed = parseNovel(file.name.replace('.txt', ''), text)
      setNovel(parsed)
      setPage('reader')
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleReadBook = useCallback((title: string, content: string) => {
    const parsed = parseNovel(title, content)
    setNovel(parsed)
    setPage('reader')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.txt')) handleFile(file)
  }, [handleFile])

  if (page === 'reader' && novel) {
    return (
      <ReaderLayout
        novel={novel}
        onReset={() => { setNovel(null); setPage('library') }}
        onGoLibrary={() => setPage('library')}
      />
    )
  }

  if (page === 'upload') {
    return (
      <div
        className="h-screen flex flex-col overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur border-2 border-dashed rounded-2xl px-16 py-10"
                 style={{ borderColor: 'var(--emotion-lavender)' }}>
              <p className="text-lg font-medium" style={{ color: '#555' }}>释放以上传小说</p>
            </div>
          </div>
        )}
        <UploadScreen onFile={handleFile} onBack={() => setPage('library')} />
      </div>
    )
  }

  return (
    <LibraryPage
      onReadBook={handleReadBook}
      onUpload={() => setPage('upload')}
    />
  )
}
