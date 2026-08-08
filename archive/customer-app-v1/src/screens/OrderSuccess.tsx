import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface OrderSuccessProps {
  savedAmount: number;
  onClose: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ savedAmount, onClose }) => {
  const navigation = useNavigation();

  const handleViewOrders = () => {
    onClose();
    navigation.navigate("Orders" as never);
  };

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          {savedAmount > 0 && (
            <Text style={styles.savedText}>You saved ₹{savedAmount.toFixed(2)} on this order.</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={handleViewOrders}>
            <Text style={styles.buttonText}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/** Styles */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "80%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 10,
    textAlign: "center",
  },
  savedText: {
    fontSize: 16,
    color: "#2563eb",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OrderSuccess;
