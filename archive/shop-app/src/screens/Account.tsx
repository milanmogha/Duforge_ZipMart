import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [serviceRadius, setServiceRadius] = useState(5);
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Account");

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== "Account") {
      navigation.navigate(screen);
    }
  };

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const shopkeeperId = await AsyncStorage.getItem("shopkeeperId");
        if (!shopkeeperId) {
          setMessage("Shopkeeper ID not found. Please log in again.");
          return;
        }

        const response = await api.get(`/shop/${shopkeeperId}`);
        const { locationCoordinates, serviceRadius } = response.data;

        setLocation({
          latitude: locationCoordinates?.latitude || 28.6139, // Default: New Delhi
          longitude: locationCoordinates?.longitude || 77.2090,
        });

        setServiceRadius(serviceRadius || 5);
      } catch (error) {
        console.error("Error fetching shopkeeper details:", error);
        setMessage("Failed to fetch location details. Please try again.");
      }
    };

    fetchLocation();
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setMessage("Permission to access location was denied");
      return;
    }

    let locationData = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: locationData.coords.latitude,
      longitude: locationData.coords.longitude,
    });
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleSaveLocation = async () => {
    try {
      const shopkeeperId = await AsyncStorage.getItem("shopkeeperId");
      if (!shopkeeperId) {
        setMessage("Shopkeeper ID not found. Please log in again.");
        return;
      }

      await api.put(`/shop/update-location/${shopkeeperId}`, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        serviceRadius,
      });

      Alert.alert("Success", "Location updated successfully.");
    } catch (error) {
      console.error("Error updating location:", error);
      Alert.alert("Error", "Failed to update location. Please try again.");
    }
  };

  const handleDeleteAccountNavigation = () => {
    // Optionally, prompt the user before navigating to the DeleteAccount screen
    Alert.alert(
      "Confirm Navigation",
      "Are you sure you want to go to the Delete Account page?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            navigation.navigate("DeleteAccount");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopkeeper Account</Text>

      {message ? <Text style={styles.errorText}>{message}</Text> : null}

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: location?.latitude || 28.6139,
            longitude: location?.longitude || 77.2090,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={handleMapPress}
        >
          {location && <Marker coordinate={location} title="Your Location" />}
        </MapView>
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
        <Text style={styles.buttonText}>Get Current Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
        <Text style={styles.buttonText}>Save Location</Text>
      </TouchableOpacity>

      {/* Delete Account Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccountNavigation}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.supportButton} onPress={() => navigateTo("Support")}>
        <FontAwesome name="headphones" size={20} style={styles.icon} />
        <Text style={styles.buttonText}>Support</Text>
      </TouchableOpacity>

      <View style={styles.navBar}>
        {[
          { name: "Dashboard", icon: "home", label: "Home" },
          { name: "Orders", icon: "clipboard", label: "Orders" },
          { name: "Products", icon: "shopping-cart", label: "Products" },
          { name: "AddProduct", icon: "plus-circle", label: "Add Product" },
          { name: "Profile", icon: "user", label: "Profile" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.navItem, activeTab === tab.name && styles.activeNavItem]}
            onPress={() => navigateTo(tab.name)}
          >
            <FontAwesome
              name={tab.icon}
              size={24}
              style={activeTab === tab.name ? styles.activeIcon : styles.icon}
            />
            <Text style={activeTab === tab.name ? styles.activeTabText : styles.tabText}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    color: "#333",
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    fontFamily: "Lucida Grande",
    marginBottom: 10,
  },
  mapContainer: {
    width: "100%",
    height: 400,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: "#4ac76f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#4ac76f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#FF3333", // A red background for delete action
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ac76f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: "90%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    marginLeft: 8,
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  activeNavItem: {
    backgroundColor: "#E8F5E9",
  },
  icon: {
    color: "#757575",
    marginBottom: 5,
  },
  activeIcon: {
    color: "#4ac76f",
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    color: "#757575",
    fontFamily: "Lucida Grande",
  },
  activeTabText: {
    fontSize: 12,
    color: "#4ac76f",
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
});
