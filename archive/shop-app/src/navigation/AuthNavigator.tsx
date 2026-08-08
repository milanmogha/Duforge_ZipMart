import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import screens
import Account from "../screens/Account";
import AddProduct from "../screens/AddProduct";
import Dashboard from "../screens/Dashboard";
import ForgotPassword from "../screens/ForgotPassword";
import Login from "../screens/Login";
import OrderDetails from "../screens/OrderDetails";
import ProductCard from "../screens/ProductCard";
import ProductsScreen from "../screens/Products";
import ResetPassword from "../screens/ResetPassword";
import ShopkeeperOrders from "../screens/ShopkeeperOrders";
import Signup from "../screens/Signup";
import ShopkeeperChat from "../screens/Support";
import DeleteAccountScreen from "../screens/DeleteAccount"; // New Delete Account screen

const Stack = createStackNavigator();

interface AuthNavigatorProps {
  setToken: (token: string | null) => void;
  connectSocket: (shopkeeperId: string) => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ setToken, connectSocket }) => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      {/* Authentication Screens */}
      <Stack.Screen name="Login">
        {(props) => <Login {...props} setToken={setToken} connectSocket={connectSocket} />}
      </Stack.Screen>
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />

      {/* Main Screens */}
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProduct} />
      <Stack.Screen name="Orders" component={ShopkeeperOrders} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="Profile" component={Account} />

      {/* Delete Account Screen */}
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />

      {/* Other Screens */}
      <Stack.Screen name="Support" component={ShopkeeperChat} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
