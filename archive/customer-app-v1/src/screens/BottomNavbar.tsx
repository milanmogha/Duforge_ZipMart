import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

interface BottomNavbarProps {
  activePage: string;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activePage }) => {
  const navigation = useNavigation();

  const navItems = [
    { name: "Shop", icon: "store", route: "Home" },
    { name: "Explore", icon: "search", route: "Explore" },
    { name: "Cart", icon: "shopping-cart", route: "Cart" },
    { name: "Account", icon: "user", route: "Account" },
  ];

  return (
    <View style={styles.navbarContainer}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.route as never)}
        >
          <View style={[styles.iconContainer, activePage === item.name.toLowerCase() && styles.activeIconContainer]}>
            <FontAwesome5
              name={item.icon}
              size={20}
              color={activePage === item.name.toLowerCase() ? "#fff" : "#777"}
            />
          </View>
          <Text
            style={[
              styles.navText,
              activePage === item.name.toLowerCase() && styles.activeNavText,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomNavbar;

const styles = StyleSheet.create({
  navbarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 30,
  },
  activeIconContainer: {
    backgroundColor: "#4ac76f",
  },
  navText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontFamily: "Lucida Grande",
  },
  activeNavText: {
    color: "#4ac76f",
    fontWeight: "bold",
  },
});
