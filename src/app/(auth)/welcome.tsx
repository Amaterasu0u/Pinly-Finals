import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: 'images-outline', title: 'Discover', text: 'Browse a feed of ideas from the community.' },
  { icon: 'bookmark-outline', title: 'Save', text: 'Keep the pins you love in one place.' },
  { icon: 'cloud-upload-outline', title: 'Share', text: 'Upload your own pictures for others to find.' },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>Pinly</Text>
        <Text style={styles.headline}>Find ideas you love</Text>
        <Text style={styles.sub}>Discover, save and share your favorite pins.</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={f.icon} size={22} color="#E60023" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>You’ll sign in with your Google account.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  top: { alignItems: 'center', marginTop: 48 },
  logo: { fontSize: 46, fontWeight: 'bold', color: '#E60023' },
  headline: { fontSize: 24, fontWeight: '700', marginTop: 16, color: '#111' },
  sub: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center' },
  features: { flex: 1, justifyContent: 'center', gap: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  featureSub: { fontSize: 14, color: '#666', marginTop: 2 },
  bottom: { paddingBottom: 24, alignItems: 'center' },
  button: {
    backgroundColor: '#E60023',
    height: 52,
    borderRadius: 26,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { fontSize: 13, color: '#767676', marginTop: 12 },
});