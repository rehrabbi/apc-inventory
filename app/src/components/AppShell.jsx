import { useState, useMemo, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Box, Group, Stack, Text, Drawer, Burger, ActionIcon, Button, Tabs,
  UnstyledButton, ScrollArea, useMantineColorScheme, useComputedColorScheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../auth/AuthContext'
import Icon from './Icon'

// ---------------------------------------------------------------------------
// Decision 3b: a 72px icon rail of five SECTIONS, with the screens inside each
// section as tabs under the page title. Every route from App.jsx appears
// exactly once. Rail items keep text labels under the icon.
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    id: 'home', rail: 'Home', ic: 'home',
    items: [
      { to: '/', end: true, t: 'Action Hub' },
      { to: '/dashboard', t: 'Dashboard' },
    ],
  },
  {
    id: 'ops', rail: 'Ops', ic: 'receive',
    items: [
      { to: '/receive', t: 'Receive Stock' },
      { to: '/sell', t: 'Record Sale' },
      { to: '/returns', t: 'Returns' },
      { to: '/writeoff', t: 'Write-off' },
    ],
  },
  {
    id: 'stock', rail: 'Stock', ic: 'stock',
    items: [
      { to: '/stock', t: 'Current Stock' },
      { to: '/expiry', t: 'Expiry Monitor' },
      { to: '/history', t: 'History' },
      { to: '/reports', t: 'Reports & Export' },
    ],
  },
  {
    id: 'events', rail: 'Events', ic: 'package',
    items: [{ to: '/events', t: 'Events' }],
  },
  {
    id: 'manage', rail: 'Manage', ic: 'settings', managerOnly: true,
    items: [
      { to: '/adjustments', t: 'Adjustments' },
      { to: '/products', t: 'Products' },
      { to: '/settings', t: 'Settings' },
      { to: '/users', t: 'Users' },
      { to: '/changelog', t: 'Change Log' },
    ],
  },
]

// /events/:id belongs to the events section but is not a tab.
function sectionForPath(pathname, sections) {
  if (pathname === '/') return sections.find(s => s.id === 'home')
  if (pathname.startsWith('/events')) return sections.find(s => s.id === 'events')
  return sections.find(s => s.items.some(i => pathname.startsWith(i.to) && i.to !== '/'))
}

