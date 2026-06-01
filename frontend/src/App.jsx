import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastContainer } from './components/Toast'
import OfflineScreen   from './components/OfflineScreen'
import DashboardPage   from './pages/DashboardPage'
import BSTPage         from './pages/BSTPage'
import TargetBSTPage   from './pages/TargetBSTPage'
import NhomHangPage    from './pages/NhomHangPage'
import NhaCungCapPage  from './pages/NhaCungCapPage'
import TaiKhoanPage    from './pages/TaiKhoanPage'
import VatTuPage       from './pages/VatTuPage'
import KhoVatTuPage    from './pages/KhoVatTuPage'
import PhatTrienSPPage from './pages/PhatTrienSPPage'
import KeHoachSXPage   from './pages/KeHoachSXPage'
import NhaMayPage      from './pages/NhaMayPage'

export default function App() {
  // 'checking' | 'online' | 'offline'
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    async function ping() {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(4000) })
        setBackendStatus(r.ok ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }
    ping()
  }, [])

  // Show dark loading screen while checking
  if (backendStatus === 'checking') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0F172A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: '#64748B', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 40 }}>🏭</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>BST Manager</div>
        <div style={{
          width: 32, height: 32, border: '3px solid #334155',
          borderTopColor: '#2563EB', borderRadius: '50%',
          animation: 'spin .7s linear infinite', marginTop: 8,
        }} />
        <div style={{ fontSize: 13 }}>Đang kết nối backend…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Show full-screen error when backend is offline
  if (backendStatus === 'offline') {
    return <OfflineScreen onOnline={() => setBackendStatus('online')} />
  }

  return (
    <Layout>
      <ToastContainer />
      <Routes>
        <Route path="/"               element={<DashboardPage />} />
        <Route path="/bst"            element={<BSTPage />} />
        <Route path="/target-bst"     element={<TargetBSTPage />} />
        <Route path="/nhom-hang"      element={<NhomHangPage />} />
        <Route path="/nha-cung-cap"   element={<NhaCungCapPage />} />
        <Route path="/tai-khoan"      element={<TaiKhoanPage />} />
        <Route path="/vat-tu"         element={<VatTuPage />} />
        <Route path="/kho-vat-tu"     element={<KhoVatTuPage />} />
        <Route path="/phat-trien-sp"  element={<PhatTrienSPPage />} />
        <Route path="/ke-hoach-sx"    element={<KeHoachSXPage />} />
        <Route path="/nha-may"        element={<NhaMayPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
