import * as THREE from './vendor/three.module.js';

export function createPixelTheme(board,pieces){
 const records=[];
 const vertex=`varying vec3 cellPosition;varying vec3 worldNormal;uniform float shell;
 void main(){cellPosition=position;worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*shell,1.);}`;
 const fragment=`varying vec3 cellPosition;varying vec3 worldNormal;uniform vec3 pigment;uniform float alpha;uniform float shell;uniform float highlight;
 void main(){
 if(shell>0.){gl_FragColor=vec4(.065,.006,.029,alpha);return;}
 vec3 cell=floor(cellPosition*18.);
 float checker=mod(cell.x+cell.y+cell.z,2.);
 float light=dot(normalize(worldNormal),normalize(vec3(-.5,.85,.6)))*.5+.5;
 float shade=floor(clamp(light+checker*.08,0.,.999)*4.)/3.;
 float grain=fract(sin(dot(cell,vec3(12.9898,78.233,37.719)))*43758.5453);
 vec3 color=pigment*(.40+shade*.60)+(grain>.85?vec3(.04):vec3(0.));
 color=mix(color,vec3(1.,.64,.84),highlight*.24);
 gl_FragColor=vec4(color,alpha);
 }`;
 function material(color,shell=0){return new THREE.ShaderMaterial({uniforms:{pigment:{value:new THREE.Color(color)},alpha:{value:1},shell:{value:shell},highlight:{value:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,side:shell?THREE.BackSide:THREE.FrontSide,depthWrite:!shell,toneMapped:false});}
 for(const group of [board,...pieces.map(p=>p.model)]){
  const piece=pieces.find(p=>p.model===group),record={group,piece,materials:group.userData.materials,meshes:[]},materials=[];
  [...group.children].filter(m=>m.isMesh).forEach((mesh,i)=>{
   const color=piece?(piece.color==='white'?'#baffdf':'#d91678'):(i===64?'#65143f':(Math.round(mesh.position.x+3.5)+Math.round(mesh.position.z+3.5))%2?'#a82c69':'#b2f3d5');
   const fill=material(color),ink=material('#48132f',piece?.035:.013);ink.userData.wireLine=true;
   const shell=new THREE.Mesh(mesh.geometry,ink);shell.raycast=()=>{};shell.renderOrder=1;
   const original=mesh.material;mesh.material=fill;mesh.add(shell);materials.push(fill,ink);record.meshes.push({mesh,original,fill,ink,shell});
  });
  group.userData.materials=materials;records.push(record);
 }
 const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
 target.texture.generateMipmaps=false;
 const screen=new THREE.Scene(),camera2D=new THREE.Camera();
 const screenMaterial=new THREE.ShaderMaterial({uniforms:{image:{value:target.texture}},vertexShader:'varying vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D image;varying vec2 screenUV;void main(){gl_FragColor=texture2D(image,screenUV);#include <colorspace_fragment>}`.replace(';#include',';\n#include').replace('<colorspace_fragment>}', '<colorspace_fragment>\n}'),depthTest:false,depthWrite:false,transparent:true,toneMapped:false});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),screenMaterial);screen.add(quad);
 let width=0,height=0,pixelSize=4;
 return {
  setPixelSize(value){pixelSize=value;},
  update(dt,hovered,reduced){for(const record of records)for(const entry of record.meshes){entry.fill.uniforms.alpha.value=entry.fill.opacity;entry.ink.uniforms.alpha.value=entry.ink.opacity;entry.fill.uniforms.highlight.value=THREE.MathUtils.damp(entry.fill.uniforms.highlight.value,record.piece===hovered?1:0,reduced?1000:12,dt);}},
  render(renderer,scene,camera){
   const size=renderer.getSize(new THREE.Vector2()),nextW=Math.max(1,Math.ceil(size.x/pixelSize)),nextH=Math.max(1,Math.ceil(size.y/pixelSize));
   if(nextW!==width||nextH!==height){width=nextW;height=nextH;target.setSize(width,height);}
   renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
   renderer.setRenderTarget(null);renderer.render(screen,camera2D);
  },
  dispose(){for(const record of records){for(const e of record.meshes){e.mesh.remove(e.shell);e.mesh.material=e.original;e.fill.dispose();e.ink.dispose();}record.group.userData.materials=record.materials;}target.dispose();screenMaterial.dispose();quad.geometry.dispose();}
 };
}
