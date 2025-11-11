// Dados dos formulários e respostas
let forms = JSON.parse(localStorage.getItem('forms')) || [];
let responses = JSON.parse(localStorage.getItem('responses')) || [];

// Elementos do DOM - com verificação de segurança
function getElementSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Elemento com ID "${id}" não encontrado`);
    }
    return element;
}

const createFormBtn = getElementSafe('create-form-btn');
const manageFormsBtn = getElementSafe('manage-forms-btn');
const viewResponsesBtn = getElementSafe('view-responses-btn');
const createFormModal = getElementSafe('create-form-modal');
const manageFormsModal = getElementSafe('manage-forms-modal');
const responsesModal = getElementSafe('responses-modal');
const questionsContainer = getElementSafe('questions-container');
const addQuestionBtn = getElementSafe('add-question-btn');
const newFormForm = getElementSafe('new-form-form');
const formsListAdmin = getElementSafe('forms-list-admin');
const recentFormsList = getElementSafe('recent-forms-list');
const responsesList = getElementSafe('responses-list');
const activeFormsCount = getElementSafe('active-forms-count');
const todayResponses = getElementSafe('today-responses');
const totalResponses = getElementSafe('total-responses');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página do admin
    if (!createFormBtn || !manageFormsBtn) {
        console.log('Não está na página do administrador');
        return;
    }
    
    updateStats();
    loadRecentForms();
    
    // Event Listeners apenas se os elementos existirem
    if (createFormBtn) {
        createFormBtn.addEventListener('click', showCreateFormModal);
    }
    
    if (manageFormsBtn) {
        manageFormsBtn.addEventListener('click', showManageFormsModal);
    }
    
    if (viewResponsesBtn) {
        viewResponsesBtn.addEventListener('click', showResponsesModal);
    }
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestion);
    }
    
    if (newFormForm) {
        newFormForm.addEventListener('submit', saveForm);
    }
    
    // Fechar modais
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
});

// Funções para modais
function showCreateFormModal() {
    if (!createFormModal) return;
    createFormModal.style.display = 'block';
    if (questionsContainer) questionsContainer.innerHTML = '';
    addQuestion(); // Adiciona uma questão por padrão
}

function showManageFormsModal() {
    if (!manageFormsModal) return;
    manageFormsModal.style.display = 'block';
    loadFormsForManagement();
}

function showResponsesModal() {
    if (!responsesModal) return;
    responsesModal.style.display = 'block';
    loadResponses();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Funções para gerenciar questões
function addQuestion() {
    if (!questionsContainer) return;
    
    const questionId = Date.now();
    const questionHTML = `
        <div class="question-item" data-id="${questionId}">
            <div class="question-header">
                <h4>Questão</h4>
                <button type="button" class="remove-question">Remover</button>
            </div>
            <div class="form-group">
                <label>Texto da Questão</label>
                <input type="text" class="question-text" required>
            </div>
            <div class="form-group">
                <label>Tipo de Questão</label>
                <select class="question-type">
                    <option value="text">Texto Livre</option>
                    <option value="radio">Múltipla Escolha (Uma opção)</option>
                    <option value="checkbox">Múltipla Escolha (Várias opções)</option>
                    <option value="select">Lista Suspensa</option>
                </select>
            </div>
            <div class="question-options" style="display: none;">
                <div class="options-list">
                    <!-- Opções serão adicionadas aqui -->
                </div>
                <button type="button" class="add-option">Adicionar Opção</button>
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    
    // Adicionar event listeners para a nova questão
    const newQuestion = questionsContainer.querySelector(`[data-id="${questionId}"]`);
    const typeSelect = newQuestion.querySelector('.question-type');
    const removeBtn = newQuestion.querySelector('.remove-question');
    const addOptionBtn = newQuestion.querySelector('.add-option');
    
    typeSelect.addEventListener('change', function() {
        const optionsContainer = newQuestion.querySelector('.question-options');
        if (this.value === 'text') {
            optionsContainer.style.display = 'none';
        } else {
            optionsContainer.style.display = 'block';
            if (newQuestion.querySelectorAll('.option-item').length === 0) {
                addOption(newQuestion);
            }
        }
    });
    
    removeBtn.addEventListener('click', function() {
        newQuestion.remove();
    });
    
    addOptionBtn.addEventListener('click', function() {
        addOption(newQuestion);
    });
}

function addOption(questionElement) {
    const optionsList = questionElement.querySelector('.options-list');
    const optionId = Date.now();
    const optionHTML = `
        <div class="option-item" data-id="${optionId}">
            <input type="text" class="option-text" placeholder="Texto da opção" required>
            <button type="button" class="remove-option">×</button>
        </div>
    `;
    
    optionsList.insertAdjacentHTML('beforeend', optionHTML);
    
    // Adicionar event listener para remover opção
    const newOption = optionsList.querySelector(`[data-id="${optionId}"]`);
    const removeBtn = newOption.querySelector('.remove-option');
    
    removeBtn.addEventListener('click', function() {
        newOption.remove();
    });
}

