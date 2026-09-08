export const landscapeVertex = `
varying vec2 vUv;
uniform float uTime;
uniform float uWaterLine;
void main() {
  vUv = uv;
  vec3 p = position;
  float water = 1.0 - smoothstep(uWaterLine - .04, uWaterLine + .04, uv.y);
  p.z += water * sin(uv.x * 70.0 + uTime * 1.7) * .012;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const landscapeFragment = `
uniform sampler2D uMap;
uniform float uTime;
uniform float uWaterLine;
uniform float uWaves;
uniform float uFog;
uniform float uNight;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main() {
  vec2 uv = vUv;
  float water = 1.0 - smoothstep(uWaterLine - .035, uWaterLine + .035, uv.y);
  float depth = max(0.0, uWaterLine - uv.y);
  float amplitude = (.0015 + depth * .009) * uWaves * water;
  float swell = sin(uv.y * 95.0 - uTime * 2.1 + sin(uv.x * 21.0));
  uv.x += swell * amplitude + sin(uv.y * 230.0 + uTime * 2.8) * amplitude * .32;
  uv.y += sin(uv.x * 110.0 + uTime * 1.6) * amplitude * .5;
  vec4 color = texture2D(uMap, clamp(uv, .001, .999));
  float crest = pow(max(0.0, sin(uv.y * 165.0 + uTime * 2.2 + sin(uv.x * 26.0))), 16.0);
  color.rgb += water * crest * depth * .1 * uWaves;
  float lowMist = exp(-pow((vUv.y - uWaterLine) * 10.0, 2.0));
  float mist = noise(vec2(vUv.x * 6.0 - uTime * .07, vUv.y * 13.0 + uTime * .024));
  color.rgb = mix(color.rgb, vec3(.46,.56,.65), lowMist * mist * uFog * .34);
  float warm = smoothstep(.1,.3,color.r-color.b) * smoothstep(.35,.7,color.r);
  color.rgb += warm * uNight * (.016 + sin(uTime * 1.6 + vUv.x * 120.0) * .015);
  gl_FragColor = vec4(color.rgb, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const sailVertex = `
varying vec2 vUv;
uniform float uTime;
void main() {
  vUv=uv; vec3 p=position;
  float sail = smoothstep(.24,.4,uv.y) * (1.0-smoothstep(.76,.82,uv.y));
  p.z += sin(uv.x * 9.0 + uTime * 2.3) * sin(uv.y * 6.0) * sail * .065;
  p.x += sin(uv.y * 14.0 + uTime * 1.7) * sail * .013;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
export const sailFragment = `
uniform sampler2D uMap;
varying vec2 vUv;
void main(){ gl_FragColor=texture2D(uMap,vUv); if(gl_FragColor.a<.02)discard;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const wingVertex = `
uniform float uFlex;
varying vec2 vUv;
void main(){
  vUv=uv; vec3 p=position;
  float tip=clamp(length(position.xy)/.8,0.0,1.0);
  p.z += uFlex * tip * tip * .18;
  p.y += uFlex * tip * tip * .025;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

export const passageVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const passageFragment = `
uniform sampler2D uMap;
uniform float uTime;
uniform float uCover;
uniform float uWater;
varying vec2 vUv;
void main(){
  vec2 uv=(vUv-.5)/(1.0+uCover*.9)+.5;
  uv.x+=sin(uv.y*34.0+uTime*1.6)*.007*uWater;
  uv.y+=sin(uv.x*50.0-uTime*2.0)*.008*uWater;
  vec4 c=texture2D(uMap,clamp(uv,.001,.999));
  float center=1.0-length(vUv-.5)*.7;
  float alpha=clamp(uCover*1.75-(1.0-center)*.65,0.0,1.0);
  gl_FragColor=vec4(c.rgb,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
