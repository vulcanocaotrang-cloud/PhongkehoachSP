const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const router = Router()
const prisma = new PrismaClient()

const VAI_TRO = ['ADMIN', 'QUAN_LY_SP', 'QUAN_LY_SX']
const VAI_TRO_LABEL = { ADMIN: 'Quản trị viên', QUAN_LY_SP: 'Quản lý sản phẩm', QUAN_LY_SX: 'Quản lý sản xuất' }

router.get('/', async (_req, res) => {
  const list = await prisma.taiKhoan.findMany({
    select: { id: true, tenDangNhap: true, hoTen: true, email: true, vaiTro: true, active: true, createdAt: true },
    orderBy: { hoTen: 'asc' },
  })
  res.json(list)
})

router.post('/', async (req, res) => {
  const { tenDangNhap, matKhau, hoTen, email, vaiTro } = req.body
  if (!tenDangNhap?.trim() || !matKhau || !hoTen?.trim())
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (tên đăng nhập, mật khẩu, họ tên)' })
  if (!VAI_TRO.includes(vaiTro))
    return res.status(400).json({ error: `Vai trò không hợp lệ. Chọn: ${VAI_TRO.join(', ')}` })
  if (matKhau.length < 6)
    return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' })

  try {
    const hash = await bcrypt.hash(matKhau, 10)
    const item = await prisma.taiKhoan.create({
      data: { tenDangNhap: tenDangNhap.trim(), matKhau: hash, hoTen: hoTen.trim(), email, vaiTro: vaiTro || 'QUAN_LY_SP' },
      select: { id: true, tenDangNhap: true, hoTen: true, email: true, vaiTro: true, active: true, createdAt: true },
    })
    res.status(201).json(item)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' })
    throw e
  }
})

router.put('/:id', async (req, res) => {
  const { hoTen, email, vaiTro, active, matKhauMoi } = req.body
  try {
    const data = {
      ...(hoTen !== undefined && { hoTen: hoTen.trim() }),
      ...(email !== undefined && { email }),
      ...(vaiTro !== undefined && { vaiTro }),
      ...(active !== undefined && { active: Boolean(active) }),
    }
    if (matKhauMoi) {
      if (matKhauMoi.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' })
      data.matKhau = await bcrypt.hash(matKhauMoi, 10)
    }
    const item = await prisma.taiKhoan.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, tenDangNhap: true, hoTen: true, email: true, vaiTro: true, active: true, createdAt: true },
    })
    res.json(item)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy tài khoản' })
    throw e
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.taiKhoan.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' })
    throw e
  }
})

// Simple login endpoint (no JWT – returns account info for frontend storage)
router.post('/login', async (req, res) => {
  const { tenDangNhap, matKhau } = req.body
  if (!tenDangNhap || !matKhau) return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' })
  const tk = await prisma.taiKhoan.findUnique({ where: { tenDangNhap } })
  if (!tk || !tk.active) return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' })
  const ok = await bcrypt.compare(matKhau, tk.matKhau)
  if (!ok) return res.status(401).json({ error: 'Sai mật khẩu' })
  res.json({ id: tk.id, tenDangNhap: tk.tenDangNhap, hoTen: tk.hoTen, vaiTro: tk.vaiTro })
})

module.exports = router
