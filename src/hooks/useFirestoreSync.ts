import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserId } from '../features/auth/authSlice';
import { tasksReplaced } from '../features/task/taskSlice';
import { daysReplaced, dayTasksReplaced } from '../features/day/daySlice';
import {
  subscribeToTasks,
  subscribeToDays,
  subscribeToDayTasks,
} from '../firebase/firestore';

export const useFirestoreSync = () => {
  const dispatch = useDispatch();
  const userId = useSelector(selectUserId);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Clean up previous subscriptions
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];

    if (!userId) {
      return;
    }

    // Subscribe to all collections
    const unsubTasks = subscribeToTasks(userId, (tasks) => {
      dispatch(tasksReplaced(tasks));
    });

    const unsubDays = subscribeToDays(userId, (days) => {
      dispatch(daysReplaced(days));
    });

    const unsubDayTasks = subscribeToDayTasks(userId, (dayTasks) => {
      dispatch(dayTasksReplaced(dayTasks));
    });

    unsubscribesRef.current = [unsubTasks, unsubDays, unsubDayTasks];

    // Cleanup on unmount or userId change
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, [dispatch, userId]);
};
