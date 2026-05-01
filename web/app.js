window.addEventListener('message', function(event) {
  if (event.data.action === 'open') {
    document.getElementById('app').classList.remove('hidden')
    show('dashboard')
  }
})

function show(page) {
  const content = document.getElementById('content')
  content.innerHTML = '<h2>' + page + '</h2>'
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' })
    document.getElementById('app').classList.add('hidden')
  }
})
