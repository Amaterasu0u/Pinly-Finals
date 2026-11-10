import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost } from '../../services/posts';

const MAX_TEXT = 500;

const getImageRatio = (url: string) =>
  new Promise<number>((resolve, reject) =>
    Image.getSize(url, (w, h) => resolve(h / w), reject)
  );

type Picked = { imageUrl: string; ratio: number };

export default function CreateScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (result.canceled) return;

      setBusy(true);
      // Shrink the picture so it fits inside a Firestore document.
      const context = ImageManipulator.manipulate(result.assets[0].uri, { maxWidth: 1600 });
      context.resize({ width: 720 });
      const rendered = await context.renderAsync();
      const out = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.5,
        base64: true,
      });
      if (!out.base64) throw new Error('No image data');

      const imageUrl = `data:image/jpeg;base64,${out.base64}`;
      if (imageUrl.length > 700_000) {
        Alert.alert('Picture too large', 'Please choose a smaller or simpler picture.');
        return;
      }
      setUrlInput('');
      setPicked({ imageUrl, ratio: out.height / out.width });
    } catch (e) {
      console.error(e);
      Alert.alert('Could not load picture', 'Please try a different one.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const body = text.trim();
    if (!body) {
      Alert.alert('Write something', 'A post needs some text.');
      return;
    }

    setBusy(true);
    try {
      let imageUrl = '';
      let ratio = 1;

      if (picked) {
        imageUrl = picked.imageUrl;
        ratio = picked.ratio;
      } else if (urlInput.trim()) {
        const url = urlInput.trim();
        if (!/^https?:\/\//i.test(url)) {
          Alert.alert('Invalid link', 'The image link must start with http:// or https://');
          return;
        }
        try {
          ratio = await getImageRatio(url);
        } catch {
          Alert.alert('Image not found', 'That link could not be loaded as a picture.');
          return;
        }
        imageUrl = url;
      }

      await createPost({ text: body, imageUrl, ratio });
      setText('');
      setUrlInput('');
      setPicked(null);
      router.navigate('/');
    } catch (e) {
      console.error(e);
      Alert.alert('Could not post', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a post</Text>

        <TextInput
          style={styles.textArea}
          placeholder="What do you want to share?"
          placeholderTextColor="#767676"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={MAX_TEXT}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>
          {text.length}/{MAX_TEXT}
        </Text>

        <Text style={styles.label}>Picture (optional)</Text>

        {picked ? (
          <View>
            <Image source={{ uri: picked.imageUrl }} style={styles.preview} />
            <TouchableOpacity style={styles.removePicked} onPress={() => setPicked(null)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Paste an image link (https://...)"
              placeholderTextColor="#767676"
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} disabled={busy}>
              <Ionicons name="image-outline" size={18} color="#111" />
              <Text style={styles.galleryText}>Choose from gallery</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.postButton, busy && styles.disabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.postText}>Post</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  textArea: {
    backgroundColor: '#efefef',
    borderRadius: 16,
    padding: 14,
    minHeight: 130,
    fontSize: 16,
    color: '#111',
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: '#767676', marginTop: -6 },
  label: { fontSize: 15, fontWeight: '600', color: '#111', marginTop: 4 },
  input: {
    backgroundColor: '#efefef',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 16,
    color: '#111',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#efefef',
  },
  galleryText: { fontSize: 15, fontWeight: '600', color: '#111' },
  preview: { width: '100%', height: 220, borderRadius: 16, resizeMode: 'cover' },
  removePicked: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    backgroundColor: '#E60023',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  postText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.7 },
});