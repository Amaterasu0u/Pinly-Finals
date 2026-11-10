import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinGrid } from '../../components/PinGrid';
import {
  Pin,
  addUpload,
  deleteUpload,
  subscribeMyUploads,
  subscribeSaved,
  toggleSave,
} from '../../services/pins';

type Tab = 'saved' | 'uploads';
type Draft = { imageUrl: string; ratio: number };

export default function ProfileScreen() {
  const user = getAuth().currentUser;
  const [tab, setTab] = useState<Tab>('saved');
  const [saved, setSaved] = useState<Pin[]>([]);
  const [uploads, setUploads] = useState<Pin[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeSaved(setSaved), []);
  useEffect(() => subscribeMyUploads(setUploads), []);

  const savedIds = new Set(saved.map((p) => p.id));

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled) return;

      setBusy(true);
      // Shrink the picture so it fits inside a Firestore document (1 MB limit).
      const context = ImageManipulator.manipulate(result.assets[0].uri, { maxWidth: 1600 });
      context.resize({ width: 800 });
      const rendered = await context.renderAsync();
      const out = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.6,
        base64: true,
      });

      if (!out.base64) throw new Error('No image data');
      const imageUrl = `data:image/jpeg;base64,${out.base64}`;
      if (imageUrl.length > 900_000) {
        Alert.alert('Picture too large', 'Please choose a smaller or simpler picture.');
        return;
      }
      setTitle('');
      setDraft({ imageUrl, ratio: out.height / out.width });
    } catch (e) {
      console.error(e);
      Alert.alert('Could not load picture', 'Please try a different one.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    const text = title.trim();
    if (!text) {
      Alert.alert('Add a name', 'Give your pin a name so it can be searched.');
      return;
    }
    setBusy(true);
    try {
      await addUpload(text, draft.imageUrl, draft.ratio);
      setDraft(null);
      setTab('uploads');
    } catch (e) {
      console.error(e);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (pin: Pin) => {
    Alert.alert('Delete this pin?', `“${pin.title}” will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteUpload(pin.id).catch(() => Alert.alert('Could not delete', 'Try again.')),
      },
    ]);
  };

  const header = (
    <View>
      <View style={styles.profile}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]} />
        )}
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={pickImage} disabled={busy}>
            {busy && !draft ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="image" size={18} color="#fff" />
                <Text style={styles.primaryText}>Upload picture</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => signOut(getAuth())}>
            <Text style={styles.secondaryText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['saved', 'uploads'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'saved' ? `Saved (${saved.length})` : `My uploads (${uploads.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {tab === 'saved' ? (
        <PinGrid
          header={header}
          pins={saved}
          savedIds={savedIds}
          onToggleSave={(pin) => toggleSave(pin, true)}
          emptyTitle="No saved pins yet"
          emptyText="Tap the bookmark on a pin in Home to save it here."
        />
      ) : (
        <PinGrid
          header={header}
          pins={uploads}
          onDelete={confirmDelete}
          emptyTitle="No uploads yet"
          emptyText="Tap “Upload picture” to add one. Tap the trash icon on a pin to delete it."
        />
      )}

      <Modal visible={!!draft} transparent animationType="fade" onRequestClose={() => setDraft(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {draft ? <Image source={{ uri: draft.imageUrl }} style={styles.preview} /> : null}
            <TextInput
              style={styles.input}
              placeholder="Name your pin"
              placeholderTextColor="#767676"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setDraft(null)}
                disabled={busy}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={publish} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  profile: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#ddd' },
  name: { fontSize: 22, fontWeight: '600' },
  email: { fontSize: 15, color: '#666', marginTop: 4, marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E60023',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    minWidth: 90,
  },
  primaryText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efefef',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
  },
  secondaryText: { color: '#111', fontWeight: 'bold' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    marginBottom: 12,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#E60023' },
  tabText: { fontSize: 15, color: '#767676', fontWeight: '600' },
  tabTextActive: { color: '#111' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12 },
  preview: { width: '100%', height: 260, borderRadius: 14, resizeMode: 'cover' },
  input: {
    backgroundColor: '#efefef',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 16,
    color: '#111',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});