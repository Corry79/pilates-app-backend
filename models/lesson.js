const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Es. "Reformer", "MAT", "PSM"
    date: { type: Date, required: true },
    maxSeats: { type: Number, required: true }, // Posti totali disponibili
    bookedSeats: { type: Number, default: 0 }, // Posti già prenotati
    category: { type: String, enum: ["Reformer", "MAT", "PSM"], required: true }
});

module.exports = mongoose.model("Lesson", lessonSchema);
