const state = {
  lang: 'ar',
  cases: [
    { id: 101, title: 'سرقة مركبة', citizen: 'سالم الحربي', officer: 'Lt. Fahad', status: 'مفتوحة' },
    { id: 102, title: 'اعتداء', citizen: 'ناصر القحطاني', officer: 'Officer Rayan', status: 'قيد التحقيق' }
  ],
  wanted: [
    { name: 'ماجد العتيبي', reason: 'هروب من دورية', danger: 'متوسط' },
    { name: 'عبدالله المطيري', reason: 'قضية سلاح', danger: 'عالي' }
  ],
  vehicles: [
    { plate: 'AJ-4821', owner: 'تركي الشمري', violation: 'قيادة متهورة' },
    { plate: 'SS-9310', owner: 'فهد الدوسري', violation: 'مركبة مطلوبة' }
  ],
  citizens: [
    { name: 'سالم الحربي', cid: 'CID-1001', phone: '555-0132', record: 'مخالفة مرورية' },
    { name: 'ناصر القحطاني', cid: 'CID-1002', phone: '555-0199', record: 'لا يوجد' }
  ]
}

const labels = {
  ar: {
    dashboard: 'الرئيسية', citizens: 'المواطنين', cases: 'القضايا', wanted: 'المطلوبين', vehicles: 'المركبات المخالفة', laws: 'دليل المخالفات والقضايا', suspicious: 'المعاملات البنكية المشبوهة',
    latestCases: 'آخر القضايا المضافة', wantedList: 'قائمة المطلوبين', activeOfficers: 'الأكثر تفاعلًا', addCase: 'إضافة قضية', addWanted: 'إضافة مطلوب', addVehicle: 'إضافة مركبة مخالفة', search: 'بحث...', save: 'حفظ', close: 'إغلاق'
  },
  en: {
    dashboard: 'Dashboard', citizens: 'Citizens', cases: 'Cases', wanted: 'Wanted', vehicles: 'Flagged Vehicles', laws: 'Violations & Cases Guide', suspicious: 'Suspicious Bank Transactions',
    latestCases: 'Latest Cases', wantedList: 'Wanted List', activeOfficers: 'Most Active Officers', addCase: 'Add Case', addWanted: 'Add Wanted', addVehicle: 'Add Flagged Vehicle', search: 'Search...', save: 'Save', close: 'Close'
  }
}

function t(key) { return labels[state.lang][key] || key }

window.addEventListener('message', function(event) {
  if (event.data.action === 'open') {
    document.getElementById('app').classList.remove('hidden')
    show('dashboard')
  }
})

function setLang(lang) {
  state.lang = lang
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  renderMenu()
  show(currentPage || 'dashboard')
}

let currentPage = 'dashboard'

function renderMenu() {
  const menu = document.getElementById('menu')
  menu.innerHTML = `
    <div class="brand"><span>AJ</span><b>MDT</b></div>
    ${menuButton('dashboard')}
    ${menuButton('citizens')}
    ${menuButton('cases')}
    ${menuButton('wanted')}
    ${menuButton('vehicles')}
    ${menuButton('suspicious')}
    ${menuButton('laws')}
    <div class="lang"><button onclick="setLang('ar')">عربي</button><button onclick="setLang('en')">EN</button></div>
    <button class="danger" onclick="closeMdt()">${t('close')}</button>
  `
}

function menuButton(page) {
  return `<button class="nav ${currentPage === page ? 'active' : ''}" onclick="show('${page}')">${t(page)}</button>`
}

function show(page) {
  currentPage = page
  renderMenu()
  const content = document.getElementById('content')
  const pages = { dashboard, citizens, cases, wanted, vehicles, suspicious, laws }
  content.innerHTML = pages[page] ? pages[page]() : dashboard()
}

