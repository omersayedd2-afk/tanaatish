const $=i=>document.getElementById(i),KEY='tanatish_pos_v1';
const base=()=>({products:[],sales:[],settings:{phone:'',addr:'',foot:'شكراً لزيارتكم ❤️'}});
let db=(()=>{try{return{...base(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return base()}})();
let cart=[],cat='الكل',per='day',editId=null,curSale=null;
const money=n=>(Number(n)||0).toLocaleString('ar-EG',{maximumFractionDigits:2})+' ج.م';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=id=>db.products.find(p=>String(p.id)===String(id));
const save=()=>{localStorage.setItem(KEY,JSON.stringify(db));renderAll()};
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)}

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('nav button,.panel').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');$(b.dataset.t).classList.add('on');scrollTo(0,0);renderAll()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.id)});

const A={
  cat:id=>{cat=id;renderSale()},
  add:id=>{const p=P(id),c=cart.find(x=>String(x.id)===String(id));
    if(c){if(c.qty>=p.qty)return toast('وصلت لآخر كمية متاحة');c.qty++}else cart.push({id:p.id,qty:1});renderSale()},
  inc:id=>A.add(id),
  dec:id=>{const c=cart.find(x=>String(x.id)===String(id));if(c&&--c.qty<=0)cart=cart.filter(x=>x!==c);renderSale()},
  checkout,
  saveProduct:()=>{
    const o={name:$('pn').value.trim(),cat:$('pc').value.trim(),buy:+$('pb').value,sell:+$('ps').value,qty:+$('pq').value,min:+$('pm').value||0};
    if(!o.name||$('pb').value===''||$('ps').value===''||$('pq').value===''||o.buy<0||o.sell<0||o.qty<0)return toast('اكتب الاسم والأسعار والكمية بشكل صحيح');
    if(editId){Object.assign(P(editId),o);toast('تم تعديل المنتج')}
    else{db.products.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,6),...o});toast('تم حفظ المنتج')}
    A.cancelEdit();save()},
  edit:id=>{const p=P(id);editId=p.id;$('pn').value=p.name;$('pc').value=p.cat||'';$('pb').value=p.buy;$('ps').value=p.sell;$('pq').value=p.qty;$('pm').value=p.min;
    $('ptitle').textContent='تعديل منتج';$('pcancel').hidden=false;scrollTo(0,0)},
  cancelEdit:()=>{editId=null;['pn','pc','pb','ps','pq'].forEach(i=>$(i).value='');$('pm').value=3;$('ptitle').textContent='إضافة منتج';$('pcancel').hidden=true},
  del:id=>{if(confirm('متأكد إنك عايز تحذف المنتج؟')){db.products=db.products.filter(p=>String(p.id)!==String(id));cart=cart.filter(c=>String(c.id)!==String(id));save()}},
  stk:id=>{const[i,d]=id.split('|'),p=P(i);if(p){p.qty=Math.max(0,p.qty+ +d);save()}},
  per:id=>{per=id;renderReports()},
  view:id=>showReceipt(db.sales.find(s=>String(s.id)===String(id))),
  closeRc:()=>{$('rc').hidden=true},
  delSale:()=>{if(!curSale||!confirm('حذف الفاتورة وإرجاع الكميات للمخزون؟'))return;
    curSale.lines.forEach(l=>{const p=P(l.pid)||db.products.find(x=>x.name===l.name);if(p)p.qty+=l.qty});
    db.sales=db.sales.filter(s=>s!==curSale);$('rc').hidden=true;save();toast('تم حذف الفاتورة')},
  saveSettings:()=>{db.settings={phone:$('sp').value.trim(),addr:$('sa').value.trim(),foot:$('sf').value.trim()};save();toast('تم حفظ البيانات')},
  exportData:()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));
    a.download='tanatish-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)},
  clearSales:()=>{if(confirm('مسح سجل كل الفواتير؟ المخزون لن يتغير.')){db.sales=[];save()}}
};

