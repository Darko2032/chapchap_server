// JavaScript pour l'interface d'administration CHAP-CHAP
// Variables globales
const commands = [];
const archivedCommands = [];
let currentCommandId = null;
let currentView = 'active';

// Fonction pour récupérer un cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Fonctions d'initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les archives du localStorage
    loadArchivedCommands();
    
    // Charger les commandes initiales
    fetchCommands();
    
    // Initialiser les écouteurs d'événements
    initializeEventListeners();
});

// Initialiser tous les écouteurs d'événements
function initializeEventListeners() {
    // Bouton de rafraîchissement
    document.getElementById('refresh-btn').addEventListener('click', fetchCommands);
    
    // Bouton d'exportation CSV
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // Bouton de basculement entre actives/archives
    document.getElementById('view-toggle').addEventListener('click', toggleView);
    
    // Filtres de commandes
    document.getElementById('all-filter').addEventListener('click', function() {
        setActiveFilter(this);
        displayCommands();
    });
    
    document.getElementById('pending-filter').addEventListener('click', function() {
        setActiveFilter(this);
        filterCommandsByStatus('En attente');
    });
    
    document.getElementById('in-progress-filter').addEventListener('click', function() {
        setActiveFilter(this);
        filterCommandsByStatus('En cours');
    });
    
    document.getElementById('validated-filter').addEventListener('click', function() {
        setActiveFilter(this);
        filterCommandsByStatus('Validée');
    });
    
    // Recherche
    document.getElementById('search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('search-input').value;
        searchCommands(searchTerm);
    });
    
    document.getElementById('search-input').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('search-input').value;
            searchCommands(searchTerm);
        }
    });
    
    // Bouton de sauvegarde du statut dans le modal
    document.getElementById('save-status-btn').addEventListener('click', function() {
        if (currentCommandId) {
            const newStatus = document.getElementById('status-selector').value;
            updateCommandStatus(currentCommandId, newStatus);
        }
    });
    
    // Bouton de suppression dans le modal
    document.getElementById('delete-command-btn').addEventListener('click', function() {
        if (currentCommandId) {
            deleteCommand(currentCommandId);
        }
    });
}

// Charger les commandes depuis l'API
function fetchCommands() {
    // Afficher le spinner
    document.getElementById('commands-container').innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3">Chargement des commandes...</p>
        </div>
    `;
    
    // Animation de l'icône de rafraîchissement
    const refreshIcon = document.querySelector('#refresh-btn i');
    refreshIcon.classList.add('refresh-animation');
    
    // Requête à l'API
    fetch(`${window.location.origin}/api/commandes`, {
        headers: {
            'Authorization': `Bearer ${getCookie('token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
    })
    .then(data => {
        commands.length = 0; // Vider le tableau existant
        commands.push(...data); // Ajouter les nouvelles données
        displayCommands();
        updateStatistics();
        
        // Arrêter l'animation
        refreshIcon.classList.remove('refresh-animation');
    })
    .catch(error => {
        console.error('Erreur:', error);
        displayError('Impossible de récupérer les commandes. Vérifiez la connexion au serveur.');
        
        // Arrêter l'animation
        refreshIcon.classList.remove('refresh-animation');
    });
}

// Charger les commandes archivées
function loadArchivedCommands() {
    const saved = localStorage.getItem('chapchap_archived_commands');
    if (saved) {
        try {
            archivedCommands = JSON.parse(saved);
        } catch (e) {
            console.error('Erreur lors du chargement des archives:', e);
            archivedCommands = [];
        }
    }
}

// Sauvegarder les commandes archivées
function saveArchivedCommands() {
    localStorage.setItem('chapchap_archived_commands', JSON.stringify(archivedCommands));
}

