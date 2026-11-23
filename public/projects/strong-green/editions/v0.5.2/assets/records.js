(() => {
  for (const explorer of document.querySelectorAll('[data-record-explorer]')) {
    const form=explorer.querySelector('form');
    const query=explorer.querySelector('input[name="q"]');
    const status=explorer.querySelector('select[name="status"]');
    const kinds=[...explorer.querySelectorAll('[data-record-kind]')];
    const cards=[...explorer.querySelectorAll('.entry-card')];
    const count=explorer.querySelector('.results-count');
    const empty=explorer.querySelector('.record-empty-state');
    let kind=explorer.dataset.initialKind||'all';
    function draw(){
      const text=query.value.trim().toLocaleLowerCase();
      let visible=0;
      for(const card of cards){
        card.hidden=!((kind==='all'||card.dataset.kind===kind)&&(status.value==='all'||card.dataset.status===status.value)&&(!text||card.dataset.search.toLocaleLowerCase().includes(text)));
        if(!card.hidden)visible++;
      }
      kinds.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.recordKind===kind)));
      count.textContent=visible+' of '+cards.length+' records';
      empty.hidden=visible!==0;
    }
    form.addEventListener('submit',event=>{event.preventDefault();draw();});
    query.addEventListener('input',draw);
    status.addEventListener('change',draw);
    kinds.forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.recordKind;draw();}));
    draw();
  }
})();
