import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { createSelector } from 'reselect';
import { dayTaskSelectors, DayTask } from '../day/daySlice';

export enum TaskType {
  Most,
  Other,
  Quick,
  PDP,
}

export type Task = {
  id: string;
  text: string;
  notes?: string;
  created: string;
  updated: string;
  completed?: string;
  complete: boolean;
  type: TaskType;
};

const tasksAdapter = createEntityAdapter<Task>({
  sortComparer: (a, b) => (new Date(a.created) < new Date(b.created) ? -1 : 1),
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: tasksAdapter.getInitialState(),
  reducers: {
    // Can pass adapter functions directly as case reducers.  Because we're passing this
    // as a value, `createSlice` will auto-generate the `taskAdded` action type / creator
    taskAdded: tasksAdapter.addOne,
    taskUpdated: tasksAdapter.upsertOne,
    tasksUpdated: tasksAdapter.upsertMany,
    taskRemoved: tasksAdapter.removeOne,
    tasksRemoved: tasksAdapter.removeMany,
    // Replace all tasks (used for Firestore sync)
    tasksReplaced: tasksAdapter.setAll,
  },
});

export const { taskAdded, taskRemoved, taskUpdated, tasksUpdated, tasksRemoved, tasksReplaced } = tasksSlice.actions;
export const taskSelectors = tasksAdapter.getSelectors((state: RootState) => state.tasks);

export const getCompleted = createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
  tasks.filter((t: Task) => t.complete)
);

export const getUnCompleted = createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
  tasks.filter((t: Task) => !t.complete)
);

// Memoized selector factory for getting tasks by type
const byTypeSelectors = {
  [TaskType.Most]: createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
    tasks.filter((t: Task) => t.type === TaskType.Most)
  ),
  [TaskType.Other]: createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
    tasks.filter((t: Task) => t.type === TaskType.Other)
  ),
  [TaskType.Quick]: createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
    tasks.filter((t: Task) => t.type === TaskType.Quick)
  ),
  [TaskType.PDP]: createSelector([taskSelectors.selectAll], (tasks: Task[]) =>
    tasks.filter((t: Task) => t.type === TaskType.PDP)
  ),
};

export const getByType = (type: TaskType) => byTypeSelectors[type];

// Cache for memoized day selectors
const daySelectorsCache: Record<string, ReturnType<typeof createSelector>> = {};

export const getTasksByDay = (dayId: string) => {
  if (!daySelectorsCache[dayId]) {
    daySelectorsCache[dayId] = createSelector(
      [dayTaskSelectors.selectAll, taskSelectors.selectAll],
      (dt: DayTask[], tasks: Task[]) => {
        const taskIds = dt.filter((d: DayTask) => d.dayId === dayId).map((d: DayTask) => d.taskId);
        return tasks.filter((t: Task) => taskIds.includes(t.id));
      }
    );
  }
  return daySelectorsCache[dayId];
};

export default tasksSlice.reducer;
