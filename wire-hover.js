import * as THREE from './vendor/three.module.js';

// Transient technical annotations, drawn in screen space around the hovered model.
export function createWireHover(){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'4'});
 document.body.append(canvas);
 const ctx=canvas.getContext('2d'),effects=[];let last=null,w=0,h=0;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function clear(){effects.length=0;last=null;ctx.clearRect(0,0,w,h);}
 function project(piece,camera){
  const point=piece.model.localToWorld(new THREE.Vector3(0,.72,0)).project(camera);
  return {x:(point.x+1)*w/2,y:(1-point.y)*h/2,visible:point.z>=-1&&point.z<=1};
 }
 return {clear,update(dt,camera,hovered,enabled,reduced){
  if(!enabled||reduced){clear();return;}
  if(w!==innerWidth||h!==innerHeight){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
  if(hovered!==last){
   if(last)for(const e of effects)if(e.piece===last)e.release=0;
   if(hovered?.active){
    const point=project(hovered,camera);
    effects.push({piece:hovered,age:0,release:null,x:point.x,y:point.y});
    if(effects.length>5)effects.shift();
   }
   last=hovered;
  }
  ctx.clearRect(0,0,w,h);ctx.lineCap='round';
  for(let i=effects.length-1;i>=0;i--){
   const e=effects[i];e.age+=dt*1.65;if(e.release!==null)e.release+=dt*1.65;
   const alpha=smooth(e.age/.38)*(1-smooth((e.age-1.75)/1.0))*(e.release===null?1:1-smooth(e.release/.7));
   if(e.age>2.75||e.release>.7){effects.splice(i,1);continue;}
   const point=project(e.piece,camera);if(!point.visible)continue;
   const lag=1-Math.exp(-dt*12);e.x+=(point.x-e.x)*lag;e.y+=(point.y-e.y)*lag;
   const unfold=1-Math.exp(-e.age*6),radius=(w<650?49:67)*(.76+.24*unfold)+Math.max(0,e.age-1.7)*7;
   const rotation=.18*e.age-.16*(1-unfold),reveal=smooth(e.age/.8);
   ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=alpha;ctx.strokeStyle='#e8f2ff';ctx.fillStyle='#d6e5f5';ctx.lineWidth=.85;
   // Offset open circles counter-rotate softly instead of flashing or pulsing.
   for(let ring=0;ring<3;ring++){
    const r=radius*(.72+ring*.22),direction=ring%2?-1:1;
    ctx.globalAlpha=alpha*(ring===1?.88:.34);
    ctx.lineWidth=ring===1?4.8:.85;
    for(let arc=0;arc<3;arc++){
     const start=arc*Math.PI*2/3+rotation*direction+ring*.4;
     ctx.beginPath();ctx.arc(0,0,r,start,start+1.63*reveal);ctx.stroke();
    }
   }
   ctx.lineWidth=.85;
   ctx.globalAlpha=alpha*.5;
   for(let n=0;n<48*reveal;n++){
    const angle=n*Math.PI/24-rotation*.4,r=radius*1.2,length=n%4===0?6:2;
    ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);ctx.lineTo(Math.cos(angle)*(r+length),Math.sin(angle)*(r+length));ctx.stroke();
   }
   ctx.globalAlpha=alpha*.22;ctx.beginPath();
   for(let n=0;n<=6;n++){
    const angle=n*Math.PI/3+rotation,r=radius*.87,x=Math.cos(angle)*r,y=Math.sin(angle)*r;
    if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.stroke();
   const nodeAngle=-.8+rotation,nodeX=Math.cos(nodeAngle)*radius,nodeY=Math.sin(nodeAngle)*radius;
   ctx.globalAlpha=alpha*.85;ctx.beginPath();ctx.arc(nodeX,nodeY,2,0,Math.PI*2);ctx.fill();
   // Fictional drafting readouts. Keep them outside the silhouette and on screen.
   const side=e.x+radius+155>w?-1:1,labelX=side*(radius*1.25+17+(1-unfold)*14);
   ctx.globalAlpha=alpha*.55;ctx.beginPath();ctx.moveTo(side*radius*.86,-radius*.36);ctx.lineTo(side*(radius*1.25+7),-radius*.65);ctx.lineTo(labelX+side*105,-radius*.65);ctx.stroke();
   ctx.textAlign=side===1?'left':'right';ctx.textBaseline='middle';ctx.font='9px ui-monospace, SFMono-Regular, Menlo, monospace';
   const p=e.piece.origin||e.piece.model.position;
   const rows=[`NODE / ${(e.piece.square||'00').toUpperCase()}`,`X ${p.x.toFixed(2)}  Z ${p.z.toFixed(2)}`,`θ ${(36+e.age*8.4).toFixed(2)}°  R 1.618`,`VTX 032  /  φ 0.618`];
   rows.forEach((text,n)=>{ctx.globalAlpha=alpha*smooth((e.age-.12-n*.065)/.28)*(n===0?.92:.55);ctx.fillText(text,labelX,-radius*.65+13+n*14);});
   ctx.restore();
  }
 },dispose(){clear();canvas.remove();}};
}
