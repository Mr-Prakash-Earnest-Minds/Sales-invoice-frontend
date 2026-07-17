import { API_URL, getAuthToken } from '../../config';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, SafeAreaView, ScrollView, TextInput, Alert, Platform, Animated } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
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
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState('18');
  const [stock, setStock] = useState('0');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
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
    setIsViewMode(false);
    setName(''); setSku(''); setPrice(''); setGst('18'); setStock('0');
    setHsnCode(''); setUnit('pcs'); setCategory(''); setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (item: any, viewOnly = false) => {
    setEditingId(item.id);
    setIsViewMode(viewOnly);
    setName(item.product_name || '');
    setSku(item.sku || '');
    setPrice(item.price ? item.price.toString() : '');
    setGst(item.gst_rate ? item.gst_rate.toString() : (item.gst_percentage ? item.gst_percentage.toString() : '18'));
    setStock(item.stock_quantity ? item.stock_quantity.toString() : '0');
    setHsnCode(item.hsn_code || '');
    setUnit(item.unit || 'pcs');
    setCategory(item.category || '');
    setDescription(item.description || '');
    setModalVisible(true);
  };

  const handleDelete = (id: string | number) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
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
    if (!String(name).trim() || !String(price).trim()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Product Name and Price are required.');
      } else {
        Alert.alert('Validation Error', 'Product Name and Price are required.');
      }
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
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ 
          product_name: name, sku, price: Number(price), gst_rate: Number(gst), 
          stock_quantity: Number(stock), unit, hsn_code: hsnCode, category, description 
        })
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

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item, true)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.product_name}</Text>
          <View style={styles.actionButtons}>
            <FontAwesome6 name="pen-to-square" size={18} color="#18181A" style={{ marginRight: 16 }} onPress={() => openEditModal(item, false)} />
            <FontAwesome6 name="trash-can" size={18} color="#ef4444" onPress={() => handleDelete(item.id)} />
          </View>
        </View>

        <View style={styles.detailsBlockContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText}>SKU: {item.sku || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText}>Stock: {item.stock_quantity || 0} {item.unit || 'pcs'}</Text>
          </View>

          <View style={[styles.detailRow, { marginBottom: 0, justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cash-outline" size={16} color="#18181A" style={styles.detailIcon} />
              <Text style={styles.priceText}>₹{item.price}</Text>
            </View>
            <Text style={styles.gstBadge}>+ {item.gst_rate || item.gst_percentage || 0}% GST</Text>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  const filteredProducts = products.filter((p: any) => 
    (p.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>Inventory</Text>
          <View style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569' }}>{products.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, SKU or category..."
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
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>{searchQuery ? 'No matching products found.' : 'No products found.'}</Text>}
        />
      )}

      {/* CREATE/EDIT PRODUCT MODAL */}
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
                {isViewMode ? 'View Product' : (editingId ? 'Edit Product' : 'Add New Product')}
              </Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.formCard}>
              {isViewMode ? (
                <View style={{ padding: 8 }}>
                  <Text style={styles.label}>Product Details</Text>
                  <Text style={{ fontSize: 16, color: '#0F172A', marginBottom: 4 }}>{name}</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                    SKU: {sku || 'N/A'} • HSN: {hsnCode || 'N/A'}
                  </Text>
                  
                  <Text style={styles.label}>Pricing & Tax</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                    Price: ₹{price} • GST: {gst}%
                  </Text>

                  <Text style={styles.label}>Inventory</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                    Stock: {stock} {unit}
                  </Text>

                  <Text style={styles.label}>Category</Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 12 }}>
                    {category || 'Uncategorized'}
                  </Text>

                  <Text style={styles.label}>Description</Text>
                  <Text style={{ fontSize: 14, color: '#64748B' }}>
                    {description || 'No description provided.'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Product Name *</Text>
                  <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. Mechanical Keyboard" value={name} onChangeText={setName} />

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.label}>Price (₹) *</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="0.00" keyboardType="numeric" value={price} onChangeText={setPrice} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>GST (%)</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="18" keyboardType="numeric" value={gst} onChangeText={setGst} />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.label}>SKU (Optional)</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="PRD-001" value={sku} onChangeText={setSku} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Initial Stock</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="0" keyboardType="numeric" value={stock} onChangeText={setStock} />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.label}>HSN Code</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. 8471" value={hsnCode} onChangeText={setHsnCode} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Unit</Text>
                      <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="pcs, kg, ltr" value={unit} onChangeText={setUnit} />
                    </View>
                  </View>

                  <Text style={styles.label}>Category</Text>
                  <TextInput placeholderTextColor="#94A3B8" style={styles.input} placeholder="e.g. Electronics" value={category} onChangeText={setCategory} />

                  <Text style={styles.label}>Description</Text>
                  <TextInput placeholderTextColor="#94A3B8" style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Product details..." multiline value={description} onChangeText={setDescription} />
                </>
              )}
            </View>

            {!isViewMode && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Product' : 'Save Product'}</Text>
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
  priceText: { fontSize: 15, fontWeight: 'bold', color: '#18181A' },
  gstBadge: { fontSize: 12, color: '#059669', backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '600', overflow: 'hidden' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },

  modalContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  formCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, elevation: 1 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, color: '#0F172A', backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#18181A', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