// Afficher les commandes
function displayCommands() {
    const container = document.getElementById('commands-container');
    container.innerHTML = '';
    
    const dataToDisplay = currentView === 'active' ? commands : archivedCommands;
    
    // Cas où il n'y a pas de commandes
    if (!dataToDisplay || dataToDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Aucune commande ${currentView === 'active' ? 'active' : 'archivée'}</h4>
            </div>
        `;
        return;
    }
    
    // Afficher chaque commande
    dataToDisplay.forEach(command => {
        const card = createCommandCard(command);
        container.appendChild(card);
    });
}

// Créer une carte pour une commande
function createCommandCard(command) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    const statusClass = getStatusClass(command.statut);
    const operatorClass = getOperatorClass(command.reseau);
    
    col.innerHTML = `
        <div class="card command-card h-100" data-id="${command.id}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div class="operator-circle ${operatorClass}">
                    ${command.reseau ? command.reseau.charAt(0) : 'U'}
                </div>
                <span class="status-badge ${statusClass}">${command.statut || 'En attente'}</span>
            </div>
            <div class="card-body">
                <h5 class="card-title">${command.numero || 'N/A'}</h5>
                <p class="card-text">
                    <strong>Montant:</strong> ${command.montant || '0'} FCFA<br>
                    <strong>Date:</strong> ${formatDate(command.date)}<br>
                    ${command.type === 'Forfait' ? `<strong>Forfait:</strong> ${command.forfait || 'N/A'}<br>` : ''}
                </p>
            </div>
            <div class="card-footer text-muted d-flex justify-content-between">
                <small>ID: ${command.id.substring(0, 8)}...</small>
                <small>${timeAgo(command.date)}</small>
            </div>
        </div>
    `;
    
    // Ajouter l'écouteur d'événements pour afficher les détails
    col.querySelector('.command-card').addEventListener('click', function() {
        showCommandDetails(command.id);
    });
    
    return col;
}

// Filtrer les commandes par statut
function filterCommandsByStatus(status) {
    const container = document.getElementById('commands-container');
    container.innerHTML = '';
    
    const dataToFilter = currentView === 'active' ? commands : archivedCommands;
    const filtered = dataToFilter.filter(cmd => cmd.statut === status);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Aucune commande "${status}"</h4>
                <p class="text-muted">Aucune commande avec ce statut n'a été trouvée</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(command => {
        const card = createCommandCard(command);
        container.appendChild(card);
    });
}

// Rechercher des commandes
function searchCommands(term) {
    if (!term.trim()) {
        displayCommands();
        return;
    }
    
    const container = document.getElementById('commands-container');
    container.innerHTML = '';
    
    const searchTerm = term.toLowerCase();
    const dataToSearch = currentView === 'active' ? commands : archivedCommands;
    
    const results = dataToSearch.filter(cmd => 
        (cmd.numero && cmd.numero.toLowerCase().includes(searchTerm)) ||
        (cmd.reseau && cmd.reseau.toLowerCase().includes(searchTerm)) ||
        (cmd.id && cmd.id.toLowerCase().includes(searchTerm)) ||
        (cmd.numero_transaction && cmd.numero_transaction.toLowerCase().includes(searchTerm))
    );
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Aucun résultat</h4>
                <p class="text-muted">Aucune commande correspondant à "${term}" n'a été trouvée</p>
            </div>
        `;
        return;
    }
    
    results.forEach(command => {
        const card = createCommandCard(command);
        container.appendChild(card);
    });
}

// Afficher les détails d'une commande
function showCommandDetails(id) {
    currentCommandId = id;
    
    // Trouver la commande
    const command = findCommandById(id);
    if (!command) {
        alert('Commande non trouvée');
        return;
    }
    
    // Remplir le modal avec les détails
    document.getElementById('modal-id').textContent = command.id;
    document.getElementById('modal-reseau').textContent = command.reseau || 'N/A';
    document.getElementById('modal-type').textContent = command.type || 'N/A';
    document.getElementById('modal-numero').textContent = command.numero || 'N/A';
    document.getElementById('modal-montant').textContent = `${command.montant || '0'} FCFA`;
    document.getElementById('modal-frais').textContent = `${command.frais || '0'} FCFA`;
    document.getElementById('modal-total').textContent = `${command.total || command.montant || '0'} FCFA`;
    document.getElementById('modal-numero-transaction').textContent = command.numero_transaction || 'N/A';
    document.getElementById('modal-date').textContent = formatDate(command.date);
    
    // Gérer l'affichage du forfait
    if (command.type === 'Forfait' && command.forfait) {
        document.getElementById('forfait-container').style.display = 'block';
        document.getElementById('modal-forfait').textContent = command.forfait;
    } else {
        document.getElementById('forfait-container').style.display = 'none';
    }
    
    // Afficher le statut
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.textContent = command.statut || 'En attente';
    statusBadge.className = 'status-badge ' + getStatusClass(command.statut);
    
    // Afficher la date du statut
    document.getElementById('modal-statut-date').textContent = 
        command.statut_date ? formatDate(command.statut_date) : formatDate(command.date);
    
    // Sélectionner le statut dans le menu déroulant
    const statusSelector = document.getElementById('status-selector');
    for (let i = 0; i < statusSelector.options.length; i++) {
        if (statusSelector.options[i].value === command.statut) {
            statusSelector.selectedIndex = i;
            break;
        }
    }
    
    // Modifier le bouton de suppression selon la vue
    const deleteButton = document.getElementById('delete-command-btn');
    if (currentView === 'archive') {
        deleteButton.textContent = 'Supprimer définitivement';
    } else {
        deleteButton.textContent = 'Archiver';
    }
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('commandModal'));
    modal.show();
}

