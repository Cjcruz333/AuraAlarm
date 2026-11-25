// Service Worker for AuraAlarm Progressive Web App

const CACHE_NAME = 'aura-alarm-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

let scheduledAlarmTimers = [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API requests pass directly to the network
  if (event.request.url.includes('/api/')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', response.clone());
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        return undefined;
      });
    })
  );
});

// Native push notification listener
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'AuraAlarm Wake-Up Call';
  const options = {
    body: data.body || 'Good morning! It is time to rise and shine.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [500, 200, 500, 200, 800],
    data: {
      url: '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || (notifData.alarmId ? `/?ringingAlarmId=${notifData.alarmId}` : '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (action === 'snooze' || action === 'dismiss') {
            client.postMessage({ type: 'ALARM_ACTION', action, alarmId: notifData.alarmId });
          } else if (notifData.alarmId) {
            client.postMessage({ type: 'TRIGGER_ALARM', alarmId: notifData.alarmId });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle alarm synchronization and schedule background timers on phone
  if (event.data?.type === 'SYNC_ALARMS') {
    for (const timerId of scheduledAlarmTimers) {
      clearTimeout(timerId);
    }
    scheduledAlarmTimers = [];

    const alarms = event.data.alarms || [];
    const now = Date.now();

    for (const alarm of alarms) {
      if (!alarm || !alarm.triggerTimestamp) continue;
      const delay = alarm.triggerTimestamp - now;

      // Schedule if within 24 hours
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const tId = setTimeout(async () => {
          const currentHour = new Date().getHours();
          const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
          let body = alarm.customMessage || `${greeting}! Time to rise and shine.`;
          if (/good morning/i.test(body) && currentHour >= 12) {
            body = body.replace(/good morning/i, greeting);
          }

          const title = `⏰ ${alarm.label || 'AuraAlarm Wake-Up Call'} (${alarm.time || 'Now'})`;

          try {
            await self.registration.showNotification(title, {
              body: body,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: `aura-alarm-${alarm.id}`,
              renotify: true,
              vibrate: [500, 200, 500, 200, 800],
              data: {
                url: `/?ringingAlarmId=${alarm.id}`,
                alarmId: alarm.id
              }
            });
          } catch (e) {
            console.error('Service Worker showNotification error:', e);
          }

          // Wake up any open tabs or PWA window
          try {
            const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clientList) {
              client.postMessage({ type: 'TRIGGER_ALARM', alarmId: alarm.id });
            }
          } catch (e) {}
        }, delay);

        scheduledAlarmTimers.push(tId);
      }
    }
  }
});
