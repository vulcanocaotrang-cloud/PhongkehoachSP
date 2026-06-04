const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const { nhaCungCapId, nhomHangId, lowStock } = req.query
  const list = await prisma.vatTu.findMany({
    where: {
      active: true,
      ...(nhaCungCapId ? { nhaCungCapId: Number(nhaCungCapId) } : {}),
      ...(nhomHangId   ? { nhomHangId:   Number(nhomHangId)   } : {}),
    },
    include: {
      nhaCungCap:  { select: { ten: true } },
      nhomHangRef: { select: { ten: true } },
      _count: { select: { chiTietDH: true } },
    },
    orderBy: { ten: 'asc' },
  })
  // Exclude heavy hinhAnh from list view — send thumbnail flag instead
  const result = list.map((v) => ({ ...v, hasImage: !!v.hinhAnh, hinhAnh: undefined }))
  const filtered = lowStock === '1' ? result.filter((v) => v.tonKho <= v.tonToiThieu) : result
  res.json(filtered)
})

// GET one — includes full hinhAnh
router.get('/:id', async (req, res) => {
  const item = await prisma.vatTu.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      nhaCungCap:  true,
      nhomHangRef: { select: { id: true, ten: true } },
      nhapXuats: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy vật tư' })
  res.json(item)
})

// GET image only
router.get('/:id/hinh-anh', async (req, res) => {
  const item = await prisma.vatTu.findUnique({
    where: { id: Number(req.params.id) },
    select: { hinhAnh: true },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' })
  res.json({ hinhAnh: item.hinhAnh || null })
})

router.post('/', async (req, res) => {
  const { ten, maVatTu, donViTinh, nhaCungCapId, nhomHangId, donGia, tonKho, tonToiThieu, hinhAnh, ghiChu } = req.body
  if (!ten?.trim() || !donViTinh?.trim())
    return res.status(400).json({ error: 'Tên và đơn vị tính không được trống' })
  try {
    const item = await prisma.vatTu.create({
      data: {
        ten: ten.trim(),
        maVatTu:     maVatTu?.trim() || null,
        donViTinh:   donViTinh.trim(),
        nhaCungCapId: nhaCungCapId ? Number(nhaCungCapId) : null,
        nhomHangId:   nhomHangId   ? Number(nhomHangId)   : null,
        donGia:      donGia != null ? Number(donGia) : null,
        tonKho:      Number(tonKho)       || 0,
        tonToiThieu: Number(tonToiThieu)  || 0,
        hinhAnh:     hinhAnh || null,
        ghiChu,
      },
      include: {
        nhaCungCap:  { select: { ten: true } },
        nhomHangRef: { select: { ten: true } },
      },
    })
    res.status(201).json({ ...item, hasImage: !!item.hinhAnh, hinhAnh: undefined })
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Mã vật tư đã tồn tại' })
    throw e
  }
})

router.put('/:id', async (req, res) => {
  const { ten, maVatTu, donViTinh, nhaCungCapId, nhomHangId, donGia,
          tonKho, lyDoCapNhat, tonToiThieu, hinhAnh, ghiChu, active } = req.body
  try {
    // Nếu tonKho được cung cấp, kiểm tra xem có thay đổi không → tạo phiếu điều chỉnh
    let dieuChinhTonKho = null
    if (tonKho !== undefined && tonKho !== null) {
      const current = await prisma.vatTu.findUnique({ where: { id: Number(req.params.id) }, select: { tonKho: true } })
      const tonKhoMoi = Number(tonKho)
      if (current && Math.abs(current.tonKho - tonKhoMoi) > 0.0001) {
        dieuChinhTonKho = { old: current.tonKho, new: tonKhoMoi }
      }
    }

    const item = await prisma.vatTu.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(ten       !== undefined && { ten: ten.trim() }),
        ...(maVatTu   !== undefined && { maVatTu: maVatTu?.trim() || null }),
        ...(donViTinh !== undefined && { donViTinh }),
        ...(nhaCungCapId !== undefined && { nhaCungCapId: nhaCungCapId ? Number(nhaCungCapId) : null }),
        ...(nhomHangId   !== undefined && { nhomHangId:   nhomHangId   ? Number(nhomHangId)   : null }),
        ...(donGia    != null && { donGia: Number(donGia) }),
        // Cập nhật tonKho trực tiếp nếu được cung cấp
        ...(tonKho !== undefined && tonKho !== null && { tonKho: Number(tonKho) }),
        ...(tonToiThieu != null && { tonToiThieu: Number(tonToiThieu) }),
        ...(hinhAnh   !== undefined && { hinhAnh: hinhAnh || null }),
        ...(ghiChu    !== undefined && { ghiChu }),
        ...(active    !== undefined && { active: Boolean(active) }),
      },
      include: {
        nhaCungCap:  { select: { ten: true } },
        nhomHangRef: { select: { ten: true } },
      },
    })

    // Ghi log điều chỉnh tồn kho nếu có thay đổi
    if (dieuChinhTonKho) {
      await prisma.nhapXuatVatTu.create({
        data: {
          vatTuId:      item.id,
          loai:         'DIEU_CHINH',
          soLuong:      Math.abs(dieuChinhTonKho.new - dieuChinhTonKho.old),
          lyDo:         lyDoCapNhat || `Cập nhật tồn đầu: ${dieuChinhTonKho.old} → ${dieuChinhTonKho.new}`,
          ngayGiaoDich: new Date().toISOString().split('T')[0],
          ghiChu:       `Điều chỉnh qua form danh mục vật tư`,
        },
      })
    }

    res.json({
      ...item,
      hasImage: !!item.hinhAnh,
      hinhAnh: undefined,
      _dieuChinh: dieuChinhTonKho,   // trả về để frontend biết có điều chỉnh
    })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    if (e.code === 'P2002') return res.status(409).json({ error: 'Mã vật tư đã tồn tại' })
    throw e
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.vatTu.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    if (e.code === 'P2003') return res.status(409).json({ error: 'Vật tư đang được sử dụng' })
    throw e
  }
})

module.exports = router
