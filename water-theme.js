import * as THREE from './vendor/three.module.js';

const vertex=`
uniform float time;uniform vec3 pointerWorld;uniform float pointerStrength;uniform float hoverBoost;uniform float interactivePiece;uniform vec4 ripples[6];uniform float boardSurface;uniform float motion;
uniform sampler2D behindScene;uniform sampler2D behindDepth;uniform sampler2D frontDepth;uniform vec2 screenSize;uniform float captureMode;
varying vec3 waterPosition;varying vec3 waterNormal;
float wave(vec3 p){
 float distanceToMouse=length(p.xz-pointerWorld.xz);
 float hover=exp(-distanceToMouse*distanceToMouse*1.5)*pointerStrength;
 vec2 drift=vec2(sin(time*.17)*1.8,cos(time*.13)*1.4);
 float basinA=length(p.xz-vec2(-1.7,1.2)-drift);
 float basinB=length(p.xz-vec2(2.4,-1.6)+drift*.7);
 float warp=sin(p.x*1.1+sin(p.z*1.4+time*.21));
 float value=sin(basinA*4.5-time*.9+warp)*.018;
 value+=sin(basinB*6.2+time*.62+sin(p.z*1.7))*.012;
 value+=sin(p.x*2.7+time*.43)*cos(p.z*3.9-time*.37)*.013;
 value+=sin(distanceToMouse*12.-time*5.)*hover*(interactivePiece>.5?.048:(boardSurface>.5?.070:.075));
 // Uneven liquid lobes break the manufactured contour at several scales.
 value+=sin(p.x*4.7+p.y*5.3+sin(p.z*3.8-time*.55))*cos(p.z*4.2+p.y*2.8+time*.6)*.048;
 value+=sin(p.x*10.4-p.y*8.1+p.z*7.7-time*.85)*.013;
 for(int i=0;i<6;i++){
  float age=time-ripples[i].z,d=length(p.xz-ripples[i].xy);
  float front=d-age*2.5;
  float response=ripples[i].w>1.5?interactivePiece:1.;
  value+=sin(front*12.)*exp(-front*front*2.6)*exp(-age*1.1)*ripples[i].w*.11*response;
 }
 return value*motion;
}
void main(){
 vec3 world=(modelMatrix*vec4(position,1.)).xyz;
 vec3 n=normalize(mat3(modelMatrix)*normal);
 float height=wave(world);
 world+=n*height*(boardSurface>.5?1.2:1.45);
 // Slow, broad changes in form instead of sharp concentric hover pulses.
 float nearHover=exp(-dot(world.xz-pointerWorld.xz,world.xz-pointerWorld.xz)*1.5);
 float fluid=nearHover*motion*(pointerStrength*(boardSurface>.5?.55:(interactivePiece>.5?.38:.85))+interactivePiece*hoverBoost*1.25);
 vec3 flow=vec3(
  sin(world.y*2.7+time*1.15+sin(time*.43))*.14,
  sin(world.x*2.1+world.z*1.7-time*.82)*.09,
  cos(world.y*2.3-time*.96+cos(time*.38))*.13);
 world+=flow*fluid;
 world+=n*sin(world.y*3.4+world.x*1.9-time*1.05)*fluid*.075;
 world.xz+=vec2(sin(world.z*5.2+world.y*4.1+time*.48),cos(world.x*4.6-world.y*5.3-time*.42))*.023*motion;
 float dx=(wave(world+vec3(.025,0,0))-wave(world-vec3(.025,0,0)))/.05;
 float dz=(wave(world+vec3(0,0,.025))-wave(world-vec3(0,0,.025)))/.05;
 waterNormal=normalize(n-vec3(dx,0,dz)*.8);waterPosition=world;
 gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
}`;
const fragment=`
uniform float time;uniform vec3 pigment;uniform float alpha;uniform float boardSurface;uniform float motion;
uniform sampler2D behindScene;uniform sampler2D behindDepth;uniform sampler2D frontDepth;uniform vec2 screenSize;uniform float captureMode;
varying vec3 waterPosition;varying vec3 waterNormal;
// A neutral studio environment: broad light cards, dark reflected folds, fine glints.
vec3 environment(vec3 d){
 float horizon=smoothstep(-.42,.6,d.y);
 float base=mix(.003,.94,horizon);
 float darkCard=smoothstep(.76,.92,sin(d.x*5.2+d.z*2.8));
 base*=1.-darkCard*.985;
 float softbox=pow(max(0.,dot(d,normalize(vec3(-.55,.7,.45)))),20.);
 float strip=exp(-pow((d.x+d.z*.35-.18)*19.,2.))*smoothstep(-.3,.4,d.y);
 float rim=pow(max(0.,dot(d,normalize(vec3(.8,.25,-.5)))),65.);
 float energy=base+softbox*1.4+strip*.95+rim*.85;
 return mix(vec3(.002,.009,.026),vec3(.88,.96,1.),clamp(energy,0.,1.))*max(1.,energy);
}
void main(){
 vec2 screenUV=gl_FragCoord.xy/screenSize;
 if(captureMode>1.5&&gl_FragCoord.z<=texture2D(frontDepth,screenUV).r+.000015)discard;
 vec3 p=waterPosition,tangent=vec3(0.);
 float t=time*motion;
 // Intersecting capillary waves give each reflection a detailed, moving contour.
 tangent+=normalize(vec3(1.,.2,.65))*cos(dot(p,vec3(8.3,5.2,6.7))+t*.8)*.065;
 tangent+=normalize(vec3(-.6,.4,1.))*cos(dot(p,vec3(-15.4,11.6,17.8))-t*1.1)*.032;
 tangent+=normalize(vec3(.7,1.,-.4))*cos(dot(p,vec3(32.1,27.4,-21.7))+sin(p.x*3.+t*.4))*.014;
 tangent+=normalize(vec3(-.3,.7,.8))*cos(dot(p,vec3(-63.2,51.1,47.3))-t*1.5)*.006;
 vec3 n=normalize(waterNormal+tangent),v=normalize(cameraPosition-p);
 if(dot(n,v)<0.)n=-n;
 float facing=max(dot(n,v),0.);
 float fresnel=.0204+.9796*pow(1.-facing,5.);
 vec3 reflection=environment(reflect(-v,n));
 // Water IOR 1.333: the refracted studio field bends behind the surface.
 vec3 refraction=boardSurface>.5?vec3(1.):environment(refract(-v,n,1./1.333));
 float folds=sin(p.x*5.2+sin(p.z*4.1+t*.35)+sin(p.y*7.))*sin(p.z*6.3-p.y*3.-t*.27);
 float caustic=pow(1.-abs(folds),24.);
 vec3 transmitted=mix(vec3(.012,.025,.047),refraction,.91)*mix(vec3(.93,.97,1.),pigment,.12);
 vec3 color=mix(transmitted,reflection,clamp(fresnel*.65+.48,0.,1.));
 color+=vec3(caustic*(boardSurface>.5?.09:.025));
 float spec=pow(max(dot(reflect(normalize(vec3(.5,-1.,-.4)),n),v),0.),120.);
 vec3 reflected=reflect(-v,n);
 float silverBand=pow(max(0.,1.-abs(reflected.x*.7+reflected.z*.45+sin(reflected.y*5.)*.12-.15)),65.);
 float darkFold=pow(max(0.,1.-abs(reflected.z*.7-reflected.x*.4+.08)),34.);
 color*=1.-darkFold*.80;
 color+=vec3(spec*1.25+silverBand*.52);
 float edge=pow(1.-facing,2.);
 color=mix(color,reflection*.62,edge*.32);
 // Deep blue-black troughs and icy white crests, with little neutral mid-grey.
 float luminance=dot(color,vec3(.2126,.7152,.0722));
 float contrast=smoothstep(.12,.67,luminance);
 vec3 cold=mix(vec3(.003,.013,.034),vec3(.90,.97,1.),contrast);
 color=mix(color,cold,.82);
 if(captureMode<.5&&boardSurface<.5){
  vec3 viewNormal=normalize(mat3(viewMatrix)*n);
  vec2 distortion=viewNormal.xy*(.010+.020*(1.-facing));
  distortion+=vec2(sin(p.y*13.+p.z*9.+t*.6),cos(p.x*11.-p.y*7.-t*.45))*.004;
  vec2 bentUV=clamp(screenUV+distortion,vec2(.001),vec2(.999));
  float backZ=texture2D(behindDepth,bentUV).r;
  vec3 through=texture2D(behindScene,bentUV).rgb;
  // Reject foreground samples; only geometry behind this surface is transmitted.
  if(backZ<gl_FragCoord.z+.00001){through=texture2D(behindScene,screenUV).rgb;if(texture2D(behindDepth,screenUV).r<gl_FragCoord.z+.00001)through=vec3(1.);}
  float transmission=(1.-fresnel)*(boardSurface>.5?.25:.84);
  color=mix(color,through*vec3(.94,.98,1.),transmission);
  color+=vec3(spec*.32+silverBand*.11);
 }
 // High-key water: a white interior bounded by a crisp, near-black rim.
 float interiorLight=dot(color,vec3(.2126,.7152,.0722));
 float darkDetail=1.-smoothstep(.045,.19,interiorLight);
 float rimMask=boardSurface>.5?(1.-smoothstep(.24,.57,facing))*.98:1.-smoothstep(.38,.73,facing);
 float ink=clamp(max(rimMask,darkDetail*(boardSurface>.5?.65:.78)),0.,1.);
 // Preserve luminous centres and highlights; describe the remaining pale water.
 float centre=smoothstep(.76,.97,facing);
 float lit=clamp(spec*2.+silverBand*.9,0.,1.);
 float detail=(1.-centre)*(1.-lit);
 float paleFold=.5+.5*sin(p.x*4.3+sin(p.z*3.7+t*.3)+p.y*5.2);
 float blueShade=detail*(.10+.25*paleFold+.14*darkFold);
 vec3 whiteWater=mix(vec3(.975,.989,1.),vec3(.49,.61,.73),blueShade);
 vec3 blackWater=vec3(.001,.004,.009);
 color=mix(whiteWater,blackWater,ink);
 if(captureMode<.5&&boardSurface<.5){
  vec3 viewN=normalize(mat3(viewMatrix)*n);
  float bendScale=boardSurface>.5?.28:1.;
  vec2 bend=(viewN.xy*(.045+.070*(1.-facing))+vec2(sin(p.y*13.+p.z*9.+t*.6),cos(p.x*11.-p.y*7.-t*.45))*.016)*bendScale;
  vec2 uv=clamp(screenUV+bend,vec2(.001),vec2(.999));
  vec3 visibleBehind=texture2D(behindScene,uv).rgb;
  if(texture2D(behindDepth,uv).r<gl_FragCoord.z+.00001){uv=screenUV;visibleBehind=texture2D(behindScene,uv).rgb;if(texture2D(behindDepth,uv).r<gl_FragCoord.z+.00001)visibleBehind=vec3(1.);}
  // Transmit actual scene detail after the tonal treatment, preserving the dark rim.
  float clarity=(1.-rimMask)*(boardSurface>.5?.35:.78);
  color=mix(color,visibleBehind*vec3(.95,.985,1.),clarity);
  color+=vec3(spec*.13+silverBand*.055);
 }
 gl_FragColor=vec4(color,alpha*(boardSurface>.5?1.:.985));
 #include <colorspace_fragment>
}`;

