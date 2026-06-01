const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const { nhaCungCapId, lowStock } = req.query
  const list = await prisma.vatTu.findMany({
    where: {
      active: true,
      ...(nhaCungCapId ? { nhaCungCapId: Number(nhaCungCapId) } : {}),
    },
    include: {
      nhaCungCap: { select: { ten: true } },
      _count: { select: { chiTietDH: true } },
    },
    orderBy: { ten: 'asc' },
  })
  const result = lowStock === '1' ? list.filter((v) => v.tonKho <= v.tonToiThieu) : list
  res.json(result)
})

router.get('/:id', async (req, res) => {
  const item = await prisma.vatTu.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      nhaCungCap: true,
      nhapXuats: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy vật tư' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const { ten, maVatTu, donViTinh, nhaCungCapId, donGia, tonKho, tonToiThieu, ghiChu } = req.body
  if (!ten?.trim() || !donViTinh?.trim())
    return res.status(400).json({ error: 'Tên và đơn vị tính không được trống' })
  try {
    const item = await prisma.vatTu.create({
      data: {
        ten: ten.trim(),
        maVatTu: maVatTu?.trim() || null,
        donViTinh: donViTinh.trim(),
        nhaCungCapId: nhaCungCapId ? Number(nhaCungCapId) : null,
        donGia: donGia != null ? Number(donGia) : null,
        tonKho: Number(tonKho) || 0,
        tonToiThieu: Number(tonToiThieu) || 0,
        ghiChu,
      },
      include: { nhaCungCap: { select: { ten: true } } },
    })
    res.status(201).json(item)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Mã vật tư đã tồn tại' })
    throw e
  }
})

router.put('/:id', async (req, res) => {
  const { ten, maVatTu, donViTinh, nhaCungCapId, donGia, tonToiThieu, ghiChu, active } = req.body
  try {
    const item = await prisma.vatTu.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(ten !== undefined && { ten: ten.trim() }),
        ...(maVatTu !== undefined && { maVatTu: maVatTu?.trim() || null }),
        ...(donViTinh !== undefined && { donViTinh }),
        ...(nhaCungCapId !== undefined && { nhaCungCapId: nhaCungCapId ? Number(nhaCungCapId) : null }),
        ...(donGia != null && { donGia: Number(donGia) }),
        ...(tonToiThieu != null && { tonToiThieu: Number(tonToiThieu) }),
        ...(ghiChu !== undefined && { ghiChu }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
      include: { nhaCungCap: { select: { ten: true } } },
    })
    res.json(item)
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
    if (e.code === 'P2003') return res.status(409).json({ error: 'Vật tư đang được sử dụng trong đơn hàng/kho' })
    throw e
  }
})

module.exports = router
