import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearAuth } from '../features/auth/authSlice';
import { auth } from '../firebase/config';
import { ensureUserDocument } from '../firebase/firestore';

export const useAuthListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore
        await ensureUserDocument(user.uid, {
          email: user.email || undefined,
          displayName: user.displayName || undefined,
        });

        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );
      } else {
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
};

export const signInWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};
