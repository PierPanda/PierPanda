import { mkdir, readFile, writeFile } from "node:fs/promises";

const LOGIN = "PierPanda";
const OUTPUT_DIR = new URL("../assets/", import.meta.url);
const LOGOS_DIR = new URL("../assets/logos/", import.meta.url);
const GRAPHQL_URL = "https://api.github.com/graphql";
const LANGUAGE_WINDOW_YEARS = 3;
const TOP_LANGUAGES_COUNT = 5;
const ACTIVITY_WEEKS = 12;
const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
const TYPING_SECONDS_PER_CHAR = 0.06;

const MONO_FONT = `'JetBrains Mono','SF Mono',Menlo,Consolas,'Liberation Mono',monospace`;
const SANS_FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const MONO_CHAR_RATIO = 0.6;

const BRAND = { yellow: "#F5C518", amber: "#F59418", orange: "#E85D04", ink: "#0D1117" };
const BRAND_STOPS = [BRAND.yellow, BRAND.amber, BRAND.orange];
const BRAND_DEEP_STOPS = ["#C99A0A", "#C46F0B", "#A84203"];

const THEME = {
  panel: "#161B22",
  border: "#30363D",
  text: "#E6EDF3",
  muted: "#8B949E",
  accent: BRAND.yellow,
  accentStrong: BRAND.orange,
  inset: "#0D1117",
  live: "#3FB950",
  building: "#D29922",
};

const STATUS_LABELS = { live: "Live", building: "In progress" };

const PROJECTS = [
  {
    id: "detectivebox",
    kind: "client",
    name: "Detectivebox",
    summary: "Immersive detective game",
    stack: ["Next.js", "XState", "Tailwind", "Postgres"],
    status: "building",
  },
  {
    id: "jexplore",
    kind: "client",
    name: "Jexplore",
    summary: "Craft training — Web & VR",
    stack: ["Next.js", "GraphQL", "Zustand", "TanStack Query"],
    status: "building",
  },
  {
    id: "plai",
    kind: "client",
    name: "Plai",
    summary: "Royalty-free music streaming",
    stack: ["React Router", "Vite", "Tailwind", "Postgres"],
    status: "live",
  },
  {
    id: "bg-cleaner",
    kind: "personal",
    name: "BG Cleaner",
    summary: "Remove & edit image backgrounds in one click",
    stack: ["React", "React Router", "Tailwind", "Vercel"],
    status: "live",
  },
  {
    id: "astro",
    kind: "personal",
    name: "Astro",
    summary: "Explore the wonders of the solar system",
    stack: ["Vite", "JavaScript", "Three.js", "Tailwind"],
    status: "live",
  },
];

const STACK_GROUPS = [
  {
    label: "front-end",
    items: [
      { name: "React", icon: "react", color: "#61DAFB" },
      { name: "React Router", icon: "reactrouter", color: "#CA4245" },
      { name: "Next.js", icon: "nextdotjs", color: null },
      { name: "TypeScript", icon: "typescript", color: "#3178C6" },
      { name: "JavaScript", icon: "javascript", color: "#F7DF1E" },
      { name: "Three.js", icon: "threedotjs", color: null },
      { name: "Tailwind CSS", icon: "tailwindcss", color: "#06B6D4" },
      { name: "Sass", icon: "sass", color: "#CC6699" },
    ],
  },
  {
    label: "back-end & databases",
    items: [
      { name: "Node.js", icon: "nodedotjs", color: "#5FA04E" },
      { name: "Express", icon: "express", color: null },
      { name: "PostgreSQL", icon: "postgresql", color: "#4169E1" },
      { name: "MongoDB", icon: "mongodb", color: "#47A248" },
      { name: "GraphQL", icon: "graphql", color: "#E10098" },
    ],
  },
  {
    label: "tools & devops",
    items: [
      { name: "Git", icon: "git", color: "#F05032" },
      { name: "GitHub", icon: "github", color: null },
      { name: "Docker", icon: "docker", color: "#2496ED" },
      { name: "Vercel", icon: "vercel", color: null },
      { name: "Vite", icon: "vite", color: "#646CFF" },
      { name: "Nx", icon: "nx", color: "#8EA2C0" },
      { name: "Dokploy", icon: "dokploy", color: null },
    ],
  },
];

