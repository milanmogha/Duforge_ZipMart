import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { DeliveryBoyAPI } from '../services/api';

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    try {
      setError('');
      await DeliveryBoyAPI.sendForgotPasswordOtp({ email });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'OTP sent successfully. Please check your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending OTP.');
    }
  };

  const verifyOtp = async () => {
    try {
      setError('');
      const response = await DeliveryBoyAPI.verifyOtp({ email, otp });
      if (response.data.verified) {
        setOtpVerified(true);
        Alert.alert('Verified', 'OTP verified successfully!');
        // Navigate to the reset password screen and pass the email along
        navigation.navigate('ResetPassword', { email });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Forgot Password</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          {!otpSent ? (
            <Button mode="contained" onPress={sendOtp} style={styles.button}>
              Send OTP
            </Button>
          ) : !otpVerified ? (
            <>
              <TextInput
                label="Enter OTP"
                mode="outlined"
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
              />
              <Button mode="contained" onPress={verifyOtp} style={styles.button}>
                Verify OTP
              </Button>
            </>
          ) : (
            <Text style={styles.success}>OTP verified successfully! Redirecting...</Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f3f4f6' },
  card: { width: '100%', padding: 20, borderRadius: 10, elevation: 3, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { marginBottom: 10 },
  button: { marginTop: 10 },
  error: { color: 'red', textAlign: 'center', marginBottom: 10 },
  success: { color: 'green', textAlign: 'center', marginTop: 10 },
});

export default ForgotPasswordScreen;
