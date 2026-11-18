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
  // The text projection is the primary narrow-screen view and remains usable
  // without JavaScript. Desktop readers can expand it when checking conditions.
  for(const flow of document.querySelectorAll('[data-overview-text]'))flow.open=matchMedia('(max-width:800px)').matches;
  for(const select of document.querySelectorAll('[data-overview-jump]')){
    select.parentElement.hidden=false;
    select.addEventListener('change',()=>{if(select.value){const hash='#'+select.value;if(location.hash===hash)revealTarget(document.getElementById(select.value),true);else location.hash=hash;}});
  }
  for(const figure of document.querySelectorAll('[data-logic-diagram]')){
    const svg=figure.querySelector('svg'),viewport=figure.querySelector('.bt-logic-graph-scroll'),tools=figure.querySelector('.bt-logic-graph-tools');
    if(!svg||!viewport||!tools)continue;
    const width=Number(svg.getAttribute('viewBox')?.split(/\s+/)[2]);
    if(!Number.isFinite(width)||width<=0)continue;
    let scale=1;
    const apply=()=>{svg.style.width=(width*scale)+'px';tools.querySelector('output').textContent=(scale<0.1?(scale*100).toFixed(1):Math.round(scale*100))+'%';};
    tools.hidden=false;apply();
    const locator=figure.querySelector('.bt-overview-locator'),select=figure.querySelector('[data-overview-find]'),locationNote=figure.querySelector('[data-overview-location]');
    let selectedNode;
    const locate=()=>{
      if(!selectedNode)return;
      const bounds=selectedNode.getBoundingClientRect(),frame=viewport.getBoundingClientRect();
      viewport.scrollLeft+=bounds.left-frame.left+bounds.width/2-viewport.clientWidth/2;
      viewport.scrollTop+=bounds.top-frame.top+bounds.height/2-viewport.clientHeight/2;
    };
    if(locator&&select){
      locator.hidden=false;
      select.addEventListener('change',()=>{
        selectedNode?.classList.remove('is-located');
        selectedNode=[...svg.querySelectorAll('[data-overview-node]')].find(node=>node.dataset.overviewNode===select.value);
        if(!selectedNode){locationNote.textContent='';return;}
        selectedNode.classList.add('is-located');
        if(scale<0.7){scale=1;apply();}
        locate();
        locationNote.textContent='Located: '+select.selectedOptions[0].textContent+'. Click the highlighted result to read its scope and related steps.';
      });
      figure.querySelector('[data-overview-clear]')?.addEventListener('click',()=>{
        selectedNode?.classList.remove('is-located');selectedNode=undefined;select.value='';locationNote.textContent='';
      });
    }
    tools.addEventListener('click',event=>{
      const action=event.target.closest('[data-logic-zoom]')?.dataset.logicZoom;
      if(!action)return;
      const previous=scale,centerX=viewport.scrollLeft+viewport.clientWidth/2,centerY=viewport.scrollTop+viewport.clientHeight/2;
      if(action==='in')scale=Math.min(2,scale+0.2);
      if(action==='out')scale=Math.max(0.05,scale-0.2);
      if(action==='reset')scale=1;
      if(action==='fit')scale=Math.min(1.5,Math.max(0.01,(viewport.clientWidth-44)/width));
      if(action==='height'){
        const full=viewport.classList.toggle('is-full-height');
        event.target.closest('button').setAttribute('aria-pressed',String(full));
        event.target.closest('button').textContent=full?'Use scrolling canvas':'Show full height';
      }
      if(action==='wide'){
        const wide=document.querySelector('.bt-logical-map').classList.toggle('bt-logic-wide');
        for(const button of document.querySelectorAll('[data-logic-zoom="wide"]')){button.setAttribute('aria-pressed',String(wide));button.textContent=wide?'Restore sidebar':'Wide layout';}
      }
      apply();
      if(action==='fit'){viewport.scrollLeft=0;viewport.scrollTop=0;}
      else if(selectedNode)locate();
      else if(scale!==previous){viewport.scrollLeft=centerX*scale/previous-viewport.clientWidth/2;viewport.scrollTop=centerY*scale/previous-viewport.clientHeight/2;}
    });
  }
  if(location.hash)fromHash();
})();
