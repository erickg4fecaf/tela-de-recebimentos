// =======================================================
// PAINEL DE GERENCIAMENTO (APLICAÇÃO)
// ⚠️ SUBSTITUA A URL DA API OBTIDA DO GOOGLE APPS SCRIPT AQUI ⚠️
// =======================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyee7EW36K6Q-MoQT4rHQLxb8RUImec-7O_wNO_KA755uenMhdkMpO_RDYgCkv1xkM/exec"; 
// ------------------------------------------------

// --- Configurações de Mock ---
const MOCK_CREDENTIALS = { email: 'admin@helpcode.com', password: 'senha123' };
const mockUsersDB = [
    { name: 'Usuário Admin', email: 'admin@helpcode.com', password: 'senha123', role: 'admin', avatarUrl: 'https://via.placeholder.com/150' },
    { name: 'Atendente 1', email: 'atendente1@helpcode.com', password: 'senha123', role: 'atendente', avatarUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=A1' }
];
const mockChatDB = [
    { user: "Usuário Admin", text: "Olá equipe, vamos priorizar os chamados de Alta prioridade.", isMe: true, timestamp: Date.now() - 600000 },
    { user: "Atendente 1", text: "Certo! Estou no primeiro chamado.", isMe: false, timestamp: Date.now() - 300000 }
];


// --- Seleção de Elementos ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const detailsView = document.getElementById('details-view');
const reportsView = document.getElementById('reports-view');
const chatView = document.getElementById('chat-view');
const profileView = document.getElementById('profile-view');
const adminView = document.getElementById('admin-view');

const loginForm = document.getElementById('login-form');
const requestList = document.getElementById('requestList');
const filterButtons = document.querySelectorAll('.filter-btn');
const navButtons = document.querySelectorAll('.nav-buttons button');
const statusActionButtons = document.querySelectorAll('.status-btn');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name');
const userAvatarSmall = document.getElementById('user-avatar-small');
const profileBtn = document.getElementById('profile-btn');
const userAvatar = document.getElementById('user-avatar');
const profileNameInput = document.getElementById('profile-name');
const profileEmailInput = document.getElementById('profile-email');
const profileAvatarUrlInput = document.getElementById('profile-avatar-url');
const profileForm = document.getElementById('profile-form');
const profileMessage = document.getElementById('profile-message');
const countPending = document.getElementById('count-pending');
const countInprogress = document.getElementById('count-inprogress');
const countResolved = document.getElementById('count-resolved');
const chatMessagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input-text');
const sendChatBtn = document.getElementById('send-chat-btn');
const chartByType = document.getElementById('chart-by-type');
const chartByPriority = document.getElementById('chart-by-priority');
const avgResponseTimeDisplay = document.getElementById('avg-response-time');
const deleteRequestBtn = document.getElementById('delete-request-btn');
const userList = document.getElementById('user-list');
const addUserForm = document.getElementById('add-user-form');
const adminNavBtn = document.getElementById('nav-admin-btn');

let currentUser = null;
let currentFilters = { status: 'all', priority: 'all' };
let allRequests = []; 

// =======================================================
// Funções de Gerenciamento do Painel
// =======================================================

function switchView(view) {
    [loginView, dashboardView, detailsView, profileView, reportsView, chatView, adminView].forEach(v => v.classList.add('hidden-view'));
    [loginView, dashboardView, detailsView, profileView, reportsView, chatView, adminView].forEach(v => v.classList.remove('active-view'));

    if (view === 'login') {
        loginView.classList.remove('hidden-view');
        loginView.classList.add('active-view');
    } else if (view === 'dashboard') {
        dashboardView.classList.remove('hidden-view');
        dashboardView.classList.add('active-view');
    } else if (view === 'details') {
        detailsView.classList.remove('hidden-view');
        detailsView.classList.add('active-view');
    } else if (view === 'profile') {
        profileView.classList.remove('hidden-view');
        profileView.classList.add('active-view');
        showUserProfile();
    } else if (view === 'reports') {
        reportsView.classList.remove('hidden-view');
        reportsView.classList.add('active-view');
        renderReports();
    } else if (view === 'chat') {
        chatView.classList.remove('hidden-view');
        chatView.classList.add('active-view');
        renderChat();
    } else if (view === 'admin') {
        adminView.classList.remove('hidden-view');
        adminView.classList.add('active-view');
        renderAdminPanel();
    }
    
    // Atualiza o botão ativo na navegação
    navButtons.forEach(btn => btn.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${view}-btn`);
    if (navBtn) navBtn.classList.add('active');
}

function analyzeAndPrioritize(text) { 
    const keywordsAlta = ['emergência', 'socorro', 'acidente', 'perigo', 'ferido', 'assalto', 'fogo', 'sangue', 'desmaiou', 'urgente'];
    const normalizedText = text.toLowerCase();
    if (keywordsAlta.some(k => normalizedText.includes(k))) return 'Alta';
    return 'Média';
}

/**
 * Função principal para buscar e renderizar (Busca dados da API)
 */
async function fetchAndRenderRequests() {
    if (!currentUser) return;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Erro ao acessar a API do Google Sheet.");
        
        const data = await response.json();
        let requests = data.solicitacoes || []; 

        // Simulação de Priorização (IA Simples) e Formatação
        requests.forEach(req => { 
            // O Carimbo de data/hora (coluna A) é o ID
            req.id = req.data_recebimento; 
            req.prioridade = analyzeAndPrioritize(req.motivo || req.tipoApoio || '');
            req.status = req.status || 'Pendente'; 
            req.transcricao = req.motivo || req.localizacao || 'Chamado sem texto';
        });
        
        allRequests = requests;
        
        // Aplica os filtros e renderiza
        let filteredRequests = allRequests;
        if (currentFilters.status !== 'all') filteredRequests = filteredRequests.filter(req => req.status === currentFilters.value);
        if (currentFilters.priority !== 'all') filteredRequests = filteredRequests.filter(req => req.prioridade === currentFilters.value);

        renderRequests(filteredRequests); 
        updateDashboardStats();

    } catch (error) {
        console.error("Erro no fetch da API do Google Sheet:", error);
        requestList.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #dc3545; font-weight: bold;">Erro de conexão com a API. Verifique a URL e a Implementação do Apps Script.</p>';
    }
}

function renderRequests(requests) {
    requestList.innerHTML = '';
    if (requests.length === 0) { requestList.innerHTML = '<p>Nenhuma solicitação encontrada.</p>'; return; }
    requests.forEach(req => {
        const card = document.createElement('div');
        card.className = `request-card prioridade-${req.prioridade} status-${req.status.replace(/ /g, '-')}`;
        card.innerHTML = `<h3>${req.tipoApoio}</h3><p><strong>Local:</strong> ${req.localizacao}</p><p><strong>Status:</strong> <span class="status-badge ${req.status.replace(/ /g, '-')}">${req.status}</span></p>`;
        card.addEventListener('click', () => showRequestDetails(req));
        requestList.appendChild(card);
    });
}

function updateDashboardStats() {
    const pending = allRequests.filter(req => req.status === 'Pendente').length;
    const inprogress = allRequests.filter(req => req.status === 'Em andamento').length;
    const resolved = allRequests.filter(req => req.status === 'Resolvido').length;

    countPending.textContent = pending;
    countInprogress.textContent = inprogress;
    countResolved.textContent = resolved;
}

function showRequestDetails(req) {
    document.getElementById('modalTitle').textContent = req.tipoApoio; document.getElementById('modalId').textContent = `ID: ${req.id}`;
    document.getElementById('modalTipoApoio').textContent = req.tipoApoio; document.getElementById('modalData').textContent = new Date(req.data_recebimento).toLocaleString('pt-BR');
    document.getElementById('modalLocalizacao').textContent = req.localizacao; document.getElementById('modalTelefone').textContent = req.telefone || 'Não informado';
    document.getElementById('modalMotivo').textContent = req.motivo;
    document.getElementById('modalDeficiencia').textContent = req.detalhesDeficiencia.length > 0 ? req.detalhesDeficiencia.join(', ') : 'Não possui';
    document.getElementById('modalPrioridade').textContent = req.prioridade; document.getElementById('modalTranscricao').textContent = req.transcricao || 'Não há transcrição';
    
    document.querySelectorAll('.status-btn').forEach(btn => btn.onclick = () => updateRequestStatus(req.id, btn.getAttribute('data-status')));
    document.getElementById('delete-request-btn').onclick = () => deleteRequest(req.id);
    
    switchView('details');
}

function updateRequestStatus(id, newStatus) {
    // ⚠️ Em uma versão real, você faria um FETCH para o Google Apps Script para mudar o status na planilha
    alert(`Ação de status para o chamado ${id} enviada: ${newStatus}. (Necessita de API de escrita)`);
    fetchAndRenderRequests();
}

function deleteRequest(id) {
    if (confirm("Esta ação exige permissão de ADMIN. Tem certeza que deseja EXCLUIR este chamado?")) {
        // ⚠️ Em uma versão real, você faria um FETCH para o Google Apps Script para deletar a linha
        alert(`Ação de exclusão para o chamado ${id} enviada. (Necessita de API de escrita)`);
        fetchAndRenderRequests();
    }
}

function showUserProfile() {
    document.getElementById('profile-name').value = currentUser.name;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-avatar-url').value = currentUser.avatarUrl;
    document.getElementById('user-avatar').src = currentUser.avatarUrl;
    document.getElementById('profile-message').textContent = '';
    switchView('profile');
}

function updateUserProfile(e) {
    e.preventDefault();
    currentUser.name = document.getElementById('profile-name').value;
    currentUser.avatarUrl = document.getElementById('profile-avatar-url').value;

    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-avatar-small').src = currentUser.avatarUrl;
    document.getElementById('user-avatar').src = currentUser.avatarUrl;

    document.getElementById('profile-message').textContent = 'Perfil atualizado com sucesso!';
    setTimeout(() => document.getElementById('profile-message').textContent = '', 3000);
}

function renderReports() { 
    // Renderiza a lógica de relatórios (mock)
}
function renderChat() { 
    // Renderiza a lógica de chat (mock)
}
function renderAdminPanel() { 
    // Renderiza a lógica de admin (mock)
}
function addUser(e) { /* ... */ }
function deleteUser(e) { /* ... */ }
function sendChatMessage() { /* ... */ }


// =======================================================
// Lógica de Autenticação
// =======================================================

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value; 
    const password = document.getElementById('password').value;

    const user = mockUsersDB.find(u => u.email === email && u.password === password); 

    if (user) {
        currentUser = user;
        document.getElementById('user-name').textContent = currentUser.name; 
        document.getElementById('user-avatar-small').src = user.avatarUrl;
        
        const adminNavBtn = document.getElementById('nav-admin-btn');
        if (user.role === 'admin') adminNavBtn.style.display = 'block'; else adminNavBtn.style.display = 'none';

        switchView('dashboard'); 
        fetchAndRenderRequests();
    } else { 
        loginMessage.textContent = 'Email ou senha incorretos.'; 
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('login-form').reset();
    switchView('login');
}


// =======================================================
// Event Listeners (Final)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    switchView('login');
});

loginForm.addEventListener('submit', handleLogin);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

document.querySelectorAll('.nav-buttons button').forEach(btn => btn.addEventListener('click', function() {
    document.querySelectorAll('.nav-buttons button').forEach(b => b.classList.remove('active')); this.classList.add('active');
    switchView(this.id.replace('nav-', '').replace('-btn', ''));
}));

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView('dashboard'));
});

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', function() {
    document.querySelectorAll(`.filter-btn[data-filter-type="${this.getAttribute('data-filter-type')}"]`).forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilters = { type: this.getAttribute('data-filter-type'), value: this.getAttribute('data-filter-value') };
    fetchAndRenderRequests();
}));

// Outros Eventos
document.getElementById('profile-btn').addEventListener('click', showUserProfile);
document.getElementById('profile-form').addEventListener('submit', updateUserProfile);

// Atualização de dados em tempo real
setInterval(fetchAndRenderRequests, 10000); // Tenta buscar a cada 10 segundos
window.addEventListener('storage-update', fetchAndRenderRequests); // Listener para o site de pedidos