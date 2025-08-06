const fetch = require('node-fetch');

const clientId = "22aa0a65-e34d-41eb-abc1-ab09dda5a938";
const baseUrl = "http://localhost:5000";

async function addCredits() {
  const response = await fetch(`${baseUrl}/api/clients/${clientId}/add-credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 5,
      category: "Reformer",
      description: "Credito iniziale per lezione Reformer"
    }),
  });
  const data = await response.json();
  console.log("Add credits response:", data);
}

async function createLesson() {
  const response = await fetch(`${baseUrl}/api/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Lezione di Reformer",
      description: "Allenamento mattutino",
      date: "2025-08-10T09:00:00.000Z",
      maxParticipants: 10
    }),
  });
  const lesson = await response.json();
  console.log("Created lesson:", lesson);
  return lesson._id;
}

async function bookLesson(lessonId) {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      lessonId
    }),
  });
  const data = await response.json();
  console.log("Booking response:", data);
}

(async () => {
  await addCredits();
  const lessonId = await createLesson();
  await bookLesson(lessonId);
})();
