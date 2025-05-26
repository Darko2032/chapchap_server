// Configuration de l'API
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:3000` 
    : '';

// Vérification de l'authentification
function checkAuth() {
    const token = getCookie('token');
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return token;
}

// Récupérer un cookie par son nom
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Déconnexion
function logout() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = '/admin/login.html';
}

// Éléments DOM
const commandsContainer = document.getElementById('commands-container');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterBtns = {
    all: document.getElementById('all-filter'),
    pending: document.getElementById('pending-filter'),
    inProgress: document.getElementById('in-progress-filter'),
    validated: document.getElementById('validated-filter')
};
const statusBadgeEl = document.getElementById('modal-status-badge');
const statusSelector = document.getElementById('status-selector');
const saveStatusBtn = document.getElementById('save-status-btn');
const deleteCommandBtn = document.getElementById('delete-command-btn');
const commandModal = new bootstrap.Modal(document.getElementById('commandModal'));

// État de l'application
let commands = [];
let currentCommandId = null;
let currentFilter = 'all';
let searchTerm = '';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    const token = checkAuth();
    if (!token) return;
    
    fetchCommands();
    setupEventListeners();
    
    // Ajouter lien de déconnexion
    const navbarNav = document.getElementById('navbarNav');
    const logoutLink = document.createElement('li');
    logoutLink.className = 'nav-item';
    logoutLink.innerHTML = `
        <a class="nav-link" href="#" id="logout-btn">
            <i class="bi bi-box-arrow-right me-1"></i> Déconnexion
        </a>
    `;
    navbarNav.querySelector('ul').appendChild(logoutLink);
    document.getElementById('logout-btn').addEventListener('click', logout);
});

// Configuration des événements
function setupEventListeners() {
    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('refresh-animation');
        fetchCommands().finally(() => {
            setTimeout(() => icon.classList.remove('refresh-animation'), 500);
        });
    });

    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.toLowerCase();
        renderCommands();
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchTerm = searchInput.value.toLowerCase();
            renderCommands();
        }
    });

    // Configuration des filtres
    Object.entries(filterBtns).forEach(([key, btn]) => {
        btn.addEventListener('click', () => {
            // Enlever la classe active de tous les boutons
            Object.values(filterBtns).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = key;
            renderCommands();
        });
    });

    // Enregistrer le changement de statut
    saveStatusBtn.addEventListener('click', () => {
        const newStatus = statusSelector.value;
        updateCommandStatus(currentCommandId, newStatus);
    });

    // Supprimer une commande
    deleteCommandBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) {
            deleteCommand(currentCommandId);
        }
    });
}

// Récupérer les commandes depuis l'API
async function fetchCommands() {
    try {
        commandsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-2">Chargement des commandes...</p>
            </div>
        `;

        const token = getCookie('token');
        const response = await fetch(`${API_URL}/api/commandes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Session expirée ou token invalide
            logout();
            return [];
        }
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        commands = await response.json();
        updateStatistics();
        renderCommands();
        
        return commands;
    } catch (error) {
        commandsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Erreur lors du chargement des commandes: ${error.message}
                </div>
                <button class="btn btn-primary mt-3" id="retry-btn">
                    <i class="bi bi-arrow-clockwise me-1"></i> Réessayer
                </button>
            </div>
        `;
        
        document.getElementById('retry-btn').addEventListener('click', fetchCommands);
        
        console.error('Erreur lors de la récupération des commandes:', error);
        return [];
    }
}

