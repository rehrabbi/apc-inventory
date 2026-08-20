import Icon from './Icon'

// D14: icon + title + description, with an optional action. Neutral icon (not the
// crimson alert chip) since "no data yet" is not an error.
export default function EmptyState({ icon = 'package', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-ic"><Icon name={icon} size={24} /></span>
      {title && <div className="empty-title">{title}</div>}
      {children && <div className="empty-desc">{children}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
