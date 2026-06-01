const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (_req, res) => {
  const list = await prisma.nhaCungCap.findMany({
    include: { _count: { select: { vatTus: true } } },
    orderBy: { ten: 'asc' },
  })
  res.json(list)
})

router.get('/:id', async (req, res) => {
  const item = await prisma.nhaCungCap.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      vatTus: { orderBy: { ten: 'asc' } },
      _count: { select: { nhapXuats: true } },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const { ten, maSo, diaChi, sdt, email, nguoiLienHe, ghiChu } = req.body
  if (!ten?.trim()) return res.status(400).json({ error: 'Tên nhà cung cấp không được trống' })
  const item = await prisma.nhaCungCap.create({
    data: { ten: ten.trim(), maSo, diaChi, sdt, email, nguoiLienHe, ghiChu },
  })
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const { ten, maSo, diaChi, sdt, email, nguoiLienHe, ghiChu, active } = req.body
  try {
    const item = await prisma.nhaCungCap.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(ten !== undefined && { ten: ten.trim() }),
        ...(maSo !== undefined && { maSo }),
        ...(diaChi !== undefined && { diaChi }),
        ...(sdt !== undefined && { sdt }),
        ...(email !== undefined && { email }),
        ...(nguoiLienHe !== undefined && { nguoiLienHe }),
        ...(ghiChu !== undefined && { ghiChu }),
        ...(active !== undefined && { active: Boolean(active) }),
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
    await prisma.nhaCungCap.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    if (e.code === 'P2003') return res.status(409).json({ error: 'NCC đang có vật tư/giao dịch liên kết' })
    throw e
  }
})

module.exports = router