function dashboard() {
  return `
    <header><h1>${t('dashboard')}</h1><p>QBCore Police Mobile Data Terminal</p></header>
    <div class="stats">
      <div class="card"><small>${t('cases')}</small><b>${state.cases.length}</b></div>
      <div class="card"><small>${t('wanted')}</small><b>${state.wanted.length}</b></div>
      <div class="card"><small>${t('vehicles')}</small><b>${state.vehicles.length}</b></div>
    </div>
    <div class="grid">
      <section class="panel"><h2>${t('latestCases')}</h2>${caseRows(state.cases.slice(-5))}</section>
      <section class="panel"><h2>${t('wantedList')}</h2>${wantedRows(state.wanted)}</section>
      <section class="panel"><h2>${t('activeOfficers')}</h2><div class="row"><span>Lt. Fahad</span><b>12</b></div><div class="row"><span>Officer Rayan</span><b>8</b></div></section>
    </div>`
}

function citizens() {
  return `<header><h1>${t('citizens')}</h1><input oninput="filterTable(this.value, 'citizen-row')" placeholder="${t('search')}"></header><section class="panel">${state.citizens.map(c => `<div class="row citizen-row"><span><b>${c.name}</b><small>${c.cid} • ${c.phone}</small></span><em>${c.record}</em></div>`).join('')}</section>`
}

function cases() {
  return `<header><h1>${t('cases')}</h1></header><section class="panel form"><h2>${t('addCase')}</h2><input id="caseTitle" placeholder="عنوان القضية / Case title"><input id="caseCitizen" placeholder="المواطن / Citizen"><button onclick="addCase()">${t('save')}</button></section><section class="panel">${caseRows(state.cases)}</section>`
}

function wanted() {
  return `<header><h1>${t('wanted')}</h1></header><section class="panel form"><h2>${t('addWanted')}</h2><input id="wantedName" placeholder="الاسم / Name"><input id="wantedReason" placeholder="السبب / Reason"><button onclick="addWanted()">${t('save')}</button></section><section class="panel">${wantedRows(state.wanted)}</section>`
}

function vehicles() {
  return `<header><h1>${t('vehicles')}</h1></header><section class="panel form"><h2>${t('addVehicle')}</h2><input id="plate" placeholder="اللوحة / Plate"><input id="owner" placeholder="المالك / Owner"><input id="violation" placeholder="المخالفة / Violation"><button onclick="addVehicle()">${t('save')}</button></section><section class="panel">${state.vehicles.map(v => `<div class="row"><span><b>${v.plate}</b><small>${v.owner}</small></span><em>${v.violation}</em></div>`).join('')}</section>`
}

function suspicious() {
  return `<header><h1>${t('suspicious')}</h1></header><section class="panel empty">هذه الصفحة جاهزة للربط لاحقًا مع داتا البنك التي سترسلها.</section>`
}

function laws() {
  const items = ['السرقة - Theft', 'الاعتداء - Assault', 'الهروب من الشرطة - Evading Police', 'حيازة سلاح غير مرخص - Illegal Weapon', 'غسيل أموال - Money Laundering']
  return `<header><h1>${t('laws')}</h1></header><section class="panel">${items.map((x, i) => `<div class="row"><span>${i + 1}. ${x}</span><b>${(i + 1) * 1500}$</b></div>`).join('')}</section>`
}

function caseRows(list) {
  return list.map(c => `<div class="row"><span><b>#${c.id} ${c.title}</b><small>${c.citizen} • ${c.officer}</small></span><em>${c.status}</em></div>`).join('')
}

function wantedRows(list) {
  return list.map(w => `<div class="row"><span><b>${w.name}</b><small>${w.reason}</small></span><em>${w.danger}</em></div>`).join('')
}

function addCase() {
  state.cases.push({ id: Date.now().toString().slice(-5), title: val('caseTitle'), citizen: val('caseCitizen'), officer: 'Current Officer', status: 'مفتوحة' })
  show('cases')
}

function addWanted() {
  state.wanted.push({ name: val('wantedName'), reason: val('wantedReason'), danger: 'متوسط' })
  show('wanted')
}

function addVehicle() {
  state.vehicles.push({ plate: val('plate'), owner: val('owner'), violation: val('violation') })
  show('vehicles')
}

function val(id) { return document.getElementById(id)?.value || '-' }

function filterTable(value, cls) {
  document.querySelectorAll('.' + cls).forEach(el => el.style.display = el.innerText.includes(value) ? 'flex' : 'none')
}

function closeMdt() {
  fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' })
  document.getElementById('app').classList.add('hidden')
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMdt() })

renderMenu()
