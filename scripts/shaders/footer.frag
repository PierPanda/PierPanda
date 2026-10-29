const float HORIZON = .42;
const float SEAM_FADE = 40.;

vec3 drops(vec2 uv, inout float displacement) {
  float aspect = r.x / r.y;
  vec2 point = vec2(uv.x * aspect, uv.y);
  vec3 light = vec3(0.);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float dropsPerLoop = 2. + floor(hash1(fi + 1.) * 2.);
    float cycle = t / (loop / dropsPerLoop) + hash1(fi + 2.);
    float life = fract(cycle);
    float seed = mod(floor(cycle), dropsPerLoop) + fi * 17.;
    float x0 = (.08 + .84 * hash1(seed)) * aspect;
    float y0 = HORIZON - .05 - .2 * hash1(seed + 4.);
    float fallEnd = .22;
    if (life < fallEnd) {
      float fall = life / fallEnd;
      float dropY = mix(1.1, y0, fall * fall);
      vec2 toDrop = (point - vec2(x0, dropY)) * vec2(1., .28);
      light += mix(vec3(.95, 1., .9), BRAND_LIGHT, .3) * exp(-length(toDrop) / .0045) * 1.4;
      continue;
    }
    float ripple = (life - fallEnd) / (1. - fallEnd);
    float d = length((point - vec2(x0, y0)) * vec2(1., 4.2));
    for (int k = 0; k < 3; k++) {
      float age = ripple - float(k) * .12;
      if (age <= 0.) continue;
      float radius = age * .32;
      float strength = (1. - age) * (1. - float(k) * .3);
      float ring = exp(-pow((d - radius) / (.006 + age * .01), 2.)) * strength;
      light += mix(BRAND_MID, BRAND_LIGHT, .4) * ring * .75 * step(uv.y, HORIZON);
      displacement += sin((d - radius) * 140.) * exp(-abs(d - radius) * 28.) * strength;
    }
    light += mix(vec3(1.), BRAND_LIGHT, .3) * exp(-d / .02) * pow(1. - ripple, 6.) * .9;
    float splash = ripple / .35;
    if (splash > 1.) continue;
    for (int j = 0; j < 6; j++) {
      float fj = float(j);
      vec2 velocity = vec2((hash1(seed + fj * 3.) - .5) * .12, .18 + .14 * hash1(seed + fj * 5.));
      vec2 droplet = vec2(x0, y0) + velocity * splash - vec2(0., .32 * splash * splash);
      light += BRAND_LIGHT * exp(-length(point - droplet) / .0035) * (1. - splash) * .9;
    }
  }
  return light;
}

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float u = unit();
  vec2 pixel = gl_FragCoord.xy;
  vec3 col = rainBackground(uv, 0.);
  float displacement = 0.;
  vec3 light = drops(uv, displacement);
  if (uv.y > HORIZON) {
    col += rain(pixel) * smoothstep(1., .45, uv.y) * 1.05;
  } else {
    float depth = (HORIZON - uv.y) / HORIZON;
    float wobble = sin(uv.y * 90. + TAU * 4. * t / loop) * 2. * depth;
    vec2 mirrored = vec2(pixel.x + (wobble + displacement * 7.) * u, 2. * HORIZON * r.y - pixel.y);
    col += rain(mirrored) * .38 * (1. - depth);
    col = mix(col, BRAND_STRONG * .1, depth * .55);
  }
  col += mix(BRAND_MID, BRAND_LIGHT, .5) * exp(-pow((uv.y - HORIZON) * r.y / (1.6 * u), 2.)) * .85;
  col += BRAND_STRONG * .28 * exp(-abs(uv.y - HORIZON) * 10.);
  col += light;

  vec2 cardPoint = vec2(gl_FragCoord.x, r.y - gl_FragCoord.y) / u;
  float seam = 1. - smoothstep(0., SEAM_FADE, cardPoint.y);
  col = mix(col, wrapperColor(cardPoint, 0.), seam);
  gl_FragColor = vec4(col, 1.);
}
