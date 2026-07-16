import { useState, useRef, useCallback } from 'react'
import type { ParsedNovel } from '../utils/novelParser'
import { supabase } from '../lib/supabase'
import ChapterSidebar from './ChapterSidebar'
import NovelContent from './NovelContent'
import EmotionPanel from './EmotionPanel'

interface Props {
  novel: ParsedNovel
  onReset: () => void
  onGoLibrary?: () => void
}

export default function ReaderLayout({ novel, onReset, onGoLibrary }: Props) {
  const [activeChapterId, setActiveChapterId] = useState(novel.chapters[0]?.id ?? '')
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [emotionOpen, setEmotionOpen] = useState(true)
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'done'>('idle')
  const contentRef = useRef<{ scrollToParagraph: (id: string) => void }>(null)

  const handleShare = useCallback(async () => {
    if (shareState !== 'idle') return
    setShareState('loading')
    const { error } = await supabase.from('books').insert({
      title: novel.title,
      uploader: '匿名',
      chapter_count: novel.chapters.length,
      moment_count: novel.emotionMoments.length,
      file_content: novel.rawText,
    })
    setShareState(error ? 'idle' : 'done')
    if (error) alert('分享失败，请稍后重试')
  }, [novel, shareState])

  const handleChapterClick = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId)
    const chapter = novel.chapters.find(c => c.id === chapterId)
    if (chapter?.paragraphs[0]) {
      contentRef.current?.scrollToParagraph(chapter.paragraphs[0].id)
    }
  }, [novel.chapters])

  const handleChapterMarkClick = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId)
    const chapter = novel.chapters.find(c => c.id === chapterId)
    if (chapter?.paragraphs[0]) {
      contentRef.current?.scrollToParagraph(chapter.paragraphs[0].id)
    }
  }, [novel.chapters])

  const handleMomentClick = useCallback((paragraphId: string) => {
    setActiveParagraphId(paragraphId)
    contentRef.current?.scrollToParagraph(paragraphId)
    for (const ch of novel.chapters) {
      if (ch.paragraphs.some(p => p.id === paragraphId)) {
        setActiveChapterId(ch.id)
        break
      }
    }
  }, [novel.chapters])

  const handleMomentEnter = useCallback((paragraphId: string) => {
    setActiveParagraphId(paragraphId)
    for (const ch of novel.chapters) {
      if (ch.paragraphs.some(p => p.id === paragraphId)) {
        setActiveChapterId(ch.id)
        break
      }
    }
  }, [novel.chapters])

  // Derive the active emotion color for chapter sidebar accent
  const activeMomentColor = novel.emotionMoments.find(m => m.paragraphId === activeParagraphId)?.color ?? '#b8a0e0'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Rainbow accent line — top brand stripe */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #96cfa0, #b8a0e0, #ebb0c8, #96aed8, #ecc888)',
        flexShrink: 0,
      }} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 shrink-0"
              style={{ paddingTop: '10px', paddingBottom: '10px', borderBottom: '1px solid #f0f0ee' }}>
        <div className="flex items-center gap-3">
          {/* Logo icon with soft bg */}
          <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: '#f0efed' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              <path d="M10 9l5 3-5 3V9z" fill="#555" stroke="none"/>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: '#111' }}>智阅</span>
          <span style={{ color: '#e0ddd8', fontSize: '13px' }}>·</span>
          <span className="text-sm truncate max-w-xs" style={{ color: '#888' }}>{novel.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={shareState !== 'idle'}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5"
            style={{
              color: shareState === 'done' ? '#96cfa0' : '#888',
              background: 'transparent',
              border: `1px solid ${shareState === 'done' ? '#96cfa0' : '#e8e6e2'}`,
            }}
            onMouseEnter={e => {
              if (shareState === 'idle') {
                (e.currentTarget as HTMLElement).style.background = '#f5f4f2'
                ;(e.currentTarget as HTMLElement).style.color = '#444'
              }
            }}
            onMouseLeave={e => {
              if (shareState === 'idle') {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = '#888'
              }
            }}
          >
            {shareState === 'done' ? (
              <>✓ 已分享到书城</>
            ) : shareState === 'loading' ? (
              <>分享中…</>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                分享到书城
              </>
            )}
          </button>

          {onGoLibrary && (
            <button
              onClick={onGoLibrary}
              className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ color: '#999', background: 'transparent' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#f5f4f2'
                ;(e.currentTarget as HTMLElement).style.color = '#444'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = '#999'
              }}
            >
              书城
            </button>
          )}

          <button
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ color: '#999', background: 'transparent' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#f5f4f2'
              ;(e.currentTarget as HTMLElement).style.color = '#444'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#999'
            }}
          >
            更换小说
          </button>
        </div>
      </header>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        <ChapterSidebar
          chapters={novel.chapters}
          activeChapterId={activeChapterId}
          activeMomentColor={activeMomentColor}
          onChapterClick={handleChapterClick}
          chapterMarks={novel.chapterMarks}
        />
        <NovelContent
          ref={contentRef}
          chapters={novel.chapters}
          activeParagraphId={activeParagraphId}
          onChapterVisible={setActiveChapterId}
          onScrollProgress={setScrollProgress}
          moments={novel.emotionMoments}
          chapterMarks={novel.chapterMarks}
          scrollProgress={scrollProgress}
          onMomentClick={handleMomentClick}
          onMomentEnter={handleMomentEnter}
          onChapterMarkClick={handleChapterMarkClick}
        />
        <EmotionPanel
          moments={novel.emotionMoments}
          chapterMarks={novel.chapterMarks}
          activeParagraphId={activeParagraphId}
          onMomentClick={handleMomentClick}
          onChapterMarkClick={handleChapterMarkClick}
          isOpen={emotionOpen}
          onToggle={() => setEmotionOpen(o => !o)}
        />
      </div>
    </div>
  )
}
