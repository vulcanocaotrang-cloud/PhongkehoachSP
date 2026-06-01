import { useEffect, useState } from 'react'
import { api } from '../api'
import GanttChart from '../components/GanttChart'
import { toast, toastSuccess } from '../components/Toast'

const TRANG_THAI_SX = {
  NHAN_SP:       { label: 'Nhận SP',          cls: 'badge-gray',   step: 1 },
  LAP_KE_HOACH:  { label: 'Lập kế hoạch',     cls: 'badge-blue',   step: 2 },
  CAN_DOI_NPL:   { label: 'Cân đối NPL',      cls: 'badge-yellow', step: 3 },
  BAN_GIAO_GC:   { label: 'Bàn giao GC',      cls: 'badge-blue',   step: 4 },
  THEO_DOI:      { label: 'Theo dõi SX',      cls: 'badge-blue',   step: 5 },
  XU_LY_RUI_RO:  { label: 'Xử lý rủi ro',    cls: 'badge-red',    step: 6 },
  NHAP_KHO:      { label: 'Nhập kho ✓',       cls: 'badge-green',  step: 7 },
}

function RiskModal({ keHoachId, risks = [], onClose, onUpdate }) {
  const [list, setList] = useState(risks)
  const [form, setForm] = useState({ moTa: '', phuongAn: '', ngayPhatSinh: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  async function add() {
    if (!form.moTa) return
    setSaving(true)
    try {
      const r = await api.keHoach.risks.create(keHoachId, form)
      setList((p) => [r, ...p])
      setForm({ moTa: '', phuongAn: '', ngayPhatSinh: new Date().toISOString().split('T')[0] })
      onUpdate()
    } finally { setSaving(false) }
  }

  async function toggle(r) {
    const updated = await api.keHoach.risks.update(keHoachId, r.id, { daXuLy: !r.daXuLy })
    setList((p) => p.map((x) => x.id === r.id ? updated : x))
    onUpdate()
  }

  async function remove(id) {
    await api.keHoach.risks.remove(keHoachId, id)
    setList((p) => p.filter((r) => r.id !== id))
    onUpdate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚠️ Log rủi ro phát sinh</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid cols-1" style={{ gap: 10, marginBottom: 16 }}>
            <div className="form-group">
              <label className="required">Mô tả sự cố</label>
              <textarea value={form.moTa} onChange={(e) => setForm((p) => ({ ...p, moTa: e.target.value }))} placeholder="Mô tả sự cố..." style={{ minHeight: 60 }} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Phương án xử lý</label>
                <input value={form.phuongAn} onChange={(e) => setForm((p) => ({ ...p, phuongAn: e.target.value }))} placeholder="Phương án..." />
              </div>
              <div className="form-group">
                <label>Ngày phát sinh</label>
                <input type="date" value={form.ngayPhatSinh} onChange={(e) => setForm((p) => ({ ...p, ngayPhatSinh: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-danger" onClick={add} disabled={saving}>+ Ghi nhận rủi ro</button>
          </div>

          <div className="section-divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.length === 0 && <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 16 }}>Chưa có rủi ro nào</div>}
            {list.map((r) => (
              <div key={r.id} style={{
                padding: 12, borderRadius: 8, border: `1px solid ${r.daXuLy ? 'var(--gray-200)' : '#FECACA'}`,
                background: r.daXuLy ? 'var(--gray-50)' : '#FFF5F5',
                opacity: r.daXuLy ? 0.7 : 1,
              }}>
                <div className="flex-between">
                  <span style={{ fontWeight: 600, fontSize: 13, textDecoration: r.daXuLy ? 'line-through' : 'none' }}>
                    {r.moTa}
                  </span>
                  <div className="flex-row gap-8">
                    <span className="text-sm text-muted">{r.ngayPhatSinh || ''}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggle(r)}>
                      {r.daXuLy ? '↩ Mở lại' : '✓ Đã xử lý'}
                    </button>
                    <button className="btn-icon" onClick={() => remove(r.id)}>🗑️</button>
                  </div>
                </div>
                {r.phuongAn && <div className="text-sm" style={{ marginTop: 6, color: 'var(--success)' }}>→ {r.phuongAn}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ keHoach, nhaMayList, onClose, onSave }) {
  const [form, setForm] = useState({
    nhaMayId:         keHoach.nhaMayId || '',
    trangThai:        keHoach.trangThai,
    phanTramHoanThanh: keHoach.phanTramHoanThanh,
    ngayGiaoCho:      keHoach.ngayGiaoCho || '',
    ngayNhapKho:      keHoach.ngayNhapKho || '',
    ghiChu:           keHoach.ghiChu || '',
    soLuongThucTe:    keHoach.soLuongThucTe || '',
    phases: keHoach.phases.map((p) => ({ ...p })),
  })
  const [tab, setTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [showRisk, setShowRisk] = useState(false)
  const [riskCount, setRiskCount] = useState(keHoach.risks?.length || 0)

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }
  function setPhase(i, k, v) { setForm((p) => ({ ...p, phases: p.phases.map((ph, idx) => idx === i ? { ...ph, [k]: v } : ph) })) }

  async function save() {
    setSaving(true)
    try { await onSave(keHoach.id, form) }
    finally { setSaving(false) }
  }

  const totalSP = (keHoach.sanPham?.sizes || []).reduce((s, sz) => s + sz.soLuong, 0)

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>🏭 {keHoach.sanPham?.tenSanPham}</h3>
              <div className="text-sm text-muted">{keHoach.sanPham?.bst?.ten} · {keHoach.sanPham?.nhomHang}</div>
            </div>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 20px', background: 'var(--gray-50)' }}>
            {[['info','📋 Kế hoạch'],['timeline','📅 Timeline'],['gantt','📊 Gantt']].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--primary)' : 'var(--gray-500)',
                borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent', fontSize: 13,
              }}>{label}</button>
            ))}
            <button onClick={() => setShowRisk(true)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--danger)', fontWeight: 600, fontSize: 13, marginLeft: 'auto',
            }}>
              ⚠️ Rủi ro ({riskCount})
            </button>
          </div>

          <div className="modal-body">
            {tab === 'info' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Nhà máy gia công</label>
                  <select value={form.nhaMayId} onChange={(e) => setF('nhaMayId', e.target.value)}>
                    <option value="">— Chưa giao —</option>
                    {nhaMayList.map((n) => <option key={n.id} value={n.id}>{n.ten} (CS: {n.congSuat}/tháng)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select value={form.trangThai} onChange={(e) => setF('trangThai', e.target.value)}>
                    {Object.entries(TRANG_THAI_SX).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group span-2">
                  <label>% Hoàn thành: <b>{form.phanTramHoanThanh}%</b></label>
                  <input type="range" min="0" max="100" step="5" value={form.phanTramHoanThanh} onChange={(e) => setF('phanTramHoanThanh', Number(e.target.value))} />
                  <div className="progress-bar mt-4">
                    <div className="progress-fill" style={{ width: `${form.phanTramHoanThanh}%` }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ngày bàn giao GC</label>
                  <input type="date" value={form.ngayGiaoCho} onChange={(e) => setF('ngayGiaoCho', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Ngày nhập kho</label>
                  <input type="date" value={form.ngayNhapKho} onChange={(e) => setF('ngayNhapKho', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>SL thực tế (SP)</label>
                  <input type="number" min="0" value={form.soLuongThucTe} onChange={(e) => setF('soLuongThucTe', e.target.value)} placeholder={`Target: ${totalSP}`} />
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <input value={form.ghiChu} onChange={(e) => setF('ghiChu', e.target.value)} placeholder="Ghi chú thêm..." />
                </div>
              </div>
            )}

            {tab === 'timeline' && (
              <table className="phase-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Giai đoạn</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th style={{ width: 80 }}>Hoàn thành</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {form.phases.map((p, i) => {
                    const today = new Date().toISOString().split('T')[0]
                    const isLate = !p.hoanThanh && p.ngayKetThuc && p.ngayKetThuc < today
                    return (
                      <tr key={i} style={{ background: isLate ? '#FFF5F5' : 'white' }}>
                        <td><span className="phase-num" style={{ background: ['#8B5CF6','#2563EB','#0891B2','#16A34A','#D97706','#DC2626','#374151'][i] }}>{p.soThuTu}</span></td>
                        <td>
                          <b style={{ fontSize: 13 }}>{p.tenGiaiDoan}</b>
                          {isLate && <span className="badge badge-red" style={{ marginLeft: 6 }}>Trễ</span>}
                        </td>
                        <td><input type="date" value={p.ngayBatDau || ''} onChange={(e) => setPhase(i, 'ngayBatDau', e.target.value)} /></td>
                        <td><input type="date" value={p.ngayKetThuc || ''} onChange={(e) => setPhase(i, 'ngayKetThuc', e.target.value)} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={p.hoanThanh} onChange={(e) => setPhase(i, 'hoanThanh', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
                        </td>
                        <td><input placeholder="Ghi chú..." value={p.ghiChu || ''} onChange={(e) => setPhase(i, 'ghiChu', e.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {tab === 'gantt' && <GanttChart phases={form.phases} />}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu kế hoạch'}</button>
          </div>
        </div>
      </div>

      {showRisk && (
        <RiskModal
          keHoachId={keHoach.id}
          risks={keHoach.risks}
          onClose={() => setShowRisk(false)}
          onUpdate={() => setRiskCount((c) => c + 1)}
        />
      )}
    </>
  )
}

export default function KeHoachSXPage() {
  const [list, setList] = useState([])
  const [nhaMayList, setNhaMayList] = useState([])
  const [spList, setSpList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newSpId, setNewSpId] = useState('')
  const [newNhaMayId, setNewNhaMayId] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    Promise.all([
      api.keHoach.list(),
      api.nhaMay.list(),
      api.phatTrien.list({ trangThai: 'DA_CHOT' }),
    ]).then(([kh, nm, sp]) => {
      setList(kh); setNhaMayList(nm)
      setSpList(sp.filter((s) => !s.keHoach))
    }).catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function load() {
    try {
      const params = filter ? { trangThai: filter } : undefined
      setList(await api.keHoach.list(params))
    } catch (e) { toast(e.message) }
  }

  useEffect(() => { if (!loading) load() }, [filter])

  async function create() {
    if (!newSpId) return toast('Vui lòng chọn sản phẩm', 'info')
    setCreating(true)
    try {
      await api.keHoach.create({ sanPhamId: newSpId, nhaMayId: newNhaMayId || undefined })
      toastSuccess('Đã tạo kế hoạch sản xuất!')
      setShowCreate(false); setNewSpId(''); setNewNhaMayId('')
      const [kh, sp] = await Promise.all([api.keHoach.list(), api.phatTrien.list({ trangThai: 'DA_CHOT' })])
      setList(kh); setSpList(sp.filter((s) => !s.keHoach))
    } catch (e) {
      toast(e.message)
    } finally { setCreating(false) }
  }

  async function handleSave(id, data) {
    try {
      await api.keHoach.update(id, data)
      toastSuccess('Đã lưu kế hoạch!')
      setSelected(null)
      await load()
    } catch (e) { toast(e.message) }
  }

  async function remove(id) {
    if (!confirm('Xoá kế hoạch này?')) return
    try {
      await api.keHoach.remove(id)
      toastSuccess('Đã xoá kế hoạch')
      await load()
    } catch (e) { toast(e.message) }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🏭 Kế hoạch Sản xuất</h2>
          <p>7 giai đoạn từ nhận SP đến nhập kho thành phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Tạo kế hoạch SX</button>
      </div>

      <div className="page-body">
        {/* Filter */}
        <div className="flex-row mb-16">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 220 }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TRANG_THAI_SX).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-sm text-muted">{list.length} kế hoạch</span>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div className="empty-state"><div className="icon">🏭</div><p>Chưa có kế hoạch sản xuất nào</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>BST</th>
                    <th>Nhà máy</th>
                    <th>Trạng thái</th>
                    <th>Tiến độ</th>
                    <th>Ngày giao</th>
                    <th>Rủi ro</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((kh) => {
                    const donePhases = (kh.phases || []).filter((p) => p.hoanThanh).length
                    const openRisks  = (kh.risks  || []).filter((r) => !r.daXuLy).length
                    const info = TRANG_THAI_SX[kh.trangThai] || { label: kh.trangThai, cls: 'badge-gray' }
                    const today = new Date().toISOString().split('T')[0]
                    const isLate = (kh.phases || []).some((p) => !p.hoanThanh && p.ngayKetThuc && p.ngayKetThuc < today)
                    return (
                      <tr key={kh.id} className={isLate ? 'row-danger' : ''}>
                        <td>
                          <b>{kh.sanPham?.tenSanPham}</b>
                          <br />
                          <span className="text-sm text-muted">{kh.sanPham?.nhomHang}</span>
                        </td>
                        <td className="text-sm">{kh.sanPham?.bst?.ten}</td>
                        <td>{kh.nhaMay?.ten || <span className="text-muted">—</span>}</td>
                        <td><span className={`badge ${info.cls}`}>{info.label}</span></td>
                        <td style={{ minWidth: 130 }}>
                          <div className="flex-row gap-8">
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className={`progress-fill ${kh.phanTramHoanThanh === 100 ? 'success' : ''}`} style={{ width: `${kh.phanTramHoanThanh}%` }} />
                            </div>
                            <span className="text-sm">{kh.phanTramHoanThanh}%</span>
                          </div>
                          <div className="text-sm text-muted">{donePhases}/7 giai đoạn</div>
                        </td>
                        <td className="text-sm">{kh.ngayGiaoCho || '—'}</td>
                        <td>
                          {openRisks > 0
                            ? <span className="badge badge-red">⚠️ {openRisks} chưa xử lý</span>
                            : <span className="text-muted text-sm">—</span>}
                        </td>
                        <td>
                          <div className="flex-row gap-8">
                            <button className="btn btn-secondary btn-sm" onClick={async () => {
                              const detail = await api.keHoach.get(kh.id)
                              setSelected(detail)
                            }}>📋 Chi tiết</button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(kh.id)}>🗑️</button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Tạo kế hoạch sản xuất</h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid cols-1" style={{ gap: 14 }}>
                <div className="alert alert-warning">
                  <span>ℹ️</span>
                  <span>Chỉ sản phẩm có trạng thái <b>Đã chốt</b> mới được đưa vào kế hoạch SX.</span>
                </div>
                <div className="form-group">
                  <label className="required">Sản phẩm đã chốt</label>
                  <select value={newSpId} onChange={(e) => setNewSpId(e.target.value)}>
                    <option value="">— Chọn sản phẩm —</option>
                    {spList.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.tenSanPham} · {sp.nhomHang} · {sp.bst?.ten}
                      </option>
                    ))}
                  </select>
                  {spList.length === 0 && <span className="text-sm text-muted">Không có SP đã chốt chưa có KH</span>}
                </div>
                <div className="form-group">
                  <label>Nhà máy gia công</label>
                  <select value={newNhaMayId} onChange={(e) => setNewNhaMayId(e.target.value)}>
                    <option value="">— Chọn sau —</option>
                    {nhaMayList.map((n) => <option key={n.id} value={n.id}>{n.ten} (CS: {n.congSuat}/tháng)</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={create} disabled={creating}>{creating ? 'Đang tạo...' : '🏭 Tạo kế hoạch'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          keHoach={selected}
          nhaMayList={nhaMayList}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
