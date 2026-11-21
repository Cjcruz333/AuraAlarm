import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Seed initial calendar events for demo
const seedDefaultCalendarEvents = (userId) => {
  const existing = db.find('calendarEvents', e => e.userId === userId);
  if (existing.length === 0) {
    db.insert('calendarEvents', {
      id: 'cal-1',
      userId,
      title: 'Morning Mindfulness & HIIT Routine',
      startDate: new Date().toISOString().split('T')[0] + 'T07:00:00',
      endDate: new Date().toISOString().split('T')[0] + 'T07:45:00',
      recurrence: 'WEEKLY',
      soundNotification: 'zen_bell',
      category: 'Fitness',
      notes: 'Fuel your morning with high endorphins and hydration.',
      createdAt: new Date().toISOString()
    });

    db.insert('calendarEvents', {
      id: 'cal-2',
      userId,
      title: 'Evening Wind-Down & Sleep Sound Aid',
      startDate: new Date().toISOString().split('T')[0] + 'T22:00:00',
      endDate: new Date().toISOString().split('T')[0] + 'T22:30:00',
      recurrence: 'DAILY',
      soundNotification: 'soft_ambient',
      category: 'Sleep',
      notes: 'Dim lights, disconnect blue light screens, listen to Theta sleep sound.',
      createdAt: new Date().toISOString()
    });
  }
};
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  seedDefaultCalendarEvents('demo-user-id');
}

// Helper to format ISO date to iCal string (e.g., 20261029T220000Z)
function formatICalDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// GET /calendar/events
router.get('/events', authMiddleware, (req, res) => {
  try {
    const events = db.find('calendarEvents', e => e.userId === req.user.id);
    res.json({ events });
  } catch (err) {
    console.error('Fetch calendar events error:', err);
    res.status(500).json({ error: 'Failed to retrieve calendar events' });
  }
});

// POST /calendar/events
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { title, startDate, endDate, recurrence, soundNotification, category, notes } = req.body;
    if (!title || !startDate) {
      return res.status(400).json({ error: 'Event title and start date are required' });
    }

    const newEvent = {
      id: uuidv4(),
      userId: req.user.id,
      title,
      startDate,
      endDate: endDate || startDate,
      recurrence: recurrence || 'NONE', // 'DAILY', 'WEEKLY', 'MONTHLY', 'NONE'
      soundNotification: soundNotification || 'chime',
      category: category || 'General',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await db.insert('calendarEvents', newEvent);
    res.status(201).json({ event: newEvent });
  } catch (err) {
    console.error('Create calendar event error:', err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// DELETE /calendar/events/:id
router.delete('/events/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('calendarEvents', e => e.id === id && e.userId === req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    res.json({ message: 'Calendar event deleted' });
  } catch (err) {
    console.error('Delete calendar event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// GET /calendar/export.ics - Export alarms & reminders to standard .ics file
router.get('/export.ics', optionalAuthMiddleware, (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user-id';
    const events = db.find('calendarEvents', e => e.userId === userId);
    const alarms = db.find('alarms', a => a.userId === userId);
    const locationReminders = db.find('locationReminders', r => r.userId === userId);

    const now = formatICalDate(new Date());

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AuraAlarm//Smart Alarm & Wellness Suite//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AuraAlarm Schedule & Reminders',
      'X-WR-TIMEZONE:UTC'
    ];

    // Add Alarms as recurring events
    alarms.forEach(a => {
      const today = new Date().toISOString().split('T')[0];
      const startIso = `${today}T${a.time}:00`;
      const dtStart = formatICalDate(startIso);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:alarm-${a.id}@auraalarm.app`);
      icsContent.push(`DTSTAMP:${now}`);
      icsContent.push(`DTSTART:${dtStart}`);
      icsContent.push(`SUMMARY:⏰ AuraAlarm: ${a.label} (${a.time})`);
      icsContent.push(`DESCRIPTION:Scheduled wake-up alarm with ${a.soundName}. Loved one: ${a.lovedOneName || 'Self'}.`);
      if (a.days && a.days.length > 0) {
        // e.g. RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
        const dayMap = { Mon: 'MO', Tue: 'TU', Wed: 'WE', Thu: 'TH', Fri: 'FR', Sat: 'SA', Sun: 'SU' };
        const icalDays = a.days.map(d => dayMap[d] || d).join(',');
        icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${icalDays}`);
      }
      // Add VALARM sound notification
      icsContent.push('BEGIN:VALARM');
      icsContent.push('ACTION:AUDIO');
      icsContent.push('TRIGGER:-PT0M');
      icsContent.push('DESCRIPTION:Wake Up Call');
      icsContent.push('END:VALARM');
      icsContent.push('END:VEVENT');
    });

    // Add Location Reminders
    locationReminders.forEach(r => {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:loc-${r.id}@auraalarm.app`);
      icsContent.push(`DTSTAMP:${now}`);
      icsContent.push(`DTSTART:${now}`);
      icsContent.push(`SUMMARY:📍 Location Reminder: ${r.title}`);
      icsContent.push(`LOCATION:${r.destinationName} (${r.latitude}, ${r.longitude})`);
      icsContent.push(`DESCRIPTION:Trigger alert on ${r.triggerOn} within ${r.radiusMeters}m of ${r.destinationName}.`);
      icsContent.push(`GEO:${r.latitude};${r.longitude}`);
      icsContent.push('END:VEVENT');
    });

    // Add Custom Calendar Events
    events.forEach(e => {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:cal-${e.id}@auraalarm.app`);
      icsContent.push(`DTSTAMP:${now}`);
      icsContent.push(`DTSTART:${formatICalDate(e.startDate)}`);
      icsContent.push(`DTEND:${formatICalDate(e.endDate)}`);
      icsContent.push(`SUMMARY:📅 ${e.title}`);
      icsContent.push(`DESCRIPTION:${e.notes} [Category: ${e.category}]`);
      if (e.recurrence && e.recurrence !== 'NONE') {
        icsContent.push(`RRULE:FREQ=${e.recurrence}`);
      }
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const fileData = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_alarm_schedule.ics"');
    res.send(fileData);
  } catch (err) {
    console.error('ICS export error:', err);
    res.status(500).json({ error: 'Failed to generate .ics calendar export' });
  }
});

export default router;
