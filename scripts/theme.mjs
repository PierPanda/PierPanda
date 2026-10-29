export const MONO_FONT = `'JetBrains Mono','SF Mono',Menlo,Consolas,'Liberation Mono',monospace`;
export const SANS_FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

export const BRAND = { light: "#BEF264", mid: "#4ADE80", strong: "#10B981", ink: "#0D1117" };

export const THEME = {
  panel: "#161B22",
  border: "#30363D",
  text: "#E6EDF3",
  muted: "#8B949E",
  accent: BRAND.light,
  accentStrong: BRAND.strong,
  inset: "#0D1117",
  live: "#3FB950",
  building: "#D29922",
  pending: "#58A6FF",
};

export const WRAPPER = { width: 1048, padding: 24, gap: 16, radius: 20, fill: "#12161D" };

export const WRAPPER_DECOR = {
  dotSpacing: 24,
  dotRadius: 1,
  dotOpacity: 0.07,
  haloColor: BRAND.strong,
  haloOpacity: 0.16,
  haloRadius: 560,
  haloFlatten: 0.45,
};

export const ANIMATED_SLICES = {
  header: { width: WRAPPER.width, height: 250 },
  footer: { width: WRAPPER.width, height: 110 },
};
