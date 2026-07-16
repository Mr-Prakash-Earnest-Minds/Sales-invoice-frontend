import { API_URL } from '../../config';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ReportsScreen() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Paid, Pending
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // View Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [])
  );

  const fetchInvoices = () => {
    setLoading(true);
    fetch(`${API_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvoices(data.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (invoice.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus !== 'All') {
      matchesStatus = (invoice.payment_status || 'Pending') === filterStatus;
    }
    
    let matchesDate = true;
    const invDate = new Date(invoice.invoice_date);
    if (startDate) {
      const sDate = new Date(startDate);
      if (!isNaN(sDate.getTime()) && invDate < sDate) matchesDate = false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      if (!isNaN(eDate.getTime()) && invDate > eDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalFilteredRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);

  const exportPDF = async (item) => {
    try {
      const res = await fetch(`${API_URL}/api/invoices/${item.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        const fullInvoice = data.data;
        const html = `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
              <div style="border-bottom: 2px solid #0a4be5; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #0a4be5; margin: 0;">INVOICE</h1>
                <p style="margin: 5px 0 0; color: #666;"># ${fullInvoice.invoice_number}</p>
                <p style="margin: 5px 0 0; color: #666;">Date: ${new Date(fullInvoice.invoice_date).toLocaleDateString()}</p>
              </div>
              
              <div style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 5px; color: #111;">Billed To:</h3>
                <p style="margin: 0; font-size: 16px;"><strong>${fullInvoice.customer_name || 'Walk-in Customer'}</strong></p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #f3f4f6; text-align: left;">
                    <th style="padding: 12px; border-bottom: 1px solid #ddd;">Description</th>
                    <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Qty</th>
                    <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Price</th>
                    <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">GST</th>
                  </tr>
                </thead>
                <tbody>
                  ${fullInvoice.items.map(i => `
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #eee;">${i.productName}</td>
                      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${i.qty}</td>
                      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹ ${Number(i.price).toFixed(2)}</td>
                      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${i.gst}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="width: 50%; float: right;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Subtotal:</span>
                  <span>₹ ${Number(fullInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Total GST:</span>
                  <span>₹ ${Number(fullInvoice.total_gst).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #eee; margin-bottom: 10px;">
                  <strong style="font-size: 18px;">Grand Total:</strong>
                  <strong style="font-size: 18px; color: #0a4be5;">₹ ${Number(fullInvoice.grand_total).toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #059669;">Amount Paid:</span>
                  <span style="color: #059669;">₹ ${Number(fullInvoice.amount_paid).toFixed(2)}</span>
                </div>
                ${Number(fullInvoice.balance_due) > 0 ? `
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #eee; margin-bottom: 10px;">
                  <strong style="color: #dc2626;">Balance Due:</strong>
                  <strong style="color: #dc2626;">₹ ${Number(fullInvoice.balance_due).toFixed(2)}</strong>
                </div>
                ` : `
                <div style="text-align: right; color: #16a34a; font-weight: bold; margin-top: 10px;">PAYMENT COMPLETE</div>
                `}
              </div>
              <div style="clear: both;"></div>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      } else {
        Alert.alert('Error', 'Could not load invoice details for PDF.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const exportFilteredCSV = async () => {
    if (filteredInvoices.length === 0) {
      Alert.alert('Notice', 'No invoices match the current filter to export.');
      return;
    }
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Subtotal', 'Tax', 'Grand Total', 'Amount Paid', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      new Date(inv.invoice_date).toLocaleDateString(),
      inv.customer_name || 'Walk-in',
      inv.subtotal,
      inv.total_gst,
      inv.grand_total,
      inv.amount_paid,
      inv.balance_due,
      inv.payment_status || 'Pending'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales_Report_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      try {
        const fileUri = `${FileSystem.documentDirectory}Sales_Report.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to generate CSV.');
      }
    }
  };

  const handleViewInvoice = async (item) => {
    try {
      const res = await fetch(`${API_URL}/api/invoices/${item.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedInvoice(data.data);
        setModalVisible(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleViewInvoice(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
        <Text style={styles.date}>{new Date(item.invoice_date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.customerName}>{item.customer_name || 'Walk-in Customer'}</Text>
          <Text style={[styles.statusBadge, item.payment_status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
            {item.payment_status || 'Pending'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>₹{Number(item.grand_total).toFixed(2)}</Text>
          {(Number(item.balance_due) > 0) && (
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#dc2626', marginBottom: 2 }}>Balance: ₹{Number(item.balance_due).toFixed(2)}</Text>
          )}
          <Text style={styles.tax}>GST: ₹{Number(item.total_gst).toFixed(2)}</Text>
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 12, paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={styles.exportBtn} onPress={() => exportPDF(item)}>
          <Ionicons name="download-outline" size={16} color="#0a4be5" style={{ marginRight: 4 }} />
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice Reports</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Revenue (Filtered)</Text>
          <Text style={styles.summaryAmount}>₹ {totalFilteredRevenue.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer or invoice #"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>
        <View style={styles.filterTabs}>
          {['All', 'Paid', 'Pending'].map(status => (
            <TouchableOpacity 
              key={status} 
              style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.exportCsvBtn} onPress={exportFilteredCSV}>
          <Ionicons name="document-text-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.exportCsvBtnText}>Export Filtered to CSV</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0a4be5" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No invoices found matching criteria.</Text>}
        />
      )}

      {/* View Modal */}
      {selectedInvoice && (
        <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Invoice Details</Text>
              <TouchableOpacity onPress={() => exportPDF(selectedInvoice)}>
                <Ionicons name="download-outline" size={24} color="#0a4be5" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={styles.formCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>Invoice No</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedInvoice.invoice_number}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>Date</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 }}>
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>Billed To</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 4 }}>{selectedInvoice.customer_name || 'Walk-in Customer'}</Text>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Items</Text>
                {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <View style={{ flex: 2 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500' }}>{item.productName}</Text>
                      <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Qty: {item.qty} × ₹{Number(item.price).toFixed(2)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 15, fontWeight: 'bold' }}>₹{(Number(item.qty) * Number(item.price)).toFixed(2)}</Text>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>GST: {item.gst}%</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.formCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryAmountText}>₹ {Number(selectedInvoice.subtotal).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total GST</Text>
                  <Text style={styles.summaryAmountText}>₹ {Number(selectedInvoice.total_gst).toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 12 }]}>
                  <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#111827' }]}>Grand Total</Text>
                  <Text style={[styles.summaryAmountText, { fontWeight: 'bold', color: '#0a4be5', fontSize: 18 }]}>₹ {Number(selectedInvoice.grand_total).toFixed(2)}</Text>
                </View>
                
                <View style={{ backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginTop: 16 }}>
                  <View style={styles.summaryRow}>
                    <Text style={{ fontWeight: '600', color: '#059669' }}>Amount Paid</Text>
                    <Text style={{ fontWeight: 'bold', color: '#059669' }}>₹ {Number(selectedInvoice.amount_paid).toFixed(2)}</Text>
                  </View>
                  {Number(selectedInvoice.balance_due) > 0 ? (
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                      <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>Balance Due</Text>
                      <Text style={{ fontWeight: 'bold', color: '#dc2626', fontSize: 16 }}>₹ {Number(selectedInvoice.balance_due).toFixed(2)}</Text>
                    </View>
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold', marginTop: 12 }}>PAYMENT COMPLETE</Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  summaryBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#0a4be5' },
  summaryLabel: { fontSize: 13, color: '#3b82f6', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: 'bold', color: '#1d4ed8' },
  
  filterSection: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  // @ts-ignore - outlineStyle is a web-only property
  searchInput: { flex: 1, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  
  dateInputContainer: { flex: 1 },
  dateInputLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' },
  // @ts-ignore
  dateInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, outlineStyle: 'none' },

  filterTabs: { flexDirection: 'row', gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterTabActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTabTextActive: { color: '#2563eb' },
  
  exportCsvBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  exportCsvBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
  invoiceNumber: { fontSize: 14, fontWeight: 'bold', color: '#6b7280' },
  date: { fontSize: 13, color: '#9ca3af' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusPaid: { backgroundColor: '#dcfce7', color: '#16a34a' },
  statusPending: { backgroundColor: '#fef3c7', color: '#d97706' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#0a4be5', marginBottom: 4 },
  tax: { fontSize: 12, color: '#6b7280' },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  exportBtnText: { fontSize: 12, fontWeight: 'bold', color: '#0a4be5' },

  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 32, fontSize: 15 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryAmountText: { fontSize: 15, fontWeight: '600', color: '#374151' }
});
