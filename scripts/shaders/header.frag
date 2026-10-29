const float GLITCH_PERIOD = 4.;
const float SEAM_FADE = 40.;

void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float u = unit();
  vec2 pixel = gl_FragCoord.xy;
  float glitchWindow = step(.94, fract(t / GLITCH_PERIOD));
  float glitchBand = hash1(floor(t / GLITCH_PERIOD) + 3.);
  float inGlitch = glitchWindow * (1. - step(.035, abs(uv.y - glitchBand)));
  pixel.x += inGlitch * (hash1(floor(t * 30.)) - .5) * 60. * u;

  vec3 col = rainBackground(uv, .08);
  float halo = smoothstep(.25, 1.05, length((uv - vec2(.5, .62)) * vec2(1.75, 2.9)));
  col += rain(pixel) * mix(.07, 1., halo);
  col *= mix(.72, 1., halo);
  col.r += inGlitch * .05;
  col.b += inGlitch * .04;
  col *= 1. - .4 * pow(length((uv - .5) * vec2(1., 1.6)), 2.);

  vec2 cardPoint = vec2(gl_FragCoord.x, r.y - gl_FragCoord.y) / u;
  float seam = smoothstep(r.y / u - SEAM_FADE, r.y / u, cardPoint.y);
  col = mix(col, wrapperColor(cardPoint, r.y / u), seam);
  gl_FragColor = vec4(col, 1.);
}
