import React, { useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import BottomNavbar from "./BottomNavbar"; 
import { useAuth } from "../context/AuthContext";

const Account: React.FC = () => {
  const { user, logout, authToken } = useAuth();
  // Using either token or user to check auth status
  const isAuthenticated = !!user || !!authToken;
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Optionally refresh user data here if needed.
    }
  }, [isFocused]);

  const handleLogoutConfirmation = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              navigation.navigate("SignIn" as never);
            } catch (error) {
              console.error("Logout failed", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isAuthenticated ? (
          <View style={styles.authContent}>
            <Text style={styles.infoText}>
              Manage your orders, settings, and preferences.
            </Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("Orders" as never)}
              >
                <Text style={styles.menuButtonText}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("CustomerSupport" as never)}
              >
                <Text style={styles.menuButtonText}>Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("About" as never)}
              >
                <Text style={styles.menuButtonText}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogoutConfirmation}
              >
                <Text style={styles.menuButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.centeredContainer}>
            <Text style={styles.notLoggedInText}>You're not logged in</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate("SignIn" as never)}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomNavbar}>
        <BottomNavbar activePage="account" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    backgroundColor: "#4ac76f",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    // If you have expo-linear-gradient installed, you can replace this with a gradient.
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    paddingBottom: 100,
  },
  authContent: {
    width: "100%",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 25,
    textAlign: "center",
  },
  menuContainer: {
    width: "100%",
  },
  menuButton: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logoutButton: {
    backgroundColor: "#fa5261",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  menuButtonText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "500",
  },
  centeredContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  notLoggedInText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#4ac76f",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomNavbar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 12,
    alignItems: "center",
  },
});

export default Account;
