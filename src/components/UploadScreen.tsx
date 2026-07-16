import { useRef } from 'react'

interface Props {
  onFile: (file: File) => void
  onBack?: () => void
}

export default function UploadScreen({ onFile, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #faf9f7 0%, #f0edf8 50%, #f5f0ea 100%)' }}
    >
      {/* Animated blobs */}
      <div style={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, #b8a0e0, #ebb0c8, #96aed8, transparent 70%)',
        filter: 'blur(72px)', opacity: 0.32,
        top: '5%', right: '8%',
        animation: 'float 9s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 60%, #96cfa0, #ecc888, transparent 70%)',
        filter: 'blur(56px)', opacity: 0.28,
        bottom: '10%', left: '6%',
        animation: 'floatAlt 11s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, #e098a8, transparent 70%)',
        filter: 'blur(48px)', opacity: 0.22,
        bottom: '20%', right: '20%',
        animation: 'float 13s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />

      {/* Logo + back */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            <path d="M10 9l5 3-5 3V9z" fill="#555" stroke="none"/>
          </svg>
        </div>
        <span className="font-semibold text-sm" style={{ color: '#444' }}>智阅</span>
        {onBack && (
          <>
            <span style={{ color: '#ddd', fontSize: 13 }}>·</span>
            <button
              onClick={onBack}
              className="text-xs transition-colors duration-150"
              style={{ color: '#bbb' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#555')}
              onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
            >
              ← 返回书城
            </button>
          </>
        )}
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-7 w-full max-w-md px-4 relative z-10">
        <div className="text-center">
          <h1 style={{
            fontFamily: 'Lora, Georgia, serif',
            fontSize: '38px',
            fontWeight: 500,
            color: '#1c1a18',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '10px',
          }}>
            智能小说阅读器
          </h1>
          <p style={{ color: '#999', fontSize: '15px', lineHeight: 1.6 }}>
            上传小说，AI 解析感情关键节点
          </p>
        </div>

        {/* Upload button */}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-200"
          style={{
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(0,0,0,0.07)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.75)'
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <span style={{ color: '#bbb', fontSize: '14px', flex: 1 }}>点击选择 TXT 格式小说文件…</span>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#1c1a18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
        </button>

        {/* Feature hint card */}
        <div style={{
          width: '100%',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px', color: '#222', marginBottom: '5px' }}>不只是阅读，而是理解。</p>
            <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.6, maxWidth: '220px' }}>
              自动标注初遇、告白、冲突等情感节点，在正文中精准定位
            </p>
          </div>
          {/* Animated color blob */}
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #b8a0e0, #ebb0c8, #96aed8)',
              filter: 'blur(6px)',
              animation: 'float 6s ease-in-out infinite alternate',
            }}/>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: '#ccc' }}>也可将文件拖拽到页面任意位置</p>
      </div>

      <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={handleChange} />
    </div>
  )
}
