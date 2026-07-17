import { API_URL, getAuthToken } from '../../config';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert, FlatList, ActivityIndicator, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function InvoicesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [customerSearchFocused, setCustomerSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [discount, setDiscount] = useState('0');
  const [amountPaid, setAmountPaid] = useState('');
  const [previouslyPaid, setPreviouslyPaid] = useState(0);
  const [items, setItems] = useState([
    { id: '1', productName: '', qty: '1', price: '', gst: '0' }
  ]);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
      fetchProducts();
      fetchCustomers();
    }, [])
  );

  const fetchInvoices = () => {
    setLoading(true);
    fetch(`${API_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if(data.success) setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchProducts = () => {
    fetch(`${API_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAvailableProducts(data.data || []);
      })
      .catch(err => console.error(err));
  };

  const fetchCustomers = () => {
    fetch(`${API_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAvailableCustomers(data.data || []);
      })
      .catch(err => console.error(err));
  };

  const sortMatches = (list: any[], query: string, key: string) => {
    if (!query) return [];
    const q = query.toLowerCase();
    
    const getValue = (item: any) => {
      let val = item[key];
      if (!val && key === 'name') val = item.customer_name;
      return String(val || '').toLowerCase();
    };

    return list.filter(item => getValue(item).includes(q))
      .sort((a, b) => {
        const aStarts = getValue(a).startsWith(q);
        const bStarts = getValue(b).startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setIsViewMode(false);
    setCustomerName('');
    setCustomerState('');
    setPaymentMethod('Cash');
    setRemarks('');
    setDiscount('0');
    setAmountPaid('');
    setPreviouslyPaid(0);
    setItems([{ id: '1', productName: '', qty: '1', price: '', gst: '0' }]);
    setActiveSearchId(null);
    setCustomerSearchFocused(false);
    setModalVisible(true);
  };

  const openEditModal = async (id: string | number, viewOnly = false) => {
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(id);
        setIsViewMode(viewOnly);
        setCustomerName(data.data.customer_name || '');
        if (Number(data.data.igst) > 0) {
          setCustomerState('Other');
        } else {
          setCustomerState('Tamil Nadu');
        }
        setPaymentMethod(data.data.payment_method || 'Cash');
        setRemarks(data.data.remarks || '');
        
        const savedSubtotal = Number(data.data.subtotal) || 0;
        const savedTax = Number(data.data.total_gst) || 0;
        const savedGrandTotal = Number(data.data.grand_total) || 0;
        const calculatedDiscount = (savedSubtotal + savedTax) - savedGrandTotal;
        setDiscount(calculatedDiscount > 0 ? calculatedDiscount.toFixed(2).toString() : '0');
        
        const savedAmountPaid = Number(data.data.amount_paid) || 0;
        setPreviouslyPaid(savedAmountPaid);
        setAmountPaid('');

        setItems(data.data.items.length > 0 ? data.data.items : [{ id: '1', productName: '', qty: '1', price: '', gst: '0' }]);
        setActiveSearchId(null);
        setCustomerSearchFocused(false);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch invoice details');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const handleDelete = async (id: string | number) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invoices/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const data = await res.json();
        if (data.success) {
          fetchInvoices();
        } else {
          Alert.alert('Error', data.message || 'Failed to delete invoice');
        }
      } catch (error) {
        Alert.alert('Error', 'Server connection failed');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this invoice?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), productName: '', qty: '1', price: '', gst: '0' }]);
  };

  const handleRemoveItem = (idToRemove: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const handleItemChange = (id: string, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (field === 'productName') {
      setActiveSearchId(id);
    }
  };

  const selectProduct = (itemId: string, product: any) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, productName: product.product_name, price: product.price.toString(), gst: (product.gst_rate || product.gst_percentage || 0).toString() } 
        : item
    ));
    setActiveSearchId(null);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price) || 0), 0);
  
  const gstBreakdown: { [key: number]: number } = {};
  items.forEach(item => {
    const itemTotal = (Number(item.qty) * Number(item.price)) || 0;
    const gstRate = Number(item.gst) || 0;
    const itemTax = itemTotal * (gstRate / 100);
    if (gstRate > 0) {
      gstBreakdown[gstRate] = (gstBreakdown[gstRate] || 0) + itemTax;
    }
  });

  const tax = Object.values(gstBreakdown).reduce((sum: number, val: number) => sum + val, 0);
  
  const companyState = 'Tamil Nadu'; 
  const isInterState = customerState && customerState.trim().toLowerCase() !== companyState.toLowerCase();

  const cgst = isInterState ? 0 : tax / 2;
  const sgst = isInterState ? 0 : tax / 2;
  const igst = isInterState ? tax : 0;

  const discountVal = Number(discount) || 0;
  const unroundedTotal = subtotal - discountVal + tax;
  const grandTotal = Math.round(unroundedTotal);
  const roundOff = grandTotal - unroundedTotal;
  const handleSave = async () => {
    if (!String(customerName).trim()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please select or enter a Customer Name.');
      } else {
        Alert.alert('Validation Error', 'Please select or enter a Customer Name.');
      }
      return;
    }

    const isValidItems = items.every(item => String(item.productName).trim() !== '' && String(item.qty).trim() !== '' && String(item.price).trim() !== '');
    if (!isValidItems || items.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please fill the Product Name, Qty, and Price for every item.');
      } else {
        Alert.alert('Validation Error', 'Please fill the Product Name, Qty, and Price for every item.');
      }
      return;
    }
    
    const url = editingId 
      ? `${API_URL}/api/invoices/${editingId}` 
      : `${API_URL}/api/invoices`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify((() => {
          const totalPaid = previouslyPaid + (Number(amountPaid) || 0);
          const balanceDue = grandTotal - totalPaid;
          const paymentStatus = balanceDue <= 0 ? 'Paid' : 'Pending';
          return {
            customer_name: customerName,
            subtotal,
            cgst,
            sgst,
            igst,
            discount: discountVal,
            round_off: roundOff,
            tax,
            grand_total: grandTotal,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            remarks: remarks,
            amount_paid: totalPaid,
            balance_due: balanceDue <= 0 ? 0 : balanceDue,
            items: items.filter(i => i.productName && Number(i.qty) > 0)
          };
        })())
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', `Invoice ${editingId ? 'updated' : 'created'} successfully!`);
        setModalVisible(false);
        fetchInvoices(); 
      } else {
        Alert.alert('Error', data.message || 'Failed to save invoice');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const date = new Date(item.invoice_date).toLocaleDateString();
    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity style={styles.card} onPress={() => openEditModal(item.id, true)} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name}>{item.invoice_number}</Text>
              <Text style={[styles.statusBadge, item.payment_status === 'Paid' ? styles.statusPaid : styles.statusPending, { marginLeft: 8 }]}>
                {item.payment_status || 'Pending'}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <FontAwesome6 name="pen-to-square" size={18} color="#18181A" style={{ marginRight: 16 }} onPress={() => openEditModal(item.id, false)} />
              <FontAwesome6 name="trash-can" size={18} color="#ef4444" onPress={() => handleDelete(item.id)} />
            </View>
          </View>

          <View style={styles.detailsBlockContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#64748B" style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.customer_name || 'Walk-in Customer'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.detailIcon} />
              <Text style={styles.detailText}>{date}</Text>
            </View>

            <View style={[styles.detailRow, { marginBottom: 0, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
              <Text style={styles.amountText}>Total: ₹{Number(item.grand_total).toFixed(2)}</Text>
              {(Number(item.balance_due) > 0) ? (
                <Text style={styles.balanceText}>Balance: ₹{Number(item.balance_due).toFixed(2)}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  const filteredInvoices = invoices.filter((inv: any) => 
    (inv.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.payment_status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>All Invoices</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice #, customer, or status..."
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
      ) : invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No invoices generated yet.</Text>
          <Text style={styles.emptySubText}>Click 'Create' to make your first sales invoice.</Text>
        </View>
      ) : (
        <FlatList 
          data={filteredInvoices}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={[styles.emptyText, {textAlign: 'center', marginTop: 40}]}>No matching invoices found.</Text>}
        />
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
          <ScrollView style={styles.modalContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>{isViewMode ? 'View Invoice' : (editingId ? 'Edit Invoice' : 'New Invoice')}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.label}>Customer Name</Text>
                <TextInput placeholderTextColor="#94A3B8" 
                  style={[styles.input, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} 
                  placeholder="Start typing customer name..." 
                  value={customerName} 
                  onChangeText={setCustomerName}
                  onFocus={() => { if(!isViewMode) setCustomerSearchFocused(true); }}
                  editable={!isViewMode}
                />
                {/* Customer Autocomplete Dropdown */}
                {(!isViewMode && customerSearchFocused) && (customerName ? sortMatches(availableCustomers, customerName, 'name') : availableCustomers).length > 0 && (
                  <View style={styles.dropdown}>
                    {(customerName ? sortMatches(availableCustomers, customerName, 'name') : availableCustomers).slice(0, 5).map(cust => (
                      <TouchableOpacity key={cust.id} style={styles.dropdownItem} onPress={() => {
                        setCustomerName(cust.customer_name || cust.name);
                        setCustomerState(cust.state || '');
                        setCustomerSearchFocused(false);
                      }}>
                        <Text style={styles.dropdownItemText}>{cust.customer_name || cust.name}</Text>
                        <Text style={styles.dropdownItemSubtitle}>{cust.phone || cust.email || ''}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Invoice Items</Text>
              {items.map((item, index) => {
                const otherSelectedProductNames = items
                  .filter(i => i.id !== item.id && (i.productName || '').trim() !== '')
                  .map(i => (i.productName || '').trim().toLowerCase());

                const filteredProducts = availableProducts.filter(p => 
                  !otherSelectedProductNames.includes(String(p.product_name || '').trim().toLowerCase())
                );

                const searchResults = activeSearchId === item.id
                  ? (item.productName ? sortMatches(filteredProducts, item.productName, 'product_name') : filteredProducts)
                  : [];

                return (
                  <View key={item.id} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemNumber}>Item {index + 1}</Text>
                      {(!isViewMode && items.length > 1) && (
                        <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.label}>Product</Text>
                      <TextInput placeholderTextColor="#94A3B8" 
                        style={[styles.input, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} 
                        placeholder="Start typing product name..." 
                        value={item.productName} 
                        onChangeText={(val) => handleItemChange(item.id, 'productName', val)}
                        onFocus={() => { if(!isViewMode) setActiveSearchId(item.id); }}
                        editable={!isViewMode}
                      />
                      {/* Autocomplete Dropdown */}
                      {(!isViewMode && searchResults.length > 0) && (
                        <View style={styles.dropdown}>
                          {searchResults.slice(0, 5).map(prod => (
                            <TouchableOpacity key={prod.id} style={styles.dropdownItem} onPress={() => selectProduct(item.id, prod)}>
                              <Text style={styles.dropdownItemText}>{prod.product_name}</Text>
                              <Text style={styles.dropdownItemPrice}>₹{prod.price}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>Qty</Text>
                        <TextInput placeholderTextColor="#94A3B8" 
                          style={[styles.input, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} placeholder="1" keyboardType="numeric" 
                          value={item.qty} onChangeText={(val) => handleItemChange(item.id, 'qty', val)} 
                          editable={!isViewMode}
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>Price (₹)</Text>
                        <TextInput placeholderTextColor="#94A3B8" 
                          style={[styles.input, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} placeholder="0.00" keyboardType="numeric" 
                          value={item.price} onChangeText={(val) => handleItemChange(item.id, 'price', val)} 
                          editable={!isViewMode}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>GST (%)</Text>
                        <TextInput placeholderTextColor="#94A3B8" 
                          style={[styles.input, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} placeholder="0" keyboardType="numeric" 
                          value={item.gst} onChangeText={(val) => handleItemChange(item.id, 'gst', val)} 
                          editable={!isViewMode}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {!isViewMode && (
                <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#18181A" />
                  <Text style={styles.addItemText}>Add Another Item</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹ {subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <TextInput placeholderTextColor="#94A3B8" 
                  style={[styles.input, { width: 100, height: 35, padding: 4, textAlign: 'right', backgroundColor: '#fff' }, isViewMode && { backgroundColor: '#F1F5F9', color: '#64748B' }]} 
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                  editable={!isViewMode}
                />
              </View>

              {Object.keys(gstBreakdown).length > 0 && (
                <View style={{ marginTop: 12, marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 4 }}>GST Breakdown</Text>
                  <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', borderStyle: 'dashed', marginBottom: 6 }} />
                  {Object.entries(gstBreakdown).map(([rate, amount]) => (
                    <View key={rate} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{rate}% GST</Text>
                      <Text style={styles.summaryValue}>₹ {Number(amount).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', borderStyle: 'dashed', marginTop: 2, marginBottom: 8 }} />
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: '600' }]}>Total GST</Text>
                <Text style={[styles.summaryValue, { fontWeight: '600' }]}>₹ {tax.toFixed(2)}</Text>
              </View>

              {tax > 0 && (
                <View style={{ marginBottom: 8 }}>
                  {!isInterState ? (
                    <>
                      <View style={[styles.summaryRow, { marginTop: 4 }]}>
                        <Text style={[styles.summaryLabel, { fontSize: 12, color: '#64748B' }]}>  ↳ CGST</Text>
                        <Text style={[styles.summaryValue, { fontSize: 12, color: '#64748B' }]}>₹ {cgst.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.summaryRow, { marginTop: 2 }]}>
                        <Text style={[styles.summaryLabel, { fontSize: 12, color: '#64748B' }]}>  ↳ SGST</Text>
                        <Text style={[styles.summaryValue, { fontSize: 12, color: '#64748B' }]}>₹ {sgst.toFixed(2)}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.summaryRow, { marginTop: 4 }]}>
                      <Text style={[styles.summaryLabel, { fontSize: 12, color: '#64748B' }]}>  ↳ IGST</Text>
                      <Text style={[styles.summaryValue, { fontSize: 12, color: '#64748B' }]}>₹ {igst.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 8 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#0F172A' }]}>Round Off</Text>
                <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#64748B' }]}>
                  {roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#0F172A' }]}>Grand Total</Text>
                <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#18181A', fontSize: 18 }]}>
                  ₹ {grandTotal.toFixed(2)}
                </Text>
              </View>

              <View style={{ marginTop: 16, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 }}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', marginBottom: 6 }]}>Payment Details</Text>
                
                {previouslyPaid > 0 && (
                  <View style={[styles.summaryRow, { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }]}>
                    <Text style={[styles.summaryLabel, { color: '#14B8A6' }]}>Previously Paid</Text>
                    <Text style={[styles.summaryValue, { color: '#14B8A6' }]}>₹ {previouslyPaid.toFixed(2)}</Text>
                  </View>
                )}
                
                {/* Only show Add Payment if not fully paid yet */}
                {(previouslyPaid < grandTotal || grandTotal === 0) && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontWeight: '600' }]}>{previouslyPaid > 0 ? 'Add New Payment' : 'Amount Paid'}</Text>
                    <TextInput placeholderTextColor="#94A3B8" 
                      style={[styles.input, { width: 120, height: 40, padding: 8, textAlign: 'right', backgroundColor: '#fff', fontSize: 16 }]} 
                      keyboardType="numeric"
                      placeholder="0.00"
                      value={amountPaid}
                      onChangeText={setAmountPaid}
                    />
                  </View>
                )}

                <View style={[styles.summaryRow, { marginTop: 12 }]}>
                  {(() => {
                    const totalPaid = previouslyPaid + (Number(amountPaid) || 0);
                    const balance = grandTotal - totalPaid;
                    // Only show Payment Complete if it's an existing invoice that's fully paid
                    if (editingId && previouslyPaid >= grandTotal && grandTotal > 0) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 8, backgroundColor: '#dcfce7', borderRadius: 6 }}>
                          <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginRight: 6 }} />
                          <Text style={{ fontWeight: 'bold', color: '#16a34a', fontSize: 16 }}>Payment Complete</Text>
                        </View>
                      );
                    } else if (grandTotal > 0) {
                      return (
                        <>
                          <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#dc2626' }]}>Balance Due</Text>
                          <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#dc2626', fontSize: 16 }]}>
                            ₹ {balance > 0 ? balance.toFixed(2) : '0.00'}
                          </Text>
                        </>
                      );
                    }
                    return null;
                  })()}
                </View>
              </View>
            </View>
            {isViewMode ? (
              // Only show Update Payment button if it's not fully paid
              (previouslyPaid < grandTotal) ? (
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#16a34a', marginTop: 8 }]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Update Payment Only</Text>
                </TouchableOpacity>
              ) : null
            ) : (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Invoice' : 'Save Invoice'}</Text>
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
  name: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', textTransform: 'capitalize' as any },
  actionButtons: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  detailsBlockContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: '#4b5563' },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  balanceText: { fontSize: 14, fontWeight: 'bold', color: '#dc2626' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: '600', overflow: 'hidden', textAlign: 'center' },
  statusPaid: { backgroundColor: '#dcfce7', color: '#166534' },
  statusPending: { backgroundColor: '#fef3c7', color: '#92400e' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#4b5563', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#94A3B8', marginTop: 8 },

  modalContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  formCard: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15, color: '#0F172A', backgroundColor: '#f9fafb' },
  
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginTop: 4, elevation: 3, zIndex: 10 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 15, color: '#0F172A' },
  dropdownItemPrice: { fontSize: 14, color: '#14B8A6', fontWeight: 'bold' },
  dropdownItemSubtitle: { fontSize: 12, color: '#64748B' },
  
  itemContainer: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemNumber: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
  row: { flexDirection: 'row' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#18181A', borderStyle: 'dashed', borderRadius: 8, marginTop: 8 },
  addItemText: { color: '#18181A', fontWeight: '600', marginLeft: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#4b5563', fontSize: 14 },
  summaryValue: { color: '#0F172A', fontSize: 14, fontWeight: '500' },
  saveBtn: { backgroundColor: '#18181A', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
