self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'HostelLife', {
      body: data.body || 'You have a reminder',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/calendar' },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'snooze', title: 'Snooze 30min' }
      ]
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
