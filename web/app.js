let state = { lang: 'ar', citizens: [], cases: [], wanted: [], vehicles: [], laws: [] }
let currentPage = 'dashboard'
let currentProfile = null
let tempCase = { officers: [], suspects: [] }
let searchTimers = {}

const labels = {
  ar: { dashboard:'الرئيسية', citizens:'المواطنين', cases:'القضايا', wanted:'المطلوبين', vehicles:'المركبات', laws:'دليل المخالفات والقضايا', suspicious:'المعاملات البنكية المشبوهة', latestCases:'آخر القضايا', wantedList:'المطلوبين', activeOfficers:'الأكثر تفاعلًا', addCase:'إنشاء قضية', addWanted:'إضافة مطلوب', addVehicle:'تسجيل مخالفة مركبة', search:'بحث عن اسم / رقم هوية / لوحة...', save:'حفظ', close:'إغلاق', back:'رجوع', info:'المعلومات', properties:'الأملاك' },
  en: { dashboard:'Dashboard', citizens:'Citizens', cases:'Cases', wanted:'Wanted', vehicles:'Vehicles', laws:'Laws Guide', suspicious:'Suspicious Bank Transactions', latestCases:'Latest Cases', wantedList:'Wanted List', activeOfficers:'Most Active', addCase:'Create Case', addWanted:'Add Wanted', addVehicle:'Flag Vehicle', search:'Search name / CID / plate...', save:'Save', close:'Close', back:'Back', info:'Info', properties:'Properties' }
}

