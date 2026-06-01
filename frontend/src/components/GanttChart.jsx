/**
 * GanttChart — CSS-based Gantt chart for development/production phases
 * Props:
 *   phases: [{ soThuTu, tenGiaiDoan, ngayBatDau, ngayKetThuc, hoanThanh }]
 *   labelWidth?: number (px, default 160)
 */

const PHASE_COLORS = ['#8B5CF6','#2563EB','#0891B2','#16A34A','#D97706','#DC2626','#374151']

function toDate(str) {
  if (!str) return null
  return new Date(str + 'T00:00:00')
}
function fmtDate(d) {
  if (!d) return ''
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function GanttChart({ phases = [], labelWidth = 160 }) {
  // Compute date range
  const dates = phases.flatMap((p) => [toDate(p.ngayBatDau), toDate(p.ngayKetThuc)]).filter(Boolean)
  if (dates.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 24 }}>
        <div className="icon">📅</div>
        <p>Chưa có ngày cho các giai đoạn</p>
      </div>
    )
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  // Add padding
  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 3)

  const totalMs = maxDate - minDate

  function toPercent(date) {
    if (!date) return 0
    return Math.max(0, Math.min(100, ((date - minDate) / totalMs) * 100))
  }

  // Build month labels
  const months = []
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (cur <= maxDate) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const start = toPercent(cur < minDate ? minDate : cur)
    const end   = toPercent(next > maxDate ? maxDate : next)
    months.push({ label: cur.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }), start, width: end - start })
    cur = next
  }

  const todayPct = toPercent(today)
  const showToday = todayPct >= 0 && todayPct <= 100

  return (
    <div className="gantt-wrap">
      <div className="gantt-container">
        {/* Header */}
        <div style={{ display: 'flex', borderRadius: '6px 6px 0 0', overflow: 'hidden', border: '1px solid #E5E7EB', borderBottom: 'none' }}>
          <div style={{ width: labelWidth, flexShrink: 0, padding: '8px 10px', background: '#F9FAFB', fontSize: 11, fontWeight: 600, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>
            Giai đoạn
          </div>
          <div style={{ flex: 1, position: 'relative', height: 32, background: '#F9FAFB' }}>
            {months.map((m, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', left: `${m.start}%`, width: `${m.width}%`,
                  fontSize: 11, fontWeight: 600, color: '#6B7280',
                  padding: '8px 4px', borderRight: '1px dashed #E5E7EB', height: '100%',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {phases.map((p, i) => {
          const start = toDate(p.ngayBatDau)
          const end   = toDate(p.ngayKetThuc)
          const leftPct  = start ? toPercent(start) : null
          const widthPct = (start && end) ? Math.max(1, toPercent(end) - toPercent(start)) : null
          const color = PHASE_COLORS[(p.soThuTu - 1) % PHASE_COLORS.length]
          const isLate = !p.hoanThanh && end && end < today

          return (
            <div
              key={p.id || i}
              style={{
                display: 'flex', minHeight: 42,
                border: '1px solid #E5E7EB', borderTop: 'none',
                borderRadius: i === phases.length - 1 ? '0 0 6px 6px' : undefined,
                background: isLate ? '#FFF5F5' : 'white',
              }}
            >
              <div style={{
                width: labelWidth, flexShrink: 0, padding: '0 10px',
                fontSize: 12, fontWeight: 500, color: '#374151',
                borderRight: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: '50%',
                  background: p.hoanThanh ? '#16A34A' : color,
                  fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {p.hoanThanh ? '✓' : p.soThuTu}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.tenGiaiDoan}
                </span>
              </div>

              <div style={{ flex: 1, position: 'relative', height: 42, background: '#F9FAFB' }}>
                {/* Grid lines */}
                {months.map((m, mi) => (
                  <div key={mi} style={{ position: 'absolute', left: `${m.start + m.width}%`, top: 0, bottom: 0, width: 1, background: '#F3F4F6' }} />
                ))}

                {/* Bar */}
                {leftPct !== null && widthPct !== null && (
                  <div
                    className={`gantt-bar phase-${p.soThuTu}`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      opacity: p.hoanThanh ? 0.6 : 1,
                      background: p.hoanThanh ? '#16A34A' : color,
                    }}
                    title={`${p.tenGiaiDoan}: ${p.ngayBatDau || '?'} → ${p.ngayKetThuc || '?'}${isLate ? ' ⚠️ Trễ tiến độ' : ''}`}
                  >
                    {widthPct > 8 && `${fmtDate(start)} – ${fmtDate(end)}`}
                    {isLate && ' ⚠️'}
                  </div>
                )}

                {/* Today line */}
                {showToday && (
                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: '#DC2626', opacity: 0.7, zIndex: 2 }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#6B7280' }}>Giai đoạn:</span>
        {phases.map((p, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PHASE_COLORS[(p.soThuTu-1) % PHASE_COLORS.length], display: 'inline-block' }} />
            {p.tenGiaiDoan}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <span style={{ width: 2, height: 12, background: '#DC2626', display: 'inline-block' }} />
          Hôm nay
        </span>
      </div>
    </div>
  )
}
