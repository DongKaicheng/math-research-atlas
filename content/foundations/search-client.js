(() => {
  'use strict';
  const form = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const input = document.getElementById('atlas-search');
  const scope = document.getElementById('foundations-search-scope');
  if (!form || !results || !input) return;
  const asset = document.querySelector('script[src$="/assets/foundations-search.js"]');
  const endpoint = asset?.src.replace(/\/assets\/foundations-search\.js$/, '/search-index.json');
  function add(parent,tag,copy,className) {
    const node=document.createElement(tag);
    node.textContent=copy;
    if(className)node.className=className;
    parent.appendChild(node);
    return node;
  }
  fetch(endpoint).then(response=>{
    if (!response.ok) throw Error('Unable to load the search index.');
    return response.json();
  }).then(index=>{
    function render(){
      const params=new URLSearchParams(location.search);
      const q=params.get('q')?.trim().slice(0,200)||'';
      const scoped=params.get('project')==='foundations';
      input.value=q;
      if (scope) {
        scope.hidden=!scoped;
        scope.querySelector('a').href=q ? '?'+new URLSearchParams({q}) : location.pathname;
      }
      results.replaceChildren();
      if(!q)return;
      const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
      const exact=/^NAG-[0-9]{6}$/i.test(q);
      const candidates=scoped || exact ? index.filter(item=>item.project==='foundations') : index;
      const matches=exact
        ? candidates.filter(item=>item.id?.toUpperCase()===q.toUpperCase())
        : candidates.filter(item=>{
          const text=[item.id,item.title,item.summary,item.body,...item.keywords].join(' ').toLowerCase();
          return terms.every(term=>text.includes(term));
        });
      add(results,'p',matches.length+(matches.length===1?' result':' results')+' for “'+q+'”','eyebrow');
      matches.forEach(item=>{
        const a=document.createElement('a');a.href=item.link;a.className='search-result';
        add(a,'span',item.project==='foundations' ? item.id+' · '+item.coverage : item.category,'micro');
        add(a,'h2',item.title);
        add(a,'p',item.summary);
        results.appendChild(a);
      });
      if(!matches.length)add(results,'p','No results found.','simple-track-empty');
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const params = new URLSearchParams(location.search);
      params.set('q',input.value);
      history.replaceState({},'',location.pathname+'?'+params);
      render();
    });
    addEventListener('popstate',render);
    render();
  }).catch(()=>add(results,'p','Search is temporarily unavailable.','simple-track-empty'));
})();
