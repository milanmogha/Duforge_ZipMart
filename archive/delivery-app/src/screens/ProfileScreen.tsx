import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appbar, Card } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { DeliveryBoyAPI } from '../services/api';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('Profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await DeliveryBoyAPI.getProfile();
      setProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate('Login');
  };

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== 'Profile') {
      navigation.navigate(screen);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4ac76f" />
        <Text style={styles.loaderText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Top App Bar */}
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="ZipMart" subtitle="Your Profile" />
      </Appbar.Header>

      {/* Profile Content */}
      <ScrollView contentContainerStyle={styles.profileContainer}>
        <Image
          source={{ uri: 'https://i.imgur.com/OVMZBs9.png' }} // Placeholder image
          style={styles.profileImage}
        />
        <Text style={styles.name}>{profile?.name || 'Delivery Partner'}</Text>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.detail}>Phone: {profile?.phone || 'N/A'}</Text>
            <Text style={styles.detail}>Email: {profile?.email || 'N/A'}</Text>
            <Text style={styles.detail}>Address: {profile?.address || 'N/A'}</Text>
          </Card.Content>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/** New Delivered Orders Button */}
        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={() => navigation.navigate('DeliveredOrders')}
        >
          <Text style={styles.deliveredButtonText}>View Delivered Orders</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Home' && styles.activeNavItem]}
          onPress={() => navigateTo('Home')}
        >
          <FontAwesome
            name="home"
            size={24}
            style={activeTab === 'Home' ? styles.activeIcon : styles.icon}
          />
          <Text style={activeTab === 'Home' ? styles.activeTabText : styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Orders' && styles.activeNavItem]}
          onPress={() => navigateTo('Orders')}
        >
          <FontAwesome
            name="clipboard"
            size={24}
            style={activeTab === 'Orders' ? styles.activeIcon : styles.icon}
          />
          <Text style={activeTab === 'Orders' ? styles.activeTabText : styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Earnings' && styles.activeNavItem]}
          onPress={() => navigateTo('Earnings')}
        >
          <FontAwesome
            name="money"
            size={24}
            style={activeTab === 'Earnings' ? styles.activeIcon : styles.icon}
          />
          <Text style={activeTab === 'Earnings' ? styles.activeTabText : styles.tabText}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Profile' && styles.activeNavItem]}
          onPress={() => navigateTo('Profile')}
        >
          <FontAwesome
            name="user"
            size={24}
            style={activeTab === 'Profile' ? styles.activeIcon : styles.icon}
          />
          <Text style={activeTab === 'Profile' ? styles.activeTabText : styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f3f4f6' },
  appBar: { backgroundColor: '#4ac76f' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, fontSize: 16, color: '#333' },
  profileContainer: { flexGrow: 1, alignItems: 'center', padding: 20 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4ac76f',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Lucida Grande',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  detail: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Lucida Grande',
  },
  logoutButton: {
    width: '80%',
    backgroundColor: '#4ac76f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deliveredButton: {
    width: '80%',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  deliveredButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeNavItem: { backgroundColor: '#E8F5E9' },
  icon: { color: '#757575', marginBottom: 5 },
  activeIcon: { color: '#4ac76f', marginBottom: 5 },
  tabText: { fontSize: 12, color: '#757575' },
  activeTabText: { fontSize: 12, color: '#4ac76f', fontWeight: 'bold' },
});

export default ProfileScreen;
