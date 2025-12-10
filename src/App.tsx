import React from 'react';
import { ThemeProvider } from 'theme-ui';
import { useSelector } from 'react-redux';
import { HashRouter as Router, Routes, Route, useParams } from 'react-router-dom';

import theme from './themes/start';
import { Day } from './features/day/Day';
import { CurrentDay } from './features/day/CurrentDay';
import { Login } from './features/auth/Login';
import { useAuthListener } from './hooks/useAuth';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { selectIsAuthenticated, selectAuthInitialized } from './features/auth/authSlice';

// Wrapper component to extract params for Day
function DayRoute() {
  const { id } = useParams<{ id: string }>();
  return <Day dayId={id || ''} />;
}

function App() {
  // Set up auth listener
  useAuthListener();
  // Set up Firestore sync (listens when authenticated)
  useFirestoreSync();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);

  // Show loading while checking auth state
  if (!authInitialized) {
    return (
      <ThemeProvider theme={theme as any}>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  // Not logged in - show login
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme as any}>
        <Login />
      </ThemeProvider>
    );
  }

  // Logged in - render app
  return (
    <ThemeProvider theme={theme as any}>
      <Router>
        <Routes>
          <Route path="/day/:id" element={<DayRoute />} />
          <Route path="/" element={<CurrentDay />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#eee'
    }}>
      Loading...
    </div>
  );
}

export default App;