export default function AppShell() {
  const { profile, isManager, signOut } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isMobile = useMediaQuery('(max-width: 62em)')
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const sections = useMemo(
    () => SECTIONS.filter(s => !s.managerOnly || isManager),
    [isManager],
  )
  const active = sectionForPath(pathname, sections) ?? sections[0]
  const activeTab = active?.items.find(
    i => (i.end ? pathname === i.to : pathname.startsWith(i.to)),
  )?.to
  const currentTitle = activeTab ? active?.items.find(i => i.to === activeTab)?.t : null
  useEffect(() => {
    document.title = currentTitle ? `${currentTitle} · APC Inventory` : 'APC Inventory'
  }, [currentTitle])

  const railItem = (s) => {
    const on = s.id === active?.id
    return (
      <UnstyledButton
        key={s.id}
        onClick={() => navigate(s.items[0].to)}
        aria-current={on ? 'page' : undefined}
        style={{
          width: 56, height: 56, borderRadius: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4,
          background: on ? 'var(--mantine-color-slate-6)' : 'transparent',
          boxShadow: on ? 'inset 2px 0 0 var(--mantine-color-crimson-6)' : 'none',
          color: on ? '#FBFCFD' : 'var(--mantine-color-slate-4)',
        }}
      >
        <Icon name={s.ic} size={20} />
        <Text component="span" fz={9.5} fw={on ? 600 : 400}>{s.rail}</Text>
      </UnstyledButton>
    )
  }

  const drawerNav = (
    <ScrollArea.Autosize mah="calc(100vh - 80px)">
      <Stack gap={2} p="sm">
        {sections.map(s => (
          <Box key={s.id} mt="sm">
            <Text fz={10.5} fw={600} tt="uppercase" c="slate.4" px={10} pb={4}
              style={{ letterSpacing: '.05em' }}>
              {s.rail === 'Ops' ? 'Operations' : s.rail === 'Manage' ? 'Management' : s.rail}
            </Text>
            {s.items.map(i => (
              <UnstyledButton
                key={i.to}
                component={NavLink}
                to={i.to}
                end={i.end}
                onClick={() => setDrawer(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  minHeight: 48, padding: '0 10px', borderRadius: 10,
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#FFFFFF' : '#E6EAEF',
                  background: isActive ? 'var(--mantine-color-slate-6)' : 'transparent',
                  boxShadow: isActive ? 'inset 2px 0 0 var(--mantine-color-crimson-6)' : 'none',
                })}
              >
                {i.t}
              </UnstyledButton>
            ))}
          </Box>
        ))}
      </Stack>
    </ScrollArea.Autosize>
  )

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '72px 1fr', minHeight: '100vh' }}>
      {!isMobile && (
        <Box component="nav" aria-label="Sections"
          style={{ background: 'var(--mantine-color-slate-7)', padding: '12px 8px' }}>
          <Stack gap={8} align="center">
            <Box style={{ marginBottom: 8, display: 'grid', placeItems: 'center' }}>
              <img src="/apc-logo.png" alt="APC" width={46} height={46} style={{ display: 'block' }} />
            </Box>
            {sections.map(railItem)}
          </Stack>
        </Box>
      )}

      <Box style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box component="header" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: isMobile ? '0 12px' : '0 24px',
          minHeight: isMobile ? 56 : 60,
          borderBottom: '1px solid var(--apc-border)',
          background: 'var(--apc-surface)',
          position: isMobile ? 'sticky' : 'static', top: 0, zIndex: 100,
        }}>
          {isMobile && (
            <>
              <Burger opened={drawer} onClick={() => setDrawer(o => !o)}
                aria-label="Open navigation" size="sm" style={{ width: 44, height: 44 }} />
              <Text fw={700} fz={16} truncate>{activeTab ? active.items.find(i => i.to === activeTab)?.t : 'APC Inventory'}</Text>
            </>
          )}
          <Box style={{ flex: 1 }} />
          <ActionIcon
            onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
            aria-label={scheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={scheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </ActionIcon>
          {!isMobile && (
            <Text fz="md" c="dimmed">
              {profile?.full_name}, {isManager ? 'Manager' : 'Staff'}
            </Text>
          )}
          <Button variant="default" onClick={signOut}>Sign out</Button>
        </Box>

        {!isMobile && active && (
          <Tabs
            value={activeTab ?? null}
            onChange={(v) => v && navigate(v)}
            variant="unstyled"
            keepMounted={false}
          >
            <Tabs.List style={{
              gap: 4, padding: '16px 24px 0',
              borderBottom: '1px solid var(--apc-border)',
              background: 'var(--apc-surface)',
            }}>
              {active.items.map(i => (
                <Tabs.Tab key={i.to} value={i.to} style={{
                  padding: '0 14px', minHeight: 44,
                  fontSize: 13.5,
                  fontWeight: activeTab === i.to ? 600 : 400,
                  color: activeTab === i.to ? 'var(--mantine-color-crimson-8)' : 'var(--apc-text)',
                  boxShadow: activeTab === i.to ? 'inset 0 -2px 0 var(--mantine-color-crimson-6)' : 'none',
                }}>
                  {i.t}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        )}

        <Box style={{ background: 'var(--apc-page)', flex: 1, padding: isMobile ? 16 : 24, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>

      <Drawer
        opened={drawer}
        onClose={() => setDrawer(false)}
        size={288}
        withCloseButton={false}
        padding={0}
        overlayProps={{ backgroundOpacity: 0.55 }}
        styles={{ content: { background: 'var(--mantine-color-slate-7)' } }}
      >
        <Group justify="space-between" p="md" pb={0}>
          <Group gap={12}>
            <Box style={{ display: 'grid', placeItems: 'center' }}>
              <img src="/apc-logo.png" alt="APC" width={34} height={34} style={{ display: 'block' }} />
            </Box>
            <Text fw={700} fz={15} c="#FBFCFD">Inventory</Text>
          </Group>
          <ActionIcon onClick={() => setDrawer(false)} aria-label="Close navigation"
            variant="subtle" color="gray">
            <Text fz={20} c="slate.4" lh={1}>&#10005;</Text>
          </ActionIcon>
        </Group>
        {drawerNav}
      </Drawer>
    </Box>
  )
}
