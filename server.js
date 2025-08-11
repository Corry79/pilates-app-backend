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

// Aggiorna data di scadenza certificato di un cliente
app.patch('/api/clients/:id/cert-expiry', async (req, res) => {
  try {
    const { id } = req.params;
    const { certificatoScadenza } = req.body;

    if (!certificatoScadenza) {
      return res.status(400).json({ error: "Data di scadenza mancante" });
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { certificatoScadenza: new Date(certificatoScadenza) },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    res.json(client);
  } catch (error) {
    console.error("Errore nell'aggiornamento della scadenza certificato:", error);
    res.status(500).json({ error: error.message });
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

/** ROTTE LEZIONI **/

// Tutte le lezioni
app.get("/api/lessons", async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.status(200).json(lessons);
  } catch (err) {
    console.error("Errore nel recupero lezioni:", err);
    res.status(400).json({ error: err.message });
  }
});

// Aggiungi lezione
app.post("/api/lessons", async (req, res) => {
  try {
    const lesson = new Lesson(req.body);
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    console.error("Errore nell'aggiunta lezione:", err);
    res.status(400).json({ error: err.message });
  }
});

/** ROTTE PRENOTAZIONI **/

// Tutte le prenotazioni
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Errore nel recupero prenotazioni:", err);
    res.status(400).json({ error: err.message });
  }
});

// Aggiungi prenotazione
app.post("/api/bookings", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error("Errore nell'aggiunta prenotazione:", err);
    res.status(400).json({ error: err.message });
  }
});

// Router esterni
app.use("/api/rfid-stream", rfidStreamRouter);
app.use("/api/mobile-app", mobileAppRouter);

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