function renderSale(){
  const cats=['الكل',...new Set(db.products.map(p=>p.cat).filter(Boolean))];if(!cats.includes(cat))cat='الكل';
  $('chips').innerHTML=cats.map(c=>`<button class="chip ${c===cat?'on':''}" data-a="cat" data-id="${esc(c)}">${esc(c)}</button>`).join('');
  const q=$('q').value.trim().toLowerCase();
  $('plist').innerHTML=db.products.filter(p=>p.qty>0&&(cat==='الكل'||p.cat===cat)&&p.name.toLowerCase().includes(q))
    .map(p=>`<button class="pitem" data-a="add" data-id="${p.id}"><b>${esc(p.name)}</b><span>${money(p.sell)}</span><small>متاح ${p.qty}</small></button>`).join('')
    ||'<div class="empty">مفيش منتجات متاحة. ضيف منتجات من تبويب المنتجات.</div>';
  renderCart()}
function renderCart(){
  let sub=0;
  $('cart').innerHTML=cart.map(c=>{const p=P(c.id);if(!p)return'';sub+=p.sell*c.qty;
    return`<div class="row"><div><b>${esc(p.name)}</b><small>${money(p.sell)} × ${c.qty}</small></div><div class="qty"><button data-a="dec" data-id="${p.id}">−</button><b>${c.qty}</b><button data-a="inc" data-id="${p.id}">+</button></div></div>`}).join('')
    ||'<div class="empty">الفاتورة فاضية. اضغط على منتج لإضافته.</div>';
  const d=Math.min(Math.max(+$('disc').value||0,0),sub),t=sub-d,paid=+$('paid').value||0;
  $('sub').textContent=money(sub);$('total').textContent=money(t);
  $('change').textContent=paid>0?(paid>=t?'الباقي للعميل: '+money(paid-t):'ناقص: '+money(t-paid)):'';
  return{sub,d,t,paid}}
function checkout(){
  if(!cart.length)return toast('ضيف منتجات للفاتورة الأول');
  const lines=[];
  for(const c of cart){const p=P(c.id);if(!p||p.qty<c.qty)return toast('راجع المخزون: الكمية غير كافية');lines.push({pid:p.id,name:p.name,qty:c.qty,price:p.sell,buy:p.buy})}
  const{sub,d,t,paid}=renderCart();
  lines.forEach(l=>P(l.pid).qty-=l.qty);
  const s={id:Date.now(),no:Math.max(0,...db.sales.map(x=>x.no||0))+1,date:new Date().toISOString(),lines,sub,disc:d,total:t,paid,profit:t-lines.reduce((a,l)=>a+l.qty*l.buy,0)};
  db.sales.unshift(s);cart=[];$('disc').value=$('paid').value='';save();showReceipt(s)}
function showReceipt(s){
  if(!s)return;curSale=s;const st=db.settings;
  $('rcBody').innerHTML=`<div class="rh"><img src="logo.png" alt=""><h2>تناتيش</h2><small>Home &amp; Kitchen</small>${st.phone?`<div>${esc(st.phone)}</div>`:''}${st.addr?`<div>${esc(st.addr)}</div>`:''}<div>فاتورة رقم ${s.no||s.id}</div><div>${new Date(s.date).toLocaleString('ar-EG')}</div></div>
  <table><tr><th>المنتج</th><th>العدد</th><th>الإجمالي</th></tr>${s.lines.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.price*x.qty)}</td></tr>`).join('')}</table>
  ${s.disc?`<div class="t"><span>المجموع</span><span>${money(s.sub)}</span></div><div class="t"><span>الخصم</span><span>${money(s.disc)}</span></div>`:''}
  <div class="t b"><span>الإجمالي</span><span>${money(s.total)}</span></div>
  ${s.paid?`<div class="t"><span>المدفوع</span><span>${money(s.paid)}</span></div><div class="t"><span>الباقي</span><span>${money(Math.max(0,s.paid-s.total))}</span></div>`:''}
  <div class="rf">${esc(st.foot)}</div>`;
  $('rc').hidden=false}

function renderProducts(){
  $('cats').innerHTML=[...new Set(db.products.map(p=>p.cat).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('');
  $('productList').innerHTML=db.products.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><small>${esc(p.cat||'بدون قسم')} · شراء ${money(p.buy)} · بيع ${money(p.sell)}</small></div><div style="text-align:left"><b>${p.qty} قطعة</b><br><button class="btn light sm" data-a="edit" data-id="${p.id}">تعديل</button><button class="btn danger sm" data-a="del" data-id="${p.id}">حذف</button></div></div>`).join('')
    ||'<div class="empty">مفيش منتجات لسه. ضيف أول منتج من الفورم اللي فوق.</div>'}
