export interface Chapter {
  id: string
  title: string
  startIndex: number
  endIndex: number
  paragraphs: Paragraph[]
}

export interface Paragraph {
  id: string
  text: string
  globalIndex: number
}

export interface EmotionMoment {
  id: string
  type: 'explicit' | 'intimate' | 'tension' | 'confession' | 'conflict' | 'turning'
  label: string
  description: string
  paragraphId: string
  progress: number
  lengthRatio: number
  color: string
  score: number // detection confidence 0-100
}

// ─── Chapter-level marks ─────────────────────────────────────────────────────
// A ChapterMark represents a detected "notable" chapter (e.g. 车章) covering
// the full scroll range of that chapter — from its first paragraph to its last.

export interface ChapterMark {
  chapterId: string
  chapterNum: number      // 1-based chapter index
  title: string           // chapter title text
  startProgress: number   // scroll progress at chapter's first paragraph
  endProgress: number     // scroll progress at chapter's last paragraph
  heightRatio: number     // chapter char count / total char count
  score: number           // max paragraph score in this chapter
  color: string
  label: string           // e.g. "🚗 第37章"
  description: string     // brief description
}

export interface ParsedNovel {
  title: string
  rawText: string
  chapters: Chapter[]
  allParagraphs: Paragraph[]
  emotionMoments: EmotionMoment[]
  chapterMarks: ChapterMark[]
}

// ─── Chapter title patterns ───────────────────────────────────────────────────
const CHAPTER_PATTERNS = [
  /^第[零一二三四五六七八九十百千\d]+[章节回]/,
  /^Chapter\s+\d+/i,
  /^CHAPTER\s+\d+/,
  /^\d+[\.、]/,
  /^[上中下]卷/,
  /^番外/,
  /^序章|尾声|楔子|后记/,
]

function isChapterTitle(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 50) return false
  return CHAPTER_PATTERNS.some(p => p.test(trimmed))
}

// ─── 车章 Detection System ────────────────────────────────────────────────────
//
// "车章" (chē zhāng) — Chinese web-novel community term for chapters containing
// explicit or strongly suggestive intimate content. Detection uses a tiered
// keyword scoring model: high-confidence explicit markers score highest, while
// atmospheric/suggestive markers contribute lower scores. A paragraph must reach
// a threshold to be classified.
//
// Tier 1 (score +35): Unambiguous explicit markers
// Tier 2 (score +20): Strong intimate action markers
// Tier 3 (score +10): Suggestive atmosphere / physical sensation markers
// Tier 4 (score +5):  Scene-setting / privacy / vulnerability context
//
// Threshold for 'explicit': score >= 50
// Threshold for 'intimate': score >= 25

const TIER1_EXPLICIT = [
  // Physical union / intercourse euphemisms common in CN web fiction
  /进入|合体|结合|占有|索取|给予|深入|填满|承受|接纳/,
  // Undressing in intimate context
  /脱[下去掉]?(衣|裙|裤|内)|褪[下去]?(衣|裙|裤|内)|撩起(衣|裙)|解开(衣|扣|带)/,
  // Explicit sensation / physiological response
  /呻吟|喘息声|娇喘|低吟|哭腔|颤抖.*身体|身体.*颤抖/,
  // Explicit body focus in intimate context
  /胸口.*起伏|酥麻|颤栗|战栗.*快感|敏感.*触碰/,
]

const TIER2_INTIMATE = [
  // Kissing — deep / passionate
  /深吻|热吻|吻住|吻上|唇.*压|压.*唇|舌尖|齿间/,
  // Physical closeness with clear intimate intent
  /抵着|压[在上]|按[在上]|托起|捧起.*脸|扣住.*腰|搂紧|环住.*腰/,
  // Bedroom / intimate space + person together
  /床[上边沿].*[他她你]|[他她你].*床[上边沿]|倒[在上].*床|被推[进倒]|躺[进下].*怀/,
  // Skin contact
  /肌肤相触|皮肤.*温热|温热.*皮肤|指尖.*滑过|滑过.*肌肤|掌心.*贴|贴.*掌心/,
  // Physical vulnerability / surrender
  /软倒|酸软|无力抵抗|失去力气|腿.*软|腰.*软/,
]

const TIER3_SUGGESTIVE = [
  // Temperature / heat in intimate context
  /燥热|炙热|灼热|滚烫|火热.*靠近|靠近.*温度|体温.*升高/,
  // Breath / heartbeat intimate escalation
  /呼吸.*急促|急促.*呼吸|心跳.*加速|加速.*心跳|喘.*气|气息.*紊乱/,
  // Neck / ear / sensitive areas
  /耳垂|耳根|颈间|颈侧|锁骨|后颈|耳边.*气息|气息.*耳边/,
  // Lips contact (lighter than deep kiss)
  /嘴唇.*触碰|触碰.*嘴唇|唇.*相触|蹭.*唇|唇.*蹭/,
  // Desire / longing explicit
  /想要.*[他她你]|[他她你].*的渴望|欲望.*升腾|忍不住.*靠近/,
  // Darkness / privacy with person
  /黑暗中.*[他她你]|[他她你].*黑暗中|昏暗.*灯光.*[他她你]/,
]

