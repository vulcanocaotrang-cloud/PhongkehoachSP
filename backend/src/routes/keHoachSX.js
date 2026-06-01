const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

const DEFAULT_PRODUCTION_PHASES = [
  { soThuTu: 1, tenGiaiDoan: 'Nhận sản phẩm từ PTSP' },
  { soThuTu: 2, tenGiaiDoan: 'Lập kế hoạch chi tiết' },
  { soThuTu: 3, tenGiaiDoan: 'Cân đối NPL' },
  { soThuTu: 4, tenGiaiDoan: 'Bàn giao gia công' },
  { soThuTu: 5, tenGiaiDoan: 'Theo dõi tiến độ SX' },
  { soThuTu: 6, tenGiaiDoan: 'Xử lý rủi ro phát sinh' },
  { soThuTu: 7, tenGiaiDoan: 'Nhập kho thành phẩm' },
]

// GET all
router.get('/', async (req, res) => {
  const { trangThai, nhaMayId } = req.query
  const list = await prisma.keHoachSanXuat.findMany({
    where: {
      ...(trangThai ? { trangThai } : {}),
      ...(nhaMayId ? { nhaMayId: Number(nhaMayId) } : {}),
    },
    include: {
      sanPham: {
        include: {
          bst: { select: { ten: true, nam: true, mua: true } },
          sizes: true,
        },
      },
      nhaMay: { select: { ten: true, congSuat: true } },
      phases: { orderBy: { soThuTu: 'asc' } },
      risks: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(list)
})

// GET one
router.get('/:id', async (req, res) => {
  const item = await prisma.keHoachSanXuat.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      sanPham: { include: { bst: true, sizes: true, phases: { orderBy: { soThuTu: 'asc' } } } },
      nhaMay: true,
      phases: { orderBy: { soThuTu: 'asc' } },
      risks: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy kế hoạch' })
  res.json(item)
})

// POST create từ sản phẩm đã chốt
router.post('/', async (req, res) => {
  const { sanPhamId, nhaMayId, ghiChu } = req.body
  if (!sanPhamId) return res.status(400).json({ error: 'Cần chọn sản phẩm' })

  // Verify product is DA_CHOT
  const sp = await prisma.phatTrienSanPham.findUnique({ where: { id: Number(sanPhamId) } })
  if (!sp) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  if (sp.trangThai !== 'DA_CHOT') return res.status(400).json({ error: 'Chỉ nhận sản phẩm đã chốt' })
  if (sp.keHoach) return res.status(409).json({ error: 'Sản phẩm đã có kế hoạch sản xuất' })

  const item = await prisma.keHoachSanXuat.create({
    data: {
      sanPhamId: Number(sanPhamId),
      nhaMayId: nhaMayId ? Number(nhaMayId) : null,
      ghiChu,
      trangThai: 'NHAN_SP',
      phases: { create: DEFAULT_PRODUCTION_PHASES },
    },
    include: {
      sanPham: { include: { bst: { select: { ten: true } }, sizes: true } },
      nhaMay: { select: { ten: true } },
      phases: { orderBy: { soThuTu: 'asc' } },
      risks: true,
    },
  })
  res.status(201).json(item)
})

// PUT update kế hoạch
router.put('/:id', async (req, res) => {
  const { nhaMayId, trangThai, phanTramHoanThanh, ngayGiaoCho, ngayNhapKho, ghiChu, soLuongThucTe, phases } = req.body
  try {
    await prisma.keHoachSanXuat.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(nhaMayId !== undefined && { nhaMayId: nhaMayId ? Number(nhaMayId) : null }),
        ...(trangThai !== undefined && { trangThai }),
        ...(phanTramHoanThanh != null && { phanTramHoanThanh: Number(phanTramHoanThanh) }),
        ...(ngayGiaoCho !== undefined && { ngayGiaoCho }),
        ...(ngayNhapKho !== undefined && { ngayNhapKho }),
        ...(ghiChu !== undefined && { ghiChu }),
        ...(soLuongThucTe != null && { soLuongThucTe: Number(soLuongThucTe) }),
      },
    })

    // Update phases
    if (phases && phases.length) {
      for (const p of phases) {
        if (p.id) {
          await prisma.productionPhase.update({
            where: { id: p.id },
            data: {
              ngayBatDau: p.ngayBatDau || null,
              ngayKetThuc: p.ngayKetThuc || null,
              hoanThanh: Boolean(p.hoanThanh),
              ghiChu: p.ghiChu || null,
            },
          })
        }
      }
    }

    const updated = await prisma.keHoachSanXuat.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sanPham: { include: { bst: { select: { ten: true } }, sizes: true } },
        nhaMay: { select: { ten: true } },
        phases: { orderBy: { soThuTu: 'asc' } },
        risks: { orderBy: { createdAt: 'desc' } },
      },
    })
    res.json(updated)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.keHoachSanXuat.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

// ── Risk Logs ─────────────────────────────────────────────────────────────
router.post('/:id/risks', async (req, res) => {
  const { moTa, phuongAn, ngayPhatSinh } = req.body
  if (!moTa) return res.status(400).json({ error: 'Cần mô tả rủi ro' })
  const item = await prisma.riskLog.create({
    data: {
      keHoachId: Number(req.params.id),
      moTa,
      phuongAn,
      ngayPhatSinh: ngayPhatSinh || new Date().toISOString().split('T')[0],
    },
  })
  res.status(201).json(item)
})

router.patch('/:id/risks/:riskId', async (req, res) => {
  const { phuongAn, daXuLy } = req.body
  const item = await prisma.riskLog.update({
    where: { id: Number(req.params.riskId) },
    data: {
      ...(phuongAn !== undefined && { phuongAn }),
      ...(daXuLy !== undefined && { daXuLy: Boolean(daXuLy) }),
    },
  })
  res.json(item)
})

router.delete('/:id/risks/:riskId', async (req, res) => {
  await prisma.riskLog.delete({ where: { id: Number(req.params.riskId) } })
  res.status(204).send()
})

module.exports = router