export function createWaterTheme(board,pieces){
 const records=[],geometries=new Set();let elapsed=0,index=0,targetStrength=0,lastHovered=null,hoverPulse=0;
 const ripples=Array.from({length:6},()=>new THREE.Vector4(0,0,-100,0));
 const shared={time:{value:0},pointerWorld:{value:new THREE.Vector3()},pointerStrength:{value:0},hoverBoost:{value:0},ripples:{value:ripples},motion:{value:1},behindScene:{value:null},behindDepth:{value:null},frontDepth:{value:null},screenSize:{value:new THREE.Vector2(1,1)},captureMode:{value:0}};
 for(const group of [board,...pieces.map(p=>p.model)]){
  const piece=pieces.find(p=>p.model===group),isBoard=group===board;
  const record={group,materials:group.userData.materials,meshes:[]};const materials=[];
  for(const mesh of group.children.filter(m=>m.isMesh)){
   const original=mesh.material,geometry=mesh.geometry;
   if(isBoard&&geometry.type==='BoxGeometry'){
    const p=geometry.parameters,steps=p.width>2?40:8;
    mesh.geometry=new THREE.BoxGeometry(p.width,p.height,p.depth,steps,1,steps);geometries.add(mesh.geometry);
   }
   const tileColor=isBoard?(mesh.position.y<-.15?'#081629':(Math.round(mesh.position.x+3.5)+Math.round(mesh.position.z+3.5))%2?'#15283e':'#dcefff'):piece.color==='white'?'#eaf6ff':'#172a43';
   const material=new THREE.ShaderMaterial({uniforms:{...shared,pigment:{value:new THREE.Color(tileColor)},alpha:{value:1},boardSurface:{value:isBoard?1:0},interactivePiece:{value:piece?.active?1:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,side:THREE.DoubleSide,depthWrite:true,toneMapped:false});
   mesh.material=material;materials.push(material);record.meshes.push({mesh,original,geometry,material});
  }
  group.userData.materials=materials;records.push(record);
 }
 const halos=pieces.filter(p=>p.active).map(piece=>{
  const material=new THREE.ShaderMaterial({uniforms:{strength:{value:0}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
   vertexShader:`varying vec2 glowUV;void main(){glowUV=uv;vec4 centre=modelViewMatrix*vec4(0.,0.,0.,1.);centre.xy+=position.xy*vec2(2.05,2.65);gl_Position=projectionMatrix*centre;}`,
   fragmentShader:`varying vec2 glowUV;uniform float strength;void main(){float d=length((glowUV-.5)*2.);float glow=exp(-d*d*3.2)*(1.-smoothstep(.55,1.,d));gl_FragColor=vec4(.73,.88,1.,glow*strength*.48);}`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);mesh.position.y=.75;mesh.renderOrder=8;mesh.raycast=()=>{};piece.model.add(mesh);return {piece,mesh,material};
 });
 const makeTarget=()=>{const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);return target;};
 const front=makeTarget(),behind=makeTarget();let width=0,height=0;
 return {
  render(renderer,scene,camera){
   const size=renderer.getSize(new THREE.Vector2());
   if(width!==size.x||height!==size.y){width=size.x;height=size.y;front.setSize(width,height);behind.setSize(width,height);}
   const clear=renderer.getClearColor(new THREE.Color()).clone(),clearAlpha=renderer.getClearAlpha();
   const oldTarget=renderer.getRenderTarget();
   try{
    shared.screenSize.value.set(width,height);shared.behindScene.value=null;shared.behindDepth.value=null;shared.frontDepth.value=null;
    halos.forEach(h=>h.mesh.visible=false);
    renderer.setClearColor(0xffffff,1);shared.captureMode.value=1;
    renderer.setRenderTarget(front);renderer.clear();renderer.render(scene,camera);
    shared.captureMode.value=2;shared.frontDepth.value=front.depthTexture;
    renderer.setRenderTarget(behind);renderer.clear();renderer.render(scene,camera);
    shared.captureMode.value=0;shared.frontDepth.value=null;shared.behindScene.value=behind.texture;shared.behindDepth.value=behind.depthTexture;
    halos.forEach(h=>h.mesh.visible=h.material.uniforms.strength.value>.005);
    renderer.getDrawingBufferSize(shared.screenSize.value);
    renderer.setRenderTarget(oldTarget);renderer.setClearColor(clear,clearAlpha);renderer.render(scene,camera);
   }finally{shared.captureMode.value=0;renderer.setRenderTarget(oldTarget);renderer.setClearColor(clear,clearAlpha);}
  },
  point(position){targetStrength=position?1:0;if(position)shared.pointerWorld.value.copy(position);},
  splash(position){if(!position||shared.motion.value===0)return;ripples[index].set(position.x,position.z,elapsed,1);index=(index+1)%ripples.length;},
  update(dt,reduced,hovered=null){
   const activeHover=hovered?.active?hovered:null;
   for(const halo of halos)halo.material.uniforms.strength.value=THREE.MathUtils.damp(halo.material.uniforms.strength.value,halo.piece===activeHover?1:0,5,dt);
   shared.hoverBoost.value=THREE.MathUtils.damp(shared.hoverBoost.value,activeHover&&!reduced?1:0,3.2,dt);
   if(activeHover&&!reduced){
    const position=activeHover.model.getWorldPosition(new THREE.Vector3());
    shared.pointerWorld.value.lerp(position,1-Math.exp(-dt*12));targetStrength=1;
    hoverPulse-=dt;
    // Hover continuously morphs the selected surface; discrete rings are reserved for clicks.
   }else if(lastHovered){targetStrength=0;hoverPulse=0;}
   lastHovered=activeHover;
   elapsed+=dt;shared.time.value=elapsed;shared.motion.value=reduced?0:1;shared.pointerStrength.value=THREE.MathUtils.damp(shared.pointerStrength.value,targetStrength,7,dt);for(const r of records)for(const e of r.meshes)e.material.uniforms.alpha.value=e.material.opacity;},
  dispose(){for(const h of halos){h.piece.model.remove(h.mesh);h.mesh.geometry.dispose();h.material.dispose();}for(const r of records){for(const e of r.meshes){e.mesh.material=e.original;e.mesh.geometry=e.geometry;e.material.dispose();}r.group.userData.materials=r.materials;}geometries.forEach(g=>g.dispose());front.dispose();behind.dispose();}
 };
}
