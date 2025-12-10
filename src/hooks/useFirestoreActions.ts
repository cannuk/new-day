import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserId } from '../features/auth/authSlice';
import { Day, DayTask, dayAdded, dayTaskAdded, dayTaskRemoved } from '../features/day/daySlice';
import {
  Task,
  taskAdded,
  taskUpdated,
  tasksUpdated,
  taskRemoved,
  tasksRemoved,
} from '../features/task/taskSlice';
import * as firestoreService from '../firebase/firestore';

export const useFirestoreActions = () => {
  const dispatch = useDispatch();
  const userId = useSelector(selectUserId);

  // Task actions
  const addTask = useCallback(
    async (task: Task) => {
      dispatch(taskAdded(task));
      if (userId) {
        await firestoreService.setTask(userId, task);
      }
    },
    [dispatch, userId]
  );

  const updateTask = useCallback(
    async (task: Partial<Task> & { id: string }) => {
      // Cast to any for Redux dispatch since upsertOne accepts partial updates
      dispatch(taskUpdated(task as any));
      if (userId) {
        // Use merge: true to only update the fields provided
        await firestoreService.setTask(userId, task as Task, true);
      }
    },
    [dispatch, userId]
  );

  const updateTasks = useCallback(
    async (tasks: (Partial<Task> & { id: string })[]) => {
      // Cast to any for Redux dispatch since upsertMany accepts partial updates
      dispatch(tasksUpdated(tasks as any));
      if (userId) {
        // Use merge: true to only update the fields provided
        await firestoreService.setTasks(userId, tasks as Task[], true);
      }
    },
    [dispatch, userId]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      dispatch(taskRemoved(taskId));
      if (userId) {
        await firestoreService.deleteTask(userId, taskId);
      }
    },
    [dispatch, userId]
  );

  const removeTasks = useCallback(
    async (taskIds: string[]) => {
      dispatch(tasksRemoved(taskIds));
      if (userId) {
        await firestoreService.deleteTasks(userId, taskIds);
      }
    },
    [dispatch, userId]
  );

  // Day actions
  const addDay = useCallback(
    async (day: Day) => {
      dispatch(dayAdded(day));
      if (userId) {
        await firestoreService.setDay(userId, day);
      }
    },
    [dispatch, userId]
  );

  // DayTask actions
  const addDayTask = useCallback(
    async (dayTask: DayTask) => {
      dispatch(dayTaskAdded(dayTask));
      if (userId) {
        await firestoreService.setDayTask(userId, dayTask);
      }
    },
    [dispatch, userId]
  );

  const removeDayTask = useCallback(
    async (dayTaskId: string) => {
      dispatch(dayTaskRemoved(dayTaskId));
      if (userId) {
        await firestoreService.deleteDayTask(userId, dayTaskId);
      }
    },
    [dispatch, userId]
  );

  return {
    addTask,
    updateTask,
    updateTasks,
    removeTask,
    removeTasks,
    addDay,
    addDayTask,
    removeDayTask,
  };
};