const TERMINAL_LINES = [
  { kind: "command", text: "whoami" },
  { kind: "field", key: "place", value: "France" },
  { kind: "field", key: "role", value: "Front-End / Full-Stack Developer" },
  { kind: "field", key: "stack", value: "React · Next.js · React Router · Node.js · TypeScript" },
  { kind: "field", key: "focus", value: "High-performance interfaces · UX-driven" },
  { kind: "field", key: "status", value: "Open to opportunities and projects", tone: "live" },
  { kind: "blank" },
  { kind: "command", text: "cat principles.md" },
  { kind: "principle", key: "Performance-first", value: "SSR, lazy loading, Lighthouse" },
  { kind: "principle", key: "TypeScript by default", value: "Fewer bugs, more peace of mind" },
  { kind: "principle", key: "Design & UX", value: "Tailwind, animations, details" },
  { kind: "principle", key: "Maintainability", value: "Solid architecture, tests" },
  { kind: "prompt" },
];

const PLACEHOLDER_STATS = {
  contributions: 0,
  pullRequests: 0,
  repositories: 0,
  stars: 0,
  weeklyActivity: Array(ACTIVITY_WEEKS).fill(0),
  topLanguages: [{ name: "TypeScript", percent: 100 }],
};

const XML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => XML_ENTITIES[char]);

const SHARED_STYLE = `
  .grow-x { transform-box: fill-box; transform-origin: left; animation: grow-x 1.2s cubic-bezier(.2,.8,.2,1) both; }
  .grow-y { transform-box: fill-box; transform-origin: bottom; animation: grow-y 1s cubic-bezier(.2,.8,.2,1) both; }
  .reveal { animation: fade-in .3s ease-out both; }
  .rise { animation: rise .8s cubic-bezier(.2,.8,.2,1) both; }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes fade-in { from { opacity: 0; } }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes grow-x { from { transform: scaleX(0); } }
  @keyframes grow-y { from { transform: scaleY(0); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes pulse { 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

function svgDocument({ width, height, label, style = "", body }) {
  const accessibility = label
    ? `role="img" aria-label="${escapeXml(label)}"`
    : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${accessibility}>
<style>${SHARED_STYLE}${style}</style>
${body}
</svg>
`;
}

