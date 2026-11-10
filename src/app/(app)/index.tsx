import { Ionicons } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostGrid } from '../../components/PostGrid';
import { Post, subscribeFeed } from '../../services/posts';

// The sample pictures from before: [id, title, ratio] where ratio = image height / width
const SAMPLE: [string, string, number][] = [
  ['p1', 'Mountain sunrise', 1.5],
  ['p2', 'Cozy coffee corner', 1.0],
  ['p3', 'Minimalist workspace', 1.3],
  ['p4', 'Tropical beach', 1.7],
  ['p5', 'City at night', 1.2],
  ['p6', 'Autumn forest', 1.6],
  ['p7', 'Fresh fruit bowl', 1.0],
  ['p8', 'Modern kitchen', 1.4],
  ['p9', 'Street food market', 1.25],
  ['p10', 'Desert dunes', 1.55],
  ['p11', 'Rainy window', 1.1],
  ['p12', 'Vintage bookshelf', 1.65],
  ['p13', 'Sunset sailboat', 1.3],
  ['p14', 'Wildflower meadow', 1.45],
  ['p15', 'Cozy cabin', 1.0],
  ['p16', 'Neon signs', 1.5],
  ['p17', 'Snowy peaks', 1.2],
  ['p18', 'Garden path', 1.6],
  ['p19', 'Pasta night', 1.35],
  ['p20', 'Lighthouse coast', 1.15],
];

const SAMPLE_POSTS: Post[] = SAMPLE.map(([id, title, ratio]) => ({
  id: `sample-${id}`,
  authorId: 'pinly',
  authorName: 'Pinly',
  authorPhotoUrl: '',
  text: title,
  imageUrl: `https://picsum.photos/seed/${id}/600/${Math.round(600 * ratio)}`,
  ratio,
}));

export default function HomeScreen() {
  const user = getAuth().currentUser;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    return subscribeFeed(
      (list) => {
        setPosts(list);
        setLoading(false);
        setFailed(false);
      },
      () => {
        setFailed(true);
        setLoading(false);
      }
    );
  }, []);

  // Real posts first (newest first), then the sample pictures.
  const filtered = useMemo(() => {
    const all = [...posts, ...SAMPLE_POSTS];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) => p.text.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q)
    );
  }, [posts, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Pinly</Text>
        {user?.photoURL ? <Image source={{ uri: user.photoURL }} style={styles.avatar} /> : null}
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#767676" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts"
          placeholderTextColor="#767676"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#767676" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E60023" />
        </View>
      ) : failed ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Could not load the feed</Text>
          <Text style={styles.errorText}>Check your connection and your Firestore rules.</Text>
        </View>
      ) : (
        <PostGrid
          posts={filtered}
          emptyTitle="No posts found"
          emptyText={`Nothing matches “${query.trim()}”.`}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#E60023' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efefef',
    borderRadius: 24,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111', paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  errorText: { fontSize: 15, color: '#666', textAlign: 'center' },
});