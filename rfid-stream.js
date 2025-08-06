const express = require("express");
const router = express.Router();

let clients = [];

// Endpoint per lo streaming RFID
router.get("/rfid-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    clients.push(res);

    // Invia un messaggio di connessione iniziale
    res.write("data: Connesso al server RFID\n\n");

    req.on("close", () => {
        clients = clients.filter(client => client !== res);
    });
});

// Endpoint per ricevere il codice RFID dall'Arduino
router.post("/rfid-stream", (req, res) => {
    const { rfidCode } = req.body;

    if (!rfidCode) {
        return res.status(400).json({ error: "Codice RFID mancante" });
    }

    console.log(`📡 Codice RFID ricevuto: ${rfidCode}`);
    broadcastRFID(rfidCode); // Trasmetti il codice RFID ai client connessi
    res.status(200).json({ message: "Codice RFID ricevuto e trasmesso" });
});

// Funzione per inviare il codice RFID a tutti i client connessi
function broadcastRFID(rfidCode) {
    console.log(`📡 Trasmettendo codice RFID: ${rfidCode}`); // Log per debug
    clients.forEach(client => {
        client.write(`data: ${rfidCode}\n\n`); // Invia il codice RFID al frontend
    });
}

module.exports = { router, broadcastRFID };
