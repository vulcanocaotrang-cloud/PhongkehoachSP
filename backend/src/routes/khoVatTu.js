const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

// GET tất cả giao dịch (có filter)
router.get('/giao-dich', async (req, res) => {
  const { vatTuId, loai, tuNgay, denNgay } = req.query
  const list = await prisma.nhapXuatVatTu.findMany({
    where: {
      ...(vatTuId ? { vatTuId: Number(vatTuId) } : {}),
      ...(loai ? { loai } : {}),
      ...(tuNgay ? { ngayGiaoDich: { gte: tuNgay } } : {}),
      ...(denNgay ? { ngayGiaoDich: { lte: denNgay } } : {}),
    },
    include: {
      vatTu: { select: { ten: true, donViTinh: true, maVatTu: true } },
      nhaCungCap: { select: { ten: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(list)
})

// GET tồn kho tổng hợp
router.get('/ton-kho', async (_req, res) => {
  const list = await prisma.vatTu.findMany({
    where: { active: true },
    select: {
      id: true, ten: true, maVatTu: true, donViTinh: true,
      tonKho: true, tonToiThieu: true, donGia: true,
      nhaCungCap: { select: { ten: true } },
    },
    orderBy: { ten: 'asc' },
  })
  res.json(list.map((v) => ({
    ...v,
    trangThai: v.tonKho <= 0 ? 'HET' : v.tonKho <= v.tonToiThieu ? 'THIEU' : 'DU',
    giaTriTon: (v.tonKho || 0) * (v.donGia || 0),
  })))
})

// POST nhập kho
router.post('/nhap', async (req, res) => {
  const { vatTuId, nhaCungCapId, soLuong, donGia, soChungTu, lyDo, ngayGiaoDich, keHoachId, ghiChu } = req.body
  if (!vatTuId || !soLuong || soLuong <= 0)
    return res.status(400).json({ error: 'Thiếu vật tư hoặc số lượng không hợp lệ' })

  const [giaoDich] = await prisma.$transaction([
    prisma.nhapXuatVatTu.create({
      data: {
        vatTuId: Number(vatTuId),
        nhaCungCapId: nhaCungCapId ? Number(nhaCungCapId) : null,
        loai: 'NHAP',
        soLuong: Number(soLuong),
        donGia: donGia ? Number(donGia) : null,
        soChungTu, lyDo,
        ngayGiaoDich: ngayGiaoDich || new Date().toISOString().split('T')[0],
        keHoachId: keHoachId ? Number(keHoachId) : null,
        ghiChu,
      },
    }),
    prisma.vatTu.update({
      where: { id: Number(vatTuId) },
      data: { tonKho: { increment: Number(soLuong) } },
    }),
  ])
  res.status(201).json(giaoDich)
})

// POST xuất kho
router.post('/xuat', async (req, res) => {
  const { vatTuId, soLuong, lyDo, ngayGiaoDich, keHoachId, nhaMayId, ghiChu } = req.body
  if (!vatTuId || !soLuong || soLuong <= 0)
    return res.status(400).json({ error: 'Thiếu vật tư hoặc số lượng không hợp lệ' })

  const vatTu = await prisma.vatTu.findUnique({ where: { id: Number(vatTuId) } })
  if (!vatTu) return res.status(404).json({ error: 'Không tìm thấy vật tư' })
  if (vatTu.tonKho < Number(soLuong))
    return res.status(400).json({ error: `Tồn kho không đủ (hiện có: ${vatTu.tonKho} ${vatTu.donViTinh})` })

  const [giaoDich] = await prisma.$transaction([
    prisma.nhapXuatVatTu.create({
      data: {
        vatTuId:   Number(vatTuId),
        nhaMayId:  nhaMayId ? Number(nhaMayId) : null,
        loai:      'XUAT',
        soLuong:   Number(soLuong),
        lyDo,
        ngayGiaoDich: ngayGiaoDich || new Date().toISOString().split('T')[0],
        keHoachId: keHoachId ? Number(keHoachId) : null,
        ghiChu,
      },
    }),
    prisma.vatTu.update({
      where: { id: Number(vatTuId) },
      data: { tonKho: { decrement: Number(soLuong) } },
    }),
  ])
  res.status(201).json(giaoDich)
})

// POST điều chỉnh tồn kho
router.post('/dieu-chinh', async (req, res) => {
  const { vatTuId, tonKhoMoi, lyDo, ngayGiaoDich, ghiChu } = req.body
  if (!vatTuId || tonKhoMoi == null)
    return res.status(400).json({ error: 'Thiếu thông tin' })

  const vatTu = await prisma.vatTu.findUnique({ where: { id: Number(vatTuId) } })
  if (!vatTu) return res.status(404).json({ error: 'Không tìm thấy vật tư' })

  const chenh = Number(tonKhoMoi) - vatTu.tonKho

  const [giaoDich] = await prisma.$transaction([
    prisma.nhapXuatVatTu.create({
      data: {
        vatTuId: Number(vatTuId),
        loai: 'DIEU_CHINH',
        soLuong: Math.abs(chenh),
        lyDo: lyDo || `Điều chỉnh: ${vatTu.tonKho} → ${tonKhoMoi}`,
        ngayGiaoDich: ngayGiaoDich || new Date().toISOString().split('T')[0],
        ghiChu,
      },
    }),
    prisma.vatTu.update({
      where: { id: Number(vatTuId) },
      data: { tonKho: Number(tonKhoMoi) },
    }),
  ])
  res.status(201).json(giaoDich)
})

// DELETE giao dịch (chỉ DIEU_CHINH hoặc giao dịch gần nhất)
router.delete('/giao-dich/:id', async (req, res) => {
  const gd = await prisma.nhapXuatVatTu.findUnique({ where: { id: Number(req.params.id) } })
  if (!gd) return res.status(404).json({ error: 'Không tìm thấy giao dịch' })

  // Reverse the stock change
  const delta = gd.loai === 'NHAP' ? -gd.soLuong : gd.loai === 'XUAT' ? gd.soLuong : 0
  await prisma.$transaction([
    prisma.nhapXuatVatTu.delete({ where: { id: Number(req.params.id) } }),
    ...(delta !== 0 ? [prisma.vatTu.update({ where: { id: gd.vatTuId }, data: { tonKho: { increment: delta } } })] : []),
  ])
  res.status(204).send()
})

// ── Vật tư trong đơn hàng (BOM) ───────────────────────────────────────────
router.get('/don-hang/:keHoachId', async (req, res) => {
  const list = await prisma.vatTuDonHang.findMany({
    where: { keHoachId: Number(req.params.keHoachId) },
    include: { vatTu: { select: { ten: true, maVatTu: true, donViTinh: true, tonKho: true } } },
  })
  res.json(list)
})

router.post('/don-hang', async (req, res) => {
  const { keHoachId, vatTuId, soLuongCan, soLuongDat, soLuongNhan, ghiChu } = req.body
  if (!keHoachId || !vatTuId || soLuongCan == null)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })

  // Prevent duplicate
  const existing = await prisma.vatTuDonHang.findFirst({
    where: { keHoachId: Number(keHoachId), vatTuId: Number(vatTuId) },
  })
  if (existing) return res.status(409).json({ error: 'Vật tư này đã có trong đơn hàng' })

  const item = await prisma.vatTuDonHang.create({
    data: {
      keHoachId: Number(keHoachId),
      vatTuId: Number(vatTuId),
      soLuongCan: Number(soLuongCan),
      soLuongDat: Number(soLuongDat) || 0,
      soLuongNhan: Number(soLuongNhan) || 0,
      ghiChu,
    },
    include: { vatTu: { select: { ten: true, maVatTu: true, donViTinh: true, tonKho: true } } },
  })
  res.status(201).json(item)
})

router.put('/don-hang/:id', async (req, res) => {
  const { soLuongCan, soLuongDat, soLuongNhan, ghiChu } = req.body
  const item = await prisma.vatTuDonHang.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(soLuongCan != null && { soLuongCan: Number(soLuongCan) }),
      ...(soLuongDat != null && { soLuongDat: Number(soLuongDat) }),
      ...(soLuongNhan != null && { soLuongNhan: Number(soLuongNhan) }),
      ...(ghiChu !== undefined && { ghiChu }),
    },
    include: { vatTu: { select: { ten: true, maVatTu: true, donViTinh: true, tonKho: true } } },
  })
  res.json(item)
})

