const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (_req, res) => {
  const list = await prisma.nhaMay.findMany({
    include: {
      _count: { select: { keHoachs: true } },
      keHoachs: {
        where: { trangThai: { not: 'NHAP_KHO' } },
        include: {
          sanPham: { select: { tenSanPham: true, nhomHang: true } },
        },
      },
    },
    orderBy: { ten: 'asc' },
  })
  res.json(list)
})

router.get('/:id', async (req, res) => {
  const item = await prisma.nhaMay.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      keHoachs: {
        include: {
          sanPham: { select: { tenSanPham: true, nhomHang: true, bst: { select: { ten: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy nhà máy' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const { ten, diaChi, congSuat, ghiChu } = req.body
  if (!ten || congSuat == null) return res.status(400).json({ error: 'Thiếu tên hoặc công suất' })
  const item = await prisma.nhaMay.create({
    data: { ten, diaChi, congSuat: Number(congSuat), ghiChu },
  })
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const { ten, diaChi, congSuat, ghiChu } = req.body
  try {
    const item = await prisma.nhaMay.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(ten !== undefined && { ten }),
        ...(diaChi !== undefined && { diaChi }),
        ...(congSuat != null && { congSuat: Number(congSuat) }),
        ...(ghiChu !== undefined && { ghiChu }),
      },
    })
    res.json(item)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.nhaMay.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

module.exports = router
