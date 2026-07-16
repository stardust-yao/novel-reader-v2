import { useState, useEffect } from 'react'
import { supabase, type BookRecord } from '../lib/supabase'

interface Props {
  onReadBook: (title: string, content: string) => void
  onUpload: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  return `${days} 天前`
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#f5f3ef' }}>
      <div className="h-5 rounded-lg mb-3" style={{ background: '#ebe8e2', width: '65%' }} />
      <div className="h-3 rounded mb-2" style={{ background: '#ebe8e2', width: '40%' }} />
      <div className="h-3 rounded mb-6" style={{ background: '#ebe8e2', width: '30%' }} />
      <div className="h-8 rounded-xl" style={{ background: '#ebe8e2', width: '100%' }} />
    </div>
  )
}

export default function LibraryPage({ onReadBook, onUpload }: Props) {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readingId, setReadingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('books')
        .select('id, title, uploader, chapter_count, moment_count, created_at')
        .order('created_at', { ascending: false })
      if (error) {
        setError('加载失败，请检查网络或稍后重试')
      } else {
        setBooks(data ?? [])
      }
      setLoading(false)
    }
    fetchBooks()
  }, [])

  async function handleRead(book: BookRecord) {
    setReadingId(book.id)
    const { data, error } = await supabase
      .from('books')
      .select('file_content')
      .eq('id', book.id)
      .single()
    if (error || !data) {
      setReadingId(null)
      alert('加载书籍失败，请重试')
      return
    }
    onReadBook(book.title, data.file_content)
    setReadingId(null)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#faf9f7' }}>
      {/* Rainbow accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #96cfa0, #b8a0e0, #ebb0c8, #96aed8, #ecc888)', flexShrink: 0 }} />

      {/* Header */}
      <header
        className="flex items-center justify-between px-8 shrink-0"
        style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0ee' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: '#f0efed' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              <path d="M10 9l5 3-5 3V9z" fill="#555" stroke="none"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: '#111' }}>智阅</span>
          <span style={{ color: '#ddd', fontSize: 13 }}>·</span>
          <span className="text-sm font-medium" style={{ color: '#888' }}>书城</span>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: '#1c1a18', color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1c1a18')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          上传我的书
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ padding: '32px 8%' }}>
        {/* Section title */}
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 24, fontWeight: 500, color: '#1c1a18', marginBottom: 4 }}>
            共享书库
          </h1>
          <p style={{ color: '#aaa', fontSize: 13 }}>
            {loading ? '加载中…' : error ? error : `共 ${books.length} 本书`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div style={{ fontSize: 40 }}>⚠️</div>
            <p style={{ color: '#aaa', fontSize: 14 }}>{error}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            {/* Illustration */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #b8a0e0, #ebb0c8, #96aed8)',
                filter: 'blur(8px)', opacity: 0.4,
              }} />
              <svg style={{ position: 'absolute', inset: 0, margin: 'auto' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b8a0e0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div className="text-center">
              <p style={{ color: '#555', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>暂无共享书目</p>
              <p style={{ color: '#bbb', fontSize: 13 }}>成为第一个分享者，让更多人发现好书</p>
            </div>
            <button
              onClick={onUpload}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ background: '#1c1a18', color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1c1a18')}
            >
              上传并分享
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {books.map(book => (
              <div
                key={book.id}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200"
                style={{ background: 'white', border: '1px solid #f0eee9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
              >
                <div className="flex-1">
                  <h2 style={{
                    fontFamily: 'Lora, Georgia, serif',
                    fontSize: 16, fontWeight: 600, color: '#1c1a18',
                    marginBottom: 8, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {book.title}
                  </h2>
                  <div className="flex items-center gap-3" style={{ fontSize: 11, color: '#bbb' }}>
                    <span>{book.chapter_count} 章</span>
                    <span>·</span>
                    <span>{book.moment_count} 个情感节点</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: '#ccc' }}>{timeAgo(book.created_at)}</span>
                  <button
                    onClick={() => handleRead(book)}
                    disabled={readingId === book.id}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: readingId === book.id ? '#f0eeea' : '#1c1a18',
                      color: readingId === book.id ? '#aaa' : 'white',
                    }}
                    onMouseEnter={e => {
                      if (readingId !== book.id) (e.currentTarget as HTMLElement).style.background = '#333'
                    }}
                    onMouseLeave={e => {
                      if (readingId !== book.id) (e.currentTarget as HTMLElement).style.background = '#1c1a18'
                    }}
                  >
                    {readingId === book.id ? '加载中…' : '开始阅读'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
