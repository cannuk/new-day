import { useSelector } from 'react-redux';
import { HashRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthInitialized } from './features/auth/authSlice';
import { Login } from './features/auth/Login';
import { CurrentDay } from './features/day/CurrentDay';
import { Day } from './features/day/Day';
import { useAuthListener } from './hooks/useAuth';
import { useFirestoreSync } from './hooks/useFirestoreSync';

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
    return <LoadingScreen />;
  }

  // Not logged in - show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Logged in - render app
  return (
    <Router>
      <Routes>
        <Route path="/day/:id" element={<DayRoute />} />
        <Route path="/" element={<CurrentDay />} />
      </Routes>
    </Router>
  );
}

function LoadingScreen() {
  return (
    <div className="flex justify-center items-center h-screen bg-base-200">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
}

export default App;
