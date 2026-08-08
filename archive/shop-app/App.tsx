import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AuthNavigator from "./src/navigation/AuthNavigator";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  const connectSocket = (shopkeeperId: string) => {
    console.log(`Connecting socket for shopkeeper ID: ${shopkeeperId}`);
    // Add actual socket connection logic here
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthNavigator setToken={setToken} connectSocket={connectSocket} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
