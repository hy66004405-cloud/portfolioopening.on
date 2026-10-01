import { designProjects } from './design-projects.js?v=25';

export function createDesignGallery(onBack) {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const root=document.createElement('section');root.id='design-exhibit';root.hidden=true;root.tabIndex=-1;root.setAttribute('aria-label','School project 대시보드');
 const total=designProjects.reduce((n,p)=>n+p.slides.length,0);
 const projectsHTML=designProjects.map((p,i)=>{
  const primaries=p.slides; // Supporting studies remain accessible without a detail screen.
  return `<section class="design-lane ${primaries.length===1?'single':''}" id="lane-${p.id}" data-project="${i}"><div class="lane-heading"><div><span>${num(i+1)}</span><h2>${esc(p.title)}</h2><small>${primaries.length} WORK${primaries.length===1?'':'S'}</small></div><div class="lane-navigation"><button data-shift="-1" aria-label="${esc(p.title)} 이전 카드">←</button><button data-shift="1" aria-label="${esc(p.title)} 다음 카드">→</button></div></div><div class="design-track" tabindex="0" aria-label="${esc(p.title)} 작업 카드">${primaries.map(s=>{
   const index=p.slides.indexOf(s),support=p.slides.filter(x=>x.parentId===s.id).length;
   return `<button class="design-card ${s.width>s.height*1.12?'wide':s.height>s.width*1.12?'portrait':'square'}" style="--art-ratio:${s.width/s.height}" data-slide="${index}" aria-label="${esc(s.title)} 작품" data-section="${esc(s.section)}"><div class="card-image"><img src="${s.image}" width="${s.width}" height="${s.height}" alt="${esc(s.title)}" loading="lazy" draggable="false"><span class="card-open" aria-hidden="true">↗</span>${support?`<span class="study-count">+${support} 제안</span>`:''}</div><div class="card-caption"><span>${esc(s.section||s.title)}</span><small>${s.completionRank?'완성본':'↗'}</small></div></button>`;
  }).join('')}</div></section>`;
 }).join('');
 root.innerHTML=`<div class="dashboard-shell"><header class="dashboard-header"><button class="dashboard-brand dashboard-back" aria-label="시작 화면으로 돌아가기">opening.</button><span class="dashboard-label">SELECTED DESIGN WORKS</span><span class="dashboard-count">${total} IMAGES / 06 COLLECTIONS</span></header><aside class="dashboard-sidebar"><span class="sidebar-label">COLLECTIONS</span><nav>${designProjects.map((p,i)=>`<button data-jump="${i}"><span>${num(i+1)}</span><span>${esc(p.title)}</span><small>${p.slides.length}</small></button>`).join('')}</nav><div class="sidebar-bottom"><span>대외활동</span><span>Scroll. Explore. Discover.</span></div></aside><main class="dashboard-scroll"><div class="dashboard-intro"><div><p>AN ONGOING PRACTICE</p><h1>School <em>project.</em></h1></div><span>생각에서 형태로,<br>작업과 그 사이의 과정.</span></div>${projectsHTML}<div class="dashboard-end"><span>END OF COLLECTION</span><button class="dashboard-top" aria-label="맨 위로">↑</button></div></main></div><div class="sr-only dashboard-status" role="status" aria-live="polite"></div>`;
 document.body.append(root);
 const q=s=>root.querySelector(s),scroll=q('.dashboard-scroll');
 const dialog=document.createElement('dialog');dialog.className='design-detail';dialog.setAttribute('aria-label','디자인 작업 확대 보기');
 dialog.innerHTML=`<header class="detail-header"><div><span class="detail-project-name"></span><h2></h2></div><button class="detail-close" aria-label="대시보드로 돌아가기">×</button></header><div class="detail-layout"><div class="detail-canvas"><div class="detail-image-wrap"><img class="detail-image" alt="" draggable="false"><span class="detail-load" hidden>Loading</span></div><footer class="detail-image-controls"><button class="detail-prev" aria-label="이전 세부 이미지">←</button><span class="detail-position"></span><button class="detail-next" aria-label="다음 세부 이미지">→</button><a class="detail-original" target="_blank" rel="noopener" aria-label="원본 이미지 새 탭에서 열기">↗</a></footer></div><aside class="detail-sidebar"><div class="detail-sidebar-heading"><span>IN THIS PROJECT</span><span class="detail-slide-total"></span></div><div class="detail-items"></div></aside></div>`;
 document.body.append(dialog);
 const d=s=>dialog.querySelector(s);let projectIndex=0,slideIndex=0,request=0,origin=null;
 // Ease wheel input while retaining native touch, horizontal gestures and zoom.
 let scrollFrame=0,scrollTarget=0,scrollTime=0;
 const stopScroll=()=>{cancelAnimationFrame(scrollFrame);scrollFrame=0;};
 const easeScroll=now=>{
  const dt=Math.min(now-scrollTime,40);scrollTime=now;
  scrollTarget=Math.max(0,Math.min(scrollTarget,scroll.scrollHeight-scroll.clientHeight));
  const next=scroll.scrollTop+(scrollTarget-scroll.scrollTop)*(1-Math.exp(-dt/105));
  scroll.scrollTo({top:Math.abs(scrollTarget-next)<.5?scrollTarget:next,behavior:'instant'});
  if(Math.abs(scrollTarget-scroll.scrollTop)>.5)scrollFrame=requestAnimationFrame(easeScroll);else scrollFrame=0;
 };
 scroll.addEventListener('wheel',e=>{
  if(reduce.matches||e.ctrlKey||e.metaKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY)return;
  const delta=e.deltaY*(e.deltaMode===1?18:e.deltaMode===2?scroll.clientHeight:1);
  const limit=scroll.scrollHeight-scroll.clientHeight;if(limit<=0)return;
  e.preventDefault();if(!scrollFrame)scrollTarget=scroll.scrollTop;
  scrollTarget=Math.max(0,Math.min(limit,scrollTarget+delta));
  if(!scrollFrame){scrollTime=performance.now();scrollFrame=requestAnimationFrame(easeScroll);}
 },{passive:false});
 root.addEventListener('pointerdown',stopScroll,{passive:true});
 root.addEventListener('keydown',stopScroll);
 reduce.addEventListener('change',stopScroll);
 q('.dashboard-back').onclick=onBack;
 q('.dashboard-top').onclick=()=>scroll.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
 root.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.jump),lane=q(`#lane-${designProjects[i].id}`);
  scroll.scrollTo({top:scroll.scrollTop+lane.getBoundingClientRect().top-scroll.getBoundingClientRect().top-20,behavior:reduce.matches?'instant':'smooth'});
 });
 const observer=new IntersectionObserver(entries=>{
  for(const e of entries)if(e.isIntersecting)root.querySelectorAll('[data-jump]').forEach(b=>b.setAttribute('aria-current',b.dataset.jump===e.target.dataset.project?'true':'false'));
 },{root:scroll,rootMargin:'-5% 0px -60% 0px',threshold:0});
 root.querySelectorAll('.design-lane').forEach(lane=>{
  observer.observe(lane);const track=lane.querySelector('.design-track');
  const cards=[...lane.querySelectorAll('.design-card')],carousel=cards.length>1;let current=0;
  function selectCard(index){
   current=Math.max(0,Math.min(cards.length-1,index));
   cards.forEach((card,i)=>{const offset=i-current;card.dataset.offset=String(Math.max(-2,Math.min(2,offset)));card.inert=Math.abs(offset)>1;card.setAttribute('aria-current',String(offset===0));card.setAttribute('aria-label',`${card.querySelector('img').alt} ${offset===0?'현재 작품':'중앙으로 이동'}`);});
   lane.querySelectorAll('[data-shift]').forEach(b=>b.disabled=Number(b.dataset.shift)<0?current===0:current===cards.length-1);
  }
  if(carousel){lane.classList.add('is-carousel');selectCard(0);}

  lane.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>carousel?selectCard(current+Number(b.dataset.shift)):track.scrollBy({left:Number(b.dataset.shift)*track.clientWidth*.72,behavior:reduce.matches?'instant':'smooth'}));
  track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();carousel?selectCard(current+(e.key==='ArrowRight'?1:-1)):track.scrollBy({left:(e.key==='ArrowRight'?1:-1)*track.clientWidth*.65,behavior:reduce.matches?'instant':'smooth'})}});
  let drag=null,suppress=false;
  track.addEventListener('pointerdown',e=>{suppress=false;if(e.button!==0||(!carousel&&e.pointerType==='touch'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:track.scrollLeft,moved:false};});
  track.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(carousel&&Math.abs(e.clientY-drag.y)>Math.abs(dx)&&!drag.moved){drag=null;return}if(Math.abs(dx)>6){drag.moved=true;track.setPointerCapture(e.pointerId);track.classList.add('dragging')}if(drag.moved&&!carousel)track.scrollLeft=drag.start-dx;});
  const finish=e=>{if(!drag)return;suppress=drag.moved;if(carousel&&drag.moved&&e.type==='pointerup'&&Math.abs(e.clientX-drag.x)>35)selectCard(current+(e.clientX<drag.x?1:-1));drag=null;track.classList.remove('dragging');if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId)};
  track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
  track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation();suppress=false}},true);
  lane.querySelectorAll('.design-card').forEach(card=>{
   card.onclick=()=>{if(carousel&&cards.indexOf(card)!==current)selectCard(cards.indexOf(card));};
   if(!carousel)card.setAttribute('aria-label',card.querySelector('img').alt);
   let frame=0;
   card.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches||drag?.moved)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{card.style.setProperty('--rx',`${(y-.5)*-3}deg`);card.style.setProperty('--ry',`${(x-.5)*4}deg`);card.style.setProperty('--px',`${x*100}%`);card.style.setProperty('--py',`${y*100}%`);});});
   card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');});
  });
 });
 function openDetail(pi,si,button){projectIndex=pi;slideIndex=si;origin=button;renderDetail(true);dialog.showModal();if(!reduce.matches)dialog.animate([{opacity:0,transform:'translateY(18px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:440,easing:'cubic-bezier(.16,1,.3,1)'});}
 function renderDetail(rebuild=false){
  const p=designProjects[projectIndex],s=p.slides[slideIndex],serial=++request;
  d('.detail-project-name').textContent=p.title;d('h2').textContent=s.title;d('.detail-slide-total').textContent=num(p.slides.length);
  d('.detail-position').textContent=`${num(slideIndex+1)} / ${num(p.slides.length)}${s.role==='support'?' · 제안':s.completionRank?' · 완성본':''}`;
  d('.detail-original').href=encodeURI(s.original);d('.detail-prev').disabled=slideIndex===0;d('.detail-next').disabled=slideIndex===p.slides.length-1;
  if(rebuild){
   let lastSection=null;
   d('.detail-items').innerHTML=p.slides.map((item,i)=>{
    const section=item.section||'작업 이미지',heading=section!==lastSection?`<p class="detail-group">${esc(section)}</p>`:'';lastSection=section;
    return `${heading}<button class="detail-item ${item.role}" data-detail-slide="${i}" aria-label="${esc(item.title)}"><img src="${item.image}" alt="" loading="lazy"><span><strong>${esc(item.title)}</strong><small>${item.role==='support'?'↳ 제안':item.completionRank?'완성본':num(i+1)}</small></span></button>`;
   }).join('');
   d('.detail-items').querySelectorAll('button').forEach(b=>b.onclick=()=>{slideIndex=Number(b.dataset.detailSlide);renderDetail()});
  }
  d('.detail-items').querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.detailSlide)===slideIndex?'true':'false'));
  const img=d('.detail-image');img.classList.add('switching');d('.detail-load').hidden=false;
  const loader=new Image();loader.onload=()=>{if(serial!==request)return;img.src=s.image;img.alt=s.title;img.classList.remove('switching');d('.detail-load').hidden=true;};
  loader.onerror=()=>{if(serial===request)d('.detail-load').textContent='이미지를 불러올 수 없습니다'};loader.src=s.image;
  q('.dashboard-status').textContent=`${p.title}. ${s.title}. ${slideIndex+1}/${p.slides.length}`;
  const next=p.slides[slideIndex+1];if(next){const preload=new Image();preload.src=next.image;}
 }
 function step(n){const target=slideIndex+n;if(target<0||target>=designProjects[projectIndex].slides.length)return;slideIndex=target;renderDetail();}
 d('.detail-close').onclick=()=>dialog.close();d('.detail-prev').onclick=()=>step(-1);d('.detail-next').onclick=()=>step(1);
 dialog.addEventListener('close',()=>{request++;origin?.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 document.addEventListener('keydown',e=>{if(!dialog.open||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}});
 const imageWrap=d('.detail-image-wrap');let touch=null;
 imageWrap.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touch={x:e.clientX,y:e.clientY}});
 imageWrap.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1)});
 imageWrap.addEventListener('pointercancel',()=>touch=null);
 imageWrap.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;const r=imageWrap.getBoundingClientRect();imageWrap.style.setProperty('--ix',`${((e.clientX-r.left)/r.width-.5)*7}px`);imageWrap.style.setProperty('--iy',`${((e.clientY-r.top)/r.height-.5)*7}px`)});
 imageWrap.addEventListener('pointerleave',()=>{imageWrap.style.setProperty('--ix','0px');imageWrap.style.setProperty('--iy','0px')});
 return {show(){
  stopScroll();
  root.getAnimations().forEach(a=>a.cancel());
  root.classList.remove('entering');root.hidden=false;scroll.scrollTop=0;
  root.querySelectorAll('.design-card').forEach((card,i)=>card.style.setProperty('--arrival',`${520+Math.min(i,8)*65}ms`));
  void root.offsetWidth;root.classList.add('entering');
  if(!reduce.matches)root.animate([{clipPath:'inset(0 0 100% 0)',transform:'translateY(-55px)'},{clipPath:'inset(0 0 0% 0)',transform:'translateY(0)'}],{duration:950,easing:'cubic-bezier(.22,1,.36,1)'});
  root.focus({preventScroll:true});},hide(){stopScroll();if(dialog.open)dialog.close();root.hidden=true;request++;},isDetailOpen(){return dialog.open;},element:root};
}
const num=n=>String(n).padStart(2,'0');
function esc(value){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
