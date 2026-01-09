import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image, Modal, Alert, Platform, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type AuditEntry = {
  id: string;
  type: 'evidence' | 'activity' | 'compliance' | 'access';
  title: string;
  description: string;
  timestamp: string;
  date: string;
  location?: { latitude: number; longitude: number; address?: string };
  imageUri?: string;
  metadata: {
    user?: string;
    client?: string;
    category?: string;
    status?: string;
  };
};

type TabType = 'trail' | 'evidence' | 'reports';

export default function AuditVaultScreen() {
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('trail');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1b2026' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#f0f0f0';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    loadAuditData();
    // Log that user accessed audit screen
    logActivity('access', 'Audit Screen Accessed', 'User viewed audit trail dashboard');
  }, []);

  const loadAuditData = async () => {
    const savedAudit = await AsyncStorage.getItem('@audit_trail');
    if (savedAudit) {
      setAuditTrail(JSON.parse(savedAudit));
    } else {
      // Initialize with sample data for demonstration
      initializeSampleData();
    }
  };

  const initializeSampleData = async () => {
    const sampleData: AuditEntry[] = [
      {
        id: Date.now().toString(),
        type: 'compliance',
        title: 'NDIS Registration Verified',
        description: 'Provider registration validated against NDIS Commission database',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-AU'),
        metadata: { status: 'Verified', category: 'Compliance' }
      },
      {
        id: (Date.now() - 3600000).toString(),
        type: 'activity',
        title: 'Service Agreement Created',
        description: 'Service agreement generated for client Sarah Johnson',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        date: new Date(Date.now() - 3600000).toLocaleDateString('en-AU'),
        metadata: { client: 'Sarah Johnson', category: 'Documentation' }
      }
    ];
    setAuditTrail(sampleData);
    await AsyncStorage.setItem('@audit_trail', JSON.stringify(sampleData));
  };

  const logActivity = async (
    type: AuditEntry['type'],
    title: string,
    description: string,
    imageUri?: string
  ) => {
    // Get location if available
    let locationData;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0] ? `${address[0].street}, ${address[0].city}` : undefined
        };
      }
    } catch (error) {
      console.log('Location not available');
    }

    const newEntry: AuditEntry = {
      id: Date.now().toString(),
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-AU'),
      location: locationData,
      imageUri,
      metadata: {
        user: 'Current User',
        category: type === 'evidence' ? 'Field Capture' : 'System Activity'
      }
    };

    const updatedTrail = [newEntry, ...auditTrail];
    setAuditTrail(updatedTrail);
    await AsyncStorage.setItem('@audit_trail', JSON.stringify(updatedTrail));
  };

  const captureEvidence = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "ModiProof needs camera access to capture audit evidence.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled) {
      await logActivity(
        'evidence',
        `Field Evidence Captured`,
        `Photographic evidence captured at job site`,
        result.assets[0].uri
      );
      Alert.alert('Success', 'Evidence captured and logged to audit trail');
    }
  };

  const openEntryDetail = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setIsDetailVisible(true);
  };

  const openAddActivityModal = () => {
    setNewEntryTitle('');
    setNewEntryDescription('');
    setIsAddModalVisible(true);
  };

  const saveManualActivity = async () => {
    if (!newEntryTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    await logActivity('activity', newEntryTitle, newEntryDescription || 'No description provided');
    setIsAddModalVisible(false);
    Alert.alert('Success', 'Activity logged to audit trail');
  };

  const getTypeIcon = (type: AuditEntry['type']) => {
    switch (type) {
      case 'evidence': return 'camera';
      case 'compliance': return 'shield-checkmark';
      case 'activity': return 'list';
      case 'access': return 'log-in';
      default: return 'document';
    }
  };

  const getTypeColor = (type: AuditEntry['type']) => {
    switch (type) {
      case 'evidence': return '#007AFF';
      case 'compliance': return '#34C759';
      case 'activity': return '#FF9500';
      case 'access': return '#AF52DE';
      default: return '#8E8E93';
    }
  };

  const calculateAuditScore = () => {
    const evidenceCount = auditTrail.filter(e => e.type === 'evidence').length;
    const complianceCount = auditTrail.filter(e => e.type === 'compliance').length;
    const totalCount = auditTrail.length;
    
    if (totalCount === 0) return 0;
    const score = Math.min(100, (evidenceCount * 20 + complianceCount * 30 + totalCount * 5));
    return Math.round(score);
  };

  const auditScore = calculateAuditScore();
  const evidenceEntries = auditTrail.filter(e => e.type === 'evidence');
  const complianceEntries = auditTrail.filter(e => e.type === 'compliance');

  const renderAuditEntry = ({ item }: { item: AuditEntry }) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.fileCard, { backgroundColor: surface, borderColor: border }]}
      onPress={() => openEntryDetail(item)}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${getTypeColor(item.type)}15` }]}>
        <Ionicons name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
      </View>
      <View style={styles.fileInfo}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: palette.text }}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.dateText, { color: muted }]} numberOfLines={1}>
          {item.description}
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="time-outline" size={12} color={muted} />
          <ThemedText style={[styles.dateText, { color: muted, marginLeft: 4 }]}>
            {new Date(item.timestamp).toLocaleString('en-AU')}
          </ThemedText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={muted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}> 
        {/* Header */}
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Ionicons name="shield-checkmark" size={28} color="#007AFF" />
            <ThemedText type="title">Audit Readiness</ThemedText>
          </View>
          <ThemedText style={[styles.sub, { color: muted }]}>NDIS Compliance & Evidence Trail</ThemedText>
        </View>

        {/* Audit Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.scoreCircle}>
            <ThemedText style={styles.scoreNumber}>{auditScore}</ThemedText>
            <ThemedText style={[styles.scoreLabel, { color: muted }]}>Score</ThemedText>
          </View>
          <View style={styles.scoreStats}>
            <View style={styles.statRow}>
              <Ionicons name="camera" size={16} color="#007AFF" />
              <ThemedText style={[styles.statText, { color: palette.text }]}>
                {evidenceEntries.length} Evidence Items
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="shield-checkmark" size={16} color="#34C759" />
              <ThemedText style={[styles.statText, { color: palette.text }]}>
                {complianceEntries.length} Compliance Checks
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <Ionicons name="list" size={16} color="#FF9500" />
              <ThemedText style={[styles.statText, { color: palette.text }]}>
                {auditTrail.length} Total Entries
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabBar, { backgroundColor: surface, borderColor: border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'trail' && styles.activeTab]} 
            onPress={() => setActiveTab('trail')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={activeTab === 'trail' ? '#007AFF' : muted} 
            />
            <ThemedText style={[styles.tabText, { color: activeTab === 'trail' ? '#007AFF' : muted }]}>
              Trail
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'evidence' && styles.activeTab]} 
            onPress={() => setActiveTab('evidence')}
          >
            <Ionicons 
              name="camera" 
              size={20} 
              color={activeTab === 'evidence' ? '#007AFF' : muted} 
            />
            <ThemedText style={[styles.tabText, { color: activeTab === 'evidence' ? '#007AFF' : muted }]}>
              Evidence
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]} 
            onPress={() => setActiveTab('reports')}
          >
            <Ionicons 
              name="document-text" 
              size={20} 
              color={activeTab === 'reports' ? '#007AFF' : muted} 
            />
            <ThemedText style={[styles.tabText, { color: activeTab === 'reports' ? '#007AFF' : muted }]}>
              Reports
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={captureEvidence}>
            <Ionicons name="camera" size={20} color="#fff" />
            <ThemedText style={styles.btnText}>Capture Evidence</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: border }]} 
            onPress={openAddActivityModal}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <ThemedText style={[styles.btnText, { color: '#007AFF' }]}>Log Activity</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <FlatList
          data={activeTab === 'trail' ? auditTrail : activeTab === 'evidence' ? evidenceEntries : complianceEntries}
          renderItem={renderAuditEntry}
          keyExtractor={(item) => item.id}
          style={styles.fileList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={50} color="#ccc" />
              <ThemedText style={{color: '#999', marginTop: 10, textAlign: 'center'}}>
                {activeTab === 'trail' ? 'No audit entries yet' : 
                 activeTab === 'evidence' ? 'No evidence captured' : 
                 'No compliance records'}
              </ThemedText>
              <ThemedText style={{color: '#999', fontSize: 12, marginTop: 5}}>
                Start by capturing evidence or logging activities
              </ThemedText>
            </View>
          }
        />

        {/* Detail Modal */}
        <Modal visible={isDetailVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: surface }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">{selectedEntry?.title}</ThemedText>
                <TouchableOpacity onPress={() => setIsDetailVisible(false)}>
                  <Ionicons name="close" size={28} color={palette.text} />
                </TouchableOpacity>
              </View>
              
              {selectedEntry && (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <ThemedText style={[styles.detailLabel, { color: muted }]}>TYPE</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                      <Ionicons 
                        name={getTypeIcon(selectedEntry.type)} 
                        size={18} 
                        color={getTypeColor(selectedEntry.type)} 
                      />
                      <ThemedText style={[styles.detailValue, { color: palette.text, marginLeft: 8 }]}>
                        {selectedEntry.type.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <ThemedText style={[styles.detailLabel, { color: muted }]}>DESCRIPTION</ThemedText>
                    <ThemedText style={[styles.detailValue, { color: palette.text }]}>
                      {selectedEntry.description}
                    </ThemedText>
                  </View>

                  <View style={styles.detailSection}>
                    <ThemedText style={[styles.detailLabel, { color: muted }]}>TIMESTAMP</ThemedText>
                    <ThemedText style={[styles.detailValue, { color: palette.text }]}>
                      {new Date(selectedEntry.timestamp).toLocaleString('en-AU', {
                        dateStyle: 'full',
                        timeStyle: 'long'
                      })}
                    </ThemedText>
                  </View>

                  {selectedEntry.location && (
                    <View style={styles.detailSection}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>LOCATION (GPS)</ThemedText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Ionicons name="location" size={16} color="#34C759" />
                        <ThemedText style={[styles.detailValue, { color: palette.text, marginLeft: 5 }]}>
                          {selectedEntry.location.address || 
                           `${selectedEntry.location.latitude.toFixed(6)}, ${selectedEntry.location.longitude.toFixed(6)}`}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {selectedEntry.imageUri && (
                    <View style={styles.detailSection}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>EVIDENCE PHOTO</ThemedText>
                      <Image 
                        source={{ uri: selectedEntry.imageUri }} 
                        style={styles.detailImage} 
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {selectedEntry.metadata && (
                    <View style={styles.detailSection}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>METADATA</ThemedText>
                      {Object.entries(selectedEntry.metadata).map(([key, value]) => (
                        value && (
                          <View key={key} style={styles.metadataRow}>
                            <ThemedText style={[styles.metadataKey, { color: muted }]}>
                              {key.toUpperCase()}:
                            </ThemedText>
                            <ThemedText style={[styles.metadataValue, { color: palette.text }]}>
                              {value}
                            </ThemedText>
                          </View>
                        )
                      ))}
                    </View>
                  )}

                  <View style={[styles.verifiedBadge, { backgroundColor: colorScheme === 'dark' ? '#102d1a' : '#d4edda' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                    <ThemedText style={[styles.verifiedText, { color: colorScheme === 'dark' ? '#8ae2a2' : '#155724' }]}>
                      ModiProof™ Verified Entry
                    </ThemedText>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Add Activity Modal */}
        <Modal visible={isAddModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: surface }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Log Activity</ThemedText>
                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                  <Ionicons name="close" size={28} color={palette.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, { color: muted }]}>Title *</ThemedText>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: surfaceAlt, 
                      color: palette.text,
                      borderColor: border 
                    }]}
                    placeholder="e.g., Service Delivery Completed"
                    placeholderTextColor={muted}
                    value={newEntryTitle}
                    onChangeText={setNewEntryTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, { color: muted }]}>Description</ThemedText>
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: surfaceAlt, 
                      color: palette.text,
                      borderColor: border 
                    }]}
                    placeholder="Provide details about this activity..."
                    placeholderTextColor={muted}
                    value={newEntryDescription}
                    onChangeText={setNewEntryDescription}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveManualActivity}>
                  <ThemedText style={styles.saveBtnText}>Save to Audit Trail</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Compliance Status Footer */}
        <View style={[styles.guardBox, { 
          backgroundColor: auditScore >= 70 ? (colorScheme === 'dark' ? '#102d1a' : '#d4edda') : (colorScheme === 'dark' ? '#2d1a1a' : '#f8d7da'),
          borderColor: auditScore >= 70 ? (colorScheme === 'dark' ? '#1f4a2f' : '#cce5d2') : (colorScheme === 'dark' ? '#4a1f1f' : '#e5c2c2')
        }]}>
          <Ionicons 
            name={auditScore >= 70 ? "shield-checkmark" : "shield-outline"} 
            size={20} 
            color={auditScore >= 70 ? '#34C759' : '#FF3B30'} 
          />
          <ThemedText style={[styles.guardText, { 
            color: auditScore >= 70 ? (colorScheme === 'dark' ? '#8ae2a2' : '#155724') : (colorScheme === 'dark' ? '#e28a8a' : '#721c24')
          }]}>
            Audit Status: {auditScore >= 70 ? '✓ Audit Ready' : '⚠ Needs Improvement'} ({auditScore}/100)
          </ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 16, marginTop: 8 },
  sub: { fontSize: 13, marginTop: 4 },
  
  // Score Card
  scoreCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  scoreLabel: {
    fontSize: 11,
    marginTop: 2
  },
  scoreStats: {
    flex: 1,
    justifyContent: 'center'
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  statText: {
    marginLeft: 8,
    fontSize: 13
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  activeTab: {
    backgroundColor: '#007AFF15'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600'
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },

  // List Items
  fileList: { flex: 1 },
  emptyState: { 
    alignItems: 'center', 
    marginTop: 60,
    paddingHorizontal: 40 
  },
  fileCard: { 
    flexDirection: 'row', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 10, 
    alignItems: 'center',
    borderWidth: 1
  },
  iconCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fileInfo: { 
    flex: 1, 
    marginLeft: 12 
  },
  dateText: { 
    fontSize: 12, 
    marginTop: 3 
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalBody: {
    padding: 20
  },

  // Detail View
  detailSection: {
    marginBottom: 20
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  detailValue: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8
  },
  metadataRow: {
    flexDirection: 'row',
    marginTop: 6
  },
  metadataKey: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8
  },
  metadataValue: {
    fontSize: 12,
    flex: 1
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 10
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // Footer
  guardBox: { 
    padding: 14, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1
  },
  guardText: { 
    fontSize: 12, 
    fontWeight: '600',
    marginLeft: 10, 
    flex: 1 
  }
});