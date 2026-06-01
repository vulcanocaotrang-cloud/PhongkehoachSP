import { useState, useEffect } from 'react'

// Singleton reference — lets any module call toast() without props/context
let _push = null

export function toast(message, type = 'error') {
  if (_push) {
    _push(message, type)
  } else {
    // Fallback before component mounts
    if (type === 'error') console.error(message)
    else console.log(message)
  }
}
export const toastSuccess = (msg) => toast(msg, 'success')
export const toastInfo    = (msg) => toast(msg, 'info')

export function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    _push = (message, type) => {
      const id = Date.now() + Math.random()
      setItems((p) => [...p, { id, message, type }])
      setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 4500)
    }
    return () => { _push = null }
  }, [])

  if (!items.length) return null

  const BG = { error: '#FEE2E2', success: '#DCFCE7', info: '#DBEAFE' }
  const BD = { error: '#FECACA', success: '#BBF7D0', info: '#BFDBFE' }
  const TX = { error: '#991B1B', success: '#166534', info: '#1E40AF' }
  const IC = { error: '❌', success: '✅', info: 'ℹ️' }

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '11px 16px', borderRadius: 8,
            background: BG[t.type], border: `1px solid ${BD[t.type]}`,
            color: TX[t.type], boxShadow: '0 4px 14px rgba(0,0,0,.15)',
            maxWidth: 380, fontSize: 13, fontWeight: 500,
            animation: 'toastIn .2s ease',
            display: 'flex', gap: 8, alignItems: 'flex-start',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ flexShrink: 0 }}>{IC[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
