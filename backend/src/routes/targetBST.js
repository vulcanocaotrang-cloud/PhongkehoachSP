const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const { bstId } = req.query
  const list = await prisma.targetBST.findMany({
    where: bstId ? { bstId: Number(bstId) } : undefined,
    include: { bst: { select: { ten: true, nam: true, mua: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(
    list.map((t) => ({
      ...t,
      doanhThuTarget: t.soLuongTarget * t.donGiaDuKien,
    }))
  )
})

router.get('/:id', async (req, res) => {
  const item = await prisma.targetBST.findUnique({
    where: { id: Number(req.params.id) },
    include: { bst: true },
  })
  if (!item) return res.status(404).json({ error: 'Không tìm thấy Target BST' })
  res.json({ ...item, doanhThuTarget: item.soLuongTarget * item.donGiaDuKien })
})

router.post('/', async (req, res) => {
  const { bstId, khachHangMucTieu, nhuCauSuDung, nhomHang, soLuongTarget, donGiaDuKien } = req.body
  if (!bstId || !nhomHang || soLuongTarget == null || donGiaDuKien == null)
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
  const item = await prisma.targetBST.create({
    data: {
      bstId: Number(bstId),
      khachHangMucTieu,
      nhuCauSuDung,
      nhomHang,
      soLuongTarget: Number(soLuongTarget),
      donGiaDuKien: Number(donGiaDuKien),
    },
    include: { bst: { select: { ten: true, nam: true, mua: true } } },
  })
  res.status(201).json({ ...item, doanhThuTarget: item.soLuongTarget * item.donGiaDuKien })
})

router.put('/:id', async (req, res) => {
  const { khachHangMucTieu, nhuCauSuDung, nhomHang, soLuongTarget, donGiaDuKien } = req.body
  try {
    const item = await prisma.targetBST.update({
      where: { id: Number(req.params.id) },
      data: {
        khachHangMucTieu,
        nhuCauSuDung,
        nhomHang,
        soLuongTarget: soLuongTarget != null ? Number(soLuongTarget) : undefined,
        donGiaDuKien: donGiaDuKien != null ? Number(donGiaDuKien) : undefined,
      },
    })
    res.json({ ...item, doanhThuTarget: item.soLuongTarget * item.donGiaDuKien })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.targetBST.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

module.exports = router
