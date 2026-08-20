import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Icon from './Icon'

// D8: custom toast system. Default = elevated accent-left-bar card; pill variant
// for quick confirmations. Bottom-right, success/info auto-dismiss, errors persist.
const ToastCtx = createContext(null)
const ICON = { ok: 'check', err: 'xCircle', info: 'infoCircle', warn: 'alertTriangle' }
let seq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
    const tm = timers.current[id]
    if (tm) { clearTimeout(tm); delete timers.current[id] }
  }, [])

  const show = useCallback((type, text, opts = {}) => {
    const id = ++seq
    const duration = opts.duration ?? (type === 'err' ? null : 4200)
    setToasts(t => [...t, { id, type, text, variant: opts.variant || 'card', message: opts.message }])
    if (duration) timers.current[id] = setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout) }, [])

  const api = useMemo(() => ({
    success: (text, opts) => show('ok', text, opts),
    error: (text, opts) => show('err', text, opts),
    info: (text, opts) => show('info', text, opts),
    show,
  }), [show])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}${t.variant === 'pill' ? ' toast-pill' : ''}`}
            role={t.type === 'err' ? 'alert' : 'status'}>
            <span className="toast-ic"><Icon name={ICON[t.type] || 'infoCircle'} size={t.variant === 'pill' ? 14 : 18} /></span>
            <div className="toast-body">
              <div className="toast-title">{t.text}</div>
              {t.message && <div className="toast-msg">{t.message}</div>}
            </div>
            <button type="button" className="toast-x" aria-label="Dismiss" onClick={() => remove(t.id)}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
