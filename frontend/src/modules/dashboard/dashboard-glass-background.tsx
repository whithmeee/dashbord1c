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
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="alpha" />
          <feDiffuseLighting in="alpha" surfaceScale="7" diffuseConstant="0.7071" result="lightX">
            <feDistantLight azimuth="0" elevation="45" />
          </feDiffuseLighting>
          <feDiffuseLighting in="alpha" surfaceScale="7" diffuseConstant="0.7071" result="lightY">
            <feDistantLight azimuth="90" elevation="45" />
          </feDiffuseLighting>
          <feColorMatrix in="lightX" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0 0 0 0 1" result="red" />
          <feColorMatrix in="lightY" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1" result="green" />
          <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="-30" xChannelSelector="R" yChannelSelector="G" />
          <feColorMatrix type="saturate" values="1.12" />
        </filter>
      </svg>
      <div className="dashboard-glass-wall" />
      <div className="dashboard-glass-refraction" />
    </div>
  )
}
