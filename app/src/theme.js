// APC Inventory design tokens, decision 2c "cool neutrals" + APC crimson.
// This file replaces styles/tokens.css as the source of truth once every screen
// is migrated. Do NOT reintroduce a tokens.css: edit values here only.
import { createTheme, rem } from '@mantine/core'

// --- Brand ---------------------------------------------------------------
// #D81F26 is the APC crimson and MUST stay exactly this value at index 6.
// Crimson is a controlled accent: focus rings, the logo mark, the active rail
// marker, destructive text. It is never a background wash.
const crimson = [
  '#FDF2F2', '#FBE3E3', '#F5C4C6', '#EE9EA1', '#E76F74',
  '#E14349', '#D81F26', '#C21B21', '#A11419', '#7A0F13',
]

// --- Neutrals ------------------------------------------------------------
// Cool grey ramp. index 5 (#626B75) is the muted text token: it clears WCAG AA
// on both the page background (#F4F6F8, 4.96:1) and the table header fill
// (#FBFCFD, 5.05:1). Do not lighten it.
const slate = [
  '#F4F6F8', '#ECEFF3', '#E2E5E9', '#D3D8DE', '#98A1AB',
  '#626B75', '#414851', '#2B3038', '#1C2026', '#14171C',
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
    '--apc-surface-alt': '#FBFCFD',
    '--apc-border': t.colors.slate[2],
    '--apc-border-strong': t.colors.slate[3],
    '--apc-text': '#181C22',
    '--apc-text-muted': t.colors.slate[5],
    '--apc-ok-fg': semantic.ok.fg,       '--apc-ok-bg': semantic.ok.bg,       '--apc-ok-border': semantic.ok.border,       '--apc-ok-dot': semantic.ok.dot,
    '--apc-warn-fg': semantic.warn.fg,   '--apc-warn-bg': semantic.warn.bg,   '--apc-warn-border': semantic.warn.border,   '--apc-warn-dot': semantic.warn.dot,
    '--apc-crit-fg': semantic.critical.fg, '--apc-crit-bg': semantic.critical.bg, '--apc-crit-border': semantic.critical.border, '--apc-crit-dot': semantic.critical.dot,
  },
  dark: {
    '--apc-page': t.colors.slate[9],
    '--apc-surface': t.colors.slate[8],
    '--apc-surface-alt': '#20242B',
    '--apc-border': '#2F343B',
    '--apc-border-strong': '#3A4048',
    '--apc-text': '#F2F4F7',
    '--apc-text-muted': '#A8B0BA',
    '--apc-ok-fg': semanticDark.ok.fg,       '--apc-ok-bg': semanticDark.ok.bg,       '--apc-ok-border': semanticDark.ok.border,       '--apc-ok-dot': semanticDark.ok.dot,
    '--apc-warn-fg': semanticDark.warn.fg,   '--apc-warn-bg': semanticDark.warn.bg,   '--apc-warn-border': semanticDark.warn.border,   '--apc-warn-dot': semanticDark.warn.dot,
    '--apc-crit-fg': semanticDark.critical.fg, '--apc-crit-bg': semanticDark.critical.bg, '--apc-crit-border': semanticDark.critical.border, '--apc-crit-dot': semanticDark.critical.dot,
  },
})