// Salvar formulário
function saveForm(e) {
    e.preventDefault();
    
    const title = document.getElementById('form-title')?.value;
    const description = document.getElementById('form-description')?.value;
    
    if (!title) {
        alert('Por favor, insira um título para o formulário.');
        return;
    }
    
    const questions = [];
    document.querySelectorAll('.question-item').forEach(questionEl => {
        const questionText = questionEl.querySelector('.question-text')?.value;
        const questionType = questionEl.querySelector('.question-type')?.value;
        
        if (!questionText) return;
        
        const question = {
            id: questionEl.dataset.id,
            text: questionText,
            type: questionType
        };
        
        if (questionType !== 'text') {
            question.options = [];
            questionEl.querySelectorAll('.option-item').forEach(optionEl => {
                const optionText = optionEl.querySelector('.option-text')?.value;
                if (optionText) {
                    question.options.push(optionText);
                }
            });
        }
        
        questions.push(question);
    });
    
    if (questions.length === 0) {
        alert('Por favor, adicione pelo menos uma questão ao formulário.');
        return;
    }
    
    const newForm = {
        id: Date.now().toString(),
        title: title,
        description: description,
        questions: questions,
        createdAt: new Date().toISOString(),
        active: true
    };
    
    forms.push(newForm);
    localStorage.setItem('forms', JSON.stringify(forms));
    
    alert('Formulário criado com sucesso!');
    closeAllModals();
    if (newFormForm) newFormForm.reset();
    updateStats();
    loadRecentForms();
}

// Carregar formulários para gerenciamento
function loadFormsForManagement() {
    if (!formsListAdmin) return;
    
    formsListAdmin.innerHTML = '';
    
    if (forms.length === 0) {
        formsListAdmin.innerHTML = '<p>Nenhum formulário criado ainda.</p>';
        return;
    }
    
    forms.forEach(form => {
        const formHTML = `
            <div class="form-item">
                <h4>${form.title}</h4>
                <p>${form.description || 'Sem descrição'}</p>
                <p><strong>Criado em:</strong> ${new Date(form.createdAt).toLocaleDateString('pt-BR')}</p>
                <p><strong>Questões:</strong> ${form.questions.length}</p>
                <div class="form-actions">
                    <button class="btn-small ${form.active ? 'btn-danger' : 'btn-secondary'}" onclick="toggleFormActive('${form.id}')">
                        ${form.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteForm('${form.id}')">Excluir</button>
                </div>
            </div>
        `;
        
        formsListAdmin.insertAdjacentHTML('beforeend', formHTML);
    });
}

// Carregar formulários recentes
function loadRecentForms() {
    if (!recentFormsList) return;
    
    recentFormsList.innerHTML = '';
    
    const recentForms = forms
        .filter(form => form.active)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (recentForms.length === 0) {
        recentFormsList.innerHTML = '<p>Nenhum formulário criado ainda.</p>';
        return;
    }
    
    recentForms.forEach(form => {
        const formResponses = responses.filter(r => r.formId === form.id);
        
        const formHTML = `
            <div class="form-item">
                <h4>${form.title}</h4>
                <p>Criado em: ${new Date(form.createdAt).toLocaleDateString('pt-BR')}</p>
                <span class="responses-count">${formResponses.length} respostas</span>
            </div>
        `;
        
        recentFormsList.insertAdjacentHTML('beforeend', formHTML);
    });
}

// Carregar respostas
function loadResponses() {
    if (!responsesList) return;
    
    responsesList.innerHTML = '';
    
    if (responses.length === 0) {
        responsesList.innerHTML = '<p>Nenhuma resposta recebida ainda.</p>';
        return;
    }
    
    responses.forEach(response => {
        const form = forms.find(f => f.id === response.formId);
        if (!form) return;
        
        const responseHTML = `
            <div class="response-item">
                <div class="response-header">
                    <span class="response-user">${response.userName}</span>
                    <span class="response-date">${new Date(response.submittedAt).toLocaleString('pt-BR')}</span>
                </div>
                <p><strong>Formulário:</strong> ${form.title}</p>
                <div class="response-answers">
                    ${response.answers.map(answer => `
                        <div class="answer-item">
                            <div class="answer-question">${answer.questionText}</div>
                            <div class="answer-value">${Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        responsesList.insertAdjacentHTML('beforeend', responseHTML);
    });
}

// Atualizar estatísticas
function updateStats() {
    const activeForms = forms.filter(form => form.active).length;
    const today = new Date().toDateString();
    const todayResponsesCount = responses.filter(r => 
        new Date(r.submittedAt).toDateString() === today
    ).length;
    
    if (activeFormsCount) activeFormsCount.textContent = activeForms;
    if (todayResponses) todayResponses.textContent = todayResponsesCount;
    if (totalResponses) totalResponses.textContent = responses.length;
}

// Alternar estado ativo/inativo do formulário
function toggleFormActive(formId) {
    const form = forms.find(f => f.id === formId);
    if (form) {
        form.active = !form.active;
        localStorage.setItem('forms', JSON.stringify(forms));
        loadFormsForManagement();
        loadRecentForms();
        updateStats();
    }
}

// Excluir formulário
function deleteForm(formId) {
    if (confirm('Tem certeza que deseja excluir este formulário? Todas as respostas também serão excluídas.')) {
        forms = forms.filter(f => f.id !== formId);
        responses = responses.filter(r => r.formId !== formId);
        
        localStorage.setItem('forms', JSON.stringify(forms));
        localStorage.setItem('responses', JSON.stringify(responses));
        
        loadFormsForManagement();
        loadRecentForms();
        updateStats();
    }
}