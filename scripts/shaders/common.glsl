uniform vec2 r;
uniform float t;
uniform float loop;

const float TAU = 6.2831853;

float unit() {
  return r.x / CARD_WIDTH;
}

vec3 ramp(float x) {
  x = clamp(x, 0., 1.);
  return x < .5 ? mix(BRAND_LIGHT, BRAND_MID, x * 2.) : mix(BRAND_MID, BRAND_STRONG, (x - .5) * 2.);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash1(float n) {
  return fract(sin(n * 91.3458) * 47453.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}

float perLoop(float frequency) {
  return max(1., floor(frequency * loop + .5)) / loop;
}

vec2 loopCircle(float radius) {
  float angle = TAU * t / loop;
  return radius * vec2(cos(angle), sin(angle));
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * h);
}

float glyph(vec2 q, float id, float softness) {
  vec2 p = (q - .5) * vec2(1., 1.45);
  float d = 10.;
  if (hash1(id * 1.3 + 1.) > .45) d = min(d, segmentDistance(p, vec2(-.22, .5), vec2(.22, .5)));
  if (hash1(id * 1.3 + 2.) > .5) d = min(d, segmentDistance(p, vec2(-.22, 0.), vec2(.22, 0.)));
  if (hash1(id * 1.3 + 3.) > .45) d = min(d, segmentDistance(p, vec2(-.22, -.5), vec2(.22, -.5)));
  if (hash1(id * 1.3 + 4.) > .45) d = min(d, segmentDistance(p, vec2(-.25, .45), vec2(-.25, .05)));
  if (hash1(id * 1.3 + 5.) > .45) d = min(d, segmentDistance(p, vec2(.25, .45), vec2(.25, .05)));
  if (hash1(id * 1.3 + 6.) > .45) d = min(d, segmentDistance(p, vec2(-.25, -.05), vec2(-.25, -.45)));
  if (hash1(id * 1.3 + 7.) > .45) d = min(d, segmentDistance(p, vec2(.25, -.05), vec2(.25, -.45)));
  if (hash1(id * 1.3 + 8.) > .7) d = min(d, segmentDistance(p, vec2(-.2, .42), vec2(.2, -.42)));
  float stroke = .075;
  return 1. - smoothstep(stroke - softness, stroke + softness, d);
}

// One plane of falling glyphs. Layer 0 is far (small, soft, dim), layer 2 is near.
vec3 rainLayer(vec2 pixel, float layer) {
  float u = unit();
  vec2 size = vec2(10., 15.) * (1. + layer * .55) * u;
  vec2 p = vec2(pixel.x + layer * 37. * u, r.y - pixel.y);
  vec2 cell = floor(p / size);
  vec2 q = fract(p / size);
  float columnSeed = cell.x + layer * 101.;
  float density = .55 - layer * .17;
  if (hash1(columnSeed * 3.7) > density) return vec3(0.);
  float rows = r.y / size.y;
  float heightScale = 250. * u / r.y;
  float speed = perLoop((.18 + .22 * hash1(columnSeed + 2.)) * (1. + layer * .45) * heightScale);
  float trailLength = .35 + .45 * hash1(columnSeed + 9.);
  float head = fract(hash1(columnSeed + 5.) + t * speed) * (1. + trailLength);
  float behind = head - cell.y / rows;
  if (behind < 0. || behind > trailLength) return vec3(0.);
  float fade = 1. - behind / trailLength;
  float isHead = 1. - step(1.2 / rows, behind);
  float changeRate = perLoop(1. + 5. * hash(cell + 3.)) * step(.7, hash(cell + 7.));
  float glyphId = floor(hash(cell) * 40. + floor(t * changeRate) + cell.y);
  float softness = (.02 + (2. - layer) * .045) / (1. + layer);
  float shape = glyph(q, glyphId + columnSeed * 13., softness);
  float bloomDistance = length((q - .5) * vec2(1., 1.4));
  float bloom = exp(-bloomDistance * 4.5) * (1. - smoothstep(.28, .5, bloomDistance));
  vec3 trailColor = ramp(behind / trailLength * 1.2) * pow(fade, 1.6);
  vec3 headColor = mix(vec3(.95, 1., .9), BRAND_LIGHT, .25);
  vec3 color = mix(trailColor, headColor, isHead);
  float depthLight = .35 + layer * .32;
  return color * (shape + bloom * (.18 + isHead * .55)) * depthLight;
}

vec3 rain(vec2 pixel) {
  vec3 total = vec3(0.);
  for (int i = 0; i < 3; i++) total += rainLayer(pixel, float(i));
  return total;
}

vec3 rainBackground(vec2 uv, float glowAtBottom) {
  float aspect = r.x / r.y;
  vec3 col = mix(vec3(.015, .07, .055), vec3(.03, .04, .05), smoothstep(0., 1., uv.y));
  float shafts = pow(noise(vec2(uv.x * aspect * 3., 0.) + loopCircle(.35)), 4.);
  col += BRAND_STRONG * shafts * .12;
  col += BRAND_STRONG * glowAtBottom * exp(-pow(uv.y * 3.2, 2.));
  return col;
}

// The wrapper fill and its halo, as drawn behind the SVG slices, at a point in card units.
vec3 wrapperColor(vec2 cardPoint, float haloCenterY) {
  vec2 offset = cardPoint - vec2(CARD_WIDTH / 2., haloCenterY);
  float distanceToHalo = length(vec2(offset.x, offset.y / HALO_FLATTEN)) / HALO_RADIUS;
  return mix(WRAPPER_FILL, HALO_COLOR, HALO_OPACITY * clamp(1. - distanceToHalo, 0., 1.));
}
