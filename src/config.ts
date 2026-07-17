export const API_URL = 'https://sales-invoice-backend-5o30.onrender.com';
// export const API_URL = 'http://192.168.1.46:5000';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export let globalToken = '';

export const setAuthToken = async (token: string) => {
  globalToken = token;
  if (Platform.OS === 'web') {
    try { localStorage.setItem('token', token); } catch (e) {}
  } else {
    await AsyncStorage.setItem('token', token);
  }
};

export const getAuthToken = () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem('token') || globalToken; } catch (e) { return globalToken; }
  }
  return globalToken;
};