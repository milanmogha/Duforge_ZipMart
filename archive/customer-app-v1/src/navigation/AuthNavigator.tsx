import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import About from "../screens/About";
import Account from "../screens/Account";
import BottomNavbar from "../screens/BottomNavbar";
import Cart from "../screens/Cart";
import CategoryPage from "../screens/CategoryPage";
import Checkout from "../screens/Checkout";
import CustomerChat from "../screens/CustomerSupport";
import DeliveryInfo from "../screens/DeliveryInfo";
import ForgotPassword from "../screens/Forgotpassword";
import HomePage from "../screens/HomePage";
import OrderDetails from "../screens/OrderDetails";
import Orders from "../screens/Orders";
import OrderSuccess from "../screens/OrderSuccess";
import Payment from "../screens/Payment";
import Product from "../screens/Product";
import ProductPage from "../screens/ProductPage";
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import Explore from "../screens/Explore";

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Product" component={Product} />
        <Stack.Screen name="ProductPage" component={ProductPage} />
        <Stack.Screen name="Explore" component={Explore} />
        <Stack.Screen name="Category" component={CategoryPage} />
        <Stack.Screen name="Cart" component={Cart} />
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="Main" component={BottomNavbar} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        {/* Common Screens */}
        <Stack.Screen name="Checkout" component={Checkout} />
        <Stack.Screen name="Payment" component={Payment} />

        {isAuthenticated && (
          <>
            <Stack.Screen name="About" component={About} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="DeliveryInfo" component={DeliveryInfo} />
            <Stack.Screen name="OrderDetails" component={OrderDetails} />
            <Stack.Screen name="CustomerSupport" component={CustomerChat} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
