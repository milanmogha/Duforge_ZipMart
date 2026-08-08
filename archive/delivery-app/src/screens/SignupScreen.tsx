import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity, Text } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DeliveryBoyAPI } from '../services/api';

const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [aadhar, setAadhar] = useState<null | { uri: string; type: string; name: string }>(null);
  const [drivingLicence, setDrivingLicence] = useState<null | { uri: string; type: string; name: string }>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [localError, setLocalError] = useState('');

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<any>>) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const type = `image/${uri.split('.').pop()}`;
        const name = uri.split('/').pop();
        setImage({ uri, type, name });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const formik = useFormik({
    initialValues: { name: '', email: '', phone: '', address: '', password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      phone: Yup.string().matches(/^\d{10}$/, 'Invalid phone number').required('Phone is required'),
      address: Yup.string().required('Address is required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
      confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
    }),
    onSubmit: async (values) => {
      if (!aadhar || !drivingLicence) {
        Alert.alert('Error', 'Please upload both Aadhar and Driving Licence.');
        return;
      }
      if (!otpSent || !emailVerified) {
        Alert.alert('Error', 'Please verify your email via OTP before signing up.');
        return;
      }
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => formData.append(key, value));
        formData.append('aadhar', { uri: aadhar.uri, type: aadhar.type, name: aadhar.name } as any);
        formData.append('drivingLicence', { uri: drivingLicence.uri, type: drivingLicence.type, name: drivingLicence.name } as any);

        const response = await DeliveryBoyAPI.signup(formData);
        Alert.alert('Success', response.data.message);
        navigation.navigate('Login');
      } catch (error: any) {
        Alert.alert('Signup Failed', error.response?.data?.message || error.message || 'Something went wrong');
      }
    },
  });

  const sendOtp = async () => {
    try {
      setLocalError('');
      await DeliveryBoyAPI.sendOtp({ email: formik.values.email });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'OTP sent to your email. Please check your inbox.');
    } catch (error: any) {
      setLocalError(error.response?.data?.message || 'Error sending OTP.');
    }
  };

  const verifyOtp = async () => {
    try {
      setLocalError('');
      const response = await DeliveryBoyAPI.verifyOtp({ email: formik.values.email, otp });
      if (response.data.verified) {
        setEmailVerified(true);
        Alert.alert('Verified', 'Email verified successfully!');
      }
    } catch (error: any) {
      setLocalError(error.response?.data?.message || 'Invalid OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.logo} />
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Delivery Boy Sign Up</Text>
          {localError ? <Text style={styles.error}>{localError}</Text> : null}

          <TextInput label="Name" mode="outlined" value={formik.values.name} onChangeText={formik.handleChange('name')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />
          <TextInput label="Email" mode="outlined" value={formik.values.email} onChangeText={formik.handleChange('email')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />
          <TextInput label="Phone" mode="outlined" value={formik.values.phone} onChangeText={formik.handleChange('phone')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />
          <TextInput label="Address" mode="outlined" value={formik.values.address} onChangeText={formik.handleChange('address')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />
          <TextInput label="Password" mode="outlined" secureTextEntry value={formik.values.password} onChangeText={formik.handleChange('password')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />
          <TextInput label="Confirm Password" mode="outlined" secureTextEntry value={formik.values.confirmPassword} onChangeText={formik.handleChange('confirmPassword')} style={styles.input} theme={{ colors: { primary: '#4ac76f' } }} />

          <Button mode="outlined" onPress={() => pickImage(setAadhar)} style={styles.uploadButton}>Upload Aadhar</Button>
          {aadhar && <Text style={styles.fileName}>{aadhar.name}</Text>}

          <Button mode="outlined" onPress={() => pickImage(setDrivingLicence)} style={styles.uploadButton}>Upload Driving Licence</Button>
          {drivingLicence && <Text style={styles.fileName}>{drivingLicence.name}</Text>}

          {!otpSent ? <Button mode="contained" onPress={sendOtp} style={styles.otpButton}>Send OTP</Button> :
            !emailVerified ? <>
              <TextInput label="Enter OTP" mode="outlined" value={otp} onChangeText={setOtp} style={styles.input} />
              <Button mode="contained" onPress={verifyOtp} style={styles.otpButton}>Verify OTP</Button>
            </> : <Text style={styles.success}>Email verified</Text>}

            <Button mode="contained" onPress={formik.handleSubmit} style={styles.button} disabled={!emailVerified} labelStyle={styles.buttonText}>
  Sign Up
</Button>


          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#f3f4f6' },
  logo: { width: 100, height: 100, marginBottom: 30 },
  card: { width: '100%', padding: 20, borderRadius: 10, elevation: 5, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, fontFamily: 'Lucida Grande' },
  input: { marginBottom: 10 },
  uploadButton: { marginTop: 10 },
  fileName: { fontSize: 12, color: '#555', marginTop: 5 },
  otpButton: { marginTop: 10, backgroundColor: '#4ac76f' },
  button: { marginTop: 20, borderRadius: 5, backgroundColor: '#4ac76f' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, // Ensures white text for the button
  error: { fontSize: 14, color: 'red', textAlign: 'center', marginBottom: 10 },
  success: { fontSize: 14, color: 'green', textAlign: 'center', marginBottom: 10 },
  link: { textAlign: 'center', marginTop: 15, color: '#555' },
  linkBold: { fontWeight: 'bold', color: '#4ac76f' },
});


export default SignupScreen;

