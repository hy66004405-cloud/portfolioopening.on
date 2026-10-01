export function createPixelDpad(turn){
 const root=document.createElement('nav');root.id='pixel-dpad';root.hidden=true;root.setAttribute('aria-label','Rotate board');
 const dirs=[['up',0],['left',-90],['down',180],['right',90]];
 root.innerHTML=dirs.map(([direction,angle])=>`<button type="button" data-direction="${direction}" aria-label="Rotate ${direction}"><svg viewBox="0 0 9 9" aria-hidden="true" shape-rendering="crispEdges" style="rotate:${angle}deg"><path fill="currentColor" d="M4 0h1v1h1v1h1v1h1v1H6v5H3V4H1V3h1V2h1V1h1z"/></svg></button>`).join('');
 document.body.append(root);let held=null,age=0,enabled=false;
 const stop=()=>{held=null;age=0;root.querySelectorAll('button').forEach(b=>b.classList.remove('held'));};
 root.querySelectorAll('button').forEach(button=>{
  button.addEventListener('pointerdown',e=>{if(!enabled||e.button!==0)return;held=button.dataset.direction;age=0;button.classList.add('held');button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
  button.onclick=()=>{if(enabled)turn(button.dataset.direction,.18);};
 });
 window.addEventListener('blur',stop);
 return {update(dt,active){enabled=active;root.hidden=!active;if(!active){stop();return;}if(held){age+=dt;if(age>.24)turn(held,dt*1.3);}}};
}
