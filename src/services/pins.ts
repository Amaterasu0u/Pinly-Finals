import { getAuth } from '@react-native-firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where,
} from '@react-native-firebase/firestore';

export type Pin = { id: string; title: string; ratio: number; imageUrl: string };

// Newest first. A document that was just written has no server time yet, so treat it as newest.
const millis = (t: any): number => (t?.toMillis ? t.toMillis() : Number.MAX_SAFE_INTEGER);

// Works for both saved docs (title) and posts (text).
const toPin = (id: string, data: any): Pin => ({
  id,
  title: data?.title ?? data?.text ?? '',
  ratio: data?.ratio ?? 1,
  imageUrl: data?.imageUrl ?? '',
});

const currentUid = () => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return uid;
};

// Pins the user bookmarked: users/{uid}/saved/{pinId}
export function subscribeSaved(onChange: (pins: Pin[]) => void) {
  const user = getAuth().currentUser;
  if (!user) return () => {};
  return onSnapshot(
    collection(getFirestore(), 'users', user.uid, 'saved'),
    (snap) => {
      onChange(
        snap.docs
          .map((d) => ({ pin: toPin(d.id, d.data()), t: millis(d.data()?.savedAt) }))
          .sort((a, b) => b.t - a.t)
          .map((x) => x.pin)
      );
    },
    (e) => console.error('saved listener:', e)
  );
}

export async function toggleSave(pin: Pin, currentlySaved: boolean) {
  const ref = doc(getFirestore(), 'users', currentUid(), 'saved', pin.id);
  if (currentlySaved) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, {
      title: pin.title,
      ratio: pin.ratio,
      imageUrl: pin.imageUrl,
      savedAt: serverTimestamp(),
    });
  }
}

// The user's own pictures: posts where authorId == uid
export function subscribeMyUploads(onChange: (pins: Pin[]) => void) {
  const user = getAuth().currentUser;
  if (!user) return () => {};
  return onSnapshot(
    query(collection(getFirestore(), 'posts'), where('authorId', '==', user.uid)),
    (snap) => {
      onChange(
        snap.docs
          .map((d) => ({ pin: toPin(d.id, d.data()), t: millis(d.data()?.createdAt) }))
          .filter((x) => x.pin.imageUrl) // text-only posts have no picture
          .sort((a, b) => b.t - a.t)
          .map((x) => x.pin)
      );
    },
    (e) => console.error('uploads listener:', e)
  );
}

export async function addUpload(title: string, imageUrl: string, ratio: number) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Not signed in');
  await addDoc(collection(getFirestore(), 'posts'), {
    authorId: user.uid,
    authorName: user.displayName ?? '',
    authorPhotoUrl: user.photoURL ?? '',
    text: title,
    imageUrl, // a data: URI, because Storage isn't available on Spark
    ratio,
    createdAt: serverTimestamp(),
  });
}

export async function deleteUpload(postId: string) {
  await deleteDoc(doc(getFirestore(), 'posts', postId));
}