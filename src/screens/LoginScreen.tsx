import { getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { syncUserProfile } from '../services/auth';

const WEB_CLIENT_ID = '481418844921-uicn9eta9jj4d75e3hfk3db59i2hlta9.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

export function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Forget the last account so Google always shows the account chooser
      // (with "Add another account").
      try {
        await GoogleSignin.signOut();
      } catch {}

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') return;

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert('Sign-in failed', 'Google did not return an ID token. Please try again.');
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(getAuth(), credential);

      const allowed = await syncUserProfile(user);
      if (!allowed) {
        Alert.alert('Account disabled', 'This account has been disabled by an administrator.');
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
        if (error.code === statusCodes.IN_PROGRESS) return;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Google Play Services', 'Google Play Services is missing or out of date.');
          return;
        }
      }
      console.error('Google Sign-In Error:', error);
      Alert.alert('Sign-in failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.logo}>Pinly</Text>
        <Text style={styles.title}>Sign in to continue</Text>
        <Text style={styles.tagline}>
          Choose a Google account, or add another one to sign in with.
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#E60023', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center' },
  button: {
    backgroundColor: '#E60023',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});