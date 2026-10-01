import { createWaterTheme } from './water-theme.js?v=20';
import { setGroupOpacity, restoreSceneOpacity } from './scene-visibility.js';
import { createPixelDpad } from './pixel-dpad.js?v=1';
import { createPixelDecor } from './pixel-decor.js?v=1';
import { createPixelHud } from './pixel-hud.js?v=1';
import { createPixelSpeech } from './pixel-speech.js?v=2';
import { createPixelMenu } from './pixel-menu.js?v=4';
import { createPixelTheme } from './pixel-theme.js?v=3';
import { createWireHover } from './wire-hover.js?v=3';
import { createSketchStars } from './sketch-stars.js?v=2';
import * as THREE from 'three';
import { animate } from './vendor/anime.js';
import { createPiece,createBoard,openingPosition,squarePosition } from './models.js?v=16';
import { categories } from './content.js?v=25';
import { createDesignGallery } from './design-gallery.js?v=31';
let designGallery;
import { createSketchTheme } from './sketch-theme.js?v=11';
import { createSelectiveBlur } from './selective-blur.js?v=44';
let selectiveBlur;
let waterTheme=null;let wireTheme=false;let pixelTheme=null;let pixelMenu=null;let pixelSpeech=null;let pixelHud=null;let pixelDpad=null;let pixelOptions={size:4,motion:true};
let sketchTheme=null;let sketchStars=null;let wireHover=null;
let themeToolsUnlocked=false;
let selectedMood=0;
let wireOriginals=[];
const boardMotion={x:0,y:0,targetX:0,targetY:0,zoom:1,targetZoom:1};
function applyWireTheme(){
 if(!ready||state==='transition')return;
 const repeatChange=themeToolsUnlocked&&!wireTheme;
 if(sketchTheme||pixelTheme||waterTheme)resetOriginalTheme();
 themeToolsUnlocked=true;selectedMood=1;
 if(!wireTheme){
  wireTheme=true;document.body.dataset.theme='wire';
  const edgeCache=new Map();
  for(const group of [board,...pieces.map(p=>p.model)]){
   const materials=[];
   const record={group,materials:group.userData.materials,meshes:[]};wireOriginals.push(record);
   for(const mesh of [...group.children]){
    if(!mesh.isMesh)continue;
    const surface=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
    surface.userData.wireDepth=true;
    const original=mesh.material;mesh.material=surface;
    let edges=edgeCache.get(mesh.geometry);
    if(!edges){edges=new THREE.EdgesGeometry(mesh.geometry,4);edgeCache.set(mesh.geometry,edges);}
    const ink=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:1,toneMapped:false,depthWrite:false,depthFunc:THREE.LessEqualDepth});
    const rearInk=new THREE.LineBasicMaterial({color:0x777777,transparent:true,opacity:1,toneMapped:false,depthWrite:false,depthFunc:THREE.GreaterDepth});
    ink.userData.wireLine=true;rearInk.userData.wireLine=true;
    const lines=new THREE.LineSegments(edges,ink);lines.raycast=()=>{};lines.renderOrder=2;
    const rearLines=new THREE.LineSegments(edges,rearInk);rearLines.raycast=()=>{};rearLines.renderOrder=1;
    mesh.add(lines,rearLines);
    record.meshes.push({mesh,original,lines,rearLines,surface,ink,rearInk});
    materials.push(surface,ink,rearInk);
   }
   group.userData.materials=materials;
  }
  renderer.shadowMap.enabled=false;
 }
 if(state!=='board')returnToBoard();
 syncThemeTools();
 if(repeatChange)pulseThemeIcon();
 $('#board-instruction>span:nth-child(2)').textContent='휠 드래그로 회전 · 스크롤로 확대/축소';
 announce('흰 선 테마 적용. 체스판을 드래그하여 360도 회전할 수 있습니다.');
}
function applySketchTheme(){
 if(!ready||state==='transition')return;
 const repeatChange=themeToolsUnlocked;
 if(!sketchTheme){resetOriginalTheme();sketchTheme=createSketchTheme(board,pieces);}
 selectedMood=2;themeToolsUnlocked=true;document.body.dataset.theme='sketch';renderer.shadowMap.enabled=false;
 if(state!=='board')returnToBoard();
 syncThemeTools();if(repeatChange)pulseThemeIcon();
 $('#board-instruction>span:nth-child(2)').textContent='휠 드래그로 회전 · 스크롤로 확대/축소';
 announce('sketchbook 테마 적용. 말에 마우스를 올리면 크레파스 선이 다시 그려집니다.');
}
function applyPixelTheme(){
 if(!ready||state==='transition')return;
 const repeatChange=themeToolsUnlocked;
 if(!pixelTheme){resetOriginalTheme();pixelTheme=createPixelTheme(board,pieces);}
 pixelTheme.setPixelSize(pixelOptions.size);
 selectedMood=3;themeToolsUnlocked=true;document.body.dataset.theme='pixel';renderer.shadowMap.enabled=false;
 if(state!=='board')returnToBoard();
 syncThemeTools();if(repeatChange)pulseThemeIcon();
 $('#board-instruction>span:nth-child(2)').textContent='휠 드래그로 회전 · 스크롤로 확대/축소';
 announce('Pixel 테마 적용. 픽셀 체스판을 회전하고 확대할 수 있습니다.');
}
function applyWaterTheme(){
 if(!ready||state==='transition')return;
 const repeatChange=themeToolsUnlocked;
 if(!waterTheme){resetOriginalTheme();waterTheme=createWaterTheme(board,pieces);}
 selectedMood=4;themeToolsUnlocked=true;document.body.dataset.theme='water';renderer.shadowMap.enabled=false;
 if(state!=='board')returnToBoard();
 syncThemeTools();if(repeatChange)pulseThemeIcon();
 $('#board-instruction>span:nth-child(2)').textContent='마우스로 물결 · 클릭으로 파동 · 드래그로 회전';
 announce('Water 테마 적용. 마우스를 올리면 물결치고 클릭하면 파동이 퍼집니다.');
}
function resetOriginalTheme(){
 waterTheme?.dispose();waterTheme=null;
 pixelTheme?.dispose();pixelTheme=null;
 sketchTheme?.dispose();sketchTheme=null;
 selectedMood=0;
 const edges=new Set();
 for(const record of wireOriginals){
  for(const {mesh,original,lines,rearLines,surface,ink,rearInk} of record.meshes){
   mesh.remove(lines,rearLines);mesh.material=original;edges.add(lines.geometry);surface.dispose();ink.dispose();rearInk.dispose();
  }
  record.group.userData.materials=record.materials;
  opacity(record.group,1);
 }
 edges.forEach(geometry=>geometry.dispose());wireOriginals=[];
 wireTheme=false;delete document.body.dataset.theme;
 renderer.shadowMap.enabled=true;
 endWireOrbit({});
 if(!themeToolsUnlocked){
  Object.assign(wireOrbit,{yaw:0,pitch:BOARD_ANGLE,suppressUntil:0});
  Object.assign(boardMotion,{x:0,y:0,targetX:0,targetY:0,zoom:1,targetZoom:1});
  view.angle=BOARD_ANGLE;view.azimuth=0;view.fade=1;
 }
 restoreSceneOpacity(board,pieces,view.fade,selected);
 pieces.forEach(p=>{if(p.glow)p.glow.visible=true;});
 $('#board-instruction>span:nth-child(2)').textContent=themeToolsUnlocked?'휠 드래그로 회전 · 스크롤로 확대/축소':'표시된 말을 선택해 탐색하세요';
 renderer.domElement.style.cursor=themeToolsUnlocked?'grab':'default';frameCamera();
}
window.addEventListener('pointermove',e=>{
 if(!themeToolsUnlocked||state!=='board'||openingStage!=='active'||e.pointerType!=='mouse'||reduced.matches||(pixelTheme&&!pixelOptions.motion)||e.target.closest('#pixel-game-menu,#pixel-dpad'))return;
 boardMotion.targetX=(e.clientX/innerWidth-.5)*1.8;
 boardMotion.targetY=-(e.clientY/innerHeight-.5)*1.2;
});
function centerWireBoard(){boardMotion.targetX=0;boardMotion.targetY=0;}
document.documentElement.addEventListener('pointerleave',centerWireBoard);
window.addEventListener('blur',centerWireBoard);

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const duration=n=>reduced.matches?1:n;
let renderer,scene,camera,board,selected=null,state='board',hovered=null,transition=null;
let pieces=[],active=[],lastTime=0,ready=false;
let openingStage='intro';
let openingTimer=0,boardTimer=0;
function setOpeningStage(stage){openingStage=stage;document.body.dataset.opening=stage;$('#opening-gate').hidden=stage==='active';}

