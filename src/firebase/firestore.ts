import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Day, DayTask } from '../features/day/daySlice';
import { Task } from '../features/task/taskSlice';
import { db } from './config';

// Collection paths helper
const getUserCollection = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName);

// Tasks
export const setTask = async (
  userId: string,
  task: Task,
  merge: boolean = false
): Promise<void> => {
  try {
    const taskRef = doc(getUserCollection(userId, 'tasks'), task.id);
    await setDoc(taskRef, task, { merge });
  } catch (error) {
    console.error('Error saving task to Firestore:', error);
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = doc(getUserCollection(userId, 'tasks'), taskId);
  await deleteDoc(taskRef);
};

export const setTasks = async (
  userId: string,
  tasks: Task[],
  merge: boolean = false
): Promise<void> => {
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const taskRef = doc(getUserCollection(userId, 'tasks'), task.id);
    batch.set(taskRef, task, { merge });
  });
  await batch.commit();
};

export const deleteTasks = async (userId: string, taskIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  taskIds.forEach((taskId) => {
    const taskRef = doc(getUserCollection(userId, 'tasks'), taskId);
    batch.delete(taskRef);
  });
  await batch.commit();
};

// Days
export const setDay = async (userId: string, day: Day): Promise<void> => {
  const dayRef = doc(getUserCollection(userId, 'days'), day.id);
  await setDoc(dayRef, day);
};

export const deleteDay = async (userId: string, dayId: string): Promise<void> => {
  const dayRef = doc(getUserCollection(userId, 'days'), dayId);
  await deleteDoc(dayRef);
};

// DayTasks
export const setDayTask = async (userId: string, dayTask: DayTask): Promise<void> => {
  const dayTaskRef = doc(getUserCollection(userId, 'dayTasks'), dayTask.id);
  await setDoc(dayTaskRef, dayTask);
};

export const deleteDayTask = async (userId: string, dayTaskId: string): Promise<void> => {
  const dayTaskRef = doc(getUserCollection(userId, 'dayTasks'), dayTaskId);
  await deleteDoc(dayTaskRef);
};

// Listeners
export type TasksListener = (tasks: Task[]) => void;
export type DaysListener = (days: Day[]) => void;
export type DayTasksListener = (dayTasks: DayTask[]) => void;

export const subscribeToTasks = (userId: string, onData: TasksListener): Unsubscribe => {
  const q = query(getUserCollection(userId, 'tasks'));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as Task);
    });
    onData(tasks);
  });
};

export const subscribeToDays = (userId: string, onData: DaysListener): Unsubscribe => {
  const q = query(getUserCollection(userId, 'days'));
  return onSnapshot(q, (snapshot) => {
    const days: Day[] = [];
    snapshot.forEach((doc) => {
      days.push(doc.data() as Day);
    });
    onData(days);
  });
};

export const subscribeToDayTasks = (userId: string, onData: DayTasksListener): Unsubscribe => {
  const q = query(getUserCollection(userId, 'dayTasks'));
  return onSnapshot(q, (snapshot) => {
    const dayTasks: DayTask[] = [];
    snapshot.forEach((doc) => {
      dayTasks.push(doc.data() as DayTask);
    });
    onData(dayTasks);
  });
};

// User document & API key management
const getUserDocRef = (userId: string) => doc(db, 'users', userId);

// Hash API key using Web Crypto API (browser-compatible)
const hashApiKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export interface UserDocument {
  email?: string;
  displayName?: string;
  apiKeyHash?: string; // We only store the hash, never the plain key
  hasApiKey?: boolean; // Flag to indicate if user has generated a key
  createdAt?: string;
}

export const getUserDocument = async (userId: string): Promise<UserDocument | null> => {
  const userDoc = await getDoc(getUserDocRef(userId));
  return userDoc.exists() ? (userDoc.data() as UserDocument) : null;
};

export const ensureUserDocument = async (
  userId: string,
  data: { email?: string; displayName?: string }
): Promise<void> => {
  const userDoc = await getDoc(getUserDocRef(userId));
  if (!userDoc.exists()) {
    await setDoc(getUserDocRef(userId), {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }
};

export const hasApiKey = async (userId: string): Promise<boolean> => {
  const userDoc = await getUserDocument(userId);
  return !!userDoc?.hasApiKey;
};

/**
 * Generate a new API key.
 * IMPORTANT: The plain-text key is only returned once and never stored.
 * We store only the hash for verification.
 */
export const generateApiKey = async (userId: string): Promise<string> => {
  const apiKey = nanoid(32);
  const apiKeyHash = await hashApiKey(apiKey);
  await updateDoc(getUserDocRef(userId), {
    apiKeyHash,
    hasApiKey: true,
  });
  return apiKey; // Return plain key to show user ONCE
};

export const regenerateApiKey = async (userId: string): Promise<string> => {
  return generateApiKey(userId);
};
