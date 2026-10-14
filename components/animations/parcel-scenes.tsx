import React from "react";

/**
 * Lightweight animated SVG scenes for the courier lifecycle.
 * Pure SVG + CSS keyframes (see "LogiPulse parcel animations" in globals.css): no GIFs,
 * no animation library, GPU-friendly transforms only, and disabled under prefers-reduced-motion.
 */
export type ParcelSceneVariant = "packing" | "burst" | "searching" | "pickup" | "transit" | "delivered";

interface ParcelSceneProps {
  variant: ParcelSceneVariant;
  size?: number;
  className?: string;
}

const BOX = "#C68B4E";
const BOX_DARK = "#9A6A38";
const BOX_INNER = "#7A5229";
const TAPE = "#F4D58D";

export function ParcelScene({ variant, size = 200, className = "" }: ParcelSceneProps) {
  const Scene = SCENES[variant];
  return (
    <svg
      viewBox="0 0 200 160"
      width={size}
      height={(size * 160) / 200}
      className={`lp-anim text-slate-700 dark:text-slate-200 ${className}`}
      role="img"
      aria-label={LABELS[variant]}
    >
      <Scene />
    </svg>
  );
}

const LABELS: Record<ParcelSceneVariant, string> = {
  packing: "Parcel being packed",
  burst: "Parcel burst open",
  searching: "Searching for a nearby rider",
  pickup: "Rider picking up the parcel",
  transit: "Rider on the way with the parcel",
  delivered: "Parcel delivered at the door",
};

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function Ground() {
  return (
    <>
      <ellipse cx="100" cy="140" rx="80" ry="6" className="fill-slate-200 dark:fill-slate-800" />
    </>
  );
}

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin?: boolean }) {
  return (
    <g className={spin ? "lp-wheel-spin" : undefined}>
      <circle cx={cx} cy={cy} r="12" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx={cx} cy={cy} r="2" fill="currentColor" />
      <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </g>
  );
}

/** Motorbike + rider. Wheels sit on y=132, the rear rack spans x 10..32 at y 100. */
function RiderBike({ spin = false }: { spin?: boolean }) {
  return (
    <g>
      <Wheel cx={22} cy={120} spin={spin} />
      <Wheel cx={72} cy={120} spin={spin} />
      {/* frame */}
      <path
        d="M22 120 L40 102 L64 102 L72 120 M40 102 L50 120 L22 120 M10 100 L34 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* fuel tank */}
      <path d="M44 102 Q52 92 62 100 Z" fill="#12B76A" />
      {/* handlebar */}
      <path d="M64 102 L68 88 L76 86" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* rider */}
      <path d="M40 98 L52 104 L48 118" fill="none" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 98 L52 74" stroke="#12B76A" strokeWidth="9" strokeLinecap="round" />
      <path d="M52 77 L70 88" stroke="#12B76A" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="56" cy="64" r="8" fill="#F2C6A0" />
      <path d="M47 64 A9 9 0 0 1 65 62 L66 60 Q57 50 48 58 Z" fill="#F97316" />
      <rect x="60" y="61" width="6" height="3" rx="1.5" fill="#0F172A" opacity="0.7" />
    </g>
  );
}

function Parcel({ x, y, w = 22, h = 18 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill={BOX} />
      <rect x={x} y={y} width={w} height={h * 0.28} rx="2" fill={BOX_DARK} />
      <rect x={x + w / 2 - 2.5} y={y} width="5" height={h} fill={TAPE} />
    </g>
  );
}

function badgeDelay(seconds: number): React.CSSProperties {
  return { ["--lp-badge-delay" as string]: `${seconds}s` } as React.CSSProperties;
}

