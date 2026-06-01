-- CreateTable
CREATE TABLE "BSTCollection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "nam" INTEGER NOT NULL,
    "mua" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TargetBST" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bstId" INTEGER NOT NULL,
    "khachHangMucTieu" TEXT NOT NULL,
    "nhuCauSuDung" TEXT NOT NULL,
    "nhomHang" TEXT NOT NULL,
    "soLuongTarget" INTEGER NOT NULL,
    "donGiaDuKien" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetBST_bstId_fkey" FOREIGN KEY ("bstId") REFERENCES "BSTCollection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MauSac" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bstId" INTEGER NOT NULL,
    "tenMau" TEXT NOT NULL,
    "maHex" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MauSac_bstId_fkey" FOREIGN KEY ("bstId") REFERENCES "BSTCollection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhatTrienSanPham" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bstId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "tenSanPham" TEXT NOT NULL,
    "nhomHang" TEXT NOT NULL,
    "formDang" TEXT NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'DANG_PHAT_TRIEN',
    "ghiChu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhatTrienSanPham_bstId_fkey" FOREIGN KEY ("bstId") REFERENCES "BSTCollection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhatTrienSanPham_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TargetBST" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DevelopmentPhase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sanPhamId" INTEGER NOT NULL,
    "soThuTu" INTEGER NOT NULL,
    "tenGiaiDoan" TEXT NOT NULL,
    "ngayBatDau" TEXT,
    "ngayKetThuc" TEXT,
    "ghiChu" TEXT,
    "hoanThanh" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DevelopmentPhase_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "PhatTrienSanPham" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SizeQuantity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sanPhamId" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "soLuong" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SizeQuantity_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "PhatTrienSanPham" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NhaMay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "diaChi" TEXT,
    "congSuat" INTEGER NOT NULL,
    "ghiChu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KeHoachSanXuat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sanPhamId" INTEGER NOT NULL,
    "nhaMayId" INTEGER,
    "trangThai" TEXT NOT NULL DEFAULT 'NHAN_SP',
    "phanTramHoanThanh" INTEGER NOT NULL DEFAULT 0,
    "ngayGiaoCho" TEXT,
    "ngayNhapKho" TEXT,
    "ghiChu" TEXT,
    "soLuongThucTe" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeHoachSanXuat_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "PhatTrienSanPham" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KeHoachSanXuat_nhaMayId_fkey" FOREIGN KEY ("nhaMayId") REFERENCES "NhaMay" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionPhase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keHoachId" INTEGER NOT NULL,
    "soThuTu" INTEGER NOT NULL,
    "tenGiaiDoan" TEXT NOT NULL,
    "ngayBatDau" TEXT,
    "ngayKetThuc" TEXT,
    "hoanThanh" BOOLEAN NOT NULL DEFAULT false,
    "ghiChu" TEXT,
    CONSTRAINT "ProductionPhase_keHoachId_fkey" FOREIGN KEY ("keHoachId") REFERENCES "KeHoachSanXuat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keHoachId" INTEGER NOT NULL,
    "moTa" TEXT NOT NULL,
    "phuongAn" TEXT,
    "ngayPhatSinh" TEXT,
    "daXuLy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskLog_keHoachId_fkey" FOREIGN KEY ("keHoachId") REFERENCES "KeHoachSanXuat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "KeHoachSanXuat_sanPhamId_key" ON "KeHoachSanXuat"("sanPhamId");
