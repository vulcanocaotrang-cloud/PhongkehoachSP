/**
 * BarChart — simple SVG grouped bar chart
 * Props:
 *   data: [{ label, a, b }]   (a = target, b = thực tế)
 *   labelA?: string  (default 'Target')
 *   labelB?: string  (default 'Thực tế')
 *   height?: number  (default 220)
 */
export default function BarChart({ data = [], labelA = 'Target', labelB = 'Thực tế', height = 220 }) {
  if (!data.length) return <div className="empty-state"><p>Không có dữ liệu</p></div>

  const W = 600
  const H = height
  const PAD = { top: 20, right: 20, bottom: 50, left: 50 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.flatMap((d) => [d.a || 0, d.b || 0]), 1)
  const yTicks = 5
  const barGroupW = chartW / data.length
  const barW = Math.min(28, barGroupW * 0.35)
  const gap = 4

  function yPos(v) { return chartH - (v / maxVal) * chartH }

  return (
    <div className="bar-chart">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: H }}>
        {/* Y gridlines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = (maxVal / yTicks) * i
          const y = PAD.top + yPos(v)
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#E5E7EB" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
                {Math.round(v).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = PAD.left + i * barGroupW + barGroupW / 2
          const aH = ((d.a || 0) / maxVal) * chartH
          const bH = ((d.b || 0) / maxVal) * chartH

          return (
            <g key={i}>
              {/* Bar A (target) */}
              <rect
                x={cx - barW - gap / 2}
                y={PAD.top + chartH - aH}
                width={barW}
                height={aH}
                fill="#BFDBFE"
                stroke="#2563EB"
                strokeWidth={1}
                rx={3}
              />
              {aH > 14 && (
                <text x={cx - barW / 2 - gap / 2} y={PAD.top + chartH - aH - 4} textAnchor="middle" fontSize={9} fill="#1D4ED8" fontWeight="600">
                  {(d.a || 0).toLocaleString()}
                </text>
              )}

              {/* Bar B (thực tế) */}
              <rect
                x={cx + gap / 2}
                y={PAD.top + chartH - bH}
                width={barW}
                height={bH}
                fill="#BBF7D0"
                stroke="#16A34A"
                strokeWidth={1}
                rx={3}
              />
              {bH > 14 && (
                <text x={cx + barW / 2 + gap / 2} y={PAD.top + chartH - bH - 4} textAnchor="middle" fontSize={9} fill="#166534" fontWeight="600">
                  {(d.b || 0).toLocaleString()}
                </text>
              )}

              {/* X label */}
              <text x={cx} y={PAD.top + chartH + 16} textAnchor="middle" fontSize={10} fill="#6B7280">
                {d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label}
              </text>
            </g>
          )
        })}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#D1D5DB" strokeWidth={1.5} />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#D1D5DB" strokeWidth={1.5} />

        {/* Legend */}
        <rect x={PAD.left} y={H - 18} width={12} height={10} fill="#BFDBFE" stroke="#2563EB" strokeWidth={1} rx={2} />
        <text x={PAD.left + 16} y={H - 9} fontSize={10} fill="#4B5563">{labelA}</text>
        <rect x={PAD.left + 70} y={H - 18} width={12} height={10} fill="#BBF7D0" stroke="#16A34A" strokeWidth={1} rx={2} />
        <text x={PAD.left + 86} y={H - 9} fontSize={10} fill="#4B5563">{labelB}</text>
      </svg>
    </div>
  )
}
