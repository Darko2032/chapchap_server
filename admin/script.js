// Variables globales
let allCommands = [];
let archivedCommands = [];
let currentView = 'active'; // 'active' ou 'archive'

// Fonction exécutée au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les commandes
    fetchCommands();
    
    // Vérifier s'il y a des archives en localStorage
    loadArchives();
    
    // Configurer les écouteurs d'événements pour les boutons
    document.getElementById('view-toggle').addEventListener('click', toggleView);
    document.getElementById('delete-command-btn').addEventListener('click', deleteCurrentCommand);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // Initialiser l'écouteur pour le bouton de sauvegarde du statut
    document.getElementById('save-status-btn').addEventListener('click', function() {
        const newStatus = document.getElementById('status-selector').value;
        if (currentCommandId && newStatus) {
            updateCommandStatus(currentCommandId, newStatus);
        }
    });
});

// Charger les commandes archivées depuis le localStorage
function loadArchives() {
    const savedArchives = localStorage.getItem('chapchap_archived_commands');
    if (savedArchives) {
        archivedCommands = JSON.parse(savedArchives);
    }
}

// Sauvegarder les archives
function saveArchives() {
    localStorage.setItem('chapchap_archived_commands', JSON.stringify(archivedCommands));
}

// Récupérer les commandes depuis l'API
function fetchCommands() {
    fetch('/api/commandes')
        .then(response => response.json())
        .then(data => {
            allCommands = data;
            displayCommands();
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des commandes:', error);
            displayError('Impossible de récupérer les commandes. Vérifiez votre connexion au serveur.');
        });
}

// Afficher les commandes selon la vue actuelle
function displayCommands() {
    const commandsContainer = document.getElementById('commands-container');
    commandsContainer.innerHTML = '';
    
    const commandsToDisplay = currentView === 'active' ? allCommands : archivedCommands;
    
    if (commandsToDisplay.length === 0) {
        commandsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Aucune commande ${currentView === 'active' ? 'active' : 'archivée'}</h4>
            </div>
        `;
        return;
    }
    
    commandsToDisplay.forEach(command => {
        const card = createCommandCard(command);
        commandsContainer.appendChild(card);
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
                <span class="status-badge ${statusClass}">${command.statut}</span>
            </div>
            <div class="card-body">
                <h5 class="card-title">${command.numero}</h5>
                <p class="card-text">
                    <strong>Montant:</strong> ${command.montant} FCFA<br>
                    <strong>Date:</strong> ${formatDate(command.date)}<br>
                    ${command.type === 'Forfait' ? `<strong>Forfait:</strong> ${command.forfait}<br>` : ''}
                </p>
            </div>
            <div class="card-footer text-muted">
                <small>ID: ${command.id.substring(0, 8)}...</small>
            </div>
        </div>
    `;
    
    // Ajouter un écouteur d'événements pour afficher les détails
    col.querySelector('.command-card').addEventListener('click', function() {
        showCommandDetails(command.id);
    });
    
    return col;
}

// Obtenir la classe CSS pour un statut
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

// Obtenir la classe CSS pour un opérateur
function getOperatorClass(operator) {
    if (!operator) return 'bg-secondary';
    
    const operatorLower = operator.toLowerCase();
    if (operatorLower.includes('orange')) return 'bg-orange';
    if (operatorLower.includes('mtn')) return 'bg-yellow';
    if (operatorLower.includes('moov')) return 'bg-primary';
    
    return 'bg-secondary';
}

// Formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
}

// Variables pour le modal
let currentCommandId = null;

// Afficher les détails d'une commande
function showCommandDetails(commandId) {
    currentCommandId = commandId;
    
    // Trouver la commande dans la liste active ou archivée
    const command = findCommandById(commandId);
    
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
    document.getElementById('modal-total').textContent = `${command.total || '0'} FCFA`;
    document.getElementById('modal-transaction').textContent = command.numero_transaction || 'N/A';
    document.getElementById('modal-date').textContent = formatDate(command.date);
    document.getElementById('modal-forfait').textContent = command.forfait || 'N/A';
    
    // Gérer l'affichage du forfait
    if (command.type === 'Forfait' && command.forfait) {
        document.getElementById('forfait-container').style.display = 'block';
    } else {
        document.getElementById('forfait-container').style.display = 'none';
    }
    
    // Mettre à jour le statut dans le badge et dans le sélecteur
    const currentStatus = command.statut || 'En attente';
    document.getElementById('modal-statut').textContent = currentStatus;
    document.getElementById('modal-statut-date').textContent = command.statut_date ? formatDate(command.statut_date) : 'N/A';
    
    // Définir la couleur du statut
    const statusBadge = document.getElementById('modal-statut');
    statusBadge.className = 'status-badge ' + getStatusClass(currentStatus);
    
    // Sélectionner le statut actuel dans le dropdown
    const statusSelector = document.getElementById('status-selector');
    for (let i = 0; i < statusSelector.options.length; i++) {
        if (statusSelector.options[i].value === currentStatus) {
            statusSelector.selectedIndex = i;
            break;
        }
    }
    
    // Afficher ou masquer le bouton de suppression selon la vue
    const deleteButton = document.getElementById('delete-command-btn');
    if (currentView === 'archive') {
        deleteButton.textContent = 'Supprimer définitivement';
    } else {
        deleteButton.textContent = 'Archiver';
    }
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('commandModal'));
    modal.show();
}

