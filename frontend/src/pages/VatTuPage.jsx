import { useEffect, useState, useRef } from 'react'
import { api } from '../api'
import { toast, toastSuccess } from '../components/Toast'

const DVT_OPTS = ['m', 'kg', 'g', 'cái', 'cuộn', 'tờ', 'hộp', 'thùng', 'lít', 'bộ']
const EMPTY = { ten: '', maVatTu: '', donViTinh: '', nhaCungCapId: '', nhomHangId: '', donGia: '', tonKho: '0', tonToiThieu: '0', hinhAnh: null, ghiChu: '', lyDoCapNhat: '' }
const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—'

// Compress image client-side before storing as base64
function compressImage(file, maxPx = 400, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
          else       { w = Math.round(w * maxPx / h); h = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function ImageCell({ id, hasImage, index = 0 }) {
  const [src, setSrc]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  // Auto-load khi component mount — stagger nhẹ để không flood cùng lúc
  useEffect(() => {
    if (!hasImage) return
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const { hinhAnh } = await api.vatTu.getImage(id)
        if (hinhAnh) setSrc(hinhAnh)
      } catch { /* no image */ }
      finally { setLoading(false) }
    }, index * 60)           // stagger 60ms mỗi row
    return () => clearTimeout(timer)
  }, [id, hasImage, index])

  if (!hasImage) {
    return (
      <div style={{
        width: 64, height: 64, borderRadius: 8,
        background: 'var(--gray-100)', border: '1px dashed var(--gray-300)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: 'var(--gray-300)',
      }}>📦</div>
    )
  }

  if (loading || !src) {
    return (
      <div style={{
        width: 64, height: 64, borderRadius: 8,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.2s infinite',
        border: '1px solid var(--gray-200)',
      }} />
    )
  }

  return (
    <>
      <img
        src={src}
        alt=""
        onClick={() => setShow(true)}
        style={{
          width: 64, height: 64, objectFit: 'cover',
          borderRadius: 8, border: '1px solid var(--gray-200)',
          cursor: 'zoom-in', display: 'block',
          boxShadow: '0 1px 4px rgba(0,0,0,.12)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,.2)' }}
        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)';    e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,.12)' }}
        title="Nhấn để xem ảnh lớn"
      />
      {/* Lightbox */}
      {show && (
        <div
          onClick={() => setShow(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)',
            zIndex: 9999, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'zoom-out',
            animation: 'fadeIn .15s ease',
          }}
        >
          <img src={src} alt=""
            style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 10, boxShadow: '0 12px 60px rgba(0,0,0,.7)' }}
          />
          <div style={{ position: 'absolute', top: 16, right: 20, color: 'white', fontSize: 28, cursor: 'pointer', opacity: .7 }}
            onClick={() => setShow(false)}>✕</div>
        </div>
      )}
    </>
  )
}