function brandGradient(id, stops = BRAND_STOPS) {
  const [start, middle, end] = stops;
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${start}"/>
  <stop offset=".5" stop-color="${middle}"/>
  <stop offset="1" stop-color="${end}"/>
</linearGradient>`;
}

const waveGradients = () =>
  `<defs>${brandGradient("brand")}${brandGradient("brand-deep", BRAND_DEEP_STOPS)}</defs>`;

const panel = (theme, { width, height }) =>
  `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="12" fill="${theme.panel}" stroke="${theme.border}"/>`;

const monoWidth = (text, fontSize) => text.length * fontSize * MONO_CHAR_RATIO;

function blinkingCursor({ x, y, fontSize, color, delay }) {
  const timing = `animation: fade-in 0s ${delay}s both, blink 1.1s steps(1) ${delay}s infinite`;
  return `<rect x="${x}" y="${y - fontSize * 0.8}" width="${fontSize * 0.55}" height="${fontSize}" fill="${color}" style="${timing}"/>`;
}

function typedText({ id, text, x, y, fontSize, color, delay }) {
  const textWidth = monoWidth(text, fontSize);
  const duration = text.length * TYPING_SECONDS_PER_CHAR;
  const typing = `animation: grow-x ${duration}s steps(${text.length}) ${delay}s both`;
  return `<clipPath id="${id}">
    <rect x="${x}" y="${y - fontSize}" width="${textWidth}" height="${fontSize * 1.4}" class="grow-x" style="${typing}"/>
  </clipPath>
  <text x="${x}" y="${y}" font-family="${MONO_FONT}" font-size="${fontSize}" fill="${color}" textLength="${textWidth}" clip-path="url(#${id})">${escapeXml(text)}</text>
  ${blinkingCursor({ x: x + textWidth + 4, y, fontSize, color, delay: delay + duration })}`;
}

function wavePath({ width, baseline, amplitude, period, closeY }) {
  const half = period / 2;
  const segmentCount = Math.ceil((width + period) / half);
  const tail = Array(segmentCount - 1)
    .fill(`t${half},0`)
    .join(" ");
  return `M0,${baseline} q${period / 4},${-2 * amplitude} ${half},0 ${tail} V${closeY} H0 Z`;
}

function waveLayer({ id, size, wave, duration, gradientId }) {
  const path = wavePath({ width: size.width, ...wave });
  return `<style>
    .${id} { animation: ${id} ${duration}s linear infinite; }
    @keyframes ${id} { to { transform: translateX(-${wave.period}px); } }
  </style>
  <clipPath id="${id}"><path class="${id}" d="${path}"/></clipPath>
  <rect width="${size.width}" height="${size.height}" fill="url(#${gradientId})" clip-path="url(#${id})"/>`;
}

function renderHeader() {
  const size = { width: 1200, height: 250 };
  const tagline = "> I build interfaces that make sense.";
  const taglineX = (size.width - monoWidth(tagline, 18)) / 2;
  const body = `${waveGradients()}
  ${waveLayer({ id: "wave-back", size, wave: { baseline: 214, amplitude: 14, period: 600, closeY: 0 }, duration: 16, gradientId: "brand-deep" })}
  ${waveLayer({ id: "wave-front", size, wave: { baseline: 198, amplitude: 14, period: 400, closeY: 0 }, duration: 10, gradientId: "brand" })}
  <text x="600" y="92" class="rise" text-anchor="middle" font-family="${SANS_FONT}" font-size="60" font-weight="800" fill="${BRAND.ink}" letter-spacing="1">Pierre Bermudez</text>
  <text x="600" y="130" class="rise" style="animation-delay:.2s" text-anchor="middle" font-family="${SANS_FONT}" font-size="17" font-weight="600" fill="${BRAND.ink}" fill-opacity=".75" letter-spacing="5">FRONT-END / FULL-STACK DEVELOPER</text>
  ${typedText({ id: "tagline", text: tagline, x: taglineX, y: 170, fontSize: 18, color: BRAND.ink, delay: 0.9 })}`;
  return svgDocument({
    ...size,
    label: "Pierre Bermudez — Front-End / Full-Stack Developer",
    body,
  });
}

function renderFooter() {
  const size = { width: 1200, height: 110 };
  const body = `${waveGradients()}
  ${waveLayer({ id: "wave-back", size, wave: { baseline: 46, amplitude: 14, period: 600, closeY: size.height }, duration: 16, gradientId: "brand-deep" })}
  ${waveLayer({ id: "wave-front", size, wave: { baseline: 64, amplitude: 14, period: 400, closeY: size.height }, duration: 10, gradientId: "brand" })}`;
  return svgDocument({ ...size, body });
}

function renderDivider() {
  const size = { width: 1000, height: 12 };
  const style = `
    .glint { animation: glint 4s linear infinite; }
    @keyframes glint { from { transform: translateX(-160px); } to { transform: translateX(${size.width}px); } }`;
  const body = `<defs>${brandGradient("brand")}</defs>
  <line x1="0" y1="6" x2="${size.width}" y2="6" stroke="#8B949E" stroke-opacity=".35"/>
  <rect class="glint" y="5" width="160" height="2" rx="1" fill="url(#brand)"/>`;
  return svgDocument({ ...size, style, body });
}

function terminalPrompt(theme, command = "") {
  return `<tspan fill="${theme.accent}">pierre@github</tspan> <tspan fill="${theme.muted}">~</tspan> <tspan fill="${theme.accentStrong}">$</tspan> <tspan fill="${theme.text}">${escapeXml(command)}</tspan>`;
}

function renderTerminalLine(theme, line, position) {
  const { x, y } = position;
  const text = (content, offset = 0) => `<text x="${x + offset}" y="${y}">${content}</text>`;
  if (line.kind === "command") return text(terminalPrompt(theme, line.text));
  if (line.kind === "field") {
    const valueColor = line.tone === "live" ? theme.live : theme.text;
    return `${text(`<tspan fill="${theme.accent}">${escapeXml(line.key)}</tspan>`, 24)}${text(`<tspan fill="${valueColor}">${escapeXml(line.value)}</tspan>`, 140)}`;
  }
  if (line.kind === "principle") {
    return `${text(`<tspan fill="${theme.accentStrong}">▸</tspan> <tspan fill="${theme.text}">${escapeXml(line.key)}</tspan>`, 24)}${text(`<tspan fill="${theme.muted}">→ ${escapeXml(line.value)}</tspan>`, 340)}`;
  }
  if (line.kind === "prompt") return text(terminalPrompt(theme));
  return "";
}

function terminalWindowChrome(theme, width) {
  const dots = ["#FF5F57", "#FEBC2E", "#28C840"].map(
    (color, index) => `<circle cx="${28 + index * 20}" cy="24" r="6" fill="${color}"/>`,
  );
  return `${dots.join("")}
  <text x="${width / 2}" y="29" text-anchor="middle" font-family="${MONO_FONT}" font-size="14" fill="${theme.muted}">pierre@github: ~</text>
  <line x1="0" y1="48" x2="${width}" y2="48" stroke="${theme.border}"/>`;
}

function renderTerminal(theme) {
  const layout = {
    width: 1000,
    left: 32,
    top: 92,
    lineHeight: 30,
    fontSize: 18,
    stepSeconds: 0.18,
  };
  const height = layout.top + (TERMINAL_LINES.length - 1) * layout.lineHeight + 36;
  const lines = TERMINAL_LINES.map((line, index) => {
    const position = { x: layout.left, y: layout.top + index * layout.lineHeight };
    const delay = (0.2 + index * layout.stepSeconds).toFixed(2);
    return `<g class="reveal" style="animation-delay:${delay}s">${renderTerminalLine(theme, line, position)}</g>`;
  });
  const lastLineY = layout.top + (TERMINAL_LINES.length - 1) * layout.lineHeight;
  const promptWidth = monoWidth("pierre@github ~ $ ", layout.fontSize);
  const cursorDelay = 0.2 + TERMINAL_LINES.length * layout.stepSeconds;
  const body = `${panel(theme, { width: layout.width, height })}
  ${terminalWindowChrome(theme, layout.width)}
  <g font-family="${MONO_FONT}" font-size="${layout.fontSize}">${lines.join("\n  ")}</g>
  ${blinkingCursor({ x: layout.left + promptWidth, y: lastLineY, fontSize: layout.fontSize, color: theme.accent, delay: cursorDelay })}`;
  return svgDocument({
    width: layout.width,
    height,
    label:
      "pierre@github — Front-End / Full-Stack Developer based in France, open to opportunities",
    body,
  });
}

function statusText(theme, { status, x, y, fontSize }) {
  const color = theme[status];
  return `<text x="${x}" y="${y}" text-anchor="end" font-family="${SANS_FONT}" font-size="${fontSize}" fill="${theme.muted}"><tspan class="pulse" fill="${color}">●</tspan> ${STATUS_LABELS[status]}</text>`;
}

function renderClientRow(theme, project) {
  const size = { width: 1000, height: 110 };
  const body = `<defs><linearGradient id="brand-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BRAND.yellow}"/><stop offset="1" stop-color="${BRAND.orange}"/></linearGradient></defs>
  ${panel(theme, size)}
  <rect x="22" y="24" width="4" height="62" rx="2" fill="url(#brand-v)"/>
  <text x="46" y="50" font-family="${SANS_FONT}" font-size="26" font-weight="700" fill="${theme.text}">${escapeXml(project.name)}</text>
  <text x="46" y="82" font-family="${SANS_FONT}" font-size="17" fill="${theme.muted}">${escapeXml(project.summary)}</text>
  <text x="966" y="50" text-anchor="end" font-family="${MONO_FONT}" font-size="15" fill="${theme.accent}">${escapeXml(project.stack.join(" · "))}</text>
  ${statusText(theme, { status: project.status, x: 966, y: 82, fontSize: 15 })}`;
  return svgDocument({
    ...size,
    label: `${project.name} — ${project.summary} (${STATUS_LABELS[project.status]})`,
    body,
  });
}

function renderProjectCard(theme, project) {
  const size = { width: 500, height: 190 };
  const body = `<defs>${brandGradient("brand")}</defs>
  ${panel(theme, size)}
  <text x="32" y="58" font-family="${SANS_FONT}" font-size="26" font-weight="700" fill="${theme.text}">${escapeXml(project.name)} <tspan fill="${theme.accent}" font-size="20">↗</tspan></text>
  ${statusText(theme, { status: project.status, x: 468, y: 56, fontSize: 14 })}
  <text x="32" y="96" font-family="${SANS_FONT}" font-size="17" fill="${theme.muted}">${escapeXml(project.summary)}</text>
  <text x="32" y="144" font-family="${MONO_FONT}" font-size="14" fill="${theme.accent}">${escapeXml(project.stack.join(" · "))}</text>
  <rect x="32" y="162" width="436" height="3" rx="1.5" fill="url(#brand)" class="grow-x"/>`;
  return svgDocument({ ...size, label: `${project.name} — ${project.summary}`, body });
}

const renderProject = (theme, project) =>
  project.kind === "client" ? renderClientRow(theme, project) : renderProjectCard(theme, project);

function statsKpis(theme, stats) {
  const kpis = [
    ["Contributions / 1y", stats.contributions],
    ["Pull requests / 1y", stats.pullRequests],
    ["Public repos", stats.repositories],
    ["Stars", stats.stars],
  ];
  return kpis
    .map(
      (
        [label, value],
        index,
      ) => `<g transform="translate(${36 + index * 236} 92)" class="reveal" style="animation-delay:${index * 0.1}s">
    <text font-family="${SANS_FONT}" font-size="13" fill="${theme.muted}" letter-spacing="1">${escapeXml(label.toUpperCase())}</text>
    <text y="40" font-family="${SANS_FONT}" font-size="32" font-weight="700" fill="${theme.text}">${value.toLocaleString("en-US")}</text>
  </g>`,
    )
    .join("");
}

function statsActivity(theme, weeklyActivity) {
  const chart = { x: 36, baseY: 350, maxHeight: 120, barWidth: 28, gap: 10 };
  const peak = Math.max(1, ...weeklyActivity);
  const bars = weeklyActivity.map((count, index) => {
    const barHeight = Math.max(2, Math.round((count / peak) * chart.maxHeight));
    const x = chart.x + index * (chart.barWidth + chart.gap);
    return `<rect x="${x}" y="${chart.baseY - barHeight}" width="${chart.barWidth}" height="${barHeight}" rx="3" fill="url(#brand)" class="grow-y" style="animation-delay:${(0.3 + index * 0.05).toFixed(2)}s"><title>${count} contributions</title></rect>`;
  });
  return `<text x="${chart.x}" y="204" font-family="${SANS_FONT}" font-size="13" fill="${theme.muted}" letter-spacing="1">LAST ${ACTIVITY_WEEKS} WEEKS</text>
  ${bars.join("")}`;
}

function statsLanguages(theme, topLanguages) {
  const column = { x: 540, width: 424, top: 236, rowHeight: 30 };
  const leaderPercent = topLanguages[0]?.percent ?? 100;
  const rows = topLanguages.map(({ name, percent }, index) => {
    const y = column.top + index * column.rowHeight;
    const barWidth = ((percent / leaderPercent) * column.width).toFixed(1);
    return `<text x="${column.x}" y="${y}" font-family="${MONO_FONT}" font-size="14" fill="${theme.text}">${escapeXml(name)}</text>
    <text x="${column.x + column.width}" y="${y}" text-anchor="end" font-family="${MONO_FONT}" font-size="14" fill="${theme.muted}">${percent.toFixed(1)}%</text>
    <rect x="${column.x}" y="${y + 7}" width="${column.width}" height="5" rx="2.5" fill="${theme.border}"/>
    <rect x="${column.x}" y="${y + 7}" width="${barWidth}" height="5" rx="2.5" fill="url(#brand)" class="grow-x" style="animation-delay:${(0.4 + index * 0.1).toFixed(2)}s"/>`;
  });
  return `<text x="${column.x}" y="204" font-family="${SANS_FONT}" font-size="13" fill="${theme.muted}" letter-spacing="1">TOP LANGUAGES · LAST ${LANGUAGE_WINDOW_YEARS} YEARS</text>
  ${rows.join("")}`;
}

function renderStats(theme, stats) {
  const size = { width: 1000, height: 380 };
  const body = `<defs>${brandGradient("brand")}</defs>
  ${panel(theme, size)}
  <text x="36" y="48" font-family="${MONO_FONT}" font-size="16" fill="${theme.accent}">~/ stats <tspan fill="${theme.muted}">--github</tspan></text>
  ${statsKpis(theme, stats)}
  <line x1="36" y1="166" x2="964" y2="166" stroke="${theme.border}"/>
  ${statsActivity(theme, stats.weeklyActivity)}
  ${statsLanguages(theme, stats.topLanguages)}`;
  return svgDocument({
    ...size,
    label: `GitHub activity: ${stats.contributions} contributions in the last year`,
    body,
  });
}

const STACK_LAYOUT = {
  width: 1000,
  left: 36,
  right: 964,
  top: 44,
  labelGap: 18,
  chipHeight: 40,
  chipGap: 10,
  groupGap: 34,
  paddingX: 14,
  iconSize: 20,
  iconGap: 10,
  fontSize: 15,
  staggerSeconds: 0.04,
};

const chipWidth = (name) =>
  STACK_LAYOUT.paddingX * 2 +
  STACK_LAYOUT.iconSize +
  STACK_LAYOUT.iconGap +
  monoWidth(name, STACK_LAYOUT.fontSize);

function layoutChips(items, startY) {
  const { left, right, chipHeight, chipGap } = STACK_LAYOUT;
  const chips = [];
  let cursor = { x: left, y: startY };
  for (const item of items) {
    const width = chipWidth(item.name);
    const isOverflowing = cursor.x + width > right && cursor.x > left;
    if (isOverflowing) cursor = { x: left, y: cursor.y + chipHeight + chipGap };
    chips.push({ item, x: cursor.x, y: cursor.y, width });
    cursor = { x: cursor.x + width + chipGap, y: cursor.y };
  }
  return { chips, endY: cursor.y + chipHeight };
}

function layoutStack() {
  const groups = [];
  let y = STACK_LAYOUT.top;
  for (const group of STACK_GROUPS) {
    const labelY = y + STACK_LAYOUT.labelGap;
    const { chips, endY } = layoutChips(group.items, labelY + 14);
    groups.push({ label: group.label, labelY, chips });
    y = endY + STACK_LAYOUT.groupGap;
  }
  return { groups, height: y - STACK_LAYOUT.groupGap + 36 };
}

function renderChip(theme, { chip, icon, delay }) {
  const { chipHeight, paddingX, iconSize, iconGap, fontSize } = STACK_LAYOUT;
  const iconY = chip.y + (chipHeight - iconSize) / 2;
  const iconColor = chip.item.color ?? theme.text;
  return `<g class="reveal" style="animation-delay:${delay.toFixed(2)}s">
    <rect x="${chip.x}" y="${chip.y}" width="${chip.width}" height="${chipHeight}" rx="8" fill="${theme.inset}" stroke="${theme.border}"/>
    <svg x="${chip.x + paddingX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="${icon.viewBox}"><path fill="${iconColor}" fill-rule="${icon.fillRule}" d="${icon.path}"/></svg>
    <text x="${chip.x + paddingX + iconSize + iconGap}" y="${chip.y + chipHeight / 2 + fontSize * 0.35}" font-family="${MONO_FONT}" font-size="${fontSize}" fill="${theme.text}">${escapeXml(chip.item.name)}</text>
  </g>`;
}

function renderStack(theme, icons) {
  const { groups, height } = layoutStack();
  let chipIndex = 0;
  const groupMarkup = groups.map(({ label, labelY, chips }) => {
    const chipMarkup = chips.map((chip) => {
      const delay = 0.2 + chipIndex++ * STACK_LAYOUT.staggerSeconds;
      return renderChip(theme, { chip, icon: icons.get(chip.item.icon), delay });
    });
    return `<text x="${STACK_LAYOUT.left}" y="${labelY}" font-family="${MONO_FONT}" font-size="14" fill="${theme.accent}">${escapeXml(label)}<tspan fill="${theme.muted}">/</tspan></text>
  ${chipMarkup.join("")}`;
  });
  const names = STACK_GROUPS.flatMap((group) => group.items.map((item) => item.name)).join(", ");
  const size = { width: STACK_LAYOUT.width, height };
  return svgDocument({
    ...size,
    label: `Tech stack: ${names}`,
    body: `${panel(theme, size)}\n  ${groupMarkup.join("\n  ")}`,
  });
}

const STATS_QUERY = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes { stargazerCount pushedAt languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
    contributionsCollection {
      totalPullRequestContributions
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } }
    }
  }
}`;

async function fetchGitHubUser(token) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": LOGIN,
    },
    body: JSON.stringify({ query: STATS_QUERY, variables: { login: LOGIN } }),
  });
  if (!response.ok) throw new Error(`GitHub GraphQL request failed with status ${response.status}`);
  const payload = await response.json();
  if (payload.errors) throw new Error(`GitHub GraphQL errors: ${JSON.stringify(payload.errors)}`);
  const user = payload.data?.user;
  if (!user) throw new Error(`GitHub user ${LOGIN} not found`);
  return user;
}

