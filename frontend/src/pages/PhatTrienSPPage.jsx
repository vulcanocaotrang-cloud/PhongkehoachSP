import { useEffect, useState } from 'react'
import { api } from '../api'
import GanttChart from '../components/GanttChart'
import { toast, toastSuccess } from '../components/Toast'

const FORM_DANG_OPTS  = ['Slim Fit', 'Regular Fit', 'Oversize', 'Loose Fit', 'Skinny', 'Straight Fit']
const SIZES           = ['S', 'M', 'L', 'XL', 'XXL', '3XL']
const DEFAULT_PHASES  = [
  { soThuTu: 1, tenGiaiDoan: 'Dựng ý tưởng', ngayBatDau: '', ngayKetThuc: '', hoanThanh: false, ghiChu: '' },
  { soThuTu: 2, tenGiaiDoan: 'Lên mẫu',       ngayBatDau: '', ngayKetThuc: '', hoanThanh: false, ghiChu: '' },
  { soThuTu: 3, tenGiaiDoan: 'Fit mẫu',        ngayBatDau: '', ngayKetThuc: '', hoanThanh: false, ghiChu: '' },
  { soThuTu: 4, tenGiaiDoan: 'Chốt mẫu',       ngayBatDau: '', ngayKetThuc: '', hoanThanh: false, ghiChu: '' },
  { soThuTu: 5, tenGiaiDoan: 'Order NPL',       ngayBatDau: '', ngayKetThuc: '', hoanThanh: false, ghiChu: '' },
]
const PHASE_COLORS = ['#8B5CF6','#2563EB','#0891B2','#16A34A','#D97706']

const TRANG_THAI = {
  DANG_PHAT_TRIEN: { label: 'Đang phát triển', cls: 'badge-blue'  },
  DA_CHOT:         { label: 'Đã chốt',          cls: 'badge-green' },
  HUY:             { label: 'Huỷ',              cls: 'badge-red'   },
}

