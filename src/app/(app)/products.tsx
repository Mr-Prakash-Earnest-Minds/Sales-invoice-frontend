import { API_URL } from '../../config';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, SafeAreaView, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState('18');
  const [stock, setStock] = useState('0');

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if(data.success) setProducts(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName(''); setSku(''); setPrice(''); setGst('18'); setStock('0');
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setName(item.product_name || '');
    setSku(item.sku || '');
    setPrice(item.price ? item.price.toString() : '');
    setGst(item.gst_percentage ? item.gst_percentage.toString() : '18');
    setStock(item.stock_quantity ? item.stock_quantity.toString() : '0');
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
          fetchProducts();
        } else {
          Alert.alert('Error', data.message || 'Failed to delete product. It might be used in existing invoices.');
        }
      } catch (error) {
        Alert.alert('Error', 'Server connection failed');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this product?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'Product Name and Price are required');
      return;
    }
    
    const url = editingId 
      ? `${API_URL}/api/products/${editingId}` 
      : `${API_URL}/api/products`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ product_name: name, sku, price: Number(price), gst_percentage: Number(gst), stock_quantity: Number(stock), unit: 'pcs' })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `Product ${editingId ? 'updated' : 'added'} successfully!`);
        setModalVisible(false);
        fetchProducts();
      } else {
        Alert.alert('Error', data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.product_name}</Text>
        <Text style={styles.subText}>SKU: {item.sku}</Text>
        <Text style={styles.stockText}>Stock: {item.stock_quantity || 0} {item.unit || 'pcs'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginRight: 16 }}>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.gstText}>+ {item.gst_percentage}% GST</Text>
      </View>
      <View style={styles.actionButtons}>
        <Ionicons name="pencil" size={20} color="#0a4be5" style={{ marginBottom: 12 }} onPress={() => openEditModal(item)} />
        <Ionicons name="trash" size={20} color="#ef4444" onPress={() => handleDelete(item.id)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0a4be5" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}

      {/* CREATE/EDIT PRODUCT MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Mechanical Keyboard" value={name} onChangeText={setName} />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>GST (%)</Text>
                  <TextInput style={styles.input} placeholder="18" keyboardType="numeric" value={gst} onChangeText={setGst} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>SKU (Optional)</Text>
                  <TextInput style={styles.input} placeholder="PRD-001" value={sku} onChangeText={setSku} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Initial Stock</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={stock} onChangeText={setStock} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editingId ? 'Update Product' : 'Save Product'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  addBtn: { flexDirection: 'row', backgroundColor: '#0a4be5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  subText: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  stockText: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
  gstText: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actionButtons: { alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#f3f4f6', paddingLeft: 16 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },

  modalContainer: { flex: 1, backgroundColor: '#f3f4f6' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  formCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#0a4be5', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
