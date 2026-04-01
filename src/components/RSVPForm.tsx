import { useState, useEffect, useRef } from 'react'

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? ''

type TimeSlot = '11시 30분' | '12시 30분'

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
`

// ── Toast ──────────────────────────────────────────────────────────────────────

const TOAST_DURATION = 3500

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [exiting, setExiting] = useState(false)

  const startTimer = () => {
    timerRef.current = setTimeout(() => dismiss(), TOAST_DURATION)
  }

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const dismiss = () => {
    clearTimer()
    setExiting(true)
    setTimeout(onDismiss, 180)
  }

  useEffect(() => {
    startTimer()
    return clearTimer
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: exiting
          ? 'translateX(-50%) translateY(6px)'
          : 'translateX(-50%) translateY(0)',
        opacity: exiting ? 0 : 1,
        // Enter transition is handled by CSS animation below;
        // exit uses CSS transition (interruptible)
        transition: exiting
          ? 'opacity 180ms ease-in, transform 180ms ease-in'
          : 'none',
        animation: exiting ? 'none' : 'toastEnter 220ms ease-out both',
        zIndex: 50,
        width: 'max-content',
        maxWidth: 'calc(100vw - 2.5rem)',
      }}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
    >
      <style>{`
        @keyframes toastEnter {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          backgroundColor: 'var(--color-fill)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          fontSize: '0.8125rem',
          fontWeight: 300,
          border: '1px solid var(--color-fill)',
          letterSpacing: '0.01em',
          wordBreak: 'keep-all',
        }}
      >
        <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>✓</span>
        {message}
        <button
          onClick={dismiss}
          style={{
            marginLeft: '0.5rem',
            opacity: 0.4,
            fontSize: '0.875rem',
            lineHeight: 1,
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            transition: 'opacity 120ms ease',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.opacity = '0.9')}
          onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '0.4')}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ── Form ───────────────────────────────────────────────────────────────────────

export default function RSVPForm() {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<TimeSlot | null>(null)
  const [guestCount, setGuestCount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [extraVisible, setExtraVisible] = useState(false)

  useEffect(() => {
    setExtraVisible(!!selected)
  }, [selected])

  const canSubmit = !!selected && name.trim().length > 0 && !isLoading

  const handleSelect = (slot: TimeSlot) => {
    setSelected(prev => (prev === slot ? null : slot))
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsLoading(true)
    setError(false)

    try {
      // mode: 'no-cors' — Apps Script POST goes through a redirect that
      // drops CORS headers, causing fetch to throw in all modern browsers.
      // With no-cors we get an opaque response (unreadable) but no error.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          name: name.trim(),
          timeSlot: selected,
          guestCount: guestCount.trim() === '' ? '0' : guestCount,
          submittedAt: new Date().toISOString(),
        }),
      })

      // Reset form
      setName('')
      setSelected(null)
      setGuestCount('')

      // Show toast
      const guests = guestCount && guestCount !== '0' ? ` +${guestCount}명` : ''
      setToastMsg(`${name.trim()} · ${selected}${guests} 참석이 확인되었습니다.`)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="w-full max-w-xs">

        {/* Hero */}
        <div className="border-b border-[var(--color-border)] pb-5 mb-8">
          {/* <p className="text-xs text-[var(--color-text-muted)] tracking-widest uppercase mb-2">Wedding</p> */}
          <h1 className="text-3xl font-light leading-snug" style={{ color: 'var(--color-text)' }}>
            진선 다슬<br />결혼합니다.
          </h1>
        </div>

        <div className="space-y-7">

          {/* Name */}
          <div>
            <p className="text-sm font-light mb-2" style={{ color: 'var(--color-text)' }}>성함</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="field-input w-full py-3 px-4 text-sm font-light bg-white border border-[var(--color-border)]"
              style={{ color: 'var(--color-text)' }}
            />
          </div>

          {/* Time slot */}
          <div>
            <p className="text-sm font-light mb-3" style={{ color: 'var(--color-text)' }}>
              편하신 식사 시간을 알려주세요.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['11시 30분', '12시 30분'] as TimeSlot[]).map(slot => {
                const on = selected === slot
                return (
                  <button
                    key={slot}
                    onClick={() => handleSelect(slot)}
                    className={['slot-btn border py-4 px-3 text-sm font-light text-left', on ? 'slot-btn--on' : ''].join(' ')}
                    style={on
                      ? { backgroundColor: 'var(--color-fill)', color: '#fff', borderColor: 'var(--color-fill)' }
                      : { backgroundColor: 'white', color: 'var(--color-text)', borderColor: 'var(--color-border)' }
                    }
                  >
                    <span className="block text-xs mb-1" style={{ opacity: 0.45 }}>
                      {on ? '—' : '○'}
                    </span>
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Guest count — revealed after slot selected */}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: extraVisible ? '130px' : '0',
              opacity: extraVisible ? 1 : 0,
              transition: 'max-height 220ms ease-out, opacity 220ms ease-out',
            }}
          >
            <p className="text-sm font-light mb-2" style={{ color: 'var(--color-text)' }}>동행 인원</p>
            <div className="border border-[var(--color-border)] flex items-center">
              <input
                type="number"
                min={0}
                max={10}
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
                placeholder="0"
                className="field-input flex-1 py-3 px-4 text-sm font-light bg-transparent border-0 outline-none"
                style={{ color: 'var(--color-text)' }}
              />
              <span className="pr-4 text-sm font-light select-none" style={{ color: 'var(--color-text-muted)' }}>명</span>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              본인 제외 동행 인원 수입니다. (선택)
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border)]" />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="submit-btn w-full py-4 text-sm font-light tracking-[0.06em] border"
            style={canSubmit
              ? { backgroundColor: 'var(--color-fill)', color: '#fff', borderColor: 'var(--color-fill)' }
              : { backgroundColor: 'white', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)', cursor: 'not-allowed' }
            }
          >
            {isLoading ? <span style={{ opacity: 0.45 }}>확인 중…</span> : '참석 확인'}
          </button>

          {error && (
            <p className="text-xs text-center" style={{ color: '#c0392b' }}>
              오류가 발생했습니다. 다시 시도해주세요.
            </p>
          )}

        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <Toast
          message={toastMsg}
          onDismiss={() => setToastMsg(null)}
        />
      )}
    </>
  )
}