router.delete('/don-hang/:id', async (req, res) => {
  await prisma.vatTuDonHang.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
})

// ── KHSX Sizes ────────────────────────────────────────────────────────────
const SIZES_AO   = ['S', 'M', 'L', 'XL', 'XXL', '3XL']
const SIZES_QUAN = ['29', '30', '31', '32', '33', '34', '35', '36']

function detectLoaiSize(nhomHang) {
  const h = (nhomHang || '').toLowerCase()
  if (/quần|pant|jean|short|tây|denim|váy/.test(h)) return 'QUAN'
  return 'AO'
}

// GET sizes of a production plan
router.get('/sizes/:keHoachId', async (req, res) => {
  const sizes = await prisma.kHSXSize.findMany({
    where: { keHoachId: Number(req.params.keHoachId) },
    orderBy: { id: 'asc' },
  })
  res.json(sizes)
})

// POST init or replace all sizes for a production plan
router.post('/sizes/:keHoachId', async (req, res) => {
  const id = Number(req.params.keHoachId)
  const { loaiSize, sizes, nhomHang } = req.body

  const resolvedLoai = loaiSize || detectLoaiSize(nhomHang)
  const defaultSizes = resolvedLoai === 'QUAN' ? SIZES_QUAN : SIZES_AO

  // Build the sizes array
  const toCreate = (sizes && sizes.length
    ? sizes
    : defaultSizes.map((s) => ({ size: s, soLuong: 0 }))
  ).map((s) => ({ size: s.size, soLuong: Number(s.soLuong) || 0 }))

  // Delete existing and recreate
  await prisma.$transaction([
    prisma.kHSXSize.deleteMany({ where: { keHoachId: id } }),
    prisma.keHoachSanXuat.update({
      where: { id },
      data: {
        loaiSize: resolvedLoai,
        sizes: { create: toCreate },
      },
    }),
  ])

  const updated = await prisma.kHSXSize.findMany({ where: { keHoachId: id }, orderBy: { id: 'asc' } })
  res.json({ loaiSize: resolvedLoai, sizes: updated })
})

// PATCH update single size quantity
router.patch('/sizes/item/:id', async (req, res) => {
  const item = await prisma.kHSXSize.update({
    where: { id: Number(req.params.id) },
    data: { soLuong: Number(req.body.soLuong) || 0 },
  })
  res.json(item)
})

module.exports = router
