import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();
const OWNER_EMAIL = 'okeke12347@gmail.com';

// POST /feedback - Submit user feedback / support inquiry
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { name, email, subject, category, message, rating } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Feedback message cannot be empty' });
    }

    const ticketId = `TICKET-${Math.floor(100000 + Math.random() * 900000)}`;
    const newFeedback = {
      id: uuidv4(),
      ticketId,
      userId: req.user?.id || null,
      userName: name || req.user?.username || 'Anonymous User',
      senderEmail: email || req.user?.email || 'unspecified@client.local',
      targetEmail: OWNER_EMAIL,
      subject: subject || `AuraAlarm Feedback: [${category || 'General'}]`,
      category: category || 'Feedback',
      rating: rating || 5,
      message,
      status: 'DISPATCHED_TO_OWNER',
      createdAt: new Date().toISOString()
    };

    await db.insert('feedbackMessages', newFeedback);

    // Pre-composed direct mailto URL
    const mailtoSubject = encodeURIComponent(newFeedback.subject);
    const mailtoBody = encodeURIComponent(
      `Hello Developer,\n\n${message}\n\nFrom: ${newFeedback.userName} (${newFeedback.senderEmail})\nReference: ${ticketId}`
    );
    const mailtoUrl = `mailto:${OWNER_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

    res.status(201).json({
      success: true,
      ticketId,
      message: `Your inquiry has been logged and dispatched to developer at ${OWNER_EMAIL}`,
      targetEmail: OWNER_EMAIL,
      mailtoUrl
    });
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ error: 'Failed to process feedback submission' });
  }
});

// GET /feedback/list (admin / debug view)
router.get('/list', (req, res) => {
  try {
    const list = db.data.feedbackMessages || [];
    res.json({ feedback: list, total: list.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;