// Afficher les commandes
function renderCommands() {
    if (!commands.length) {
        commandsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Aucune commande trouvée
                </div>
            </div>
        `;
        return;
    }

    // Filtrer les commandes
    let filteredCommands = commands;

    // Appliquer le filtre de recherche
    if (searchTerm) {
        filteredCommands = filteredCommands.filter(cmd => 
            cmd.numero?.toLowerCase().includes(searchTerm) ||
            cmd.reseau?.toLowerCase().includes(searchTerm) ||
            cmd.numero_transaction?.toLowerCase().includes(searchTerm) ||
            cmd.id?.toLowerCase().includes(searchTerm)
        );
    }

    // Appliquer le filtre de statut
    if (currentFilter !== 'all') {
        const statusMap = {
            'pending': 'En attente',
            'inProgress': 'En cours',
            'validated': 'Validée'
        };
        
        filteredCommands = filteredCommands.filter(cmd => 
            cmd.statut === statusMap[currentFilter]
        );
    }

    if (!filteredCommands.length) {
        commandsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Aucune commande ne correspond aux critères de recherche
                </div>
            </div>
        `;
        return;
    }

    // Trier les commandes par date (la plus récente en premier)
    filteredCommands.sort((a, b) => {
        const dateA = new Date(a.date || '');
        const dateB = new Date(b.date || '');
        return dateB - dateA;
    });

    // Créer les cartes de commandes
    const commandCards = filteredCommands.map(cmd => createCommandCard(cmd)).join('');
    commandsContainer.innerHTML = commandCards;

    // Ajouter les événements aux cartes
    filteredCommands.forEach(cmd => {
        const card = document.getElementById(`command-${cmd.id}`);
        if (card) {
            card.addEventListener('click', () => showCommandDetails(cmd));
        }
    });
}