const TIER4_CONTEXT = [
  // Door locking / room privacy
  /锁上.*门|门.*锁上|关上.*门.*[他她你]|反锁/,
  // Intoxication setting the scene
  /喝醉|酒意.*上|醉意.*朦胧|半醉/,
  // Intimate clothing state
  /半敞|半开.*衣|衣衫.*不整|散乱.*衣/,
  // Physical restraint / dominance
  /手腕.*扣住|扣住.*手腕|按住.*不动|动弹不得/,
  // Heightened physical awareness
  /每一寸|每一处|细细.*感受|感受.*每|浑身.*起鸡皮/,
]

function scoreForExplicit(text: string): number {
  let score = 0
  for (const re of TIER1_EXPLICIT) if (re.test(text)) score += 35
  for (const re of TIER2_INTIMATE) if (re.test(text)) score += 20
  for (const re of TIER3_SUGGESTIVE) if (re.test(text)) score += 10
  for (const re of TIER4_CONTEXT) if (re.test(text)) score += 5
  return Math.min(score, 100)
}

// ─── Emotion / relationship arc detection ────────────────────────────────────
// These supplement 车章 detection with emotional milestone markers.

function detectEmotionType(text: string, explicitScore: number): EmotionMoment['type'] | null {
  if (explicitScore >= 50) return 'explicit'
  if (explicitScore >= 25) return 'intimate'
  if (/告白|我喜欢你|我爱你|表白|心意|喜欢上|动心了/.test(text)) return 'confession'
  if (/争吵|冲突|误会|愤怒|滚出去|分手|离开我|别碰我/.test(text)) return 'conflict'
  if (/和好|原谅|和解|对不起.*我错了|我错了.*对不起|重新开始/.test(text)) return 'turning'
  if (/心跳|怦然|脸红|目光.*移不开|移不开.*目光|不由自主.*靠近/.test(text)) return 'tension'
  return null
}

// ─── Colors & labels ──────────────────────────────────────────────────────────

const EMOTION_COLORS: Record<EmotionMoment['type'], string> = {
  'explicit':   '#e8829a',
  'intimate':   '#c4a0d8',
  'tension':    '#f0c87a',
  'confession': '#96b8e8',
  'conflict':   '#e09070',
  'turning':    '#96cfa0',
}

const EMOTION_LABELS: Record<EmotionMoment['type'], string> = {
  'explicit':   '车车预警🔞',
  'intimate':   '亲密时刻',
  'tension':    '暧昧升温',
  'confession': '情感告白',
  'conflict':   '情感冲突',
  'turning':    '关系转折',
}