function CheckBadge({
  cx,
  cy,
  color = "#10B981",
  delay = 1.7,
}: {
  cx: number;
  cy: number;
  color?: string;
  delay?: number;
}) {
  return (
    <g className="lp-badge-pop" style={badgeDelay(delay)}>
      <circle cx={cx} cy={cy} r="15" fill={color} />
      <path
        d={`M${cx - 7} ${cy} L${cx - 2} ${cy + 5} L${cx + 8} ${cy - 6}`}
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lp-check-draw"
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function PackingScene() {
  return (
    <>
      <Ground />
      <g className="lp-box-settle">
        {/* inside of the open box */}
        <rect x="58" y="70" width="84" height="12" fill={BOX_INNER} />
        {/* item dropping in */}
        <g className="lp-item-drop">
          <rect x="84" y="56" width="32" height="22" rx="4" fill="#12B76A" />
          <rect x="90" y="62" width="20" height="4" rx="2" fill="#93C5FD" />
        </g>
        {/* box body */}
        <rect x="58" y="76" width="84" height="60" rx="3" fill={BOX} />
        <rect x="58" y="76" width="84" height="8" fill={BOX_DARK} />
        <text x="100" y="116" textAnchor="middle" fontSize="11" fontWeight="800" fill={BOX_INNER} opacity="0.7">
          LOGIPULSE
        </text>
        {/* flaps, hinged on the top edges */}
        <rect x="58" y="70" width="42" height="7" rx="2" fill={BOX_DARK} className="lp-flap-left" />
        <rect x="100" y="70" width="42" height="7" rx="2" fill={BOX_DARK} className="lp-flap-right" />
        {/* tape */}
        <rect x="58" y="69" width="84" height="8" rx="1" fill={TAPE} className="lp-tape" />
      </g>
      <CheckBadge cx={152} cy={58} />
      <g className="lp-sparkles">
        <circle cx="40" cy="60" r="3" fill="#F59E0B" />
        <circle cx="160" cy="100" r="2.5" fill="#F97316" />
        <circle cx="50" cy="104" r="2" fill="#12B76A" />
      </g>
    </>
  );
}

function BurstScene() {
  return (
    <>
      <Ground />
      <g className="lp-box-shake">
        <rect x="58" y="76" width="84" height="60" rx="3" fill={BOX} />
        <rect x="58" y="76" width="84" height="8" fill={BOX_DARK} />
        {/* crack */}
        <path
          d="M100 78 L94 92 L104 100 L96 114 L102 124"
          fill="none"
          stroke={BOX_INNER}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lp-crack-draw"
        />
      </g>
      {/* flaps blown off */}
      <rect x="58" y="70" width="42" height="7" rx="2" fill={BOX_DARK} className="lp-blow-left" />
      <rect x="100" y="70" width="42" height="7" rx="2" fill={BOX_DARK} className="lp-blow-right" />
      {/* debris */}
      <g className="lp-debris">
        <rect x="96" y="70" width="8" height="8" rx="1" fill="#12B76A" className="lp-debris-1" />
        <rect x="92" y="72" width="6" height="6" rx="1" fill={TAPE} className="lp-debris-2" />
        <rect x="104" y="72" width="7" height="5" rx="1" fill={BOX} className="lp-debris-3" />
        <circle cx="100" cy="72" r="3" fill="#F59E0B" className="lp-debris-4" />
      </g>
      <g className="lp-badge-pop" style={badgeDelay(1.1)}>
        <circle cx="152" cy="58" r="15" fill="#EF4444" />
        <rect x="150" y="48" width="4" height="12" rx="2" fill="#fff" />
        <circle cx="152" cy="66" r="2.4" fill="#fff" />
      </g>
    </>
  );
}

function SearchingScene() {
  return (
    <>
      <Ground />
      <circle cx="100" cy="104" r="20" fill="none" stroke="#12B76A" strokeWidth="2" className="lp-radar lp-radar-1" />
      <circle cx="100" cy="104" r="20" fill="none" stroke="#12B76A" strokeWidth="2" className="lp-radar lp-radar-2" />
      <circle cx="100" cy="104" r="20" fill="none" stroke="#F97316" strokeWidth="2" className="lp-radar lp-radar-3" />
      <g className="lp-float">
        <Parcel x={78} y={86} w={44} h={36} />
      </g>
      <g className="lp-orbit">
        <path d="M150 52 a8 8 0 1 1 16 0 c0 7 -8 14 -8 14 s-8 -7 -8 -14z" fill="#F97316" />
        <circle cx="158" cy="52" r="3" fill="#fff" />
      </g>
    </>
  );
}

function PickupScene() {
  return (
    <>
      <line x1="0" y1="133" x2="200" y2="133" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <g className="lp-pickup-sequence">
        <g className="lp-ride-in">
          <RiderBike spin />
        </g>
        {/* parcel waiting at the kerb, then hops onto the rack */}
        <g className="lp-box-hop">
          <Parcel x={140} y={114} />
        </g>
      </g>
      <CheckBadge cx={160} cy={50} color="#12B76A" delay={2.05} />
    </>
  );
}

function TransitScene() {
  return (
    <>
      {/* skyline drifting past */}
      <g className="lp-skyline" opacity="0.18" fill="currentColor">
        <rect x="0" y="70" width="24" height="62" />
        <rect x="30" y="50" width="20" height="82" />
        <rect x="56" y="80" width="30" height="52" />
        <rect x="92" y="60" width="18" height="72" />
        <rect x="116" y="76" width="28" height="56" />
        <rect x="150" y="56" width="22" height="76" />
        <rect x="178" y="84" width="26" height="48" />
        <rect x="210" y="70" width="24" height="62" />
        <rect x="240" y="50" width="20" height="82" />
        <rect x="266" y="80" width="30" height="52" />
        <rect x="302" y="60" width="18" height="72" />
        <rect x="326" y="76" width="28" height="56" />
        <rect x="360" y="56" width="22" height="76" />
        <rect x="388" y="84" width="26" height="48" />
      </g>
      <rect x="0" y="132" width="200" height="28" className="fill-slate-200 dark:fill-slate-800" />
      <g className="lp-road-dashes">
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={i * 40} y="145" width="22" height="3" rx="1.5" fill="#F59E0B" />
        ))}
      </g>
      <g transform="translate(58 0)">
        <g className="lp-bob">
          <RiderBike spin />
          <Parcel x={10} y={82} />
        </g>
        <g className="lp-speed-lines" stroke="#12B76A" strokeWidth="2" strokeLinecap="round" opacity="0.6">
          <line x1="-14" y1="96" x2="-2" y2="96" />
          <line x1="-22" y1="106" x2="-6" y2="106" />
          <line x1="-12" y1="116" x2="0" y2="116" />
        </g>
      </g>
    </>
  );
}

