import * as THREE from './vendor/three.module.js';

// Local-space pigment and wax grain stay attached to the geometry during orbiting.
const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
`;
const vertex=`
varying vec3 localPosition;varying vec3 localNormal;varying vec3 worldNormal;varying vec2 contourPosition;
uniform float outline;uniform float offsetY;uniform float boardSurface;
void main(){localPosition=position+vec3(0,offsetY,0);localNormal=normal;worldNormal=normalize(mat3(modelMatrix)*normal);
 float pressure=.78+.18*sin(position.x*37.+position.y*23.)+.12*sin(position.z*61.-position.y*49.);
 vec3 p=position+normal*outline*pressure;
 if(outline>0.&&boardSurface<.5){
  p+=vec3(sin(position.y*19.+position.z*11.),sin(position.x*17.+position.y*9.),cos(position.y*23.+position.x*13.))*.028;
 }
 vec4 viewPoint=modelViewMatrix*vec4(p,1.);
 contourPosition=viewPoint.xy-(modelViewMatrix*vec4(0.,0.,0.,1.)).xy;
 gl_Position=projectionMatrix*viewPoint;}
`;
const fragment=`
uniform vec3 pigment;uniform vec3 paper;uniform float alpha;uniform float progress;
uniform float outline;uniform float boardSurface;uniform float height;uniform float emphasis;uniform float multicolor;uniform float blueStroke;uniform float strokeStart;uniform float strokeSpan;
varying vec3 localPosition;varying vec3 localNormal;varying vec3 worldNormal;varying vec2 contourPosition;
${noiseGLSL}
void main(){
 vec3 n=abs(localNormal);vec2 uv=n.y>max(n.x,n.z)?localPosition.xz:n.x>n.z?localPosition.zy:localPosition.xy;
 float grain=noise(uv*155.);float fleck=hash(floor(uv*470.));
 float draw=smoothstep(localPosition.y/height-.10,localPosition.y/height+.10,progress);
 draw=1.;
 if(blueStroke>.5){
  // Follow each projected contour around its centre, one component after another.
  float path=(atan(contourPosition.y,contourPosition.x)+3.14159265)/6.2831853;
  float cursor=(progress-strokeStart)/strokeSpan;
  float dryTip=(noise(uv*110.)-.5)*.045;
  draw=1.-smoothstep(cursor-.012,cursor+.006,path+dryTip);
 }
 vec3 color;float coverage=alpha;
 if(outline>0.){
  // Dense coloured wax with dry paper showing through, rather than a smooth ink edge.
  if(fleck<mix(.075,.018,emphasis)||grain<mix(.15,.07,emphasis))discard;
  float wax=smoothstep(.18,.62,grain);
  vec3 inkColor=pigment;
  if(multicolor>.5){
   // Broad irregular crayon colour patches remain attached to the 3D piece.
   float colorRegion=noise(uv*3.2+vec2(2.7,8.1));
   inkColor=colorRegion<.34?vec3(.0,.68,.65):colorRegion<.48?vec3(1.,.80,.015):colorRegion<.67?vec3(.94,.015,.43):vec3(.32,.10,.68);
  }
  color=mix(inkColor,mix(paper,inkColor,mix(.58,.91,emphasis)),1.-wax);
  coverage*=(blueStroke>.5?(.48+.52*draw):draw)*mix(.8+.2*wax,.97+.03*wax,emphasis);
  if(blueStroke>.5){
   float path=(atan(contourPosition.y,contourPosition.x)+3.14159265)/6.2831853;
   float cursor=(progress-strokeStart)/strokeSpan;
   float tip=(1.-smoothstep(.0,.045,abs(path-cursor)))*step(0.,cursor)*step(cursor,1.);
   color=mix(color,pigment*.55,tip*.8);
  }
 }else{
  float light=dot(normalize(worldNormal),normalize(vec3(-.5,.9,.6)));
  // Two restrained flat values: no glossy shading or continuous light gradient.
  float tone=mix(.96,1.,step(.05,light));
  float wash=boardSurface>.5?.11:.045;
  wash+=(noise(uv*30.)-.5)*.028;
  color=mix(paper,pigment,wash*draw)*tone;
  color*=.987+grain*.018;
 }
 gl_FragColor=vec4(color,coverage);
 #include <colorspace_fragment>
}
`;


export function createSketchTheme(board,pieces){
 const records=[];const pieceStates=new Map();let lastHovered=null;
 const paper=new THREE.Color('#fffdf6');
 function material(color,progress,offsetY,height,outline=0,isBoard=false,emphasis=0){
  const m=new THREE.ShaderMaterial({
   uniforms:{pigment:{value:new THREE.Color(color)},paper:{value:paper},alpha:{value:1},progress,offsetY:{value:offsetY},height:{value:height},outline:{value:outline},boardSurface:{value:isBoard?1:0},emphasis:{value:emphasis},multicolor:{value:!isBoard&&emphasis>0?1:0},blueStroke:{value:0},strokeStart:{value:0},strokeSpan:{value:1}},
   vertexShader:vertex,fragmentShader:fragment,transparent:true,side:outline?THREE.BackSide:THREE.FrontSide,depthWrite:!outline,toneMapped:false
  });
  if(outline)m.userData.wireLine=true;
  return m;
 }
 for(const group of [board,...pieces.map(p=>p.model)]){
  const isBoard=group===board,piece=pieces.find(p=>p.model===group),progress={value:1};
  if(piece)pieceStates.set(piece,progress);
  const record={group,materials:group.userData.materials,meshes:[]};const materials=[];
  [...group.children].filter(mesh=>mesh.isMesh).forEach((mesh,i)=>{
   const palette=piece?.color==='white'?{pawn:'#e32167',bishop:'#ed7625',knight:'#d52780',rook:'#df4264',queen:'#b737bc',king:'#e85935'}:{pawn:'#087fba',bishop:'#16a87a',knight:'#1878ce',rook:'#119da5',queen:'#7852c7',king:'#257bba'};
   const color=isBoard?(i===64?'#7463b7':(Math.round(mesh.position.x+3.5)+Math.round(mesh.position.z+3.5))%2?'#2086c3':'#e8b72d'):palette[piece.type]||palette.pawn;
   const original=mesh.material;
   const fill=material(color,progress,mesh.position.y,isBoard?1:1.8,0,isBoard);mesh.material=fill;
   const ink=material(isBoard?(i===64?'#7463b7':'#528dc0'):color,progress,mesh.position.y,isBoard?1:1.8,isBoard?.025:piece?.active?.082:.052,isBoard,piece?.active?1:0);
   const shell=new THREE.Mesh(mesh.geometry,ink);shell.raycast=()=>{};shell.renderOrder=1;shell.visible=!isBoard;mesh.add(shell);
   let blue=null;
   if(piece?.active){
    const blueInk=material('#0036ed',progress,mesh.position.y,1.8,.055,false,1);
    blueInk.uniforms.multicolor.value=0;blueInk.uniforms.blueStroke.value=1;
    const count=group.children.filter(child=>child.isMesh).length;
    blueInk.uniforms.strokeStart.value=i/count;blueInk.uniforms.strokeSpan.value=1/count;
    blue=new THREE.Mesh(mesh.geometry,blueInk);blue.raycast=()=>{};blue.renderOrder=2;mesh.add(blue);materials.push(blueInk);
   }
   record.meshes.push({mesh,original,fill,ink,shell,blue});materials.push(fill,ink);
  });
  group.userData.materials=materials;records.push(record);
 }
 // Separate hand-drawn ribbons deliberately wander across the mathematically exact grid.
 const boardStrokes=[];
 const random=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
 const wander=(x,seed)=>{
  const k=Math.floor(x),f=x-k,s=f*f*(3-2*f);
  return (random(k+seed)* (1-s)+random(k+1+seed)*s)*2-1;
 };
 function ribbon(axis,line,pass,baseY=null){
  const outer=baseY!==null||line===0||line===8;
  const phase=line*2.137+axis*17.41+(baseY===null?0:36);
  const amplitude=outer?.27:.14;
  const start=.09+random(phase+4)*.40,end=.06+random(phase+9)*.46;
  const positions=[],indices=[],segments=180;
  for(let i=0;i<=segments;i++){
   const t=i/segments,along=-4-start+t*(8+start+end);
   const drift=amplitude*(wander(along*1.35,phase)*.85+wander(along*3.7,phase+91)*.38+wander(along*10.1,phase+34)*.12);
   const retrace=pass*(.018+wander(along*2.1,phase+pass*12)*.035);
   const cross=line-4+drift+retrace+(baseY!==null?(line===0?-.10:.10):0);
   const width=(outer?.045:.025)*(1+.55*wander(along*5.3,phase+pass*8)+.20*wander(along*19,phase));
   for(const side of [-1,1]){
    const y=baseY===null?.012+axis*.002+pass*.002:baseY+side*width+wander(along*2.4,phase+47)*.035;
    const across=baseY===null?cross+side*width:cross;
    if(axis===0)positions.push(along,y,across);
    else positions.push(across,y,along);
   }
   if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const edgeColors=['#00b9b0','#ffdc08','#f40888','#6737c5'];
  const edgeColor=edgeColors[(axis*2+(line===8?1:0)+pass+(baseY===null?0:baseY<-.2?2:1))%edgeColors.length];
  const ink=material(outer?edgeColor:axis===0?'#257bb6':'#148e9d',{value:1},0,1,.001,true,outer?1:.35);ink.side=THREE.DoubleSide;
  const stroke=new THREE.Mesh(geometry,ink);stroke.raycast=()=>{};stroke.renderOrder=1;
  board.add(stroke);board.userData.materials.push(ink);boardStrokes.push(stroke);
 }
 for(let axis=0;axis<2;axis++)for(let line=0;line<=8;line++){
  for(let pass=0;pass<(line===0||line===8?3:1);pass++)ribbon(axis,line,pass);
 }
 // Retraced upper and lower side edges give the plinth its own rough silhouette.
 for(const y of [-.12,-.28])for(let axis=0;axis<2;axis++)for(const line of [0,8]){
  for(let pass=0;pass<3;pass++)ribbon(axis,line,pass,y);
 }

 return {
  update(dt,hovered,reduced){
   if(hovered!==lastHovered){if(hovered&&pieceStates.has(hovered)&&!reduced)pieceStates.get(hovered).value=-.12;lastHovered=hovered;}
   for(const progress of pieceStates.values())progress.value=reduced?1:Math.min(1,progress.value+dt/2.1);
   for(const stroke of boardStrokes)stroke.material.uniforms.alpha.value=stroke.material.opacity;
   for(const record of records)for(const entry of record.meshes){entry.fill.uniforms.alpha.value=entry.fill.opacity;entry.ink.uniforms.alpha.value=entry.ink.opacity;if(entry.blue)entry.blue.material.uniforms.alpha.value=entry.blue.material.opacity;}
  },
  dispose(){
   for(const stroke of boardStrokes){board.remove(stroke);stroke.geometry.dispose();stroke.material.dispose();}
   for(const record of records){
    for(const {mesh,original,fill,ink,shell,blue} of record.meshes){mesh.remove(shell);if(blue){mesh.remove(blue);blue.material.dispose();}mesh.material=original;fill.dispose();ink.dispose();}
    record.group.userData.materials=record.materials;
   }
  }
 };
}
