// Charts SVG renderizados en el servidor (sin JS de cliente).

export function VelocityColumns({
  data,
}: {
  data: { name: string; assumed: number; velocity: number }[];
}) {
  const rows = data.slice(-8);
  const W = 640;
  const H = 250;
  const PAD_L = 34;
  const PAD_R = 8;
  const PAD_T = 16;
  const PAD_B = 40;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const max = Math.max(1, ...rows.flatMap((r) => [r.assumed, r.velocity]));
  const niceMax = Math.max(5, Math.ceil(max / 5) * 5);
  const slot = plotW / rows.length;
  const barW = Math.min(26, slot * 0.3);
  const y = (v: number) => PAD_T + plotH - (v / niceMax) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--color-border)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--color-text-secondary)"
            >
              {t}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = PAD_L + slot * i + slot / 2;
          const name =
            r.name.length > 14 ? `${r.name.slice(0, 13)}…` : r.name;
          return (
            <g key={r.name + i}>
              <rect
                x={cx - barW - 2}
                y={y(r.assumed)}
                width={barW}
                height={PAD_T + plotH - y(r.assumed)}
                rx={3}
                fill="var(--color-primary-soft)"
              />
              <rect
                x={cx + 2}
                y={y(r.velocity)}
                width={barW}
                height={PAD_T + plotH - y(r.velocity)}
                rx={3}
                fill="var(--color-primary)"
              />
              {r.assumed > 0 && (
                <text
                  x={cx - 2 - barW / 2}
                  y={y(r.assumed) - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-text-secondary)"
                >
                  {r.assumed}
                </text>
              )}
              {r.velocity > 0 && (
                <text
                  x={cx + 2 + barW / 2}
                  y={y(r.velocity) - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fill="var(--color-primary)"
                >
                  {r.velocity}
                </text>
              )}
              <text
                x={cx}
                y={H - PAD_B + 16}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-text-primary)"
              >
                {name}
              </text>
            </g>
          );
        })}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={PAD_T + plotH}
          y2={PAD_T + plotH}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      </svg>
      <div className="mt-1 flex justify-center gap-5 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary-soft" />
          puntos asumidos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
          velocity (completados)
        </span>
      </div>
    </div>
  );
}

export function DonutGauge({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <svg viewBox="0 0 68 68" className="h-16 w-16" role="img">
      <circle
        cx={34}
        cy={34}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeOpacity={0.5}
        strokeWidth={8}
      />
      <circle
        cx={34}
        cy={34}
        r={r}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
        transform="rotate(-90 34 34)"
      />
      <text
        x={34}
        y={39}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--color-primary)"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export function PercentBars({
  items,
}: {
  items: { label: string; pct: number; sub: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{it.label}</span>
            <span className="text-xs text-text-secondary">{it.sub}</span>
          </div>
          <div className="h-4 rounded bg-white/50">
            <div
              className={`h-4 rounded ${it.pct >= 100 ? "bg-success" : it.pct >= 50 ? "bg-info" : "bg-warning"}`}
              style={{ width: `${Math.max(2, it.pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ValueBars({
  items,
}: {
  items: { label: string; value: number; display: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{it.label}</span>
            <span className="text-xs text-text-secondary">{it.display}</span>
          </div>
          <div className="h-4 rounded bg-white/50">
            <div
              className="h-4 rounded bg-primary"
              style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