let ambientLight,keyLight,rimLight,fillLight;
const BOARD_ANGLE=.62;
const GLOW_SQUARES=new Set(['c6','c4','e5']);
const INTERACTIVE_SQUARES=new Set(['c6','c4','e5','f3']);
const completedCollections=new Set();
let currentCollection=null;
const contactUnlocked=()=>['design','taste','experiment'].every(key=>completedCollections.has(key));
categories.contact={title:'Contact',line:'Contact',kicker:'',description:'',piece:'KNIGHT',items:[]};
function refreshContact(){const p=pieces.find(p=>p.square==='f3');if(p&&contactUnlocked()&&!p.glow){makeGlow(p);p.button.dataset.glowing='true';p.button.setAttribute('aria-label','백 나이트 f3 — Contact');}}
const CAMERA_DISTANCE=28;
const lighting={focus:0};
const view={angle:BOARD_ANGLE,azimuth:0,height:14.2,targetX:0,targetY:0,targetZ:0,fade:1};
const introEls=[$('#intro'),$('#board-note'),$('#board-instruction')];
const mobile=()=>innerWidth<=650;
const announce=text=>$('#announcement').textContent=text;
function topHeight(){if(openingStage==='active')return mobile()?7.8:7.5;return mobile()?8.16/(innerWidth/innerHeight)*1.22:Math.max(12.4,8.16/(innerWidth/innerHeight)*1.5)}
function frameCamera(){
 const a=innerWidth/innerHeight,h=view.height*(themeToolsUnlocked?boardMotion.zoom:1);
 // Match the previous framing at the target plane, with restrained perspective.
 camera.aspect=a;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/(2*CAMERA_DISTANCE)));camera.updateProjectionMatrix();
 camera.position.set(view.targetX+Math.sin(view.angle)*Math.sin(view.azimuth)*CAMERA_DISTANCE,view.targetY+Math.cos(view.angle)*CAMERA_DISTANCE,view.targetZ+Math.sin(view.angle)*Math.cos(view.azimuth)*CAMERA_DISTANCE);
 const offsetX=themeToolsUnlocked?boardMotion.x:0,offsetY=themeToolsUnlocked?boardMotion.y:0;
 camera.position.x-=offsetX;camera.position.y-=offsetY;
 camera.lookAt(view.targetX-offsetX,view.targetY-offsetY,view.targetZ);camera.updateMatrixWorld();
}
function opacity(group,value){setGroupOpacity(group,value);}
function applyFade(){opacity(board,view.fade);pieces.forEach(p=>{if(p!==selected)opacity(p.model,view.fade);if(p.glow)p.glow.visible=state==='board'||(state==='transition'&&view.fade>.65)});}
function updateLighting(t){
 lighting.focus=t;ambientLight.intensity=THREE.MathUtils.lerp(.8,.35,t);keyLight.intensity=THREE.MathUtils.lerp(2.8,.8,t);rimLight.intensity=THREE.MathUtils.lerp(2.1,7,t);fillLight.intensity=THREE.MathUtils.lerp(.8,1.1,t);
}
function makeGlow(p){
 const glow=new THREE.Group();
 const strength={value:.48};
 const meshes=[...p.model.children];
 // Back-facing shells are depth-tested against the solid model: only the
 // silhouette's exterior is visible, without brightening its surface.
 for(let layer=0;layer<6;layer++){
  const material=new THREE.ShaderMaterial({
   uniforms:{strength,spread:{value:.025+layer*.024},falloff:{value:(1-layer/7)*.30}},
   vertexShader:`uniform float spread;void main(){vec3 expanded=position+normal*spread;gl_Position=projectionMatrix*modelViewMatrix*vec4(expanded,1.);}`,
   fragmentShader:`uniform float strength;uniform float falloff;void main(){gl_FragColor=vec4(vec3(.97),strength*falloff);}`,
   transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.BackSide
  });
  for(const mesh of meshes){const shell=new THREE.Mesh(mesh.geometry,material);shell.position.copy(mesh.position);shell.rotation.copy(mesh.rotation);shell.renderOrder=2;shell.raycast=()=>{};glow.add(shell)}
  if(layer===0)p.glowMaterial=material;
 }
 p.model.add(glow);p.glow=glow;
 for(const material of p.model.userData.materials){if(material.emissive){material.emissive.set(0x000000);material.emissiveIntensity=0;}}
}

// Orbit input is enabled only after a theme has been applied.
const wireOrbit={yaw:0,pitch:BOARD_ANGLE,drag:null,suppressUntil:0};
const orbitSurface=$('.world');
orbitSurface.addEventListener('pointerdown',e=>{
 if(!themeToolsUnlocked||state!=='board'||openingStage!=='active'||![0,1].includes(e.button)||wireOrbit.drag)return;
 if(e.button===1)e.preventDefault();
 wireOrbit.drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:view.azimuth,pitch:view.angle,moved:false};
});
window.addEventListener('pointermove',e=>{
 const drag=wireOrbit.drag;if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<6)return;
 if(!drag.moved){drag.moved=true;orbitSurface.setPointerCapture(e.pointerId);document.body.classList.add('orbit-dragging');}
 e.preventDefault();hovered=null;centerWireBoard();
 wireOrbit.yaw=drag.yaw-dx*.008;
 wireOrbit.pitch=THREE.MathUtils.clamp(drag.pitch-dy*.006,.12,Math.PI-.12);
},{passive:false});
function endWireOrbit(e){
 const drag=wireOrbit.drag;if(!drag||(e.pointerId!==undefined&&e.pointerId!==drag.id))return;
 if(drag.moved)wireOrbit.suppressUntil=performance.now()+400;
 wireOrbit.drag=null;document.body.classList.remove('orbit-dragging');
 if(orbitSurface.hasPointerCapture(drag.id))orbitSurface.releasePointerCapture(drag.id);
}
window.addEventListener('pointerup',endWireOrbit);
window.addEventListener('pointercancel',endWireOrbit);
window.addEventListener('blur',endWireOrbit);
orbitSurface.addEventListener('lostpointercapture',endWireOrbit);
orbitSurface.addEventListener('auxclick',e=>{if(themeToolsUnlocked&&e.button===1)e.preventDefault()});
orbitSurface.addEventListener('wheel',e=>{
 if(!themeToolsUnlocked||state!=='board'||openingStage!=='active'||e.ctrlKey)return;
 e.preventDefault();
 const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 const step=THREE.MathUtils.clamp(pixels,-160,160);
 boardMotion.targetZoom=THREE.MathUtils.clamp(boardMotion.targetZoom*Math.exp(step*.0016),.48,1.8);
},{passive:false});

