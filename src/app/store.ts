import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

import tasksReducer from '../features/task/taskSlice';

const persistConfig = {
  key: 'root',
  storage,
};

const rootReducer: any = combineReducers({
  tasks: tasksReducer,
});

const persistedReducer = persistReducer<any>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
