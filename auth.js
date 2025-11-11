// Dados de usuários pré-definidos
const users = [
    {
        email: 'admin@admin.com',
        password: 'admin',
        name: 'Administrador',
        type: 'admin'
    },
    {
        email: 'usuario@usuario.com',
        password: 'usuario',
        name: 'Usuário Comum',
        type: 'user'
    }
];

// Função de login
function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Salvar informações do usuário no localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirecionar para a página correta
        if (user.type === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'usuario.html';
        }
        return true;
    } else {
        // Login falhou
        alert('E-mail ou senha incorretos. Use as contas de demonstração fornecidas.');
        return false;
    }
}

// Função de logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Verificar se o usuário está logado
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Se não estiver logado, redirecionar para login
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return null;
    }
    
    return currentUser;
}

// Event Listener para o formulário de login (apenas na página de login)
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        login(email, password);
    });
}

// Event Listeners para logout
if (document.getElementById('logout-admin')) {
    document.getElementById('logout-admin').addEventListener('click', logout);
}

if (document.getElementById('logout-user')) {
    document.getElementById('logout-user').addEventListener('click', logout);
}

// Preencher informações do usuário nas páginas
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = checkAuth();
    
    if (currentUser) {
        if (document.getElementById('admin-name')) {
            document.getElementById('admin-name').textContent = currentUser.name;
        }
        
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = currentUser.name;
        }
    }
});