function computeTopLanguages(repositories) {
  const windowStart = Date.now() - LANGUAGE_WINDOW_YEARS * MS_PER_YEAR;
  const recentRepositories = repositories.filter(
    (repository) => Date.parse(repository.pushedAt) > windowStart,
  );
  const bytesByLanguage = new Map();
  for (const repository of recentRepositories) {
    for (const { size, node } of repository.languages.edges) {
      bytesByLanguage.set(node.name, (bytesByLanguage.get(node.name) ?? 0) + size);
    }
  }
  const totalBytes = [...bytesByLanguage.values()].reduce((sum, bytes) => sum + bytes, 0) || 1;
  return [...bytesByLanguage]
    .sort((first, second) => second[1] - first[1])
    .slice(0, TOP_LANGUAGES_COUNT)
    .map(([name, bytes]) => ({ name, percent: (bytes / totalBytes) * 100 }));
}

function summarizeStats(user) {
  const { contributionCalendar, totalPullRequestContributions } = user.contributionsCollection;
  const repositories = user.repositories.nodes;
  const weeklyActivity = contributionCalendar.weeks
    .slice(-ACTIVITY_WEEKS)
    .map((week) => week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0));
  return {
    contributions: contributionCalendar.totalContributions,
    pullRequests: totalPullRequestContributions,
    repositories: user.repositories.totalCount,
    stars: repositories.reduce((sum, repository) => sum + repository.stargazerCount, 0),
    weeklyActivity,
    topLanguages: computeTopLanguages(repositories),
  };
}

