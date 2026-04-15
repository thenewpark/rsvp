import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type TimeSlot = '11시 30분' | '12시 30분'
type ToastVariant = 'success' | 'error'

type KakaoShareConfig = {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }
  buttons: Array<{
    title: string
    link: {
      mobileWebUrl: string
      webUrl: string
    }
  }>
}

type KakaoSDK = {
  init: (appKey: string) => void
  isInitialized: () => boolean
  Share: {
    sendDefault: (config: KakaoShareConfig) => void
  }
}

declare global {
  interface Window {
    Kakao?: KakaoSDK
  }
}

const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js'

const STYLES = `
  .slot-btn {
    transition: background-color 180ms ease, color 180ms ease,
                border-color 180ms ease, transform 160ms ease-out;
  }
  .slot-btn:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .slot-btn:not(.slot-btn--on):hover { background-color: #f5f5f5; }
  }
  .submit-btn {
    transition: opacity 150ms ease, transform 160ms ease-out,
                background-color 200ms ease, color 200ms ease,
                border-color 200ms ease;
  }
  .submit-btn:not(:disabled):active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .submit-btn:not(:disabled):hover { opacity: 0.72; }
  }
  .field-input { transition: border-color 150ms ease; }
  .field-input:focus { border-color: var(--color-fill); outline: none; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  @media (prefers-reduced-motion: reduce) {
    .slot-btn, .submit-btn, .field-input { transition: opacity 150ms ease !important; transform: none !important; }
  }

  .poem-scroll::-webkit-scrollbar { display: none; }
  .poem-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  .copy-btn {
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    background: white;
    padding: 4px 10px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
    line-height: 1.6;
  }
  .copy-btn--compact {
    width: 64px;
  }
  .copy-btn.copied {
    background: var(--color-fill);
    color: white;
    border-color: var(--color-fill);
  }
  @media (hover: hover) and (pointer: fine) {
    .copy-btn:not(.copied):hover { background: #f5f5f5; }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: overlayIn 220ms ease both;
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .modal-sheet {
    background: white;
    width: 100%;
    max-width: 480px;
    max-height: 88vh;
    overflow-y: auto;
    animation: sheetUp 300ms cubic-bezier(0.32, 0.72, 0, 1) both;
  }
  @keyframes sheetUp {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .rsvp-open-btn {
    transition: background-color 180ms ease, color 180ms ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .rsvp-open-btn:hover { background-color: #d0d0d0 !important; }
  }
  .rsvp-open-btn:active { background-color: #c4c4c4 !important; }

  .share-btn {
    transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .share-btn:hover { background-color: #f2f2f2 !important; }
  }
  .share-btn:active { background-color: #ebebeb !important; }
`

// ── Korean poem columns ────────────────────────────────────────────────────────
const koreanPoemColumns = [
  '사랑은 시간의 광대가 아닙니다.',
  '비록 장밋빛 입술과 뺨이',
  '시간의 낫 아래 들지라도',
  '사랑은 세월의 흐름에 휩쓸리지 않습니다.',
  '그러나 운명의 가장자리까지',
  '그것을 견뎌냅시다.',
]

const sectionLabelStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  letterSpacing: '0.04em',
  color: 'var(--color-text-muted)',
}

const sectionBodyStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 300,
  lineHeight: 1.65,
  color: 'var(--color-text)',
}

const subsectionLabelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: '0.04em',
  color: 'var(--color-text-muted)',
}

const supportingTextStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 300,
  lineHeight: 1.7,
  color: 'var(--color-text-muted)',
}

const fieldLabelStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 300,
  color: 'var(--color-text)',
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children, animate = true }: { children: string; animate?: boolean }) {
  if (!animate) {
    return (
      <p style={{
        ...sectionLabelStyle,
        marginBottom: '18px',
      }}>
        {children}
      </p>
    )
  }

  return (
    <p data-word-reveal-group style={{
      ...sectionLabelStyle,
      marginBottom: '18px',
    }}>
      <span style={{ display: 'block' }}>
        <span data-word-reveal className="inline-block">{children}</span>
      </span>
    </p>
  )
}

