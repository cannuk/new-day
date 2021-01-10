import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

export type Day = {
  id: string;
  created: string;
};

type DayTask = {
  id: string;
  dayId: string;
  taskId: string;
  created: string;
};

const daysAdapter = createEntityAdapter<Day>({
  sortComparer: (a, b) => (new Date(a.created) < new Date(b.created) ? -1 : 1),
});

const dayTasksAdapter = createEntityAdapter<DayTask>({
  sortComparer: (a, b) => (new Date(a.created) < new Date(b.created) ? -1 : 1),
});

const daysSlice = createSlice({
  name: 'days',
  initialState: daysAdapter.getInitialState(),
  reducers: {
    dayAdded: daysAdapter.addOne,
    dayUpdated: daysAdapter.upsertOne,
    daysUpdated: daysAdapter.upsertMany,
    dayRemoved: daysAdapter.removeOne,
    daysRemoved: daysAdapter.removeMany,
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
  },
});

// export const getCompleted = (state: RootState) => daySelectors.selectAll(state).filter((t) => t.complete);

export const { dayAdded, dayRemoved, dayUpdated, daysUpdated, daysRemoved } = daysSlice.actions;
export const daySelectors = daysAdapter.getSelectors((state: RootState) => state.days);
export const dayTaskSelectors = dayTasksAdapter.getSelectors((state: RootState) => state.dayTasks);
export const dayTaskReducer = dayTasksSlice.reducer;
export default daysSlice.reducer;
