import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const DVT_OPTS = ['m', 'kg', 'g', 'cái', 'cuộn', 'tờ', 'hộp', 'thùng', 'lít', 'bộ']
const EMPTY = { ten: '', maVatTu: '', donViTinh: '', nhaCungCapId: '', donGia: '', tonKho: '0', tonToiThieu: '0', ghiChu: '' }

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—'

export default function VatTuPage() {
  const [list, setList]         = useState([])
  const [nccList, setNccList]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [search, setSearch]     = useState('')
  const [filterNcc, setFilterNcc] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)

  useEffect(() => {
    Promise.all([api.vatTu.list(), api.nhaCungCap.list()])
      .then(([v, n]) => { setList(v); setNccList(n) })
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function load() {
    try { setList(await api.vatTu.list()) }
    catch (e) { toast(e.message) }
  }

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(item) {
    setEditing(item)
    setForm({
      ten: item.ten, maVatTu: item.maVatTu || '', donViTinh: item.donViTinh,
      nhaCungCapId: item.nhaCungCapId || '', donGia: item.donGia ?? '',
      tonKho: item.tonKho, tonToiThieu: item.tonToiThieu, ghiChu: item.ghiChu || '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.ten.trim() || !form.donViTinh.trim()) return toast('Tên và đơn vị tính không được trống', 'info')
    setSaving(true)
    try {
      if (editing) { await api.vatTu.update(editing.id, form); toastSuccess('Đã cập nhật vật tư!') }
      else         { await api.vatTu.create(form); toastSuccess('Đã thêm vật tư!') }
      setShowForm(false); await load()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Xoá vật tư này?')) return
    try { await api.vatTu.remove(id); toastSuccess('Đã xoá'); await load() }
    catch (e) { toast(e.message) }
  }

  let filtered = list
  if (search)       filtered = filtered.filter((x) => x.ten.toLowerCase().includes(search.toLowerCase()) || (x.maVatTu || '').toLowerCase().includes(search.toLowerCase()))
  if (filterNcc)    filtered = filtered.filter((x) => x.nhaCungCapId === Number(filterNcc))
  if (showLowOnly)  filtered = filtered.filter((x) => x.tonKho <= x.tonToiThieu)

  const tongGiaTri = list.reduce((s, v) => s + (v.tonKho || 0) * (v.donGia || 0), 0)
  const soLuongThieu = list.filter((v) => v.tonKho <= v.tonToiThieu && v.tonToiThieu > 0).length

  return (
    <>
      <div className="page-header">
        <div><h2>📦 Danh mục Vật tư</h2><p>Quản lý nguyên phụ liệu và tồn kho</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm vật tư</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card primary"><div className="label">Tổng loại VT</div><div className="value">{list.length}</div></div>
          <div className="stat-card success">
            <div className="label">Giá trị tồn kho</div>
            <div className="value" style={{ fontSize: 16 }}>{fmt(Math.round(tongGiaTri))}</div>
            <div className="sub">VNĐ</div>
          </div>
          {soLuongThieu > 0 && (
            <div className="stat-card danger">
              <div className="label">⚠️ Dưới mức tối thiểu</div>
              <div className="value">{soLuongThieu}</div>
              <div className="sub">loại vật tư</div>
            </div>
          )}
        </div>

        <div className="flex-row mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="🔍 Tìm theo tên, mã vật tư..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          <select value={filterNcc} onChange={(e) => setFilterNcc(e.target.value)} style={{ width: 200 }}>
            <option value="">Tất cả nhà cung cấp</option>
            {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
          </select>
          <label className="checkbox-row">
            <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} />
            <span>Chỉ hiện vật tư sắp hết</span>
          </label>
          <span className="text-sm text-muted">{filtered.length} vật tư</span>
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> :
           filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>Không tìm thấy vật tư nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã VT</th><th>Tên vật tư</th><th>ĐVT</th>
                    <th>Nhà CC</th><th className="text-right">Đơn giá</th>
                    <th className="text-right">Tồn kho</th><th className="text-right">Tối thiểu</th>
                    <th>Tình trạng</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const trangThai = item.tonKho <= 0 ? { cls: 'badge-red', label: '❌ Hết' }
                      : item.tonKho <= item.tonToiThieu ? { cls: 'badge-yellow', label: '⚠️ Sắp hết' }
                      : { cls: 'badge-green', label: '✅ Đủ' }
                    return (
                      <tr key={item.id} className={item.tonKho <= 0 ? 'row-danger' : ''}>
                        <td><code style={{ fontSize: 11, color: 'var(--gray-500)' }}>{item.maVatTu || '—'}</code></td>
                        <td><b>{item.ten}</b></td>
                        <td><span className="badge badge-gray">{item.donViTinh}</span></td>
                        <td className="text-sm">{item.nhaCungCap?.ten || '—'}</td>
                        <td className="text-right">{item.donGia ? fmt(item.donGia) : '—'}</td>
                        <td className="text-right font-bold">{fmt(item.tonKho)}</td>
                        <td className="text-right text-muted">{fmt(item.tonToiThieu)}</td>
                        <td><span className={`badge ${trangThai.cls}`}>{trangThai.label}</span></td>
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
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa vật tư' : '+ Thêm vật tư mới'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label className="required">Tên vật tư</label>
                  <input autoFocus value={form.ten} onChange={(e) => setF('ten', e.target.value)} placeholder="VD: Vải cotton trắng 200gsm..." />
                </div>
                <div className="form-group">
                  <label>Mã vật tư</label>
                  <input value={form.maVatTu} onChange={(e) => setF('maVatTu', e.target.value)} placeholder="VD: VT-001" />
                </div>
                <div className="form-group">
                  <label className="required">Đơn vị tính</label>
                  <input list="dvt-list" value={form.donViTinh} onChange={(e) => setF('donViTinh', e.target.value)} placeholder="m, kg, cái..." />
                  <datalist id="dvt-list">{DVT_OPTS.map((o) => <option key={o} value={o} />)}</datalist>
                </div>
                <div className="form-group span-2">
                  <label>Nhà cung cấp</label>
                  <select value={form.nhaCungCapId} onChange={(e) => setF('nhaCungCapId', e.target.value)}>
                    <option value="">— Không chọn —</option>
                    {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Đơn giá (VNĐ)</label>
                  <input type="number" min="0" value={form.donGia} onChange={(e) => setF('donGia', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Tồn kho hiện tại</label>
                  <input type="number" min="0" step="0.1" value={form.tonKho} onChange={(e) => setF('tonKho', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Mức tồn tối thiểu</label>
                  <input type="number" min="0" step="0.1" value={form.tonToiThieu} onChange={(e) => setF('tonToiThieu', e.target.value)} placeholder="Cảnh báo khi dưới mức này" />
                </div>
                <div className="form-group span-2">
                  <label>Ghi chú</label>
                  <textarea value={form.ghiChu} onChange={(e) => setF('ghiChu', e.target.value)} placeholder="Ghi chú..." style={{ minHeight: 60 }} />
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
