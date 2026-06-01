import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const MUA_OPTIONS = ['Xuân/Hè', 'Thu/Đông', 'Cả năm']
const CURRENT_YEAR = new Date().getFullYear()

function ColorModal({ bstId, onClose }) {
  const [colors, setColors] = useState([])
  const [form, setForm] = useState({ tenMau: '', maHex: '#000000' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.bst.mauSac.list(bstId).then(setColors).catch((e) => toast(e.message))
  }, [bstId])

  async function addColor() {
    if (!form.tenMau) return toast('Vui lòng nhập tên màu', 'info')
    setSaving(true)
    try {
      const c = await api.bst.mauSac.create(bstId, form)
      setColors((p) => [...p, c])
      setForm({ tenMau: '', maHex: '#000000' })
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeColor(id) {
    try {
      await api.bst.mauSac.remove(bstId, id)
      setColors((p) => p.filter((c) => c.id !== id))
    } catch (e) {
      toast(e.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎨 Bảng màu BST</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="flex-row mb-12">
            <input
              placeholder="Tên màu (VD: Trắng tinh, Navy...)"
              value={form.tenMau}
              onChange={(e) => setForm((p) => ({ ...p, tenMau: e.target.value }))}
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={form.maHex}
              onChange={(e) => setForm((p) => ({ ...p, maHex: e.target.value }))}
              style={{ width: 48, padding: 2, height: 38 }}
            />
            <button className="btn btn-primary btn-sm" onClick={addColor} disabled={saving}>
              {saving ? '...' : 'Thêm'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {colors.map((c) => (
              <div key={c.id} className="color-swatch">
                <span className="color-dot" style={{ background: c.maHex }} />
                {c.tenMau}
                <span style={{ color: '#9CA3AF', fontSize: 10 }}>{c.maHex}</span>
                <button
                  className="btn-icon"
                  style={{ padding: '1px 4px', fontSize: 11 }}
                  onClick={() => removeColor(c.id)}
                >✕</button>
              </div>
            ))}
            {colors.length === 0 && <span className="text-muted text-sm">Chưa có màu nào</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BSTPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [colorBstId, setColorBstId] = useState(null)
  const [form, setForm] = useState({ ten: '', nam: CURRENT_YEAR, mua: 'Xuân/Hè' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      setList(await api.bst.list())
    } catch (e) {
      toast(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ ten: '', nam: CURRENT_YEAR, mua: 'Xuân/Hè' })
    setShowForm(true)
  }
  function openEdit(item) {
    setEditing(item)
    setForm({ ten: item.ten, nam: item.nam, mua: item.mua })
    setShowForm(true)
  }

  async function save() {
    if (!form.ten.trim()) return toast('Vui lòng nhập tên BST', 'info')
    setSaving(true)
    try {
      if (editing) {
        await api.bst.update(editing.id, form)
        toastSuccess('Đã cập nhật BST!')
      } else {
        await api.bst.create(form)
        toastSuccess('Đã thêm BST mới!')
      }
      setShowForm(false)
      await load()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Xoá BST này? Tất cả dữ liệu liên quan sẽ bị xoá.')) return
    try {
      await api.bst.remove(id)
      toastSuccess('Đã xoá BST')
      await load()
    } catch (e) {
      toast(e.message)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🗂️ Bộ sưu tập (BST)</h2>
          <p>Quản lý danh sách bộ sưu tập thời trang</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm BST</button>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🗂️</div>
              <p>Chưa có BST nào. Hãy tạo BST đầu tiên!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên BST</th>
                    <th>Năm</th>
                    <th>Mùa</th>
                    <th>Target</th>
                    <th>Sản phẩm</th>
                    <th>Màu sắc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted">{item.id}</td>
                      <td><b>{item.ten}</b></td>
                      <td>{item.nam}</td>
                      <td><span className="badge badge-blue">{item.mua}</span></td>
                      <td><span className="badge badge-gray">{item._count?.targets || 0} nhóm</span></td>
                      <td><span className="badge badge-gray">{item._count?.sanPhams || 0} SP</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {(item.mauSacs || []).slice(0, 4).map((c) => (
                            <span key={c.id} className="color-dot" style={{ background: c.maHex }} title={c.tenMau} />
                          ))}
                          {(item.mauSacs || []).length > 4 && (
                            <span className="text-sm text-muted">+{item.mauSacs.length - 4}</span>
                          )}
                          <button
                            className="btn-icon"
                            style={{ fontSize: 13, padding: '2px 6px' }}
                            onClick={() => setColorBstId(item.id)}
                            title="Quản lý màu sắc"
                          >🎨</button>
                        </div>
                      </td>
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

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa BST' : '+ Thêm BST mới'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid cols-1" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="required">Tên BST</label>
                  <input
                    placeholder="VD: BST Hè 2025, FW26..."
                    value={form.ten}
                    onChange={(e) => setForm((p) => ({ ...p, ten: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="required">Năm</label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      value={form.nam}
                      onChange={(e) => setForm((p) => ({ ...p, nam: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="required">Mùa</label>
                    <select value={form.mua} onChange={(e) => setForm((p) => ({ ...p, mua: e.target.value }))}>
                      {MUA_OPTIONS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Modal */}
      {colorBstId && <ColorModal bstId={colorBstId} onClose={() => setColorBstId(null)} />}
    </>
  )
}
