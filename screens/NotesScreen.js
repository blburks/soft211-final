import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = 'field_notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Load persisted notes on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(NOTES_KEY);
      if (saved) setNotes(JSON.parse(saved));
    })();
  }, []);

  async function persistNotes(updated) {
    setNotes(updated);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  }

  async function addNote() {
    if (!input.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: input.trim(),
      createdAt: new Date().toLocaleString(),
      synced: false,
    };
    await persistNotes([newNote, ...notes]);
    setInput('');
  }

  async function syncNotes() {
    const pending = notes.filter((n) => !n.synced);
    if (pending.length === 0) {
      Alert.alert('All synced', 'No pending notes to sync.');
      return;
    }

    setSyncing(true);
    try {
      // Simulate network sync — replace with real API call if available
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const updated = notes.map((n) => ({ ...n, synced: true }));
      await persistNotes(updated);
      Alert.alert('Sync Complete', `${pending.length} note(s) synced successfully.`);
    } catch {
      Alert.alert('Sync Failed', 'Could not sync. Tap "Sync Now" to retry.');
    } finally {
      setSyncing(false);
    }
  }

  async function deleteNote(id) {
    const updated = notes.filter((n) => n.id !== id);
    await persistNotes(updated);
  }

  const pendingCount = notes.filter((n) => !n.synced).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Field Notes</Text>

      {/* Sync bar */}
      <View style={styles.syncBar}>
        <Text style={styles.syncStatus}>
          {pendingCount > 0 ? `${pendingCount} note(s) pending sync` : 'All notes synced ✓'}
        </Text>
        <TouchableOpacity
          style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
          onPress={syncNotes}
          disabled={syncing}
        >
          <Text style={styles.syncBtnText}>{syncing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a field note..."
          value={input}
          onChangeText={setInput}
          multiline
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addNote}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Notes list */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTime}>{item.createdAt}</Text>
              <View style={[styles.badge, item.synced ? styles.badgeSynced : styles.badgePending]}>
                <Text style={styles.badgeText}>{item.synced ? 'Synced' : 'Pending'}</Text>
              </View>
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No notes yet. Add one above.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A237E', marginBottom: 14, textAlign: 'center' },
  syncBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 14, elevation: 2 },
  syncStatus: { fontSize: 13, color: '#555', flex: 1 },
  syncBtn: { backgroundColor: '#4A90E2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  syncBtnDisabled: { backgroundColor: '#A0C4F1' },
  syncBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', elevation: 2, maxHeight: 100 },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  noteCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTime: { fontSize: 11, color: '#aaa' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeSynced: { backgroundColor: '#E8F5E9' },
  badgePending: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#555' },
  noteText: { fontSize: 14, color: '#333', marginBottom: 8 },
  deleteBtn: { fontSize: 12, color: '#F44336' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 30 },
});