orbitSurface.addEventListener('click',e=>{
 if(performance.now()<wireOrbit.suppressUntil){e.preventDefault();e.stopImmediatePropagation();}
},true);
let geometryNotes;
function projectGeometryNotes(){
 if(!geometryNotes){
  const layer=document.createElement('div');layer.id='geometry-notes';layer.setAttribute('aria-hidden','true');
  const specs=[
   {at:[-4.25,0,2.5],text:'Δx = 1.000',side:'left'},
   {at:[4.25,0,1.8],text:'L = 8.160 u'},
   {at:[-4.25,0,-2.5],text:'8 × 8 / 64',side:'left'},
   {at:[4.25,0,-2.5],text:()=>`θ = ${THREE.MathUtils.radToDeg(view.angle).toFixed(2)}°`},
   {at:[.1,.05,.1],text:'O (0, 0, 0)',small:true},
   {at:[1.5,.05,-.5],text:'(1.50, 0, −0.50)',small:true},
   {at:[-.5,0,4.18],text:'X / Z · 1 : 1'},
   {at:[-1.5,1.5,-1.5],text:'C6 · (−1.50, −1.50)',small:true}
  ];
  pieces.forEach((piece,i)=>{
   specs.push({at:[piece.origin.x+.22,.25,piece.origin.z+.25],text:`${piece.square.toUpperCase()} / ${(i*.03125).toFixed(4)}`,small:true});
  });
  for(let i=0;i<8;i++){
   specs.push({at:[i-3.5,0,-4.35],text:`X${i} ${(i-3.5).toFixed(2)}`,small:true});
   specs.push({at:[-4.4,0,i-3.5],text:`Z${i} / ${String(128+i*64).padStart(4,'0')}`,small:true,side:'left'});
  }
  const hud=document.createElement('div');hud.className='geometry-hud';
  hud.innerHTML='<div><b>SPATIAL STUDY / 001</b><span>WIRE MODULE · REV 04.08</span><span>V 032 / F 064 / GRID 1.000</span><span>ε 0.0001 · λ 0.61803</span><span>Σ 128.064 / μ 0.250</span></div><div><b>TRANSFORM MATRIX</b><span>1.000  0.000  0.000</span><span>0.000  1.000  0.000</span><span>0.000  0.000  1.000</span><span>SEED 004729 / SAMPLE DATA</span></div><div><b>ORBIT / LIVE</b><span id="orbit-readout"></span><span>WHEEL DRAG / 360° · SCROLL / ZOOM</span><span>CLICK A PIECE TO EXPLORE</span></div><div><b>GEOMETRY INDEX</b><span>κ 0.875 / τ 6.28318</span><span>LOD 02 · N 048 · Δ 0.016</span><span>PROJECTION / PERSPECTIVE</span><span>DESIGN DATA / NON-METRIC</span></div>';
  layer.append(hud);
  geometryNotes=specs.map(spec=>{
   const el=document.createElement('span');el.className='geometry-note'+(spec.side==='left'?' is-left':'')+(spec.small?' is-detail':'');
   const label=document.createElement('span');el.append(label);layer.append(el);
   return {...spec,el,label,point:new THREE.Vector3(...spec.at)};
  });
  $('.world').append(layer);
 }
 const readout=$('#orbit-readout');if(readout)readout.textContent=`AZ ${((THREE.MathUtils.radToDeg(view.azimuth)%360+360)%360).toFixed(1)}° / EL ${THREE.MathUtils.radToDeg(view.angle).toFixed(1)}°`;
 for(const note of geometryNotes){
  const pos=note.point.clone().project(camera),x=(pos.x+1)*innerWidth/2,y=(1-pos.y)*innerHeight/2;
  note.el.hidden=state!=='board'||openingStage!=='active'||pos.z>1||x<100||x>innerWidth-145||y<50||y>innerHeight-65||(mobile()&&note.small);
  if(note.el.hidden)continue;
  note.el.style.transform=`translate3d(${x}px,${y}px,0)`;
  note.label.textContent=typeof note.text==='function'?note.text():note.text;
 }
}
function projectControls(){
 syncThemeTools();
 const marker=$('#contact-unlocked-marker'),knight=pieces.find(p=>p.square==='f3');
 marker.hidden=!(knight&&contactUnlocked()&&state==='board'&&openingStage==='active');
 if(!marker.hidden){const head=new THREE.Vector3(0,1.82,0);knight.model.updateWorldMatrix(true,false);head.applyMatrix4(knight.model.matrixWorld).project(camera);marker.style.left=((head.x+1)*innerWidth/2)+'px';marker.style.top=((-head.y+1)*innerHeight/2)+'px';}
 for(const p of active){
  const show=(state==='board'&&openingStage==='active')||(state==='focus'&&p===selected);
  p.button.hidden=!show;
  if(!show)continue;
  const v=new THREE.Vector3(p.model.position.x,p.model.position.y+(state==='focus'?.7:.75),p.model.position.z).project(camera);
  p.button.style.left=((v.x+1)*innerWidth/2)+'px';p.button.style.top=((-v.y+1)*innerHeight/2)+'px';
 }
}
function init(){
 window.setLoadingStage?.('3D 공간 준비');
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(25,innerWidth/innerHeight,.1,100);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.setClearColor(0x000000,0);
 renderer.domElement.setAttribute('aria-label','살짝 측면에서 내려다본 이탈리안 오프닝 3D 체스판');
 $('#canvas-container').append(renderer.domElement);
 ambientLight=new THREE.HemisphereLight(0xffffff,0x292929,.8);scene.add(ambientLight);
 keyLight=new THREE.DirectionalLight(0xffffff,2.8);keyLight.position.set(-5,8,3);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);Object.assign(keyLight.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:35});keyLight.shadow.bias=-.0004;keyLight.shadow.normalBias=.025;keyLight.shadow.radius=4;scene.add(keyLight);
 rimLight=new THREE.DirectionalLight(0xffffff,2.1);rimLight.position.set(1.5,3.5,-5);scene.add(rimLight);
 fillLight=new THREE.DirectionalLight(0xffffff,.8);fillLight.position.set(-5,2,1);scene.add(fillLight);
 board=createBoard();scene.add(board);
 window.setLoadingStage?.('32개 기물 배치');
 pieces=openingPosition().map(data=>{
  const model=createPiece(data.type,data.color);model.position.copy(squarePosition(data.square));
  if(data.type==='knight')model.rotation.y=data.color==='white'?-.35:Math.PI+.35;
  if(data.type==='bishop')model.rotation.y=.25;
  scene.add(model);return {...data,active:INTERACTIVE_SQUARES.has(data.square),category:data.square==='f3'?'contact':data.category,model,origin:model.position.clone(),originRotation:model.rotation.y};
 });
 active=pieces.filter(p=>p.active);
 pixelSpeech=createPixelSpeech();pixelHud=createPixelHud();createPixelDecor();
 pixelDpad=createPixelDpad((direction,amount)=>{
  if(direction==='left')wireOrbit.yaw-=amount;
  if(direction==='right')wireOrbit.yaw+=amount;
  if(direction==='up')wireOrbit.pitch=THREE.MathUtils.clamp(wireOrbit.pitch-amount,.12,Math.PI-.12);
  if(direction==='down')wireOrbit.pitch=THREE.MathUtils.clamp(wireOrbit.pitch+amount,.12,Math.PI-.12);
  centerWireBoard();hovered=null;
 });
 sketchStars=createSketchStars(active);wireHover=createWireHover();
 pixelMenu=createPixelMenu({
  snapshot:()=>({yaw:wireOrbit.yaw,pitch:wireOrbit.pitch,zoom:boardMotion.targetZoom,hud:pixelHud.snapshot()}),
  restore:data=>{pixelHud.restore(data.hud);wireOrbit.yaw=data.yaw;wireOrbit.pitch=data.pitch;boardMotion.targetZoom=data.zoom;centerWireBoard();},
  start:()=>{pixelHud.reset();wireOrbit.yaw=0;wireOrbit.pitch=BOARD_ANGLE;boardMotion.targetZoom=1;centerWireBoard();hovered=null;},
  exit:()=>restartOpening(),
  configure:settings=>{pixelOptions=settings;pixelTheme?.setPixelSize(settings.size);if(!settings.motion)centerWireBoard();}
 });
 for(const p of active){
  if(GLOW_SQUARES.has(p.square))makeGlow(p);
  const b=document.createElement('button');b.className='piece-hotspot';b.dataset.square=p.square;b.dataset.glowing=String(GLOW_SQUARES.has(p.square));b.setAttribute('aria-label',`${p.color==='white'?'백':'흑'} ${p.type} ${p.square} — ${categories[p.category].title}`);
  b.innerHTML=`<span class="tooltip">${categories[p.category].title} ↗</span>`;
  b.addEventListener('click',()=>activate(p));
  b.addEventListener('pointerenter',()=>hovered=p);b.addEventListener('pointerleave',()=>hovered=null);
  b.addEventListener('focus',()=>hovered=p);b.addEventListener('blur',()=>hovered=null);
  $('#piece-controls').append(b);p.button=b;
 }
 view.height=topHeight();view.targetZ=mobile()?-.85:0;
 selectiveBlur=createSelectiveBlur(renderer,scene,pieces,board);
 frameCamera();selectiveBlur.render(camera);projectControls();
 ready=true;window.finishLoading?.();
 animate('#loading',{opacity:0,duration:duration(650),onComplete:()=>$('#loading').hidden=true});
 animate(introEls,{opacity:[0,1],duration:duration(1100),ease:'outCubic'});
 animate(board.position,{y:[-.25,0],duration:duration(1400),ease:'outQuint'});
 renderer.setAnimationLoop(tick);
 renderer.domElement.addEventListener('pointermove',pointerMove);
 renderer.domElement.addEventListener('pointerleave',()=>{waterTheme?.point(null);hovered=null;renderer.domElement.style.cursor='default'});
 renderer.domElement.addEventListener('click',canvasClick);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showFallback('3D 연결이 끊어졌습니다. 컬렉션은 계속 탐색할 수 있습니다.');});
 setOpeningStage('intro');
 const initial=location.hash.slice(1);if(categories[initial])openCollection(initial,false);
}
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
function hit(e){
 if(!ready||(state!=='board'&&state!=='focus')||(state==='board'&&openingStage!=='active'))return null;
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);
 const choices=state==='focus'?[selected]:active;
 const hits=ray.intersectObjects(choices.map(p=>p.model),true);
 if(!hits.length)return null;
 return choices.find(p=>{let obj=hits[0].object;while(obj){if(obj===p.model)return true;obj=obj.parent}return false});
}
function waterHit(e){
 if(!waterTheme||!ready||!['board','focus'].includes(state))return null;
 pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);
 return ray.intersectObjects([board,...pieces.map(p=>p.model)],true)[0]?.point||null;
}
function pointerMove(e){hovered=hit(e);if(waterTheme)waterTheme.point(wireOrbit.drag?null:waterHit(e));renderer.domElement.style.cursor=wireOrbit.drag?.moved?'grabbing':hovered?'pointer':state==='focus'?'zoom-out':themeToolsUnlocked?'grab':'default'}
function canvasClick(e){if(waterTheme)waterTheme.splash(waterHit(e));if(state==='board'&&openingStage==='preview'){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);if(ray.intersectObjects([board,...pieces.map(p=>p.model)],true).length)enterOpeningBoard();return}const p=hit(e);if(p)activate(p);else if(state==='focus')returnToBoard();else if(state==='board'&&openingStage==='active'){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);if(themeToolsUnlocked&&ray.intersectObject(board,true).length){boardMotion.targetZoom=boardMotion.targetZoom===1?.88:1;}else if(!ray.intersectObjects([board,...pieces.map(p=>p.model)],true).length)restartOpening();}}
function activate(p){if(waterTheme)waterTheme.splash(p.model.getWorldPosition(new THREE.Vector3()));if(state==='board'&&openingStage==='active'){if(pixelTheme)pixelHud?.collect(p);focusPiece(p);}else if(state==='focus'&&p===selected)openCollection(p.category)}
function revealOpening(){
 if(!ready||state!=='board'||openingStage!=='intro')return;
 clearTimeout(openingTimer);
 const phrase=$('#opening-gate>span'),before=phrase.getBoundingClientRect();
 setOpeningStage('preview');
 const after=phrase.getBoundingClientRect();
 if(!reduced.matches)phrase.animate([{transform:`translate(${before.left-after.left}px,${before.top-after.top}px) scale(${before.width/after.width})`,opacity:1},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:1300,easing:'cubic-bezier(.22,1,.36,1)'});
 projectControls();
 boardTimer=setTimeout(enterOpeningBoard,reduced.matches?350:1800);
 announce('체스판으로 이동합니다.');
}
function enterOpeningBoard(){
 if(!ready||state!=='board'||openingStage!=='preview')return;
 clearTimeout(boardTimer);
 const start={...view};setOpeningStage('active');state='transition';
 const end={height:topHeight(),targetX:0,targetY:0,targetZ:0},progress={t:0};
 transition=animate(progress,{t:1,duration:duration(1600),ease:'inOutQuint',onUpdate:()=>{for(const k in end)view[k]=THREE.MathUtils.lerp(start[k],end[k],progress.t);frameCamera();},onComplete:()=>{state='board';transition=null;projectControls();announce('표시된 말을 선택해 탐색하세요.');}});
}
$('#opening-gate').addEventListener('click',revealOpening);
document.addEventListener('keydown',e=>{if(state!=='board'||!['Enter',' '].includes(e.key)||e.target.closest('button,a')&&e.target!==$('#opening-gate'))return;if(openingStage==='intro'){e.preventDefault();revealOpening();}else if(openingStage==='preview'){e.preventDefault();enterOpeningBoard();}});
function restartOpening(){
 if(state!=='board'||openingStage!=='active')return;
 clearTimeout(openingTimer);clearTimeout(boardTimer);hovered=null;closeMenu();
 state='transition';openingStage='returning';document.body.dataset.opening='returning';
 $('#opening-gate').hidden=true;projectControls();
 const start={...view},end={height:topHeight(),targetX:0,targetY:0,targetZ:mobile()?-.85:0},progress={t:0};
 transition=animate(progress,{t:1,duration:duration(1900),ease:'inOutQuint',onUpdate:()=>{for(const k in end)view[k]=THREE.MathUtils.lerp(start[k],end[k],progress.t);frameCamera();},onComplete:()=>{
  themeToolsUnlocked=false;resetOriginalTheme();closeThemePanel();syncThemeTools();
  state='board';transition=null;setOpeningStage('intro');
  // Restart the opening statement even after repeated visits.
  const phrase=$('#opening-gate>span');phrase.style.animation='none';void phrase.offsetWidth;phrase.style.animation='';
  $('#opening-gate').focus({preventScroll:true});announce('시작 화면. 화면을 클릭하면 체스판으로 이동합니다.');
 }});
}
let themeCloseTimer=0,themeWheelTimer=0,themeWheelLocked=false,themeWheelDelta=0,themeAutoOpen=false;
function syncThemeTools(){
 document.body.dataset.navigation=themeToolsUnlocked?'free':'fixed';
 const tools=$('#theme-tools'),appearing=tools.hidden&&themeToolsUnlocked;
 tools.hidden=!themeToolsUnlocked;
 if(!themeToolsUnlocked){$('#theme-toggle').classList.remove('theme-arriving');themeAutoOpen=false;}
 if(appearing)themeAutoOpen=true;
 if(themeAutoOpen&&state==='board'&&openingStage==='active'){themeAutoOpen=false;openThemePanel();}
 if(appearing&&!reduced.matches){
  const icon=$('#theme-toggle');icon.classList.add('theme-arriving');
  themePulseAnimation?.cancel();
  const restingGlow=getComputedStyle(icon).boxShadow;
  themePulseAnimation=icon.animate([
   {opacity:0,transform:'translateX(160px) scale(1.4)',boxShadow:'0 0 35px 12px #ffffff55'},
   {opacity:1,transform:'translateX(-7px) scale(.94)',boxShadow:'0 0 12px 3px #ffffffdd,0 0 36px 12px #ffffff80,0 0 70px 22px #ffffff30',offset:.28},
   {opacity:1,transform:'translateX(3px) scale(1.08)',boxShadow:'0 0 10px 2px #ffffffbb,0 0 38px 13px #ffffff55,0 0 80px 26px #ffffff15',offset:.58},
   {opacity:1,transform:'translateX(0) scale(1)',boxShadow:restingGlow}
  ],{duration:1850,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 document.querySelectorAll('[data-theme-choice]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.themeChoice===(selectedMood===0?'original':selectedMood===1?'wire':'mood-'+selectedMood)));
  button.disabled=state==='transition';
 });
}
function openThemePanel(){
 clearTimeout(themeCloseTimer);
 if(!themeToolsUnlocked)return;
 $('#theme-panel').hidden=false;$('#theme-toggle').setAttribute('aria-expanded','true');
 $('#theme-toggle').setAttribute('aria-label','테마 목록 닫기');
}
function closeThemePanel(){
 themeAutoOpen=false;
 clearTimeout(themeCloseTimer);
 $('#theme-panel').hidden=true;$('#theme-toggle').setAttribute('aria-expanded','false');
 $('#theme-toggle').setAttribute('aria-label','테마 목록 열기');
}
let themePulseAnimation=null,themeFlowAnimations=[];
function pulseThemeIcon(){
 themePulseAnimation?.cancel();
 if(reduced.matches)return;
 const icon=$('#theme-toggle'),restingGlow=getComputedStyle(icon).boxShadow;
 themePulseAnimation=icon.animate([
  {transform:'scale(1)',boxShadow:restingGlow,borderColor:'#ffffff70'},
  {transform:'scale(1.18)',boxShadow:'0 0 10px 3px #fffffff0,0 0 30px 10px #ffffffaa,0 0 65px 20px #ffffff40',borderColor:'#fff',offset:.25},
  {transform:'scale(1.06)',boxShadow:'0 0 8px 2px #ffffffbb,0 0 35px 12px #ffffff60,0 0 75px 24px #ffffff20',borderColor:'#ffffffcc',offset:.55},
  {transform:'scale(1)',boxShadow:restingGlow,borderColor:'#ffffff70'}
 ],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
}
function flowThemeScene(direction){
 const layers=['#canvas-container','#piece-controls','#geometry-notes'].map(selector=>$(selector)).filter(Boolean);
 // Continue from the visible position if another gesture arrives before settling.
 const positions=layers.map(element=>getComputedStyle(element).translate);
 themeFlowAnimations.forEach(animation=>animation.cancel());themeFlowAnimations=[];
 if(reduced.matches)return;
 const travel=(mobile()?12:22)*direction;
 layers.forEach((element,i)=>{
  themeFlowAnimations.push(element.animate([
   {translate:positions[i]==='none'?'0 0':positions[i],offset:0,easing:'cubic-bezier(.2,.65,.3,1)'},
   {translate:`0 ${-travel}px`,offset:.26,easing:'cubic-bezier(.22,0,.18,1)'},
   {translate:'0 0',offset:1}
  ],{duration:1150,easing:'linear'}));
 });
}
function syncMoodButtons(){
 document.querySelectorAll('.mood-pawn').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.mood)===selectedMood)));
}
function chooseTheme(key,scrollDirection=0){
 if(state==='transition')return;
 const mood=key==='original'?0:key==='wire'?1:Number(key.slice(5));
 if(!Number.isInteger(mood)||mood<0||mood>4||mood===selectedMood)return;
 if(key==='wire')applyWireTheme();
 else if(mood===2)applySketchTheme();
 else if(mood===3)applyPixelTheme();
 else if(mood===4)applyWaterTheme();
 else{resetOriginalTheme();if(state!=='board')returnToBoard();announce('원본 테마 적용');pulseThemeIcon();}
 syncThemeTools();syncMoodButtons();
 if(scrollDirection)flowThemeScene(scrollDirection);
}
$('#theme-panel').addEventListener('pointermove',e=>{
 if(e.pointerType==='touch')return;
 const bounds=$('#theme-panel').getBoundingClientRect();
 const position=THREE.MathUtils.clamp((e.clientY-bounds.top)/bounds.height,0,1);
 $('#theme-panel').style.setProperty('--wheel-turn',`${(position-.5)*10}deg`);
});
$('#theme-panel').addEventListener('pointerleave',()=>$('#theme-panel').style.setProperty('--wheel-turn','0deg'));
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('focus',()=>{
 $('#theme-panel').style.setProperty('--wheel-turn','0deg');
}));
$('#theme-tools').addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')openThemePanel()});
$('#theme-tools').addEventListener('pointerleave',e=>{
 if(e.pointerType!=='touch')themeCloseTimer=setTimeout(closeThemePanel,180);
});
$('#theme-tools').addEventListener('focusout',e=>{
 if(!e.relatedTarget||!$('#theme-tools').contains(e.relatedTarget))closeThemePanel();
});
$('#theme-toggle').onclick=e=>{
 if(e.detail===0||e.pointerType==='touch'){
  if($('#theme-panel').hidden)openThemePanel();else closeThemePanel();
 }else openThemePanel();
};
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>chooseTheme(button.dataset.themeChoice));
$('#theme-tools').addEventListener('wheel',e=>{
 if($('#theme-panel').hidden)return;
 e.preventDefault();e.stopPropagation();
 clearTimeout(themeWheelTimer);
 themeWheelTimer=setTimeout(()=>{themeWheelLocked=false;themeWheelDelta=0;},240);
 if(themeWheelLocked||state==='transition')return;
 themeWheelDelta+=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX)*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 if(Math.abs(themeWheelDelta)<18)return;
 const direction=Math.sign(themeWheelDelta);
 themeWheelLocked=true;themeWheelDelta=0;
 const next=(selectedMood+direction+5)%5;
 chooseTheme(next===0?'original':next===1?'wire':'mood-'+next,direction);
},{passive:false});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#theme-tools'))closeThemePanel()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('#theme-panel').hidden){e.preventDefault();e.stopImmediatePropagation();closeThemePanel();$('#theme-toggle').focus();}
 if(e.target===$('#theme-toggle')&&['ArrowRight','ArrowDown'].includes(e.key)){
  e.preventDefault();openThemePanel();$('#theme-panel [aria-pressed=true]').focus();
 }
},true);
function closeMenu(){$('#index-menu').hidden=true;$('#index-toggle').setAttribute('aria-expanded','false')}
// Frame the sculpted head, keeping the body cropped below the viewport.
function focusPose(p){
 const scale=p.type==='pawn'?4.2:p.type==='bishop'?3.2:2.8;
 const rotation=new THREE.Euler(-.12,p.type==='knight'?.12:.25,.30);
 const head=new THREE.Vector3(0,p.type==='pawn'?.89:p.type==='bishop'?1.23:1.10,0).multiplyScalar(scale).applyEuler(rotation);
 const position=new THREE.Vector3(mobile()?0:-1.08,mobile()?.95:.94,0).sub(head);
 return {scale,rotation,position,view:{angle:Math.PI/2-.055,azimuth:0,height:mobile()?3.5:2.65,targetX:mobile()?0:.28,targetY:mobile()?.18:.87,targetZ:0}};
}
function focusPiece(p){
 if(!p?.active)return;
 if(!ready)return openCollection(p.category);
 if(state==='transition')return;
 if(state==='board')history.pushState({pieceFocus:true},'',location.pathname+location.search);
 closeMenu();selected=p;state='transition';document.body.dataset.view='focus';hovered=null;
 const c=categories[p.category];$('#focus-kicker').textContent=c.kicker;$('#title-link').innerHTML=c.line;$('#title-link').setAttribute('aria-label',c.title+' 컬렉션으로 이동');const locked=p.category==='contact'&&!contactUnlocked();document.body.dataset.locked=String(locked);$('#title-link').disabled=locked;$('#title-link').classList.toggle('is-locked',locked);if(locked){$('#title-link').innerHTML='<svg class=contact-lock viewBox="0 0 100 120" fill="none" aria-hidden="true"><rect x="19" y="49" width="62" height="57" rx="10" stroke="currentColor" stroke-width="4"/><path d="M31 49V32a19 19 0 0 1 38 0v17" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="74" r="5" fill="currentColor"/><path d="M50 79v10" stroke="currentColor" stroke-width="4"/></svg>';$('#title-link').setAttribute('aria-label','잠김: 세 항목을 보고 체스보드로 돌아오면 열립니다.');}$('#focus-description').textContent=c.description;$('#piece-name').textContent=`${c.piece} / ${p.square.toUpperCase()} / ${p.color.toUpperCase()}`;
 $('#focus-copy').hidden=false;$('#focus-copy').style.opacity='0';$('#focus-meta').hidden=true;$('#back-button').hidden=true;
 animate(introEls,{opacity:0,duration:duration(350)});
 const m={progress:0},start={...view},origin=p.model.position.clone(),rot=p.model.rotation.y;
 const pose=focusPose(p),finalScale=pose.scale;
 const end=pose.view;
 transition=animate(m,{progress:1,duration:duration(1700),ease:'inOutQuint',onUpdate:()=>{
  const t=m.progress;for(const k in end)view[k]=THREE.MathUtils.lerp(start[k],end[k],t);
  view.fade=1-Math.min(1,t*2.4);p.model.position.lerpVectors(origin,pose.position,t);
  p.model.rotation.y=THREE.MathUtils.lerp(rot,pose.rotation.y,t);p.model.rotation.x=pose.rotation.x*t;p.model.rotation.z=pose.rotation.z*t;p.model.scale.setScalar(THREE.MathUtils.lerp(1,finalScale,t));updateLighting(t);
  applyFade();frameCamera();projectControls();
 },onComplete:()=>{
  state='focus';transition=null;$('#back-button').hidden=false;$('#focus-meta').hidden=false;
  p.button.classList.add('focused');p.button.setAttribute('aria-label',`${c.title} 컬렉션으로 이동`);
  animate('#focus-copy',{opacity:[0,1],translateY:[18,0],duration:duration(650),ease:'outCubic'});
  projectControls();p.button.focus({preventScroll:true});announce(locked?'잠김. School project, Taste archive, Experiment를 각각 보고 돌아오면 연락처가 열립니다.':`${c.title}. 말이나 제목을 클릭하면 컬렉션으로 이동합니다.`);
 }});
}
function returnToBoard(updateHistory=true){
 if(state==='transition')return;
 if(state==='collection'&&['design','taste','experiment'].includes(currentCollection))completedCollections.add(currentCollection);
 resetMoodMotion();currentCollection=null;refreshContact();$('#contact-screen').hidden=true;
 setOpeningStage('active');
 closeMenu();if(updateHistory&&location.hash)history.pushState(null,'',location.pathname+location.search);
 designGallery?.hide();delete document.body.dataset.collection;
 $('#collection').hidden=true;$('#focus-copy').hidden=true;$('#focus-meta').hidden=true;$('#back-button').hidden=true;document.body.dataset.view='board';window.scrollTo(0,0);
 if(!ready){state='board';return}
 state='transition';hovered=null;
 const p=selected,start={...view},pos=p?.model.position.clone(),rot=p?p.originRotation+Math.atan2(Math.sin(p.model.rotation.y-p.originRotation),Math.cos(p.model.rotation.y-p.originRotation)):0,startPitch=p?.model.rotation.x||0,startRoll=p?.model.rotation.z||0,startScale=p?.model.scale.x||1,startLight=lighting.focus;
 if(p)p.button.classList.remove('focused');
 const end={angle:themeToolsUnlocked?wireOrbit.pitch:BOARD_ANGLE,azimuth:themeToolsUnlocked?wireOrbit.yaw:0,height:topHeight(),targetX:0,targetY:0,targetZ:0};
 const m={progress:0};
 transition=animate(m,{progress:1,duration:duration(1400),ease:'inOutQuint',onUpdate:()=>{
  const t=m.progress;for(const k in end)view[k]=THREE.MathUtils.lerp(start[k],end[k],t);view.fade=t;
  if(p){p.model.position.lerpVectors(pos,p.origin,t);p.model.rotation.y=THREE.MathUtils.lerp(rot,p.originRotation,t);p.model.rotation.x=THREE.MathUtils.lerp(startPitch,0,t);p.model.rotation.z=THREE.MathUtils.lerp(startRoll,0,t);p.model.scale.setScalar(THREE.MathUtils.lerp(startScale,1,t))}updateLighting(startLight*(1-t));
  applyFade();frameCamera();projectControls();
 },onComplete:()=>{
  pieces.forEach(q=>{q.model.position.copy(q.origin);q.model.rotation.set(0,q.originRotation,0);q.model.scale.setScalar(1);if(q.glow)q.glow.visible=true;opacity(q.model,1)});opacity(board,1);state='board';selected=null;transition=null;
  animate(introEls,{opacity:1,duration:duration(600)});projectControls();if(p){p.button.setAttribute('aria-label',`${p.color==='white'?'백':'흑'} ${p.type} ${p.square} — ${categories[p.category].title}`);p.button.focus({preventScroll:true})}announce('이탈리안 오프닝. 4개의 말을 선택할 수 있습니다.');
 }});
}
// Damped pointer movement gives the mood stage two subtle layers of depth.
const moodStage=$('#collection');
const moodMotion={x:0,y:0,targetX:0,targetY:0,frame:0,time:0};
function resetMoodMotion(){
 cancelAnimationFrame(moodMotion.frame);
 Object.assign(moodMotion,{x:0,y:0,targetX:0,targetY:0,frame:0,time:0});
 moodStage.style.setProperty('--mood-x','0px');
 moodStage.style.setProperty('--mood-y','0px');
}
function animateMoodMotion(time){
 moodMotion.frame=0;
 if(currentCollection!=='experiment'||state!=='collection'||reduced.matches||document.hidden){resetMoodMotion();return;}
 const dt=moodMotion.time?Math.min(time-moodMotion.time,50):16;
 moodMotion.time=time;
 const ease=1-Math.exp(-dt/140);
 moodMotion.x+=(moodMotion.targetX-moodMotion.x)*ease;
 moodMotion.y+=(moodMotion.targetY-moodMotion.y)*ease;
 moodStage.style.setProperty('--mood-x',moodMotion.x.toFixed(3)+'px');
 moodStage.style.setProperty('--mood-y',moodMotion.y.toFixed(3)+'px');
 if(Math.abs(moodMotion.targetX-moodMotion.x)+Math.abs(moodMotion.targetY-moodMotion.y)>.02)moodMotion.frame=requestAnimationFrame(animateMoodMotion);
 else moodMotion.time=0;
}
function aimMoodMotion(x,y){
 moodMotion.targetX=x;moodMotion.targetY=y;
 if(!moodMotion.frame)moodMotion.frame=requestAnimationFrame(animateMoodMotion);
}
moodStage.addEventListener('pointermove',event=>{
 if(currentCollection!=='experiment'||state!=='collection'||reduced.matches||event.pointerType!=='mouse')return;
 aimMoodMotion((event.clientX/innerWidth-.5)*180,(event.clientY/innerHeight-.5)*120);
});
moodStage.addEventListener('pointerleave',()=>{if(currentCollection==='experiment')aimMoodMotion(0,0)});
window.addEventListener('blur',resetMoodMotion);
window.addEventListener('resize',resetMoodMotion);
reduced.addEventListener('change',resetMoodMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetMoodMotion()});
function openCollection(key,updateHistory=true){
 const c=categories[key];if(!c||state==='transition'||(key==='contact'&&!contactUnlocked()))return;
 resetMoodMotion();currentCollection=key;$('#contact-screen').hidden=true;
 closeMenu();hovered=null;state='collection';document.body.dataset.view='collection';document.body.dataset.collection=key;
 if(key==='contact'){
 designGallery?.hide();$('#collection').hidden=true;$('#contact-screen').hidden=false;$('#contact-screen').focus({preventScroll:true});
 if(updateHistory)history.pushState(null,'','#contact');
 const contactScreen=$('#contact-screen');
 contactScreen.getAnimations({subtree:true}).forEach(a=>a.cancel());
 if(!reduced.matches){
  contactScreen.animate([{transform:'translateY(100%)'},{transform:'translateY(0)'}],{duration:1100,easing:'cubic-bezier(.22,1,.36,1)'});
  contactScreen.querySelectorAll('a,p').forEach((element,i)=>element.animate([{opacity:0,transform:'translateY(30px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:950,delay:720+i*200,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'}));
 }
 return;
 }
 if(key==='design'){
  $('#collection').hidden=true;
  if(!designGallery)designGallery=createDesignGallery(()=>returnToBoard());
  if(updateHistory)history.pushState(null,'','#design');
  designGallery.show();announce('School project 대시보드. 양옆 이미지를 선택하거나 드래그하여 작업을 넘겨볼 수 있습니다.');return;
 }
 designGallery?.hide();$('#collection').hidden=false;$('#collection').dataset.category=key;
 if(key==='experiment'){
  $('#collection-title').textContent='chage your mood';
  const pawn='<svg viewBox="0 0 80 112" aria-hidden="true"><circle cx="40" cy="21" r="13"/><path d="M28 39h24l3 9H25zM31 52h18c0 16 3 27 12 35H19c9-8 12-19 12-35ZM18 91h44l6 11H12z"/></svg>';
  $('#collection-grid').innerHTML=Array.from({length:4},(_,i)=>`<button type="button" class="mood-pawn" data-mood="${i+1}" aria-label="${i===0?'흰 선 체스 테마 적용':i===1?'sketchbook 테마 적용':i===2?'Pixel 테마 적용':i===3?'Water 테마 적용':'무드 '+(i+1)+' 선택'}" aria-pressed="${selectedMood===i+1}">${pawn}<span class="mood-number" aria-hidden="true">0${i+1}</span></button>`).join('');
  $('#collection-grid').querySelectorAll('.mood-pawn').forEach(button=>button.onclick=()=>{
   if((button.dataset.mood==='1'&&wireTheme)||(button.dataset.mood==='2'&&sketchTheme)||(button.dataset.mood==='3'&&pixelTheme)||(button.dataset.mood==='4'&&waterTheme)){selectedMood=Number(button.dataset.mood);syncMoodButtons();returnToBoard();return;}
   chooseTheme(button.dataset.mood==='1'?'wire':'mood-'+button.dataset.mood);
  });
  if(updateHistory)history.pushState(null,'','#experiment');
  window.scrollTo(0,0);$('#collection').focus({preventScroll:true});
  animate('#collection',{clipPath:['inset(0 0 100% 0)','inset(0 0 0% 0)'],translateY:[-55,0],duration:duration(950),ease:'outQuint'});
  animate('.mood-pawn',{opacity:[0,1],translateY:[24,0],delay:(_,i)=>reduced.matches?0:420+i*75,duration:duration(700),ease:'outCubic'});
  announce('chage your mood. 폰 버튼 4개');return;
 }
 $('#collection-kicker').textContent=c.kicker+' — SELECTED COLLECTION';$('#collection-title').textContent=c.title+'.';$('#collection-description').textContent=c.description;
 $('#collection-grid').innerHTML=c.items.map((item,i)=>`<button class="work-card" data-item="${i}"><div class="work-art ${item.cls}">${item.art}</div><div class="work-caption"><div><h3>${item.title}</h3><p>${item.tag}</p></div><span>↗</span></div></button>`).join('');
 $('#collection>.placeholder-note').innerHTML=key==='taste'?'<a href="https://pin.it/35yWhKkgY" target="_blank" rel="noopener noreferrer">PINTEREST / 그래픽 디자인 보드 ↗</a> · 18 IMAGES':'CONCEPT PORTFOLIO · 현재 작업물은 전시 구성을 위한 예시입니다.';
 $('#collection-grid').querySelectorAll('button').forEach(b=>b.onclick=()=>openDetail(c.items[Number(b.dataset.item)]));
 if(updateHistory)history.pushState(null,'','#'+key);
 window.scrollTo(0,0);$('#collection').focus({preventScroll:true});
 animate('#collection',{clipPath:['inset(0 0 100% 0)','inset(0 0 0% 0)'],translateY:[-55,0],duration:duration(950),ease:'outQuint'});
 animate('.collection-heading',{opacity:[0,1],translateY:[20,0],delay:duration(300),duration:duration(700),ease:'outCubic'});
 animate('.work-card',{opacity:[0,1],translateY:[40,0],delay:(_,i)=>reduced.matches?0:520+Math.min(i,8)*65,duration:duration(900),ease:'outCubic'});
 announce(c.title+' 컬렉션');
}
function openDetail(item){
 $('#detail').classList.toggle('image-detail',item.kind==='pinterest');
 if(item.kind==='pinterest'){
  $('#detail-content').innerHTML=`<img class="archive-full-image" src="${item.image}" alt="${item.title} — 그래픽 디자인 보드 이미지"><div class="archive-image-footer"><span>${item.title}</span><a href="${item.source}" target="_blank" rel="noopener noreferrer">Pinterest 원본 보기 ↗</a></div>`;
  $('#detail').showModal();return;
 }

 $('#detail-content').innerHTML=`<div class="work-art ${item.cls}">${item.art}</div><h2>${item.title}</h2><p>${item.description}</p><dl><dt>Focus</dt><dd>${item.role}</dd><dt>Process</dt><dd>${item.process}</dd></dl><p class="placeholder-note">전시 레이아웃을 위한 예시 프로젝트입니다. 실제 작업물로 교체할 수 있습니다.</p>`;
 $('#detail').showModal();
}
function tick(now){
 pixelMenu?.update(!!pixelTheme&&state==='board'&&openingStage==='active');
 if(pixelTheme&&state==='board')$('#board-instruction>span:nth-child(2)').textContent='DRAG TO ROTATE · SCROLL TO ZOOM';
 if(!ready||document.hidden||state==='collection'){sketchStars?.clear();wireHover?.clear();pixelSpeech?.clear();pixelHud?.hide();pixelDpad?.update(0,false);return;}
 const dt=Math.min((now-lastTime)/1000,.05)||.016;lastTime=now;
 pixelDpad?.update(dt,!!pixelTheme&&state==='board'&&openingStage==='active');
 if(state==='board')for(const p of active){const isHover=hovered===p;const target=isHover&&!reduced.matches?(waterTheme?.36:.12):0;p.model.position.y=THREE.MathUtils.damp(p.model.position.y,target,10,dt);if(p.glowMaterial)p.glowMaterial.uniforms.strength.value=THREE.MathUtils.damp(p.glowMaterial.uniforms.strength.value,isHover?.85:.48,7,dt)}
 if(state==='focus'&&selected){
  const responding=hovered===selected&&!reduced.matches;
  const pose=focusPose(selected);
  const baseY=pose.position.y,baseScale=pose.scale,baseRotation=pose.rotation.y;
  selected.model.position.y=THREE.MathUtils.damp(selected.model.position.y,baseY+(responding?.09:0),8,dt);
  selected.model.rotation.y=THREE.MathUtils.damp(selected.model.rotation.y,baseRotation+(responding?.075:0),7,dt);
  selected.model.rotation.x=THREE.MathUtils.damp(selected.model.rotation.x,pose.rotation.x,7,dt);
  selected.model.scale.setScalar(THREE.MathUtils.damp(selected.model.scale.x,baseScale*(responding?1.025:1),8,dt));
 }
 if(themeToolsUnlocked){
  if(state==='board'&&openingStage==='active'){
   view.azimuth=reduced.matches?wireOrbit.yaw:THREE.MathUtils.damp(view.azimuth,wireOrbit.yaw,8,dt);
   view.angle=reduced.matches?wireOrbit.pitch:THREE.MathUtils.damp(view.angle,wireOrbit.pitch,8,dt);
  }
  const responding=state==='board'&&openingStage==='active'&&!reduced.matches&&!wireOrbit.drag&&(!pixelTheme||pixelOptions.motion);
  boardMotion.x=THREE.MathUtils.damp(boardMotion.x,responding?boardMotion.targetX:0,5,dt);
  boardMotion.y=THREE.MathUtils.damp(boardMotion.y,responding?boardMotion.targetY:0,5,dt);
  const zoomTarget=state==='board'&&openingStage==='active'?boardMotion.targetZoom:1;
  boardMotion.zoom=reduced.matches?zoomTarget:THREE.MathUtils.damp(boardMotion.zoom,zoomTarget,6,dt);
  frameCamera();
 }
 projectControls();
 pixelHud?.update(dt,!!pixelTheme&&(state==='board'&&openingStage==='active'||state==='focus'),hovered,!!wireOrbit.drag);
 pixelSpeech?.update(camera,hovered,!!pixelTheme&&!wireOrbit.drag&&(state==='board'||state==='focus'),reduced.matches);
 wireHover?.update(dt,camera,hovered,wireTheme&&!wireOrbit.drag&&(state==='focus'||state==='board'&&openingStage==='active'),reduced.matches);
 sketchStars?.update(dt,camera,!!sketchTheme&&!wireOrbit.drag&&(state==='focus'||state==='board'&&openingStage==='active'),reduced.matches);
 if(wireTheme){
  pieces.forEach(p=>{if(p.glow)p.glow.visible=false;});
  projectGeometryNotes();renderer.setRenderTarget(null);renderer.render(scene,camera);
 }else if(sketchTheme){
  pieces.forEach(p=>{if(p.glow)p.glow.visible=false;});
  sketchTheme.update(dt,wireOrbit.drag?null:hovered,reduced.matches);
  renderer.setRenderTarget(null);renderer.render(scene,camera);
 }else if(pixelTheme){
  pieces.forEach(p=>{if(p.glow)p.glow.visible=false;});
  pixelTheme.update(dt,wireOrbit.drag||!pixelOptions.motion?null:hovered,reduced.matches);
  pixelTheme.render(renderer,scene,camera);
 }else if(waterTheme){
  pieces.forEach(p=>{if(p.glow)p.glow.visible=false;});
  waterTheme.update(dt,reduced.matches,wireOrbit.drag?null:hovered);
  waterTheme.render(renderer,scene,camera);
 }else selectiveBlur.render(camera,view.fade);
}
function showFallback(message){ready=false;renderer?.setAnimationLoop(null);$('#loading').hidden=true;window.finishLoading?.();$('#fallback').hidden=false;$('#piece-controls').hidden=true;if(message)announce(message)}
$('#index-toggle').onclick=()=>{const open=$('#index-menu').hidden;$('#index-menu').hidden=!open;$('#index-toggle').setAttribute('aria-expanded',String(open))};
document.addEventListener('click',e=>{if(!e.target.closest('#index-menu')&&!e.target.closest('#index-toggle'))closeMenu()});
$('#home').onclick=e=>{e.preventDefault();returnToBoard()};$('#back-button').onclick=()=>returnToBoard();$('#collection-back').onclick=()=>returnToBoard();$('#collection-opening').onclick=()=>returnToBoard();$('#contact-home').onclick=()=>returnToBoard();
function enterSelected(){if(selected&&state==='focus')openCollection(selected.category)}
$('#enter-button').onclick=enterSelected;
$('#title-link').onclick=enterSelected;
$('#detail-close').onclick=()=>$('#detail').close();
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('[data-select=pawn]').onclick=()=>selectType('pawn');$('[data-select=bishop]').onclick=()=>selectType('bishop');$('[data-select=knight]').onclick=()=>selectType('knight');
function selectType(type){if(state==='transition')return;const key={pawn:'design',bishop:'taste',knight:'experiment'}[type];if(state==='board'&&ready)focusPiece(active.find(p=>p.category===key));else openCollection(key)}
document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>openCollection(b.dataset.route));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#detail').open&&!designGallery?.isDetailOpen()){if(!$('#index-menu').hidden)closeMenu();else if(state==='focus'||state==='collection')returnToBoard()}});
window.addEventListener('popstate',()=>{if(transition){transition.complete();}const route=location.hash.slice(1);if(categories[route])openCollection(route,false);else returnToBoard(false)});
window.addEventListener('resize',()=>{if(!ready)return;renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));if(state==='board'){view.height=topHeight();view.targetZ=openingStage==='active'?0:mobile()?-.85:0}else if(state==='focus'){const pose=focusPose(selected);Object.assign(view,pose.view);selected.model.position.copy(pose.position)}frameCamera();projectControls()});
try{init()}catch(error){console.error('3D setup failed',error);showFallback()}
