const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

const DEFAULT_PHASES = [
  { soThuTu: 1, tenGiaiDoan: 'Dựng ý tưởng' },
  { soThuTu: 2, tenGiaiDoan: 'Lên mẫu' },
  { soThuTu: 3, tenGiaiDoan: 'Fit mẫu' },
  { soThuTu: 4, tenGiaiDoan: 'Chốt mẫu' },
  { soThuTu: 5, tenGiaiDoan: 'Order NPL' },
]

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL']

// GET all
router.get('/', async (req, res) => {
  const { bstId, trangThai } = req.query
  const list = await prisma.phatTrienSanPham.findMany({
    where: {
      ...(bstId ? { bstId: Number(bstId) } : {}),
      ...(trangThai ? { trangThai } : {}),
    },
    include: {
      bst: { select: { ten: true, nam: true, mua: true } },
      target: { select: { nhomHang: true, khachHangMucTieu: true } },
      phases: { orderBy: { soThuTu: 'asc' } },
      sizes: true,
      keHoach: { select: { id: true, trangThai: true, phanTramHoanThanh: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(list)
})

// GET one
router.get('/:id', async (req, res) => {
  const item = await prisma.phatTrienSanPham.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      bst: true,
      target: true,
      phases: { orderBy: { soThuTu: 'asc' } },
      sizes: { orderBy: { size: 'asc' } },
      keHoach: true,
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  res.json(item)
})

// POST create
router.post('/', async (req, res) => {
  const { bstId, targetId, nhomHangId, tenSanPham, nhomHang, formDang, ghiChu, phases, sizes } = req.body
  if (!bstId || !tenSanPham || !nhomHang || !formDang)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })

  const phasesToCreate = (phases && phases.length ? phases : DEFAULT_PHASES).map((p) => ({
    soThuTu: p.soThuTu,
    tenGiaiDoan: p.tenGiaiDoan,
    ngayBatDau: p.ngayBatDau || null,
    ngayKetThuc: p.ngayKetThuc || null,
    ghiChu: p.ghiChu || null,
    hoanThanh: p.hoanThanh || false,
  }))

  const sizesToCreate = (sizes && sizes.length ? sizes : DEFAULT_SIZES.map((s) => ({ size: s, soLuong: 0 }))).map(
    (s) => ({ size: s.size, soLuong: Number(s.soLuong) || 0 })
  )

  const item = await prisma.phatTrienSanPham.create({
    data: {
      bstId: Number(bstId),
      targetId: targetId ? Number(targetId) : null,
      nhomHangId: nhomHangId ? Number(nhomHangId) : null,
      tenSanPham,
      nhomHang,
      formDang,
      ghiChu,
      phases: { create: phasesToCreate },
      sizes: { create: sizesToCreate },
    },
    include: {
      bst: { select: { ten: true, nam: true, mua: true } },
      phases: { orderBy: { soThuTu: 'asc' } },
      sizes: true,
    },
  })
  res.status(201).json(item)
})

// PUT update main info
router.put('/:id', async (req, res) => {
  const { tenSanPham, nhomHang, formDang, ghiChu, trangThai, phases, sizes } = req.body
  try {
    // Update main record
    const item = await prisma.phatTrienSanPham.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(tenSanPham !== undefined && { tenSanPham }),
        ...(nhomHang !== undefined && { nhomHang }),
        ...(formDang !== undefined && { formDang }),
        ...(ghiChu !== undefined && { ghiChu }),
        ...(trangThai !== undefined && { trangThai }),
      },
    })

    // Update phases if provided
    if (phases && phases.length) {
      for (const p of phases) {
        if (p.id) {
          await prisma.developmentPhase.update({
            where: { id: p.id },
            data: {
              ngayBatDau: p.ngayBatDau || null,
              ngayKetThuc: p.ngayKetThuc || null,
              ghiChu: p.ghiChu || null,
              hoanThanh: p.hoanThanh || false,
            },
          })
        }
      }
    }

    // Update sizes if provided
    if (sizes && sizes.length) {
      for (const s of sizes) {
        if (s.id) {
          await prisma.sizeQuantity.update({
            where: { id: s.id },
            data: { soLuong: Number(s.soLuong) || 0 },
          })
        }
      }
    }

    const updated = await prisma.phatTrienSanPham.findUnique({
      where: { id: item.id },
      include: {
        bst: { select: { ten: true, nam: true, mua: true } },
        phases: { orderBy: { soThuTu: 'asc' } },
        sizes: true,
      },
    })
    res.json(updated)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

// PATCH trạng thái nhanh
router.patch('/:id/trang-thai', async (req, res) => {
  const { trangThai } = req.body
  const valid = ['DANG_PHAT_TRIEN', 'DA_CHOT', 'HUY']
  if (!valid.includes(trangThai)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' })
  const item = await prisma.phatTrienSanPham.update({
    where: { id: Number(req.params.id) },
    data: { trangThai },
  })
  res.json(item)
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.phatTrienSanPham.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

module.exports = router
