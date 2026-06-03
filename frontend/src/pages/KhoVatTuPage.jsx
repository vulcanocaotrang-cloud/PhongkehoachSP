import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const fmt  = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '0'
const TODAY = new Date().toISOString().split('T')[0]

const LOAI_LABEL = { NHAP: { label: 'Nhập kho', cls: 'badge-green', icon: '⬇️' },
                     XUAT: { label: 'Xuất kho', cls: 'badge-blue',  icon: '⬆️' },
                     DIEU_CHINH: { label: 'Điều chỉnh', cls: 'badge-yellow', icon: '⚖️' } }

function GiaoDichModal({ vatTuList, nccList, nhaMayList, onClose, onDone }) {
  const [tab, setTab] = useState('NHAP')
  const [form, setForm] = useState({
    vatTuId: '', nhaCungCapId: '', nhaMayId: '', soLuong: '', donGia: '',
    soChungTu: '', lyDo: '', ngayGiaoDich: TODAY, keHoachId: '', ghiChu: '',
    tonKhoMoi: '',
  })
  const [saving, setSaving] = useState(false)

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  async function save() {
    if (!form.vatTuId) return toast('Vui lòng chọn vật tư', 'info')
    const sl = Number(form.soLuong)
    setSaving(true)
    try {
      if (tab === 'NHAP') {
        if (!sl || sl <= 0) return toast('Số lượng phải lớn hơn 0', 'info')
        await api.kho.nhap({ ...form, soLuong: sl, donGia: form.donGia ? Number(form.donGia) : undefined })
        toastSuccess(`Nhập kho thành công: ${sl} ${vatTuList.find((v) => v.id === Number(form.vatTuId))?.donViTinh || ''}`)
      } else if (tab === 'XUAT') {
        if (!sl || sl <= 0) return toast('Số lượng phải lớn hơn 0', 'info')
        await api.kho.xuat({
          ...form, soLuong: sl,
          nhaMayId: form.nhaMayId || undefined,
        })
        const nm = nhaMayList.find((n) => n.id === Number(form.nhaMayId))
        toastSuccess(`Xuất kho thành công${nm ? ' → ' + nm.ten : ''}!`)
      } else {
        if (form.tonKhoMoi === '') return toast('Nhập tồn kho mới', 'info')
        await api.kho.dieuChinh({ vatTuId: form.vatTuId, tonKhoMoi: Number(form.tonKhoMoi),
          lyDo: form.lyDo, ngayGiaoDich: form.ngayGiaoDich, ghiChu: form.ghiChu })
        toastSuccess('Điều chỉnh tồn kho thành công!')
      }
      onDone()
      onClose()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  const selectedVT = vatTuList.find((v) => v.id === Number(form.vatTuId))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Phiếu nhập / xuất / điều chỉnh</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          {Object.entries(LOAI_LABEL).map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
            }}>{v.icon} {v.label}</button>
          ))}
        </div>

        <div className="modal-body">
          <div className="form-grid cols-1" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="required">Vật tư</label>
              <select value={form.vatTuId} onChange={(e) => setF('vatTuId', e.target.value)}>
                <option value="">— Chọn vật tư —</option>
                {vatTuList.map((v) => (
                  <option key={v.id} value={v.id}>{v.ten} ({v.donViTinh}) — Tồn: {fmt(v.tonKho)}</option>
                ))}
              </select>
            </div>

            {selectedVT && (
              <div style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 12 }}>
                <span className="font-bold">{selectedVT.ten}</span> · {selectedVT.donViTinh} ·
                Tồn kho: <b style={{ color: selectedVT.tonKho <= selectedVT.tonToiThieu ? 'var(--danger)' : 'var(--success)' }}>{fmt(selectedVT.tonKho)}</b>
                {selectedVT.donGia ? ` · Giá: ${fmt(selectedVT.donGia)} VNĐ` : ''}
              </div>
            )}

            {tab === 'DIEU_CHINH' ? (
              <div className="form-group">
                <label className="required">Tồn kho mới</label>
                <input type="number" min="0" step="0.1" value={form.tonKhoMoi} onChange={(e) => setF('tonKhoMoi', e.target.value)} placeholder="Nhập số tồn kho thực tế" />
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label className="required">Số lượng</label>
                  <input type="number" min="0.01" step="0.01" value={form.soLuong} onChange={(e) => setF('soLuong', e.target.value)} placeholder="0" />
                </div>
                {tab === 'NHAP' && (
                  <div className="form-group">
                    <label>Đơn giá (VNĐ)</label>
                    <input type="number" min="0" value={form.donGia} onChange={(e) => setF('donGia', e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
            )}

            {tab === 'XUAT' && (
              <div className="form-group">
                <label>🏭 Nhà máy gia công nhận vật tư</label>
                <select value={form.nhaMayId} onChange={(e) => setF('nhaMayId', e.target.value)}>
                  <option value="">— Không chọn —</option>
                  {nhaMayList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                </select>
              </div>
            )}

            {tab === 'NHAP' && (
              <div className="form-group">
                <label>Nhà cung cấp</label>
                <select value={form.nhaCungCapId} onChange={(e) => setF('nhaCungCapId', e.target.value)}>
                  <option value="">— Không chọn —</option>
                  {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                </select>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Ngày giao dịch</label>
                <input type="date" value={form.ngayGiaoDich} onChange={(e) => setF('ngayGiaoDich', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Số chứng từ</label>
                <input value={form.soChungTu} onChange={(e) => setF('soChungTu', e.target.value)} placeholder="Số phiếu / hóa đơn" />
              </div>
            </div>

            <div className="form-group">
              <label>{tab === 'DIEU_CHINH' ? 'Lý do điều chỉnh' : 'Lý do / ghi chú'}</label>
              <input value={form.lyDo} onChange={(e) => setF('lyDo', e.target.value)} placeholder={tab === 'DIEU_CHINH' ? 'Kiểm kê định kỳ, sai lệch...' : 'Ghi chú...'} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className={`btn ${tab === 'NHAP' ? 'btn-success' : tab === 'XUAT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={save} disabled={saving}>
            {saving ? '⏳...' : tab === 'NHAP' ? '⬇️ Nhập kho' : tab === 'XUAT' ? '⬆️ Xuất kho' : '⚖️ Điều chỉnh'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KhoVatTuPage() {
  const [tonKho, setTonKho]         = useState([])
  const [giaoDich, setGiaoDich]     = useState([])
  const [vatTuList, setVatTuList]   = useState([])
  const [nccList, setNccList]       = useState([])
  const [nhaMayList, setNhaMayList] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showGD, setShowGD]         = useState(false)
  const [tab, setTab]               = useState('ton-kho')
  const [filterLoai, setFilterLoai] = useState('')
  const [filterVT, setFilterVT]     = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [tk, gd, vt, ncc, nm] = await Promise.all([
        api.kho.tonKho(), api.kho.giaoDich(), api.vatTu.list(),
        api.nhaCungCap.list(), api.nhaMay.list(),
      ])
      setTonKho(tk); setGiaoDich(gd); setVatTuList(vt); setNccList(ncc); setNhaMayList(nm)
    } catch (e) { toast(e.message) }
    finally { setLoading(false) }
  }

  async function xoaGD(id) {
    if (!confirm('Huỷ giao dịch này sẽ hoàn tác tồn kho. Tiếp tục?')) return
    try { await api.kho.xoaGD(id); toastSuccess('Đã huỷ giao dịch'); await loadAll() }
    catch (e) { toast(e.message) }
  }

  const tongGiaTri = tonKho.reduce((s, v) => s + (v.giaTriTon || 0), 0)
  const soHet     = tonKho.filter((v) => v.trangThai === 'HET').length
  const soThieu   = tonKho.filter((v) => v.trangThai === 'THIEU').length

  const filteredGD = giaoDich
    .filter((g) => !filterLoai || g.loai === filterLoai)
    .filter((g) => !filterVT  || g.vatTuId === Number(filterVT))

  return (
    <>
      <div className="page-header">
        <div><h2>🏪 Kho vật tư — Nhập / Xuất / Tồn</h2><p>Theo dõi nhập xuất tồn kho nguyên phụ liệu</p></div>
        <button className="btn btn-primary" onClick={() => setShowGD(true)}>+ Phiếu nhập/xuất</button>
      </div>

      <div className="page-body">
        <div className="stat-grid mb-16">
          <div className="stat-card primary"><div className="label">Tổng loại VT</div><div className="value">{tonKho.length}</div></div>
          <div className="stat-card success">
            <div className="label">Giá trị tồn kho</div>
            <div className="value" style={{ fontSize: 16 }}>{fmt(Math.round(tongGiaTri))}</div>
            <div className="sub">VNĐ</div>
          </div>
          {soHet > 0 && <div className="stat-card danger"><div className="label">❌ Hết hàng</div><div className="value">{soHet}</div></div>}
          {soThieu > 0 && <div className="stat-card warning"><div className="label">⚠️ Sắp hết</div><div className="value">{soThieu}</div></div>}
          <div className="stat-card"><div className="label">Giao dịch hôm nay</div><div className="value">{giaoDich.filter((g) => g.ngayGiaoDich === TODAY).length}</div></div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--gray-200)', marginBottom: 16 }}>
          {[['ton-kho', '📊 Tồn kho'], ['lich-su', '📋 Lịch sử GD']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <>
            {tab === 'ton-kho' && (
              <div className="card">
                {tonKho.length === 0 ? (
                  <div className="empty-state"><div className="icon">🏪</div><p>Chưa có dữ liệu tồn kho</p></div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Mã VT</th><th>Tên vật tư</th><th>ĐVT</th><th>NCC</th>
                        <th className="text-right">Tồn kho</th><th className="text-right">Tối thiểu</th>
                        <th className="text-right">Đơn giá</th><th className="text-right">Giá trị tồn</th>
                        <th>Tình trạng</th></tr>
                      </thead>
                      <tbody>
                        {tonKho.map((v) => {
                          const tt = v.trangThai === 'HET' ? { cls: 'badge-red', label: '❌ Hết' }
                            : v.trangThai === 'THIEU' ? { cls: 'badge-yellow', label: '⚠️ Sắp hết' }
                            : { cls: 'badge-green', label: '✅ Đủ' }
                          return (
                            <tr key={v.id} className={v.trangThai === 'HET' ? 'row-danger' : ''}>
                              <td><code style={{ fontSize: 11 }}>{v.maVatTu || '—'}</code></td>
                              <td><b>{v.ten}</b></td>
                              <td>{v.donViTinh}</td>
                              <td className="text-sm">{v.nhaCungCap?.ten || '—'}</td>
                              <td className="text-right font-bold">{fmt(v.tonKho)}</td>
                              <td className="text-right text-muted">{fmt(v.tonToiThieu)}</td>
                              <td className="text-right">{v.donGia ? fmt(v.donGia) : '—'}</td>
                              <td className="text-right">{v.giaTriTon > 0 ? fmt(Math.round(v.giaTriTon)) : '—'}</td>
                              <td><span className={`badge ${tt.cls}`}>{tt.label}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'lich-su' && (
              <>
                <div className="flex-row mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
                  <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)} style={{ width: 160 }}>
                    <option value="">Tất cả loại</option>
                    {Object.entries(LOAI_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={filterVT} onChange={(e) => setFilterVT(e.target.value)} style={{ width: 220 }}>
                    <option value="">Tất cả vật tư</option>
                    {vatTuList.map((v) => <option key={v.id} value={v.id}>{v.ten}</option>)}
                  </select>
                  <span className="text-sm text-muted">{filteredGD.length} giao dịch</span>
                </div>
                <div className="card">
                  {filteredGD.length === 0 ? (
                    <div className="empty-state"><div className="icon">📋</div><p>Chưa có giao dịch nào</p></div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Ngày</th><th>Loại</th><th>Vật tư</th><th>NCC / Nhà máy</th>
                          <th className="text-right">Số lượng</th><th className="text-right">Đơn giá</th>
                          <th>Số CT</th><th>Lý do</th><th></th></tr>
                        </thead>
                        <tbody>
                          {filteredGD.map((g) => {
                            const loai = LOAI_LABEL[g.loai] || { label: g.loai, cls: 'badge-gray', icon: '?' }
                            return (
                              <tr key={g.id}>
                                <td className="text-sm">{g.ngayGiaoDich}</td>
                                <td><span className={`badge ${loai.cls}`}>{loai.icon} {loai.label}</span></td>
                                <td>
                                  <b style={{ fontSize: 13 }}>{g.vatTu?.ten}</b>
                                  <span className="text-muted text-sm"> ({g.vatTu?.donViTinh})</span>
                                </td>
                                <td className="text-sm">
                                  {g.loai === 'XUAT'
                                    ? (g.nhaMay?.ten ? <span>🏭 {g.nhaMay.ten}</span> : '—')
                                    : (g.nhaCungCap?.ten || '—')}
                                </td>
                                <td className="text-right font-bold">{fmt(g.soLuong)}</td>
                                <td className="text-right">{g.donGia ? fmt(g.donGia) : '—'}</td>
                                <td className="text-sm">{g.soChungTu || '—'}</td>
                                <td className="text-sm text-muted">{g.lyDo || g.ghiChu || '—'}</td>
                                <td>
                                  <button className="btn-icon" onClick={() => xoaGD(g.id)} title="Huỷ giao dịch">🗑️</button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showGD && (
        <GiaoDichModal
          vatTuList={vatTuList}
          nccList={nccList}
          nhaMayList={nhaMayList}
          onClose={() => setShowGD(false)}
          onDone={loadAll}
        />
      )}
    </>
  )
}
