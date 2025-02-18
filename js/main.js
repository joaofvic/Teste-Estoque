// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    initializeTooltips();
    setupFormValidation();
    setupDashboardCharts();
});

// Funções de utilidade
const utils = {
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    formatDate: (date) => {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    },

    showAlert: (message, type = 'info') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => alertDiv.remove(), 5000);
    }
};

// Validação de formulários
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                
                const invalidFields = form.querySelectorAll(':invalid');
                invalidFields.forEach(field => {
                    field.classList.add('is-invalid');
                    
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.textContent = field.validationMessage;
                    field.parentNode.appendChild(feedback);
                });
            }
            
            form.classList.add('was-validated');
        });
    });
}

// Inicialização de tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Funções do Dashboard
function setupDashboardCharts() {
    const dashboardCharts = document.querySelectorAll('.dashboard-chart');
    if (dashboardCharts.length === 0) return;

    dashboardCharts.forEach(chart => {
        // Implementar lógica de gráficos aqui
        // Exemplo usando Chart.js (requer inclusão da biblioteca)
        if (typeof Chart !== 'undefined') {
            new Chart(chart, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Movimentação de Estoque',
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: '#2563eb',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    });
}

// Funções de Autenticação
const auth = {
    login: async (email, password, isAdmin = false) => {
        try {
            // Implementar lógica de login
            const endpoint = isAdmin ? '/api/admin/login' : '/api/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) throw new Error('Falha na autenticação');
            
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', isAdmin ? 'admin' : 'user');
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Redirecionar para a página apropriada
            window.location.href = isAdmin ? '/pages/admin/dashboard.html' : '/pages/dashboard.html';
            return data;
        } catch (error) {
            utils.showAlert(error.message, 'danger');
            throw error;
        }
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = '/index.html';
    },
    
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        return localStorage.getItem('userType') === 'admin';
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    requireAdmin: () => {
        if (!auth.isAuthenticated()) {
            window.location.href = '/index.html';
            return false;
        }
        if (!auth.isAdmin()) {
            window.location.href = '/pages/dashboard.html';
            return false;
        }
        return true;
    }
};

// Event Listeners para formulários de login
document.addEventListener('DOMContentLoaded', () => {
    const userLoginForm = document.getElementById('userLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userLoginForm.checkValidity()) {
                e.stopPropagation();
                userLoginForm.classList.add('was-validated');
                return;
            }

            try {
                const email = document.getElementById('userEmail').value;
                const password = document.getElementById('userPassword').value;
                await auth.login(email, password, false);
            } catch (error) {
                console.error('Erro no login de usuário:', error);
            }
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!adminLoginForm.checkValidity()) {
                e.stopPropagation();
                adminLoginForm.classList.add('was-validated');
                return;
            }

            try {
                const email = document.getElementById('adminEmail').value;
                const password = document.getElementById('adminPassword').value;
                await auth.login(email, password, true);
            } catch (error) {
                console.error('Erro no login de administrador:', error);
            }
        });
    }
});

// Funções de Gestão de Estoque
const inventory = {
    async fetchProducts(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/products?${queryString}`);
            if (!response.ok) throw new Error('Erro ao buscar produtos');
            return await response.json();
        } catch (error) {
            utils.showAlert(error.message, 'danger');
            throw error;
        }
    },
    
    async updateStock(productId, quantity, type = 'add') {
        try {
            const response = await fetch(`/api/products/${productId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ quantity, type })
            });
            
            if (!response.ok) throw new Error('Erro ao atualizar estoque');
            
            utils.showAlert('Estoque atualizado com sucesso', 'success');
            return await response.json();
        } catch (error) {
            utils.showAlert(error.message, 'danger');
            throw error;
        }
    }
};

// Event Listeners
document.addEventListener('click', (e) => {
    // Logout
    if (e.target.matches('.logout-button')) {
        e.preventDefault();
        auth.logout();
    }
    
    // Botões de ação da tabela
    if (e.target.matches('.action-button')) {
        const action = e.target.dataset.action;
        const productId = e.target.dataset.productId;
        
        switch (action) {
            case 'edit':
                window.location.href = `/pages/product-edit.html?id=${productId}`;
                break;
            case 'delete':
                if (confirm('Tem certeza que deseja excluir este produto?')) {
                    // Implementar lógica de exclusão
                }
                break;
        }
    }
}); 