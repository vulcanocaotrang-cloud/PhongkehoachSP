require('dotenv').config()
const express = require('express')
const cors = require('cors')

const bstRoutes        = require('./routes/bst')
const targetBSTRoutes  = require('./routes/targetBST')
const phatTrienSPRoutes = require('./routes/phatTrienSP')
const nhaMayRoutes     = require('./routes/nhaMay')
const keHoachSXRoutes  = require('./routes/keHoachSX')
const dashboardRoutes  = require('./routes/dashboard')
const nhomHangRoutes   = require('./routes/nhomHang')
const nhaCungCapRoutes = require('./routes/nhaCungCap')
const taiKhoanRoutes   = require('./routes/taiKhoan')
const vatTuRoutes      = require('./routes/vatTu')
const khoVatTuRoutes   = require('./routes/khoVatTu')

const app  = express()
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'   // bind to all interfaces → accessible by IP

app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '15mb' }))     // allow base64 images in body

// Health check
app.get('/health',     (_req, res) => res.json({ status: 'ok', time: new Date() }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }))

// Routes
app.use('/api/bst',           bstRoutes)
app.use('/api/target-bst',    targetBSTRoutes)
app.use('/api/phat-trien-sp', phatTrienSPRoutes)
app.use('/api/nha-may',       nhaMayRoutes)
app.use('/api/ke-hoach-sx',   keHoachSXRoutes)
app.use('/api/dashboard',     dashboardRoutes)
app.use('/api/nhom-hang',     nhomHangRoutes)
app.use('/api/nha-cung-cap',  nhaCungCapRoutes)
app.use('/api/tai-khoan',     taiKhoanRoutes)
app.use('/api/vat-tu',        vatTuRoutes)
app.use('/api/kho-vat-tu',    khoVatTuRoutes)

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Lỗi server nội bộ', detail: err.message })
})

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend chạy tại http://localhost:${PORT}`)
  console.log(`🌐 Truy cập từ IP khác: http://<IP-máy-chủ>:${PORT}`)
})
