const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const router = Router()
const prisma = new PrismaClient()

router.get('/stats', async (_req, res) => {
  const [bstList, targets, sanPhams, keHoachs, nhaMays] = await Promise.all([
    prisma.bSTCollection.findMany({
      include: {
        sanPhams: { include: { keHoach: { select: { phanTramHoanThanh: true } } } },
        targets: { select: { soLuongTarget: true } },
      },
    }),
    prisma.targetBST.findMany(),
    prisma.phatTrienSanPham.findMany({ include: { sizes: true, keHoach: true } }),
    prisma.keHoachSanXuat.findMany({
      include: {
        sanPham: { include: { bst: { select: { ten: true } }, sizes: true } },
        nhaMay: { select: { ten: true } },
        phases: true,
        risks: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.nhaMay.findMany({
      include: { _count: { select: { keHoachs: true } } },
    }),
  ])

  // BST progress
  const bstProgress = bstList.map((bst) => {
    const total = bst.sanPhams.length
    const done = bst.sanPhams.filter((sp) => sp.trangThai === 'DA_CHOT').length
    const cancelled = bst.sanPhams.filter((sp) => sp.trangThai === 'HUY').length
    const avgSXProgress =
      bst.sanPhams
        .filter((sp) => sp.keHoach)
        .reduce((acc, sp) => acc + (sp.keHoach?.phanTramHoanThanh || 0), 0) /
        Math.max(bst.sanPhams.filter((sp) => sp.keHoach).length, 1)

    return {
      id: bst.id,
      ten: bst.ten,
      nam: bst.nam,
      mua: bst.mua,
      totalSP: total,
      daChotSP: done,
      huySP: cancelled,
      tiLePhatTrien: total ? Math.round((done / total) * 100) : 0,
      avgSXProgress: Math.round(avgSXProgress),
      totalTarget: bst.targets.reduce((s, t) => s + t.soLuongTarget, 0),
    }
  })

  // Target vs thực tế
  const targetVsThucTe = sanPhams
    .filter((sp) => sp.keHoach)
    .map((sp) => ({
      ten: sp.tenSanPham,
      nhomHang: sp.nhomHang,
      soLuongTarget: sp.sizes.reduce((s, sz) => s + sz.soLuong, 0),
      soLuongThucTe: sp.keHoach?.soLuongThucTe || 0,
    }))

  // Đơn hàng đang sản xuất
  const donHangDangSX = keHoachs.filter((kh) => kh.trangThai !== 'NHAP_KHO')

  // Cảnh báo trễ tiến độ (pha nào có ngayKetThuc < hôm nay mà chưa hoàn thành)
  const today = new Date().toISOString().split('T')[0]
  const canhBaoTre = keHoachs
    .filter((kh) => kh.trangThai !== 'NHAP_KHO')
    .filter((kh) =>
      kh.phases.some(
        (p) => !p.hoanThanh && p.ngayKetThuc && p.ngayKetThuc < today
      )
    )
    .map((kh) => ({
      id: kh.id,
      tenSanPham: kh.sanPham.tenSanPham,
      bst: kh.sanPham.bst.ten,
      nhaMay: kh.nhaMay?.ten || 'Chưa giao',
      trangThai: kh.trangThai,
      phanTramHoanThanh: kh.phanTramHoanThanh,
      phaseTre: kh.phases
        .filter((p) => !p.hoanThanh && p.ngayKetThuc && p.ngayKetThuc < today)
        .map((p) => p.tenGiaiDoan),
    }))

  // Thống kê nhập kho theo tháng (6 tháng gần nhất)
  const nhapKhoStats = {}
  const nhapKhoDone = keHoachs.filter((kh) => kh.trangThai === 'NHAP_KHO' && kh.ngayNhapKho)
  for (const kh of nhapKhoDone) {
    const month = kh.ngayNhapKho.slice(0, 7) // "YYYY-MM"
    if (!nhapKhoStats[month]) nhapKhoStats[month] = { month, count: 0, tongSP: 0 }
    nhapKhoStats[month].count++
    nhapKhoStats[month].tongSP += kh.soLuongThucTe || 0
  }
  const nhapKhoByMonth = Object.values(nhapKhoStats).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  // Tổng quan
  const tongQuan = {
    tongBST: bstList.length,
    tongSP: sanPhams.length,
    dangPhatTrien: sanPhams.filter((sp) => sp.trangThai === 'DANG_PHAT_TRIEN').length,
    daChot: sanPhams.filter((sp) => sp.trangThai === 'DA_CHOT').length,
    huy: sanPhams.filter((sp) => sp.trangThai === 'HUY').length,
    dangSanXuat: keHoachs.filter((kh) => kh.trangThai !== 'NHAP_KHO').length,
    daHoanThanh: keHoachs.filter((kh) => kh.trangThai === 'NHAP_KHO').length,
    tongNhaMay: nhaMays.length,
    canhBaoTre: canhBaoTre.length,
  }

  res.json({
    tongQuan,
    bstProgress,
    targetVsThucTe,
    donHangDangSX,
    canhBaoTre,
    nhapKhoByMonth,
  })
})

module.exports = router
