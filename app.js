const KEY="datasave_items_v1", PINKEY="datasave_pin_v1";
let items=JSON.parse(localStorage.getItem(KEY)||"[]"), favOnly=false;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(items));render()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)}
function categories(){return [...new Set(items.map(x=>x.category).filter(Boolean))].sort()}
function render(){
  const q=$("searchInput").value.toLowerCase(), cat=$("categoryFilter").value;
  $("totalCount").textContent=items.length; $("favCount").textContent=items.filter(x=>x.favorite).length; $("catCount").textContent=categories().length;
  const old=cat; $("categoryFilter").innerHTML='<option value="all">Toutes les catégories</option>'+categories().map(c=>`<option>${esc(c)}</option>`).join(""); $("categoryFilter").value=categories().includes(old)?old:"all";
  $("categoryList").innerHTML=categories().map(c=>`<option value="${esc(c)}">`).join("");
  const filtered=items.filter(x=>(cat==="all"||x.category===cat)&&(!favOnly||x.favorite)&&(!q||(x.title+" "+x.content+" "+x.category).toLowerCase().includes(q)));
  $("emptyState").classList.toggle("hidden",filtered.length>0); $("dataGrid").innerHTML=filtered.map(card).join("");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function card(x){return `<article class="card"><div class="card-head"><h3>${esc(x.title)}</h3><button class="star" data-fav="${x.id}">${x.favorite?"★":"☆"}</button></div><span class="tag">${esc(x.category||"Sans catégorie")}</span><div class="content">${esc(x.content)}</div><div class="card-actions"><button data-copy="${x.id}">📋 Copier</button><button data-edit="${x.id}">✏️ Modifier</button><button data-del="${x.id}">🗑️</button></div></article>`}
function openModal(x=null){$("modalTitle").textContent=x?"Modifier la donnée":"Nouvelle donnée";$("editId").value=x?.id||"";$("title").value=x?.title||"";$("category").value=x?.category||"";$("content").value=x?.content||"";$("favorite").checked=!!x?.favorite;$("modal").classList.remove("hidden");$("title").focus()}
function closeModal(){$("modal").classList.add("hidden")}
$("addTopBtn").onclick=$("emptyAddBtn").onclick=()=>openModal();
$("closeModal").onclick=$("cancelBtn").onclick=closeModal;
$("dataForm").onsubmit=e=>{e.preventDefault();const id=$("editId").value||crypto.randomUUID();const old=items.find(x=>x.id===id);const obj={id,title:$("title").value.trim(),category:$("category").value.trim()||"Sans catégorie",content:$("content").value.trim(),favorite:$("favorite").checked,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(old)items=items.map(x=>x.id===id?obj:x);else items.unshift(obj);save();closeModal();toast(old?"Donnée modifiée":"Donnée enregistrée")};
$("dataGrid").onclick=async e=>{const b=e.target.closest("button");if(!b)return;const id=b.dataset.copy||b.dataset.edit||b.dataset.del||b.dataset.fav;if(!id)return;const x=items.find(a=>a.id===id);if(b.dataset.copy){await navigator.clipboard.writeText(x.content);toast("Contenu copié")}else if(b.dataset.edit)openModal(x);else if(b.dataset.del){if(confirm("Supprimer cette donnée ?")){items=items.filter(a=>a.id!==id);save();toast("Donnée supprimée")}}else if(b.dataset.fav){x.favorite=!x.favorite;save();toast(x.favorite?"Ajouté aux favoris":"Retiré des favoris")}};
$("searchInput").oninput=render;$("categoryFilter").onchange=render;$("favoritesFilter").onclick=()=>{favOnly=!favOnly;$("favoritesFilter").classList.toggle("active",favOnly);render()};
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"DataSave",version:1,items},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="datasave-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Sauvegarde exportée")};
$("importBtn").onclick=()=>$("fileInput").click();
$("fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.items))throw Error();items=d.items;save();toast("Sauvegarde importée")}catch{alert("Fichier DataSave invalide.")}};r.readAsText(f);e.target.value=""};
$("lockBtn").onclick=lock;
function lock(){$("app").classList.add("hidden");$("lockScreen").classList.remove("hidden");$("pinInput").value="";$("pinInput").focus()}
function enter(){const pin=$("pinInput").value, saved=localStorage.getItem(PINKEY);if(!saved){localStorage.setItem(PINKEY,pin);$("lockScreen").classList.add("hidden");$("app").classList.remove("hidden");toast("PIN configuré")}else if(pin===saved){$("lockScreen").classList.add("hidden");$("app").classList.remove("hidden")}else toast("PIN incorrect")}
$("unlockBtn").onclick=enter;$("pinInput").onkeydown=e=>{if(e.key==="Enter")enter()};
$("setupPinBtn").onclick=()=>{const current=localStorage.getItem(PINKEY);if(current&&!confirm("Le PIN actuel sera remplacé. Continuer ?"))return;const p=prompt("Choisissez un nouveau PIN (4 à 6 chiffres)");if(p&&/^\d{4,6}$/.test(p)){localStorage.setItem(PINKEY,p);toast("PIN mis à jour")}else if(p)alert("Le PIN doit contenir 4 à 6 chiffres.")};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
if(localStorage.getItem(PINKEY)){ $("lockText").textContent="Entrez votre PIN pour accéder à vos données."; } else {$("lockText").textContent="Configurez un PIN pour protéger vos données."; $("setupPinBtn").style.display="none"}
render();
