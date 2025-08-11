const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Per gestire la password in sicurezza

// Import modelli
const Client = require("./models/client");
const Lesson = require("./models/lesson");
const Booking = require("./models/booking");

// Import router esterni
const { router: rfidStreamRouter } = require("./rfid-stream");
const mobileAppRouter = require("./mobile-app");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connessione a MongoDB Atlas
const mongoURI = `mongodb+srv://corsimo:${process.env.DB_PASSWORD}@cluster0.rlmna.mongodb.net/test?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connesso a MongoDB Atlas"))
    .catch((err) => console.error("❌ Errore di connessione a MongoDB:", err));

// Rotta di test base
app.get("/api/test", (req, res) => {
    res.send("🚀 Server Pilates App Funziona!");
});

/** ROTTE CLIENTI **/

// Tutti i clienti
app.get("/api/clients", async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (err) {
        console.error("Errore nel recupero clienti:", err);
        res.status(400).json({ error: err.message });
    }
});

// Cliente singolo
app.get("/api/clients/:id", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });
        res.status(200).json(client);
    } catch (err) {
        console.error("Errore nel recupero del cliente:", err);
        res.status(400).json({ error: err.message });
    }
});

// Aggiungi cliente
app.post("/api/clients", async (req, res) => {
    try {
        const { name, email, rfidUID } = req.body;
        const existingClient = await Client.findOne({ email });
        if (existingClient) return res.status(400).json({ error: "Cliente già esistente!" });

        const newClient = new Client({ name, email, rfidUID: rfidUID || null });
        await newClient.save();

        res.status(201).json(newClient);
    } catch (err) {
        console.error("Errore nell'aggiunta del cliente:", err);
        res.status(400).json({ error: err.message });
    }
});

// Aggiungi crediti
app.post("/api/clients/:id/add-credits", async (req, res) => {
    try {
        const { amount, category } = req.body;
        if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "L'importo deve essere > 0" });

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        if (category === "Reformer") client.walletReformer = (client.walletReformer || 0) + amount;
        else if (category === "MAT") client.walletMAT = (client.walletMAT || 0) + amount;
        else if (category === "PSM") client.walletPSM = (client.walletPSM || 0) + amount;
        else return res.status(400).json({ error: "Categoria non valida" });

        client.transactions.push({
            type: "add",
            amount,
            category,
            description: `Aggiunti ${amount} crediti a ${category}`,
        });

        await client.save();
        res.status(200).json({ message: "Crediti aggiunti con successo!", client });
    } catch (err) {
        console.error("Errore nell'aggiunta crediti:", err);
        res.status(500).json({ error: err.message });
    }
});

// Rimuovi crediti
app.post("/api/clients/:id/remove-credits", async (req, res) => {
    try {
        const { amount, category } = req.body;
        if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "L'importo deve essere > 0" });

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        if (category === "Reformer") client.walletReformer = Math.max((client.walletReformer || 0) - amount, 0);
        else if (category === "MAT") client.walletMAT = Math.max((client.walletMAT || 0) - amount, 0);
        else if (category === "PSM") client.walletPSM = Math.max((client.walletPSM || 0) - amount, 0);
        else return res.status(400).json({ error: "Categoria non valida" });

        client.transactions.push({
            type: "remove",
            amount,
            category,
            description: `Rimossi ${amount} crediti da ${category}`,
        });

        await client.save();
        res.status(200).json({ message: "Crediti rimossi con successo!", client });
    } catch (err) {
        console.error("Errore nella rimozione crediti:", err);
        res.status(500).json({ error: err.message });
    }
});
// Aggiorna la data di scadenza del certificato medico di un cliente
app.put("/api/clients/:id/certificato-scadenza", async (req, res) => {
    try {
        const { certificatoScadenza } = req.body;
        if (!certificatoScadenza) {
            return res.status(400).json({ error: "Data di scadenza mancante" });
        }

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: "Cliente non trovato" });
        }

        client.certificatoScadenza = new Date(certificatoScadenza);
        await client.save();

        res.status(200).json({ message: "Data di scadenza aggiornata con successo", client });
    } catch (err) {
        console.error("Errore nell'aggiornamento della scadenza del certificato:", err);
        res.status(500).json({ error: err.message });
    }
});

// Elimina cliente
app.delete("/api/clients/:id", async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });
        res.status(200).json({ message: "Cliente eliminato con successo!" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Associa RFID a cliente
app.post("/api/clients/:id/rfid", async (req, res) => {
    try {
        const { rfidUID } = req.body;
        if (!rfidUID) return res.status(400).json({ error: "Codice RFID mancante" });

        const existingClient = await Client.findOne({ rfidUID });
        if (existingClient && existingClient._id.toString() !== req.params.id) {
            return res.status(400).json({ error: "RFID già associato a un altro cliente" });
        }

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        client.rfidUID = rfidUID;
        await client.save();

        res.status(200).json({ message: "Scheda RFID associata con successo", client });
    } catch (err) {
        console.error("Errore nell'associazione del codice RFID:", err);
        res.status(500).json({ error: err.message });
    }
});

// Elimina codice RFID da cliente
app.delete("/api/clients/:id/rfid", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        client.rfidUID = null;
        await client.save();

        res.status(200).json({ message: "Codice RFID eliminato con successo", client });
    } catch (err) {
        console.error("Errore nell'eliminazione del codice RFID:", err);
        res.status(500).json({ error: err.message });
    }
});

// Prenotazioni cliente
app.post("/api/clients/:id/reservations", async (req, res) => {
    try {
        const { date, type } = req.body;
        if (!date || !type) return res.status(400).json({ error: "Data e tipo obbligatori" });

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        client.reservations.push({ date, type });
        await client.save();

        res.status(201).json({ message: "Prenotazione aggiunta con successo", reservations: client.reservations });
    } catch (err) {
        console.error("Errore nell'aggiunta della prenotazione:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/clients/:id/reservations", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });
        res.status(200).json(client.reservations);
    } catch (err) {
        console.error("Errore nel recupero delle prenotazioni:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/clients/:id/reservations/:reservationId", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Cliente non trovato" });

        client.reservations = client.reservations.filter(
            (r) => r._id.toString() !== req.params.reservationId
        );
        await client.save();

        res.status(200).json({ message: "Prenotazione cancellata con successo", reservations: client.reservations });
    } catch (err) {
        console.error("Errore nella cancellazione della prenotazione:", err);
        res.status(500).json({ error: err.message });
    }
});

/** ROTTE LEZIONI **/

// Crea nuova lezione
app.post("/api/lessons", async (req, res) => {
    try {
        const { title, date, maxSeats, category } = req.body;
        const lesson = new Lesson({ title, date, maxSeats, category, bookedSeats: 0 });
        await lesson.save();
        res.status(201).json(lesson);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lista lezioni
app.get("/api/lessons", async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ date: 1 });
        res.status(200).json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** ROTTE PRENOTAZIONI **/

// Prenota lezione
app.post("/api/bookings", async (req, res) => {
    try {
        const { clientId, lessonId } = req.body;

        const client = await Client.findById(clientId);
        const lesson = await Lesson.findById(lessonId);

        if (!client || !lesson) return res.status(404).json({ error: "Cliente o lezione non trovati" });

        if (lesson.bookedSeats >= lesson.maxSeats) return res.status(400).json({ error: "Nessun posto disponibile" });

        // Verifica crediti
        let walletField = "";
        if (lesson.category === "Reformer") walletField = "walletReformer";
        else if (lesson.category === "MAT") walletField = "walletMAT";
        else if (lesson.category === "PSM") walletField = "walletPSM";

        if ((client[walletField] || 0) <= 0) return res.status(400).json({ error: "Crediti insufficienti" });

        // Scala credito e aggiorna posti
        client[walletField] -= 1;
        lesson.bookedSeats += 1;

        await client.save();
        await lesson.save();

        const booking = new Booking({
            client: client._id,
            lesson: lesson._id,
            date: lesson.date
        });
        await booking.save();

        res.status(201).json({ message: "Prenotazione confermata", booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Annulla prenotazione
app.delete("/api/bookings/:id", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("lesson").populate("client");
        if (!booking) return res.status(404).json({ error: "Prenotazione non trovata" });

        let walletField = "";
        if (booking.lesson.category === "Reformer") walletField = "walletReformer";
        else if (booking.lesson.category === "MAT") walletField = "walletMAT";
        else if (booking.lesson.category === "PSM") walletField = "walletPSM";

        booking.client[walletField] += 1;
        booking.lesson.bookedSeats -= 1;

        await booking.client.save();
        await booking.lesson.save();
        await booking.deleteOne();

        res.status(200).json({ message: "Prenotazione annullata" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** ALTRI ROUTER **/

app.use(rfidStreamRouter);
app.use("/api/mobile", mobileAppRouter);

// Avvio server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server attivo su http://0.0.0.0:${PORT}`);
    console.log(`🌐 Accessibile in LAN su: http://<IP_DEL_PC>:${PORT}`);
});
