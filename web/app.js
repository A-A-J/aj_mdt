// FULL CASE UI WITH EXECUTE BUTTON

async function executeCase(id){
  await nui('executeCase', { id })
  await fetchData()
  show('cases')
}

function caseRows(list){
  return (list || []).map(c=>`
    <div class="row case-row">
      <span>
        <b>#${c.id} ${c.title}</b>
        <small>${c.officer_name||'-'} • ${c.case_type || '-'}</small>
      </span>

      <div style="display:flex;gap:5px;align-items:center;">
        <em>${c.status}</em>

        ${state.permissions?.execute_case && c.status !== 'منفذة' ? `
          <button onclick="executeCase(${c.id})" class="btn-small">
            تنفيذ
          </button>
        ` : ``}
      </div>
    </div>
  `).join('') || '<div class="empty">No data</div>'
}
