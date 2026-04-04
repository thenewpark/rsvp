import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type TimeSlot = '11시 30분' | '12시 30분'
type ToastVariant = 'success' | 'error'

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
    transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
    line-height: 1.6;
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
`

// ── Korean poem columns ────────────────────────────────────────────────────────
const koreanPoemColumns = [
  '사랑은', '시간의', '장대가', '아닙니다',
  '미쁜', '마음과', '마음의', '결합에',
  '낙이없을', '때도', '굳건합니다',
  '사랑은', '폭풍에', '흔들리지', '않습니다',
  '시간의', '흐름에', '휩쓸리지', '않습니다',
  '그것을', '견뎌냅니다', '가장', '자리까지',
]

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 300,
      letterSpacing: '0.08em',
      color: 'var(--color-text-muted)',
      marginBottom: '18px',
    }}>
      {children}
    </p>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent fail */ }
  }
  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
      {copied ? '복사됨' : label}
    </button>
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
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
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
          <span style={{ fontSize: '13px', fontWeight: 300, letterSpacing: '0.04em', color: 'var(--color-text)' }}>
            참석 확인
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '22px', lineHeight: 1, color: 'var(--color-text-muted)',
            padding: '0 0 0 16px',
          }}>×</button>
        </div>

        {/* Form body */}
        <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Name */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 300, marginBottom: '8px', color: 'var(--color-text)' }}>성함</p>
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
            <p style={{ fontSize: '13px', fontWeight: 300, marginBottom: '12px', color: 'var(--color-text)' }}>
              편하신 식사 시간을 알려주세요.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['11시 30분', '12시 30분'] as TimeSlot[]).map(slot => {
                const on = selected === slot
                return (
                  <button key={slot} onClick={() => handleSelect(slot)}
                    className={['slot-btn', on ? 'slot-btn--on' : ''].join(' ')}
                    style={{
                      border: '1px solid', padding: '16px 12px', fontSize: '13px',
                      fontWeight: 300, textAlign: 'left', cursor: 'pointer',
                      ...(on
                        ? { backgroundColor: 'var(--color-fill)', color: '#fff', borderColor: 'var(--color-fill)' }
                        : { backgroundColor: 'white', color: 'var(--color-text)', borderColor: 'var(--color-border)' }
                      ),
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '11px', marginBottom: '4px', opacity: 0.45 }}>
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
            <p style={{ fontSize: '13px', fontWeight: 300, marginBottom: '8px', color: 'var(--color-text)' }}>
              동행하시는 분이 있다면 인원 수를 추가해 주세요.
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
            <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              본인 포함 총 인원 수입니다.
            </p>
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
              width: '100%', padding: '16px', fontSize: '13px', fontWeight: 300,
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const heroWrapperRef = useRef<HTMLDivElement>(null)

  // Use CSS sticky (not GSAP pin) for reliability.
  // The 200dvh wrapper gives 100dvh of scroll travel while the sticky hero
  // stays on screen. ScrollTrigger tracks wrapper progress → video scrubs 5s→0s.
  useGSAP(() => {
    const video = videoRef.current
    const heroWrapper = heroWrapperRef.current
    if (!video || !heroWrapper) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const create = () => {
      video.pause()
      video.currentTime = video.duration  // start at end (5s)

      ScrollTrigger.create({
        trigger: heroWrapper,
        start: 'top top',
        end: 'bottom bottom',   // wrapper bottom hits viewport bottom = scroll 100dvh
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: self => {
          if (video.duration) {
            video.currentTime = video.duration * (1 - self.progress)  // 5s → 0s
          }
        },
      })
    }

    if (video.readyState >= 1) create()
    else video.addEventListener('loadedmetadata', create, { once: true })
  })

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ background: 'white', margin: '0 10px' }}>

        {/* ── SECTION 1: Hero wrapper — 200dvh creates 100dvh scroll travel ─── */}
        <div ref={heroWrapperRef} style={{ height: '200dvh' }}>
          {/* Sticky hero — stays on screen for the full wrapper scroll travel */}
          <section style={{
            position: 'sticky', top: 0,
            height: '100dvh', display: 'flex', flexDirection: 'column',
            background: 'white',
          }}>
            {/* Header */}
            <div style={{
              padding: '56px 32px 32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: '16px', flexShrink: 0,
            }}>
              <div className="vertical-text" style={{
                fontSize: '11px', fontWeight: 300, lineHeight: 1.9,
                color: 'var(--color-text)', letterSpacing: '0.03em',
                whiteSpace: 'pre-line', flex: 1,
              }}>
                {'기쁜 날,\n가까이서 축복해주시면\n더없는 기쁨으로\n간직하겠습니다.'}
              </div>
              <div className="vertical-text" style={{
                fontSize: '22px', fontWeight: 300, letterSpacing: '0.1em',
                color: 'var(--color-text)', whiteSpace: 'nowrap',
              }}>
                유진선 · 공다슬
              </div>
            </div>

            {/* Video — natural aspect ratio (0.97:1), no cropping */}
            <div style={{ flex: 1 }}>
              <video
                ref={videoRef}
                src="/bloom.mp4"
                muted
                playsInline
                preload="auto"
                style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
              />
            </div>
          </section>
        </div>

        {/* ── SECTION 2: English poem + Korean poem + 일시 ─────────────────── */}
        <section>
          {/* English poem */}
          <div style={{ padding: '56px 28px 48px', textAlign: 'center' }}>
            <p style={{
              fontSize: '10px', fontWeight: 300, letterSpacing: '0.14em',
              lineHeight: 2.4, color: 'var(--color-text)',
            }}>
              LOVE'S<br />
              NOT TIME'S FOOL,<br />
              THOUGH ROSY LIPS AND CHEEKS<br />
              WITHIN HIS BENDING SICKLE'S COMPASS COME.<br />
              LOVE ALTERS NOT WITH HIS BRIEF HOURS AND WEEKS,<br />
              BUT BEARS IT OUT EVEN TO THE EDGE OF DOOM.
            </p>
          </div>

          {/* Korean poem */}
          <div style={{ padding: '0 28px 56px' }}>
            <div className="poem-scroll" style={{
              display: 'flex', flexDirection: 'row',
              alignItems: 'flex-start', gap: '16px', overflowX: 'auto',
            }}>
              {koreanPoemColumns.map((col, i) => (
                <div key={i} className="vertical-text" style={{
                  fontSize: '11px', fontWeight: 300, lineHeight: 2,
                  color: 'var(--color-text)', whiteSpace: 'nowrap',
                  flexShrink: 0, letterSpacing: '0.04em',
                }}>
                  {col}
                </div>
              ))}
              <div style={{ flexShrink: 0, display: 'flex', gap: '10px', paddingLeft: '12px' }}>
                <div className="vertical-text" style={{
                  fontSize: '8px', fontWeight: 300, letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                }}>SONNET 116</div>
                <div className="vertical-text" style={{
                  fontSize: '8px', fontWeight: 300, letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                }}>WILLIAM SHAKESPEARE</div>
              </div>
            </div>
          </div>

          {/* 일시 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>일시</SectionLabel>
            <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.9, color: 'var(--color-text)', marginBottom: '20px' }}>
              2026년 5월 23일 토요일<br />11:00 — 16:00
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ fontSize: '12px', fontWeight: 300, lineHeight: 2, color: 'var(--color-text)' }}>
                혼인 서약:<br />12:00
              </div>
              <div style={{ fontSize: '12px', fontWeight: 300, lineHeight: 2, color: 'var(--color-text)' }}>
                식사:<br />11:30 – 14:30
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: 장소 + 주차 안내 + lily.png ───────────────────────── */}
        <section>
          {/* 장소 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>장소</SectionLabel>
            <p style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.9, color: 'var(--color-text)', marginBottom: '10px' }}>
              서울시 서대문구 연희동 95-10
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.7, color: 'var(--color-text-muted)', flex: 1 }}>
                (도로명) 서울시 서대문구 연희로27다길 10-15
              </p>
              <CopyButton text="서울시 서대문구 연희로27다길 10-15" label="주소 복사" />
            </div>
          </div>

          {/* 주차 안내 */}
          <div style={{ padding: '32px 28px 40px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>주차 안내</SectionLabel>
            <p style={{
              fontSize: '12px', fontWeight: 300, lineHeight: 1.9,
              color: 'var(--color-text)', wordBreak: 'keep-all',
            }}>
              단독주택으로 주차 공간이 마련되어 있지 않습니다.<br />
              인근 공영주차장을 이용해 주시면 감사하겠습니다.
            </p>
          </div>

          {/* lily.png */}
          <div>
            <img
              src="/lily.png"
              alt=""
              draggable={false}
              style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
            />
          </div>
        </section>

        {/* ── SECTION 4: 마음 전하실 곳 + RSVP 버튼 ───────────────────────── */}
        <section>
          {/* 마음 전하실 곳 */}
          <div style={{ padding: '32px 28px 36px', borderTop: '1px solid var(--color-border)' }}>
            <SectionLabel>마음 전하실 곳</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text)' }}>
                ○○은행 000-0000000-0000000
              </p>
              <CopyButton text="000-0000000-0000000" label="계좌 번호 복사" />
            </div>
          </div>

          {/* RSVP 버튼 */}
          <button
            className="rsvp-open-btn"
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%', padding: '28px 28px',
              background: '#e0e0e0', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 300, letterSpacing: '0.1em',
              color: 'var(--color-text)', textAlign: 'center', display: 'block',
            }}
          >
            참석 의사 체크하기
          </button>
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
