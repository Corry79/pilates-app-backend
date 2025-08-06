const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    date: { type: Date, required: true }
});

module.exports = mongoose.model("Booking", bookingSchema);
