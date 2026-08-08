import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../services/api'; // Use the shared API instance
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeleteAccountScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [shopkeeperId, setShopkeeperId] = useState('');

  // Load shopkeeper ID from AsyncStorage on mount.
  useEffect(() => {
    const fetchShopkeeperId = async () => {
      try {
        const storedShopkeeperId = await AsyncStorage.getItem('shopkeeperId');
        if (storedShopkeeperId) {
          console.log("Found shopkeeperId:", storedShopkeeperId);
          setShopkeeperId(storedShopkeeperId);
        } else {
          Alert.alert('Error', 'Shopkeeper ID not found. Please log in again.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error fetching shopkeeper ID:', error);
      }
    };
    fetchShopkeeperId();
  }, [navigation]);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password to proceed.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // The api.ts instance attaches the token automatically using the interceptor.
              // This calls DELETE /api/shops/:id
              console.log("Sending DELETE request to /shops/" + shopkeeperId);

              const response = await api.delete(`/shops/${shopkeeperId}`, {
                data: { password },
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              console.log("Delete account response:", response.data);
              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');

              // Clear AsyncStorage and navigate to the Login screen.
              await AsyncStorage.removeItem('shopkeeperToken');
              await AsyncStorage.removeItem('shopkeeperId');

              navigation.replace('Login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.description}>
        Please enter your password to confirm deletion of your account.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Delete Account" onPress={handleDeleteAccount} color="#FF0000" />
    </View>
  );
};

export default DeleteAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});
