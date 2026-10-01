import * as THREE from './vendor/three.module.js';
export function createPixelSpeech(){
 const bubble=document.createElement('div');bubble.id='pixel-piece-speech';bubble.hidden=true;bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');document.body.append(bubble);
 const lines={c6:['Let’s try a wild move!','Ready to experiment?','Imagination takes an L-shaped leap!'],e5:['One small step, one great start.','Want to see what I’ve made?','One square forward!'],c4:['Follow my taste!','New discoveries, diagonally!','A collection of things I love.'],f3:['Hey there! Want to chat?','Let’s make our next move together.','Good connections start here!']};
 let last=null,count=0;
 return {update(camera,piece,enabled,reduced){
  if(!enabled||!piece?.active){bubble.hidden=true;last=null;return;}
  if(piece!==last){const choices=lines[piece.square]||['Click me for the next scene!'];bubble.textContent=choices[count++%choices.length];bubble.hidden=false;last=piece;
   if(!reduced)bubble.animate([{opacity:0,translate:'0 10px',scale:'.92'},{opacity:1,translate:'0 0',scale:'1'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  const point=piece.model.localToWorld(new THREE.Vector3(0,piece.type==='pawn'?1.1:1.75,0)).project(camera);
  if(point.z<-1||point.z>1){bubble.hidden=true;return;}
  bubble.hidden=false;
  const x=(point.x+1)*innerWidth/2,y=(1-point.y)*innerHeight/2,width=bubble.offsetWidth;
  const left=Math.max(width/2+12,Math.min(innerWidth-width/2-12,x));
  bubble.style.left=`${left}px`;bubble.style.top=`${Math.max(bubble.offsetHeight+24,y-18)}px`;
  bubble.style.setProperty('--tail-x',`${Math.max(16,Math.min(width-28,x-left+width/2))}px`);
 },clear(){bubble.hidden=true;last=null;}};
}
