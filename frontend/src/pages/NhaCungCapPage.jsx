import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const EMPTY = { ten: '', maSo: '', diaChi: '', sdt: '', email: '', nguoiLienHe: '', ghiChu: '' }

export default function NhaCungCapPage() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [search, setSearch]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setList(await api.nhaCungCap.list()) }
    catch (e) { toast(e.message) }
    finally { setLoading(false) }
  }

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }
  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(item) {
    setEditing(item)
    setForm({ ten: item.ten, maSo: item.maSo || '', diaChi: item.diaChi || '',
              sdt: item.sdt || '', email: item.email || '',
              nguoiLienHe: item.nguoiLienHe || '', ghiChu: item.ghiChu || '' })
    setShowForm(true)
  }

  async function save() {
    if (!form.ten.trim()) return toast('Tên nhà cung cấp không được trống', 'info')
    setSaving(true)
    try {
      if (editing) { await api.nhaCungCap.update(editing.id, form); toastSuccess('Đã cập nhật!') }
      else         { await api.nhaCungCap.create(form); toastSuccess('Đã thêm nhà cung cấp!') }
      setShowForm(false); await load()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Xoá nhà cung cấp này?')) return
    try { await api.nhaCungCap.remove(id); toastSuccess('Đã xoá'); await load() }
    catch (e) { toast(e.message) }
  }

  const filtered = list.filter((x) =>
    !search || x.ten.toLowerCase().includes(search.toLowerCase()) ||
    (x.maSo || '').toLowerCase().includes(search.toLowerCase()) ||
    (x.nguoiLienHe || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <div><h2>🏢 Nhà cung cấp vật tư</h2><p>Quản lý danh sách nhà cung cấp nguyên phụ liệu</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm NCC</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card primary"><div className="label">Tổng NCC</div><div className="value">{list.length}</div></div>
          <div className="stat-card success"><div className="label">Đang hoạt động</div><div className="value">{list.filter((x) => x.active).length}</div></div>
        </div>

        <div className="flex-row mb-16">
          <input placeholder="🔍 Tìm theo tên, mã số, người liên hệ..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          <span className="text-sm text-muted">{filtered.length} nhà cung cấp</span>
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> :
           filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">🏢</div><p>Không tìm thấy nhà cung cấp nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Tên NCC</th><th>Mã số</th><th>Người LH</th><th>SĐT</th><th>Email</th><th>Vật tư</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted">{item.id}</td>
                      <td>
                        <b>{item.ten}</b>
                        {!item.active && <span className="badge badge-gray" style={{ marginLeft: 6 }}>Không hoạt động</span>}
                        {item.diaChi && <div className="text-sm text-muted">{item.diaChi}</div>}
                      </td>
                      <td className="text-sm">{item.maSo || '—'}</td>
                      <td>{item.nguoiLienHe || '—'}</td>
                      <td>{item.sdt || '—'}</td>
                      <td className="text-sm">{item.email || '—'}</td>
                      <td><span className="badge badge-blue">{item._count?.vatTus || 0} VT</span></td>
                      <td>
                        <div className="flex-row gap-8">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Sửa</button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa NCC' : '+ Thêm nhà cung cấp'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label className="required">Tên nhà cung cấp</label>
                  <input autoFocus value={form.ten} onChange={(e) => setF('ten', e.target.value)} placeholder="VD: Công ty vải ABC..." />
                </div>
                <div className="form-group">
                  <label>Mã số</label>
                  <input value={form.maSo} onChange={(e) => setF('maSo', e.target.value)} placeholder="Mã MST / mã nội bộ" />
                </div>
                <div className="form-group">
                  <label>Người liên hệ</label>
                  <input value={form.nguoiLienHe} onChange={(e) => setF('nguoiLienHe', e.target.value)} placeholder="Tên người liên hệ" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input value={form.sdt} onChange={(e) => setF('sdt', e.target.value)} placeholder="0901 234 567" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="contact@company.com" />
                </div>
                <div className="form-group span-2">
                  <label>Địa chỉ</label>
                  <input value={form.diaChi} onChange={(e) => setF('diaChi', e.target.value)} placeholder="Địa chỉ công ty..." />
                </div>
                <div className="form-group span-2">
                  <label>Ghi chú</label>
                  <textarea value={form.ghiChu} onChange={(e) => setF('ghiChu', e.target.value)} placeholder="Ghi chú thêm..." style={{ minHeight: 60 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
