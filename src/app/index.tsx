import { API_URL } from '../config';
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('API_URL IS:', API_URL); const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        router.replace('/(app)/dashboard');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="wallet-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.brandTitle}>Lumina Ledger</Text>
            <Text style={styles.brandSubtitle}>Enterprise Sales Invoice Management</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>Please enter your details to sign in</Text>

            {/* Email Input */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#94A3B8" 
                  style={styles.eyeIcon} 
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]} 
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
              <Text style={styles.rememberText}>Remember for 30 days</Text>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.signInButtonContent}>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 8}} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={18} color="#374151" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="briefcase-outline" size={18} color="#374151" />
                <Text style={styles.socialButtonText}>SSO</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Links */}
          <View style={styles.bottomSection}>
            <Text style={styles.noAccountText}>
              Don't have an account? <Text style={styles.requestAccessText}>Request Access</Text>
            </Text>
            
            <View style={styles.footerLinks}>
              <TouchableOpacity><Text style={styles.footerLinkText}>Privacy Policy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLinkText}>Terms of Service</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLinkText}>Support</Text></TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#0052CC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0052CC',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    height: 48,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0052CC',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  checkboxChecked: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  rememberText: {
    fontSize: 14,
    color: '#4b5563',
  },
  signInButton: {
    backgroundColor: '#0052CC',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bottomSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
  },
  requestAccessText: {
    color: '#0052CC',
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  }
});
