// APC Inventory design tokens, decision 2c "cool neutrals" + APC crimson.
// This file replaces styles/tokens.css as the source of truth once every screen
// is migrated. Do NOT reintroduce a tokens.css: edit values here only.
import { createTheme, rem } from '@mantine/core'

// --- Brand ---------------------------------------------------------------
// #CA181F is the APC brand red (matches the logo) and MUST stay exactly this
// value at index 6. It is a controlled accent: focus rings, the active rail
// marker, primary Mantine actions, destructive text. Never a background wash.
const crimson = [
  '#FDF2F2', '#FBE4E4', '#F4C3C5', '#EC9C9F', '#E46E72',
  '#DB3B41', '#CA181F', '#AF141A', '#8E1015', '#6C0C10',
]

// --- Neutrals ------------------------------------------------------------
// Near-neutral warm grey ramp keyed to the palette (bg #FCFAFA, text #090304).
// index 5 (#6E6668) is the muted text token: it clears WCAG AA on white
// (~5.0:1) and the surface-alt fill. Do not lighten it.
const slate = [
  '#FCFAFA', '#F4F1F1', '#E9E4E4', '#D9D3D3', '#A49C9D',
  '#6E6668', '#4A4446', '#241F21', '#171314', '#0E0B0C',
]

export const semantic = {
  ok:       { fg: '#14532D', bg: '#E4F1E9', border: '#BEDCC9', dot: '#1E7A48' },
  warn:     { fg: '#7C3B06', bg: '#FBEAD3', border: '#F0D3A8', dot: '#B45309' },
  critical: { fg: '#7A0F13', bg: '#FBEBEB', border: '#EFC4C6', dot: '#C21B21' },
}

export const semanticDark = {
  ok:       { fg: '#8FD3AC', bg: '#14251C', border: '#1F3A2B', dot: '#2E9E60' },
  warn:     { fg: '#E8B579', bg: '#2A1E10', border: '#43301A', dot: '#C97A1A' },
  critical: { fg: '#F0A7AB', bg: '#2A1517', border: '#452226', dot: '#D8474E' },
}

export const theme = createTheme({
  colors: { crimson, slate },
  primaryColor: 'crimson',
  primaryShade: { light: 6, dark: 5 },

  fontFamily: '"Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
  headings: {
    fontFamily: '"Public Sans", system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(24), lineHeight: '1.2' },
      h2: { fontSize: rem(20), lineHeight: '1.25' },
      h3: { fontSize: rem(16), lineHeight: '1.3' },
    },
  },
  fontSizes: {
    xs: rem(10.5), sm: rem(12.5), md: rem(13.5), lg: rem(15), xl: rem(17),
  },
  lineHeights: { xs: '1.4', sm: '1.5', md: '1.6', lg: '1.65', xl: '1.7' },

  defaultRadius: 'md',
  radius: { sm: rem(8), md: rem(10), lg: rem(14), xl: rem(16) },
  spacing: { xs: rem(6), sm: rem(10), md: rem(14), lg: rem(20), xl: rem(28) },

  // Every interactive control clears the 40px minimum from the brief.
  // 44px is the floor we actually design to; phone controls go to 48px.
  components: {
    Button:     { defaultProps: { size: 'md' },        styles: { root: { minHeight: rem(44), fontWeight: 600 } } },
    ActionIcon: { defaultProps: { size: rem(44), variant: 'default' } },
    TextInput:  { styles: { input: { minHeight: rem(44) }, label: { fontWeight: 600, marginBottom: rem(6) } } },
    NumberInput:{ styles: { input: { minHeight: rem(44) }, label: { fontWeight: 600, marginBottom: rem(6) } } },
    Select:     { styles: { input: { minHeight: rem(44) }, label: { fontWeight: 600, marginBottom: rem(6) } } },
    DateInput:  { styles: { input: { minHeight: rem(44) }, label: { fontWeight: 600, marginBottom: rem(6) } } },
    Textarea:   { styles: { label: { fontWeight: 600, marginBottom: rem(6) } } },
    Table:      { defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' } },
    Modal:      { defaultProps: { centered: true, radius: 'lg', overlayProps: { backgroundOpacity: 0.5, blur: 0 } } },
    Drawer:     { defaultProps: { radius: 0 } },
    Card:       { defaultProps: { radius: 'lg', withBorder: true, padding: 'lg' } },
  },

  other: {
    railWidth: rem(72),
    headerHeight: rem(60),
    tabular: { fontVariantNumeric: 'tabular-nums' },
  },
})

// Extra CSS variables the app reads directly. Mantine emits these per scheme,
// so semantic colours flip with the theme without any JS.
export const cssVariablesResolver = (t) => ({
  variables: {
    '--apc-tabular': 'tabular-nums',
  },
  light: {
    '--apc-page': t.colors.slate[0],
    '--apc-surface': '#FFFFFF',
    '--apc-surface-alt': '#FBF9F9',
    '--apc-border': t.colors.slate[2],
    '--apc-border-strong': t.colors.slate[3],
    '--apc-text': '#090304',
    '--apc-text-muted': t.colors.slate[5],
    '--apc-ok-fg': semantic.ok.fg,       '--apc-ok-bg': semantic.ok.bg,       '--apc-ok-border': semantic.ok.border,       '--apc-ok-dot': semantic.ok.dot,
    '--apc-warn-fg': semantic.warn.fg,   '--apc-warn-bg': semantic.warn.bg,   '--apc-warn-border': semantic.warn.border,   '--apc-warn-dot': semantic.warn.dot,
    '--apc-crit-fg': semantic.critical.fg, '--apc-crit-bg': semantic.critical.bg, '--apc-crit-border': semantic.critical.border, '--apc-crit-dot': semantic.critical.dot,
  },
  dark: {
    '--apc-page': t.colors.slate[9],
    '--apc-surface': t.colors.slate[8],
    '--apc-surface-alt': '#201B1D',
    '--apc-border': '#322B2D',
    '--apc-border-strong': '#40383A',
    '--apc-text': '#F5F1EF',
    '--apc-text-muted': '#A79F9F',
    '--apc-ok-fg': semanticDark.ok.fg,       '--apc-ok-bg': semanticDark.ok.bg,       '--apc-ok-border': semanticDark.ok.border,       '--apc-ok-dot': semanticDark.ok.dot,
    '--apc-warn-fg': semanticDark.warn.fg,   '--apc-warn-bg': semanticDark.warn.bg,   '--apc-warn-border': semanticDark.warn.border,   '--apc-warn-dot': semanticDark.warn.dot,
    '--apc-crit-fg': semanticDark.critical.fg, '--apc-crit-bg': semanticDark.critical.bg, '--apc-crit-border': semanticDark.critical.border, '--apc-crit-dot': semanticDark.critical.dot,
  },
})
