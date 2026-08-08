import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const About: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Section title="About Us">
        <Text style={styles.text}>
          Welcome to ZipMart E-commerce Private Limited, your one-stop destination for a wide range of products delivered to your doorstep with speed and convenience. Founded with a vision to simplify your shopping experience, we are committed to providing high-quality products, competitive prices, and exceptional customer service.
        </Text>
        <Text style={styles.text}>
          At ZipMart, we make everyday life easier by offering an efficient, user-friendly experience. We work with trusted brands and local suppliers to ensure our products are fresh, reliable, and of the highest standard. Your satisfaction is our priority.
        </Text>
        <Text style={styles.text}>
          Thank you for choosing ZipMart. We look forward to serving you!
        </Text>
      </Section>

      <Section title="Privacy Policy">
        <Text style={styles.text}>
          We value your privacy and protect your personal information. This policy explains how we collect, use, and safeguard your data.
        </Text>
        <List
          items={[
            "We collect personal information when you register or order.",
            "Payment details are processed securely.",
            "Browsing data is used to improve your experience.",
          ]}
        />
        <Text style={styles.subheading}>How We Use Your Information:</Text>
        <List
          items={[
            "To process and deliver your orders.",
            "To send updates and special offers.",
            "To improve our services.",
          ]}
        />
        <Text style={styles.text}>
          We do not sell or share your personal data with third parties except as necessary for order fulfillment.
        </Text>
      </Section>

      <Section title="Shipping Policy">
        <Text style={styles.text}>
          We deliver to your city. Check availability by entering your zip code at checkout. Orders are processed promptly.
        </Text>
        <Text style={styles.text}>
          During peak seasons or unforeseen circumstances, slight delays may occur. Please contact us for any questions.
        </Text>
      </Section>

      <Section title="Refund Policy">
        <Text style={styles.text}>
          Your satisfaction is important. If you're not happy with your purchase, please review our refund process:
        </Text>
        <List
          items={[
            "Return products within 7 days of purchase.",
            "Items must be unused and in original packaging.",
            "Perishables are refundable only if damaged or expired.",
            "Gift cards and promotions are non-refundable.",
          ]}
        />
        <Text style={styles.text}>
          Approved refunds are processed within 7 days to your original payment method.
        </Text>
      </Section>

      <Section title="Terms and Conditions">
        <Text style={styles.text}>
          By using our app, you agree to the following terms:
        </Text>
        <List
          items={[
            "You must be 18 years or older.",
            "Provide accurate information when registering or ordering.",
            "Unauthorized use of our platform is prohibited.",
            "Orders are subject to availability and may be modified or canceled.",
            "Prices are subject to change without notice.",
          ]}
        />
        <Text style={styles.text}>
          We strive for accuracy, but cannot guarantee error-free product descriptions or pricing.
        </Text>
      </Section>

      <Section title="Contact Us">
        <Text style={styles.contact}><Text style={styles.bold}>Address:</Text> Belandur, Bengaluru - 560035</Text>
        <Text style={styles.contact}><Text style={styles.bold}>Call:</Text> +91-8625879347</Text>
        <Text style={styles.contact}><Text style={styles.bold}>Email:</Text> customersupport@bellybasketstore.com</Text>
      </Section>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.heading}>{title}</Text>
    {children}
  </View>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={styles.listContainer}>
    {items.map((item, index) => (
      <Text key={index} style={styles.listItem}>• {item}</Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginVertical: 5,
  },
  listContainer: {
    marginVertical: 8,
    marginLeft: 10,
  },
  listItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default About;
