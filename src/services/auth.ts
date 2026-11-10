import { getAuth, signOut } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';

type AuthUser = NonNullable<ReturnType<typeof getAuth>['currentUser']>;

// Returns false (and signs out) if the account is disabled.
export async function syncUserProfile(user: AuthUser): Promise<boolean> {
  const ref = doc(getFirestore(), 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data()?.disabled === true) {
    await signOut(getAuth());
    return false;
  }

  await setDoc(
    ref,
    {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL ?? '',
      ...(snap.exists() ? {} : { createdAt: serverTimestamp(), disabled: false }),
    },
    { merge: true }
  );
  return true;
}