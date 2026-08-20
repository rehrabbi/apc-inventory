// D13: skeleton placeholders (shimmer, static under reduced-motion).
export function Skeleton({ w = '100%', h = 11, style }) {
  return <span className="sk" style={{ width: w, height: h, ...style }} />
}

const WIDTHS = ['70%', '82%', '55%', '45%', '64%', '50%', '72%', '40%']

// Renders N placeholder <tr>s matching a table's column count. Use inside <tbody>.
export function SkeletonRows({ cols = 4, rows = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={`sk-${r}`} aria-hidden="true">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c}><span className="sk" style={{ width: WIDTHS[(r + c) % WIDTHS.length] }} /></td>
      ))}
    </tr>
  ))
}
