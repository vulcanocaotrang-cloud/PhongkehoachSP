-- AlterTable
ALTER TABLE "KeHoachSanXuat" ADD COLUMN "loaiSize" TEXT;

-- CreateTable
CREATE TABLE "KHSXSize" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keHoachId" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "soLuong" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "KHSXSize_keHoachId_fkey" FOREIGN KEY ("keHoachId") REFERENCES "KeHoachSanXuat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NhapXuatVatTu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vatTuId" INTEGER NOT NULL,
    "nhaCungCapId" INTEGER,
    "nhaMayId" INTEGER,
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
    CONSTRAINT "NhapXuatVatTu_nhaCungCapId_fkey" FOREIGN KEY ("nhaCungCapId") REFERENCES "NhaCungCap" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NhapXuatVatTu_nhaMayId_fkey" FOREIGN KEY ("nhaMayId") REFERENCES "NhaMay" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NhapXuatVatTu" ("createdAt", "donGia", "ghiChu", "id", "keHoachId", "loai", "lyDo", "ngayGiaoDich", "nhaCungCapId", "soChungTu", "soLuong", "vatTuId") SELECT "createdAt", "donGia", "ghiChu", "id", "keHoachId", "loai", "lyDo", "ngayGiaoDich", "nhaCungCapId", "soChungTu", "soLuong", "vatTuId" FROM "NhapXuatVatTu";
DROP TABLE "NhapXuatVatTu";
ALTER TABLE "new_NhapXuatVatTu" RENAME TO "NhapXuatVatTu";
CREATE TABLE "new_VatTu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ten" TEXT NOT NULL,
    "maVatTu" TEXT,
    "donViTinh" TEXT NOT NULL,
    "nhaCungCapId" INTEGER,
    "nhomHangId" INTEGER,
    "donGia" REAL,
    "tonKho" REAL NOT NULL DEFAULT 0,
    "tonToiThieu" REAL NOT NULL DEFAULT 0,
    "hinhAnh" TEXT,
    "ghiChu" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VatTu_nhaCungCapId_fkey" FOREIGN KEY ("nhaCungCapId") REFERENCES "NhaCungCap" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VatTu_nhomHangId_fkey" FOREIGN KEY ("nhomHangId") REFERENCES "NhomHang" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VatTu" ("active", "createdAt", "donGia", "donViTinh", "ghiChu", "id", "maVatTu", "nhaCungCapId", "ten", "tonKho", "tonToiThieu", "updatedAt") SELECT "active", "createdAt", "donGia", "donViTinh", "ghiChu", "id", "maVatTu", "nhaCungCapId", "ten", "tonKho", "tonToiThieu", "updatedAt" FROM "VatTu";
DROP TABLE "VatTu";
ALTER TABLE "new_VatTu" RENAME TO "VatTu";
CREATE UNIQUE INDEX "VatTu_maVatTu_key" ON "VatTu"("maVatTu");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
