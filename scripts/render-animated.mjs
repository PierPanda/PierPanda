import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright-core";
import {
  ANIMATED_SLICES,
  BRAND,
  MONO_FONT,
  SANS_FONT,
  THEME,
  WRAPPER,
  WRAPPER_DECOR,
} from "./theme.mjs";

const LOOP_SECONDS = 8;
const FRAMES_PER_SECOND = 24;
const PIXEL_RATIO = 2;
const WEBP_QUALITY = 70;
const SHADERS_DIR = new URL("./shaders/", import.meta.url);
const OUTPUT_DIR = new URL("../assets/", import.meta.url);
const runCommand = promisify(execFile);

const TEXT_SHADOW = "rgba(5, 10, 8, 0.9)";
const HEADER_TEXT = [
  {
    text: "Pierre Bermudez",
    y: 92,
    font: `800 60px ${SANS_FONT}`,
    color: "#F0F6F2",
    letterSpacing: 1,
  },
  {
    text: "FRONT-END / FULL-STACK DEVELOPER",
    y: 130,
    font: `600 17px ${SANS_FONT}`,
    color: "#A7B3BF",
    letterSpacing: 5,
  },
  {
    text: "> I build interfaces that make sense.",
    y: 170,
    font: `18px ${MONO_FONT}`,
    color: BRAND.light,
    letterSpacing: 0,
  },
];

const SCENES = [
  { name: "header", size: ANIMATED_SLICES.header, roundedEdge: "top", lines: HEADER_TEXT },
  { name: "footer", size: ANIMATED_SLICES.footer, roundedEdge: "bottom", lines: [] },
];

function glslColor(hex) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  return `vec3(${channels.map((channel) => channel.toFixed(4)).join(", ")})`;
}

function glslDefines() {
  const defines = {
    CARD_WIDTH: WRAPPER.width.toFixed(1),
    BRAND_LIGHT: glslColor(BRAND.light),
    BRAND_MID: glslColor(BRAND.mid),
    BRAND_STRONG: glslColor(BRAND.strong),
    WRAPPER_FILL: glslColor(WRAPPER.fill),
    HALO_COLOR: glslColor(WRAPPER_DECOR.haloColor),
    HALO_OPACITY: WRAPPER_DECOR.haloOpacity.toFixed(3),
    HALO_RADIUS: WRAPPER_DECOR.haloRadius.toFixed(1),
    HALO_FLATTEN: WRAPPER_DECOR.haloFlatten.toFixed(3),
  };
  return Object.entries(defines)
    .map(([name, value]) => `#define ${name} ${value}`)
    .join("\n");
}

async function fragmentSource(sceneName) {
  const [common, scene] = await Promise.all([
    readFile(new URL("common.glsl", SHADERS_DIR), "utf8"),
    readFile(new URL(`${sceneName}.frag`, SHADERS_DIR), "utf8"),
  ]);
  return `precision highp float;\n${glslDefines()}\n${common}\n${scene}`;
}

function setUpScene({
  source,
  size,
  pixelRatio,
  roundedEdge,
  radius,
  borderColor,
  lines,
  shadowColor,
  loop,
}) {
  const width = size.width * pixelRatio;
  const height = size.height * pixelRatio;
  const shaderCanvas = Object.assign(document.createElement("canvas"), { width, height });
  const gl = shaderCanvas.getContext("webgl", { preserveDrawingBuffer: true });
  const compile = (type, code) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(
    program,
    compile(gl.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }"),
  );
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(program, "r"), width, height);
  gl.uniform1f(gl.getUniformLocation(program, "loop"), loop);
  const timeLocation = gl.getUniformLocation(program, "t");

  const frameCanvas = Object.assign(document.createElement("canvas"), { width, height });
  const context = frameCanvas.getContext("2d");
  const isTop = roundedEdge === "top";
  const edgeY = (y) => (isTop ? y : size.height - y);

  const outline = (inset) => {
    const path = new Path2D();
    const left = inset;
    const right = size.width - inset;
    const corner = radius - inset;
    path.moveTo(left, edgeY(size.height));
    path.lineTo(left, edgeY(radius));
    path.arcTo(left, edgeY(inset), left + corner, edgeY(inset), corner);
    path.lineTo(right - corner, edgeY(inset));
    path.arcTo(right, edgeY(inset), right, edgeY(radius), corner);
    path.lineTo(right, edgeY(size.height));
    return path;
  };

  const drawText = () => {
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    for (const line of lines) {
      context.font = line.font;
      context.letterSpacing = `${line.letterSpacing}px`;
      context.fillStyle = line.color;
      for (const blur of [8, 3]) {
        context.shadowColor = shadowColor;
        context.shadowBlur = blur * pixelRatio;
        context.fillText(line.text, size.width / 2, line.y);
      }
    }
    context.shadowBlur = 0;
  };

  window.renderFrame = (time) => {
    gl.uniform1f(timeLocation, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    context.save();
    const fill = outline(0);
    fill.closePath();
    context.clip(fill);
    context.drawImage(shaderCanvas, 0, 0, size.width, size.height);
    drawText();
    context.restore();
    context.strokeStyle = borderColor;
    context.lineWidth = 1;
    context.stroke(outline(0.5));
    return frameCanvas.toDataURL("image/png");
  };
}

async function renderFrames(page, scene, framesDir) {
  await page.evaluate(setUpScene, {
    source: await fragmentSource(scene.name),
    size: scene.size,
    pixelRatio: PIXEL_RATIO,
    roundedEdge: scene.roundedEdge,
    radius: WRAPPER.radius,
    borderColor: THEME.border,
    lines: scene.lines,
    shadowColor: TEXT_SHADOW,
    loop: LOOP_SECONDS,
  });
  const frameCount = LOOP_SECONDS * FRAMES_PER_SECOND;
  const framePaths = [];
  for (let index = 0; index < frameCount; index++) {
    const dataUrl = await page.evaluate(
      (time) => window.renderFrame(time),
      index / FRAMES_PER_SECOND,
    );
    const framePath = join(framesDir, `${scene.name}-${String(index).padStart(4, "0")}.png`);
    await writeFile(framePath, Buffer.from(dataUrl.split(",")[1], "base64"));
    framePaths.push(framePath);
  }
  return framePaths;
}

async function encodeWebp(framePaths, outputPath) {
  const frameDuration = Math.round(1000 / FRAMES_PER_SECOND);
  await runCommand(
    "img2webp",
    [
      "-loop",
      "0",
      "-lossy",
      "-q",
      String(WEBP_QUALITY),
      "-m",
      "6",
      "-d",
      String(frameDuration),
      ...framePaths,
      "-o",
      outputPath,
    ],
    {
      maxBuffer: 1024 * 1024 * 16,
    },
  );
}

const framesDir = await mkdtemp(join(tmpdir(), "profile-frames-"));
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const scene of SCENES) {
    const page = await browser.newPage();
    await page.setContent("<!DOCTYPE html><html><body></body></html>");
    const framePaths = await renderFrames(page, scene, framesDir);
    const outputPath = fileURLToPath(new URL(`${scene.name}.webp`, OUTPUT_DIR));
    await encodeWebp(framePaths, outputPath);
    await page.close();
    console.log(`${scene.name}.webp written (${framePaths.length} frames)`);
  }
} finally {
  await browser.close();
  await rm(framesDir, { recursive: true, force: true });
}
