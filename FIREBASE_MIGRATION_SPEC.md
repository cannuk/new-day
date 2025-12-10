# Firebase Migration Specification

## Overview

This document outlines the migration of the **new-day** task management app from localStorage (via redux-persist) to Firebase, enabling:

1. **Cloud persistence** - Data stored in Firestore
2. **Multi-device sync** - Real-time updates across devices
3. **External API access** - Claude (or other tools) can add tasks via HTTP
4. **User authentication** - Secure, per-user data

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Target Architecture](#target-architecture)
3. [Firebase Services Used](#firebase-services-used)
4. [Data Models](#data-models)
5. [Authentication](#authentication)
6. [Firestore Schema](#firestore-schema)
7. [Redux + Firestore Integration Strategy](#redux--firestore-integration-strategy)
8. [Claude API Integration](#claude-api-integration)
9. [File Changes](#file-changes)
10. [Security Rules](#security-rules)
11. [Offline Support](#offline-support)
12. [Implementation Phases](#implementation-phases)
13. [Detailed Code Examples](#detailed-code-examples)

---

## Current Architecture

```
┌─────────────────────────────────────────┐
│              React App                  │
│  ┌─────────────────────────────────┐    │
│  │         Redux Store             │    │
│  │  ┌─────────┬─────────┬───────┐  │    │
│  │  │  tasks  │  days   │dayTasks│ │    │
│  │  └─────────┴─────────┴───────┘  │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│          redux-persist                  │
│                 │                       │
│          localStorage                   │
└─────────────────────────────────────────┘
```

**Current Stack:**
- React 17 + TypeScript
- Redux Toolkit with Entity Adapters
- redux-persist → localStorage
- react-router-dom (HashRouter)
- theme-ui + emotion

**Current Data Flow:**
1. User action → dispatch(action)
2. Redux reducer updates state
3. redux-persist auto-saves to localStorage
4. Components re-render via useSelector

---

## Target Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      React App                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   Redux Store                      │  │
│  │  ┌─────────┬─────────┬─────────┬────────────────┐  │  │
│  │  │  tasks  │  days   │dayTasks │  auth + sync   │  │  │
│  │  └─────────┴─────────┴─────────┴────────────────┘  │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│              Firebase SDK (real-time listeners)          │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Firebase                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Firestore  │  │    Auth     │  │ Cloud Functions │  │
│  │  (database) │  │  (Google)   │  │   (Claude API)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS
                          │
                    ┌─────┴─────┐
                    │  Claude   │
                    └───────────┘
```

---

## Firebase Services Used

| Service | Purpose |
|---------|---------|
| **Firestore** | NoSQL document database for tasks, days, dayTasks |
| **Authentication** | User login (Google provider initially) |
| **Cloud Functions** | HTTP endpoint for Claude to add tasks |
| **Hosting** (optional) | Deploy the React app |

---

## Data Models

### Current Models (unchanged structure)

```typescript
// Task
type Task = {
  id: string;           // nanoid generated
  text: string;
  notes?: string;
  created: string;      // ISO date string
  updated: string;      // ISO date string
  completed?: string;   // ISO date string when completed
  complete: boolean;
  type: TaskType;       // Most | Other | Quick | PDP
};

// Day
type Day = {
  id: string;
  created: string;
};

// DayTask (junction)
type DayTask = {
  id: string;
  dayId: string;
  taskId: string;
  created: string;
};
```

### New: Firebase-specific additions

```typescript
// Added to all documents in Firestore
interface FirebaseDocument {
  userId: string;       // Owner's Firebase UID
  createdAt: Timestamp; // Firestore server timestamp
  updatedAt: Timestamp; // Firestore server timestamp
}

// Local sync state (Redux only, not persisted to Firestore)
interface SyncMeta {
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt?: string;
  error?: string;
}
```

---

## Authentication

### Strategy: Google Sign-In (simplest)

**Why Google:**
- Single click to sign in
- No password management
- Firebase Auth handles everything
- Can add email/password later if needed

### Auth Flow

```
1. User opens app
2. Check Firebase auth state
   ├─ Authenticated → Load user's data from Firestore
   └─ Not authenticated → Show login screen
3. User clicks "Sign in with Google"
4. Firebase handles OAuth flow
5. On success → Create user doc if new, load data
6. User can now use app
```

### Auth State in Redux

```typescript
interface AuthState {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}
```

---

## Firestore Schema

### Collection Structure

```
/users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - apiKey: string          // For Claude API access

/users/{userId}/tasks/{taskId}
  - id: string
  - text: string
  - notes: string
  - created: string
  - updated: string
  - completed: string | null
  - complete: boolean
  - type: number (TaskType enum)
  - createdAt: timestamp    // Firestore server timestamp
  - updatedAt: timestamp

/users/{userId}/days/{dayId}
  - id: string
  - created: string
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/dayTasks/{dayTaskId}
  - id: string
  - dayId: string
  - taskId: string
  - created: string
  - createdAt: timestamp
```

### Why Subcollections Under User?

- **Security**: Easy to write rules that restrict access to owner
- **Queries**: No need to filter by userId in every query
- **Scalability**: Each user's data is isolated
- **Cost**: Only read/write your own data

---

## Redux + Firestore Integration Strategy

### Approach: Hybrid Sync Layer (Recommended)

We'll keep the existing Redux entity adapters and add a sync layer that bridges Firestore ↔ Redux. This approach:

- **Preserves your existing slice structure** - minimal changes to working code
- **No heavy dependencies** - no redux-firestore or react-redux-firebase
- **Full control** - easy to debug, no "magic"
- **Real-time sync** - Firestore listeners dispatch existing Redux actions

### Why Not Other Approaches?

| Approach | Verdict |
|----------|---------|
| **redux-firestore** | Aging library (last update 2022), opinionated structure conflicts with entity adapters |
| **RTK Query** | Designed for REST/GraphQL, requires adapters for Firestore real-time |
| **Full rewrite** | Unnecessary - your current slices are well-structured |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Redux Store                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  tasks        │  days         │  dayTasks           │  │  │
│  │  │  (entity      │  (entity      │  (entity            │  │  │
│  │  │   adapter)    │   adapter)    │   adapter)          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          ▲                                │  │
│  │                          │ dispatch existing actions      │  │
│  │  ┌───────────────────────┴─────────────────────────────┐  │  │
│  │  │              useFirestoreSync() hook                │  │  │
│  │  │                                                     │  │  │
│  │  │  • Sets up onSnapshot listeners per collection      │  │  │
│  │  │  • Maps Firestore doc changes → Redux actions       │  │  │
│  │  │  • Handles add/modify/remove events                 │  │  │
│  │  └───────────────────────┬─────────────────────────────┘  │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │           Firestore Service Layer (firestore.ts)          │  │
│  │                                                           │  │
│  │  • addTask(), updateTask(), deleteTask()                  │  │
│  │  • addDay(), addDayTask(), etc.                           │  │
│  │  • All writes go through here                             │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     Firestore     │
                    │   (Cloud DB)      │
                    └───────────────────┘
```

### Data Flow: Reading (Firestore → Redux)

```
1. User logs in
2. useFirestoreSync() hook activates
3. Sets up onSnapshot listeners for:
   - /users/{userId}/tasks
   - /users/{userId}/days
   - /users/{userId}/dayTasks
4. On document change (added/modified/removed):
   - Listener callback fires
   - Maps change to existing Redux action
   - dispatch(taskAdded/taskUpdated/taskRemoved)
5. Redux store updates
6. Components re-render via useSelector (unchanged!)
```

### Data Flow: Writing (Redux → Firestore)

**Option A: Firestore-First (Recommended - Simpler)**

```
1. User creates task in UI
2. Component calls firestoreService.addTask(task)
3. Firestore write completes
4. onSnapshot listener detects new document
5. Listener dispatches taskAdded(task)
6. Redux updates, UI re-renders

Pros: Single source of truth, no duplicate dispatches
Cons: Slight delay before UI updates (~50-200ms)
```

**Option B: Optimistic Updates (Faster UI)**

```
1. User creates task in UI
2. Component dispatches taskAdded(task) immediately
3. UI updates instantly
4. Component calls firestoreService.addTask(task)
5. If write fails → dispatch taskRemoved(task.id) + show error

Pros: Instant UI feedback
Cons: More complex, need rollback logic
```

**Recommendation:** Start with Option A (Firestore-first). If UI feels sluggish, upgrade specific actions to optimistic.

### Sync State Management

Track sync status in a dedicated slice:

```typescript
// src/features/sync/syncSlice.ts
interface SyncState {
  isInitialized: boolean;     // True after first data load
  isOnline: boolean;          // Network status
  pendingWrites: number;      // Count of queued writes
  lastSyncedAt: string | null;
  error: string | null;
}
```

### Handling Offline Mode

Firestore SDK handles offline automatically:
- Reads: Served from IndexedDB cache
- Writes: Queued in cache, synced when online
- Listeners: Resume automatically on reconnect

Our sync hook just needs to track status:

```typescript
// In useFirestoreSync
useEffect(() => {
  const unsubscribe = onSnapshot(
    query,
    (snapshot) => {
      // Handle updates
      dispatch(setSyncStatus('synced'));
    },
    (error) => {
      dispatch(setSyncError(error.message));
    }
  );
  return unsubscribe;
}, []);
```

---

## Claude API Integration

### Option A: Cloud Functions (Recommended)

A Firebase Cloud Function provides an HTTP endpoint that Claude can call.

```
POST https://us-central1-{project}.cloudfunctions.net/addTask
Headers:
  Authorization: Bearer {user-api-key}
  Content-Type: application/json
Body:
  {
    "text": "Review pull request #42",
    "type": "Other",
    "dayId": "abc123"  // optional, defaults to current day
  }
```

**Cloud Function Logic:**
1. Validate API key → get userId
2. If no dayId, find user's most recent day
3. Create task document
4. Create dayTask junction document
5. Return success + task ID

### Option B: Direct Firestore Access

Claude could write directly to Firestore using Firebase Admin SDK, but this requires:
- Service account credentials (security risk)
- More complex setup
- No validation layer

**Recommendation: Use Cloud Functions (Option A)**

### API Key Management

Each user gets a unique API key stored in their user document:

```typescript
// Generate on first login or on-demand
const apiKey = nanoid(32);  // e.g., "V1StGXR8_Z5jdHi6B-myT..."
```

User can view/regenerate their API key in app settings.

---

## File Changes

### New Files to Create

| File | Purpose |
|------|---------|
| `src/firebase/config.ts` | Firebase initialization |
| `src/firebase/auth.ts` | Auth helper functions |
| `src/firebase/firestore.ts` | Firestore CRUD operations |
| `src/features/auth/authSlice.ts` | Auth state management |
| `src/features/auth/Login.tsx` | Login UI component |
| `src/features/auth/UserMenu.tsx` | User profile/logout |
| `src/hooks/useFirestoreSync.ts` | Real-time sync hook |
| `src/hooks/useAuth.ts` | Auth state hook |
| `functions/src/index.ts` | Cloud Functions for Claude API |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add firebase, remove redux-persist |
| `src/app/store.ts` | Remove persist config, add auth reducer |
| `src/App.tsx` | Remove PersistGate, add auth check |
| `src/index.tsx` | Initialize Firebase |
| `src/features/task/taskSlice.ts` | Add async thunks for Firestore |
| `src/features/day/daySlice.ts` | Add async thunks for Firestore |
| `src/features/task/NewTask.tsx` | Use async dispatch |
| `src/features/task/Task.tsx` | Use async dispatch |
| `src/features/day/CurrentDay.tsx` | Use async dispatch |

### Files to Delete (Phase 3)

- Redux-persist related imports and config

---

## Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Days subcollection
      match /days/{dayId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // DayTasks subcollection
      match /dayTasks/{dayTaskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Offline Support

Firestore has built-in offline persistence:

```typescript
// In firebase/config.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Offline persistence failed:', err);
});
```

**Behavior:**
- Reads served from cache when offline
- Writes queued and synced when back online
- Real-time listeners resume automatically
- No additional code needed in components

---

## Implementation Phases

### Phase 1: Foundation (Day 1-2)

**Tasks:**
1. Create Firebase project in console
2. Enable Firestore and Authentication
3. Add Firebase SDK to project
4. Create `firebase/config.ts` with initialization
5. Create `authSlice.ts` with auth state
6. Create `Login.tsx` component
7. Wrap app with auth check
8. Test: Can sign in/out with Google

**Deliverable:** App requires login, but still uses localStorage for data

---

### Phase 2: Firestore Integration (Day 3-4)

**Tasks:**
1. Create Firestore helper functions (CRUD)
2. Add async thunks to taskSlice
3. Add async thunks to daySlice
4. Create `useFirestoreSync` hook for real-time listeners
5. Update components to use async dispatches
6. Add loading states to UI
7. Test: Data persists to Firestore

**Deliverable:** App reads/writes to both localStorage AND Firestore

---

### Phase 3: Claude API (Day 5)

**Tasks:**
1. Set up Firebase Functions project
2. Create `addTask` HTTP function
3. Implement API key validation
4. Add API key display in user settings
5. Test: Claude can add tasks via API
6. Create MCP server config or skill for Claude

**Deliverable:** Claude can add tasks to a user's account

---

### Phase 4: Cleanup & Polish (Day 6-7)

**Tasks:**
1. Remove redux-persist
2. Remove localStorage fallback
3. Add localStorage → Firestore migration for existing users
4. Add error handling UI (toasts/alerts)
5. Add loading skeletons
6. Test offline behavior
7. Deploy to Firebase Hosting (optional)

**Deliverable:** Production-ready Firebase-backed app

---

## Claude MCP/Skill Configuration

Once the Cloud Function is deployed, Claude can use it via an MCP tool or skill:

```json
{
  "name": "add-task",
  "description": "Add a task to the user's new-day app",
  "parameters": {
    "text": {
      "type": "string",
      "description": "The task description",
      "required": true
    },
    "type": {
      "type": "string",
      "enum": ["Most", "Other", "Quick", "PDP"],
      "default": "Other"
    }
  }
}
```

---

## Environment Variables

```bash
# .env.local (not committed)
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
```

---

## Cost Estimate

Firebase free tier (Spark plan) includes:
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Authentication**: Unlimited
- **Cloud Functions**: 2M invocations/month
- **Hosting**: 10GB storage, 360MB/day transfer

**For personal use:** Free tier is more than sufficient

**If scaling:** Blaze (pay-as-you-go) is ~$0.06/100K reads, $0.18/100K writes

---

## Questions to Resolve

1. **Auth providers**: Google only, or also email/password?
2. **Sharing**: Should users be able to share days/tasks with others? (Not in v1)
3. **API scope**: Should Claude be able to complete/delete tasks, or just add?
4. **Migration**: Force migration from localStorage, or keep as fallback?

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Storage | localStorage | Firestore |
| Auth | None | Google Sign-In |
| Multi-device | No | Yes (real-time) |
| Claude access | Not possible | Cloud Function API |
| Offline | Full (localStorage) | Full (Firestore cache) |
| Data backup | None | Automatic (Firebase) |

**Total estimated effort:** 5-7 days for full implementation

---

## Detailed Code Examples

### Firebase Configuration

```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

// Use emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
```

---

### Firestore Service Layer

```typescript
// src/firebase/firestore.ts
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { Task } from '../features/task/taskSlice';
import { Day, DayTask } from '../features/day/daySlice';

// ============ HELPER FUNCTIONS ============

const getUserCollection = (userId: string, collectionName: string) =>
  collection(db, `users/${userId}/${collectionName}`);

const getUserDoc = (userId: string, collectionName: string, docId: string) =>
  doc(db, `users/${userId}/${collectionName}`, docId);

// ============ TASKS ============

export const addTask = async (userId: string, task: Task): Promise<void> => {
  const taskRef = getUserDoc(userId, 'tasks', task.id);
  await setDoc(taskRef, {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = getUserDoc(userId, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = getUserDoc(userId, 'tasks', taskId);
  await deleteDoc(taskRef);
};

// ============ DAYS ============

export const addDay = async (userId: string, day: Day): Promise<void> => {
  const dayRef = getUserDoc(userId, 'days', day.id);
  await setDoc(dayRef, {
    ...day,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteDay = async (userId: string, dayId: string): Promise<void> => {
  const dayRef = getUserDoc(userId, 'days', dayId);
  await deleteDoc(dayRef);
};

// ============ DAY TASKS ============

export const addDayTask = async (userId: string, dayTask: DayTask): Promise<void> => {
  const dayTaskRef = getUserDoc(userId, 'dayTasks', dayTask.id);
  await setDoc(dayTaskRef, {
    ...dayTask,
    createdAt: serverTimestamp(),
  });
};

export const deleteDayTask = async (userId: string, dayTaskId: string): Promise<void> => {
  const dayTaskRef = getUserDoc(userId, 'dayTasks', dayTaskId);
  await deleteDoc(dayTaskRef);
};

// ============ LISTENERS ============

export const subscribeToTasks = (
  userId: string,
  onData: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    getUserCollection(userId, 'tasks'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q,
    (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Task[];
      onData(tasks);
    },
    onError
  );
};

export const subscribeToDays = (
  userId: string,
  onData: (days: Day[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    getUserCollection(userId, 'days'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q,
    (snapshot) => {
      const days = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Day[];
      onData(days);
    },
    onError
  );
};

export const subscribeToDayTasks = (
  userId: string,
  onData: (dayTasks: DayTask[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    getUserCollection(userId, 'dayTasks'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q,
    (snapshot) => {
      const dayTasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as DayTask[];
      onData(dayTasks);
    },
    onError
  );
};
```

---

### Auth Slice

```typescript
// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isLoading = false;
      state.isInitialized = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearAuth } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectUserId = (state: RootState) => state.auth.user?.uid;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthInitialized = (state: RootState) => state.auth.isInitialized;

export default authSlice.reducer;
```

---

### Sync Slice

```typescript
// src/features/sync/syncSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface SyncState {
  isInitialized: boolean;
  tasksLoaded: boolean;
  daysLoaded: boolean;
  dayTasksLoaded: boolean;
  error: string | null;
}

const initialState: SyncState = {
  isInitialized: false,
  tasksLoaded: false,
  daysLoaded: false,
  dayTasksLoaded: false,
  error: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setTasksLoaded: (state) => {
      state.tasksLoaded = true;
      state.isInitialized = state.tasksLoaded && state.daysLoaded && state.dayTasksLoaded;
    },
    setDaysLoaded: (state) => {
      state.daysLoaded = true;
      state.isInitialized = state.tasksLoaded && state.daysLoaded && state.dayTasksLoaded;
    },
    setDayTasksLoaded: (state) => {
      state.dayTasksLoaded = true;
      state.isInitialized = state.tasksLoaded && state.daysLoaded && state.dayTasksLoaded;
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    resetSync: (state) => {
      state.isInitialized = false;
      state.tasksLoaded = false;
      state.daysLoaded = false;
      state.dayTasksLoaded = false;
      state.error = null;
    },
  },
});

export const {
  setTasksLoaded,
  setDaysLoaded,
  setDayTasksLoaded,
  setSyncError,
  resetSync
} = syncSlice.actions;

export const selectSyncInitialized = (state: RootState) => state.sync.isInitialized;
export const selectSyncError = (state: RootState) => state.sync.error;

export default syncSlice.reducer;
```

---

### Firestore Sync Hook

```typescript
// src/hooks/useFirestoreSync.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserId } from '../features/auth/authSlice';
import {
  subscribeToTasks,
  subscribeToDays,
  subscribeToDayTasks
} from '../firebase/firestore';
import { tasksUpdated, tasksRemoved } from '../features/task/taskSlice';
import { daysUpdated, dayTasksUpdated, daysRemoved, dayTasksRemoved } from '../features/day/daySlice';
import {
  setTasksLoaded,
  setDaysLoaded,
  setDayTasksLoaded,
  setSyncError,
  resetSync
} from '../features/sync/syncSlice';

export const useFirestoreSync = () => {
  const dispatch = useDispatch();
  const userId = useSelector(selectUserId);

  useEffect(() => {
    if (!userId) {
      dispatch(resetSync());
      return;
    }

    // Subscribe to tasks
    const unsubTasks = subscribeToTasks(
      userId,
      (tasks) => {
        // Replace all tasks with fresh data from Firestore
        // First clear, then add (or use a "setAll" action if you add one)
        dispatch(tasksUpdated(tasks));
        dispatch(setTasksLoaded());
      },
      (error) => {
        console.error('Tasks sync error:', error);
        dispatch(setSyncError(error.message));
      }
    );

    // Subscribe to days
    const unsubDays = subscribeToDays(
      userId,
      (days) => {
        dispatch(daysUpdated(days));
        dispatch(setDaysLoaded());
      },
      (error) => {
        console.error('Days sync error:', error);
        dispatch(setSyncError(error.message));
      }
    );

    // Subscribe to dayTasks
    const unsubDayTasks = subscribeToDayTasks(
      userId,
      (dayTasks) => {
        dispatch(dayTasksUpdated(dayTasks));
        dispatch(setDayTasksLoaded());
      },
      (error) => {
        console.error('DayTasks sync error:', error);
        dispatch(setSyncError(error.message));
      }
    );

    // Cleanup on unmount or userId change
    return () => {
      unsubTasks();
      unsubDays();
      unsubDayTasks();
    };
  }, [userId, dispatch]);
};
```

---

### Auth Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { setUser, setLoading, setError, clearAuth } from '../features/auth/authSlice';

export const useAuthListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }));
      } else {
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
};

export const signInWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};
```

---

### Updated Store Configuration

```typescript
// src/app/store.ts
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import tasksReducer from '../features/task/taskSlice';
import daysReducer, { dayTasksReducer } from '../features/day/daySlice';
import authReducer from '../features/auth/authSlice';
import syncReducer from '../features/sync/syncSlice';

const rootReducer = combineReducers({
  tasks: tasksReducer,
  days: daysReducer,
  dayTasks: dayTasksReducer,
  auth: authReducer,
  sync: syncReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firestore Timestamp objects
        ignoredActions: ['tasks/tasksUpdated', 'days/daysUpdated', 'dayTasks/dayTasksUpdated'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
```

---

### Updated App.tsx

```typescript
// src/App.tsx
import React from 'react';
import { ThemeProvider } from 'theme-ui';
import { useSelector } from 'react-redux';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import theme from './themes/start';
import { Day } from './features/day/Day';
import { CurrentDay } from './features/day/CurrentDay';
import { Login } from './features/auth/Login';
import { useAuthListener } from './hooks/useAuth';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { selectIsAuthenticated, selectAuthInitialized } from './features/auth/authSlice';
import { selectSyncInitialized } from './features/sync/syncSlice';

function App() {
  // Set up auth listener
  useAuthListener();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);

  // Show loading while checking auth state
  if (!authInitialized) {
    return <LoadingScreen />;
  }

  // Not logged in - show login
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <Login />
      </ThemeProvider>
    );
  }

  // Logged in - render app with sync
  return (
    <ThemeProvider theme={theme}>
      <AuthenticatedApp />
    </ThemeProvider>
  );
}

// Separate component so useFirestoreSync only runs when authenticated
function AuthenticatedApp() {
  useFirestoreSync();

  const syncInitialized = useSelector(selectSyncInitialized);

  if (!syncInitialized) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/day/:id" render={({ match }: any) => <Day dayId={match.id} />} />
        <Route path="/" render={() => <CurrentDay />} />
      </Switch>
    </Router>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );
}

export default App;
```

---

### Updated NewTask Component (Firestore-First)

```typescript
// src/features/task/NewTask.tsx
import React, { FC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { Flex, Input, Box } from 'theme-ui';
import { nanoid } from 'nanoid';

import { TaskType, Task } from './taskSlice';
import { DayTask } from '../day/daySlice';
import { selectUserId } from '../auth/authSlice';
import { addTask, addDayTask } from '../../firebase/firestore';

type NewTaskProps = {
  taskType: TaskType;
  dayId: string;
};

export const NewTask: FC<NewTaskProps> = ({ taskType, dayId }) => {
  const [textVal, setTextVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = useSelector(selectUserId);

  const handleChange = useCallback((ev) => setTextVal(ev.target.value), []);

  const onKeypress = useCallback(
    async (ev) => {
      if (ev.key === 'Enter' && textVal.trim() !== '' && userId && !isSubmitting) {
        setIsSubmitting(true);

        const taskId = nanoid();
        const task: Task = {
          id: taskId,
          text: textVal,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          complete: false,
          type: taskType,
        };
        const dayTask: DayTask = {
          id: nanoid(),
          dayId,
          taskId,
          created: new Date().toISOString(),
        };

        try {
          // Write to Firestore - listeners will update Redux
          await Promise.all([
            addTask(userId, task),
            addDayTask(userId, dayTask),
          ]);
          setTextVal('');
        } catch (error) {
          console.error('Failed to add task:', error);
          // TODO: Show error toast
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [dayId, userId, taskType, textVal, isSubmitting]
  );

  return (
    <StyledFlex paddingTop={3} paddingBottom={3}>
      <SpaceBox />
      <StyledInput
        backgroundColor="primary"
        placeholder="New Task"
        onChange={handleChange}
        onKeyDown={onKeypress}
        bg="background"
        sx={{ borderColor: 'muted', borderWidth: 2 }}
        value={textVal}
        disabled={isSubmitting}
      />
      <SpaceBox />
    </StyledFlex>
  );
};

const StyledInput = styled(Input)``;
const StyledFlex = styled(Flex)`
  align-items: center;
`;
const SpaceBox = styled(Box)`
  width: 32px;
`;
```

---

### Cloud Function for Claude API

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';

admin.initializeApp();
const db = admin.firestore();

interface AddTaskRequest {
  text: string;
  type?: 'Most' | 'Other' | 'Quick' | 'PDP';
  dayId?: string;
}

// Map string type to enum value
const TaskTypeMap: Record<string, number> = {
  Most: 0,
  Other: 1,
  Quick: 2,
  PDP: 3,
};

export const addTask = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate API key
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const apiKey = authHeader.split('Bearer ')[1];

  // Look up user by API key
  const usersSnapshot = await db
    .collection('users')
    .where('apiKey', '==', apiKey)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const userId = usersSnapshot.docs[0].id;
  const body = req.body as AddTaskRequest;

  // Validate request body
  if (!body.text || typeof body.text !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "text" field' });
    return;
  }

  // Get dayId - use provided or find most recent day
  let dayId = body.dayId;
  if (!dayId) {
    const daysSnapshot = await db
      .collection(`users/${userId}/days`)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (daysSnapshot.empty) {
      res.status(400).json({ error: 'No days found. Please create a day in the app first.' });
      return;
    }
    dayId = daysSnapshot.docs[0].id;
  }

  // Create task
  const taskId = nanoid();
  const now = new Date().toISOString();
  const taskType = body.type ? TaskTypeMap[body.type] ?? 2 : 2; // Default to "Other"

  const task = {
    id: taskId,
    text: body.text,
    created: now,
    updated: now,
    complete: false,
    type: taskType,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const dayTask = {
    id: nanoid(),
    dayId,
    taskId,
    created: now,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Write to Firestore
  const batch = db.batch();
  batch.set(db.doc(`users/${userId}/tasks/${taskId}`), task);
  batch.set(db.doc(`users/${userId}/dayTasks/${dayTask.id}`), dayTask);
  await batch.commit();

  res.status(201).json({
    success: true,
    taskId,
    dayId,
    message: `Task "${body.text}" added successfully`,
  });
});
```

---

### Login Component

```typescript
// src/features/auth/Login.tsx
import React from 'react';
import { Box, Button, Heading, Text } from 'theme-ui';
import { signInWithGoogle } from '../../hooks/useAuth';

export const Login: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 4,
      }}
    >
      <Heading as="h1" mb={3}>
        New Day
      </Heading>
      <Text mb={4} sx={{ color: 'secondary' }}>
        Sign in to sync your tasks across devices
      </Text>

      <Button
        onClick={handleLogin}
        disabled={isLoading}
        sx={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>

      {error && (
        <Text mt={3} sx={{ color: 'red' }}>
          {error}
        </Text>
      )}
    </Box>
  );
};
```

---

## Slice Modifications Summary

### taskSlice.ts Changes

```typescript
// Add these new actions to handle bulk operations from Firestore sync
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: tasksAdapter.getInitialState(),
  reducers: {
    taskAdded: tasksAdapter.addOne,
    taskUpdated: tasksAdapter.upsertOne,
    tasksUpdated: tasksAdapter.upsertMany,  // Used by sync
    taskRemoved: tasksAdapter.removeOne,
    tasksRemoved: tasksAdapter.removeMany,
    // NEW: Clear all tasks (for logout)
    tasksClear: tasksAdapter.removeAll,
    // NEW: Set all tasks at once (alternative to upsertMany)
    tasksSet: tasksAdapter.setAll,
  },
});
```

### daySlice.ts Changes

```typescript
// Same pattern - add clear and set actions
const daysSlice = createSlice({
  name: 'days',
  initialState: daysAdapter.getInitialState(),
  reducers: {
    dayAdded: daysAdapter.addOne,
    dayUpdated: daysAdapter.upsertOne,
    daysUpdated: daysAdapter.upsertMany,
    dayRemoved: daysAdapter.removeOne,
    daysRemoved: daysAdapter.removeMany,
    daysClear: daysAdapter.removeAll,  // NEW
    daysSet: daysAdapter.setAll,       // NEW
  },
});

const dayTasksSlice = createSlice({
  name: 'dayTasks',
  initialState: dayTasksAdapter.getInitialState(),
  reducers: {
    dayTaskAdded: dayTasksAdapter.addOne,
    dayTaskUpdated: dayTasksAdapter.upsertOne,
    dayTasksUpdated: dayTasksAdapter.upsertMany,
    dayTaskRemoved: dayTasksAdapter.removeOne,
    dayTasksRemoved: dayTasksAdapter.removeMany,
    dayTasksClear: dayTasksAdapter.removeAll,  // NEW
    dayTasksSet: dayTasksAdapter.setAll,       // NEW
  },
});
```
