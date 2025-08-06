const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");  // Importa la libreria uuid

// Schema per il cliente
const clientSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    walletReformer: { type: Number, default: 0 }, // Crediti Reformer
    walletMAT: { type: Number, default: 0 }, // Crediti MAT
    walletPSM: { type: Number, default: 0 }, // Crediti PSM
    rfidUID: {
        type: String,  // Campo per l'UID del tag RFID
        unique: true,  // L'UID deve essere unico per ogni cliente
        sparse: true,  // Permette valori null senza violare il vincolo di unicità
        default: null  // Imposta il valore predefinito su null
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ['add', 'remove'], // Assicurati che "remove" sia incluso
                required: true,
                validate: {
                    validator: function (value) {
                        return ['add', 'remove'].includes(value);
                    },
                    message: props => `${props.value} non è un valore valido per il campo type.`
                }
            },
            amount: Number,
            category: { type: String, enum: ['Reformer', 'MAT', 'PSM'] }, // Tipo di credito
            description: String,
            date: { type: Date, default: Date.now }
        }
    ],
    reservations: [
        {
            date: { type: Date, required: true }, // Data della lezione
            type: { type: String, enum: ['Reformer', 'MAT', 'PSM'], required: true }, // Tipo di lezione
            status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' } // Stato della prenotazione
        }
    ]
});

// Middleware per debug
clientSchema.pre('save', function (next) {
    console.log("Dati delle transazioni:", this.transactions);
    next();
});

// Middleware per verificare il valore di `type`
clientSchema.pre('save', function (next) {
    this.transactions.forEach(transaction => {
        if (transaction.type === 'remove' && transaction.amount > 0) {
            console.warn("Attenzione: una transazione di tipo 'remove' ha un importo positivo.");
        }
    });
    next();
});

// Creazione del modello "Client" basato sullo schema
const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
