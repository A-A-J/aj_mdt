let state = { lang: 'ar', citizens: [], cases: [], wanted: [], vehicles: [], laws: [], logs: [], permissions: {} }
let currentPage = 'dashboard'
let currentProfile = null
let tempCase = { officers: [], suspects: [] }
let searchTimers = {}
let caseEditor = null
let editCaseEditor = null
let editingCaseId = null
let editingVehiclePlate = null

const labels = {
  ar: {
    dashboard:'الرئيسية', citizens:'المواطنين', cases:'القضايا', wanted:'المطلوبين', vehicles:'المركبات', laws:'دليل المخالفات والقضايا', logs:'السجلات', suspicious:'المعاملات البنكية المشبوهة',
    latestCases:'آخر القضايا', wantedList:'المطلوبين', activeOfficers:'الأكثر تفاعلًا', addCase:'إنشاء قضية', addVehicle:'تسجيل مخالفة مركبة', search:'بحث عن اسم / رقم هوية / لوحة...', save:'حفظ', close:'إغلاق', back:'رجوع', info:'المعلومات', properties:'الأملاك', edit:'تعديل', delete:'حذف', cancel:'إلغاء'
  },
  en: {
    dashboard:'Dashboard', citizens:'Citizens', cases:'Cases', wanted:'Wanted', vehicles:'Vehicles', laws:'Laws Guide', logs:'Logs', suspicious:'Suspicious Bank Transactions',
    latestCases:'Latest Cases', wantedList:'Wanted List', activeOfficers:'Most Active', addCase:'Create Case', addVehicle:'Flag Vehicle', search:'Search name / CID / plate...', save:'Save', close:'Close', back:'Back', info:'Info', properties:'Properties', edit:'Edit', delete:'Delete', cancel:'Cancel'
  }
}

