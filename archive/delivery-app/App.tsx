import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthNavigator from './src/navigation/AuthNavigator';
import DeliveryBoyInitialization from './src/screens/DeliveryBoyInitialization';
import { NotificationProvider } from './src/services/NotificationProvider';

const App: React.FC = () => {
  return (
    <NotificationProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthNavigator />
      <DeliveryBoyInitialization />
    </GestureHandlerRootView>
    </NotificationProvider>
  );
};

export default App;
