const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (_req, res) => {
  const list = await prisma.nhomHang.findMany({
    where: { active: true },
    include: { _count: { select: { sanPhams: true } } },
    orderBy: { ten: 'asc' },
  })
  res.json(list)
})

router.get('/all', async (_req, res) => {
  const list = await prisma.nhomHang.findMany({ orderBy: { ten: 'asc' } })
  res.json(list)
})

router.post('/', async (req, res) => {
  const { ten, moTa } = req.body
  if (!ten?.trim()) return res.status(400).json({ error: 'Tên nhóm hàng không được trống' })
  const item = await prisma.nhomHang.create({ data: { ten: ten.trim(), moTa } })
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const { ten, moTa, active } = req.body
  try {
    const item = await prisma.nhomHang.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(ten !== undefined && { ten: ten.trim() }),
        ...(moTa !== undefined && { moTa }),
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
    await prisma.nhomHang.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    if (e.code === 'P2003') return res.status(409).json({ error: 'Nhóm hàng đang được sử dụng, không thể xoá' })
    throw e
  }
})

module.exports = router