function renderStock(){
  const low=db.products.filter(p=>p.qty<=p.min);
  $('lowList').innerHTML=low.map(p=>`<div class="row"><b>${esc(p.name)}</b><span class="low">${p.qty?'باقي '+p.qty:'خلصت'}</span></div>`).join('')||'<div class="empty">كل المنتجات كميتها كويسة ✓</div>';
  $('stockList').innerHTML=db.products.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><small>حد التنبيه ${p.min}</small></div><div class="qty"><button data-a="stk" data-id="${p.id}|-1">−</button><b class="${p.qty<=p.min?'low':''}">${p.qty}</b><button data-a="stk" data-id="${p.id}|1">+</button></div></div>`).join('')||'<div class="empty">مفيش منتجات</div>'}
function renderReports(){
  const n=new Date(),ok=s=>{const d=new Date(s.date);return per==='all'||(per==='day'?d.toDateString()===n.toDateString():n-d<(per==='week'?7:30)*864e5)};
  const ss=db.sales.filter(ok),L={day:'اليوم',week:'آخر 7 أيام',month:'آخر 30 يوم',all:'الكل'};
  $('pers').innerHTML=Object.entries(L).map(([k,v])=>`<button class="chip ${k===per?'on':''}" data-a="per" data-id="${k}">${v}</button>`).join('');
  $('stats').innerHTML=[['المبيعات',money(ss.reduce((a,s)=>a+s.total,0))],['صافي الربح',money(ss.reduce((a,s)=>a+s.profit,0))],['عدد الفواتير',ss.length],['تكلفة المخزون',money(db.products.reduce((a,p)=>a+p.buy*p.qty,0))]].map(([k,v])=>`<div class="stat">${k}<b>${v}</b></div>`).join('');
  const m={};ss.forEach(s=>s.lines.forEach(l=>m[l.name]=(m[l.name]||0)+l.qty));
  $('top').innerHTML=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<div class="row"><b>${esc(k)}</b><span>${v} قطعة</span></div>`).join('')||'<div class="empty">لسه مفيش مبيعات في الفترة دي</div>';
  $('salesList').innerHTML=ss.slice(0,50).map(s=>`<div class="row" data-a="view" data-id="${s.id}" style="cursor:pointer"><div><b>فاتورة #${s.no||s.id}</b><small>${new Date(s.date).toLocaleString('ar-EG')}</small></div><div style="text-align:left"><b>${money(s.total)}</b><small>ربح ${money(s.profit)}</small></div></div>`).join('')||'<div class="empty">مفيش فواتير</div>'}
function renderSettings(){const s=db.settings;$('sp').value=s.phone;$('sa').value=s.addr;$('sf').value=s.foot}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.products)||!Array.isArray(x.sales))throw 0;
    if(confirm('استبدال البيانات الحالية بالنسخة الاحتياطية؟')){db={...base(),...x};save();renderSettings();toast('تم الاسترجاع')}}catch(_){toast('الملف غير صالح')}e.target.value=''};r.readAsText(f)}
function renderAll(){renderSale();renderProducts();renderStock();renderReports()}
renderAll();renderSettings();
