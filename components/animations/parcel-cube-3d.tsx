import React from "react";

/** CSS-only 3D rotating parcel (preserve-3d), so no WebGL bundle is needed. */
export function ParcelCube3D({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="lp-cube-hover">
        <div className="lp-cube-scene" style={{ ["--cube" as string]: `${size}px` } as React.CSSProperties}>
          <div className="lp-cube">
            <div className="lp-cube-face lp-cube-front" />
            <div className="lp-cube-face lp-cube-back" />
            <div className="lp-cube-face lp-cube-right" />
            <div className="lp-cube-face lp-cube-left" />
            <div className="lp-cube-face lp-cube-top" />
            <div className="lp-cube-face lp-cube-bottom" />
          </div>
        </div>
      </div>
      <div className="lp-cube-shadow" style={{ width: size * 0.9 }} />
    </div>
  );
}
