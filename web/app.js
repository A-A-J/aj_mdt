// UPDATED WANTED UI (case-based only)
function wanted(){
  return `<header><h1>${t('wanted')}</h1></header>
  <section class="panel">
    <h2>${t('wantedList')}</h2>
    ${wantedRows(state.wanted)}
  </section>`
}

// disable manual add
async function addWanted(){
  alert('النظام يعتمد على القضايا فقط')
}
