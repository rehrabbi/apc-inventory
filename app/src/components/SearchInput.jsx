import Icon from './Icon'

// D21: search field with a leading magnifier and a clear button that appears when
// there is text. `onChange` receives a normal input event (clear sends value '').
export default function SearchInput({ value, onChange, placeholder, ariaLabel = 'Search' }) {
  return (
    <div className="search-wrap">
      <Icon name="search" size={15} className="search-lead" />
      <input className="input search-input" type="search" value={value} onChange={onChange}
        placeholder={placeholder} aria-label={ariaLabel} />
      {value && (
        <button type="button" className="search-clear" aria-label="Clear search"
          onClick={() => onChange({ target: { value: '' } })}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
