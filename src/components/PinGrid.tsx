import { Ionicons } from '@expo/vector-icons';
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
import type { Pin } from '../services/pins';

const PADDING = 12;
const GAP = 10;

// Put each pin in whichever column is currently shorter.
function splitColumns(pins: Pin[]): Pin[][] {
  const columns: Pin[][] = [[], []];
  const heights = [0, 0];
  pins.forEach((pin) => {
    const i = heights[0] <= heights[1] ? 0 : 1;
    columns[i].push(pin);
    heights[i] += pin.ratio;
  });
  return columns;
}

type Props = {
  pins: Pin[];
  savedIds?: Set<string>;
  onToggleSave?: (pin: Pin) => void;
  onLongPress?: (pin: Pin) => void;
  onDelete?: (pin: Pin) => void;
  header?: ReactElement;
  emptyTitle?: string;
  emptyText?: string;
};

export function PinGrid({
  pins,
  savedIds,
  onToggleSave,
  onLongPress,
  onDelete,
  header,
  emptyTitle = 'Nothing here yet',
  emptyText = '',
}: Props) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - PADDING * 2 - GAP) / 2;
  const columns = useMemo(() => splitColumns(pins), [pins]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {header}

      {pins.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          {emptyText ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
        </View>
      ) : (
        <View style={[styles.row, { paddingHorizontal: PADDING, gap: GAP }]}>
          {columns.map((column, index) => (
            <View key={index} style={{ width: columnWidth, gap: GAP }}>
              {column.map((pin) => {
                const saved = savedIds?.has(pin.id) ?? false;
                return (
                  <TouchableOpacity
                    key={pin.id}
                    activeOpacity={0.9}
                    onLongPress={onLongPress ? () => onLongPress(pin) : undefined}
                  >
                    <View>
                      <Image
                        source={{ uri: pin.imageUrl }}
                        style={[styles.image, { width: columnWidth, aspectRatio: 1 / pin.ratio }]}
                      />
                      {onToggleSave ? (
                        <TouchableOpacity
                          style={styles.action}
                          onPress={() => onToggleSave(pin)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={saved ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={saved ? '#E60023' : '#111'}
                          />
                        </TouchableOpacity>
                      ) : null}
                      {onDelete ? (
                        <TouchableOpacity
                          style={styles.action}
                          onPress={() => onDelete(pin)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color="#E60023" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {pin.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
  action: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '600', color: '#111', marginTop: 6, marginHorizontal: 4 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
});