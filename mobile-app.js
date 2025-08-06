const express = require("express");
const router = express.Router();
const Client = require("./models/client");

// Endpoint per il login del cliente
router.post("/login", async (req, res) => {
    try {
        const { email } = req.body;

        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(404).json({ error: "Cliente non trovato" });
        }

        res.status(200).json({ message: "Login effettuato con successo", client });
    } catch (err) {
        console.error("Errore nel login:", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint per ottenere le lezioni disponibili
router.get("/lessons", (req, res) => {
    const lessons = [
        { type: "Reformer", description: "Lezione di Reformer Pilates" },
        { type: "MAT", description: "Lezione di MAT Pilates" },
        { type: "PSM", description: "Lezione di PSM Pilates" }
    ];

    res.status(200).json(lessons);
});

module.exports = router;
