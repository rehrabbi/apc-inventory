// Small inline-SVG icon set (no dependency). Stroke icons, 24x24, currentColor.
const PATHS = {
  home: ['M3 9.6 12 3l9 6.6V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M9 21v-6h6v6'],
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  receive: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  cart: ['M8 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M19 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 2-1.6L23 6.5H5.2'],
  returns: ['M9 14 4 9l5-5', 'M4 9h11a5 5 0 0 1 0 10h-1'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  package: ['M16.5 9.4 7.5 4.2', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.3 7 12 12l8.7-5', 'M12 22V12'],
  stock: ['M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z', 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M9 12h6', 'M9 16h6'],
  hourglass: ['M6 2h12', 'M6 22h12', 'M6 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2', 'M6 22v-5a6 6 0 0 1 6-6 6 6 0 0 1 6 6v5'],
  receipt: ['M5 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
  upload: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M12 2v14', 'M8 6l4-4 4 4'],
  download: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M12 2v14', 'M8 12l4 4 4-4'],
  clipboardCheck: ['M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z', 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M9 14l2 2 4-4'],
  tag: ['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z', 'M7 7h.01'],
  settings: ['M21 4H10', 'M6 4H3', 'M21 12H12', 'M8 12H3', 'M21 20H15', 'M11 20H3', 'M10 2v4', 'M8 10v4', 'M14 18v4'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  history: ['M3 3v5h5', 'M3.05 13A9 9 0 1 0 6 5.3L3 8', 'M12 7v5l3 2'],
  trendUp: ['M22 7 13.5 15.5 8.5 10.5 2 17', 'M16 7h6v6'],
  trendDown: ['M22 17 13.5 8.5 8.5 13.5 2 7', 'M16 17h6v-6'],
  clock: ['M12 7v5l3 2', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  sun: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 1v2', 'M12 21v2', 'M4.2 4.2l1.4 1.4', 'M18.4 18.4l1.4 1.4', 'M1 12h2', 'M21 12h2', 'M4.2 19.8l1.4-1.4', 'M18.4 5.6l1.4-1.4'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'],
  bell: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  xCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M15 9l-6 6', 'M9 9l6 6'],
  infoCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16v-4', 'M12 8h.01'],
  alertTriangle: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm21 21-4.3-4.3'],
  plus: ['M12 5v14', 'M5 12h14'],
}

export default function Icon({ name, size = 18, className, strokeWidth = 1.75 }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}
