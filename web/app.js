// 🔥 FULL CASE BUILDER UI

function cases(){
  return `
  <header><h1>${t('cases')}</h1></header>

  <section class="panel case-builder">

    <input id="caseTitle" placeholder="عنوان القضية">

    <div class="editor" contenteditable="true" id="caseContent"></div>

    <div class="row-flex">
      <select id="caseType" onchange="loadLaws()">
        <option value="قضية">قضية</option>
        <option value="مخالفة">مخالفة</option>
      </select>

      <select id="caseStatus">
        <option value="غير منفذة">غير منفذة</option>
        <option value="منفذة">منفذة</option>
      </select>

      <select id="caseAction">
        <option value="سجن">سجن</option>
        <option value="مخالفة">مخالفة</option>
        <option value="إعدام">إعدام</option>
      </select>
    </div>

    <div>
      <input placeholder="إضافة عسكري..." oninput="searchPeople(this,'officers',true)">
      <div id="officers" class="chips"></div>
    </div>

    <div>
      <input placeholder="إضافة متهم..." oninput="searchPeople(this,'suspects',false)">
      <div id="suspects" class="chips"></div>
    </div>

    <div>
      <select id="lawsSelect" multiple></select>
    </div>

    <textarea id="caseExtra" placeholder="تفاصيل إضافية"></textarea>

    <button onclick="submitCase()">${t('save')}</button>

  </section>

  ${caseRows(state.cases)}
  `
}

let tempPeople = { officers:[], suspects:[] }

async function searchPeople(input, type, onlyPolice){
  const res = await nui('smartSearchPeople',{query:input.value, onlyPolice})
  const list = res.map(p=>`<div onclick="addPerson('${type}','${p.citizenid}','${p.name}')">${p.name}</div>`).join('')
  input.nextElementSibling?.remove()
  input.insertAdjacentHTML('afterend',`<div class="suggest-box">${list}</div>`)
}

function addPerson(type,id,name){
  tempPeople[type].push({citizenid:id,name})
  renderChips(type)
}

function renderChips(type){
  const el=document.getElementById(type)
  el.innerHTML=tempPeople[type].map(p=>`<span class="chip">${p.name}</span>`).join('')
}

async function loadLaws(){
  const type=document.getElementById('caseType').value
  const laws=await nui('getLawsByType',{caseType:type})
  const select=document.getElementById('lawsSelect')
  select.innerHTML=laws.map(l=>`<option value="${l.title_ar}">${l.title_ar}</option>`).join('')
}

async function submitCase(){
  const data={
    title:val('caseTitle'),
    content:document.getElementById('caseContent').innerHTML,
    caseType:val('caseType'),
    status:val('caseStatus'),
    action:val('caseAction'),
    officers:tempPeople.officers,
    suspects:tempPeople.suspects,
    violations:[...document.getElementById('lawsSelect').selectedOptions].map(o=>o.value),
    extra:val('caseExtra')
  }

  await nui('addCase',data)
  await fetchData()
  show('cases')
}

