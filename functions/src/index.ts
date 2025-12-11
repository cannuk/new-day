import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// Hash API key for secure storage/comparison
const hashApiKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Input validation limits
const MAX_TEXT_LENGTH = 1000;
const MAX_NOTES_LENGTH = 5000;
const MAX_DAYID_LENGTH = 50;

// Task type enum values (must match frontend)
const TaskTypeMap: Record<string, number> = {
  Most: 0,
  Other: 1,
  Quick: 2,
  PDP: 3,
};

interface AddTaskRequest {
  text: string;
  type?: 'Most' | 'Other' | 'Quick' | 'PDP';
  notes?: string;
  dayId?: string;
}

interface AddTaskResponse {
  success: boolean;
  taskId?: string;
  dayId?: string;
  message: string;
}

/**
 * HTTP endpoint for adding tasks from external tools (e.g., Claude)
 *
 * POST /addTask
 * Headers:
 *   Authorization: Bearer {user-api-key}
 *   Content-Type: application/json
 * Body:
 *   {
 *     "text": "Task description",
 *     "type": "Other",  // optional: Most, Other, Quick, PDP
 *     "notes": "Optional notes",
 *     "dayId": "abc123"  // optional: defaults to most recent day
 *   }
 */
export const addTask = functions.https.onRequest(async (req, res) => {
  // CORS headers - restrict to known origins in production
  // For CLI/desktop apps, we need to allow requests without origin
  const origin = req.headers.origin;
  if (origin) {
    // Only allow specific origins for browser requests
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://new-day-69f04.web.app',
      'https://new-day-69f04.firebaseapp.com',
    ];
    if (allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    // If origin not in list, don't set CORS header (browser will block)
  }
  // For non-browser requests (CLI, desktop apps), no CORS needed
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' } as AddTaskResponse);
    return;
  }

  // Validate Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header. Use: Bearer {api-key}'
    } as AddTaskResponse);
    return;
  }

  const apiKey = authHeader.split('Bearer ')[1];
  if (!apiKey || apiKey.length < 20 || apiKey.length > 100) {
    res.status(401).json({ success: false, message: 'Invalid API key format' } as AddTaskResponse);
    return;
  }

  try {
    // Hash the API key and look up user
    const hashedKey = hashApiKey(apiKey);
    const usersSnapshot = await db
      .collection('users')
      .where('apiKeyHash', '==', hashedKey)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(401).json({ success: false, message: 'Invalid API key' } as AddTaskResponse);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const body = req.body as AddTaskRequest;

    // Validate request body - text is required
    if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid "text" field. Task text is required.'
      } as AddTaskResponse);
      return;
    }

    // Validate input lengths
    if (body.text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({
        success: false,
        message: `Task text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`
      } as AddTaskResponse);
      return;
    }

    if (body.notes && body.notes.length > MAX_NOTES_LENGTH) {
      res.status(400).json({
        success: false,
        message: `Notes exceed maximum length of ${MAX_NOTES_LENGTH} characters.`
      } as AddTaskResponse);
      return;
    }

    if (body.dayId && body.dayId.length > MAX_DAYID_LENGTH) {
      res.status(400).json({
        success: false,
        message: 'Invalid dayId format.'
      } as AddTaskResponse);
      return;
    }

    // Validate type if provided
    if (body.type && !Object.keys(TaskTypeMap).includes(body.type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid task type. Must be one of: Most, Other, Quick, PDP'
      } as AddTaskResponse);
      return;
    }

    // Get dayId - use provided or find most recent day
    let dayId = body.dayId;
    if (!dayId) {
      const daysSnapshot = await db
        .collection(`users/${userId}/days`)
        .orderBy('created', 'desc')
        .limit(1)
        .get();

      if (daysSnapshot.empty) {
        res.status(400).json({
          success: false,
          message: 'No days found. Please create a day in the app first.'
        } as AddTaskResponse);
        return;
      }
      dayId = daysSnapshot.docs[0].id;
    } else {
      // Verify the day exists and belongs to this user
      const dayDoc = await db.doc(`users/${userId}/days/${dayId}`).get();
      if (!dayDoc.exists) {
        res.status(400).json({
          success: false,
          message: 'Day not found.'
        } as AddTaskResponse);
        return;
      }
    }

    // Create task
    const taskId = nanoid();
    const dayTaskId = nanoid();
    const now = new Date().toISOString();
    const taskType = body.type ? (TaskTypeMap[body.type] ?? TaskTypeMap.Other) : TaskTypeMap.Other;

    const task = {
      id: taskId,
      text: body.text.trim().substring(0, MAX_TEXT_LENGTH),
      notes: body.notes?.trim().substring(0, MAX_NOTES_LENGTH) || '',
      created: now,
      updated: now,
      complete: false,
      type: taskType,
    };

    const dayTask = {
      id: dayTaskId,
      dayId,
      taskId,
      created: now,
    };

    // Write to Firestore using batch
    const batch = db.batch();
    batch.set(db.doc(`users/${userId}/tasks/${taskId}`), task);
    batch.set(db.doc(`users/${userId}/dayTasks/${dayTaskId}`), dayTask);
    await batch.commit();

    res.status(201).json({
      success: true,
      taskId,
      dayId,
      message: 'Task added successfully',
    } as AddTaskResponse);

  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AddTaskResponse);
  }
});

/**
 * HTTP endpoint to list recent days (useful for Claude to know available days)
 *
 * GET /listDays
 * Headers:
 *   Authorization: Bearer {user-api-key}
 */
export const listDays = functions.https.onRequest(async (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://new-day-69f04.web.app',
      'https://new-day-69f04.firebaseapp.com',
    ];
    if (allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    return;
  }

  const apiKey = authHeader.split('Bearer ')[1];
  if (!apiKey || apiKey.length < 20 || apiKey.length > 100) {
    res.status(401).json({ success: false, message: 'Invalid API key format' });
    return;
  }

  try {
    const hashedKey = hashApiKey(apiKey);
    const usersSnapshot = await db
      .collection('users')
      .where('apiKeyHash', '==', hashedKey)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(401).json({ success: false, message: 'Invalid API key' });
      return;
    }

    const userId = usersSnapshot.docs[0].id;

    const daysSnapshot = await db
      .collection(`users/${userId}/days`)
      .orderBy('created', 'desc')
      .limit(10)
      .get();

    const days = daysSnapshot.docs.map(doc => ({
      id: doc.id,
      created: doc.data().created,
    }));

    res.status(200).json({
      success: true,
      days,
      message: `Found ${days.length} recent days`,
    });

  } catch (error) {
    console.error('Error listing days:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
