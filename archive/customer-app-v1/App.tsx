import React from "react";
import { AuthProvider } from "./src/context/AuthContext"; // Ensure correct path
import { CartProvider } from "./src/context/CartContext";
import AuthNavigator from "./src/navigation/AuthNavigator";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AuthNavigator />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
