import { useState, useEffect } from 'react'

export default function OfflineScreen({ onOnline }) {
  const [checking, setChecking] = useState(false)
  const [dots, setDots] = useState('')

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDots((d) => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  // Auto-retry every 5 seconds
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(3000) })
        if (r.ok) onOnline()
      } catch { /* still offline */ }
    }, 5000)
    return () => clearInterval(t)
  }, [onOnline])

  async function retry() {
    setChecking(true)
    try {
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) })
      if (r.ok) { onOnline(); return }
    } catch { /* still offline */ }
    setChecking(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: '#0F172A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0, padding: 24,
    }}>
      {/* Logo */}
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
      <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>BST Manager</h1>
      <p style={{ color: '#64748B', fontSize: 14, marginTop: 4, marginBottom: 32 }}>Quản lý bộ sưu tập thời trang</p>

      {/* Error card */}
      <div style={{
        background: '#1E293B', border: '1px solid #EF444433',
        borderRadius: 12, padding: '24px 32px', maxWidth: 440, width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔴</div>
        <h2 style={{ color: '#F87171', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
          Không kết nối được Backend
        </h2>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 20px', lineHeight: 1.7 }}>
          Server chưa chạy. Hãy khởi động backend trước khi dùng ứng dụng.
        </p>

        {/* Steps */}
        <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
          <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Cách khắc phục
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#1D4ED8', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>1</span>
              <span style={{ color: '#CBD5E1', fontSize: 13 }}>Nhấn đúp vào <b style={{ color: 'white' }}>start.bat</b> trong thư mục dự án</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ background: '#374151', color: '#9CA3AF', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</span>
              <div style={{ color: '#64748B', fontSize: 12 }}>
                Hoặc mở terminal trong thư mục <code style={{ color: '#A5F3FC' }}>/backend</code> và chạy:
                <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', marginTop: 6, fontFamily: 'monospace', fontSize: 13, color: '#7DD3FC' }}>
                  npm run dev
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retry button */}
        <button
          onClick={retry}
          disabled={checking}
          style={{
            width: '100%', padding: '10px 0',
            background: checking ? '#374151' : '#2563EB',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'background .15s',
          }}
        >
          {checking ? `⏳ Đang kiểm tra${dots}` : '🔄 Kiểm tra lại kết nối'}
        </button>

        <p style={{ color: '#475569', fontSize: 11, marginTop: 12 }}>
          Tự động thử lại mỗi 5 giây{dots}
        </p>
      </div>

      {/* Port info */}
      <div style={{ marginTop: 20, color: '#475569', fontSize: 11, textAlign: 'center' }}>
        Backend phải chạy trên <code style={{ color: '#64748B' }}>http://localhost:3001</code>
      </div>
    </div>
  )
}
