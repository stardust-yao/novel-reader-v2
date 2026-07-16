import { useEffect, useRef } from 'react'
import type { Chapter, ChapterMark } from '../utils/novelParser'

interface Props {
  chapters: Chapter[]
  activeChapterId: string
  activeMomentColor: string
  onChapterClick: (id: string) => void
  chapterMarks: ChapterMark[]
}

export default function ChapterSidebar({ chapters, activeChapterId, activeMomentColor, onChapterClick, chapterMarks }: Props) {
  const containerRef = useRef<HTMLElement>(null)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const activeIndex = chapters.findIndex(c => c.id === activeChapterId)
  const markedChapterIds = new Set(chapterMarks.map(m => m.chapterId))

  useEffect(() => {
    const btn = buttonRefs.current.get(activeChapterId)
    const container = containerRef.current
    if (!btn || !container) return
    const btnTop = btn.offsetTop
    const btnH = btn.offsetHeight
    const cH = container.clientHeight
    const scrollTop = container.scrollTop
    if (btnTop < scrollTop + 40 || btnTop + btnH > scrollTop + cH - 40) {
      container.scrollTo({ top: btnTop - cH / 2 + btnH / 2, behavior: 'smooth' })
    }
  }, [activeChapterId])

  return (
    <aside
      ref={containerRef as React.RefObject<HTMLElement>}
      className="w-60 shrink-0 flex flex-col overflow-y-auto scroll-hidden"
      style={{ borderRight: '1px solid #eeece8', background: 'var(--surface-sidebar)' }}
    >
      <div className="px-5 pt-5 pb-3 shrink-0">
        <p className="text-xs font-semibold" style={{ color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>目录</p>
        <p className="text-xs mt-1" style={{ color: '#bbb' }}>
          {activeIndex >= 0 ? `第 ${activeIndex + 1} / ${chapters.length} 章` : `共 ${chapters.length} 章`}
          {chapterMarks.length > 0 && <span style={{ color: '#e8829a', marginLeft: 6 }}>· 🚗 {chapterMarks.length}</span>}
        </p>
      </div>

      <nav className="flex-1 px-3 pb-5">
        {chapters.map((ch) => {
          const isActive = ch.id === activeChapterId
          const isMarked = markedChapterIds.has(ch.id)
          return (
            <button
              key={ch.id}
              ref={el => {
                if (el) buttonRefs.current.set(ch.id, el)
                else buttonRefs.current.delete(ch.id)
              }}
              onClick={() => onChapterClick(ch.id)}
              className="w-full text-left rounded-xl mb-0.5 transition-all duration-150 overflow-hidden"
              style={{
                background: isActive ? '#eeecea' : 'transparent',
                display: 'flex',
                alignItems: 'stretch',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f0eeea'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {/* Colored left accent bar — only on active */}
              <div style={{
                width: '3px',
                flexShrink: 0,
                borderRadius: '3px 0 0 3px',
                background: isActive ? activeMomentColor : 'transparent',
                transition: 'background 0.3s',
              }} />
              <span
                className="block py-2.5 px-3 text-xs leading-snug line-clamp-2 flex-1"
                style={{
                  color: isActive ? '#111' : '#666',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {ch.title}
                {isMarked && <span style={{ marginLeft: 4, fontSize: '10px' }}>🚗</span>}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
