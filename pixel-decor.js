export function createPixelDecor(){
 const svg=(content,box='0 0 24 20')=>`<svg viewBox="${box}" shape-rendering="crispEdges" aria-hidden="true">${content}</svg>`;
 const heart=svg('<path fill="#64123f" d="M2 1h7v2h4V1h7v2h2v8h-2v2h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-2H2z"/><path fill="#fa4b9f" d="M4 3h5v2h4V3h7v8h-2v2h-2v2h-2v2h-2v-2h-2v-2H8v-2H6V9H4z"/><path fill="#ffc1df" d="M5 4h3v2H5z"/>');
 const star='<path fill="#64123f" d="M9 0h6v6h6v3h3v6h-6v6h-3v3H9v-6H3v-3H0V9h6V6h3z"/><path fill="#ffdb79" d="M10 3h3v6h6v3h-6v6h-3v-6H4V9h6z"/><path fill="#fff0c1" d="M10 6h3v3h-3z"/>';
 const chest=svg('<path fill="#64123f" d="M3 2h18v2h2v14H1V4h2z"/><path fill="#ff70b0" d="M4 4h16v4H4zM3 11h18v5H3z"/><path fill="#baffdf" d="M3 8h18v3H3zM10 7h4v7h-4z"/><path fill="#64123f" d="M11 9h2v3h-2z"/>');
 const buddy=svg('<path fill="#64123f" d="M4 1h4v3h8V1h4v4h2v11h-2v3H4v-3H2V5h2z"/><path fill="#baffdf" d="M5 4h3v2h8V4h3v3h2v8h-3v3H6v-3H3V7h2z"/><path fill="#64123f" d="M7 9h2v3H7zM15 9h2v3h-2zM10 14h4v2h-4z"/><path fill="#fa4b9f" d="M4 12h3v2H4zM17 12h3v2h-3z"/>');
 const root=document.createElement('div');root.id='pixel-decor';root.setAttribute('aria-hidden','true');
 root.innerHTML=`<section class="pixel-side-card pixel-player-card"><h3>PLAYER 01</h3>${buddy}<div class="pixel-life">${heart.repeat(3)}</div><p>LV. 01<br>CURIOUS MIND</p></section><section class="pixel-side-card pixel-quest-card"><h3>QUEST LOG</h3><p>+ MEET 4 PIECES<br>+ FIND NEW IDEAS<br>+ KEEP EXPLORING</p></section><section class="pixel-side-card pixel-loot-card"><h3>TREASURE</h3>${chest}<p>IDEAS INSIDE!</p></section><div class="pixel-corner-title">PIXEL WORLD<br><span>STAGE 01 / OPENING</span></div>${['a','b','c','d'].map(c=>`<svg class="pixel-decor-star pixel-star-${c}" viewBox="0 0 24 24" shape-rendering="crispEdges">${star}</svg>`).join('')}`;
 document.body.append(root);
}
