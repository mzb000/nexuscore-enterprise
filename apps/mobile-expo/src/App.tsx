import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { StatusBar } from "expo-status-bar";

interface Product {
  id: string;
  title: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: "1", title: "Nexus Quantum X1 Laptop", price: 2499.0 },
  { id: "2", title: "Aura Noise-Cancelling Headphones", price: 349.0 },
  { id: "3", title: "Nexus Titan FIDO2 Security Key", price: 85.0 },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setIsAuthenticated(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to access NexusCore Secure Wallet",
      fallbackLabel: "Use PIN",
    });

    if (result.success) {
      setIsAuthenticated(true);
      Alert.alert("Success", "Biometric Authentication Verified");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NexusCore Mobile</Text>
        <Text style={styles.cartBadge}>Cart: {cartCount}</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.authContainer}>
          <Text style={styles.authPrompt}>Biometric Security Verification Required</Text>
          <TouchableOpacity style={styles.authButton} onPress={handleBiometricAuth}>
            <Text style={styles.authButtonText}>Unlock with FaceID / TouchID</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={PRODUCTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setCartCount((c) => c + 1)}
              >
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: "#1e293b",
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#38bdf8",
  },
  cartBadge: {
    color: "#f8fafc",
    backgroundColor: "#0284c7",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontWeight: "bold",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authPrompt: {
    color: "#94a3b8",
    marginBottom: 20,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  authButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#38bdf8",
    marginVertical: 8,
  },
  addButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
