// Imposta automaticamente l'URL base in base all'ambiente
const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://pilates-app-backend.onrender.com";

// Variabile globale per memorizzare l'ID del cliente selezionato
let selectedClientId = null;

// Funzione per aggiungere un cliente
async function addClient() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const certExpiry = document.getElementById("cert-expiry").value;


    if (!name || !email || !certExpiry) {
        alert("Per favore, inserisci sia il nome che l'email e data di scadenza certificato!");
        return;
    }

    const newClient = { name, email, certExpiry };

    try {
        const response = await fetch(`${API_BASE_URL}/api/clients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newClient),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cliente aggiunto con successo!");
            document.getElementById("name").value = "";
            document.getElementById("email").value = "";
            loadClients();
        } else {
            alert("Errore nell'aggiunta del cliente: " + data.error);
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore nella richiesta di aggiunta cliente.");
    }
}

// Funzione per caricare i clienti e mostrarli nella lista
async function loadClients() {
    console.log("🔄 Caricamento clienti...");

    try {
        const response = await fetch(`${API_BASE_URL}/api/clients`);
        const clients = await response.json();

        console.log("📋 Clienti ricevuti:", clients);

        const clientList = document.getElementById("client-list");
        clientList.innerHTML = "";

        clients.forEach(client => {
            const clientDiv = document.createElement("div");
            clientDiv.classList.add("client-card");

            clientDiv.innerHTML = `
                <h2>${client.name}</h2>
                <p>Email: ${client.email}</p>
                <p>Scadenza Certificato: <strong>${client.certificatoScadenza ? new Date(client.certificatoScadenza).toLocaleDateString() : 'Non specificata'}</strong></p>


                <p>Saldo Reformer: <strong>${client.walletReformer || 0}</strong> crediti</p>
                <p>Saldo MAT: <strong>${client.walletMAT || 0}</strong> crediti</p>
                <p>Saldo PSM: <strong>${client.walletPSM || 0}</strong> crediti</p>
                <p>RFID: <strong>${client.rfidUID || 'Non disponibile'}</strong></p>
                <button class="select-client-button" onclick="selectClient('${client._id}')">Seleziona Cliente</button>
                <button class="associate-rfid-button" onclick="associateRFIDPrompt('${client._id}')">Associa Badge</button>
                <button class="add-credit-button" onclick="showAddCreditForm('${client._id}')">Crediti</button>
                <button class="delete-button" onclick="deleteClient('${client._id}')">Elimina Cliente</button>
                <button class="remove-rfid-button" onclick="removeRFID('${client._id}')">Elimina Badge</button>
            `;

            clientList.appendChild(clientDiv);
        });
    } catch (error) {
        console.error("❌ Errore nel caricamento clienti:", error);
        alert("Errore nel caricamento dei clienti.");
    }
}

function selectClient(clientId) {
    selectedClientId = clientId;
    const allButtons = document.querySelectorAll(".select-client-button");
    allButtons.forEach(button => button.classList.remove("selected"));
    const button = document.querySelector(`.select-client-button[onclick="selectClient('${clientId}')"]`);
    if (button) button.classList.add("selected");
    alert(`Cliente selezionato con ID: ${clientId}`);
}

function showAddCreditForm(clientId) {
    selectedClientId = clientId;
    const clientCard = document.querySelector(`.client-card button[onclick="showAddCreditForm('${clientId}')"]`).parentElement;
    const clientName = clientCard.querySelector("h2").textContent;

    const creditForm = document.getElementById('credit-form');
    if (creditForm) {
        const creditFormTitle = document.getElementById('credit-form-title');
        if (creditFormTitle) {
            creditFormTitle.textContent = `Gestione Crediti - ${clientName}`;
        }
        creditForm.style.display = 'block';
        setupCreditButtonHandlers('add');
        setupCreditButtonHandlers('remove');
        document.removeEventListener('click', closeCreditFormOnClickOutside);
        setTimeout(() => {
            document.addEventListener('click', closeCreditFormOnClickOutside);
        }, 0);
    } else {
        console.error("❌ Elemento con id 'credit-form' non trovato.");
    }
}

function closeCreditFormOnClickOutside(event) {
    const creditForm = document.getElementById('credit-form');
    if (creditForm && !creditForm.contains(event.target)) {
        creditForm.style.display = 'none';
        document.removeEventListener('click', closeCreditFormOnClickOutside);
        resetCreditForm();
    }
}

function resetCreditForm() {
    const creditAmountInput = document.getElementById('credit-amount');
    if (creditAmountInput) {
        creditAmountInput.value = '';
    }
}

function setupCreditButtonHandlers(action) {
    const actions = ['Reformer', 'MAT', 'PSM'];
    actions.forEach(category => {
        const buttonId = action === 'add'
            ? `add-credit-${category.toLowerCase()}`
            : `remove-credit-${category.toLowerCase()}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = function () {
                handleCreditAction(category, action);
            };
        } else {
            console.error(`❌ Pulsante con id '${buttonId}' non trovato.`);
        }
    });
}

