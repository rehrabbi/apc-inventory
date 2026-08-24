import { useState } from 'react'
import Modal from './Modal'
import Icon from './Icon'

// GitHub-style destructive confirmation: the confirm button stays disabled until the user
// types the exact phrase (e.g. RESET, or the event name). Used only in the owner Danger Zone.
export default function DangerConfirm({ title, description, confirmPhrase, confirmLabel = 'Delete', busy = false, onConfirm, onCancel }) {
  const [text, setText] = useState('')
  const ok = text.trim() === confirmPhrase

  return (
    <Modal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--crit)' }}>
        <Icon name="alertTriangle" size={18} />{title}
      </span>}
      onClose={() => { if (!busy) onCancel() }}
      busy={busy}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={!ok || busy}>
          {busy ? <><span className="spinner spinner-sm" aria-hidden="true" />Working…</> : confirmLabel}
        </button>
      </>}
    >
      <div className="danger-body">
        <p>{description}</p>
        <p className="danger-warn">This action is permanent and cannot be undone.</p>
        <label htmlFor="danger-phrase">To confirm, type <code>{confirmPhrase}</code> below:</label>
        <input
          id="danger-phrase" className="input" value={text} autoComplete="off" autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && ok && !busy) onConfirm() }}
          placeholder={confirmPhrase}
        />
      </div>
    </Modal>
  )
}
