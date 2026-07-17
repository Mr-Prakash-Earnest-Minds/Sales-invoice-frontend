import { API_URL, getAuthToken } from '../../config';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView, TextInput, Alert, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const AnimatedListItem = ({ children, index }: { children: any, index: number }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: Math.min(index * 50, 500),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: Math.min(index * 50, 500),
          useNativeDriver: true,
        })
      ]).start();
    }, [index]);
  
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {children}
      </Animated.View>
    );
  };

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');
  const [ledgerGroup, setLedgerGroup] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${API_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if(data.success) setCustomers(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setIsViewMode(false);
    setName(''); setEmail(''); setPhone(''); setGstNo('');
    setPanNo(''); setAddress1(''); setAddress2(''); setCity('');
    setState(''); setPincode(''); setCountry(''); setLedgerGroup('');
    setModalVisible(true);
  };

  const openEditModal = (item: any, viewOnly = false) => {
    setEditingId(item.id);
    setIsViewMode(viewOnly);
    setName(item.customer_name || item.name || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setGstNo(item.gst_number || '');
    setPanNo(item.pan_number || '');
    setAddress1(item.address1 || item.address || '');
    setAddress2(item.address2 || '');
    setCity(item.city || '');
    setState(item.state || '');
    setPincode(item.pincode || '');
    setCountry(item.country || '');
    setLedgerGroup(item.ledger_group || '');
    setModalVisible(true);
  };

  const handleDelete = (id: any) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/customers/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const data = await res.json();
        if (data.success) {
          fetchCustomers();
        } else {
          Alert.alert('Error', data.message || 'Failed to delete customer. Ensure they have no invoices.');
        }
      } catch (error) {
        Alert.alert('Error', 'Server connection failed');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this customer?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleSave = async () => {
    if (!String(name).trim() || !String(email).trim() || !String(phone).trim() || !String(address1).trim()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please fill all the mandatory fields marked with *');
      } else {
        Alert.alert('Validation Error', 'Please fill all the mandatory fields marked with *');
      }
      return;
    }
    
    const url = editingId 
      ? `${API_URL}/api/customers/${editingId}` 
      : `${API_URL}/api/customers`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ 
          customer_name: name, email, phone, gst_number: gstNo, pan_number: panNo,
          address1, address2, city, state, pincode, country, ledger_group: ledgerGroup 
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `Customer ${editingId ? 'updated' : 'added'} successfully!`);
        setModalVisible(false);
        fetchCustomers();
      } else {
        Alert.alert('Error', data.message || 'Failed to save customer');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item, true)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.customer_name || item.name}</Text>
          <View style={styles.actionButtons}>
            <FontAwesome6 name="pen-to-square" size={18} color="#18181A" style={{ marginRight: 16 }} onPress={() => openEditModal(item, false)} />
            <FontAwesome6 name="trash-can" size={18} color="#ef4444" onPress={() => handleDelete(item.id)} />
          </View>
        </View>
        
        <View style={styles.detailsBlockContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.email || 'No email provided'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.phone || 'No phone provided'}</Text>
          </View>
          
          {item.gst_number ? (
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Ionicons name="document-text-outline" size={16} color="#14B8A6" style={styles.detailIcon} />
              <Text style={styles.gstText}>GST: {item.gst_number}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  const filteredCustomers = customers.filter((c: any) => 
    (c.customer_name || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Customer Directory</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#18181A" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={filteredCustomers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>{searchQuery ? 'No matching customers found.' : 'No customers found.'}</Text>}
        />
      )}

      {/* CREATE/EDIT CUSTOMER MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>
                {isViewMode ? 'View Customer' : (editingId ? 'Edit Customer' : 'Add New Customer')}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.formCard}>
              {isViewMode ? (
                <View style={{ padding: 8 }}>
                  <Text style={styles.label}>Customer Details</Text>
                  <Text style={{ fontSize: 16, color: '#0F172A', marginBottom: 4 }}>{name}</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>{email} • {phone}</Text>
                  {(gstNo || panNo) ? (
                    <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                      {gstNo ? `GST: ${gstNo}` : ''} {panNo ? `PAN: ${panNo}` : ''}
                    </Text>
                  ) : <View style={{ height: 12 }} />}
                  
                  <Text style={styles.label}>Address</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                    {[address1, address2, city, state, pincode, country].filter(Boolean).join(', ')}
                  </Text>
                  
                  {ledgerGroup ? (
                    <>
                      <Text style={styles.label}>Ledger Group</Text>
                      <Text style={{ fontSize: 14, color: '#64748B' }}>{ledgerGroup}</Text>
                    </>
                  ) : null}
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Customer Name *</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="Company or Individual Name" value={name} onChangeText={setName} />

                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="+91 9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

                  <Text style={styles.label}>GST Number</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="e.g. 22AAAAA0000A1Z5" autoCapitalize="characters" value={gstNo} onChangeText={setGstNo} />

                  <Text style={styles.label}>PAN Number</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="e.g. ABCDE1234F" autoCapitalize="characters" value={panNo} onChangeText={setPanNo} />

                  <Text style={styles.label}>Address Line 1 *</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="Street, Building" value={address1} onChangeText={setAddress1} />

                  <Text style={styles.label}>Address Line 2</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="Locality, Area" value={address2} onChangeText={setAddress2} />

                  <Text style={styles.label}>City</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="City" value={city} onChangeText={setCity} />

                  <Text style={styles.label}>State</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="State" value={state} onChangeText={setState} />

                  <Text style={styles.label}>Pincode</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="Pincode" keyboardType="number-pad" value={pincode} onChangeText={setPincode} />

                  <Text style={styles.label}>Country</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="Country" value={country} onChangeText={setCountry} />

                  <Text style={styles.label}>Ledger Group</Text>
                  <TextInput style={styles.input} placeholderTextColor="#94A3B8" placeholder="e.g. Sundry Debtors" value={ledgerGroup} onChangeText={setLedgerGroup} />
                </>
              )}
            </View>

            {!isViewMode && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Customer' : 'Save Customer'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, elevation: 1, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0F172A' },
  addBtn: { position: 'absolute', right: 24, bottom: 96, backgroundColor: '#18181A', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  addBtnText: { display: 'none' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', flex: 1, textTransform: 'capitalize' as any },
  actionButtons: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  detailsBlockContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: '#4b5563' },
  gstText: { fontSize: 14, color: '#14B8A6', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },

  modalContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  formCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, color: '#0F172A', backgroundColor: '#f9fafb' },
  saveBtn: { backgroundColor: '#18181A', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