async function handleCreditAction(category, action) {
    const amount = parseFloat(document.getElementById('credit-amount').value);

    if (isNaN(amount) || amount <= 0) {
        alert("Inserisci un importo valido!");
        return;
    }

    const actionDescription = action === 'add' ? 'Aggiunti' : 'Rimossi';
    const endpoint = action === 'add' ? `/add-credits` : `/remove-credits`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/clients/${selectedClientId}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                category,
                description: `${actionDescription} ${amount} crediti ${category}`
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`${actionDescription} ${amount} crediti ${category} con successo!`);
            loadClients();
            document.getElementById('credit-form').style.display = 'none';
            document.getElementById('credit-amount').value = '';
        } else {
            alert(`Errore: ${data.error}`);
        }
    } catch (error) {
        alert(`Errore nella richiesta: ${error.message}`);
    }
}

async function deleteClient(clientId) {
    if (confirm("Sei sicuro di voler eliminare questo cliente?")) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                loadClients();
            } else {
                alert("Errore: " + data.error);
            }
        } catch (error) {
            console.error("Errore nell'eliminazione del cliente:", error);
            alert("Errore nell'eliminazione del cliente.");
        }
    }
}

function associateRFIDPrompt(clientId) {
    const rfidUID = prompt("Inserisci il codice RFID del badge da associare:");
    if (rfidUID) {
        associateRFID(clientId, rfidUID);
    } else {
        alert("Codice RFID non inserito. Operazione annullata.");
    }
}

async function associateRFID(clientId, rfidUID) {
    if (!rfidUID) {
        alert("Codice RFID mancante. Inserisci un codice valido.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/rfid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfidUID }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Badge RFID associato con successo!");
            loadClients();
        } else {
            alert("Errore nell'associazione del badge RFID: " + data.error);
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore nella richiesta di associazione RFID.");
    }
}

async function removeRFID(clientId) {
    if (confirm("Sei sicuro di voler eliminare il codice RFID associato a questo cliente?")) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/rfid`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                alert("Codice RFID eliminato con successo!");
                loadClients();
            } else {
                alert("Errore nell'eliminazione del codice RFID: " + data.error);
            }
        } catch (error) {
            console.error("Errore nella richiesta:", error);
            alert("Errore nella richiesta di eliminazione del codice RFID.");
        }
    }
}

function listenForRFID() {
    const eventSource = new EventSource(`${API_BASE_URL}/api/rfid`);
    eventSource.onmessage = function (event) {
        const rfidCode = event.data.trim();
        displayScannedRFID(rfidCode);
    };
    eventSource.onerror = function () {
        console.error("❌ Errore nello streaming RFID.");
        eventSource.close();
    };
}

function displayScannedRFID(rfidCode) {
    const rfidDisplay = document.getElementById("scanned-rfid");

    // Ignora il messaggio iniziale di connessione
    if (rfidCode === "Connesso al server RFID") {
        console.log("✅ Connessione al server RFID stabilita.");
        return;
    }

    console.log("📡 Codice RFID ricevuto:", rfidCode);

    if (rfidDisplay) {
        rfidDisplay.textContent = rfidCode;
        rfidDisplay.style.color = "green";
    } else {
        console.error("❌ Elemento HTML per il codice RFID non trovato.");
    }
}


async function associateScannedRFID() {
    if (!selectedClientId) {
        alert("Seleziona un cliente prima di associare un badge RFID.");
        return;
    }

    const rfidCode = document.getElementById("scanned-rfid").textContent.trim();
    if (!rfidCode || rfidCode === "Nessun badge scansionato") {
        alert("Nessun codice RFID scansionato.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/clients/${selectedClientId}/rfid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfidUID: rfidCode }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Badge RFID associato con successo!");
            loadClients();
            const rfidDisplay = document.getElementById("scanned-rfid");
            if (rfidDisplay) {
                rfidDisplay.textContent = "Nessun badge scansionato";
                rfidDisplay.style.color = "black";
            }
        } else {
            alert("Errore nell'associazione del badge RFID: " + data.error);
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore nella richiesta di associazione RFID.");
    }
}

window.onload = function () {
    loadClients();
    document.getElementById("search-button").onclick = filterClients;
    listenForRFID();
};

function filterClients() {
    const searchInput = document.getElementById("search-input").value.toLowerCase();
    const clientCards = document.querySelectorAll(".client-card");

    clientCards.forEach(card => {
        const name = card.querySelector("h2").textContent.toLowerCase();
        const email = card.querySelector("p").textContent.toLowerCase();
        if (name.includes(searchInput) || email.includes(searchInput)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}
