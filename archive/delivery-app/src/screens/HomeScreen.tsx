import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Card } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== 'Home') {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top App Bar */}
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="ZipMart" subtitle="Delivery Partner Home" />
      </Appbar.Header>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.welcomeText}>Welcome, Delivery Partner!</Text>
        <Text style={styles.infoText}>
          Use the navigation bar below to access Orders, Earnings, and your Profile.
        </Text>

        {/* Additional Content - Daily Tip */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Daily Tip</Text>
            <Text style={styles.cardContent}>
              Remember to check your orders frequently and keep your location updated for the best service.
            </Text>
          </Card.Content>
        </Card>

        {/* Additional Content - Google map Tip */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Google Map Tip</Text>
            <Text style={styles.cardContent}>
              While Taking and delivering the Order click on shop or customer on map, then click on Direction Button for better direction.
            </Text>
          </Card.Content>
        </Card>

        {/* Additional Content - Motivational Message */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Motivation</Text>
            <Text style={styles.cardContent}>
              Every delivery counts! Keep up the great work and deliver smiles to every customer.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Custom Navigation Tabs */}
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

export default HomeScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  appBar: {
    backgroundColor: '#4CAF50',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#fff',
    padding: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  cardContent: {
    fontSize: 16,
    color: '#555',
  },
  highlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    backgroundColor: '#E8F5E9',
  },
  icon: {
    color: '#757575',
    marginBottom: 5,
  },
  activeIcon: {
    color: '#4CAF50',
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#757575',
  },
  activeTabText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
