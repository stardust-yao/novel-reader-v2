import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import type { Chapter, EmotionMoment, ChapterMark } from '../utils/novelParser'

interface Props {
  chapters: Chapter[]
  activeParagraphId: string | null
  onChapterVisible: (chapterId: string) => void
  onScrollProgress: (progress: number) => void
  moments: EmotionMoment[]
  chapterMarks: ChapterMark[]
  scrollProgress: number
  onMomentClick: (paragraphId: string) => void
  onMomentEnter: (paragraphId: string) => void
  onChapterMarkClick: (chapterId: string) => void
}

export interface NovelContentHandle {
  scrollToParagraph: (id: string) => void
}

const MIN_H = 0.04
const MAX_H = 0.18

function resolveColor(color: string): string {
  if (color.startsWith('#')) return color
  if (color.startsWith('var(')) {
    const name = color.slice(4, -1)
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }
  return color
}

const NovelContent = forwardRef<NovelContentHandle, Props>(function NovelContent(
  { chapters, activeParagraphId, onChapterVisible, onScrollProgress, moments = [], chapterMarks = [], scrollProgress, onMomentClick, onMomentEnter = () => {}, onChapterMarkClick },
  ref
) {
  const scrollRef = useRef<HTMLElement>(null)
  const paragraphRefs = useRef<Map<string, HTMLElement>>(new Map())
  const lastActiveMomentRef = useRef<string | null>(null)
  const onScrollProgressRef = useRef(onScrollProgress)
  const onMomentEnterRef = useRef(onMomentEnter)
  const chapterMarksRef = useRef(chapterMarks)
  const chaptersRef = useRef(chapters)
  onScrollProgressRef.current = onScrollProgress
  onMomentEnterRef.current = onMomentEnter
  chapterMarksRef.current = chapterMarks
  chaptersRef.current = chapters

  useImperativeHandle(ref, () => ({
    scrollToParagraph(id: string) {
      const el = paragraphRefs.current.get(id)
      const container = scrollRef.current
      if (!el || !container) return
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const target = container.scrollTop + (elRect.top - containerRect.top) - container.clientHeight / 2 + elRect.height / 2
      container.scrollTo({ top: target, behavior: 'smooth' })
    },
  }))

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      if (max <= 0) return
      const progress = el.scrollTop / max
      onScrollProgressRef.current(progress)
      // Track chapter marks for active state
      for (const m of chapterMarksRef.current) {
        if (progress >= m.startProgress && progress <= m.endProgress) {
          if (lastActiveMomentRef.current !== m.chapterId) {
            lastActiveMomentRef.current = m.chapterId
            // Find the first paragraph of this chapter and notify
            const ch = chaptersRef.current.find(c => c.id === m.chapterId)
            if (ch?.paragraphs[0]) {
              onMomentEnterRef.current(ch.paragraphs[0].id)
            }
          }
          break
        }
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterMarks, chapters])

  useEffect(() => {
    const chapterEls: Array<{ id: string; el: HTMLElement }> = []
    chapters.forEach(ch => {
      const firstP = ch.paragraphs[0]
      if (firstP) {
        const el = paragraphRefs.current.get(firstP.id)
        if (el) chapterEls.push({ id: ch.id, el })
      }
    })
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const found = chapterEls.find(c => c.el === entry.target)
            if (found) onChapterVisible(found.id)
          }
        }
      },
      { root: scrollRef.current, threshold: 0, rootMargin: '0px 0px -70% 0px' }
    )
    chapterEls.forEach(({ el }) => observer.observe(el))
    return () => observer.disconnect()
  }, [chapters, onChapterVisible])

  const lineTopPct = Math.min(97, Math.max(2, scrollProgress * 100))
  const activeMomentColor = moments.find(m => m.paragraphId === activeParagraphId)?.color ?? '#b8a0e0'
  const activeColorHex = resolveColor(activeMomentColor)

  return (
    <div className="flex-1 relative" style={{ minHeight: 0, background: 'var(--surface-content)' }}>
      <style>{`.novel-scroll::-webkit-scrollbar { display: none; }`}</style>

      <main
        ref={scrollRef as React.RefObject<HTMLElement>}
        className="novel-scroll absolute inset-0 overflow-y-auto"
        style={{ scrollbarWidth: 'none', paddingRight: '44px', background: 'var(--surface-content)' }}
      >
        <div style={{ padding: '48px 8%' }}>
          {chapters.map((ch) => (
            <section key={ch.id} className="mb-16">
              {/* Chapter heading — left accent bar, larger, warmer */}
              <div className="flex items-center gap-3 mb-8">
                <div style={{
                  width: '4px', height: '22px', borderRadius: '3px',
                  background: activeColorHex,
                  transition: 'background 0.5s',
                  flexShrink: 0,
                }} />
                <h2 style={{
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#222',
                  letterSpacing: '0.02em',
                  margin: 0,
                }}>
                  {ch.title}
                </h2>
              </div>

              {ch.paragraphs.map((p) => {
                const isActive = p.id === activeParagraphId
                return (
                  <p
                    key={p.id}
                    ref={el => {
                      if (el) paragraphRefs.current.set(p.id, el)
                      else paragraphRefs.current.delete(p.id)
                    }}
                    className="novel-text mb-6 rounded-lg px-3 -mx-3 transition-all duration-500"
                    style={{
                      background: isActive ? `${activeColorHex}14` : 'transparent',
                      boxShadow: isActive ? `inset 3px 0 0 ${activeColorHex}` : 'inset 3px 0 0 transparent',
                      paddingLeft: isActive ? '18px' : '12px',
                    }}
                  >
                    {p.text}
                  </p>
                )
              })}
            </section>
          ))}
        </div>
      </main>

      {/* Reading progress bar — overlaid on right edge */}
      <div
        className="absolute flex flex-col pointer-events-none"
        style={{ right: '6px', top: '18px', bottom: '18px', width: '28px' }}
      >
        <div
          className="relative flex-1 rounded-2xl overflow-visible"
          style={{
            background: '#ede9e2',
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.07)',
          }}
        >
          {/* Chapter-level marks: vertical capsules covering full chapter scroll range */}
          {chapterMarks.map((m) => {
            const isActive = scrollProgress >= m.startProgress && scrollProgress <= m.endProgress
            const topPct = m.startProgress * 100
            const heightPct = Math.max(2, (m.endProgress - m.startProgress) * 100) // min 2% for visibility
            const color = resolveColor(m.color)
            return (
              <button
                key={m.chapterId}
                onClick={() => onChapterMarkClick(m.chapterId)}
                className="absolute transition-all duration-250 pointer-events-auto group"
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  left: '5px', right: '5px',
                  borderRadius: '50px',
                  background: color,
                  boxShadow: isActive
                    ? `0 2px 10px ${color}99`
                    : '0 1px 3px rgba(0,0,0,0.10)',
                  zIndex: isActive ? 10 : 1,
                  transform: isActive ? 'scaleX(1.3)' : 'scaleX(1)',
                  overflow: 'visible',
                }}
                onMouseEnter={e => {
                  const btn = e.currentTarget as HTMLElement
                  if (!isActive) btn.style.transform = 'scaleX(1.15)'
                  const label = btn.querySelector('.pill-label') as HTMLElement | null
                  if (label) label.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget as HTMLElement
                  if (!isActive) btn.style.transform = 'scaleX(1)'
                  const label = btn.querySelector('.pill-label') as HTMLElement | null
                  if (label) label.style.opacity = '0'
                }}
              >
                {/* Floating label on hover */}
                <span
                  className="pill-label"
                  style={{
                    position: 'absolute',
                    right: 'calc(100% + 8px)',
                    top: '50%',
                    transform: 'translateY(-50%) scaleX(0.8)',
                    whiteSpace: 'nowrap',
                    fontSize: '10px',
                    background: 'white',
                    color: '#555',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.13)',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    pointerEvents: 'none',
                    transformOrigin: 'right center',
                  }}
                >
                  {m.label}
                </span>
              </button>
            )
          })}

          {/* Red reading position indicator */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ top: `${lineTopPct}%`, zIndex: 20, transform: 'translateY(-50%)' }}
          >
            {/* Diamond marker */}
            <div style={{
              position: 'absolute',
              left: '0px', top: '50%',
              transform: 'translate(-30%, -50%) rotate(45deg)',
              width: '6px', height: '6px',
              borderRadius: '1px',
              background: '#e84040',
              boxShadow: '0 0 0 1.5px white, 0 0 4px rgba(232,64,64,0.45)',
            }} />
            {/* Fading line */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, #e84040 40%, transparent)',
              marginLeft: '2px',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default NovelContent
