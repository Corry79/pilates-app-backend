// Variabile globale per memorizzare l'ID del cliente selezionato
let selectedClientId = null;

// Funzione per aggiungere un cliente
async function addClient() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    if (!name || !email) {
        alert("Per favore, inserisci sia il nome che l'email!");
        return;
    }

    const newClient = { name, email };

    try {
        const response = await fetch("http://localhost:5000/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newClient),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Cliente aggiunto con successo!");
            document.getElementById("name").value = ""; // Resetta il campo nome
            document.getElementById("email").value = ""; // Resetta il campo email
            loadClients(); // Ricarica la lista dei clienti
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
        const response = await fetch("http://localhost:5000/api/clients");
        const clients = await response.json();

        console.log("📋 Clienti ricevuti:", clients);

        const clientList = document.getElementById("client-list");
        clientList.innerHTML = ""; // Pulisce la lista

        clients.forEach(client => {
            const clientDiv = document.createElement("div");
            clientDiv.classList.add("client-card");

            clientDiv.innerHTML = `
                <h2>${client.name}</h2>
                <p>Email: ${client.email}</p>
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

// Funzione per selezionare un cliente
function selectClient(clientId) {
    selectedClientId = clientId; // Salva l'ID del cliente selezionato

    // Rimuovi lo stato selezionato da tutti i pulsanti
    const allButtons = document.querySelectorAll(".select-client-button");
    allButtons.forEach(button => button.classList.remove("selected"));

    // Aggiungi lo stato selezionato al pulsante cliccato
    const button = document.querySelector(`.select-client-button[onclick="selectClient('${clientId}')"]`);
    if (button) {
        button.classList.add("selected");
    }

    alert(`Cliente selezionato con ID: ${clientId}`);
}

// Mostra il modulo per aggiungere crediti
function showAddCreditForm(clientId) {
    selectedClientId = clientId; // Salva l'ID del cliente selezionato

    // Trova il nome del cliente dalla lista
    const clientCard = document.querySelector(`.client-card button[onclick="showAddCreditForm('${clientId}')"]`).parentElement;
    const clientName = clientCard.querySelector("h2").textContent;

    // Mostra il modulo di inserimento crediti
    const creditForm = document.getElementById('credit-form');
    if (creditForm) {
        // Imposta il titolo con il nome del cliente
        const creditFormTitle = document.getElementById('credit-form-title');
        if (creditFormTitle) {
            creditFormTitle.textContent = `Gestione Crediti - ${clientName}`;
        }

        creditForm.style.display = 'block';

        // Configura i pulsanti per aggiungere crediti
        setupCreditButtonHandlers('add');

        // Configura i pulsanti per rimuovere crediti
        setupCreditButtonHandlers('remove');

        // Rimuovi eventuali eventi precedenti per evitare duplicati
        document.removeEventListener('click', closeCreditFormOnClickOutside);

        // Aggiungi un evento per chiudere il modulo cliccando fuori
        setTimeout(() => {
            document.addEventListener('click', closeCreditFormOnClickOutside);
        }, 0);
    } else {
        console.error("❌ Elemento con id 'credit-form' non trovato.");
    }
}

// Funzione per chiudere il modulo se si clicca fuori
function closeCreditFormOnClickOutside(event) {
    const creditForm = document.getElementById('credit-form');
    if (creditForm && !creditForm.contains(event.target)) {
        creditForm.style.display = 'none';
        document.removeEventListener('click', closeCreditFormOnClickOutside); // Rimuovi l'evento
        resetCreditForm(); // Resetta il modulo
    }
}

// Funzione per resettare il modulo
function resetCreditForm() {
    const creditAmountInput = document.getElementById('credit-amount');
    if (creditAmountInput) {
        creditAmountInput.value = ''; // Resetta il campo di input
    }
}

// Funzione per configurare i pulsanti per aggiungere o rimuovere crediti
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

// Funzione per gestire l'aggiunta o la rimozione dei crediti
async function handleCreditAction(category, action) {
    const amount = parseFloat(document.getElementById('credit-amount').value);

    if (isNaN(amount) || amount <= 0) {
        alert("Inserisci un importo valido!");
        return;
    }

    const actionDescription = action === 'add' ? 'Aggiunti' : 'Rimossi';
    const endpoint = action === 'add'
        ? `/add-credits`
        : `/remove-credits`;

    try {
        const response = await fetch(`http://localhost:5000/api/clients/${selectedClientId}${endpoint}`, {
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
            loadClients(); // Aggiorna la lista clienti

            // Chiudi automaticamente il modulo
            document.getElementById('credit-form').style.display = 'none'; // Chiude il modulo
            document.getElementById('credit-amount').value = ''; // Reset del campo
        } else {
            alert(`Errore: ${data.error}`);
        }
    } catch (error) {
        alert(`Errore nella richiesta: ${error.message}`);
    }
}

