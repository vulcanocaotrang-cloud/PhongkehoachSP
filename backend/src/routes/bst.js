const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

// GET all BST
router.get('/', async (_req, res) => {
  const list = await prisma.bSTCollection.findMany({
    orderBy: [{ nam: 'desc' }, { ten: 'asc' }],
    include: {
      _count: { select: { targets: true, sanPhams: true } },
      mauSacs: true,
    },
  })
  res.json(list)
})

// GET one BST with full details
router.get('/:id', async (req, res) => {
  const item = await prisma.bSTCollection.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      targets: true,
      mauSacs: true,
      sanPhams: { include: { phases: true, sizes: true } },
    },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy BST' })
  res.json(item)
})

// POST create
router.post('/', async (req, res) => {
  const { ten, nam, mua, mauSacs } = req.body
  if (!ten || !nam || !mua) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
  const item = await prisma.bSTCollection.create({
    data: {
      ten,
      nam: Number(nam),
      mua,
      mauSacs: mauSacs?.length
        ? { create: mauSacs.map((m) => ({ tenMau: m.tenMau, maHex: m.maHex })) }
        : undefined,
    },
    include: { mauSacs: true },
  })
  res.status(201).json(item)
})

// PUT update
router.put('/:id', async (req, res) => {
  const { ten, nam, mua } = req.body
  try {
    const item = await prisma.bSTCollection.update({
      where: { id: Number(req.params.id) },
      data: { ten, nam: nam ? Number(nam) : undefined, mua },
    })
    res.json(item)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy BST' })
    throw e
  }
})

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await prisma.bSTCollection.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy BST' })
    throw e
  }
})

// ── Màu sắc ──────────────────────────────────────────────────────────────
// GET màu sắc của BST
router.get('/:id/mau-sac', async (req, res) => {
  const list = await prisma.mauSac.findMany({ where: { bstId: Number(req.params.id) } })
  res.json(list)
})

// POST thêm màu
router.post('/:id/mau-sac', async (req, res) => {
  const { tenMau, maHex } = req.body
  const item = await prisma.mauSac.create({
    data: { bstId: Number(req.params.id), tenMau, maHex },
  })
  res.status(201).json(item)
})

// DELETE màu
router.delete('/:id/mau-sac/:mauId', async (req, res) => {
  await prisma.mauSac.delete({ where: { id: Number(req.params.mauId) } })
  res.status(204).send()
})

module.exports = router