function t(k){ return labels[state.lang][k] || k }
function nui(name, data = {}) { return fetch(`https://${GetParentResourceName()}/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()) }

window.addEventListener('message', async e => {
  if (e.data.action === 'open') {
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
    document.getElementById('app').classList.remove('hidden')
    await fetchData()
    show('dashboard')
  }
})

async function fetchData(){ const data = await nui('getData'); if (!data.error) state = { ...state, ...data } }
function setLang(lang){ state.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; renderMenu(); show(currentPage) }
function renderMenu(){ document.getElementById('menu').innerHTML = `<div class="brand"><span>AJ</span><b>MDT</b></div>${['dashboard','citizens','cases','wanted','vehicles','suspicious','laws'].map(menuButton).join('')}<div class="lang"><button onclick="setLang('ar')">عربي</button><button onclick="setLang('en')">EN</button></div><button class="danger" onclick="closeMdt()">${t('close')}</button>` }
function menuButton(p){ return `<button class="nav ${currentPage===p?'active':''}" onclick="show('${p}')">${t(p)}</button>` }
function show(page){ currentPage = page; renderMenu(); document.getElementById('content').innerHTML = globalSearch() + (({dashboard,citizens,cases,wanted,vehicles,suspicious,laws}[page] || dashboard)()); if(page === 'cases') setTimeout(loadLaws, 50) }

function globalSearch(){ return `<div class="global-search"><input id="globalSearch" oninput="searchSuggestions(this.value)" autocomplete="off" placeholder="${t('search')}"><div id="suggestions" class="suggestions hidden"></div></div>` }
function searchSuggestions(value){
  const box = document.getElementById('suggestions')
  const q = (value || '').trim().toLowerCase()
  if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return }
  const results = []
  state.citizens.forEach(c => { if (`${c.name} ${c.citizenid}`.toLowerCase().includes(q)) results.push({type:'citizen', title:c.name, sub:c.citizenid + ' • ' + c.phone, cid:c.citizenid}) })
  state.vehicles.forEach(v => { if (`${v.plate} ${v.owner_name||v.owner||''} ${v.vehicle||''}`.toLowerCase().includes(q)) results.push({type:'vehicle', title:v.plate, sub:(v.owner_name||v.owner||'') + ' • ' + (v.vehicle||''), plate:v.plate}) })
  box.innerHTML = results.slice(0, 8).map((r,i) => `<div class="suggestion" onclick="runSearchResult(${i})"><b>${r.type === 'citizen' ? '👤' : '🚗'} ${r.title}</b><small>${r.sub}</small></div>`).join('') || '<div class="suggestion empty">لا توجد نتائج</div>'
  window.lastSearchResults = results
  box.classList.remove('hidden')
}
function runSearchResult(i){ const r = window.lastSearchResults[i]; hideSuggestions(); if(!r)return; if(r.type==='citizen') citizenDetails(r.cid); if(r.type==='vehicle') vehicleDetails(r.plate) }
function hideSuggestions(){ const box=document.getElementById('suggestions'); if(box){box.classList.add('hidden'); box.innerHTML=''} }

function dashboard(){ return `<header><h1>${t('dashboard')}</h1><p>Live QBCore MDT</p></header><div class="stats"><div class="card"><small>${t('citizens')}</small><b>${state.citizens.length}</b></div><div class="card"><small>${t('cases')}</small><b>${state.cases.length}</b></div><div class="card"><small>${t('wanted')}</small><b>${state.wanted.length}</b></div></div><div class="grid"><section class="panel"><h2>${t('latestCases')}</h2>${caseRows(state.cases.slice(0,5))}</section><section class="panel"><h2>${t('wantedList')}</h2>${wantedRows(state.wanted.slice(0,6))}</section><section class="panel"><h2>${t('activeOfficers')}</h2>${officerStats()}</section></div>` }
function citizens(){ return `<header><h1>${t('citizens')}</h1><input oninput="filterTable(this.value,'citizen-row')" placeholder="${t('search')}"></header><section class="panel">${state.citizens.map(c=>`<div class="row citizen-row" onclick="citizenDetails('${c.citizenid}')"><span><b>${c.name}</b><small>${c.citizenid} • ${c.phone} • ${c.job}</small></span><em>$${Number(c.bank||0).toLocaleString()}</em></div>`).join('')}</section>` }
function cases(){
  tempCase = { officers: [], suspects: [] }
  return `<header><h1>${t('cases')}</h1><p>Case Builder / محرر القضايا</p></header><section class="panel case-builder"><div class="case-section"><label>عنوان القضية</label><input id="caseTitle" placeholder="عنوان القضية"></div><div class="case-section"><label>محتوى القضية HTML</label><div class="editor-toolbar"><button onclick="wrapHtml('b')">Bold</button><button onclick="wrapHtml('h3')">Title</button><button onclick="insertHtmlList()">List</button></div><textarea id="caseContent" class="editor-text" placeholder="اكتب محتوى القضية ويمكنك استخدام HTML"></textarea></div><div class="case-grid"><div><label>نوع القضية</label><select id="caseType" onchange="loadLaws()"><option value="قضية">قضية</option><option value="مخالفة">مخالفة</option></select></div><div><label>حالة القضية</label><select id="caseStatus"><option value="غير منفذة">غير منفذة</option><option value="منفذة">منفذة</option></select></div><div><label>الإجراء المتخذ</label><select id="caseAction"><option value="سجن">سجن</option><option value="مخالفة مالية">مخالفة مالية</option><option value="إجراء خاص">إجراء خاص</option></select></div></div><div class="case-grid two"><div class="case-section smart-field"><label>العساكر المشاركين</label><input id="officerSearch" placeholder="اكتب اسم العسكري أو هويته" oninput="smartPeopleInput(this,'officers',true)"><div id="officersResults" class="suggest-box hidden"></div><div id="officersChips" class="chips"></div></div><div class="case-section smart-field"><label>المتهمين</label><input id="suspectSearch" placeholder="اكتب اسم المتهم أو هويته" oninput="smartPeopleInput(this,'suspects',false)"><div id="suspectsResults" class="suggest-box hidden"></div><div id="suspectsChips" class="chips"></div></div></div><div class="case-section"><label>المخالفات / القضايا المرتبطة</label><select id="lawsSelect" multiple></select></div><div class="case-section"><label>تفاصيل إضافية</label><textarea id="caseExtra" placeholder="اختياري"></textarea></div><div class="case-actions"><button class="primary" onclick="submitCase()">${t('save')}</button><button onclick="resetCaseBuilder()">تفريغ</button></div></section><section class="panel"><h2>القضايا المسجلة</h2>${caseRows(state.cases)}</section>`
}
function wanted(){ return `<header><h1>${t('wanted')}</h1></header><section class="panel form"><h2>${t('addWanted')}</h2><input id="wantedName" placeholder="الاسم"><input id="wantedReason" placeholder="السبب"><input id="wantedDanger" placeholder="الخطورة"><button onclick="addWanted()">${t('save')}</button></section><section class="panel">${wantedRows(state.wanted)}</section>` }
function vehicles(){ return `<header><h1>${t('vehicles')}</h1><input oninput="filterTable(this.value,'vehicle-row')" placeholder="${t('search')}"></header><section class="panel form"><h2>${t('addVehicle')}</h2><input id="plate" placeholder="اللوحة"><input id="owner" placeholder="المالك"><input id="violation" placeholder="المخالفة"><button onclick="addVehicle()">${t('save')}</button></section><section class="panel">${state.vehicles.map(v=>`<div class="row vehicle-row" onclick="vehicleDetails('${v.plate}')"><span><b>${v.plate} • ${v.vehicle}</b><small>${v.owner_name||v.owner} • ${v.garage||'N/A'}</small></span><em>${v.violation}</em></div>`).join('')}</section>` }
function laws(){ return `<header><h1>${t('laws')}</h1></header><section class="panel">${state.laws.map(l=>`<div class="row"><span><b>${l.title_ar}</b><small>${l.title_en} • ${l.type || '-'}</small></span><em>$${l.fine} • ${l.jail}m</em></div>`).join('')}</section>` }
function suspicious(){ return `<header><h1>${t('suspicious')}</h1></header><section class="panel empty">جاهزة للربط مع جدول البنك لاحقًا. أرسل اسم الجدول والأعمدة.</section>` }
function caseRows(list){ return (list || []).map(c=>`<div class="row case-row"><span><b>#${c.id} ${c.title}</b><small>${c.citizen_name||'-'} • ${c.officer_name||'-'} • ${c.case_type || '-'}</small></span><em>${c.status}</em></div>`).join('') || '<div class="empty">No data</div>' }
function wantedRows(list){ return (list || []).map(w=>`<div class="row"><span><b>${w.name}</b><small>${w.reason}${w.source === 'case' ? ' • من قضية #' + w.case_id : ''}</small></span><em>${w.source === 'case' ? 'قضية غير منفذة' : w.danger}</em></div>`).join('') || '<div class="empty">No data</div>' }
function officerStats(){ const x={}; state.cases.forEach(c=>x[c.officer_name || 'Unknown']=(x[c.officer_name || 'Unknown']||0)+1); return Object.entries(x).map(([n,v])=>`<div class="row"><span>${n}</span><b>${v}</b></div>`).join('') || '<div class="empty">No data</div>' }
function wrapHtml(tag){ const el=document.getElementById('caseContent'); const text=el.value.substring(el.selectionStart,el.selectionEnd)||'نص'; el.setRangeText(`<${tag}>${text}</${tag}>`) }
function insertHtmlList(){ const el=document.getElementById('caseContent'); el.setRangeText('<ul><li>بند</li></ul>') }
async function smartPeopleInput(input, type, onlyPolice){ clearTimeout(searchTimers[type]); searchTimers[type]=setTimeout(async()=>{ const q=input.value.trim(); const box=document.getElementById(type+'Results'); if(!q){box.classList.add('hidden'); box.innerHTML=''; return} const res=await nui('smartSearchPeople',{query:q,onlyPolice}); box.innerHTML=(res||[]).map((p,i)=>`<div onclick="addCasePerson('${type}',${i})"><b>${p.name}</b><small>${p.citizenid} • ${p.job || ''}</small></div>`).join('')||'<div class="empty">لا توجد نتائج</div>'; window[type+'ResultsData']=res; box.classList.remove('hidden') },180) }
function addCasePerson(type,i){ const p=window[type+'ResultsData'][i]; if(p&&!tempCase[type].some(x=>x.citizenid===p.citizenid)) tempCase[type].push({citizenid:p.citizenid,name:p.name}); renderCaseChips(type); document.getElementById(type+'Results').classList.add('hidden') }
function removeCasePerson(type,cid){ tempCase[type]=tempCase[type].filter(p=>p.citizenid!==cid); renderCaseChips(type) }
function renderCaseChips(type){ const el=document.getElementById(type+'Chips'); if(el) el.innerHTML=tempCase[type].map(p=>`<span class="chip">${p.name}<button onclick="removeCasePerson('${type}','${p.citizenid}')">×</button></span>`).join('') }
async function loadLaws(){ const laws=await nui('getLawsByType',{caseType:val('caseType')||'قضية'}); const select=document.getElementById('lawsSelect'); if(select) select.innerHTML=(laws||[]).map(l=>`<option value="${l.title_ar}">${l.title_ar} - $${l.fine} - ${l.jail}m</option>`).join('') }
function resetCaseBuilder(){ show('cases') }
async function submitCase(){ const title=val('caseTitle'); if(!title)return alert('اكتب عنوان القضية'); await nui('addCase',{title,content:val('caseContent'),caseType:val('caseType'),status:val('caseStatus'),action:val('caseAction'),officers:tempCase.officers,suspects:tempCase.suspects,violations:[...document.getElementById('lawsSelect').selectedOptions].map(o=>o.value),extra:val('caseExtra')}); await fetchData(); show('cases') }
async function addCase(){ return submitCase() }
async function addWanted(){ await nui('addWanted',{name:val('wantedName'),reason:val('wantedReason'),danger:val('wantedDanger')||'medium'}); await fetchData(); show('wanted') }
async function addVehicle(){ await nui('addVehicleFlag',{plate:val('plate'),owner:val('owner'),violation:val('violation')}); await fetchData(); show('vehicles') }
async function citizenDetails(id){ const data=await nui('getCitizenProfile',{citizenid:id}); if(data.error)return alert('Citizen not found'); currentProfile=data; currentPage='profile'; renderMenu(); document.getElementById('content').innerHTML=globalSearch()+renderProfile(data) }
function renderProfile(data){ const c=data.citizen; return `<div class="profile"><div class="profile-header"><div><h1>👤 ${c.name}</h1><p>${c.citizenid} • ${c.phone} • ${c.job}</p></div><button onclick="show('citizens')">${t('back')}</button></div><div class="stats"><div class="card"><small>Bank</small><b>$${Number(c.bank||0).toLocaleString()}</b></div><div class="card"><small>Cash</small><b>$${Number(c.cash||0).toLocaleString()}</b></div><div class="card"><small>Wanted</small><b>${data.wanted.length}</b></div></div><div class="tabs"><button onclick="profileTab('info')">📄 ${t('info')}</button><button onclick="profileTab('vehicles')">🚗 ${t('vehicles')}</button><button onclick="profileTab('properties')">🏠 ${t('properties')}</button><button onclick="profileTab('cases')">📁 ${t('cases')}</button><button onclick="profileTab('wanted')">🚨 ${t('wanted')}</button></div><section id="profileContent" class="panel">${profileInfo(c)}</section></div>` }
function profileTab(tab){ const d=currentProfile,el=document.getElementById('profileContent'); if(!d||!el)return; if(tab==='info')el.innerHTML=profileInfo(d.citizen); if(tab==='vehicles')el.innerHTML=profileVehicles(d.vehicles); if(tab==='properties')el.innerHTML=profileProperties(d.properties); if(tab==='cases')el.innerHTML=caseRows(d.cases); if(tab==='wanted')el.innerHTML=wantedRows(d.wanted) }
function profileInfo(c){ return `<div class="profile-grid"><div class="card"><small>CID</small><b>${c.citizenid}</b></div><div class="card"><small>Phone</small><b>${c.phone}</b></div><div class="card"><small>Birthdate</small><b>${c.birthdate}</b></div><div class="card"><small>Nationality</small><b>${c.nationality}</b></div><div class="card"><small>Job</small><b>${c.job}</b></div><div class="card"><small>Grade</small><b>${c.grade}</b></div></div>` }
function profileVehicles(list){ return (list||[]).map(v=>`<div class="row"><span><b>${v.plate}</b><small>${v.vehicle} • ${v.garage||'N/A'}</small></span><em>${v.state}</em></div>`).join('')||'<div class="empty">لا يوجد مركبات</div>' }
function profileProperties(list){ return (list||[]).map(p=>`<div class="row"><span><b>🏠 ${p.house||p.name||p.apartment_type||p.apartment||'Property'}</b><small>${p.identifier||p.citizenid||''}</small></span></div>`).join('')||'<div class="empty">لا يوجد أملاك</div>' }
function vehicleDetails(plate){ const v=state.vehicles.find(x=>x.plate===plate); if(v) alert(`${v.plate}\nVehicle: ${v.vehicle}\nOwner: ${v.owner_name||v.owner}\nGarage: ${v.garage}\nViolation: ${v.violation}`) }
function val(id){ return document.getElementById(id)?.value||'' }
function filterTable(value,cls){ document.querySelectorAll('.'+cls).forEach(el=>el.style.display=el.innerText.toLowerCase().includes(value.toLowerCase())?'flex':'none') }
function closeMdt(){ nui('close'); document.getElementById('app').classList.add('hidden') }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeMdt() })
renderMenu()