function generateDescription(type: EmotionMoment['type'], text: string, score: number): string {
  const snippet = text.slice(0, 35).replace(/\s+/g, '')
  switch (type) {
    case 'explicit':
      return `高强度亲密描写（置信度 ${score}%）。「${snippet}…」`
    case 'intimate':
      return `亲密互动，氛围渐浓。「${snippet}…」`
    case 'tension':
      return `暧昧情绪在空气中弥漫，「${snippet}…」`
    case 'confession':
      return `情感的堤坝终于决口，「${snippet}…」`
    case 'conflict':
      return `裂痕从这一刻开始加深，「${snippet}…」`
    case 'turning':
      return `两人关系迎来了转折点，「${snippet}…」`
  }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseNovel(title: string, rawText: string): ParsedNovel {
  const lines = rawText.split(/\r?\n/)
  const chapters: Chapter[] = []
  let currentChapterLines: string[] = []
  let currentChapterTitle = '开篇'
  let globalParagraphIndex = 0
  const allParagraphs: Paragraph[] = []

  function flushChapter() {
    const paragraphTexts = currentChapterLines
      .join('\n')
      .split(/\n{2,}|\n(?=　|\s{2,})/)
      .map(s => s.trim())
      .filter(s => s.length > 10)

    const chapterId = `ch-${chapters.length}`
    const startIndex = globalParagraphIndex
    const paragraphs: Paragraph[] = paragraphTexts.map((text) => {
      const p: Paragraph = { id: `p-${globalParagraphIndex}`, text, globalIndex: globalParagraphIndex }
      globalParagraphIndex++
      return p
    })
    allParagraphs.push(...paragraphs)
    chapters.push({ id: chapterId, title: currentChapterTitle, startIndex, endIndex: globalParagraphIndex - 1, paragraphs })
  }

  for (const line of lines) {
    if (isChapterTitle(line)) {
      if (currentChapterLines.length > 0) flushChapter()
      currentChapterTitle = line.trim()
      currentChapterLines = []
    } else {
      currentChapterLines.push(line)
    }
  }
  if (currentChapterLines.length > 0) flushChapter()

  if (chapters.length === 0) {
    const paragraphTexts = rawText.split(/\n{2,}/).map(s => s.trim()).filter(s => s.length > 10)
    const paragraphs: Paragraph[] = paragraphTexts.map((text, i) => ({ id: `p-${i}`, text, globalIndex: i }))
    allParagraphs.push(...paragraphs)
    chapters.push({ id: 'ch-0', title: title || '正文', startIndex: 0, endIndex: paragraphs.length - 1, paragraphs })
  }

  const totalChars = allParagraphs.reduce((sum, p) => sum + p.text.length, 0) || 1
  const total = allParagraphs.length

  // ── Detect moments ──────────────────────────────────────────────────────────
  // Score every paragraph, then pick peaks with minimum spacing between them.
  const scored = allParagraphs.map(p => ({
    p,
    score: scoreForExplicit(p.text),
    type: detectEmotionType(p.text, scoreForExplicit(p.text)),
  })).filter(x => x.type !== null)

  const emotionMoments: EmotionMoment[] = []
  const usedIndices = new Set<number>()
  const minSpacing = Math.max(3, Math.floor(total * 0.03))

  // Sort by score descending so highest-confidence moments get picked first
  const sorted = [...scored].sort((a, b) => b.score - a.score)

  for (const { p, score, type } of sorted) {
    if (emotionMoments.length >= 15) break
    if ([...usedIndices].some(idx => Math.abs(idx - p.globalIndex) < minSpacing)) continue
    usedIndices.add(p.globalIndex)
    emotionMoments.push({
      id: `em-${emotionMoments.length}`,
      type: type!,
      label: EMOTION_LABELS[type!],
      description: generateDescription(type!, p.text, score),
      paragraphId: p.id,
      progress: p.globalIndex / Math.max(total - 1, 1),
      lengthRatio: p.text.length / totalChars,
      color: EMOTION_COLORS[type!],
      score,
    })
  }

  // Re-sort by position in novel
  emotionMoments.sort((a, b) => a.progress - b.progress)

  // If fewer than 3 detected, fall back to position-based synthesis
  if (emotionMoments.length < 3 && total > 0) {
    const synTypes: Array<EmotionMoment['type']> = ['tension', 'confession', 'turning']
    const positions = [0.25, 0.55, 0.80]
    synTypes.forEach((type, idx) => {
      const pIdx = Math.floor(positions[idx] * (total - 1))
      const p = allParagraphs[Math.min(pIdx, total - 1)]
      if (!p) return
      emotionMoments.push({
        id: `em-syn-${idx}`,
        type,
        label: EMOTION_LABELS[type],
        description: generateDescription(type, p.text, 0),
        paragraphId: p.id,
        progress: positions[idx],
        lengthRatio: p.text.length / totalChars,
        color: EMOTION_COLORS[type],
        score: 0,
      })
    })
    emotionMoments.sort((a, b) => a.progress - b.progress)
  }

  // ── Detect chapter-level marks ─────────────────────────────────────────────
  // For each chapter, compute the max paragraph score. If it exceeds the
  // 'explicit' threshold (≥50), mark the chapter as a 车章. The mark covers
  // the full scroll range of the chapter (first para progress → last para progress).
  const CHAPTER_SCORE_THRESHOLD = 50
  const chapterMarks: ChapterMark[] = []

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]
    if (ch.paragraphs.length === 0) continue

    // Score all paragraphs in this chapter, track the max
    let maxScore = 0
    let maxScoreParagraph: Paragraph | null = null
    for (const p of ch.paragraphs) {
      const s = scoreForExplicit(p.text)
      if (s > maxScore) {
        maxScore = s
        maxScoreParagraph = p
      }
    }

    if (maxScore >= CHAPTER_SCORE_THRESHOLD && maxScoreParagraph) {
      const firstIdx = ch.paragraphs[0].globalIndex
      const lastIdx = ch.paragraphs[ch.paragraphs.length - 1].globalIndex
      const startProgress = firstIdx / Math.max(total - 1, 1)
      const endProgress = lastIdx / Math.max(total - 1, 1)
      const chapterChars = ch.paragraphs.reduce((sum, p) => sum + p.text.length, 0)
      const snippet = maxScoreParagraph.text.slice(0, 30).replace(/\s+/g, '')

      chapterMarks.push({
        chapterId: ch.id,
        chapterNum: i + 1,
        title: ch.title,
        startProgress,
        endProgress,
        heightRatio: chapterChars / totalChars,
        score: maxScore,
        color: '#e8829a',
        label: `🚗 ${ch.title}`,
        description: `置信度 ${maxScore}%。「${snippet}…」`,
      })
    }
  }

  return { title: title || '未命名小说', rawText, chapters, allParagraphs, emotionMoments, chapterMarks }
}
