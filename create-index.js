const mongoose = require("mongoose");
require("dotenv").config(); // Per caricare la password dal file .env

const mongoURI = `mongodb+srv://corsimo:${process.env.DB_PASSWORD}@cluster0.rlmna.mongodb.net/test?retryWrites=true&w=majority`;

async function createIndex() {
    try {
        // Connessione al database
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connesso a MongoDB");

        // Ottieni la collezione "clients"
        const collection = mongoose.connection.db.collection("clients");

        // Crea l'indice con le opzioni unique e sparse
        console.log("🔄 Creazione di un nuovo indice...");
        await collection.createIndex({ rfidUID: 1 }, { unique: true, sparse: true });

        console.log("✅ Indice creato con successo!");
    } catch (err) {
        console.error("❌ Errore durante la creazione dell'indice:", err);
    } finally {
        // Chiudi la connessione
        mongoose.connection.close();
    }
}

createIndex();
