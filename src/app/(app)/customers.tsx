import { API_URL } from '../../config';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, SafeAreaView, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState(null);
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
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
    setName(''); setEmail(''); setPhone(''); setGstNo('');
    setPanNo(''); setAddress1(''); setAddress2(''); setCity('');
    setState(''); setPincode(''); setCountry(''); setLedgerGroup('');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.customer_name || item.name}</Text>
        <Text style={styles.subText}>{item.email} • {item.phone}</Text>
        {item.gst_number ? <Text style={styles.gstText}>GST: {item.gst_number}</Text> : null}
      </View>
      <View style={styles.actionButtons}>
        <Ionicons name="pencil" size={20} color="#0052CC" style={{ marginRight: 16 }} onPress={() => openEditModal(item)} />
        <Ionicons name="trash" size={20} color="#ef4444" onPress={() => handleDelete(item.id)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Customer Directory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0052CC" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
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
              <Text style={styles.modalHeaderTitle}>{editingId ? 'Edit Customer' : 'Add New Customer'}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="Company or Individual Name" value={name} onChangeText={setName} />

              <Text style={styles.label}>Email Address *</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="+91 9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

              <Text style={styles.label}>GST Number</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. 22AAAAA0000A1Z5" autoCapitalize="characters" value={gstNo} onChangeText={setGstNo} />

              <Text style={styles.label}>PAN Number</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. ABCDE1234F" autoCapitalize="characters" value={panNo} onChangeText={setPanNo} />

              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="Street, Building" value={address1} onChangeText={setAddress1} />

              <Text style={styles.label}>Address Line 2</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="Locality, Area" value={address2} onChangeText={setAddress2} />

              <Text style={styles.label}>City</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="City" value={city} onChangeText={setCity} />

              <Text style={styles.label}>State</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="State" value={state} onChangeText={setState} />

              <Text style={styles.label}>Pincode</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="Pincode" keyboardType="number-pad" value={pincode} onChangeText={setPincode} />

              <Text style={styles.label}>Country</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />

              <Text style={styles.label}>Ledger Group</Text>
              <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. Sundry Debtors" value={ledgerGroup} onChangeText={setLedgerGroup} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editingId ? 'Update Customer' : 'Save Customer'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  addBtn: { flexDirection: 'row', backgroundColor: '#0052CC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  subText: { fontSize: 13, color: '#64748B', marginTop: 4 },
  gstText: { fontSize: 12, color: '#14B8A6', fontWeight: '600', marginTop: 4 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },

  modalContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  formCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, color: '#0F172A', backgroundColor: '#f9fafb' },
  saveBtn: { backgroundColor: '#0052CC', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