function LineRevealText({
  as: Tag = 'p',
  lines,
  style,
  className,
  lineStyle,
}: {
  as?: 'p' | 'div' | 'span'
  lines: string[]
  style?: CSSProperties
  className?: string
  lineStyle?: CSSProperties
}) {
  return (
    <Tag data-reveal-group className={className} style={style}>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          data-reveal-line
          style={{
            display: 'block',
            whiteSpace: 'pre-line',
            ...lineStyle,
          }}
        >
          {line}
        </span>
      ))}
    </Tag>
  )
}

function WordRevealText({
  as: Tag = 'p',
  lines,
  style,
  className,
  lineStyle,
  revealStretch = 1,
}: {
  as?: 'p' | 'div' | 'span'
  lines: string[]
  style?: CSSProperties
  className?: string
  lineStyle?: CSSProperties
  revealStretch?: number
}) {
  return (
    <Tag data-word-reveal-group data-reveal-stretch={revealStretch} className={className} style={style}>
      {lines.map((line, lineIndex) => (
        <span
          key={`${line}-${lineIndex}`}
          style={{
            display: 'block',
            whiteSpace: 'pre-line',
            ...lineStyle,
          }}
        >
          {line.split(/(\s+)/).map((part, partIndex) => (
            /^\s+$/.test(part)
              ? <span key={`${lineIndex}-space-${partIndex}`}>{part}</span>
              : <span key={`${lineIndex}-word-${partIndex}`} data-word-reveal className="inline-block">{part}</span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text, label, compact = false }: { text: string; label: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent fail */ }
  }
  return (
    <button className={`copy-btn${compact ? ' copy-btn--compact' : ''}${copied ? ' copied' : ''}`} onClick={copy}>
      {copied ? '복사됨' : label}
    </button>
  )
}

function CallButton({ phone, label }: { phone: string; label: string }) {
  return (
    <a
      className="copy-btn copy-btn--compact"
      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
      style={{ textDecoration: 'none' }}
    >
      {label}
    </a>
  )
}

function AccountBlock({ name, account }: { name: string; account: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p style={{ ...subsectionLabelStyle, margin: 0 }}>
          {name}
        </p>
        <p style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.7, color: 'var(--color-text)', margin: 0 }}>
          {account}
        </p>
      </div>
      <CopyButton text={account} label="계좌 번호 복사" />
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
const TOAST_DURATION = 3500

function Toast({ message, variant = 'success', onDismiss }: {
  message: string; variant?: ToastVariant; onDismiss: () => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [exiting, setExiting] = useState(false)

  const startTimer = () => { timerRef.current = setTimeout(dismiss, TOAST_DURATION) }
  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current) }
  const dismiss = () => { clearTimer(); setExiting(true); setTimeout(onDismiss, 180) }

  useEffect(() => { startTimer(); return clearTimer }, [])

  return (
    <div
      style={{
        position: 'fixed', bottom: '1.5rem', left: '50%',
        transform: exiting ? 'translateX(-50%) translateY(6px)' : 'translateX(-50%) translateY(0)',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 180ms ease-in, transform 180ms ease-in' : 'none',
        animation: exiting ? 'none' : 'toastEnter 220ms ease-out both',
        zIndex: 300, width: 'max-content', maxWidth: 'calc(100vw - 2.5rem)',
      }}
      onMouseEnter={clearTimer} onMouseLeave={startTimer}
    >
      <style>{`
        @keyframes toastEnter {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        backgroundColor: variant === 'error' ? '#b05050' : 'var(--color-fill)',
        color: '#fff', padding: '0.75rem 1.25rem', fontSize: '0.8125rem',
        fontWeight: 300, border: `1px solid ${variant === 'error' ? '#b05050' : 'var(--color-fill)'}`,
        letterSpacing: '0.01em', wordBreak: 'keep-all',
      }}>
        <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{variant === 'error' ? '!' : '✓'}</span>
        {message}
        <button onClick={dismiss} style={{
          marginLeft: '0.5rem', opacity: 0.4, fontSize: '0.875rem', lineHeight: 1,
          background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0,
        }} aria-label="닫기">×</button>
      </div>
    </div>
  )
}

// ── RSVP Modal ─────────────────────────────────────────────────────────────────
function RSVPModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<TimeSlot | null>(null)
  const [guestCount, setGuestCount] = useState('1')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [extraVisible, setExtraVisible] = useState(false)

  useEffect(() => { setExtraVisible(!!selected) }, [selected])
  // Lock the page behind the modal, including mobile Safari.
  useEffect(() => {
    const scrollY = window.scrollY
    const { style } = document.body
    const previousOverflow = style.overflow
    const previousPosition = style.position
    const previousTop = style.top
    const previousWidth = style.width

    style.overflow = 'hidden'
    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.width = '100%'

    return () => {
      style.overflow = previousOverflow
      style.position = previousPosition
      style.top = previousTop
      style.width = previousWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

  const canSubmit = !!selected && name.trim().length > 0 && !isLoading
  const handleSelect = (slot: TimeSlot) => setSelected(prev => prev === slot ? null : slot)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsLoading(true)
    setErrorMsg(null)
    const submittedName = name.trim()
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: submittedName, timeSlot: selected,
          guestCount: guestCount.trim() === '' ? '1' : guestCount,
          submittedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('server error')
      const guests = guestCount && guestCount !== '1' ? ` +${parseInt(guestCount) - 1}명` : ''
      onSuccess(`${submittedName} · ${selected}${guests} 참석이 확인되었습니다.`)
      onClose()
    } catch {
      setErrorMsg('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        {/* Modal header */}
        <div style={{
          padding: '20px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <span style={fieldLabelStyle}>
            참석 확인
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '22px', lineHeight: 1, color: 'var(--color-text-muted)',
            padding: '0 0 0 16px',
          }}>×</button>
        </div>

        {/* Date reminder */}
        <div style={{
          padding: '16px 28px',
          borderBottom: '1px solid var(--color-border)',
          background: '#fafafa',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {[
            '2026년 5월 23일 토요일   11:00 - 16:00',
            '혼인 서약 12:00 | 식사 11:30 - 14:30'
          ].map(line => (
            <span key={line} style={{ ...supportingTextStyle, color: 'var(--color-text)', letterSpacing: '0.02em' }}>
              {line}
            </span>
          ))}
        </div>

        {/* Form body */}
        <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Name */}
          <div>
            <p style={{ ...fieldLabelStyle, marginBottom: '8px' }}>성함 *</p>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력해 주세요"
              className="field-input"
              style={{
                width: '100%', padding: '12px 16px', fontSize: '14px', fontWeight: 300,
                backgroundColor: 'white', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Time slot */}
          <div>
            <p style={{ ...fieldLabelStyle, marginBottom: '12px' }}>
              편하신 식사 시간을 알려주세요.*
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['11시 30분', '12시 30분'] as TimeSlot[]).map(slot => {
                const on = selected === slot
                return (
                  <button key={slot} onClick={() => handleSelect(slot)}
                    className={['slot-btn', on ? 'slot-btn--on' : ''].join(' ')}
                    style={{
                      border: '1px solid', padding: '16px 12px', fontSize: '14px',
                      fontWeight: 300, textAlign: 'left', cursor: 'pointer',
                      ...(on
                        ? { backgroundColor: 'var(--color-fill)', color: '#fff', borderColor: 'var(--color-fill)' }
                        : { backgroundColor: 'white', color: 'var(--color-text)', borderColor: 'var(--color-border)' }
                      ),
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.45 }}>
                      {on ? '—' : '○'}
                    </span>
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Guest count */}
          <div style={{
            overflow: 'hidden',
            maxHeight: extraVisible ? '140px' : '0',
            opacity: extraVisible ? 1 : 0,
            transition: 'max-height 220ms ease-out, opacity 220ms ease-out',
          }}>
            <p style={{ ...fieldLabelStyle, marginBottom: '8px' }}>
              참석하시는 인원 수를 알려주세요.
            </p>
            <div style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
              <input
                type="number" min={1} max={10}
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
                placeholder="1"
                className="field-input"
                style={{
                  flex: 1, padding: '12px 16px', fontSize: '14px', fontWeight: 300,
                  backgroundColor: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--color-text)',
                }}
              />
              <span style={{ paddingRight: '16px', fontSize: '13px', fontWeight: 300, userSelect: 'none', color: 'var(--color-text-muted)' }}>명</span>
            </div>
            {/* <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              본인 포함 총 인원 수입니다.
            </p> */}
          </div>

          {/* Error */}
          {errorMsg && (
            <p style={{ fontSize: '12px', color: '#b05050', marginTop: '-12px' }}>{errorMsg}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="submit-btn"
            style={{
              width: '100%', padding: '16px', fontSize: '14px', fontWeight: 300,
              letterSpacing: '0.06em', border: '1px solid',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              ...(canSubmit
                ? { backgroundColor: 'var(--color-fill)', color: '#fff', borderColor: 'var(--color-fill)' }
                : { backgroundColor: 'white', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
              ),
            }}
          >
            {isLoading ? <span style={{ opacity: 0.45 }}>확인 중…</span> : '참석 확인'}
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RSVPForm() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false)
  const [isKakaoReady, setIsKakaoReady] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const heroWrapperRef = useRef<HTMLDivElement>(null)
  const lilyImageRef = useRef<HTMLImageElement>(null)
  const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY

  // Use CSS sticky (not GSAP pin) for reliability.
  // The 200dvh wrapper gives 100dvh of scroll travel while the sticky hero
  // stays on screen. ScrollTrigger tracks wrapper progress → video scrubs 5s→0s.
  useGSAP(() => {
    const video = videoRef.current
    const heroWrapper = heroWrapperRef.current
    const root = rootRef.current
    if (!video || !heroWrapper || !root) return

    setIsHeroVideoReady(false)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lineRevealGroups = gsap.utils.toArray<HTMLElement>('[data-reveal-group]', root)
    lineRevealGroups.forEach(group => {
      const lines = group.querySelectorAll<HTMLElement>('[data-reveal-line]')
      if (!lines.length) return

      if (prefersReducedMotion) {
        gsap.set(lines, { clearProps: 'all' })
        return
      }

      gsap.set(lines, {
        autoAlpha: 0,
        filter: 'blur(10px)',
        y: 18,
        willChange: 'transform, filter, opacity',
      })

      const stagger = Number(group.dataset.revealStagger) || 0.12
      const start = group.dataset.revealStart || 'top 84%'

      gsap.to(lines, {
        autoAlpha: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger,
        clearProps: 'willChange',
        scrollTrigger: {
          trigger: group,
          start,
          once: true,
          invalidateOnRefresh: true,
        },
      })
    })

    const wordRevealGroups = gsap.utils.toArray<HTMLElement>('[data-word-reveal-group]', root)
    wordRevealGroups.forEach(group => {
      const words = group.querySelectorAll<HTMLElement>('[data-word-reveal]')
      if (!words.length) return
      const revealStretch = Number(group.dataset.revealStretch ?? '1') || 1

      if (prefersReducedMotion) {
        gsap.set(words, { clearProps: 'all' })
        return
      }

      gsap.set(words, {
        opacity: 0.12,
        filter: 'blur(4px)',
        willChange: 'opacity, filter',
      })

      gsap.to(words, {
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'none',
        stagger: 0.05,
        scrollTrigger: {
          trigger: group,
          start: 'top bottom-=20%',
          end: () => {
            const baseDistance = Math.max(window.innerHeight * 0.52, words.length * 16)
            return `+=${Math.round(baseDistance * revealStretch)}`
          },
          scrub: true,
        },
      })
    })

    const lilyImage = lilyImageRef.current
    if (lilyImage) {
      if (prefersReducedMotion) {
        gsap.set(lilyImage, { clearProps: 'all' })
      } else {
        gsap.set(lilyImage, {
          autoAlpha: 0,
          y: 16,
          filter: 'blur(12px)',
          willChange: 'transform, filter, opacity',
        })

        gsap.to(lilyImage, {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.85,
          ease: 'power2.out',
          clearProps: 'willChange',
          scrollTrigger: {
            trigger: lilyImage,
            start: 'top bottom-=8%',
            once: true,
            invalidateOnRefresh: true,
          },
        })
      }
    }

    if (prefersReducedMotion) return

    const syncVideoToStartFrame = (onReady?: () => void) => {
      const reveal = () => requestAnimationFrame(() => setIsHeroVideoReady(true))

      if (!video.duration || !Number.isFinite(video.duration)) {
        reveal()
        onReady?.()
        return
      }

      const handleSeeked = () => {
        reveal()
        onReady?.()
      }

      video.addEventListener('seeked', handleSeeked, { once: true })
      video.currentTime = video.duration

      // Some browsers may already be at the target time and skip `seeked`.
      requestAnimationFrame(() => {
        if (Math.abs(video.currentTime - video.duration) < 0.05) {
          video.removeEventListener('seeked', handleSeeked)
          handleSeeked()
        }
      })
    }

    const setupTrigger = () => {
      ScrollTrigger.create({
        trigger: heroWrapper,
        start: 'top top',
        end: 'bottom bottom',   // wrapper bottom hits viewport bottom = scroll 100dvh
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: self => {
          if (video.duration) video.currentTime = video.duration * (1 - self.progress)  // 5s → 0s
        },
        // Guarantee exact position at section boundaries regardless of
        // async seek timing or fast-scroll edge cases.
        onLeave: () => { video.currentTime = 0 },
        onEnterBack: () => { video.currentTime = video.duration },
      })
    }

    const create = () => {
      // iOS Safari does not allow currentTime seeks until play() has been called
      // at least once. Call play() to unlock seek capability, then immediately
      // pause and position the video at the end frame.
      const playPromise = video.play()
      if (playPromise) {
        playPromise
          .then(() => { video.pause(); syncVideoToStartFrame(setupTrigger) })
          .catch(() => { syncVideoToStartFrame(setupTrigger) })  // play blocked (e.g. policy) – try anyway
      } else {
        video.pause()
        syncVideoToStartFrame(setupTrigger)
      }
    }

    if (video.readyState >= 1) create()
    else video.addEventListener('loadedmetadata', create, { once: true })
  }, { scope: rootRef })

  useEffect(() => {
    if (!kakaoKey) return

    const initializeKakao = () => {
      if (!window.Kakao) return
      if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey)
      setIsKakaoReady(true)
    }

    if (window.Kakao) {
      initializeKakao()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]')
    if (existingScript) {
      existingScript.addEventListener('load', initializeKakao, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = KAKAO_SDK_SRC
    script.async = true
    script.dataset.kakaoSdk = 'true'
    script.addEventListener('load', initializeKakao, { once: true })
    document.head.appendChild(script)
  }, [kakaoKey])

  const handleKakaoShare = () => {
    if (!kakaoKey) {
      setToast({ message: '카카오 공유를 사용하려면 VITE_KAKAO_JAVASCRIPT_KEY 설정이 필요합니다.', variant: 'error' })
      return
    }

    if (!window.Kakao || !isKakaoReady) {
      setToast({ message: '카카오 공유 준비 중입니다. 잠시 후 다시 시도해주세요.', variant: 'error' })
      return
    }

    const shareUrl = window.location.href
    const imageUrl = new URL('/kara.jpeg', window.location.origin).toString()

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '귀하신 분께, 진선과 다슬의 결혼식에 초대드립니다',
        description: '2026년 5월 23일 토요일 · 서울 서대문구 연희동',
        imageUrl,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '모바일 청첩장 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    })
  }

  return (
    <>
      <style>{STYLES}</style>

      <div ref={rootRef} className="rsvp-shell" style={{ background: 'var(--color-bg)' }}>

        {/* ── SECTION 1: Hero wrapper — 200dvh creates 100dvh scroll travel ─── */}
        <div ref={heroWrapperRef} style={{ height: '200dvh' }}>
          {/* Sticky hero — stays on screen for the full wrapper scroll travel */}
          <section style={{
            position: 'sticky', top: 0,
            height: '100dvh', display: 'flex', flexDirection: 'column',
            background: 'var(--color-bg)',
            zIndex: 1,
          }}>
            {/* Header */}
            <div style={{
              padding: '56px 32px 56px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: '16px', flexShrink: 0,
            }}>
              <div data-reveal-group className="vertical-text" style={{
                fontSize: '16px', fontWeight: 600, lineHeight: 1.6,
                color: '#8E9293', letterSpacing: '-0.15em',
                whiteSpace: 'pre-line', flex: 0,
              }}>
                {([
                  ['기쁜 날', '、'],
                  ['가까이서 축복해주시면', ''],
                  ['더없는 기쁨으로 간직하겠습니다', '。'],
                ] as [string, string][]).map(([text, punct], i) => (
                  <span key={i} data-reveal-line style={{ display: 'block' }}>
                    {text}
                    {punct && <span style={{ display: 'inline-block', transform: 'translateX(0.5em) translateY(-0.5em)' }}>{punct}</span>}
                  </span>
                ))}
              </div>
              <LineRevealText
                as="div"
                className="vertical-text"
                lines={['유진선\u2002\u2002·\u2002\u2002공다슬']}
                style={{
                  fontSize: '16px', fontWeight: 900, letterSpacing: '-0.15em',
                  color: 'var(--color-text)', whiteSpace: 'nowrap',
                }}
              />
            </div>

            {/* Video — natural aspect ratio (0.97:1), no cropping */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
            }}>
              <video
                ref={videoRef}
                src="/bloom_scrub_scrub.mp4"
                poster="/bloom_scrub_poster.jpg"
                muted
                playsInline
                preload="auto"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  pointerEvents: 'none',
                  opacity: isHeroVideoReady ? 1 : 0,
                  transform: isHeroVideoReady ? 'translateY(0)' : 'translateY(16px)',
                  filter: isHeroVideoReady ? 'blur(0px)' : 'blur(12px)',
                  transition: 'opacity 600ms ease-out, transform 780ms ease-out, filter 780ms ease-out',
                }}
              />
            </div>
          </section>
        </div>

        {/* ── SECTION 2: English poem + Korean poem + 일시 ─────────────────── */}
        <section style={{ position: 'relative', zIndex: 2, background: 'var(--color-bg)' }}>
          {/* English poem */}
          <div style={{ padding: '48px 8px 18px', textAlign: 'center' }}>
            <WordRevealText
              lines={[
                "LOVE'S",
                "NOT TIME'S FOOL,",
                'THOUGH ROSY LIPS AND CHEEKS',
                "WITHIN HIS BENDING SICKLE'S COMPASS COME.",
                'LOVE ALTERS NOT WITH HIS BRIEF HOURS AND WEEKS,',
                'BUT BEARS IT OUT EVEN TO THE EDGE OF DOOM.',
              ]}
              revealStretch={0.7}
              style={{
                margin: 0,
                fontFamily: '"Marcellus", Georgia, "Times New Roman", serif',
                fontSize: 'clamp(8px, 3.4vw, 15px)',
                fontWeight: 300,
                letterSpacing: '0.012em',
                lineHeight: 1.15,
                color: '#8a8a8a',
                textTransform: 'uppercase',
              }}
            />
          </div>

          {/* Korean poem */}
          <div style={{ padding: '2px 18px 54px', textAlign: 'center' }}>
            {/* inline-block wrapper: sized to columns, attribution pinned outside right edge */}
            <div style={{ display: 'inline-block', position: 'relative', textAlign: 'left' }}>
              <div
                data-reveal-group
                data-reveal-stagger="0.3"
                data-reveal-start="top 72%"
                style={{
                  display: 'flex', flexDirection: 'row-reverse',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                {koreanPoemColumns.map((col, i) => (
                  <div key={i} data-reveal-line className="vertical-text" style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: 1.05,
                    color: '#8E9293',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.15em',
                  }}>
                    {col}
                  </div>
                ))}
              </div>
              {/* Attribution — always right of columns, never overlaps */}
              <div
                data-reveal-group
                data-reveal-start="top 72%"
                style={{
                  position: 'absolute', top: '0', left: '100%',
                  paddingLeft: '8px',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  alignItems: 'flex-start', color: '#7c7c7c',
                }}
              >
                {['SONNET 116,', 'WILLIAM SHAKESPEARE'].map(line => (
                  <span key={line} data-reveal-line style={{
                    fontFamily: '"Marcellus", Georgia, "Times New Roman", serif',
                    fontSize: 'clamp(6px, 2.4vw, 8px)', fontWeight: 400,
                    letterSpacing: '0.04em', lineHeight: 1.15, whiteSpace: 'nowrap',
                  }}>
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 일시 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>일시</SectionLabel>
            <WordRevealText
              lines={['2026년 5월 23일 토요일', '11:00 – 16:00']}
              revealStretch={1}
              style={{ ...sectionBodyStyle, lineHeight: 1.75, marginBottom: '20px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <WordRevealText
                as="div"
                lines={['혼인 서약', '12:00']}
                revealStretch={1}
                style={{ ...subsectionLabelStyle, lineHeight: 1.75, marginBottom: '6px' }}
              />
              <WordRevealText
                as="div"
                lines={['식사', '11:30 – 14:30']}
                revealStretch={1}
                style={{ ...subsectionLabelStyle, lineHeight: 1.75, marginBottom: '6px' }}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: 장소 + 주차 안내 + lily.png ───────────────────────── */}
        <section>
          {/* 장소 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>장소</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>

              <WordRevealText
                lines={['서울시 서대문구 연희동 95-10']}
                revealStretch={1}
                style={{ ...sectionBodyStyle, lineHeight: 1.9, marginBottom: '4px' }}
              />
              <CopyButton text="서울시 서대문구 연희동 95-10" label="주소 복사" compact />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginTop: '-2px' }}>
              <WordRevealText
                lines={['(도로명) 서울시 서대문구 연희로27다길 10-15']}
                revealStretch={0.5}
                style={{ ...supportingTextStyle, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
              <WordRevealText
                lines={['Tel. 010-7359-4240 (WWL 스튜디오)']}
                revealStretch={0.5}
                style={{ ...supportingTextStyle, flex: 1, marginBottom: 0 }}
              />
              <CallButton phone="010-7359-4240" label="전화하기" />
            </div>
          </div>

          {/* 오시는 길 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>오시는 길</SectionLabel>
            <WordRevealText
              lines={['대중교통']}
              revealStretch={0.5}
              style={{ ...subsectionLabelStyle, marginBottom: '6px' }}
            />
            <WordRevealText
              lines={[
                '2호선 홍대입구역 8번 출구',
                '→ 버스(중앙선) 7612, 7734, 7739',
                '→ 연희동 자치회관 하차',
              ]}
              revealStretch={0.5}
              style={{
                ...sectionBodyStyle, wordBreak: 'keep-all',
              }}
            />
            <WordRevealText
              lines={['자차']}
              revealStretch={0.5}
              style={{ ...subsectionLabelStyle, marginTop: '20px', marginBottom: '6px' }}
            />
            <WordRevealText
              lines={['단독주택으로 주차 공간이 마련되어 있지 않습니다.', '인근 공영주차장을 이용해 주시면 감사하겠습니다.']}
              revealStretch={0.5}
              style={{
                ...sectionBodyStyle, wordBreak: 'keep-all',
              }}
            />
          </div>

        </section>

        {/* ── SECTION 4: 참석 여부 ──────────────────────────────────────────── */}
        <section>
          <div style={{ padding: '32px 28px 28px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>참석 확인</SectionLabel>
            <WordRevealText
              lines={['한 분 한 분 소중히 모실 수 있도록', '참석 의사를 전해 주시면 감사하겠습니다.']}
              revealStretch={0.5}
              style={{ ...sectionBodyStyle, marginBottom: '24px' }}
            />
            <button
              className="rsvp-open-btn"
              onClick={() => setModalOpen(true)}
              style={{
                width: '100%', padding: '16px 28px',
                background: '#111111', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em',
                color: '#F5F5F5', textAlign: 'center', display: 'block',
              }}
            >
              참석 의사 체크하기
            </button>
          </div>
        </section>

        {/* ── SECTION 5: 마음 전하실 곳 ────────────────────────────────────── */}
        <section>
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>마음 전하실 곳</SectionLabel>
            <WordRevealText
              lines={['참석이 어려우신 분들을 위해 기재했습니다.', '너그러운 마음으로 양해 부탁드립니다.']}
              revealStretch={0.5}
              style={{ ...sectionBodyStyle, marginBottom: '20px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AccountBlock name="유진선" account="신한은행 110-354-126744" />
                <AccountBlock name="유지윤" account="우리은행 1002-247-185871" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AccountBlock name="공다슬" account="국민은행 616302-04-034266" />
              </div>
            </div>
          </div>

          {/* lily.png */}
          <div>
            <img
              ref={lilyImageRef}
              src="/lily.png"
              alt=""
              draggable={false}
              style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
            />
          </div>
          <div style={{ padding: '20px 28px 36px', background: '#fafafa' }}>
            <button
              className="share-btn"
              onClick={handleKakaoShare}
              style={{
                width: '100%',
                padding: '15px 28px',
                background: 'white',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: 'var(--color-text)',
                textAlign: 'center',
                display: 'block',
              }}
            >
              카카오톡으로 공유하기
            </button>
          </div>
        </section>

      </div>

      {/* ── RSVP Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <RSVPModal
          onClose={() => setModalOpen(false)}
          onSuccess={msg => setToast({ message: msg, variant: 'success' })}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  )
}