// Créer une carte de commande
function createCommandCard(cmd) {
    const { id, date, reseau, type, numero, montant, statut } = cmd;
    
    // Déterminer la classe CSS pour le badge de statut
    const statusClass = getStatusClass(statut);
    
    // Déterminer la classe CSS pour l'opérateur
    const operatorClass = getOperatorClass(reseau);
    
    // Formater la date
    const formattedDate = formatDate(date);
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card command-card" id="command-${id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="operator-circle ${operatorClass}">
                            ${reseau ? reseau.charAt(0).toUpperCase() : 'N/A'}
                        </div>
                        <span class="status-badge ${statusClass}">${statut || 'En attente'}</span>
                    </div>
                    <h5 class="card-title">${numero || 'N/A'}</h5>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted">${type || 'N/A'}</span>
                        <strong>${montant || '0'} FCFA</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <small class="text-muted">${formattedDate}</small>
                        <button class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-eye"></i> Détails
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Afficher les détails d'une commande
function showCommandDetails(cmd) {
    currentCommandId = cmd.id;
    
    // Remplir les champs du modal
    document.getElementById('modal-id').textContent = cmd.id || 'N/A';
    document.getElementById('modal-date').textContent = formatDate(cmd.date) || 'N/A';
    document.getElementById('modal-reseau').textContent = cmd.reseau || 'N/A';
    document.getElementById('modal-type').textContent = cmd.type || 'N/A';
    document.getElementById('modal-numero').textContent = cmd.numero || 'N/A';
    document.getElementById('modal-montant').textContent = `${cmd.montant || '0'} FCFA`;
    document.getElementById('modal-frais').textContent = `${cmd.frais || '0'} FCFA`;
    document.getElementById('modal-total').textContent = `${cmd.total || '0'} FCFA`;
    document.getElementById('modal-numero-transaction').textContent = cmd.numero_transaction || 'N/A';
    
    // Afficher le forfait si c'est une commande de type forfait
    const forfaitContainer = document.getElementById('forfait-container');
    if (cmd.type === 'Forfait' && cmd.forfait && cmd.forfait !== 'N/A') {
        forfaitContainer.style.display = 'block';
        document.getElementById('modal-forfait').textContent = cmd.forfait;
    } else {
        forfaitContainer.style.display = 'none';
    }
    
    // Afficher le statut actuel
    statusBadgeEl.textContent = cmd.statut || 'En attente';
    statusBadgeEl.className = `status-badge ${getStatusClass(cmd.statut)}`;
    document.getElementById('modal-statut-date').textContent = `Mis à jour le ${formatDate(cmd.statut_date || cmd.date)}`;
    
    // Sélectionner le statut actuel dans le sélecteur
    statusSelector.value = cmd.statut || 'En attente';
    
    // Afficher le modal
    commandModal.show();
}

// Mettre à jour le statut d'une commande
async function updateCommandStatus(id, newStatus) {
    try {
        const token = getCookie('token');
        const response = await fetch(`${API_URL}/api/commandes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ statut: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const updatedCommand = await response.json();
        
        // Mettre à jour la commande dans le tableau local
        const index = commands.findIndex(cmd => cmd.id === id);
        if (index !== -1) {
            // Fusionner la commande mise à jour avec la commande existante
            commands[index] = { ...commands[index], ...updatedCommand };
            
            // Mettre à jour la date de mise à jour du statut
            commands[index].statut_date = new Date().toISOString();
        }
        
        // Fermer le modal
        commandModal.hide();
        
        // Afficher un message de succès
        showAlert('success', `Le statut de la commande a été mis à jour avec succès à "${newStatus}".`);
        
        // Mettre à jour l'affichage
        updateStatistics();
        renderCommands();
        
        // Rafraîchir la liste complète des commandes depuis le serveur
        fetchCommands();
    } catch (error) {
        showAlert('danger', `Erreur lors de la mise à jour du statut: ${error.message}`);
        console.error('Erreur lors de la mise à jour du statut:', error);
    }
}

// Supprimer une commande
async function deleteCommand(id) {
    try {
        const token = getCookie('token');
        const response = await fetch(`${API_URL}/api/commandes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Supprimer la commande du tableau local
        commands = commands.filter(cmd => cmd.id !== id);
        
        // Fermer le modal
        commandModal.hide();
        
        // Afficher un message de succès
        showAlert('success', 'La commande a été supprimée avec succès.');
        
        // Mettre à jour l'affichage
        updateStatistics();
        renderCommands();
    } catch (error) {
        showAlert('danger', `Erreur lors de la suppression de la commande: ${error.message}`);
        console.error('Erreur lors de la suppression de la commande:', error);
    }
}

// Mettre à jour les statistiques
function updateStatistics() {
    const totalCount = commands.length;
    const pendingCount = commands.filter(cmd => cmd.statut === 'En attente').length;
    const validatedCount = commands.filter(cmd => cmd.statut === 'Validée').length;
    const completedCount = commands.filter(cmd => cmd.statut === 'Effectuée').length;
    const cancelledCount = commands.filter(cmd => 
        cmd.statut === 'Annulée' || cmd.statut === 'Refusée'
    ).length;
    
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('validated-count').textContent = validatedCount;
    document.getElementById('completed-count').textContent = completedCount;
    document.getElementById('cancelled-count').textContent = cancelledCount;
}

// Afficher une alerte
function showAlert(type, message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertContainer.style.zIndex = '9999';
    alertContainer.setAttribute('role', 'alert');
    
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
        alertContainer.classList.remove('show');
        setTimeout(() => alertContainer.remove(), 150);
    }, 5000);
}

// Utilitaires
function getStatusClass(status) {
    switch (status) {
        case 'En attente': return 'status-en-attente';
        case 'En cours': return 'status-en-cours';
        case 'Validée': return 'status-validee';
        case 'Effectuée': return 'status-effectuee';
        case 'Annulée': return 'status-annulee';
        case 'Refusée': return 'status-refusee';
        default: return 'status-en-attente';
    }
}

function getOperatorClass(operator) {
    switch (operator?.toLowerCase()) {
        case 'orange': return 'operator-orange';
        case 'mtn': return 'operator-mtn';
        case 'moov': return 'operator-moov';
        default: return 'bg-secondary';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString.substring(0, 16) || 'N/A';
    }
}
