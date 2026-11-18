export function DashboardGlassBackground() {
  return (
    <div className="dashboard-glass-background" aria-hidden="true">
      <svg className="dashboard-liquid-glass-definitions" width="0" height="0">
        <filter
          id="dashboard-liquid-glass-filter"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="17" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.7" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="32" xChannelSelector="R" yChannelSelector="G" />
          <feColorMatrix type="saturate" values="1.12" />
        </filter>
      </svg>
      <div className="dashboard-glass-wall" />
      <div className="dashboard-glass-refraction" />
    </div>
  )
}
