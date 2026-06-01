import { useEffect, useState } from 'react'
import { api } from '../api'
import BarChart from '../components/BarChart'
import { toast } from '../components/Toast'

function pct(v) { return `${v}%` }

const TRANG_THAI_SX_LABEL = {
  NHAN_SP:       'Nhận SP',
  LAP_KE_HOACH:  'Lập KH',
  CAN_DOI_NPL:   'Cân đối NPL',
  BAN_GIAO_GC:   'Bàn giao GC',
  THEO_DOI:      'Theo dõi',
  XU_LY_RUI_RO:  'Xử lý rủi ro',
  NHAP_KHO:      'Nhập kho ✓',
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard.stats()
      .then(setData)
      .catch((e) => toast(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!data)   return <div className="page-body"><div className="alert alert-danger">Không tải được dữ liệu</div></div>

  const { tongQuan, bstProgress, targetVsThucTe, donHangDangSX, canhBaoTre, nhapKhoByMonth } = data

  return (
    <>
      <div className="page-header">
        <div>
          <h2>📊 Dashboard Tổng quan</h2>
          <p>Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
          🔄 Làm mới
        </button>
      </div>

      <div className="page-body">
        {/* KPI row */}
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="label">Tổng BST</div>
            <div className="value">{tongQuan.tongBST}</div>
          </div>
          <div className="stat-card">
            <div className="label">Sản phẩm PT</div>
            <div className="value">{tongQuan.tongSP}</div>
            <div className="sub">{tongQuan.dangPhatTrien} đang PT · {tongQuan.daChot} đã chốt</div>
          </div>
          <div className="stat-card success">
            <div className="label">Đang sản xuất</div>
            <div className="value">{tongQuan.dangSanXuat}</div>
            <div className="sub">{tongQuan.daHoanThanh} đã nhập kho</div>
          </div>
          <div className="stat-card">
            <div className="label">Nhà máy GC</div>
            <div className="value">{tongQuan.tongNhaMay}</div>
          </div>
          {tongQuan.canhBaoTre > 0 && (
            <div className="stat-card danger">
              <div className="label">⚠️ Trễ tiến độ</div>
              <div className="value">{tongQuan.canhBaoTre}</div>
              <div className="sub">đơn hàng cần xử lý</div>
            </div>
          )}
        </div>

        {/* Warning rows */}
        {canhBaoTre.length > 0 && (
          <div className="card mb-20">
            <div className="card-header">
              <h3>🚨 Cảnh báo trễ tiến độ ({canhBaoTre.length})</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>BST</th>
                    <th>Nhà máy</th>
                    <th>Trạng thái</th>
                    <th>% Hoàn thành</th>
                    <th>Giai đoạn trễ</th>
                  </tr>
                </thead>
                <tbody>
                  {canhBaoTre.map((item) => (
                    <tr key={item.id} className="row-danger">
                      <td><b>{item.tenSanPham}</b></td>
                      <td>{item.bst}</td>
                      <td>{item.nhaMay}</td>
                      <td><span className="badge badge-red">{TRANG_THAI_SX_LABEL[item.trangThai] || item.trangThai}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div className="progress-fill danger" style={{ width: pct(item.phanTramHoanThanh) }} />
                          </div>
                          <span className="text-sm">{item.phanTramHoanThanh}%</span>
                        </div>
                      </td>
                      <td><span className="text-sm" style={{ color: 'var(--danger)' }}>{item.phaseTre.join(', ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid-2 mb-20">
          {/* BST Progress */}
          <div className="card">
            <div className="card-header"><h3>🗂️ Tiến độ BST</h3></div>
            <div className="card-body">
              {bstProgress.length === 0 ? (
                <div className="empty-state"><p>Chưa có BST</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {bstProgress.map((bst) => (
                    <div key={bst.id}>
                      <div className="flex-between mb-4" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{bst.ten} · {bst.mua} {bst.nam}</span>
                        <span className="text-sm text-muted">{bst.daChotSP}/{bst.totalSP} SP</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${bst.tiLePhatTrien === 100 ? 'success' : bst.tiLePhatTrien > 50 ? '' : 'warning'}`}
                          style={{ width: pct(bst.tiLePhatTrien) }}
                        />
                      </div>
                      <div className="flex-between mt-4" style={{ marginTop: 4 }}>
                        <span className="text-sm text-muted">PT: {bst.tiLePhatTrien}%</span>
                        {bst.avgSXProgress > 0 && <span className="text-sm text-muted">SX: {bst.avgSXProgress}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nhập kho theo tháng */}
          <div className="card">
            <div className="card-header"><h3>📦 Nhập kho theo tháng</h3></div>
            <div className="card-body">
              {nhapKhoByMonth.length === 0 ? (
                <div className="empty-state"><p>Chưa có dữ liệu nhập kho</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nhapKhoByMonth.map((m) => (
                    <div key={m.month} className="flex-between">
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{m.month}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span className="badge badge-blue">{m.count} đơn</span>
                        <span className="badge badge-green">{(m.tongSP || 0).toLocaleString()} SP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Target vs Thực tế */}
        {targetVsThucTe.length > 0 && (
          <div className="card mb-20">
            <div className="card-header"><h3>📈 Target vs Thực tế sản xuất</h3></div>
            <div className="card-body">
              <BarChart
                data={targetVsThucTe.slice(0, 12).map((d) => ({ label: d.ten, a: d.soLuongTarget, b: d.soLuongThucTe }))}
                labelA="Target SP"
                labelB="Thực tế SX"
              />
            </div>
          </div>
        )}

        {/* Đơn hàng đang SX */}
        <div className="card">
          <div className="card-header">
            <h3>🏭 Đơn hàng đang sản xuất ({donHangDangSX.length})</h3>
          </div>
          {donHangDangSX.length === 0 ? (
            <div className="empty-state"><div className="icon">🏭</div><p>Không có đơn hàng nào đang sản xuất</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>BST</th>
                    <th>Nhà máy</th>
                    <th>Trạng thái</th>
                    <th>% Hoàn thành</th>
                    <th>Ngày giao</th>
                  </tr>
                </thead>
                <tbody>
                  {donHangDangSX.map((kh) => (
                    <tr key={kh.id}>
                      <td><b>{kh.sanPham?.tenSanPham}</b><br /><span className="text-sm text-muted">{kh.sanPham?.nhomHang}</span></td>
                      <td>{kh.sanPham?.bst?.ten}</td>
                      <td>{kh.nhaMay?.ten || <span className="text-muted">Chưa giao</span>}</td>
                      <td>
                        <span className={`badge ${kh.trangThai === 'XU_LY_RUI_RO' ? 'badge-red' : kh.trangThai === 'THEO_DOI' ? 'badge-blue' : 'badge-yellow'}`}>
                          {TRANG_THAI_SX_LABEL[kh.trangThai] || kh.trangThai}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 70 }}>
                            <div className="progress-fill" style={{ width: pct(kh.phanTramHoanThanh) }} />
                          </div>
                          <span className="text-sm">{kh.phanTramHoanThanh}%</span>
                        </div>
                      </td>
                      <td className="text-sm text-muted">{kh.ngayGiaoCho || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
