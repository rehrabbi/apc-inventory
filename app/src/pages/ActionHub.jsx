import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, Group, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { overview } from '../lib/api'
import Icon from '../components/Icon'

const TASKS = [
  { to: '/receive', ic: 'receive', t: 'Receive Stock', s: 'Log a delivery' },
  { to: '/sell', ic: 'cart', t: 'Record Sale', s: 'Online order' },
  { to: '/returns', ic: 'returns', t: 'Return', s: 'Customer return' },
  { to: '/writeoff', ic: 'trash', t: 'Write-off', s: 'Damage or expiry' },
]

// Alert rows keep the exact strings and singular/plural rules from the original.
// The only change: each row now carries its own action label, so the fix is one
// tap from the alert instead of a guess about where the row leads.
function AlertRow({ tone, icon, to, action, children }) {
  const c = tone === 'crit' ? 'crit' : 'warn'
  return (
    <UnstyledButton
      component={Link}
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: 44, padding: '0 14px', borderRadius: 12,
        fontSize: 13.5, textDecoration: 'none',
        background: `var(--apc-${c}-bg)`,
        color: `var(--apc-${c}-fg)`,
        border: `1px solid var(--apc-${c}-border)`,
      }}
    >
      <Icon name={icon} size={16} />
      <Text component="span" fz={13.5} style={{ flex: 1 }}>{children}</Text>
      <Text component="span" fz={13.5} fw={600}>{action}</Text>
    </UnstyledButton>
  )
}

function Tile({ label, value, tone }) {
  const color = tone === 'crit' ? 'var(--apc-crit-fg)'
    : tone === 'warn' ? 'var(--apc-warn-fg)'
    : 'var(--apc-text)'
  return (
    <Card>
      <Text fz="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '.05em' }}>
        {label}
      </Text>
      <Text fz={32} fw={700} mt={6} lts="-.02em" c={color}
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Text>
    </Card>
  )
}

export default function ActionHub() {
  const [m, setM] = useState(null)
  useEffect(() => {
    overview()
      .then(setM)
      .catch(() => setM({ totalSkus: 0, low: 0, near: 0, expired: 0 }))
  }, [])

  const alerts = []
  if (m?.expired) alerts.push({
    tone: 'crit', to: '/expiry', action: 'Write off now', n: m.expired,
    text: `expired batch${m.expired > 1 ? 'es' : ''} need write-off`,
  })
  if (m?.near) alerts.push({
    tone: 'warn', to: '/stock', action: 'Review', n: m.near,
    text: `batch${m.near > 1 ? 'es' : ''} near expiry`,
  })
  if (m?.low) alerts.push({
    tone: 'warn', to: '/stock', action: 'Review', n: m.low,
    text: `product${m.low > 1 ? 's' : ''} low on stock`,
  })

  return (
    <Stack gap="lg">
      <Box>
        <Title order={1}>What would you like to do?</Title>
        <Text fz="md" c="dimmed" mt={4}>Pick a task, or check what needs attention below.</Text>
      </Box>

      {alerts.length > 0 ? (
        <Stack gap={8}>
          {alerts.map((a, i) => (
            <AlertRow key={i} tone={a.tone} icon="bell" to={a.to} action={a.action}>
              <Text component="span" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {a.n}
              </Text>{' '}{a.text}
            </AlertRow>
          ))}
        </Stack>
      ) : (
        <Box style={{
          display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 14px',
          borderRadius: 12, fontSize: 13.5,
          background: 'var(--apc-warn-bg)', color: 'var(--apc-warn-fg)',
          border: '1px solid var(--apc-warn-border)',
        }}>
          Nothing needs attention right now.
        </Box>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {TASKS.map(t => (
          <UnstyledButton key={t.to} component={Link} to={t.to} style={{ textDecoration: 'none' }}>
            <Card style={{ minHeight: 132, height: '100%' }}>
              <Stack gap={12}>
                <Box style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--apc-crit-bg)', color: 'var(--mantine-color-crimson-8)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={t.ic} size={20} />
                </Box>
                <Text fw={600} fz="lg">{t.t}</Text>
                <Text fz="sm" c="dimmed">{t.s}</Text>
              </Stack>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        <Tile label="Total SKUs"  value={m?.totalSkus ?? '·'} />
        <Tile label="Low Stock"   value={m?.low ?? '·'}      tone="warn" />
        <Tile label="Near-Expiry" value={m?.near ?? '·'}     tone="warn" />
        <Tile label="Expired"     value={m?.expired ?? '·'}  tone="crit" />
      </SimpleGrid>
    </Stack>
  )
}
