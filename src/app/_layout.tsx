import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [signedIn, setSignedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => {
      setSignedIn(!!u);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (initializing) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    if (!signedIn && !inAuthGroup) router.replace('/welcome');
    else if (signedIn && inAuthGroup) router.replace('/');
  }, [signedIn, initializing, segments]);

  if (initializing) return null;

  return <Slot />;
}