import { API_URL } from '../../config';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalPending: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [])
  );

  const fetchDashboardStats = () => {
    setLoading(true);
    fetch(`${API_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC'}}>
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  // Calculate initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'WA';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Total Revenue */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 74, 198, 0.1)' }]}>
              <Ionicons name="cash-outline" size={20} color="#004ac6" />
            </View>
          </View>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>₹{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>

        {/* Total Invoices (Replaced Paid) */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 110, 47, 0.1)' }]}>
              <Ionicons name="document-text-outline" size={20} color="#006e2f" />
            </View>
          </View>
          <Text style={styles.statLabel}>Total Invoices</Text>
          <Text style={styles.statValue}>{stats.totalInvoices}</Text>
        </View>

        {/* Pending */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(120, 75, 0, 0.1)' }]}>
              <Ionicons name="time-outline" size={20} color="#784b00" />
            </View>
          </View>
          <Text style={styles.statLabel}>Outstanding Value</Text>
          <Text style={styles.statValue}>₹{stats.totalPending.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>

        {/* Customers (Replaced Overdue) */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(186, 26, 26, 0.1)' }]}>
              <Ionicons name="people-outline" size={20} color="#ba1a1a" />
            </View>
          </View>
          <Text style={styles.statLabel}>Customers</Text>
          <Text style={styles.statValue}>{stats.totalCustomers}</Text>
        </View>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => router.push('/invoices')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          {stats.recentActivity.length === 0 ? (
            <Text style={{color: '#434655', marginTop: 10, padding: 16}}>No recent activity found.</Text>
          ) : (
            stats.recentActivity.map((activity, index) => {
              const isPaid = activity.payment_status === 'Paid';
              return (
                <TouchableOpacity key={activity.id || index} style={styles.invoiceRow} activeOpacity={0.7} onPress={() => router.push('/reports')}>
                  <View style={styles.invoiceLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(activity.customer_name)}</Text>
                    </View>
                    <View>
                      <Text style={styles.invoiceCustomerName}>{activity.customer_name || 'Walk-in Customer'}</Text>
                      <Text style={styles.invoiceNumber}>{activity.invoice_number}</Text>
                    </View>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>₹{Number(activity.grand_total).toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                    <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
                      <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>
                        {(activity.payment_status || 'PENDING').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Surface bright
    padding: 24,
  },
  header: {
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24, // headline-md
    fontWeight: 'bold',
    color: '#004ac6', // Primary
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%', // Approx half width for 2-column on mobile/tablet
    backgroundColor: '#faf8ff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e2ed',
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#434655', // on-surface-variant
    marginBottom: 4,
  },
  statValue: {
    fontSize: 30, // headline-lg
    fontWeight: '600',
    color: '#191b23', // on-surface
    letterSpacing: -0.5,
  },
  recentSection: {
    backgroundColor: '#faf8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e2ed',
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  recentTitle: {
    fontSize: 20, // headline-md
    fontWeight: '600',
    color: '#191b23', // on-surface
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004ac6', // primary
  },
  recentList: {
    flexDirection: 'column',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f3fe', // surface-container-low
    backgroundColor: '#faf8ff',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e2ed', // surface-container-highest
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004ac6',
  },
  invoiceCustomerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#191b23',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#434655',
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#191b23',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgePaid: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextPaid: {
    color: '#166534',
  },
  badgeTextPending: {
    color: '#92400E',
  },
});
