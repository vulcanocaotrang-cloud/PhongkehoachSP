-- CreateTable
CREATE TABLE "NhomHang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NhaCungCap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "maSo" TEXT,
    "diaChi" TEXT,
    "sdt" TEXT,
    "email" TEXT,
    "nguoiLienHe" TEXT,
    "ghiChu" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VatTu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "maVatTu" TEXT,
    "donViTinh" TEXT NOT NULL,
    "nhaCungCapId" INTEGER,
    "donGia" REAL,
    "tonKho" REAL NOT NULL DEFAULT 0,
    "tonToiThieu" REAL NOT NULL DEFAULT 0,
    "ghiChu" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VatTu_nhaCungCapId_fkey" FOREIGN KEY ("nhaCungCapId") REFERENCES "NhaCungCap" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VatTuDonHang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keHoachId" INTEGER NOT NULL,
    "vatTuId" INTEGER NOT NULL,
    "soLuongCan" REAL NOT NULL,
    "soLuongDat" REAL NOT NULL DEFAULT 0,
    "soLuongNhan" REAL NOT NULL DEFAULT 0,
    "ghiChu" TEXT,
    CONSTRAINT "VatTuDonHang_keHoachId_fkey" FOREIGN KEY ("keHoachId") REFERENCES "KeHoachSanXuat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VatTuDonHang_vatTuId_fkey" FOREIGN KEY ("vatTuId") REFERENCES "VatTu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NhapXuatVatTu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vatTuId" INTEGER NOT NULL,
    "nhaCungCapId" INTEGER,
    "loai" TEXT NOT NULL,
    "soLuong" REAL NOT NULL,
    "donGia" REAL,
    "soChungTu" TEXT,
    "lyDo" TEXT,
    "ngayGiaoDich" TEXT NOT NULL,
    "keHoachId" INTEGER,
    "ghiChu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NhapXuatVatTu_vatTuId_fkey" FOREIGN KEY ("vatTuId") REFERENCES "VatTu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NhapXuatVatTu_nhaCungCapId_fkey" FOREIGN KEY ("nhaCungCapId") REFERENCES "NhaCungCap" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaiKhoan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenDangNhap" TEXT NOT NULL,
    "matKhau" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "email" TEXT,
    "vaiTro" TEXT NOT NULL DEFAULT 'QUAN_LY_SP',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PhatTrienSanPham" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bstId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "nhomHangId" INTEGER,
    "tenSanPham" TEXT NOT NULL,
    "nhomHang" TEXT NOT NULL,
    "formDang" TEXT NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'DANG_PHAT_TRIEN',
    "ghiChu" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhatTrienSanPham_bstId_fkey" FOREIGN KEY ("bstId") REFERENCES "BSTCollection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhatTrienSanPham_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "TargetBST" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PhatTrienSanPham_nhomHangId_fkey" FOREIGN KEY ("nhomHangId") REFERENCES "NhomHang" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PhatTrienSanPham" ("bstId", "createdAt", "formDang", "ghiChu", "id", "nhomHang", "targetId", "tenSanPham", "trangThai", "updatedAt") SELECT "bstId", "createdAt", "formDang", "ghiChu", "id", "nhomHang", "targetId", "tenSanPham", "trangThai", "updatedAt" FROM "PhatTrienSanPham";
DROP TABLE "PhatTrienSanPham";
ALTER TABLE "new_PhatTrienSanPham" RENAME TO "PhatTrienSanPham";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VatTu_maVatTu_key" ON "VatTu"("maVatTu");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_tenDangNhap_key" ON "TaiKhoan"("tenDangNhap");
