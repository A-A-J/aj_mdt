// UPDATED dashboard
function dashboard(){

  const casesCount = state.cases.length
  const wantedCount = state.wanted.length
  const vehicleViolations = state.vehicles.filter(v=>v.violation && v.violation !== 'لا يوجد').length

  const stats = {}
  state.cases.forEach(c=>{
    const name = c.officer_name || 'Unknown'
    stats[name] = (stats[name]||0)+1
  })

  const top = Object.entries(stats)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)

  const icons = ['fa-crown','fa-star','fa-medal']

  return `

  <div class="dashboard-top">

    <div class="dashboard-left">
      ${top.map((o,i)=>`
        <div class="rank-card">
          <i class="fa ${icons[i]}"></i>
          <div class="rank-name">${o[0]}</div>
          <div class="rank-value">${o[1]}</div>
        </div>
      `).join('')}
    </div>

    <div class="dashboard-right">
      <div class="stat-card"><span>القضايا</span><b>${casesCount}</b></div>
      <div class="stat-card"><span>المطلوبين</span><b>${wantedCount}</b></div>
      <div class="stat-card"><span>مخالفات المركبات</span><b>${vehicleViolations}</b></div>
    </div>

  </div>

  <div class="dashboard-bottom">

    <div class="panel">
      <h2>آخر القضايا</h2>
      ${caseRows(state.cases.slice(0,5))}
    </div>

    <div class="panel">
      <h2>المطلوبين</h2>
      ${wantedRows(state.wanted)}
    </div>

  </div>

  `
}
