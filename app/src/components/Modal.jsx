import { useEffect, useRef, useId } from 'react'

export default function Modal({ title, onClose, children, footer, busy = false }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  // Move focus into the dialog on open, return it to the opener on close.
  useEffect(() => {
    const opener = document.activeElement
    dialogRef.current?.focus()
    return () => { if (opener && typeof opener.focus === 'function') opener.focus() }
  }, [])

  // Escape closes (unless busy) and Tab is trapped within the dialog.
  useEffect(() => {
    const dlg = dialogRef.current
    const focusables = () => Array.from(
      dlg?.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? []
    )
    const onKey = (e) => {
      if (e.key === 'Escape') { if (!busy) onClose(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); return }
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  return (
    <div className="modal-overlay" onClick={() => { if (!busy) onClose() }}>
      <div className="modal card" role="dialog" aria-modal="true" aria-labelledby={titleId}
        ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <span id={titleId} className="modal-title">{title}</span>
          <button className="x" type="button" onClick={onClose} aria-label="Close" disabled={busy}>✕</button>
        </div>
        <div className="card-b">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
