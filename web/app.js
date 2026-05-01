let state = { lang: 'ar', citizens: [], cases: [], wanted: [], vehicles: [], laws: [] }
let currentPage = 'dashboard'
let currentProfile = null

const labels = {
  ar: { dashboard:'الرئيسية', citizens:'المواطنين', cases:'القضايا', wanted:'المطلوبين', vehicles:'المركبات', laws:'دليل المخالفات والقضايا', suspicious:'المعاملات البنكية المشبوهة', latestCases:'آخر القضايا', wantedList:'المطلوبين', activeOfficers:'الأكثر تفاعلًا', addCase:'إضافة قضية', addWanted:'إضافة مطلوب', addVehicle:'تسجيل مخالفة مركبة', search:'بحث...', save:'حفظ', close:'إغلاق', back:'رجوع', info:'المعلومات', properties:'الأملاك' },
  en: { dashboard:'Dashboard', citizens:'Citizens', cases:'Cases', wanted:'Wanted', vehicles:'Vehicles', laws:'Laws Guide', suspicious:'Suspicious Bank Transactions', latestCases:'Latest Cases', wantedList:'Wanted List', activeOfficers:'Most Active', addCase:'Add Case', addWanted:'Add Wanted', addVehicle:'Flag Vehicle', search:'Search...', save:'Save', close:'Close', back:'Back', info:'Info', properties:'Properties' }
}

