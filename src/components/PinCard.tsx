import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pin, deletePin } from '../services/posts';

interface PinCardProps {
  pin: Pin;
  currentUserId?: string;
  onEdit: (pin: Pin) => void;
}

export const PinCard: React.FC<PinCardProps> = ({ pin, currentUserId, onEdit }) => {
  const isAuthor = pin.authorId === currentUserId;

  const handleDelete = () => {
    Alert.alert(
      "Delete Pin",
      "Are you sure you want to delete this pin?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            if (pin.id) await deletePin(pin.id);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <Image 
          source={{ uri: pin.authorPhotoUrl || 'https://via.placeholder.com/40' }} 
          style={styles.avatar} 
        />
        <Text style={styles.authorName}>{pin.authorName || 'Anonymous'}</Text>
      </View>

      {pin.imageUrl ? (
        <Image source={{ uri: pin.imageUrl }} style={styles.pinImage} resizeMode="cover" />
      ) : null}

      <Text style={styles.caption}>{pin.text}</Text>

      {isAuthor && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(pin)}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 14,
  },
  pinImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginVertical: 6,
  },
  caption: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});