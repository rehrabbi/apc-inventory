// Client-side CSV/JSON export helpers (no dependencies; CSV opens in Excel)

export function toCSV(rows, columns) {
  if (!rows.length) return ''
  const cols = columns || Object.keys(rows[0]).map(k => ({ key: k, label: k }))
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = cols.map(c => esc(c.label)).join(',')
  const body = rows.map(r => cols.map(c => esc(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(',')).join('\n')
  return head + '\n' + body
}

export function download(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function stamp() {
  return new Date().toISOString().slice(0, 10)
}
