import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const NAV = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/',              icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    label: 'Danh mục',
    items: [
      { to: '/nhom-hang',     icon: '🏷️', label: 'Nhóm hàng' },
      { to: '/nha-cung-cap',  icon: '🏢', label: 'Nhà cung cấp' },
      { to: '/vat-tu',        icon: '📦', label: 'Danh mục vật tư' },
      { to: '/tai-khoan',     icon: '👤', label: 'Tài khoản' },
    ],
  },
  {
    label: 'Kế hoạch BST',
    items: [
      { to: '/bst',           icon: '🗂️', label: 'Bộ sưu tập (BST)' },
      { to: '/target-bst',    icon: '🎯', label: 'Target BST' },
    ],
  },
  {
    label: 'Sản xuất',
    items: [
      { to: '/phat-trien-sp', icon: '✏️', label: 'Phát triển SP' },
      { to: '/ke-hoach-sx',   icon: '🏭', label: 'Kế hoạch SX' },
      { to: '/nha-may',       icon: '🔧', label: 'Nhà máy GC' },
    ],
  },
  {
    label: 'Kho',
    items: [
      { to: '/kho-vat-tu',    icon: '🏪', label: 'Nhập/Xuất/Tồn kho' },
    ],
  },
]

function ServerStatus() {
  const [status, setStatus] = useState('checking') // 'checking' | 'online' | 'offline'
  const [retrying, setRetrying] = useState(false)

  async function check() {
    try {
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(4000) })
      setStatus(r.ok ? 'online' : 'offline')
    } catch {
      setStatus('offline')
    }
  }

  useEffect(() => {
    check()
    // Re-check every 10s when offline, 30s when online
    const t = setInterval(check, status === 'offline' ? 10000 : 30000)
    return () => clearInterval(t)
  }, [status])

  async function retry() {
    setRetrying(true)
    setStatus('checking')
    await check()
    setRetrying(false)
  }

  if (status === 'checking') return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid #374151', fontSize: 11, color: '#9CA3AF' }}>
      ⏳ Đang kết nối…
    </div>
  )

  if (status === 'offline') return (
    <div style={{ padding: '12px 14px', borderTop: '1px solid #7F1D1D', background: '#450A0A' }}>
      <div style={{ fontSize: 12, color: '#F87171', fontWeight: 700, marginBottom: 6 }}>🔴 Backend chưa chạy!</div>
      <div style={{ fontSize: 11, color: '#FCA5A5', lineHeight: 1.7 }}>
        Mở <b>start.bat</b> để khởi động<br />
        hoặc chạy thủ công:<br />
        <code style={{ background: '#7F1D1D', padding: '1px 5px', borderRadius: 3, display: 'block', marginTop: 4 }}>
          cd backend
        </code>
        <code style={{ background: '#7F1D1D', padding: '1px 5px', borderRadius: 3, display: 'block', marginTop: 2 }}>
          npm run dev
        </code>
      </div>
      <button
        onClick={retry}
        disabled={retrying}
        style={{
          marginTop: 8, width: '100%', padding: '5px 0',
          background: retrying ? '#374151' : '#1D4ED8',
          color: 'white', border: 'none', borderRadius: 5,
          fontSize: 11, cursor: 'pointer', fontWeight: 600,
        }}
      >
        {retrying ? '⏳ Đang thử...' : '🔄 Thử lại kết nối'}
      </button>
    </div>
  )

  return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid #374151', fontSize: 11, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 7, height: 7, background: '#4ADE80', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
      Backend online
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>BST Manager</h1>
          <span>Quản lý bộ sưu tập thời trang</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <ServerStatus />
      </aside>
      <main className="main-content">{children}</main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50%       { opacity: .4 }
        }
      `}</style>
    </div>
  )
}