async function loadStats() {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) {
    console.warn("No GITHUB_TOKEN: stats.svg uses placeholder values.");
    return PLACEHOLDER_STATS;
  }
  return summarizeStats(await fetchGitHubUser(token));
}

function parseIcon(slug, iconSvg) {
  const path = iconSvg.match(/<path[^>]*\sd="([^"]+)"/)?.[1];
  const viewBox = iconSvg.match(/viewBox="([^"]+)"/)?.[1];
  if (!path || !viewBox) throw new Error(`assets/logos/${slug}.svg needs a viewBox and one path`);
  const fillRule = iconSvg.match(/fill-rule="([^"]+)"/)?.[1] ?? "nonzero";
  return { path, viewBox, fillRule };
}

async function loadIcons() {
  const slugs = STACK_GROUPS.flatMap((group) => group.items.map((item) => item.icon));
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const iconSvg = await readFile(new URL(`${slug}.svg`, LOGOS_DIR), "utf8");
      return [slug, parseIcon(slug, iconSvg)];
    }),
  );
  return new Map(entries);
}

const writeAsset = (name, svg) => writeFile(new URL(`${name}.svg`, OUTPUT_DIR), svg);

const stats = await loadStats();
await mkdir(OUTPUT_DIR, { recursive: true });
await writeAsset("header", renderHeader());
await writeAsset("footer", renderFooter());
await writeAsset("divider", renderDivider());
await writeAsset("terminal", renderTerminal(THEME));
await writeAsset("stats", renderStats(THEME, stats));
await writeAsset("stack", renderStack(THEME, await loadIcons()));
for (const project of PROJECTS)
  await writeAsset(`project-${project.id}`, renderProject(THEME, project));
console.log("Assets written.", {
  contributions: stats.contributions,
  languages: stats.topLanguages.map(({ name }) => name),
});
