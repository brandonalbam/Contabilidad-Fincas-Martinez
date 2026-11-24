/* Frutas La Estrella — service worker.
   Solo recibe los chats que se comparten desde WhatsApp (Exportar chat → Compartir → La Estrella).
   No guarda la app en caché: todo lo demás va directo a internet como siempre. */
const INBOX='fle-share-inbox';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin||!u.pathname.endsWith('/compartir-chat'))return;
  if(e.request.method!=='POST'){e.respondWith(Response.redirect(new URL('./',self.registration.scope).href,303));return;}
  e.respondWith((async()=>{
    try{
      const fd=await e.request.formData();
      const c=await caches.open(INBOX);
      for(const k of await c.keys())await c.delete(k);
      const files=fd.getAll('chat').filter(f=>f&&typeof f!=='string');
      const meta={t:Date.now(),title:String(fd.get('title')||''),text:String(fd.get('text')||''),files:[]};
      for(let i=0;i<files.length;i++){const f=files[i];const key=new URL('./__compartido/'+i,self.registration.scope).href;
        await c.put(key,new Response(f,{headers:{'content-type':f.type||'application/octet-stream'}}));
        meta.files.push({key,name:f.name||('archivo-'+i),type:f.type||''});}
      await c.put(new URL('./__compartido/meta',self.registration.scope).href,new Response(JSON.stringify(meta),{headers:{'content-type':'application/json'}}));
    }catch(err){}
    return Response.redirect(new URL('./?compartido=1',self.registration.scope).href,303);
  })());
});
