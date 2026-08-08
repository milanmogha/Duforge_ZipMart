import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== "Dashboard") {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Dashboard</Text>

        {/* Orders Section */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Orders</Text>
          <Text style={styles.description}>Manage your shop orders easily.</Text>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate("Orders")}
          >
            <Text style={styles.viewMoreText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Products</Text>
          <Text style={styles.description}>Manage and add new products.</Text>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate("Products")}
          >
            <Text style={styles.viewMoreText}>View Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        {[
          { screen: "Dashboard", icon: "home", label: "Home" },
          { screen: "Orders", icon: "clipboard", label: "Orders" },
          { screen: "Products", icon: "shopping-cart", label: "Products" },
          { screen: "AddProduct", icon: "plus-circle", label: "Add" },
          { screen: "Profile", icon: "user", label: "Profile" },
        ].map(({ screen, icon, label }) => (
          <TouchableOpacity
            key={screen}
            style={[styles.navItem, activeTab === screen && styles.activeNavItem]}
            onPress={() => navigateTo(screen)}
          >
            <FontAwesome
              name={icon as any}
              size={24}
              style={activeTab === screen ? styles.activeIcon : styles.icon}
            />
            <Text style={activeTab === screen ? styles.activeTabText : styles.tabText}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Dashboard;

/**
 * 🔹 Styles
 */
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 80, // Prevents overlap with Bottom Navigation
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    color: "#4ac76f",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    color: "#4ac76f",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "Lucida Grande",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 15,
  },
  viewMoreButton: {
    marginTop: 10,
    backgroundColor: "#4ac76f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },

  /* 🔹 Bottom Navigation Styles */
  navBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavItem: {
    backgroundColor: "#E0FFE6",
    borderRadius: 8,
  },
  icon: {
    color: "#9CA3AF",
    marginBottom: 5,
  },
  activeIcon: {
    color: "#4ac76f",
    marginBottom: 5,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Lucida Grande",
    color: "#9CA3AF",
  },
  activeTabText: {
    fontSize: 13,
    fontFamily: "Lucida Grande",
    color: "#4ac76f",
    fontWeight: "bold",
  },
});
