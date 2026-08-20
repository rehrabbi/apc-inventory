import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { signIn, signOut, status, error } = useAuth()

  if (status === 'denied') {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="logo-mark logo-44" style={{ margin: '0 auto' }}>APC</div>
          <h1>No access yet</h1>
          <p>Your Google account isn’t on the access list. Ask a manager to add your email in <b>Users</b>, then sign in again.</p>
          <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="logo-mark logo-44" style={{ margin: '0 auto' }}>APC</div>
          <h1>Something went wrong</h1>
          <p>{error || 'We could not verify your access. Check your connection and try again.'}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="logo-mark logo-44" style={{ margin: '0 auto' }}>APC</div>
        <h1>APC Inventory</h1>
        <p>Sign in to manage stock, batches, and events.</p>
        <button className="gbtn" onClick={signIn}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20-8 20-21 0-1.3-.1-2.5-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 42.3 16 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C40.9 36.5 44 31 44 24c0-1.3-.1-2.5-.4-3.5z" />
          </svg>
          Continue with Google
        </button>
        {error && <p className="help error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  )
}
