/* Progressive disclosure only: the complete linked tree works without JS. */
(()=>{
  'use strict';
  const branches=[...document.querySelectorAll('[data-map-branch]')];
  const controls=document.querySelector('[data-map-controls]');
  if(!branches.length||!controls)return;
  controls.hidden=false;
  const expand=controls.querySelector('[data-map-expand]');
  const collapse=controls.querySelector('[data-map-collapse]');
  const update=()=>{
    expand.disabled=branches.every(b=>b.open);
    collapse.disabled=branches.every(b=>!b.open);
  };
  const setAll=value=>{for(const branch of branches)branch.open=value;update();};
  expand.addEventListener('click',()=>setAll(true));
  collapse.addEventListener('click',()=>setAll(false));
  branches.forEach(branch=>branch.addEventListener('toggle',update));
  const reveal=()=>{
    let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}
    if(!target)return;
    const branch=target.closest('[data-map-branch]');
    if(branch){branch.open=true;update();}
  };
  addEventListener('hashchange',reveal);
  document.querySelectorAll('.bt-map-sidebar a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
    const branch=document.getElementById(link.hash.slice(1));
    if(branch)branch.open=true;
  }));
  reveal();update();
})();
