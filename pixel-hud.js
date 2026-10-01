export function createPixelHud(){
 const root=document.createElement('aside');root.id='pixel-hud';root.hidden=true;root.setAttribute('aria-label','Game status');
 root.innerHTML=`<div class="pixel-hud-energy"><span class="pixel-hud-label">STAMINA</span><div class="pixel-energy-row"><div class="pixel-energy" role="progressbar" aria-label="Stamina" aria-valuemin="0" aria-valuemax="100">${'<i></i>'.repeat(12)}</div><span class="pixel-energy-number">100</span></div></div><div class="pixel-hud-items"><span class="pixel-hud-label">ITEMS</span><div class="pixel-stat-value"><svg aria-hidden="true" viewBox="0 0 12 12" shape-rendering="crispEdges"><path fill="#64123f" d="M3 0h6v2h2v8H9v2H3v-2H1V2h2z"/><path fill="#baffdf" d="M3 2h6v8H3z"/><path fill="#fa4b9f" d="M4 3h2v5H4z"/></svg><span class="pixel-item-number">00 / 04</span></div></div><div class="pixel-hud-score"><span class="pixel-hud-label">SCORE</span><span class="pixel-score-number">000000</span></div>`;
 document.body.append(root);
 const bar=root.querySelector('.pixel-energy'),cells=[...bar.children],energyText=root.querySelector('.pixel-energy-number'),itemsText=root.querySelector('.pixel-item-number'),scoreText=root.querySelector('.pixel-score-number');
 let energy=100,score=0,seen=new Set(),items=new Set(),lastPaint='';
 const squares=['c6','e5','c4','f3'];
 function paint(){const level=Math.round(energy),key=`${level}/${score}/${items.size}`;if(key===lastPaint)return;lastPaint=key;bar.setAttribute('aria-valuenow',level);cells.forEach((cell,i)=>cell.classList.toggle('empty',i>=Math.ceil(energy/100*12)));energyText.textContent=String(level).padStart(3,'0');itemsText.textContent=`${String(items.size).padStart(2,'0')} / 04`;scoreText.textContent=String(score).padStart(6,'0');}
 function pulse(element){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)element.animate([{color:'#ffffff',translate:'0 -3px'},{color:'#baffdf',translate:'0 0'}],{duration:350,easing:'ease-out'});}
 return {
  update(dt,enabled,hovered,dragging){root.hidden=!enabled;if(!enabled)return;
   if(hovered&&squares.includes(hovered.square)&&!seen.has(hovered.square)){seen.add(hovered.square);score+=10;pulse(scoreText);}
   energy=Math.max(0,Math.min(100,energy+dt*(dragging?-7:hovered?-2:6)));paint();
  },
  collect(piece){if(!squares.includes(piece?.square)||items.has(piece.square))return;items.add(piece.square);score+=100;energy=Math.max(0,energy-8);paint();pulse(itemsText);pulse(scoreText);},
  reset(){energy=100;score=0;seen.clear();items.clear();paint();},
  snapshot(){return {energy,score,seen:[...seen],items:[...items]};},
  restore(data){if(!data)return;energy=Number.isFinite(data.energy)?Math.max(0,Math.min(100,data.energy)):100;seen=new Set((Array.isArray(data.seen)?data.seen:[]).filter(x=>squares.includes(x)));items=new Set((Array.isArray(data.items)?data.items:[]).filter(x=>squares.includes(x)));score=seen.size*10+items.size*100;paint();},
  hide(){root.hidden=true;}
 };
}