function ProductForm({ bstList, nhomHangList, onSave, onClose, initialData }) {
  const [targetList, setTargetList] = useState([])
  const [form, setForm] = useState(initialData || {
    bstId: '', targetId: '', nhomHangId: '', tenSanPham: '', nhomHang: '', formDang: 'Regular Fit',
    trangThai: 'DANG_PHAT_TRIEN', ghiChu: '',
  })
  const [phases, setPhases] = useState(initialData?.phases || DEFAULT_PHASES.map((p) => ({ ...p })))
  const [sizes, setSizes]   = useState(
    initialData?.sizes || SIZES.map((s) => ({ size: s, soLuong: 0 }))
  )
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    if (form.bstId) {
      api.target.list({ bstId: form.bstId }).then(setTargetList)
    }
  }, [form.bstId])

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }
  function setPhase(i, k, v) { setPhases((ps) => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p)) }
  function setSize(i, v) { setSizes((ss) => ss.map((s, idx) => idx === i ? { ...s, soLuong: Number(v) } : s)) }

  async function handleSave() {
    if (!form.bstId || !form.tenSanPham || !form.nhomHang || !form.formDang)
      return toast('Vui lòng điền đầy đủ thông tin bắt buộc', 'info')
    setSaving(true)
    try {
      await onSave({ ...form, phases, sizes })
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  const totalSizes = sizes.reduce((s, sz) => s + sz.soLuong, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? '✏️ Sửa sản phẩm' : '+ Thêm sản phẩm phát triển'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 20px', background: 'var(--gray-50)' }}>
          {[['info','📋 Thông tin'],['timeline','📅 Timeline'],['sizes','📐 Size & SL']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
              fontSize: 13,
            }}>{label}</button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'info' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="required">BST</label>
                <select value={form.bstId} onChange={(e) => setF('bstId', e.target.value)}>
                  <option value="">— Chọn BST —</option>
                  {bstList.map((b) => <option key={b.id} value={b.id}>{b.ten} · {b.mua} {b.nam}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Target liên kết</label>
                <select value={form.targetId} onChange={(e) => {
                  const t = targetList.find((x) => x.id === Number(e.target.value))
                  setForm((p) => ({ ...p, targetId: e.target.value, nhomHang: t?.nhomHang || p.nhomHang }))
                }}>
                  <option value="">— Không liên kết —</option>
                  {targetList.map((t) => <option key={t.id} value={t.id}>{t.nhomHang} · {t.khachHangMucTieu}</option>)}
                </select>
              </div>
              <div className="form-group span-2">
                <label className="required">Tên sản phẩm</label>
                <input placeholder="VD: Áo sơ mi trắng tinh tế FW26..." value={form.tenSanPham} onChange={(e) => setF('tenSanPham', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="required">Nhóm hàng</label>
                <select
                  value={form.nhomHangId || ''}
                  onChange={(e) => {
                    const nh = nhomHangList.find((x) => x.id === Number(e.target.value))
                    setForm((p) => ({ ...p, nhomHangId: e.target.value, nhomHang: nh?.ten || p.nhomHang }))
                  }}
                >
                  <option value="">— Chọn nhóm hàng —</option>
                  {nhomHangList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                </select>
                <input
                  placeholder="Hoặc nhập thủ công..."
                  value={form.nhomHang}
                  onChange={(e) => setForm((p) => ({ ...p, nhomHang: e.target.value, nhomHangId: '' }))}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div className="form-group">
                <label className="required">Form dáng</label>
                <select value={form.formDang} onChange={(e) => setF('formDang', e.target.value)}>
                  {FORM_DANG_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              {initialData && (
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select value={form.trangThai} onChange={(e) => setF('trangThai', e.target.value)}>
                    {Object.entries(TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group span-2">
                <label>Ghi chú</label>
                <textarea value={form.ghiChu} onChange={(e) => setF('ghiChu', e.target.value)} placeholder="Ghi chú thêm..." />
              </div>
            </div>
          )}

          {tab === 'timeline' && (
            <div>
              <p className="text-sm text-muted mb-12">Nhập ngày bắt đầu và kết thúc cho từng giai đoạn. Đánh dấu ✓ khi hoàn thành.</p>
              <table className="phase-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Giai đoạn</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th style={{ width: 60 }}>Hoàn thành</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <span className="phase-num" style={{ background: PHASE_COLORS[i] }}>{p.soThuTu}</span>
                      </td>
                      <td><b style={{ fontSize: 13 }}>{p.tenGiaiDoan}</b></td>
                      <td><input type="date" value={p.ngayBatDau || ''} onChange={(e) => setPhase(i, 'ngayBatDau', e.target.value)} /></td>
                      <td><input type="date" value={p.ngayKetThuc || ''} onChange={(e) => setPhase(i, 'ngayKetThuc', e.target.value)} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={p.hoanThanh} onChange={(e) => setPhase(i, 'hoanThanh', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
                      </td>
                      <td><input placeholder="Ghi chú..." value={p.ghiChu || ''} onChange={(e) => setPhase(i, 'ghiChu', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'sizes' && (
            <div>
              <p className="text-sm text-muted mb-12">Nhập số lượng sản phẩm cho từng size. Tổng: <b>{totalSizes.toLocaleString()} SP</b></p>
              <div className="sizes-grid">
                {sizes.map((s, i) => (
                  <div key={s.size} className="size-box">
                    <div className="size-label">{s.size}</div>
                    <input type="number" min="0" value={s.soLuong} onChange={(e) => setSize(i, e.target.value)} />
                  </div>
                ))}
              </div>
              {totalSizes > 0 && (
                <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {sizes.filter((s) => s.soLuong > 0).map((s) => (
                    <span key={s.size} className="badge badge-blue">
                      {s.size}: {s.soLuong.toLocaleString()}
                      <span className="text-muted"> ({Math.round(s.soLuong / totalSizes * 100)}%)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : '💾 Lưu sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PhatTrienSPPage() {
  const [list, setList]           = useState([])
  const [bstList, setBstList]     = useState([])
  const [nhomHangList, setNhomHangList] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [viewGantt, setViewGantt] = useState(null)
  const [filter, setFilter]       = useState({ bstId: '', trangThai: '' })

  useEffect(() => {
    Promise.all([api.bst.list(), api.phatTrien.list(), api.nhomHang.list()])
      .then(([b, s, nh]) => { setBstList(b); setList(s); setNhomHangList(nh) })
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function load() {
    try {
      const params = {}
      if (filter.bstId)     params.bstId     = filter.bstId
      if (filter.trangThai) params.trangThai = filter.trangThai
      setList(await api.phatTrien.list(Object.keys(params).length ? params : undefined))
    } catch (e) { toast(e.message) }
  }

  useEffect(() => { if (!loading) load() }, [filter])

  async function handleSave(data) {
    try {
      if (editing) {
        await api.phatTrien.update(editing.id, data)
        toastSuccess('Đã cập nhật sản phẩm!')
      } else {
        await api.phatTrien.create(data)
        toastSuccess('Đã thêm sản phẩm mới!')
      }
      setShowForm(false); setEditing(null)
      await load()
    } catch (e) {
      toast(e.message)
    }
  }

  async function changeStatus(id, trangThai) {
    try {
      await api.phatTrien.setStatus(id, trangThai)
      await load()
    } catch (e) { toast(e.message) }
  }

  async function remove(id) {
    if (!confirm('Xoá sản phẩm này?')) return
    try {
      await api.phatTrien.remove(id)
      toastSuccess('Đã xoá sản phẩm')
      await load()
    } catch (e) { toast(e.message) }
  }

  const filtered = list

  return (
    <>
      <div className="page-header">
        <div>
          <h2>✏️ Phát triển sản phẩm</h2>
          <p>Quản lý timeline 5 giai đoạn từ ý tưởng đến Order NPL</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Thêm SP</button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="flex-row mb-16">
          <select value={filter.bstId} onChange={(e) => setFilter((p) => ({ ...p, bstId: e.target.value }))} style={{ width: 200 }}>
            <option value="">Tất cả BST</option>
            {bstList.map((b) => <option key={b.id} value={b.id}>{b.ten} · {b.mua} {b.nam}</option>)}
          </select>
          <select value={filter.trangThai} onChange={(e) => setFilter((p) => ({ ...p, trangThai: e.target.value }))} style={{ width: 200 }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-sm text-muted">{filtered.length} sản phẩm</span>
        </div>

        {/* Main table */}
        <div className="card mb-20">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">✏️</div><p>Chưa có sản phẩm nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>BST</th>
                    <th>Form</th>
                    <th>Tiến độ</th>
                    <th>SL (S-XXL)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sp) => {
                    const donePhases = (sp.phases || []).filter((p) => p.hoanThanh).length
                    const totalSizes = (sp.sizes || []).reduce((s, sz) => s + sz.soLuong, 0)
                    return (
                      <tr key={sp.id}>
                        <td>
                          <b>{sp.tenSanPham}</b>
                          <br />
                          <span className="text-sm text-muted">{sp.nhomHang}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12 }}>{sp.bst?.ten}</span>
                          <br />
                          <span className="text-sm text-muted">{sp.bst?.mua} {sp.bst?.nam}</span>
                        </td>
                        <td><span className="badge badge-gray">{sp.formDang}</span></td>
                        <td style={{ minWidth: 150 }}>
                          <div className="flex-row gap-8">
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className="progress-fill" style={{ width: `${(donePhases / 5) * 100}%` }} />
                            </div>
                            <span className="text-sm">{donePhases}/5</span>
                          </div>
                          <button
                            className="text-sm"
                            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                            onClick={() => setViewGantt(sp)}
                          >
                            Xem Gantt →
                          </button>
                        </td>
                        <td>
                          <div className="sizes-grid" style={{ gap: 4 }}>
                            {(sp.sizes || []).map((s) => (
                              <div key={s.size} className="size-box" style={{ minWidth: 36, padding: '4px 6px' }}>
                                <div className="size-label" style={{ fontSize: 10 }}>{s.size}</div>
                                <div className="size-qty" style={{ fontSize: 13 }}>{s.soLuong}</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-sm text-muted mt-4">Tổng: {totalSizes.toLocaleString()}</div>
                        </td>
                        <td>
                          <select
                            value={sp.trangThai}
                            onChange={(e) => changeStatus(sp.id, e.target.value)}
                            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
                          >
                            {Object.entries(TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="flex-row gap-8">
                            <button className="btn btn-secondary btn-sm" onClick={async () => {
                              const detail = await api.phatTrien.get(sp.id)
                              setEditing(detail); setShowForm(true)
                            }}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(sp.id)}>🗑️</button>
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

      {/* Form Modal */}
      {showForm && (
        <ProductForm
          bstList={bstList}
          nhomHangList={nhomHangList}
          initialData={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Gantt Modal */}
      {viewGantt && (
        <div className="modal-overlay" onClick={() => setViewGantt(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Gantt — {viewGantt.tenSanPham}</h3>
              <button className="btn-icon" onClick={() => setViewGantt(null)}>✕</button>
            </div>
            <div className="modal-body">
              <GanttChart phases={viewGantt.phases || []} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