function t(k){ return labels[state.lang]?.[k] || k }
function can(permission){ return state.permissions && state.permissions[permission] === true }
function val(id){ return document.getElementById(id)?.value || '' }
function money(n){ return Number(n || 0).toLocaleString() }
function esc(v){ return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])) }
function nui(name, data = {}) {
  return fetch(`https://${GetParentResourceName()}/${name}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()).catch(() => ({}))
}

window.addEventListener('message', async e => {
  if (e.data.action === 'open') {
    if (e.data.config?.locale) state.lang = e.data.config.locale
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = state.lang
    document.getElementById('app').classList.remove('hidden')
    await fetchData()
    show('dashboard')
  }
  if (e.data.action === 'forceClose') forceCloseMdt()
})

async function fetchData(){
  const data = await nui('getData')
  if (!data.error) state = { ...state, ...data }
}

function renderMenu(){
  const menu = document.getElementById('menu')
  if (!menu) return
  const pages = ['dashboard','citizens','cases','wanted','vehicles','suspicious','laws']
  if (can('view_logs')) pages.push('logs')
  menu.innerHTML = `<div class="brand"><span>AJ</span><b>MDT</b></div>${pages.map(menuButton).join('')}<button class="danger menu-close" onclick="closeMdt()">${t('close')}</button>`
}
function menuButton(page){ return `<button class="nav ${currentPage === page ? 'active' : ''}" onclick="show('${page}')">${t(page)}</button>` }

function show(page){
  currentPage = page
  caseEditor = null
  editCaseEditor = null
  renderMenu()
  const content = document.getElementById('content')
  const views = { dashboard, citizens, cases, wanted, vehicles, suspicious, laws, logs }
  content.innerHTML = globalSearch() + (views[page] || dashboard)() + modalHost()
  if (page === 'cases') setTimeout(() => { loadLaws(); initCaseEditor() }, 50)
  initDataTables()
}

function globalSearch(){ return `<div class="global-search"><input id="globalSearch" oninput="searchSuggestions(this.value)" autocomplete="off" placeholder="${t('search')}"><div id="suggestions" class="suggestions hidden"></div></div>` }
function searchSuggestions(value){
  const box = document.getElementById('suggestions')
  const q = (value || '').trim().toLowerCase()
  if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return }
  const results = []
  state.citizens.forEach(c => { if (`${c.name} ${c.citizenid}`.toLowerCase().includes(q)) results.push({ type:'citizen', title:c.name, sub:`${c.citizenid} • ${c.phone}`, cid:c.citizenid }) })
  state.vehicles.forEach(v => { if (`${v.plate} ${v.owner_name || v.owner || ''} ${v.vehicle || ''}`.toLowerCase().includes(q)) results.push({ type:'vehicle', title:v.plate, sub:`${v.owner_name || v.owner || ''} • ${v.vehicle || ''}`, plate:v.plate }) })
  window.lastSearchResults = results
  box.innerHTML = results.slice(0, 8).map((r, i) => `<div class="suggestion" onclick="runSearchResult(${i})"><b>${r.type === 'citizen' ? '👤' : '🚗'} ${esc(r.title)}</b><small>${esc(r.sub)}</small></div>`).join('') || '<div class="suggestion empty">لا توجد نتائج</div>'
  box.classList.remove('hidden')
}
function runSearchResult(i){ const r = window.lastSearchResults?.[i]; hideSuggestions(); if (!r) return; if (r.type === 'citizen') citizenDetails(r.cid); if (r.type === 'vehicle') vehicleDetails(r.plate) }
function hideSuggestions(){ const box = document.getElementById('suggestions'); if (box) { box.classList.add('hidden'); box.innerHTML = '' } }

function dtLang(){ return { search:'بحث:', lengthMenu:'عرض _MENU_', info:'عرض _START_ إلى _END_ من _TOTAL_', infoEmpty:'لا يوجد بيانات', zeroRecords:'لا يوجد نتائج', emptyTable:'لا توجد بيانات', paginate:{ first:'الأول', last:'الأخير', next:'التالي', previous:'السابق' } } }
function initDataTables(){
  setTimeout(() => {
    if (!window.jQuery || !$.fn.DataTable) return
    $('.aj-table').each(function(){
      if ($.fn.DataTable.isDataTable(this)) $(this).DataTable().destroy()
      $(this).DataTable({ pageLength: 10, language: dtLang(), order: [] })
    })
  }, 50)
}
function table(id, headers, rows){ return `<table id="${id}" class="aj-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>` }

function toast(msg, type='success'){
  document.querySelectorAll('.toast').forEach(x => x.remove())
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerText = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

function dashboard(){ return `<header><h1>${t('dashboard')}</h1><p>Live QBCore MDT</p></header><div class="stats"><div class="card"><small>${t('citizens')}</small><b>${state.citizens.length}</b></div><div class="card"><small>${t('cases')}</small><b>${state.cases.length}</b></div><div class="card"><small>${t('wanted')}</small><b>${state.wanted.length}</b></div></div><div class="grid"><section class="panel"><h2>${t('latestCases')}</h2>${caseRows(state.cases.slice(0,5))}</section><section class="panel"><h2>${t('wantedList')}</h2>${wantedRows(state.wanted.slice(0,6))}</section><section class="panel"><h2>${t('activeOfficers')}</h2>${officerStats()}</section></div>` }
function citizens(){ return `<header><h1>${t('citizens')}</h1></header><section class="panel">${table('citizensTable',['الصورة','الاسم','الهوية','الجوال','الوظيفة','البنك'], state.citizens.map(c => `<tr onclick="citizenDetails('${esc(c.citizenid)}')"><td><img class="citizen-avatar small" src="${esc(c.image_url || 'https://via.placeholder.com/64x64?text=AJ')}" onerror="this.src='https://via.placeholder.com/64x64?text=AJ'"></td><td>${esc(c.name)}</td><td>${esc(c.citizenid)}</td><td>${esc(c.phone)}</td><td>${esc(c.job)}</td><td>$${money(c.bank)}</td></tr>`))}</section>` }
function cases(){ tempCase = { officers: [], suspects: [] }; return `<header><h1>${t('cases')}</h1><p>Case Builder / محرر القضايا</p></header>${caseBuilder()}<section class="panel"><h2>القضايا المسجلة</h2>${casesTable(state.cases)}</section>` }
function caseBuilder(){
  if (!can('create_case')) return ''
  return `<section class="panel case-builder"><div class="case-section"><label>عنوان القضية</label><input id="caseTitle" placeholder="عنوان القضية"></div><div class="case-section"><label>وصف القضية</label><div id="caseEditor" class="rich-editor"></div></div><div class="case-grid"><div><label>نوع القضية</label><select id="caseType" onchange="loadLaws()"><option value="قضية">قضية</option><option value="مخالفة">مخالفة</option></select></div><div><label>حالة القضية</label><select id="caseStatus"><option value="غير منفذة">غير منفذة</option><option value="منفذة">منفذة</option></select></div><div><label>الإجراء المتخذ</label><select id="caseAction"><option value="سجن">سجن</option><option value="مخالفة مالية">مخالفة مالية</option><option value="إجراء خاص">إجراء خاص</option></select></div></div><div class="case-grid two"><div class="case-section smart-field"><label>العساكر المشاركين</label><input id="officerSearch" placeholder="اكتب اسم العسكري أو هويته" oninput="smartPeopleInput(this,'officers',true)"><div id="officersResults" class="suggest-box hidden"></div><div id="officersChips" class="chips"></div></div><div class="case-section smart-field"><label>المتهمين</label><input id="suspectSearch" placeholder="اكتب اسم المتهم أو هويته" oninput="smartPeopleInput(this,'suspects',false)"><div id="suspectsResults" class="suggest-box hidden"></div><div id="suspectsChips" class="chips"></div></div></div><div class="case-section"><label>المخالفات / القضايا المرتبطة</label><select id="lawsSelect" multiple></select></div><div class="case-section"><label>تفاصيل إضافية</label><textarea id="caseExtra" placeholder="اختياري"></textarea></div><div class="case-actions"><button class="primary" onclick="submitCase()">${t('save')}</button><button onclick="resetCaseBuilder()">تفريغ</button></div></section>`
}
function initCaseEditor(){
  if (!window.Quill || !document.getElementById('caseEditor')) return
  caseEditor = new Quill('#caseEditor', { theme:'snow', modules:{ toolbar:[[{'header':[1,2,3,false]}],[{'font':[]}],[{'size':['small',false,'large','huge']}],['bold','italic','underline','strike'],[{'color':[]},{'background':[]}],[{'align':[]}],[{'list':'ordered'},{'list':'bullet'}],['link','clean']] } })
}
function casesTable(list){ return table('casesTable',['#','العنوان','المتهم','العسكري','النوع','الحالة','الإجراء'], (list || []).map(c => `<tr><td>${c.id}</td><td>${esc(c.title)}</td><td>${esc(c.citizen_name || '-')}</td><td>${esc(c.officer_name || '-')}</td><td>${esc(c.case_type || '-')}</td><td>${esc(c.status)}</td><td class="table-actions">${can('edit_case') ? `<button class="btn-small" onclick="event.stopPropagation();openCaseEdit(${c.id})">تعديل</button>` : ''}${can('execute_case') && c.status !== 'منفذة' ? `<button class="btn-small" onclick="event.stopPropagation();executeCase(${c.id})">تنفيذ</button>` : ''}${can('delete_case') ? `<button class="btn-small danger-btn" onclick="event.stopPropagation();deleteCase(${c.id})">حذف</button>` : ''}</td></tr>`)) }
function wanted(){ return `<header><h1>${t('wanted')}</h1><p>يعتمد على القضايا غير المنفذة فقط</p></header><section class="panel"><h2>${t('wantedList')}</h2>${wantedRows(state.wanted)}</section>` }
function vehicles(){ return `<header><h1>${t('vehicles')}</h1>${can('flag_vehicle') ? `<button class="primary" onclick="openVehicleModal()">${t('addVehicle')}</button>` : ''}</header><section class="panel">${table('vehiclesTable',['اللوحة','المركبة','المالك','الكراج','المخالفة','الإجراء'], state.vehicles.map(v => `<tr><td>${esc(v.plate)}</td><td>${esc(v.vehicle)}</td><td>${esc(v.owner_name || v.owner || '-')}</td><td>${esc(v.garage || 'N/A')}</td><td>${esc(v.violation)}</td><td class="table-actions">${can('flag_vehicle') ? `<button class="btn-small" onclick="openVehicleModal('${esc(v.plate)}')">تعديل</button><button class="btn-small danger-btn" onclick="deleteVehicleFlag('${esc(v.plate)}')">حذف</button>` : ''}</td></tr>`))}</section>` }
function laws(){ return `<header><h1>${t('laws')}</h1></header><section class="panel">${table('lawsTable',['العنوان','English','النوع','الغرامة','السجن'], state.laws.map(l => `<tr><td>${esc(l.title_ar)}</td><td>${esc(l.title_en)}</td><td>${esc(l.type || '-')}</td><td>$${money(l.fine)}</td><td>${esc(l.jail)}m</td></tr>`))}</section>` }
function logs(){ if (!can('view_logs')) return `<section class="panel empty">غير مصرح</section>`; return `<header><h1>${t('logs')}</h1></header><section class="panel">${table('logsTable',['الإجراء','العسكري','الوصف','التاريخ'], (state.logs || []).map(l => `<tr><td>${esc(l.action)}</td><td>${esc(l.officer_name || '-')}</td><td>${esc(l.description || '-')}</td><td>${esc(l.created_at || '')}</td></tr>`))}</section>` }
function suspicious(){ return `<header><h1>${t('suspicious')}</h1></header><section class="panel empty">جاهزة للربط مع جدول البنك لاحقًا. أرسل اسم الجدول والأعمدة.</section>` }

function modalHost(){ return `<div id="vehicleModal" class="modal hidden"><div class="modal-box"><h2 id="vehicleModalTitle">${t('addVehicle')}</h2><input id="modalPlate" placeholder="اللوحة"><input id="modalOwner" placeholder="المالك"><input id="modalViolation" placeholder="المخالفة"><div class="case-actions"><button onclick="closeModal('vehicleModal')">${t('cancel')}</button><button class="primary" onclick="saveVehicleFlag()">${t('save')}</button></div></div></div><div id="caseEditModal" class="modal hidden"><div class="modal-box wide"><h2>تعديل القضية</h2><div id="caseEditBody"></div></div></div>` }
function openVehicleModal(plate){
  editingVehiclePlate = plate || null
  const v = plate ? state.vehicles.find(x => x.plate === plate) : null
  document.getElementById('vehicleModalTitle').innerText = v ? 'تعديل مركبة مخالفة' : t('addVehicle')
  document.getElementById('modalPlate').value = v?.plate || ''
  document.getElementById('modalPlate').disabled = !!v
  document.getElementById('modalOwner').value = v?.owner_name || ''
  document.getElementById('modalViolation').value = v?.violation === 'لا يوجد' ? '' : (v?.violation || '')
  document.getElementById('vehicleModal').classList.remove('hidden')
}
function closeModal(id){ document.getElementById(id)?.classList.add('hidden') }
async function saveVehicleFlag(){
  const payload = { plate: val('modalPlate'), owner: val('modalOwner'), violation: val('modalViolation') }
  if (!payload.plate || !payload.violation) return toast('اكتب اللوحة والمخالفة', 'warning')
  await nui(editingVehiclePlate ? 'updateVehicleFlag' : 'addVehicleFlag', payload)
  toast(editingVehiclePlate ? 'تم تعديل المخالفة' : 'تمت إضافة المخالفة')
  await fetchData(); show('vehicles')
}
async function deleteVehicleFlag(plate){ if (!confirm('حذف مخالفة المركبة؟')) return; await nui('deleteVehicleFlag', { plate }); toast('تم حذف مخالفة المركبة'); await fetchData(); show('vehicles') }

function openCaseEdit(id){
  const c = state.cases.find(x => Number(x.id) === Number(id)); if (!c) return
  editingCaseId = id
  tempCase = { officers: c.officers || [], suspects: c.suspects || [] }
  document.getElementById('caseEditBody').innerHTML = `<div class="case-builder"><div class="case-section"><label>عنوان القضية</label><input id="editCaseTitle" value="${esc(c.title)}"></div><div class="case-section"><label>وصف القضية</label><div id="editCaseEditor" class="rich-editor"></div></div><div class="case-grid"><div><label>نوع القضية</label><select id="editCaseType"><option value="قضية">قضية</option><option value="مخالفة">مخالفة</option></select></div><div><label>الحالة</label><select id="editCaseStatus"><option value="غير منفذة">غير منفذة</option><option value="منفذة">منفذة</option></select></div><div><label>الإجراء</label><select id="editCaseAction"><option value="سجن">سجن</option><option value="مخالفة مالية">مخالفة مالية</option><option value="إجراء خاص">إجراء خاص</option></select></div></div><div class="case-grid two"><div class="case-section smart-field"><label>العساكر</label><input placeholder="بحث" oninput="smartPeopleInput(this,'officers',true)"><div id="officersResults" class="suggest-box hidden"></div><div id="officersChips" class="chips"></div></div><div class="case-section smart-field"><label>المتهمين</label><input placeholder="بحث" oninput="smartPeopleInput(this,'suspects',false)"><div id="suspectsResults" class="suggest-box hidden"></div><div id="suspectsChips" class="chips"></div></div></div><div class="case-section"><label>المخالفات</label><select id="editLawsSelect" multiple>${state.laws.map(l => `<option value="${esc(l.title_ar)}">${esc(l.title_ar)} - $${money(l.fine)} - ${esc(l.jail)}m</option>`).join('')}</select></div><div class="case-section"><label>تفاصيل إضافية</label><textarea id="editCaseExtra">${esc(c.extra_details || c.description || '')}</textarea></div><div class="case-actions"><button onclick="closeModal('caseEditModal')">إلغاء</button><button class="primary" onclick="submitCaseEdit()">حفظ التعديل</button></div></div>`
  document.getElementById('editCaseType').value = c.case_type || 'قضية'
  document.getElementById('editCaseStatus').value = c.status || 'غير منفذة'
  document.getElementById('editCaseAction').value = c.action_taken || 'سجن'
  ;[...document.getElementById('editLawsSelect').options].forEach(o => o.selected = (c.violations || []).includes(o.value))
  renderCaseChips('officers'); renderCaseChips('suspects')
  document.getElementById('caseEditModal').classList.remove('hidden')
  setTimeout(() => { if (window.Quill) { editCaseEditor = new Quill('#editCaseEditor', { theme:'snow', modules:{ toolbar:[[{'header':[1,2,3,false]}],[{'font':[]}],[{'size':['small',false,'large','huge']}],['bold','italic','underline','strike'],[{'color':[]},{'background':[]}],[{'align':[]}],[{'list':'ordered'},{'list':'bullet'}],['link','clean']] } }); editCaseEditor.root.innerHTML = c.content || '' } }, 50)
}

function caseRows(list){ return (list || []).map(c => `<div class="row case-row"><span><b>#${c.id} ${esc(c.title)}</b><small>${esc(c.citizen_name || '-')} • ${esc(c.officer_name || '-')} • ${esc(c.case_type || '-')}</small></span><div style="display:flex;gap:6px;align-items:center;"><em>${esc(c.status)}</em>${can('edit_case') ? `<button onclick="openCaseEdit(${c.id})" class="btn-small">تعديل</button>` : ''}${can('execute_case') && c.status !== 'منفذة' ? `<button onclick="executeCase(${c.id})" class="btn-small">تنفيذ</button>` : ''}${can('delete_case') ? `<button onclick="deleteCase(${c.id})" class="btn-small danger-btn">حذف</button>` : ''}</div></div>`).join('') || '<div class="empty">No data</div>' }
function wantedRows(list){ return (list || []).map(w => `<div class="row"><span><b>${esc(w.name)}</b><small>${esc(w.reason || '-')} • قضية #${esc(w.case_id || '-')}</small></span><em>غير منفذة</em></div>`).join('') || '<div class="empty">لا يوجد مطلوبين</div>' }
function officerStats(){ const x = {}; state.cases.forEach(c => x[c.officer_name || 'Unknown'] = (x[c.officer_name || 'Unknown'] || 0) + 1); return Object.entries(x).map(([n,v]) => `<div class="row"><span>${esc(n)}</span><b>${v}</b></div>`).join('') || '<div class="empty">No data</div>' }
async function smartPeopleInput(input, type, onlyPolice){ clearTimeout(searchTimers[type]); searchTimers[type] = setTimeout(async () => { const q = input.value.trim(); const box = document.getElementById(type + 'Results'); if (!q) { box.classList.add('hidden'); box.innerHTML = ''; return } const res = await nui('smartSearchPeople', { query:q, onlyPolice }); window[type + 'ResultsData'] = res || []; box.innerHTML = window[type + 'ResultsData'].map((p, i) => `<div onclick="addCasePerson('${type}',${i})"><b>${esc(p.name)}</b><small>${esc(p.citizenid)} • ${esc(p.job || '')}</small></div>`).join('') || '<div class="empty">لا توجد نتائج</div>'; box.classList.remove('hidden') }, 180) }
function addCasePerson(type, i){ const p = window[type + 'ResultsData']?.[i]; if (p && !tempCase[type].some(x => x.citizenid === p.citizenid)) tempCase[type].push({ citizenid:p.citizenid, name:p.name }); renderCaseChips(type); document.getElementById(type + 'Results')?.classList.add('hidden') }
function removeCasePerson(type, cid){ tempCase[type] = tempCase[type].filter(p => p.citizenid !== cid); renderCaseChips(type) }
function renderCaseChips(type){ const el = document.getElementById(type + 'Chips'); if (el) el.innerHTML = tempCase[type].map(p => `<span class="chip">${esc(p.name)}<button onclick="removeCasePerson('${type}','${esc(p.citizenid)}')">×</button></span>`).join('') }
async function loadLaws(){ const select = document.getElementById('lawsSelect'); if (!select) return; const laws = await nui('getLawsByType', { caseType: val('caseType') || 'قضية' }); select.innerHTML = (laws || []).map(l => `<option value="${esc(l.title_ar)}">${esc(l.title_ar)} - $${money(l.fine)} - ${esc(l.jail)}m</option>`).join('') }
function resetCaseBuilder(){ show('cases') }
async function submitCase(){ const title = val('caseTitle'); if (!title) return toast('اكتب عنوان القضية', 'warning'); await nui('addCase', { title, content: caseEditor ? caseEditor.root.innerHTML : '', caseType: val('caseType'), status: val('caseStatus'), action: val('caseAction'), officers: tempCase.officers, suspects: tempCase.suspects, violations: [...document.getElementById('lawsSelect').selectedOptions].map(o => o.value), extra: val('caseExtra') }); toast('تم حفظ القضية'); await fetchData(); show('cases') }
async function submitCaseEdit(){ if (!editingCaseId) return; await nui('updateCase', { id: editingCaseId, title: val('editCaseTitle'), content: editCaseEditor ? editCaseEditor.root.innerHTML : '', caseType: val('editCaseType'), status: val('editCaseStatus'), action: val('editCaseAction'), officers: tempCase.officers, suspects: tempCase.suspects, violations: [...document.getElementById('editLawsSelect').selectedOptions].map(o => o.value), extra: val('editCaseExtra') }); toast('تم تعديل القضية'); await fetchData(); closeModal('caseEditModal'); show('cases') }
async function executeCase(id){ await nui('executeCase', { id }); toast('تم تنفيذ القضية'); await fetchData(); show('cases') }
async function deleteCase(id){ if (!confirm('حذف القضية؟')) return; await nui('deleteCase', { id }); toast('تم حذف القضية'); await fetchData(); show('cases') }
async function citizenDetails(id){ const data = await nui('getCitizenProfile', { citizenid:id }); if (data.error) return toast('لم يتم العثور على المواطن', 'error'); currentProfile = data; currentPage = 'profile'; renderMenu(); document.getElementById('content').innerHTML = globalSearch() + renderProfile(data) + modalHost(); initDataTables() }
function renderProfile(data){ const c = data.citizen; return `<div class="profile"><div class="profile-header"><div class="profile-person"><img class="citizen-avatar" src="${esc(c.image_url || 'https://via.placeholder.com/96x96?text=AJ')}" onerror="this.src='https://via.placeholder.com/96x96?text=AJ'"><div><h1>👤 ${esc(c.name)}</h1><p>${esc(c.citizenid)} • ${esc(c.phone)} • ${esc(c.job)}</p>${can('edit_profile') ? `<div class="profile-image-edit"><input id="profileImageUrl" placeholder="رابط صورة المواطن"><button onclick="saveCitizenImage('${esc(c.citizenid)}')">حفظ الصورة</button></div>` : ''}</div></div><button onclick="show('citizens')">${t('back')}</button></div><div class="stats"><div class="card"><small>Bank</small><b>$${money(c.bank)}</b></div><div class="card"><small>Cash</small><b>$${money(c.cash)}</b></div><div class="card"><small>${t('wanted')}</small><b>${data.wanted.length}</b></div></div><div class="tabs"><button onclick="profileTab('info')">📄 ${t('info')}</button><button onclick="profileTab('vehicles')">🚗 ${t('vehicles')}</button><button onclick="profileTab('properties')">🏠 ${t('properties')}</button><button onclick="profileTab('cases')">📁 ${t('cases')}</button><button onclick="profileTab('wanted')">🚨 ${t('wanted')}</button></div><section id="profileContent" class="panel">${profileInfo(c)}</section></div>` }
async function saveCitizenImage(citizenid){ const imageUrl = val('profileImageUrl'); if (!imageUrl) return toast('ضع رابط الصورة', 'warning'); await nui('saveCitizenImage', { citizenid, imageUrl }); toast('تم حفظ صورة المواطن'); await fetchData(); citizenDetails(citizenid) }
function profileTab(tab){ const d = currentProfile, el = document.getElementById('profileContent'); if (!d || !el) return; if (tab === 'info') el.innerHTML = profileInfo(d.citizen); if (tab === 'vehicles') el.innerHTML = profileVehicles(d.vehicles); if (tab === 'properties') el.innerHTML = profileProperties(d.properties); if (tab === 'cases') el.innerHTML = caseRows(d.cases); if (tab === 'wanted') el.innerHTML = wantedRows(d.wanted) }
function profileInfo(c){ return `<div class="profile-grid"><div class="card"><small>CID</small><b>${esc(c.citizenid)}</b></div><div class="card"><small>Phone</small><b>${esc(c.phone)}</b></div><div class="card"><small>Birthdate</small><b>${esc(c.birthdate)}</b></div><div class="card"><small>Nationality</small><b>${esc(c.nationality)}</b></div><div class="card"><small>Job</small><b>${esc(c.job)}</b></div><div class="card"><small>Grade</small><b>${esc(c.grade)}</b></div></div>` }
function profileVehicles(list){ return (list || []).map(v => `<div class="row"><span><b>${esc(v.plate)}</b><small>${esc(v.vehicle)} • ${esc(v.garage || 'N/A')}</small></span><em>${esc(v.state)}</em></div>`).join('') || '<div class="empty">لا يوجد مركبات</div>' }
function profileProperties(list){ return (list || []).map(p => `<div class="row"><span><b>🏠 ${esc(p.house || p.name || p.apartment_type || p.apartment || 'Property')}</b><small>${esc(p.identifier || p.citizenid || '')}</small></span></div>`).join('') || '<div class="empty">لا يوجد أملاك</div>' }
function vehicleDetails(plate){ const v = state.vehicles.find(x => x.plate === plate); if(v) toast(`${v.plate} - ${v.violation}`) }
function forceCloseMdt(){ document.getElementById('app').classList.add('hidden') }
function closeMdt(){ forceCloseMdt(); nui('close') }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMdt() })
renderMenu()
