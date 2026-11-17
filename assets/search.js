(() => {
  'use strict';
  const form = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const input = document.getElementById('atlas-search');
  if (!form || !results || !input) return;
  const asset = document.querySelector('script[src$="/assets/search.js"]');
  const endpoint = asset?.src.replace(/\/assets\/search\.js$/, '/search-index.json');
  function add(parent,tag,copy,className) {
    const node=document.createElement(tag);
    node.textContent=copy;
    if(className)node.className=className;
    parent.appendChild(node);
    return node;
  }
  fetch(endpoint).then(r=>r.json()).then(index=>{
    function render(){
      const q=new URLSearchParams(location.search).get('q')?.trim().slice(0,200)||'';
      input.value=q;
      results.replaceChildren();
      if(!q)return;
      const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
      const matches=index.filter(item=>terms.every(t=>[item.title,item.summary,item.body,...item.keywords].join(' ').toLowerCase().includes(t)));
      add(results,'p',matches.length+' results for “'+q+'”','eyebrow');
      matches.forEach(item=>{
        const a=document.createElement('a');a.href=item.link;a.className='search-result';
        add(a,'span',item.category,'micro');
        add(a,'h2',item.title);
        add(a,'p',item.summary);
        results.appendChild(a);
      });
      if(!matches.length)add(results,'p','No results found.','simple-track-empty');
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();
      history.replaceState({},'',location.pathname+'?q='+encodeURIComponent(input.value));
      render();
    });
    addEventListener('popstate',render);
    render();
  }).catch(()=>add(results,'p','Search is temporarily unavailable.','simple-track-empty'));
})();
