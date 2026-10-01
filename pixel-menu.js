import { pixelText } from './pixel-type.js';
export function createPixelMenu({snapshot,restore,start,exit,configure}){
 const root=document.createElement('aside');root.id='pixel-game-menu';root.hidden=true;root.setAttribute('aria-label','Pixel 게임 메뉴');
 root.innerHTML=`<nav aria-label="게임 명령"><button data-action="start">START</button><button data-action="load">LOAD</button><button data-action="options" aria-expanded="false" aria-controls="pixel-options">OPTIONS</button><button data-action="exit">EXIT</button></nav><section id="pixel-options" hidden aria-label="Pixel 설정"><label>PIXEL SIZE<select id="pixel-size"><option value="2">FINE · 2px</option><option value="4">CLASSIC · 4px</option><option value="6">CHUNKY · 6px</option></select></label><label class="pixel-check"><input id="pixel-motion" type="checkbox"> MOUSE EFFECTS</label><button id="pixel-options-close">DONE</button></section><p id="pixel-menu-status" role="status" aria-live="polite"></p>`;
 root.querySelectorAll('nav button,#pixel-options-close').forEach(button=>{const text=button.textContent;button.setAttribute('aria-label',text);button.innerHTML=pixelText(text);});
 document.body.append(root);
 const status=root.querySelector('#pixel-menu-status'),options=root.querySelector('#pixel-options'),toggle=root.querySelector('[data-action=options]'),loadButton=root.querySelector('[data-action=load]');
 const key='opening.pixel.view.v1',settingsKey='opening.pixel.options.v1';let saved=null,timer=0,enabled=false,settings={size:4,motion:true};
 try{const data=JSON.parse(localStorage.getItem(key));if(data&&['yaw','pitch','zoom'].every(k=>Number.isFinite(data[k]))&&data.zoom>=.48&&data.zoom<=1.8&&data.pitch>=.12&&data.pitch<=Math.PI-.12)saved=data;const prefs=JSON.parse(localStorage.getItem(settingsKey));if(prefs&&[2,4,6].includes(prefs.size)&&typeof prefs.motion==='boolean')settings=prefs;}catch{}
 const size=root.querySelector('#pixel-size'),motion=root.querySelector('#pixel-motion');size.value=settings.size;motion.checked=settings.motion;configure(settings);
 function close(){options.hidden=true;toggle.setAttribute('aria-expanded','false');}
 function save(){clearTimeout(timer);if(!enabled)return;saved=snapshot();try{localStorage.setItem(key,JSON.stringify(saved));status.textContent='VIEW SAVED';}catch{status.textContent='VIEW SAVED · THIS SESSION';}loadButton.disabled=false;}
 function schedule(e){if(enabled&&e.target.closest('#canvas-container,#piece-controls,#pixel-dpad')){clearTimeout(timer);timer=setTimeout(save,900);}}
 window.addEventListener('pointerup',schedule);window.addEventListener('wheel',schedule,{passive:true});
 window.addEventListener('pagehide',()=>{if(enabled&&timer)save();});
 root.querySelector('[data-action=start]').onclick=()=>{clearTimeout(timer);start();close();status.textContent='READY · SELECT A PIECE';};
 loadButton.onclick=()=>{if(!saved)return;clearTimeout(timer);restore(saved);close();status.textContent='VIEW LOADED';};
 toggle.onclick=()=>{options.hidden=!options.hidden;toggle.setAttribute('aria-expanded',String(!options.hidden));if(!options.hidden)size.focus();};
 root.querySelector('#pixel-options-close').onclick=()=>{close();toggle.focus();};
 root.querySelector('[data-action=exit]').onclick=()=>{save();close();exit();};
 function change(){settings={size:Number(size.value),motion:motion.checked};configure(settings);try{localStorage.setItem(settingsKey,JSON.stringify(settings));}catch{}status.textContent='OPTIONS UPDATED';}
 size.onchange=change;motion.onchange=change;
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!options.hidden){e.preventDefault();e.stopPropagation();close();toggle.focus();}});
 root.addEventListener('pointerenter',()=>{status.textContent=saved?'VIEW SAVED':'AUTO SAVE · ROTATE / ZOOM';});
 return {update(active){enabled=active;root.hidden=!active;loadButton.disabled=!saved;if(!active){clearTimeout(timer);close();}},get settings(){return settings;}};
}
