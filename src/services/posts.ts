import { getAuth } from '@react-native-firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from '@react-native-firebase/firestore';

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string;
  text: string;
  imageUrl: string; // '' for text-only posts
  ratio: number; // image height / width (1 for text-only posts)
};

const toPost = (id: string, data: any): Post => ({
  id,
  authorId: data?.authorId ?? '',
  authorName: data?.authorName ?? '',
  authorPhotoUrl: data?.authorPhotoUrl ?? '',
  text: data?.text ?? '',
  imageUrl: data?.imageUrl ?? '',
  ratio: data?.ratio ?? 1,
});

const clampRatio = (r: number) => Math.min(Math.max(r, 0.5), 2.5);

// All posts, newest first, live.
export function subscribeFeed(
  onChange: (posts: Post[]) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    query(collection(getFirestore(), 'posts'), orderBy('createdAt', 'desc'), limit(50)),
    (snap) => onChange(snap.docs.map((d) => toPost(d.id, d.data()))),
    (e) => {
      console.error('feed listener:', e);
      onError?.(e);
    }
  );
}

// The signed-in user's own posts, newest first.
// This query needs the composite index (authorId + createdAt); we create it in the next stage.
export function subscribeMyPosts(
  onChange: (posts: Post[]) => void,
  onError?: (e: Error) => void
) {
  const user = getAuth().currentUser;
  if (!user) return () => {};
  return onSnapshot(
    query(
      collection(getFirestore(), 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ),
    (snap) => onChange(snap.docs.map((d) => toPost(d.id, d.data()))),
    (e) => {
      console.error('my posts listener:', e);
      onError?.(e);
    }
  );
}

export async function createPost(input: { text: string; imageUrl?: string; ratio?: number }) {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Not signed in');
  await addDoc(collection(getFirestore(), 'posts'), {
    authorId: user.uid,
    authorName: user.displayName ?? '',
    authorPhotoUrl: user.photoURL ?? '',
    text: input.text,
    imageUrl: input.imageUrl ?? '',
    ratio: clampRatio(input.ratio ?? 1),
    createdAt: serverTimestamp(),
  });
}

export async function updatePost(id: string, input: { text: string }) {
  await updateDoc(doc(getFirestore(), 'posts', id), {
    text: input.text,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id: string) {
  await deleteDoc(doc(getFirestore(), 'posts', id));
}