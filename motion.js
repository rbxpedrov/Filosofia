/* motion.js — transição suave entre páginas do site.
   Incluído somente em index.html, sobre.html, comentarios.html e flash.html.
   Não é incluído em fakecoments.html nem seed-visits.html, por pedido do autor. */
(function(){
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  window.motionReduced = reduced;

  document.addEventListener('click', function(e){
    if(reduced) return;
    var link = e.target.closest && e.target.closest('a[href]');
    if(!link) return;
    if(link.target === '_blank' || link.hasAttribute('download')) return;
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = link.getAttribute('href');
    if(!href || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    var url;
    try{ url = new URL(href, window.location.href); }catch(err){ return; }
    if(url.origin !== window.location.origin) return;
    if(url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    document.body.classList.add('page-fade-out');
    setTimeout(function(){ window.location.href = href; }, 170);
  });

  window.addEventListener('pageshow', function(e){
    if(e.persisted) document.body.classList.remove('page-fade-out');
  });
})();
