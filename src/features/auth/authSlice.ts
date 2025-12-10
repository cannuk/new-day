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
      state.isInitialized = true;
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
