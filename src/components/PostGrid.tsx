import { ReactElement, useMemo } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import type { Post } from '../services/posts';

const PADDING = 12;
const GAP = 10;
const COLORS = ['#FDE8EB', '#E8F1FD', '#EAF7EC', '#FFF4DC', '#F0E9FB', '#E6F6F5'];

const colorFor = (id: string) =>
  COLORS[id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length];

// Rough card height, only used to balance the two columns.
const estimate = (p: Post) =>
  (p.imageUrl ? p.ratio : 0.6 + Math.min(p.text.length / 220, 0.9)) + 0.35;

function splitColumns(posts: Post[]): Post[][] {
  const columns: Post[][] = [[], []];
  const heights = [0, 0];
  posts.forEach((post) => {
    const i = heights[0] <= heights[1] ? 0 : 1;
    columns[i].push(post);
    heights[i] += estimate(post);
  });
  return columns;
}

type Props = {
  posts: Post[];
  header?: ReactElement;
  onPress?: (post: Post) => void;
  onLongPress?: (post: Post) => void;
  emptyTitle?: string;
  emptyText?: string;
};

export function PostGrid({
  posts,
  header,
  onPress,
  onLongPress,
  emptyTitle = 'Nothing here yet',
  emptyText = '',
}: Props) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - PADDING * 2 - GAP) / 2;
  const columns = useMemo(() => splitColumns(posts), [posts]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {header}

      {posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          {emptyText ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
        </View>
      ) : (
        <View style={[styles.row, { paddingHorizontal: PADDING, gap: GAP }]}>
          {columns.map((column, index) => (
            <View key={index} style={{ width: columnWidth, gap: GAP }}>
              {column.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  activeOpacity={0.9}
                  onPress={onPress ? () => onPress(post) : undefined}
                  onLongPress={onLongPress ? () => onLongPress(post) : undefined}
                >
                  {post.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: post.imageUrl }}
                        style={[styles.image, { width: columnWidth, aspectRatio: 1 / post.ratio }]}
                      />
                      <Text style={styles.caption} numberOfLines={3}>
                        {post.text}
                      </Text>
                    </>
                  ) : (
                    <View style={[styles.textCard, { backgroundColor: colorFor(post.id) }]}>
                      <Text style={styles.textBody}>{post.text}</Text>
                    </View>
                  )}

                  <View style={styles.author}>
                    {post.authorPhotoUrl ? (
                      <Image source={{ uri: post.authorPhotoUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]} />
                    )}
                    <Text style={styles.authorName} numberOfLines={1}>
                      {post.authorName || 'Unknown'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  image: { borderRadius: 16, backgroundColor: '#e9e9e9' },
  caption: { fontSize: 13, fontWeight: '600', color: '#111', marginTop: 6, marginHorizontal: 4 },
  textCard: { borderRadius: 16, padding: 14, minHeight: 90, justifyContent: 'center' },
  textBody: { fontSize: 15, lineHeight: 21, color: '#111', fontWeight: '500' },
  author: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginHorizontal: 4 },
  avatar: { width: 20, height: 20, borderRadius: 10 },
  avatarFallback: { backgroundColor: '#ddd' },
  authorName: { flex: 1, fontSize: 12, color: '#666' },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
});