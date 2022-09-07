import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { createSelector } from 'reselect';
import { dayTaskSelectors } from '../day/daySlice';

export enum TaskType {
  Rhythm,
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
  },
});

export const { taskAdded, taskRemoved, taskUpdated, tasksUpdated, tasksRemoved } = tasksSlice.actions;
export const taskSelectors = tasksAdapter.getSelectors((state: RootState) => state.tasks);
export const getCompleted = (state: RootState) => taskSelectors.selectAll(state).filter((t) => t.complete);
export const getUnCompleted = (state: RootState) => taskSelectors.selectAll(state).filter((t) => !t.complete);
export const getByType = (type: TaskType) => (state: RootState) =>
  taskSelectors.selectAll(state).filter((t) => t.type === type);

export const getTasksByDay = (dayId: string) =>
  createSelector([dayTaskSelectors.selectAll, taskSelectors.selectAll], (dt, tasks) => {
    const taskIds = dt.filter((d) => d.dayId === dayId).map((d) => d.taskId);
    return tasks.filter((t) => taskIds.includes(t.id));
  });

export default tasksSlice.reducer;
