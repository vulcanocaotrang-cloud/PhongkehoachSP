const BASE = '/api'

async function req(path, opts = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new Error('Không kết nối được backend. Hãy đảm bảo backend đang chạy (npm run dev trong /backend).')
  }
  if (res.status === 204) return null
  let data
  try { data = await res.json() } catch { data = {} }
  if (!res.ok) throw new Error(data.error || `Lỗi server: HTTP ${res.status}`)
  return data
}

export const api = {
  // ── BST ──────────────────────────────────────────────────────────────────
  bst: {
    list:   ()       => req('/bst'),
    get:    (id)     => req(`/bst/${id}`),
    create: (body)   => req('/bst', { method: 'POST', body }),
    update: (id, b)  => req(`/bst/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/bst/${id}`, { method: 'DELETE' }),
    mauSac: {
      list:   (id)        => req(`/bst/${id}/mau-sac`),
      create: (id, body)  => req(`/bst/${id}/mau-sac`, { method: 'POST', body }),
      remove: (id, mauId) => req(`/bst/${id}/mau-sac/${mauId}`, { method: 'DELETE' }),
    },
  },

  // ── Target BST ───────────────────────────────────────────────────────────
  target: {
    list:   (p)      => req(`/target-bst${p ? '?' + new URLSearchParams(p) : ''}`),
    get:    (id)     => req(`/target-bst/${id}`),
    create: (body)   => req('/target-bst', { method: 'POST', body }),
    update: (id, b)  => req(`/target-bst/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/target-bst/${id}`, { method: 'DELETE' }),
  },

  // ── Nhóm hàng ────────────────────────────────────────────────────────────
  nhomHang: {
    list:   ()       => req('/nhom-hang'),
    all:    ()       => req('/nhom-hang/all'),
    create: (body)   => req('/nhom-hang', { method: 'POST', body }),
    update: (id, b)  => req(`/nhom-hang/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/nhom-hang/${id}`, { method: 'DELETE' }),
  },

  // ── Nhà cung cấp ─────────────────────────────────────────────────────────
  nhaCungCap: {
    list:   ()       => req('/nha-cung-cap'),
    get:    (id)     => req(`/nha-cung-cap/${id}`),
    create: (body)   => req('/nha-cung-cap', { method: 'POST', body }),
    update: (id, b)  => req(`/nha-cung-cap/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/nha-cung-cap/${id}`, { method: 'DELETE' }),
  },

  // ── Tài khoản ────────────────────────────────────────────────────────────
  taiKhoan: {
    list:   ()       => req('/tai-khoan'),
    create: (body)   => req('/tai-khoan', { method: 'POST', body }),
    update: (id, b)  => req(`/tai-khoan/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/tai-khoan/${id}`, { method: 'DELETE' }),
    login:  (body)   => req('/tai-khoan/login', { method: 'POST', body }),
  },

  // ── Vật tư ───────────────────────────────────────────────────────────────
  vatTu: {
    list:   (p)      => req(`/vat-tu${p ? '?' + new URLSearchParams(p) : ''}`),
    get:    (id)     => req(`/vat-tu/${id}`),
    create: (body)   => req('/vat-tu', { method: 'POST', body }),
    update: (id, b)  => req(`/vat-tu/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/vat-tu/${id}`, { method: 'DELETE' }),
  },

  // ── Kho vật tư ───────────────────────────────────────────────────────────
  kho: {
    tonKho:      ()      => req('/kho-vat-tu/ton-kho'),
    giaoDich:    (p)     => req(`/kho-vat-tu/giao-dich${p ? '?' + new URLSearchParams(p) : ''}`),
    nhap:        (body)  => req('/kho-vat-tu/nhap',        { method: 'POST', body }),
    xuat:        (body)  => req('/kho-vat-tu/xuat',        { method: 'POST', body }),
    dieuChinh:   (body)  => req('/kho-vat-tu/dieu-chinh',  { method: 'POST', body }),
    xoaGD:       (id)    => req(`/kho-vat-tu/giao-dich/${id}`, { method: 'DELETE' }),
    // BOM
    bomList:     (khId)  => req(`/kho-vat-tu/don-hang/${khId}`),
    bomAdd:      (body)  => req('/kho-vat-tu/don-hang',    { method: 'POST', body }),
    bomUpdate:   (id, b) => req(`/kho-vat-tu/don-hang/${id}`, { method: 'PUT', body: b }),
    bomRemove:   (id)    => req(`/kho-vat-tu/don-hang/${id}`, { method: 'DELETE' }),
  },

  // ── Phát triển SP ────────────────────────────────────────────────────────
  phatTrien: {
    list:      (p)       => req(`/phat-trien-sp${p ? '?' + new URLSearchParams(p) : ''}`),
    get:       (id)      => req(`/phat-trien-sp/${id}`),
    create:    (body)    => req('/phat-trien-sp', { method: 'POST', body }),
    update:    (id, b)   => req(`/phat-trien-sp/${id}`, { method: 'PUT', body: b }),
    setStatus: (id, tt)  => req(`/phat-trien-sp/${id}/trang-thai`, { method: 'PATCH', body: { trangThai: tt } }),
    remove:    (id)      => req(`/phat-trien-sp/${id}`, { method: 'DELETE' }),
  },

  // ── Nhà máy ──────────────────────────────────────────────────────────────
  nhaMay: {
    list:   ()       => req('/nha-may'),
    get:    (id)     => req(`/nha-may/${id}`),
    create: (body)   => req('/nha-may', { method: 'POST', body }),
    update: (id, b)  => req(`/nha-may/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/nha-may/${id}`, { method: 'DELETE' }),
  },

  // ── Kế hoạch SX ──────────────────────────────────────────────────────────
  keHoach: {
    list:   (p)      => req(`/ke-hoach-sx${p ? '?' + new URLSearchParams(p) : ''}`),
    get:    (id)     => req(`/ke-hoach-sx/${id}`),
    create: (body)   => req('/ke-hoach-sx', { method: 'POST', body }),
    update: (id, b)  => req(`/ke-hoach-sx/${id}`, { method: 'PUT', body: b }),
    remove: (id)     => req(`/ke-hoach-sx/${id}`, { method: 'DELETE' }),
    risks: {
      create: (id, body)      => req(`/ke-hoach-sx/${id}/risks`, { method: 'POST', body }),
      update: (id, rId, body) => req(`/ke-hoach-sx/${id}/risks/${rId}`, { method: 'PATCH', body }),
      remove: (id, rId)       => req(`/ke-hoach-sx/${id}/risks/${rId}`, { method: 'DELETE' }),
    },
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    stats: () => req('/dashboard/stats'),
  },
}