function DeliveredScene() {
  return (
    <>
      <Ground />
      {/* house front */}
      <rect x="128" y="62" width="58" height="72" rx="3" className="fill-slate-100 dark:fill-slate-800" stroke="currentColor" strokeOpacity="0.25" />
      <path d="M122 66 L157 38 L192 66 Z" fill="#F97316" />
      <rect x="144" y="92" width="26" height="42" rx="2" fill="#039855" />
      <circle cx="165" cy="114" r="2" fill={TAPE} />
      <g transform="translate(-6 0)">
        <RiderBike />
      </g>
      <g className="lp-box-place">
        <Parcel x={110} y={114} />
      </g>
      <CheckBadge cx={60} cy={40} delay={1.2} />
      <g className="lp-sparkles">
        <circle cx="100" cy="70" r="3" fill="#F59E0B" />
        <circle cx="30" cy="70" r="2.5" fill="#10B981" />
        <circle cx="112" cy="40" r="2" fill="#12B76A" />
      </g>
    </>
  );
}

const SCENES: Record<ParcelSceneVariant, () => React.ReactElement> = {
  packing: PackingScene,
  burst: BurstScene,
  searching: SearchingScene,
  pickup: PickupScene,
  transit: TransitScene,
  delivered: DeliveredScene,
};
