import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'

// Route components are code-split so the initial bundle stays small.
const ActionHub = lazy(() => import('./pages/ActionHub'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reports = lazy(() => import('./pages/Reports'))
const Products = lazy(() => import('./pages/Products'))
const Receive = lazy(() => import('./pages/Receive'))
const Sell = lazy(() => import('./pages/Sell'))
const Stock = lazy(() => import('./pages/Stock'))
const Returns = lazy(() => import('./pages/Returns'))
const Writeoff = lazy(() => import('./pages/Writeoff'))
const Expiry = lazy(() => import('./pages/Expiry'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const History = lazy(() => import('./pages/History'))
const Adjustments = lazy(() => import('./pages/Adjustments'))
const Users = lazy(() => import('./pages/Users'))
const Settings = lazy(() => import('./pages/Settings'))
const ChangeLog = lazy(() => import('./pages/ChangeLog'))

function Protected() {
  const { status } = useAuth()
  if (status === 'loading') return <div className="splash">Loading…</div>
  if (status !== 'authorized') return <Navigate to="/login" replace />
  return <Outlet />
}

function ManagerOnly({ children }) {
  const { isManager } = useAuth()
  return isManager ? children : <Navigate to="/" replace />
}

export default function App() {
  const { status } = useAuth()
  return (
    <Suspense fallback={<div className="splash">Loading…</div>}>
      <Routes>
        <Route path="/login" element={status === 'authorized' ? <Navigate to="/" replace /> : <Login />} />

        <Route element={<Protected />}>
          <Route element={<AppShell />}>
            <Route index element={<ActionHub />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="receive" element={<Receive />} />
            <Route path="sell" element={<Sell />} />
            <Route path="returns" element={<Returns />} />
            <Route path="writeoff" element={<Writeoff />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="stock" element={<Stock />} />
            <Route path="expiry" element={<Expiry />} />
            <Route path="history" element={<History />} />
            <Route path="adjustments" element={<ManagerOnly><Adjustments /></ManagerOnly>} />
            <Route path="products" element={<ManagerOnly><Products /></ManagerOnly>} />
            <Route path="settings" element={<ManagerOnly><Settings /></ManagerOnly>} />
            <Route path="users" element={<ManagerOnly><Users /></ManagerOnly>} />
            <Route path="changelog" element={<ManagerOnly><ChangeLog /></ManagerOnly>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
