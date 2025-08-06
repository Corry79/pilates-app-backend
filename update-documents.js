const mongoose = require("mongoose");
require("dotenv").config(); // Per caricare la password dal file .env

const mongoURI = `mongodb+srv://corsimo:${process.env.DB_PASSWORD}@cluster0.rlmna.mongodb.net/test?retryWrites=true&w=majority`;

async function updateDocuments() {
    try {
        // Connessione al database
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connesso a MongoDB");

        // Ottieni la collezione "clients"
        const collection = mongoose.connection.db.collection("clients");

        // Aggiorna i documenti esistenti per assicurare la struttura corretta
        console.log("🔄 Aggiornamento dei documenti esistenti...");
        await collection.updateMany(
            {}, // Filtra tutti i documenti
            {
                $setOnInsert: {
                    walletReformer: 0,
                    walletMAT: 0,
                    walletPSM: 0,
                    rfidUID: null,
                    transactions: []
                }
            },
            { upsert: false } // Non creare nuovi documenti, aggiorna solo quelli esistenti
        );

        console.log("✅ Documenti aggiornati con successo!");
    } catch (err) {
        console.error("❌ Errore durante l'aggiornamento dei documenti:", err);
    } finally {
        // Chiudi la connessione
        mongoose.connection.close();
    }
}

updateDocuments();
