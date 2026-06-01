import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

export default function NhaMayPage() {
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const EMPTY = { ten: '', diaChi: '', congSuat: '', ghiChu: '' }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      setList(await api.nhaMay.list())
    } catch (e) {
      toast(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(item) {
    setEditing(item)
    setForm({ ten: item.ten, diaChi: item.diaChi || '', congSuat: item.congSuat, ghiChu: item.ghiChu || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.ten || !form.congSuat) return toast('Vui lòng điền tên và công suất', 'info')
    setSaving(true)
    try {
      if (editing) { await api.nhaMay.update(editing.id, form); toastSuccess('Đã cập nhật nhà máy!') }
      else         { await api.nhaMay.create(form); toastSuccess('Đã thêm nhà máy mới!') }
      setShowForm(false)
      await load()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Xoá nhà máy này? Kế hoạch SX liên quan sẽ mất thông tin nhà máy.')) return
    try {
      await api.nhaMay.remove(id)
      toastSuccess('Đã xoá nhà máy')
      await load()
    } catch (e) { toast(e.message) }
  }

  const totalCapacity   = list.reduce((s, n) => s + n.congSuat, 0)
  const totalActive     = list.reduce((s, n) => s + (n.keHoachs?.length || 0), 0)

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🔧 Nhà máy gia công</h2>
          <p>Quản lý danh sách nhà máy và công suất sản xuất</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm nhà máy</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card"><div className="label">Tổng nhà máy</div><div className="value">{list.length}</div></div>
          <div className="stat-card primary"><div className="label">Tổng công suất</div><div className="value">{totalCapacity.toLocaleString()}</div><div className="sub">SP/tháng</div></div>
          <div className="stat-card warning"><div className="label">Đang sản xuất</div><div className="value">{totalActive}</div><div className="sub">đơn hàng</div></div>
        </div>

        <div className="card mb-20">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div className="empty-state"><div className="icon">🔧</div><p>Chưa có nhà máy nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên nhà máy</th>
                    <th>Địa chỉ</th>
                    <th className="text-right">Công suất (SP/tháng)</th>
                    <th>Đang sản xuất</th>
                    <th>Tải hiện tại</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => {
                    const activeOrders = item.keHoachs?.length || 0
                    const utilRate = Math.min(100, Math.round((activeOrders * 100) / Math.max(item.congSuat / 100, 1)))
                    return (
                      <tr key={item.id}>
                        <td className="text-muted">{item.id}</td>
                        <td><b>{item.ten}</b></td>
                        <td className="text-muted text-sm">{item.diaChi || '—'}</td>
                        <td className="text-right font-bold">{item.congSuat.toLocaleString()}</td>
                        <td>
                          {activeOrders === 0 ? (
                            <span className="badge badge-gray">Trống</span>
                          ) : (
                            <span className="badge badge-blue">{activeOrders} đơn</span>
                          )}
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div className="flex-row gap-8">
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className={`progress-fill ${utilRate > 80 ? 'danger' : utilRate > 50 ? 'warning' : 'success'}`} style={{ width: `${utilRate}%` }} />
                            </div>
                            <span className="text-sm">{utilRate}%</span>
                          </div>
                        </td>
                        <td className="text-sm text-muted">{item.ghiChu || '—'}</td>
                        <td>
                          <div className="flex-row gap-8">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active orders per factory */}
        {list.some((n) => (n.keHoachs?.length || 0) > 0) && (
          <div className="card">
            <div className="card-header"><h3>📋 Đơn hàng đang sản xuất theo nhà máy</h3></div>
            <div className="card-body">
              {list.filter((n) => (n.keHoachs?.length || 0) > 0).map((n) => (
                <div key={n.id} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--gray-800)' }}>
                    🔧 {n.ten}
                    <span className="badge badge-blue" style={{ marginLeft: 8 }}>{n.keHoachs.length} đơn</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {n.keHoachs.map((kh) => (
                      <div key={kh.id} style={{
                        padding: '10px 14px', background: 'var(--gray-50)',
                        borderRadius: 8, border: '1px solid var(--gray-200)',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{kh.sanPham?.tenSanPham}</span>
                          <span className="text-muted text-sm" style={{ marginLeft: 8 }}>{kh.sanPham?.nhomHang}</span>
                        </div>
                        <span className="badge badge-blue">{kh.sanPham?.bst?.ten}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa nhà máy' : '+ Thêm nhà máy GC'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid cols-1" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="required">Tên nhà máy</label>
                  <input value={form.ten} onChange={(e) => setForm((p) => ({ ...p, ten: e.target.value }))} placeholder="VD: Nhà máy Bình Dương A..." />
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input value={form.diaChi} onChange={(e) => setForm((p) => ({ ...p, diaChi: e.target.value }))} placeholder="VD: KCN Sóng Thần, Bình Dương" />
                </div>
                <div className="form-group">
                  <label className="required">Công suất (SP/tháng)</label>
                  <input type="number" min="0" value={form.congSuat} onChange={(e) => setForm((p) => ({ ...p, congSuat: e.target.value }))} placeholder="VD: 5000" />
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea value={form.ghiChu} onChange={(e) => setForm((p) => ({ ...p, ghiChu: e.target.value }))} placeholder="Ghi chú thêm về nhà máy..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