// Trouver une commande par ID
function findCommandById(id) {
    // Chercher dans les commandes actives
    let command = commands.find(cmd => cmd.id === id);
    
    // Si non trouvé, chercher dans les archives
    if (!command) {
        command = archivedCommands.find(cmd => cmd.id === id);
    }
    
    return command;
}

// Mettre à jour le statut d'une commande
function updateCommandStatus(id, newStatus) {
    // Si nous sommes en vue archives, mettre à jour localement
    if (currentView === 'archive') {
        const index = archivedCommands.findIndex(cmd => cmd.id === id);
        if (index !== -1) {
            archivedCommands[index].statut = newStatus;
            archivedCommands[index].statut_date = new Date().toISOString();
            saveArchivedCommands();
            
            // Fermer le modal et rafraîchir l'affichage
            bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
            displayCommands();
            updateStatistics();
            
            // Notification
            showToast(`Statut mis à jour : ${newStatus}`);
        }
        return;
    }
    
    // Tenter de mettre à jour via l'API
    fetch(`${window.location.origin}/api/commandes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({ statut: newStatus })
    })
    .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        return response.json();
    })
    .then(data => {
        // Mettre à jour localement
        const index = commands.findIndex(cmd => cmd.id === id);
        if (index !== -1) {
            commands[index] = data;
        }
        
        // Fermer le modal et rafraîchir
        bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
        displayCommands();
        updateStatistics();
        
        // Notification
        showToast(`Statut mis à jour : ${newStatus}`);
    })
    .catch(error => {
        console.error('Erreur de mise à jour:', error);
        
        // Notification d'erreur
        showToast('Erreur de mise à jour du statut', 'error');
    });
}

// Supprimer ou archiver une commande
function deleteCommand(id) {
    // Confirmation
    if (!confirm(currentView === 'archive' 
        ? 'Supprimer définitivement cette commande ?' 
        : 'Archiver cette commande ?')) {
        return;
    }
    
    // Si nous sommes en vue archives, supprimer définitivement
    if (currentView === 'archive') {
        const index = archivedCommands.findIndex(cmd => cmd.id === id);
        if (index !== -1) {
            archivedCommands.splice(index, 1);
            saveArchivedCommands();
            
            // Fermer le modal et rafraîchir
            bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
            displayCommands();
            updateStatistics();
            
            // Notification
            showToast('Commande supprimée définitivement');
        }
        return;
    }
    
    // Si nous sommes en vue active, archiver d'abord puis supprimer de l'API
    const commandToArchive = commands.find(cmd => cmd.id === id);
    if (commandToArchive) {
        // Ajout aux archives
        archivedCommands.push(commandToArchive);
        saveArchivedCommands();
        
        // Suppression via l'API
        fetch(`${window.location.origin}/api/commandes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Mise à jour locale
            commands = commands.filter(cmd => cmd.id !== id);
            
            // Fermer le modal et rafraîchir
            bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
            displayCommands();
            updateStatistics();
            
            // Notification
            showToast('Commande archivée avec succès');
        })
        .catch(error => {
            console.error('Erreur de suppression:', error);
            
            // Notification d'erreur
            showToast('Erreur lors de l\'archivage', 'error');
        });
    }
}

// Basculer entre commandes actives et archives
function toggleView() {
    const button = document.getElementById('view-toggle');
    const pageTitle = document.getElementById('page-title');
    
    if (currentView === 'active') {
        currentView = 'archive';
        button.innerHTML = '<i class="bi bi-list-task"></i> Voir commandes actives';
        pageTitle.textContent = 'Archives des commandes';
    } else {
        currentView = 'active';
        button.innerHTML = '<i class="bi bi-archive"></i> Voir archives';
        pageTitle.textContent = 'Liste des commandes';
    }
    
    displayCommands();
    updateStatistics();
}

