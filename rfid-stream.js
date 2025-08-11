const express = require("express");
const router = express.Router();

let clients = [];

// Endpoint per lo streaming RFID (SSE)
router.get("/api/rfid", (req, res) => {
    // Impostazioni dell'header per SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Forza l'invio immediato degli headers

    console.log("🟢 Nuovo client connesso al flusso RFID");

    // Aggiunge il client alla lista
    clients.push(res);

    // Invia messaggio iniziale
    res.write(`event: connection\ndata: Connesso al server RFID\n\n`);

    // Rimuove il client in caso di disconnessione
    req.on("close", () => {
        console.log("🔴 Client disconnesso dal flusso RFID");
        clients = clients.filter((client) => client !== res);
    });
});

// Endpoint per ricevere il codice RFID dall'Arduino
router.post("/api/rfid", (req, res) => {
    const { rfidCode } = req.body;

    if (!rfidCode) {
        return res.status(400).json({ error: "Codice RFID mancante" });
    }

    console.log(`📡 Codice RFID ricevuto: ${rfidCode}`);

    // Trasmette il codice a tutti i client SSE connessi
    broadcastRFID(rfidCode);

    return res.status(200).json({ message: "Codice RFID ricevuto e trasmesso" });
});

// Funzione per trasmettere il codice RFID a tutti i client connessi
function broadcastRFID(rfidCode) {
    clients.forEach((client) => {
       client.write(`data: ${rfidCode}\n\n`); // nessun "event: rfid"
    });
}

module.exports = { router, broadcastRFID };
