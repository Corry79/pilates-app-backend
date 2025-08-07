import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://192.168.1.100:5000/api/mobile/login", { email });
            Alert.alert("Successo", "Login effettuato con successo!");
            navigation.navigate("Lessons", { client: response.data.client });
        } catch (error) {
            console.error("Errore durante il login:", error); // Log dettagliato
            Alert.alert("Errore", error.response?.data?.error || "Errore durante il login.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Inserisci la tua email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <Button title="Accedi" onPress={handleLogin} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        marginBottom: 20,
    },
});

export default LoginScreen;
