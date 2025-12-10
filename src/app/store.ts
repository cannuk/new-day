import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from '../features/auth/authSlice';
import daysReducer, { dayTasksReducer } from '../features/day/daySlice';
import tasksReducer from '../features/task/taskSlice';

const rootReducer = combineReducers({
  tasks: tasksReducer,
  days: daysReducer,
  dayTasks: dayTasksReducer,
  auth: authReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firestore Timestamp objects in future phases
        ignoredActions: ['tasks/tasksUpdated', 'days/daysUpdated', 'dayTasks/dayTasksUpdated'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
