// =================================================================================
// CONFIGURAÇÕES GLOBAIS
// =================================================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8vZHicSMiSaZg1kL3CpoxMR7lCWSoY7vgnYupvxM_x6U7f_aJzSXeg9oz7uAZ8MYDjQ/exec';

// Estrutura de dados com empresas, setores e responsáveis
const ESTRUTURA = {
    usuarios: {
        "bijsterveld57@gmail.com": { nome: "Monique", perfil: "Financeiro" },
        "pieterjcobbijsterveld@gmail.com": { nome: "Jan", perfil: "Solicitante" },
        "tiagotheodorobj@gmail.com": { nome: "Tiago", perfil: "Financeiro" },
        "pieterbijsterveld95@gmail.com": { nome: "Pieter", perfil: "Solicitante" },
        "darleydacostavale@gmail.com": { nome: "Darley", perfil: "Compras" },
        "onfarm2021@gmail.com": { nome: "Ana Carolina", perfil: "Solicitante" }
    },
    empresas: {
        "FAZENDA": {
            setores: {
                "Abastecimento": "darleydacostavale@gmail.com", "Barracão": "pieterjcobbijsterveld@gmail.com", "Depósito de Químicos": "pieterbijsterveld95@gmail.com",
                "Estoque": "pieterbijsterveld95@gmail.com", "Laboratório de biológicos": "onfarm2021@gmail.com", "Lavoura": "pieterbijsterveld95@gmail.com",
                "Máquinas e implementos": "pieterbijsterveld95@gmail.com", "Pivô": "pieterbijsterveld95@gmail.com"
            }
        },
        "NATURALÍCIA": { setores: { "NATURALÍCIA": "tiagotheodorobj@gmail.com" } },
        "TRANSPORTADORA": { setores: { "TRANSPORTADORA": "pieterjcobbijsterveld@gmail.com" } },
        "SILO": {
            setores: {
                "Escritório": "bijsterveld57@gmail.com", "Zeladoria": "bijsterveld57@gmail.com", "CCM/Produção": "tiagotheodorobj@gmail.com",
                "Balança": "tiagotheodorobj@gmail.com", "Classificação": "tiagotheodorobj@gmail.com", "Área externa": "tiagotheodorobj@gmail.com",
                "Manutenção": "tiagotheodorobj@gmail.com"
            }
        }
    }
};

let currentUser = {};

// =================================================================================
// LÓGICA DE AUTENTICAÇÃO
// =================================================================================

// Esta função é chamada pelo script do Google DEPOIS que ele carregar
function initGapiClient() {
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: document.querySelector('meta[name="google-signin-client_id"]').content
        }).then(() => {
            console.log("API do Google inicializada.");
            attachSignIn(document.getElementById('custom-signin-button'));
            
            // Opcional: Verificar se o usuário já está logado
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                handleUserLogin(authInstance.currentUser.get());
            }
        });
    });
}

// Função para anexar o evento de clique ao nosso botão customizado
function attachSignIn(element) {
    const auth2 = gapi.auth2.getAuthInstance();
    element.addEventListener('click', () => {
        auth2.signIn().then(
            (googleUser) => { // Callback de sucesso
                handleUserLogin(googleUser);
            },
            (error) => { // Callback de erro
                console.error('Erro durante o login:', JSON.stringify(error, undefined, 2));
            }
        );
    });
}

function handleUserLogin(googleUser) {
    const profile = googleUser.getBasicProfile();
    const userEmail = profile.getEmail();

    if (ESTRUTURA.usuarios[userEmail]) {
        currentUser = {
            nome: ESTRUTURA.usuarios[userEmail].nome,
            email: userEmail,
            perfil: ESTRUTURA.usuarios[userEmail].perfil
        };
        document.getElementById('user-name').textContent = currentUser.nome;
        showAppScreen();
        setupUIForUser();
    } else {
        alert("Acesso negado. Seu e-mail não está autorizado para usar este aplicativo.");
        signOut();
    }
}

function signOut() {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
        authInstance.signOut().then(() => {
            currentUser = {};
            showLoginScreen();
        });
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
}

function showAppScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
}

// =================================================================================
// CONTROLE DA INTERFACE DO USUÁRIO (UI)
// =================================================================================
function setupUIForUser() {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

    if (currentUser.perfil === 'Solicitante') {
        document.getElementById('requester-view').classList.add('active');
        setupRequesterView();
    } else if (currentUser.perfil === 'Compras') {
        document.getElementById('purchasing-dashboard').classList.add('active');
        setupPurchasingDashboard();
    } else if (currentUser.perfil === 'Financeiro') {
        document.getElementById('finance-dashboard').classList.add('active');
    }
}

function setupRequesterView() {
    const form = document.getElementById('request-form');
    const empresaSelect = document.getElementById('empresa');
    
    form.classList.add('hidden');
    empresaSelect.innerHTML = '<option value="">Selecione uma Empresa</option>';

    const empresasDoUsuario = new Set();
    Object.keys(ESTRUTURA.empresas).forEach(nomeEmpresa => {
        const setores = ESTRUTURA.empresas[nomeEmpresa].setores;
        if (Object.values(setores).includes(currentUser.email)) {
            empresasDoUsuario.add(nomeEmpresa);
        }
    });

    empresasDoUsuario.forEach(nomeEmpresa => {
        const option = document.createElement('option');
        option.value = nomeEmpresa;
        option.textContent = nomeEmpresa;
        empresaSelect.appendChild(option);
    });
}

function showForm(type) {
    document.getElementById('request-form').classList.remove('hidden');
    document.getElementById('form-title').textContent = `Nova Solicitação de ${type}`;
}

document.getElementById('empresa').addEventListener('change', (event) => {
    const empresaNome = event.target.value;
    const setorSelect = document.getElementById('setor');
    setorSelect.innerHTML = '<option value="">Selecione um Setor</option>';

    if (empresaNome) {
        const setores = ESTRUTURA.empresas[empresaNome].setores;
        Object.keys(setores).forEach(nomeSetor => {
            if (setores[nomeSetor] === currentUser.email) {
                const option = document.createElement('option');
                option.value = nomeSetor;
                option.textContent = nomeSetor;
                setorSelect.appendChild(option);
            }
        });
    }
});

function setupPurchasingDashboard() {
    document.querySelectorAll('.tab-link').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            button.classList.add('active');
        });
    });
}

// =================================================================================
// INICIALIZAÇÃO E EVENT LISTENERS GERAIS
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signout-button').addEventListener('click', signOut);
    document.getElementById('btn-cancel').addEventListener('click', () => {
        document.getElementById('request-form').classList.add('hidden');
        document.getElementById('request-form').reset();
    });
    document.getElementById('btn-show-compra').onclick = () => showForm('COMPRA');
    document.getElementById('btn-show-servico').onclick = () => showForm('SERVIÇO');
});