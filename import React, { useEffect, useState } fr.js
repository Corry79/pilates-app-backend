import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, FlatList, Alert } from "react-native";
import axios from "axios";

const LessonsScreen = ({ route }) => {
    const { client } = route.params;
    const [lessons, setLessons] = useState([]);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await axios.get("http://192.168.1.100:5000/api/mobile/lessons");
                setLessons(response.data);
            } catch (error) {
                console.error("Errore durante il caricamento delle lezioni:", error); // Log dettagliato
                Alert.alert("Errore", "Impossibile caricare le lezioni.");
            }
        };

        fetchLessons();
    }, []);

    const handleReservation = async (lessonType) => {
        try {
            const response = await axios.post(`http://192.168.1.100:5000/api/clients/${client._id}/reservations`, {
                date: new Date().toISOString(),
                type: lessonType,
            });
            Alert.alert("Successo", "Prenotazione effettuata con successo!");
        } catch (error) {
            Alert.alert("Errore", error.response?.data?.error || "Errore durante la prenotazione.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lezioni Disponibili</Text>
            <FlatList
                data={lessons}
                keyExtractor={(item) => item.type}
                renderItem={({ item }) => (
                    <View style={styles.lessonCard}>
                        <Text style={styles.lessonTitle}>{item.type}</Text>
                        <Text>{item.description}</Text>
                        <Button title="Prenota" onPress={() => handleReservation(item.type)} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    lessonCard: {
        padding: 20,
        marginBottom: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
});

export default LessonsScreen;