export default function VatTuPage() {
  const [list, setList]           = useState([])
  const [nccList, setNccList]     = useState([])
  const [nhomHangList, setNhomHangList] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [search, setSearch]       = useState('')
  const [filterNcc, setFilterNcc] = useState('')
  const [filterNH, setFilterNH]   = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [previewImg, setPreviewImg] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    Promise.all([api.vatTu.list(), api.nhaCungCap.list(), api.nhomHang.list()])
      .then(([v, n, nh]) => { setList(v); setNccList(n); setNhomHangList(nh) })
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function load() {
    try { setList(await api.vatTu.list()) } catch (e) { toast(e.message) }
  }

  function setF(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast('Ảnh không quá 10MB', 'info')
    const base64 = await compressImage(file)
    setPreviewImg(base64)
    setF('hinhAnh', base64)
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY); setPreviewImg(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(true)
  }

  async function openEdit(item) {
    setEditing(item)
    setForm({
      ten: item.ten, maVatTu: item.maVatTu || '', donViTinh: item.donViTinh,
      nhaCungCapId: item.nhaCungCapId || '', nhomHangId: item.nhomHangId || '',
      donGia: item.donGia ?? '', tonKho: item.tonKho,
      tonToiThieu: item.tonToiThieu, hinhAnh: null, ghiChu: item.ghiChu || '',
      lyDoCapNhat: '',
    })
    // Load existing image
    if (item.hasImage) {
      try {
        const { hinhAnh } = await api.vatTu.getImage(item.id)
        setPreviewImg(hinhAnh)
        setF('hinhAnh', hinhAnh)
      } catch { setPreviewImg(null) }
    } else {
      setPreviewImg(null)
    }
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(true)
  }

  async function save() {
    if (!form.ten.trim() || !form.donViTinh.trim()) return toast('Tên và đơn vị tính không được trống', 'info')
    setSaving(true)
    try {
      if (editing) {
        const res = await api.vatTu.update(editing.id, form)

        // ── Cập nhật ngay vào list state từ response — không đợi load() ──
        const { _dieuChinh, ...updatedFields } = res || {}
        setList(prev => prev.map(v =>
          v.id === editing.id
            ? {
                ...v,
                ten:          updatedFields.ten          ?? v.ten,
                maVatTu:      updatedFields.maVatTu      ?? v.maVatTu,
                donViTinh:    updatedFields.donViTinh    ?? v.donViTinh,
                donGia:       updatedFields.donGia       ?? v.donGia,
                tonKho:       updatedFields.tonKho       ?? v.tonKho,
                tonToiThieu:  updatedFields.tonToiThieu  ?? v.tonToiThieu,
                nhaCungCapId: updatedFields.nhaCungCapId ?? v.nhaCungCapId,
                nhomHangId:   updatedFields.nhomHangId   ?? v.nhomHangId,
                nhaCungCap:   updatedFields.nhaCungCap   ?? v.nhaCungCap,
                nhomHangRef:  updatedFields.nhomHangRef  ?? v.nhomHangRef,
                ghiChu:       updatedFields.ghiChu       ?? v.ghiChu,
                hasImage:     updatedFields.hasImage     ?? v.hasImage,
              }
            : v
        ))

        if (_dieuChinh) {
          toastSuccess(`Đã cập nhật! Tồn kho: ${_dieuChinh.old} → ${_dieuChinh.new} (đã ghi phiếu ĐC)`)
        } else {
          toastSuccess('Đã cập nhật vật tư!')
        }
      } else {
        const created = await api.vatTu.create(form)
        // Thêm item mới vào đầu list
        if (created) setList(prev => [created, ...prev])
        toastSuccess('Đã thêm vật tư mới!')
      }
      setShowForm(false)

      // Load lại trong nền để đồng bộ hoàn toàn (không block UI)
      load()
    } catch (e) { toast(e.message) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Xoá vật tư này?')) return
    try {
      await api.vatTu.remove(id)
      setList(prev => prev.filter(v => v.id !== id))   // xoá khỏi state ngay
      toastSuccess('Đã xoá vật tư')
      load()                                            // đồng bộ nền
    }
    catch (e) { toast(e.message) }
  }

  let filtered = list
  if (search)      filtered = filtered.filter((x) => x.ten.toLowerCase().includes(search.toLowerCase()) || (x.maVatTu || '').toLowerCase().includes(search.toLowerCase()))
  if (filterNcc)   filtered = filtered.filter((x) => x.nhaCungCapId === Number(filterNcc))
  if (filterNH)    filtered = filtered.filter((x) => x.nhomHangId   === Number(filterNH))
  if (showLowOnly) filtered = filtered.filter((x) => x.tonKho <= x.tonToiThieu)

  const tongGiaTri   = list.reduce((s, v) => s + (v.tonKho || 0) * (v.donGia || 0), 0)
  const soLuongThieu = list.filter((v) => v.tonKho <= v.tonToiThieu && v.tonToiThieu > 0).length

  return (
    <>
      <div className="page-header">
        <div><h2>📦 Danh mục Vật tư</h2><p>Quản lý nguyên phụ liệu, hình ảnh và tồn kho</p></div>
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
              <div className="label">⚠️ Dưới tối thiểu</div>
              <div className="value">{soLuongThieu}</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex-row mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="🔍 Tên, mã vật tư..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
          <select value={filterNcc} onChange={(e) => setFilterNcc(e.target.value)} style={{ width: 190 }}>
            <option value="">Tất cả NCC</option>
            {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
          </select>
          <select value={filterNH} onChange={(e) => setFilterNH(e.target.value)} style={{ width: 180 }}>
            <option value="">Tất cả nhóm hàng</option>
            {nhomHangList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
          </select>
          <label className="checkbox-row">
            <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} />
            <span>Chỉ VT sắp hết</span>
          </label>
          <span className="text-sm text-muted">{filtered.length} vật tư</span>
        </div>

        <div className="card">
          {loading ? <div className="loading"><div className="spinner" /></div> :
           filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>Không tìm thấy vật tư</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Hình ảnh</th>
                    <th>Mã VT</th><th>Tên vật tư</th><th>Nhóm hàng</th>
                    <th>ĐVT</th><th>Nhà CC</th>
                    <th className="text-right">Đơn giá</th>
                    <th className="text-right">Tồn kho</th>
                    <th>Tình trạng</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const tt = item.tonKho <= 0 ? { cls: 'badge-red', label: '❌ Hết' }
                      : item.tonKho <= item.tonToiThieu ? { cls: 'badge-yellow', label: '⚠️ Sắp hết' }
                      : { cls: 'badge-green', label: '✅ Đủ' }
                    return (
                      <tr key={item.id} className={item.tonKho <= 0 ? 'row-danger' : ''}>
                        <td style={{ padding: '6px 10px' }}>
                          <ImageCell id={item.id} hasImage={item.hasImage} index={idx} />
                        </td>
                        <td><code style={{ fontSize: 11, color: 'var(--gray-500)' }}>{item.maVatTu || '—'}</code></td>
                        <td><b>{item.ten}</b></td>
                        <td>
                          {item.nhomHangRef
                            ? <span className="badge badge-blue">{item.nhomHangRef.ten}</span>
                            : <span className="text-muted text-sm">—</span>}
                        </td>
                        <td><span className="badge badge-gray">{item.donViTinh}</span></td>
                        <td className="text-sm">{item.nhaCungCap?.ten || '—'}</td>
                        <td className="text-right">{item.donGia ? fmt(item.donGia) : '—'}</td>
                        <td className="text-right font-bold">{fmt(item.tonKho)}</td>
                        <td><span className={`badge ${tt.cls}`}>{tt.label}</span></td>
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

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa vật tư' : '+ Thêm vật tư mới'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">

                {/* ── Hình ảnh ────────────────────────────────────────── */}
                <div className="form-group span-2">
                  <label>Hình ảnh vật tư</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Preview */}
                    <div style={{
                      width: 100, height: 100, border: '2px dashed var(--gray-300)',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', background: 'var(--gray-50)', flexShrink: 0, cursor: 'pointer',
                    }} onClick={() => fileRef.current?.click()}>
                      {previewImg
                        ? <img src={previewImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 28 }}>📷</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                        📁 Chọn ảnh
                      </button>
                      {previewImg && (
                        <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }}
                          onClick={() => { setPreviewImg(null); setF('hinhAnh', null); if (fileRef.current) fileRef.current.value = '' }}>
                          🗑️ Xoá ảnh
                        </button>
                      )}
                      <p className="text-sm text-muted" style={{ marginTop: 6 }}>
                        JPG, PNG, WEBP · Tự động nén xuống 400px
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Thông tin cơ bản ─────────────────────────────────── */}
                <div className="form-group span-2">
                  <label className="required">Tên vật tư</label>
                  <input autoFocus value={form.ten} onChange={(e) => setF('ten', e.target.value)}
                    placeholder="VD: Vải cotton trắng 200gsm..." />
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

                {/* ── Nhóm hàng + NCC ─────────────────────────────────── */}
                <div className="form-group">
                  <label>Nhóm hàng</label>
                  <select value={form.nhomHangId} onChange={(e) => setF('nhomHangId', e.target.value)}>
                    <option value="">— Không phân loại —</option>
                    {nhomHangList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nhà cung cấp</label>
                  <select value={form.nhaCungCapId} onChange={(e) => setF('nhaCungCapId', e.target.value)}>
                    <option value="">— Không chọn —</option>
                    {nccList.map((n) => <option key={n.id} value={n.id}>{n.ten}</option>)}
                  </select>
                </div>

                {/* ── Giá + tồn kho ───────────────────────────────────── */}
                <div className="form-group">
                  <label>Đơn giá (VNĐ)</label>
                  <input type="number" min="0" value={form.donGia} onChange={(e) => setF('donGia', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Mức tối thiểu cảnh báo</label>
                  <input type="number" min="0" step="0.1" value={form.tonToiThieu} onChange={(e) => setF('tonToiThieu', e.target.value)} />
                </div>

                {/* ── Tồn kho ─────────────────────────────────────────── */}
                <div className="form-group span-2" style={{ background: editing ? '#FFF7ED' : 'var(--gray-50)', border: '1px solid', borderColor: editing ? '#FED7AA' : 'var(--gray-200)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>📦</span>
                    <label style={{ fontSize: 13, fontWeight: 700, color: editing ? '#92400E' : 'var(--gray-700)', margin: 0 }}>
                      {editing ? 'Cập nhật số lượng tồn kho' : 'Số lượng tồn đầu'}
                    </label>
                    {editing && (
                      <span style={{ fontSize: 11, background: '#FED7AA', color: '#92400E', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                        Tồn hiện tại: {editing.tonKho}
                      </span>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12 }}>{editing ? 'Số lượng mới' : 'Số lượng tồn ban đầu'}</label>
                      <input
                        type="number" min="0" step="0.1"
                        value={form.tonKho}
                        onChange={(e) => setF('tonKho', e.target.value)}
                        style={{ fontWeight: 700, fontSize: 15 }}
                      />
                    </div>
                    {editing && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: 12 }}>Lý do điều chỉnh</label>
                        <input
                          value={form.lyDoCapNhat}
                          onChange={(e) => setF('lyDoCapNhat', e.target.value)}
                          placeholder="VD: Kiểm kê tháng 6, nhập đầu kỳ..."
                        />
                      </div>
                    )}
                  </div>

                  {editing && Number(form.tonKho) !== editing.tonKho && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>↳ Sẽ điều chỉnh:</span>
                      <b>{editing.tonKho}</b>
                      <span>→</span>
                      <b style={{ color: Number(form.tonKho) > editing.tonKho ? 'var(--success)' : 'var(--danger)' }}>
                        {Number(form.tonKho)}
                      </b>
                      <span style={{ color: 'var(--gray-500)' }}>(chênh lệch: {Number(form.tonKho) > editing.tonKho ? '+' : ''}{(Number(form.tonKho) - editing.tonKho).toFixed(2)})</span>
                      <span style={{ marginLeft: 4 }}>· Sẽ ghi phiếu điều chỉnh tự động</span>
                    </div>
                  )}
                </div>
                <div className="form-group span-2">
                  <label>Ghi chú</label>
                  <textarea value={form.ghiChu} onChange={(e) => setF('ghiChu', e.target.value)}
                    placeholder="Mô tả thêm về vật tư..." style={{ minHeight: 60 }} />
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
