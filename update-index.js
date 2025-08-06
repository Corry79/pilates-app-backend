const mongoose = require("mongoose");
require("dotenv").config(); // Per caricare la password dal file .env

const mongoURI = `mongodb+srv://corsimo:${process.env.DB_PASSWORD}@cluster0.rlmna.mongodb.net/test?retryWrites=true&w=majority`;

async function updateIndex() {
    try {
        // Connessione al database
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connesso a MongoDB");

        // Ottieni la collezione "clients"
        const collection = mongoose.connection.db.collection("clients");

        // Rimuovi l'indice esistente
        console.log("🔄 Rimozione dell'indice esistente...");
        await collection.dropIndex("rfidUID_1").catch(err => {
            if (err.codeName !== "IndexNotFound") {
                throw err;
            }
            console.log("Indice non trovato, nessuna azione necessaria.");
        });

        // Risolvi eventuali duplicati nel campo rfidUID
        console.log("🔄 Risoluzione dei duplicati nel campo rfidUID...");
        await collection.updateMany(
            { rfidUID: { $exists: true, $eq: null } }, // Filtra i documenti con rfidUID null
            { $unset: { rfidUID: "" } } // Rimuovi il campo rfidUID
        );

        // Ricrea l'indice con l'opzione sparse
        console.log("🔄 Creazione di un nuovo indice con sparse: true...");
        await collection.createIndex({ rfidUID: 1 }, { unique: true, sparse: true });

        console.log("✅ Indice aggiornato con successo!");
    } catch (err) {
        console.error("❌ Errore durante l'aggiornamento dell'indice:", err);
    } finally {
        // Chiudi la connessione
        mongoose.connection.close();
    }
}

updateIndex();
