let editingLawId = null
let editingLawType = null

function lawActionLabel(type){ return type === 'قضية' ? 'سجن' : 'مخالفة' }
function lawDurationLabel(law){ return law.type === 'قضية' ? `${law.jail || 0} شهر` : `${money(law.fine || 0)} ريال` }
function lawNumber(index){ return `#${index + 1}` }

function laws(){
  const caseLaws = (state.laws || []).filter(l => l.type === 'قضية')
  const trafficLaws = (state.laws || []).filter(l => l.type !== 'قضية')

  return `
    <header>
      <div>
        <h1>${t('laws')}</h1>
        <p>تعريفات القضايا والمخالفات المرورية</p>
      </div>
    </header>

    <div class="laws-page">
      <section class="panel law-panel">
        <div class="law-panel-header">
          <h2>القضايا</h2>
          ${can('manage_laws') ? `<button class="primary" onclick="openLawModal('قضية')"><i class="fa fa-plus"></i> إضافة قضية</button>` : ''}
        </div>
        ${lawTable('caseDefinitionsTable', caseLaws, 'قضية')}
      </section>

      <section class="panel law-panel">
        <div class="law-panel-header">
          <h2>المخالفات المرورية</h2>
          ${can('manage_laws') ? `<button class="primary" onclick="openLawModal('مخالفة')"><i class="fa fa-plus"></i> إضافة مخالفة</button>` : ''}
        </div>
        ${lawTable('trafficDefinitionsTable', trafficLaws, 'مخالفة')}
      </section>
    </div>

    ${lawModals()}
  `
}

function lawTable(id, list, type){
  const rows = (list || []).map((l, i) => `
    <tr>
      <td>${lawNumber(i)}</td>
      <td>${esc(l.title_ar || '-')}</td>
      <td>${lawActionLabel(type)}</td>
      <td>${lawDurationLabel(l)}</td>
      <td class="law-actions">
        ${can('manage_laws') ? `<button class="icon-btn" title="تحرير" onclick="openLawModal('${type}', ${Number(l.id)})"><i class="fa fa-edit"></i></button>` : ''}
        ${can('manage_laws') ? `<button class="icon-btn danger-btn" title="حذف" onclick="deleteLawDefinition(${Number(l.id)})"><i class="fa fa-trash"></i></button>` : ''}
        <button class="icon-btn" title="معلومات" onclick="showLawDefinitionInfo(${Number(l.id)})"><i class="fa fa-info-circle"></i></button>
      </td>
    </tr>
  `)

  return table(id, ['#', type === 'قضية' ? 'نوع القضية' : 'نوع المخالفة', 'الإجراء', 'المدة', 'الإجراءات'], rows)
}

function lawModals(){
  return `
    <div id="lawModal" class="modal hidden">
      <div class="modal-box law-modal-box">
        <h2 id="lawModalTitle">إضافة تعريف</h2>
        <input id="lawName" placeholder="اسم التعريف">
        <input id="lawEnglish" placeholder="English name / اختياري">
        <div id="lawCaseFields" class="law-field-block hidden">
          <label>مدة السجن بالشهور</label>
          <input id="lawJail" type="number" min="0" placeholder="مثال: 500">
        </div>
        <div id="lawTrafficFields" class="law-field-block hidden">
          <label>قيمة المخالفة بالريال</label>
          <input id="lawFine" type="number" min="0" placeholder="مثال: 3000">
        </div>
        <div class="case-actions">
          <button onclick="closeLawModal()"><i class="fa fa-times"></i> إلغاء</button>
          <button class="primary" onclick="saveLawDefinition()"><i class="fa fa-save"></i> حفظ</button>
        </div>
      </div>
    </div>

    <div id="lawInfoModal" class="modal hidden">
      <div class="modal-box law-modal-box">
        <h2>معلومات التعريف</h2>
        <div id="lawInfoBody" class="law-info-body"></div>
        <div class="case-actions">
          <button class="primary" onclick="closeLawInfoModal()"><i class="fa fa-check"></i> تم</button>
        </div>
      </div>
    </div>
  `
}

function openLawModal(type, id){
  editingLawId = id || null
  editingLawType = type
  const law = id ? (state.laws || []).find(l => Number(l.id) === Number(id)) : null

  document.getElementById('lawModalTitle').innerText = law ? 'تحرير تعريف' : (type === 'قضية' ? 'إضافة قضية' : 'إضافة مخالفة')
  document.getElementById('lawName').value = law?.title_ar || ''
  document.getElementById('lawEnglish').value = law?.title_en || ''
  document.getElementById('lawJail').value = law?.jail || 0
  document.getElementById('lawFine').value = law?.fine || 0

  document.getElementById('lawCaseFields').classList.toggle('hidden', type !== 'قضية')
  document.getElementById('lawTrafficFields').classList.toggle('hidden', type === 'قضية')
  document.getElementById('lawModal').classList.remove('hidden')
}

function closeLawModal(){
  document.getElementById('lawModal')?.classList.add('hidden')
  editingLawId = null
  editingLawType = null
}

async function saveLawDefinition(){
  if(!can('manage_laws')) return toast('غير مصرح', 'error')

  const name = val('lawName').trim()
  if(!name) return toast('اكتب اسم التعريف', 'warning')

  const payload = {
    id: editingLawId,
    title_ar: name,
    title_en: val('lawEnglish').trim(),
    type: editingLawType,
    fine: editingLawType === 'قضية' ? 0 : Number(val('lawFine') || 0),
    jail: editingLawType === 'قضية' ? Number(val('lawJail') || 0) : 0
  }

  await nui(editingLawId ? 'updateLaw' : 'addLaw', payload)
  toast(editingLawId ? 'تم تعديل التعريف' : 'تمت إضافة التعريف')
  closeLawModal()
  await fetchData()
  show('laws')
}

async function deleteLawDefinition(id){
  if(!can('manage_laws')) return toast('غير مصرح', 'error')
  if(!confirm('حذف هذا التعريف؟')) return
  await nui('deleteLaw', { id })
  toast('تم حذف التعريف')
  await fetchData()
  show('laws')
}

function showLawDefinitionInfo(id){
  const law = (state.laws || []).find(l => Number(l.id) === Number(id))
  if(!law) return toast('لم يتم العثور على التعريف', 'error')

  document.getElementById('lawInfoBody').innerHTML = `
    <div class="law-info-row"><span>الاسم</span><b>${esc(law.title_ar || '-')}</b></div>
    <div class="law-info-row"><span>النوع</span><b>${esc(law.type || '-')}</b></div>
    <div class="law-info-row"><span>الإجراء</span><b>${lawActionLabel(law.type)}</b></div>
    <div class="law-info-row"><span>المدة / القيمة</span><b>${lawDurationLabel(law)}</b></div>
    <div class="law-info-row"><span>تمت الإضافة بواسطة</span><b>${esc(law.created_by || '-')}</b></div>
    <div class="law-info-row"><span>تاريخ الإضافة</span><b>${esc(law.created_at || '-')}</b></div>
    <div class="law-info-row"><span>آخر تحرير بواسطة</span><b>${esc(law.updated_by || '-')}</b></div>
    <div class="law-info-row"><span>تاريخ آخر تحديث</span><b>${esc(law.updated_at || '-')}</b></div>
  `
  document.getElementById('lawInfoModal').classList.remove('hidden')
}

function closeLawInfoModal(){
  document.getElementById('lawInfoModal')?.classList.add('hidden')
}
