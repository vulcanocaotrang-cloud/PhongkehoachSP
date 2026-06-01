import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

export default function NhomHangPage() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ ten: '', moTa: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setList(await api.nhomHang.all()) }
    catch (e) { toast(e.message) }
    finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm({ ten: '', moTa: '' }); setShowForm(true) }
  function openEdit(item) { setEditing(item); setForm({ ten: item.ten, moTa: item.moTa || '' }); setShowForm(true) }

  async function save() {
    if (!form.ten.trim()) return toast('Tên nhóm hàng không được trống', 'info')
    setSaving(true)
    try {
      if (editing) { await api.nhomHang.update(editing.id, form); toastSuccess('Đã cập nhật!') }
      else         { await api.nhomHang.create(form); toastSuccess('Đã thêm nhóm hàng!') }
      setShowForm(false)
      await load()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(item) {
    try {
      await api.nhomHang.update(item.id, { active: !item.active })
      await load()
    } catch (e) { toast(e.message) }
  }

  async function remove(id) {
    if (!confirm('Xoá nhóm hàng này?')) return
    try { await api.nhomHang.remove(id); toastSuccess('Đã xoá'); await load() }
    catch (e) { toast(e.message) }
  }

  const active   = list.filter((x) => x.active)
  const inactive = list.filter((x) => !x.active)

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🏷️ Danh mục Nhóm hàng</h2>
          <p>Quản lý danh mục phân loại sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm nhóm hàng</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card primary"><div className="label">Đang sử dụng</div><div className="value">{active.length}</div></div>
          <div className="stat-card"><div className="label">Đã ẩn</div><div className="value">{inactive.length}</div></div>
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> :
           list.length === 0 ? (
            <div className="empty-state"><div className="icon">🏷️</div><p>Chưa có nhóm hàng nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Tên nhóm hàng</th><th>Mô tả</th><th>SP đang dùng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id} style={{ opacity: item.active ? 1 : 0.5 }}>
                      <td className="text-muted">{item.id}</td>
                      <td><b>{item.ten}</b></td>
                      <td className="text-muted text-sm">{item.moTa || '—'}</td>
                      <td><span className="badge badge-gray">{item._count?.sanPhams ?? '—'} SP</span></td>
                      <td>
                        <span className={`badge ${item.active ? 'badge-green' : 'badge-gray'}`}>
                          {item.active ? 'Đang dùng' : 'Ẩn'}
                        </span>
                      </td>
                      <td>
                        <div className="flex-row gap-8">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Sửa</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(item)}>
                            {item.active ? '🔕 Ẩn' : '✅ Bật'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa nhóm hàng' : '+ Thêm nhóm hàng'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid cols-1" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="required">Tên nhóm hàng</label>
                  <input autoFocus value={form.ten} onChange={(e) => setForm((p) => ({ ...p, ten: e.target.value }))}
                    placeholder="VD: Áo sơ mi, Quần tây, Polo..." />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea value={form.moTa} onChange={(e) => setForm((p) => ({ ...p, moTa: e.target.value }))}
                    placeholder="Mô tả ngắn về nhóm hàng..." style={{ minHeight: 70 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
