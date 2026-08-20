import Modal from './Modal'
import Icon from './Icon'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) {
  const titleNode = (
    <span className="confirm-head">
      <span className={`confirm-chip${danger ? ' confirm-chip-danger' : ''}`}>
        <Icon name={danger ? 'alertTriangle' : 'infoCircle'} size={17} />
      </span>
      {title}
    </span>
  )
  return (
    <Modal
      title={titleNode}
      onClose={onCancel}
      busy={busy}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? <><span className="spinner spinner-sm" aria-hidden="true" /> Working…</> : confirmLabel}
        </button>
      </>}
    >
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  )
}