// Exporter au format CSV
function exportToCSV() {
    const dataToExport = currentView === 'active' ? commands : archivedCommands;
    
    if (dataToExport.length === 0) {
        showToast('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Définir les en-têtes
    const headers = [
        'ID', 'Réseau', 'Type', 'Numéro', 'Montant', 'Frais', 'Total',
        'Transaction', 'Date', 'Forfait', 'Statut', 'Date de statut'
    ];
    
    // Préparer les lignes
    const rows = dataToExport.map(cmd => [
        cmd.id,
        cmd.reseau || '',
        cmd.type || '',
        cmd.numero || '',
        cmd.montant || '0',
        cmd.frais || '0',
        cmd.total || cmd.montant || '0',
        cmd.numero_transaction || '',
        formatDate(cmd.date),
        cmd.forfait || '',
        cmd.statut || 'En attente',
        cmd.statut_date ? formatDate(cmd.statut_date) : formatDate(cmd.date)
    ]);
    
    // Combiner en CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Créer le blob et le lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `chapchap_${currentView}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Mise à jour des statistiques
function updateStatistics() {
    const dataSource = currentView === 'active' ? commands : archivedCommands;
    
    // Total
    document.getElementById('total-count').textContent = dataSource.length;
    
    // En attente
    const pendingCount = dataSource.filter(cmd => cmd.statut === 'En attente').length;
    document.getElementById('pending-count').textContent = pendingCount;
    
    // En cours/Validées
    const inProgressCount = dataSource.filter(cmd => 
        cmd.statut === 'En cours' || cmd.statut === 'Validée'
    ).length;
    document.getElementById('validated-count').textContent = inProgressCount;
    
    // Effectuées
    const completedCount = dataSource.filter(cmd => cmd.statut === 'Effectuée').length;
    document.getElementById('completed-count').textContent = completedCount;
    
    // Annulées/Refusées
    const cancelledCount = dataSource.filter(cmd => 
        cmd.statut === 'Annulée' || cmd.statut === 'Refusée'
    ).length;
    document.getElementById('cancelled-count').textContent = cancelledCount;
}

// Activer un filtre
function setActiveFilter(element) {
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');
}

// Afficher un message d'erreur
function displayError(message) {
    const container = document.getElementById('commands-container');
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
            <h4 class="mt-3 text-danger">${message}</h4>
            <button class="btn btn-primary mt-3" onclick="fetchCommands()">
                <i class="bi bi-arrow-clockwise"></i> Réessayer
            </button>
        </div>
    `;
}

// Afficher un toast de notification
function showToast(message, type = 'success') {
    // Créer l'élément toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'warning'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Ajouter au conteneur
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        container.appendChild(toastEl);
    } else {
        toastContainer.appendChild(toastEl);
    }
    
    // Initialiser et afficher
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// Helpers
function getStatusClass(status) {
    if (!status) return 'status-en-attente';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('attente')) return 'status-en-attente';
    if (statusLower.includes('cours')) return 'status-en-cours';
    if (statusLower.includes('valid')) return 'status-validee';
    if (statusLower.includes('effectu')) return 'status-effectuee';
    if (statusLower.includes('annul')) return 'status-annulee';
    if (statusLower.includes('refus')) return 'status-refusee';
    
    return 'status-en-attente';
}

function getOperatorClass(operator) {
    if (!operator) return 'bg-secondary';
    
    const operatorLower = operator.toLowerCase();
    if (operatorLower.includes('orange')) return 'operator-orange';
    if (operatorLower.includes('mtn')) return 'operator-mtn';
    if (operatorLower.includes('moov')) return 'operator-moov';
    
    return 'bg-secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function timeAgo(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        
        if (diffSec < 60) return 'à l\'instant';
        if (diffMin < 60) return `il y a ${diffMin} min`;
        if (diffHour < 24) return `il y a ${diffHour} h`;
        if (diffDay < 30) return `il y a ${diffDay} j`;
        
        return formatDate(dateString);
    } catch (e) {
        return '';
    }
}

// Ajout d'un conteneur pour les toasts
document.addEventListener('DOMContentLoaded', function() {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
});
