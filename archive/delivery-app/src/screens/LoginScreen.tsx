import React from 'react';
import { View, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DeliveryBoyAPI } from '../services/api';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // API call to login
        const response = await DeliveryBoyAPI.login(values);
        setLoading(false);
        Alert.alert('Login Successful', `Welcome ${response.data.deliveryBoy.name}`);
        // Navigate to the next screen (e.g., Dashboard)
        navigation.navigate('Home', {
          deliveryBoy: response.data.deliveryBoy, // Pass the delivery boy details to the next page
        });
      } catch (error: any) {
        setLoading(false);
        const errorMessage = error.response?.data?.message || 'Something went wrong';
        Alert.alert('Login Failed', errorMessage);
      }
    },
  });

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }} // Replace with your logo URL
        style={styles.logo}
      />

      {/* Login Form */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Login</Text>

          <TextInput
            mode="outlined"
            label="Email"
            placeholder="Enter your email"
            style={styles.input}
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            error={!!formik.errors.email}
            theme={{ colors: { primary: '#4ac76f' } }}
          />
          {formik.errors.email && <Text style={styles.error}>{formik.errors.email}</Text>}

          <TextInput
            mode="outlined"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            style={styles.input}
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            error={!!formik.errors.password}
            theme={{ colors: { primary: '#4ac76f' } }}
          />
          {formik.errors.password && <Text style={styles.error}>{formik.errors.password}</Text>}

          {/* Forgot Password Option */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={formik.handleSubmit}
            style={styles.button}
            contentStyle={styles.buttonContent}
            disabled={loading}
          >
            {loading ? <ActivityIndicator animating={true} color="#fff" /> : 'Login'}
          </Button>

          <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    backgroundColor: '#f4f4f4' 
  },
  logo: { 
    width: 100, 
    height: 100, 
    marginBottom: 30 
  },
  card: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 10, 
    elevation: 5, 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20, 
    fontFamily: 'Lucida Grande' 
  },
  input: { 
    marginBottom: 10, 
    fontFamily: 'Lucida Grande' 
  },
  button: { 
    marginTop: 20, 
    borderRadius: 5, 
    backgroundColor: '#4ac76f' 
  },
  buttonContent: { 
    paddingVertical: 5 
  },
  error: { 
    fontSize: 12, 
    color: 'red', 
    marginBottom: 5, 
    fontFamily: 'Lucida Grande' 
  },
  link: { 
    textAlign: 'center', 
    marginTop: 15, 
    color: '#555', 
    fontFamily: 'Lucida Grande' 
  },
  linkBold: { 
    fontWeight: 'bold', 
    color: '#4ac76f' 
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#4ac76f',
    marginBottom: 10,
    fontFamily: 'Lucida Grande',
  },
});

export default LoginScreen;