function t(k){ return labels[state.lang][k] || k }
function nui(name, data = {}) { return fetch(`https://${GetParentResourceName()}/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()) }

window.addEventListener('message', async e => {
  if (e.data.action === 'open') {
    document.getElementById('app').classList.remove('hidden')
    await fetchData()
    show('dashboard')
  }
})

async function fetchData(){ const data = await nui('getData'); if (!data.error) state = { ...state, ...data } }
function setLang(lang){ state.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; renderMenu(); show(currentPage) }

function renderMenu(){
  document.getElementById('menu').innerHTML = `<div class="brand"><span>AJ</span><b>MDT</b></div>${['dashboard','citizens','cases','wanted','vehicles','suspicious','laws'].map(menuButton).join('')}<div class="lang"><button onclick="setLang('ar')">عربي</button><button onclick="setLang('en')">EN</button></div><button class="danger" onclick="closeMdt()">${t('close')}</button>`
}
function menuButton(p){ return `<button class="nav ${currentPage===p?'active':''}" onclick="show('${p}')">${t(p)}</button>` }
function show(page){ currentPage = page; renderMenu(); document.getElementById('content').innerHTML = ({dashboard,citizens,cases,wanted,vehicles,suspicious,laws}[page] || dashboard)() }

function dashboard(){ return `<header><h1>${t('dashboard')}</h1><p>Live QBCore MDT</p></header><div class="stats"><div class="card"><small>${t('citizens')}</small><b>${state.citizens.length}</b></div><div class="card"><small>${t('cases')}</small><b>${state.cases.length}</b></div><div class="card"><small>${t('vehicles')}</small><b>${state.vehicles.length}</b></div></div><div class="grid"><section class="panel"><h2>${t('latestCases')}</h2>${caseRows(state.cases.slice(0,5))}</section><section class="panel"><h2>${t('wantedList')}</h2>${wantedRows(state.wanted.slice(0,6))}</section><section class="panel"><h2>${t('activeOfficers')}</h2>${officerStats()}</section></div>` }
function citizens(){ return `<header><h1>${t('citizens')}</h1><input oninput="filterTable(this.value,'citizen-row')" placeholder="${t('search')}"></header><section class="panel">${state.citizens.map(c=>`<div class="row citizen-row" onclick="citizenDetails('${c.citizenid}')"><span><b>${c.name}</b><small>${c.citizenid} • ${c.phone} • ${c.job}</small></span><em>$${Number(c.bank||0).toLocaleString()}</em></div>`).join('')}</section>` }
function cases(){ return `<header><h1>${t('cases')}</h1></header><section class="panel form"><h2>${t('addCase')}</h2><input id="caseTitle" placeholder="عنوان القضية / Case title"><input id="caseCitizen" placeholder="اسم المواطن / Citizen"><input id="caseDesc" placeholder="الوصف / Description"><button onclick="addCase()">${t('save')}</button></section><section class="panel">${caseRows(state.cases)}</section>` }
function wanted(){ return `<header><h1>${t('wanted')}</h1></header><section class="panel form"><h2>${t('addWanted')}</h2><input id="wantedName" placeholder="الاسم / Name"><input id="wantedReason" placeholder="السبب / Reason"><input id="wantedDanger" placeholder="الخطورة / Danger"><button onclick="addWanted()">${t('save')}</button></section><section class="panel">${wantedRows(state.wanted)}</section>` }
function vehicles(){ return `<header><h1>${t('vehicles')}</h1><input oninput="filterTable(this.value,'vehicle-row')" placeholder="${t('search')}"></header><section class="panel form"><h2>${t('addVehicle')}</h2><input id="plate" placeholder="اللوحة / Plate"><input id="owner" placeholder="المالك / Owner"><input id="violation" placeholder="المخالفة / Violation"><button onclick="addVehicle()">${t('save')}</button></section><section class="panel">${state.vehicles.map(v=>`<div class="row vehicle-row" onclick="vehicleDetails('${v.plate}')"><span><b>${v.plate} • ${v.vehicle}</b><small>${v.owner_name||v.owner} • ${v.garage||'N/A'}</small></span><em>${v.violation}</em></div>`).join('')}</section>` }
function laws(){ return `<header><h1>${t('laws')}</h1></header><section class="panel">${state.laws.map(l=>`<div class="row"><span><b>${l.title_ar}</b><small>${l.title_en}</small></span><em>$${l.fine} • ${l.jail}m</em></div>`).join('')}</section>` }
function suspicious(){ return `<header><h1>${t('suspicious')}</h1></header><section class="panel empty">جاهزة للربط مع جدول البنك لاحقًا. أرسل اسم الجدول والأعمدة.</section>` }

function caseRows(list){ return list.map(c=>`<div class="row"><span><b>#${c.id} ${c.title}</b><small>${c.citizen_name||'-'} • ${c.officer_name||'-'}</small></span><em>${c.status}</em></div>`).join('') || '<div class="empty">No data</div>' }
function wantedRows(list){ return list.map(w=>`<div class="row"><span><b>${w.name}</b><small>${w.reason}</small></span><em>${w.danger}</em></div>`).join('') || '<div class="empty">No data</div>' }
function officerStats(){ const x={}; state.cases.forEach(c=>x[c.officer_name]=(x[c.officer_name]||0)+1); return Object.entries(x).map(([n,v])=>`<div class="row"><span>${n}</span><b>${v}</b></div>`).join('') || '<div class="empty">No data</div>' }

async function addCase(){ await nui('addCase',{title:val('caseTitle'),citizen:val('caseCitizen'),description:val('caseDesc')}); await fetchData(); show('cases') }
async function addWanted(){ await nui('addWanted',{name:val('wantedName'),reason:val('wantedReason'),danger:val('wantedDanger')||'medium'}); await fetchData(); show('wanted') }
async function addVehicle(){ await nui('addVehicleFlag',{plate:val('plate'),owner:val('owner'),violation:val('violation')}); await fetchData(); show('vehicles') }

async function citizenDetails(id){
  const data = await nui('getCitizenProfile', { citizenid: id })
  if (data.error) return alert('Citizen not found')
  currentProfile = data
  currentPage = 'profile'
  renderMenu()
  document.getElementById('content').innerHTML = renderProfile(data)
}

function renderProfile(data){
  const c = data.citizen
  return `<div class="profile"><div class="profile-header"><div><h1>👤 ${c.name}</h1><p>${c.citizenid} • ${c.phone} • ${c.job}</p></div><button onclick="show('citizens')">${t('back')}</button></div><div class="stats"><div class="card"><small>Bank</small><b>$${Number(c.bank||0).toLocaleString()}</b></div><div class="card"><small>Cash</small><b>$${Number(c.cash||0).toLocaleString()}</b></div><div class="card"><small>Wanted</small><b>${data.wanted.length}</b></div></div><div class="tabs"><button onclick="profileTab('info')">📄 ${t('info')}</button><button onclick="profileTab('vehicles')">🚗 ${t('vehicles')}</button><button onclick="profileTab('properties')">🏠 ${t('properties')}</button><button onclick="profileTab('cases')">📁 ${t('cases')}</button><button onclick="profileTab('wanted')">🚨 ${t('wanted')}</button></div><section id="profileContent" class="panel">${profileInfo(c)}</section></div>`
}
function profileTab(tab){ const d=currentProfile; const el=document.getElementById('profileContent'); if(!d||!el)return; if(tab==='info')el.innerHTML=profileInfo(d.citizen); if(tab==='vehicles')el.innerHTML=profileVehicles(d.vehicles); if(tab==='properties')el.innerHTML=profileProperties(d.properties); if(tab==='cases')el.innerHTML=profileCases(d.cases); if(tab==='wanted')el.innerHTML=wantedRows(d.wanted) }
function profileInfo(c){ return `<div class="profile-grid"><div class="card"><small>CID</small><b>${c.citizenid}</b></div><div class="card"><small>Phone</small><b>${c.phone}</b></div><div class="card"><small>Birthdate</small><b>${c.birthdate}</b></div><div class="card"><small>Nationality</small><b>${c.nationality}</b></div><div class="card"><small>Job</small><b>${c.job}</b></div><div class="card"><small>Grade</small><b>${c.grade}</b></div></div>` }
function profileVehicles(list){ return list.map(v=>`<div class="row"><span><b>${v.plate}</b><small>${v.vehicle} • ${v.garage||'N/A'}</small></span><em>${v.state}</em></div>`).join('') || '<div class="empty">لا يوجد مركبات</div>' }
function profileCases(list){ return caseRows(list) }
function profileProperties(list){ return list.map(p=>`<div class="row"><span><b>🏠 ${p.house || p.name || p.apartment_type || p.apartment || 'Property'}</b><small>${p.identifier || p.citizenid || ''}</small></span><em>${p.keyholders ? 'Keys' : ''}</em></div>`).join('') || '<div class="empty">لا يوجد أملاك</div>' }
function vehicleDetails(plate){ const v=state.vehicles.find(x=>x.plate===plate); if(v) alert(`${v.plate}\nVehicle: ${v.vehicle}\nOwner: ${v.owner_name||v.owner}\nGarage: ${v.garage}\nViolation: ${v.violation}`) }
function val(id){ return document.getElementById(id)?.value || '' }
function filterTable(value, cls){ document.querySelectorAll('.'+cls).forEach(el=>el.style.display=el.innerText.toLowerCase().includes(value.toLowerCase())?'flex':'none') }
function closeMdt(){ nui('close'); document.getElementById('app').classList.add('hidden') }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMdt() })
renderMenu()
