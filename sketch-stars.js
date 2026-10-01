import * as THREE from './vendor/three.module.js';

// Screen-space wax doodles: short broken, retraced strokes, never clickable.
export function createSketchStars(pieces){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'4'});
 document.body.append(canvas);
 const ctx=canvas.getContext('2d'),particles=[];
 const mouse={x:-10000,y:-10000,allowed:false};let last=null,cooldown=0,w=0,h=0;
 const colors=['#0036ed','#00b9b0','#f40888','#efba00','#6737c5'];
 const move=e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.allowed=e.pointerType!=='touch'&&(e.target.tagName==='CANVAS'||!!e.target.closest('#piece-controls'));};
 const leave=()=>{mouse.allowed=false;};
 window.addEventListener('pointermove',move);document.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);
 function spawn(center,count){
  for(let i=0;i<count&&particles.length<28;i++){
   const angle=Math.random()*Math.PI*2,r=28+Math.random()*36;
   const points=[];
   for(let j=0;j<10;j++){
    const a=-Math.PI/2+j*Math.PI/5+(Math.random()-.5)*.22;
    const radius=(j%2?.37:1)*(.73+Math.random()*.48);
    points.push([Math.cos(a)*radius,Math.sin(a)*radius]);
   }
   particles.push({x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r,vx:Math.cos(angle)*(9+Math.random()*13),vy:-18-Math.random()*20,age:0,life:1.1+Math.random()*.65,size:9+Math.random()*12,angle:(Math.random()-.5)*.9,spin:(Math.random()-.5)*.7,color:colors[Math.floor(Math.random()*colors.length)],points,seed:Math.random()*100});
  }
 }
 function clear(){particles.length=0;last=null;cooldown=0;ctx.clearRect(0,0,w,h);}
 return {clear,update(dt,camera,enabled,reduced){
  if(!enabled||reduced){clear();return;}
  if(w!==innerWidth||h!==innerHeight){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
  let nearest=null,center=null,best=Infinity;
  if(mouse.allowed)for(const piece of pieces){
   if(!piece.model.visible)continue;
   const bottom=piece.model.localToWorld(new THREE.Vector3(0,.15,0)).project(camera);
   const top=piece.model.localToWorld(new THREE.Vector3(0,1.3,0)).project(camera);
   if(top.z<-1||top.z>1)continue;
   const a={x:(bottom.x+1)*w/2,y:(1-bottom.y)*h/2},b={x:(top.x+1)*w/2,y:(1-top.y)*h/2};
   const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((mouse.x-a.x)*dx+(mouse.y-a.y)*dy)/(dx*dx+dy*dy||1)));
   const distance=Math.hypot(mouse.x-a.x-t*dx,mouse.y-a.y-t*dy);
   if(distance<Math.max(32,Math.min(65,Math.hypot(dx,dy)*.45))&&distance<best){best=distance;nearest=piece;center={x:b.x,y:b.y};}
  }
  cooldown-=dt;
  if(nearest&&(nearest!==last||cooldown<=0)){spawn(center,nearest!==last?5:2);cooldown=.48;}last=nearest;
  ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
   const fade=Math.min(1,(p.life-p.age)/.45),draw=Math.min(1,p.age/.19),scale=Math.min(1,p.age/.12);
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(p.size*scale,p.size*scale);ctx.strokeStyle=p.color;
   // Grain and crooked duplicate passes are stable for each particle, not flickering.
   for(let pass=0;pass<3;pass++){
    ctx.globalAlpha=fade*(pass===0?.94:.38);
    for(let j=0;j<10;j++){
     const a=p.points[j],b=p.points[(j+1)%10],segments=22;
     const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
     const bump=t=>Math.sin(t*14+p.seed+j*2.7)*.045+Math.sin(t*33+p.seed*2+j)*.021;
     for(let k=0;k<segments;k++){
      if((j+k/segments)/10>draw)continue;
      const t=k/segments,u=Math.min((k+1)/segments,1),offset=(pass-1)*.025;
      const wobble=bump(t)+offset,next=bump(u)+offset;
      const pressure=.86+.22*Math.sin(t*19+p.seed+j)+.12*Math.sin(t*43+j*7);
      ctx.lineWidth=(pass===0?4.6:2.2)*pressure/p.size;
      ctx.beginPath();ctx.moveTo(a[0]+dx*t+nx*wobble,a[1]+dy*t+ny*wobble);
      ctx.lineTo(a[0]+dx*u+nx*next,a[1]+dy*u+ny*next);ctx.stroke();
     }
    }
   }
   // Paper-coloured pores and short fibres stay fixed in each wax mark.
   const random=n=>{const x=Math.sin(n*127.1+p.seed*311.7)*43758.5453;return x-Math.floor(x);};
   ctx.fillStyle='#fffdf6';ctx.strokeStyle='#fffdf6';
   for(let j=0;j<10;j++){
    const a=p.points[j],b=p.points[(j+1)%10],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
    for(let k=0;k<27;k++){
     const seed=j*31+k,t=(k+random(seed))/27;
     if((j+t)/10>draw)continue;
     const offset=Math.sin(t*14+p.seed+j*2.7)*.045+Math.sin(t*33+p.seed*2+j)*.021+(random(seed+330)-.5)*3.8/p.size;
     const x=a[0]+dx*t+nx*offset,y=a[1]+dy*t+ny*offset;
     ctx.globalAlpha=fade*(.3+random(seed+87)*.5);
     const grain=(.3+random(seed+63)*.55)/p.size;
     ctx.fillRect(x,y,grain,grain*.7);
     if(k%5===0){ctx.lineWidth=.4/p.size;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.9/p.size,y-.45/p.size);ctx.stroke();}
    }
   }
   ctx.restore();
  }
 },dispose(){clear();canvas.remove();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);}};
}
