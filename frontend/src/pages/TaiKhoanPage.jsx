import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const VAI_TRO = [
  { value: 'ADMIN',      label: 'Quản trị viên',     badge: 'badge-red',   icon: '👑' },
  { value: 'QUAN_LY_SP', label: 'Quản lý sản phẩm', badge: 'badge-blue',  icon: '✏️' },
  { value: 'QUAN_LY_SX', label: 'Quản lý sản xuất', badge: 'badge-green', icon: '🏭' },
]

const EMPTY_CREATE = { tenDangNhap: '', matKhau: '', hoTen: '', email: '', vaiTro: 'QUAN_LY_SP' }
const EMPTY_EDIT   = { hoTen: '', email: '', vaiTro: 'QUAN_LY_SP', matKhauMoi: '', active: true }

export default function TaiKhoanPage() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(EMPTY_CREATE)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setList(await api.taiKhoan.list()) }
    catch (e) { toast(e.message) }
    finally { setLoading(false) }
  }

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function openCreate() { setEditing(null); setForm(EMPTY_CREATE); setShowPass(false); setShowForm(true) }
  function openEdit(item) {
    setEditing(item)
    setForm({ hoTen: item.hoTen, email: item.email || '', vaiTro: item.vaiTro, matKhauMoi: '', active: item.active })
    setShowPass(false); setShowForm(true)
  }

  async function save() {
    if (!editing && (!form.tenDangNhap?.trim() || !form.matKhau || !form.hoTen?.trim()))
      return toast('Vui lòng điền tên đăng nhập, mật khẩu và họ tên', 'info')
    if (editing && !form.hoTen?.trim())
      return toast('Họ tên không được trống', 'info')
    setSaving(true)
    try {
      if (editing) {
        await api.taiKhoan.update(editing.id, {
          hoTen: form.hoTen, email: form.email, vaiTro: form.vaiTro,
          active: form.active,
          ...(form.matKhauMoi ? { matKhauMoi: form.matKhauMoi } : {}),
        })
        toastSuccess('Đã cập nhật tài khoản!')
      } else {
        await api.taiKhoan.create(form)
        toastSuccess('Đã tạo tài khoản!')
      }
      setShowForm(false); await load()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Xoá tài khoản này? Không thể hoàn tác.')) return
    try { await api.taiKhoan.remove(id); toastSuccess('Đã xoá tài khoản'); await load() }
    catch (e) { toast(e.message) }
  }

  async function toggleActive(item) {
    try { await api.taiKhoan.update(item.id, { active: !item.active }); await load() }
    catch (e) { toast(e.message) }
  }

  const counts = VAI_TRO.reduce((acc, r) => {
    acc[r.value] = list.filter((u) => u.vaiTro === r.value).length; return acc
  }, {})

  return (
    <>
      <div className="page-header">
        <div><h2>👤 Danh mục Tài khoản</h2><p>Quản lý tài khoản và phân quyền người dùng</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Tạo tài khoản</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card"><div className="label">Tổng tài khoản</div><div className="value">{list.length}</div></div>
          {VAI_TRO.map((r) => (
            <div key={r.value} className="stat-card">
              <div className="label">{r.icon} {r.label}</div>
              <div className="value">{counts[r.value] || 0}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> :
           list.length === 0 ? (
            <div className="empty-state"><div className="icon">👤</div><p>Chưa có tài khoản nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Họ tên</th><th>Tên đăng nhập</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {list.map((item) => {
                    const role = VAI_TRO.find((r) => r.value === item.vaiTro)
                    return (
                      <tr key={item.id} style={{ opacity: item.active ? 1 : 0.55 }}>
                        <td className="text-muted">{item.id}</td>
                        <td><b>{item.hoTen}</b></td>
                        <td><code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{item.tenDangNhap}</code></td>
                        <td className="text-sm">{item.email || '—'}</td>
                        <td><span className={`badge ${role?.badge || 'badge-gray'}`}>{role?.icon} {role?.label || item.vaiTro}</span></td>
                        <td><span className={`badge ${item.active ? 'badge-green' : 'badge-gray'}`}>{item.active ? 'Hoạt động' : 'Đã khóa'}</span></td>
                        <td className="text-sm text-muted">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div className="flex-row gap-8">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(item)}>
                              {item.active ? '🔒 Khóa' : '🔓 Mở'}
                            </button>
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

        <div className="alert alert-warning mt-8" style={{ marginTop: 16 }}>
          <span>ℹ️</span>
          <span>Phân quyền hiện tại là quản lý danh mục. Chức năng đăng nhập/bảo vệ route sẽ được kích hoạt trong phiên bản tiếp theo.</span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? `✏️ Sửa — ${editing.hoTen}` : '+ Tạo tài khoản mới'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {!editing && (
                  <div className="form-group">
                    <label className="required">Tên đăng nhập</label>
                    <input autoFocus value={form.tenDangNhap} onChange={(e) => setF('tenDangNhap', e.target.value)} placeholder="VD: admin, nguyen.van.a" />
                  </div>
                )}
                <div className="form-group">
                  <label className="required">Họ và tên</label>
                  <input autoFocus={!!editing} value={form.hoTen} onChange={(e) => setF('hoTen', e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="email@company.com" />
                </div>
                <div className="form-group">
                  <label className="required">Vai trò</label>
                  <select value={form.vaiTro} onChange={(e) => setF('vaiTro', e.target.value)}>
                    {VAI_TRO.map((r) => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                  </select>
                </div>
                {editing && (
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select value={form.active ? 'true' : 'false'} onChange={(e) => setF('active', e.target.value === 'true')}>
                      <option value="true">✅ Hoạt động</option>
                      <option value="false">🔒 Khóa</option>
                    </select>
                  </div>
                )}
                <div className="form-group span-2">
                  <label className={!editing ? 'required' : undefined}>
                    {editing ? 'Đặt mật khẩu mới (để trống = không đổi)' : 'Mật khẩu'}
                  </label>
                  <div className="flex-row gap-8">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={editing ? form.matKhauMoi : form.matKhau}
                      onChange={(e) => setF(editing ? 'matKhauMoi' : 'matKhau', e.target.value)}
                      placeholder={editing ? 'Nhập mật khẩu mới...' : 'Tối thiểu 6 ký tự'}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPass((p) => !p)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
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
