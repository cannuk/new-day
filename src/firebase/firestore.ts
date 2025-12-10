import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Task } from '../features/task/taskSlice';
import { Day, DayTask } from '../features/day/daySlice';

// Collection paths helper
const getUserCollection = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName);

// Tasks
export const setTask = async (userId: string, task: Task, merge: boolean = false): Promise<void> => {
  const taskRef = doc(getUserCollection(userId, 'tasks'), task.id);
  await setDoc(taskRef, task, { merge });
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = doc(getUserCollection(userId, 'tasks'), taskId);
  await deleteDoc(taskRef);
};

export const setTasks = async (userId: string, tasks: Task[], merge: boolean = false): Promise<void> => {
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
