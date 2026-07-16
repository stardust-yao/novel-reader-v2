import type { EmotionMoment, ChapterMark } from '../utils/novelParser'

interface Props {
  moments: EmotionMoment[]
  chapterMarks: ChapterMark[]
  activeParagraphId: string | null
  onMomentClick: (paragraphId: string) => void
  onChapterMarkClick: (chapterId: string) => void
  isOpen: boolean
  onToggle: () => void
}

function resolveColor(color: string): string {
  if (color.startsWith('#')) return color
  if (color.startsWith('var(')) {
    const name = color.slice(4, -1)
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }
  return color
}

function colorWithAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const LEGEND = [
  { color: '#e8829a', label: '车车🔞' },
  { color: '#c4a0d8', label: '亲密' },
  { color: '#f0c87a', label: '暧昧' },
  { color: '#96b8e8', label: '告白' },
  { color: '#e09070', label: '冲突' },
  { color: '#96cfa0', label: '转折' },
]

export default function EmotionPanel({ moments, chapterMarks, activeParagraphId, onMomentClick, onChapterMarkClick, isOpen, onToggle }: Props) {
  return (
    <aside
      className="shrink-0 flex flex-col overflow-hidden transition-all duration-300"
      style={{
        width: isOpen ? '300px' : '40px',
        borderLeft: '1px solid #eeece8',
        background: 'var(--surface-panel)',
      }}
    >
      {/* Collapsed */}
      {!isOpen && (
        <div className="flex flex-col items-center py-5 gap-4 flex-1">
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: '#eeecea' }}
            title="展开情感脉络"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-[10px] tracking-widest" style={{ color: '#bbb', writingMode: 'vertical-rl' }}>情感脉络</span>
        </div>
      )}

      {/* Expanded */}
      {isOpen && (
        <>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 shrink-0 flex items-start justify-between"
               style={{ borderBottom: '1px solid #eeece8' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-semibold" style={{ color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>情感脉络</p>
                {/* Rainbow dot accent */}
                <div className="flex gap-0.5">
                  {['#96cfa0','#b8a0e0','#ebb0c8','#96aed8'].map(c => (
                    <div key={c} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                  ))}
                </div>
              </div>
              <p className="text-xs" style={{ color: '#bbb' }}>AI 解析 · {chapterMarks.length} 个车章标记</p>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
              style={{ background: '#eeecea' }}
              title="收起"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Cards — chapter-level marks */}
          <div className="flex-1 overflow-y-auto scroll-hidden py-3 px-3">
            {chapterMarks.map((m) => {
              const isActive = false // will be set by parent via activeParagraphId comparison
              const baseColor = resolveColor(m.color)
              const bgNormal = colorWithAlpha(baseColor, 0.10)
              const bgHover  = colorWithAlpha(baseColor, 0.18)
              const bgActive = colorWithAlpha(baseColor, 0.15)

              return (
                <button
                  key={m.chapterId}
                  onClick={() => onChapterMarkClick(m.chapterId)}
                  className="w-full text-left mb-2 transition-all duration-200 block overflow-hidden"
                  style={{
                    borderRadius: '14px',
                    background: isActive ? bgActive : bgNormal,
                    boxShadow: isActive ? `inset 3px 0 0 ${baseColor}, 0 2px 8px ${colorWithAlpha(baseColor, 0.2)}` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = bgHover
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = bgNormal
                  }}
                >
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-xs font-semibold" style={{ color: '#222' }}>{m.label}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium tabular-nums"
                          style={{ background: colorWithAlpha(resolveColor(m.color), 0.15), color: resolveColor(m.color) }}>
                          {m.score}分
                        </span>
                        <span className="text-[10px] tabular-nums font-medium" style={{ color: '#aaa' }}>
                          {Math.round(m.startProgress * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed pl-4" style={{ color: '#666' }}>
                      {m.description}
                    </p>
                  </div>
                </button>
              )
            })}
            {chapterMarks.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: '#bbb' }}>
                未检测到车章
              </div>
            )}
          </div>

          {/* Legend — pill style */}
          <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid #eeece8' }}>
            <div className="flex flex-wrap gap-1.5">
              {LEGEND.map(({ color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: colorWithAlpha(resolveColor(color), 0.18) }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[10px] font-medium" style={{ color: '#666' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
