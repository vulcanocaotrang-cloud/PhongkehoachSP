import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const KHACH_HANG_OPTS = ['18-25 tuổi, sinh viên', '25-35 tuổi, công sở', '35-45 tuổi, cao cấp', '16-22 tuổi, teen', 'Mọi lứa tuổi']
const NHU_CAU_OPTS    = ['Đi làm', 'Dạo phố', 'Thể thao', 'Đi chơi', 'Dự tiệc', 'Đa dụng']
const NHOM_HANG_OPTS  = ['Áo sơ mi', 'Quần tây', 'Polo', 'T-Shirt', 'Áo khoác', 'Quần jean', 'Đầm', 'Chân váy', 'Áo len', 'Blazer']

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n)

export default function TargetBSTPage() {
  const [list, setList] = useState([])
  const [bstList, setBstList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterBst, setFilterBst] = useState('')
  const [saving, setSaving] = useState(false)
  const EMPTY = { bstId: '', khachHangMucTieu: '', nhuCauSuDung: '', nhomHang: '', soLuongTarget: '', donGiaDuKien: '' }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    Promise.all([api.bst.list(), api.target.list()])
      .then(([b, t]) => { setBstList(b); setList(t) })
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function load() {
    try {
      const params = filterBst ? { bstId: filterBst } : undefined
      setList(await api.target.list(params))
    } catch (e) { toast(e.message) }
  }

  useEffect(() => { if (!loading) load() }, [filterBst])

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(item) {
    setEditing(item)
    setForm({
      bstId: item.bstId, khachHangMucTieu: item.khachHangMucTieu,
      nhuCauSuDung: item.nhuCauSuDung, nhomHang: item.nhomHang,
      soLuongTarget: item.soLuongTarget, donGiaDuKien: item.donGiaDuKien,
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.bstId || !form.nhomHang) return toast('Vui lòng điền đầy đủ thông tin', 'info')
    setSaving(true)
    try {
      if (editing) { await api.target.update(editing.id, form); toastSuccess('Đã cập nhật Target!') }
      else         { await api.target.create(form); toastSuccess('Đã thêm Target mới!') }
      setShowForm(false)
      await load()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Xoá target này?')) return
    try {
      await api.target.remove(id)
      toastSuccess('Đã xoá')
      await load()
    } catch (e) { toast(e.message) }
  }

  const totals = list.reduce((acc, t) => ({
    sl: acc.sl + t.soLuongTarget,
    dt: acc.dt + t.doanhThuTarget,
  }), { sl: 0, dt: 0 })

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🎯 Danh mục Target BST</h2>
          <p>Kế hoạch target theo nhóm hàng cho từng bộ sưu tập</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm Target</button>
      </div>

      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid mb-16">
          <div className="stat-card"><div className="label">Tổng nhóm hàng</div><div className="value">{list.length}</div></div>
          <div className="stat-card primary"><div className="label">Tổng SL target</div><div className="value">{fmt(totals.sl)}</div><div className="sub">sản phẩm</div></div>
          <div className="stat-card success"><div className="label">Doanh thu target</div><div className="value" style={{ fontSize: 18 }}>{fmt(totals.dt)}</div><div className="sub">VNĐ</div></div>
        </div>

        {/* Filter */}
        <div className="flex-row mb-16">
          <label style={{ fontWeight: 600, fontSize: 13 }}>Lọc theo BST:</label>
          <select value={filterBst} onChange={(e) => setFilterBst(e.target.value)} style={{ width: 220 }}>
            <option value="">Tất cả BST</option>
            {bstList.map((b) => <option key={b.id} value={b.id}>{b.ten} · {b.mua} {b.nam}</option>)}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div className="empty-state"><div className="icon">🎯</div><p>Chưa có target nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>BST</th>
                    <th>Khách hàng MĐ</th>
                    <th>Nhu cầu SD</th>
                    <th>Nhóm hàng</th>
                    <th className="text-right">SL Target</th>
                    <th className="text-right">Đơn giá DK</th>
                    <th className="text-right">DT Target</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b style={{ fontSize: 12 }}>{item.bst?.ten}</b>
                        <br />
                        <span className="text-sm text-muted">{item.bst?.mua} {item.bst?.nam}</span>
                      </td>
                      <td>{item.khachHangMucTieu}</td>
                      <td>{item.nhuCauSuDung}</td>
                      <td><span className="badge badge-blue">{item.nhomHang}</span></td>
                      <td className="text-right font-bold">{fmt(item.soLuongTarget)}</td>
                      <td className="text-right">{fmt(item.donGiaDuKien)}</td>
                      <td className="text-right">
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(item.doanhThuTarget)}</span>
                      </td>
                      <td>
                        <div className="flex-row gap-8">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--gray-50)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '10px 12px', color: 'var(--gray-600)' }}>Tổng cộng</td>
                    <td className="text-right" style={{ padding: '10px 12px' }}>{fmt(totals.sl)}</td>
                    <td />
                    <td className="text-right" style={{ padding: '10px 12px', color: 'var(--success)' }}>{fmt(totals.dt)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa Target BST' : '+ Thêm Target BST'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label className="required">Bộ sưu tập (BST)</label>
                  <select value={form.bstId} onChange={(e) => setForm((p) => ({ ...p, bstId: e.target.value }))}>
                    <option value="">— Chọn BST —</option>
                    {bstList.map((b) => <option key={b.id} value={b.id}>{b.ten} · {b.mua} {b.nam}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Khách hàng mục tiêu</label>
                  <input list="kh-list" value={form.khachHangMucTieu} onChange={(e) => setForm((p) => ({ ...p, khachHangMucTieu: e.target.value }))} placeholder="VD: 25-35 tuổi, công sở" />
                  <datalist id="kh-list">{KHACH_HANG_OPTS.map((o) => <option key={o} value={o} />)}</datalist>
                </div>
                <div className="form-group">
                  <label>Nhu cầu sử dụng</label>
                  <input list="nc-list" value={form.nhuCauSuDung} onChange={(e) => setForm((p) => ({ ...p, nhuCauSuDung: e.target.value }))} placeholder="VD: Đi làm, dạo phố..." />
                  <datalist id="nc-list">{NHU_CAU_OPTS.map((o) => <option key={o} value={o} />)}</datalist>
                </div>
                <div className="form-group">
                  <label className="required">Nhóm hàng</label>
                  <input list="nh-list" value={form.nhomHang} onChange={(e) => setForm((p) => ({ ...p, nhomHang: e.target.value }))} placeholder="VD: Áo sơ mi, Quần tây..." />
                  <datalist id="nh-list">{NHOM_HANG_OPTS.map((o) => <option key={o} value={o} />)}</datalist>
                </div>
                <div className="form-group">
                  <label className="required">Số lượng target</label>
                  <input type="number" min="0" value={form.soLuongTarget} onChange={(e) => setForm((p) => ({ ...p, soLuongTarget: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="required">Đơn giá dự kiến (VNĐ)</label>
                  <input type="number" min="0" value={form.donGiaDuKien} onChange={(e) => setForm((p) => ({ ...p, donGiaDuKien: e.target.value }))} placeholder="0" />
                </div>
                {form.soLuongTarget && form.donGiaDuKien && (
                  <div className="form-group span-2">
                    <div className="alert alert-success">
                      <span>📊</span>
                      <span>Doanh thu target dự kiến: <b>{fmt(form.soLuongTarget * form.donGiaDuKien)} VNĐ</b></span>
                    </div>
                  </div>
                )}
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
