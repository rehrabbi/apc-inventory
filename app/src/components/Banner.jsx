import Icon from './Icon'

// D9: inline page banner, tinted fill + leading status icon. Distinct from toasts.
const ICON = { ok: 'check', err: 'xCircle', info: 'infoCircle', soon: 'alertTriangle', warn: 'alertTriangle' }

export default function Banner({ msg, onClose }) {
  if (!msg) return null
  const type = msg.type || 'info'
  return (
    <div className={`banner banner-${type}`} role={type === 'err' ? 'alert' : 'status'}>
      <Icon name={ICON[type] || 'infoCircle'} size={16} className="banner-ic" />
      <span className="banner-text">{msg.text}</span>
      {onClose && (
        <button type="button" aria-label="Dismiss" onClick={onClose}>
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  )
}
