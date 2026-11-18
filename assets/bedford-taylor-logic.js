/* Links, disclosures and readable diagram scaling; no mathematical inference. */
(()=>{
  'use strict';
  const revealTarget=(target,scroll=false)=>{
    if(!target)return;
    for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    if(scroll)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  };
  const fromHash=()=>{
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    revealTarget(document.getElementById(id),true);
  };
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a');
    const href=anchor?.getAttribute('href')||anchor?.getAttribute('xlink:href');
    if(!href?.startsWith('#'))return;
    let id;try{id=decodeURIComponent(href.slice(1));}catch{return;}
    revealTarget(document.getElementById(id),href===location.hash);
  });
  addEventListener('hashchange',fromHash);
  for(const figure of document.querySelectorAll('[data-logic-diagram]')){
    const svg=figure.querySelector('svg'),viewport=figure.querySelector('.bt-logic-graph-scroll'),tools=figure.querySelector('.bt-logic-graph-tools');
    if(!svg||!viewport||!tools)continue;
    const width=Number(svg.getAttribute('viewBox')?.split(/\s+/)[2]);
    if(!Number.isFinite(width)||width<=0)continue;
    let scale=1;
    const apply=()=>{svg.style.width=(width*scale)+'px';tools.querySelector('output').textContent=Math.round(scale*100)+'%';};
    tools.hidden=false;apply();
    tools.addEventListener('click',event=>{
      const action=event.target.closest('[data-logic-zoom]')?.dataset.logicZoom;
      if(!action)return;
      if(action==='in')scale=Math.min(2,scale+0.2);
      if(action==='out')scale=Math.max(0.4,scale-0.2);
      if(action==='reset')scale=1;
      if(action==='fit')scale=Math.min(1.5,Math.max(0.25,(viewport.clientWidth-44)/width));
      if(action==='wide'){
        const wide=document.querySelector('.bt-logical-map').classList.toggle('bt-logic-wide');
        for(const button of document.querySelectorAll('[data-logic-zoom="wide"]')){button.setAttribute('aria-pressed',String(wide));button.textContent=wide?'Restore sidebar':'Wide layout';}
      }
      apply();
    });
  }
  if(location.hash)fromHash();
})();