// Funzione per eliminare un cliente
async function deleteClient(clientId) {
    if (confirm("Sei sicuro di voler eliminare questo cliente?")) {
        try {
            const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                loadClients(); // Aggiorna la lista dopo l'eliminazione
            } else {
                alert("Errore: " + data.error);
            }
        } catch (error) {
            console.error("Errore nell'eliminazione del cliente:", error);
            alert("Errore nell'eliminazione del cliente.");
        }
    }
}

// Funzione per associare un badge RFID a un cliente
function associateRFIDPrompt(clientId) {
    const rfidUID = prompt("Inserisci il codice RFID del badge da associare:");
    if (rfidUID) {
        associateRFID(clientId, rfidUID);
    } else {
        alert("Codice RFID non inserito. Operazione annullata.");
    }
}

// Funzione per associare un badge RFID a un cliente
async function associateRFID(clientId, rfidUID) {
    if (!rfidUID) {
        alert("Codice RFID mancante. Inserisci un codice valido.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/clients/${clientId}/rfid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfidUID }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Badge RFID associato con successo!");
            loadClients(); // Aggiorna la lista dei clienti
        } else {
            alert("Errore nell'associazione del badge RFID: " + data.error);
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore nella richiesta di associazione RFID.");
    }
}

// Funzione per eliminare il codice RFID associato a un cliente
async function removeRFID(clientId) {
    if (confirm("Sei sicuro di voler eliminare il codice RFID associato a questo cliente?")) {
        try {
            const response = await fetch(`http://localhost:5000/api/clients/${clientId}/rfid`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                alert("Codice RFID eliminato con successo!");
                loadClients(); // Aggiorna la lista dei clienti
            } else {
                alert("Errore nell'eliminazione del codice RFID: " + data.error);
            }
        } catch (error) {
            console.error("Errore nella richiesta:", error);
            alert("Errore nella richiesta di eliminazione del codice RFID.");
        }
    }
}

// Funzione per ascoltare il codice RFID scansionato dal monitor seriale
function listenForRFID() {
    const eventSource = new EventSource("http://localhost:5000/rfid-stream"); // Endpoint per lo streaming RFID

    eventSource.onmessage = function (event) {
        const rfidCode = event.data.trim();
        displayScannedRFID(rfidCode); // Mostra il codice RFID scansionato
    };

    eventSource.onerror = function () {
        console.error("❌ Errore nello streaming RFID.");
        eventSource.close();
    };
}

// Funzione per mostrare il codice RFID scansionato
function displayScannedRFID(rfidCode) {
    console.log("📡 Codice RFID ricevuto:", rfidCode); // Log per debug
    const rfidDisplay = document.getElementById("scanned-rfid");
    if (rfidDisplay) {
        rfidDisplay.textContent = rfidCode; // Mostra il codice RFID scansionato
        rfidDisplay.style.color = "green"; // Cambia il colore del testo per evidenziare
    } else {
        console.error("❌ Elemento HTML per il codice RFID non trovato.");
    }
}

// Funzione per associare il badge RFID scansionato al cliente selezionato
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
        const response = await fetch(`http://localhost:5000/api/clients/${selectedClientId}/rfid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfidUID: rfidCode }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Badge RFID associato con successo!");
            loadClients(); // Aggiorna la lista dei clienti

            // Resetta il badge RFID scansionato
            const rfidDisplay = document.getElementById("scanned-rfid");
            if (rfidDisplay) {
                rfidDisplay.textContent = "Nessun badge scansionato";
                rfidDisplay.style.color = "black"; // Ripristina il colore del testo
            }
        } else {
            alert("Errore nell'associazione del badge RFID: " + data.error);
        }
    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore nella richiesta di associazione RFID.");
    }
}

// Configura gli eventi al caricamento della pagina
window.onload = function () {
    loadClients();

    // Aggiungi l'evento per il filtro della barra di ricerca
    document.getElementById("search-button").onclick = filterClients;

    // Avvia l'ascolto per il codice RFID scansionato
    listenForRFID();
};

// Funzione per filtrare i clienti in base alla barra di ricerca
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