// Trouver une commande par ID
function findCommandById(commandId) {
    // Chercher dans les commandes actives
    let command = allCommands.find(cmd => cmd.id === commandId);
    
    // Si non trouvé, chercher dans les archives
    if (!command) {
        command = archivedCommands.find(cmd => cmd.id === commandId);
    }
    
    return command;
}

// Supprimer ou archiver la commande actuellement affichée
function deleteCurrentCommand() {
    if (!currentCommandId) return;
    
    if (currentView === 'archive') {
        // Suppression définitive d'une archive
        if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette commande archivée ?')) {
            const index = archivedCommands.findIndex(cmd => cmd.id === currentCommandId);
            if (index !== -1) {
                archivedCommands.splice(index, 1);
                saveArchives();
                bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
                displayCommands();
            }
        }
    } else {
        // Archivage d'une commande active
        if (confirm('Archiver cette commande ? Elle sera toujours accessible dans les archives.')) {
            const index = allCommands.findIndex(cmd => cmd.id === currentCommandId);
            if (index !== -1) {
                const command = allCommands[index];
                
                // Ajouter aux archives
                archivedCommands.push(command);
                saveArchives();
                
                // Supprimer de l'API
                fetch(`/api/commandes/${currentCommandId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        // Supprimer de la liste locale
                        allCommands.splice(index, 1);
                        bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
                        displayCommands();
                    } else {
                        alert('Erreur lors de la suppression de la commande');
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    alert('Erreur lors de la suppression de la commande');
                });
            }
        }
    }
}

// Basculer entre les vues actives et archives
function toggleView() {
    const button = document.getElementById('view-toggle');
    
    if (currentView === 'active') {
        currentView = 'archive';
        button.innerHTML = '<i class="bi bi-list-task"></i> Voir commandes actives';
        document.getElementById('page-title').textContent = 'Archives des commandes';
    } else {
        currentView = 'active';
        button.innerHTML = '<i class="bi bi-archive"></i> Voir archives';
        document.getElementById('page-title').textContent = 'Gestion des commandes';
    }
    
    displayCommands();
}

// Mettre à jour le statut d'une commande
function updateCommandStatus(commandId, newStatus) {
    // Si on est en mode archive ou si le serveur n'est pas disponible, mettre à jour localement
    if (currentView === 'archive') {
        const commandIndex = archivedCommands.findIndex(cmd => cmd.id === commandId);
        if (commandIndex !== -1) {
            archivedCommands[commandIndex].statut = newStatus;
            archivedCommands[commandIndex].statut_date = new Date().toISOString();
            saveArchives();
            bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
            displayCommands();
            alert(`Statut mis à jour : ${newStatus}`);
        }
        return;
    }

    // Essayer de mettre à jour sur le serveur
    fetch(`/api/commandes/${commandId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur API');
        }
        return response.json();
    })
    .then(data => {
        // Mettre à jour la commande dans la liste
        const commandIndex = allCommands.findIndex(cmd => cmd.id === commandId);
        if (commandIndex !== -1) {
            allCommands[commandIndex].statut = newStatus;
            allCommands[commandIndex].statut_date = new Date().toISOString();
        }
        
        // Fermer le modal et rafraîchir l'affichage
        bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
        displayCommands();
        
        // Afficher une notification
        alert(`Statut mis à jour : ${newStatus}`);
    })
    .catch(error => {
        console.error('Erreur:', error);
        
        // Vérifier si c'est juste un problème de serveur et mettre à jour localement
        const commandIndex = allCommands.findIndex(cmd => cmd.id === commandId);
        if (commandIndex !== -1) {
            allCommands[commandIndex].statut = newStatus;
            allCommands[commandIndex].statut_date = new Date().toISOString();
            
            // Essayer de sauvegarder dans le localStorage
            try {
                const prefs = localStorage.getItem('chapchap_commandes');
                let localCommandes = prefs ? JSON.parse(prefs) : [];
                
                const localIndex = localCommandes.findIndex(cmd => cmd.id === commandId);
                if (localIndex !== -1) {
                    localCommandes[localIndex].statut = newStatus;
                    localCommandes[localIndex].statut_date = new Date().toISOString();
                    localStorage.setItem('chapchap_commandes', JSON.stringify(localCommandes));
                }
            } catch (e) {
                console.error('Erreur localStorage:', e);
            }
            
            bootstrap.Modal.getInstance(document.getElementById('commandModal')).hide();
            displayCommands();
            alert(`Statut mis à jour localement : ${newStatus}\n(Le serveur n'est pas accessible)`); 
        } else {
            alert('Erreur lors de la mise à jour du statut');
        }
    });
}

// Exporter les données au format CSV
function exportToCSV() {
    // Déterminer quelles données exporter
    const dataToExport = currentView === 'active' ? allCommands : archivedCommands;
    
    // Définir les entêtes du CSV
    const headers = [
        'ID', 'Réseau', 'Type', 'Numéro', 'Montant', 'Frais', 'Total',
        'N° Transaction', 'Date', 'Forfait', 'Statut', 'Date Statut'
    ];
    
    // Créer les lignes de données
    const rows = dataToExport.map(cmd => [
        cmd.id,
        cmd.reseau || '',
        cmd.type || '',
        cmd.numero || '',
        cmd.montant || '0',
        cmd.frais || '0',
        cmd.total || '0',
        cmd.numero_transaction || '',
        cmd.date || '',
        cmd.forfait || '',
        cmd.statut || 'En attente',
        cmd.statut_date || cmd.date || ''
    ]);
    
    // Combiner les entêtes et les lignes
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Créer un objet Blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `chapchap_commandes_${currentView}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
