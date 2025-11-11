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

const availableFormsList = getElementSafe('available-forms-list');
const answeredFormsList = getElementSafe('answered-forms-list');
const answerFormModal = getElementSafe('answer-form-modal');
const formToAnswerTitle = getElementSafe('form-to-answer-title');
const formQuestionsContainer = getElementSafe('form-questions-container');
const answerForm = getElementSafe('answer-form');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página do usuário
    if (!availableFormsList || !answeredFormsList) {
        console.log('Não está na página do usuário');
        return;
    }
    
    loadAvailableForms();
    loadAnsweredForms();
    
    // Event Listeners apenas se os elementos existirem
    if (answerForm) {
        answerForm.addEventListener('submit', submitFormResponse);
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

// Carregar formulários disponíveis
function loadAvailableForms() {
    if (!availableFormsList) return;
    
    availableFormsList.innerHTML = '';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userResponses = responses.filter(r => r.userEmail === currentUser.email);
    
    const availableForms = forms.filter(form => 
        form.active && 
        !userResponses.some(r => r.formId === form.id)
    );
    
    if (availableForms.length === 0) {
        availableFormsList.innerHTML = '<p>Nenhum formulário disponível no momento.</p>';
        return;
    }
    
    availableForms.forEach(form => {
        const timeEstimate = Math.ceil(form.questions.length / 2); // Estimativa de 30s por questão
        
        const formHTML = `
            <div class="form-card">
                <h3>${form.title}</h3>
                <p>${form.description || 'Sem descrição'}</p>
                <div class="form-meta">
                    <span class="questions-count">${form.questions.length} questões</span>
                    <span class="time-estimate">~${timeEstimate} min</span>
                </div>
                <button class="btn-responder" onclick="openFormToAnswer('${form.id}')">Responder</button>
            </div>
        `;
        
        availableFormsList.insertAdjacentHTML('beforeend', formHTML);
    });
}

// Carregar formulários respondidos
function loadAnsweredForms() {
    if (!answeredFormsList) return;
    
    answeredFormsList.innerHTML = '';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userResponses = responses.filter(r => r.userEmail === currentUser.email);
    
    if (userResponses.length === 0) {
        answeredFormsList.innerHTML = '<p>Você ainda não respondeu a nenhum formulário.</p>';
        return;
    }
    
    userResponses.forEach(response => {
        const form = forms.find(f => f.id === response.formId);
        if (!form) return;
        
        const formHTML = `
            <div class="form-item answered">
                <h4>${form.title}</h4>
                <p>Respondido em: ${new Date(response.submittedAt).toLocaleDateString('pt-BR')}</p>
            </div>
        `;
        
        answeredFormsList.insertAdjacentHTML('beforeend', formHTML);
    });
}

// Abrir formulário para resposta
function openFormToAnswer(formId) {
    if (!answerFormModal || !formToAnswerTitle || !formQuestionsContainer) return;
    
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    
    formToAnswerTitle.textContent = `Responder: ${form.title}`;
    formQuestionsContainer.innerHTML = '';
    
    form.questions.forEach((question, index) => {
        let questionHTML = `
            <div class="question-item">
                <h4>${index + 1}. ${question.text}</h4>
                <div class="form-group">
        `;
        
        switch (question.type) {
            case 'text':
                questionHTML += `
                    <textarea name="question-${question.id}" rows="3" placeholder="Sua resposta..."></textarea>
                `;
                break;
                
            case 'radio':
                questionHTML += question.options.map((option, optIndex) => `
                    <label style="display: block; margin-bottom: 0.5rem;">
                        <input type="radio" name="question-${question.id}" value="${option}" ${optIndex === 0 ? 'required' : ''}>
                        ${option}
                    </label>
                `).join('');
                break;
                
            case 'checkbox':
                questionHTML += question.options.map(option => `
                    <label style="display: block; margin-bottom: 0.5rem;">
                        <input type="checkbox" name="question-${question.id}" value="${option}">
                        ${option}
                    </label>
                `).join('');
                break;
                
            case 'select':
                questionHTML += `
                    <select name="question-${question.id}" required>
                        <option value="">Selecione uma opção</option>
                        ${question.options.map(option => `
                            <option value="${option}">${option}</option>
                        `).join('')}
                    </select>
                `;
                break;
        }
        
        questionHTML += `
                </div>
            </div>
        `;
        
        formQuestionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    });
    
    answerFormModal.style.display = 'block';
}

// Fechar todos os modais
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Enviar respostas do formulário
function submitFormResponse(e) {
    e.preventDefault();
    
    if (!answerFormModal || !formToAnswerTitle) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const formTitle = formToAnswerTitle.textContent.replace('Responder: ', '');
    const form = forms.find(f => f.title === formTitle);
    
    if (!form) return;
    
    const answers = [];
    let isValid = true;
    
    form.questions.forEach(question => {
        const questionElement = document.querySelector(`[name="question-${question.id}"]`);
        
        if (!questionElement) return;
        
        let answer;
        
        switch (question.type) {
            case 'text':
                answer = questionElement.value;
                break;
                
            case 'radio':
                const selectedRadio = document.querySelector(`[name="question-${question.id}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : '';
                break;
                
            case 'checkbox':
                const selectedCheckboxes = document.querySelectorAll(`[name="question-${question.id}"]:checked`);
                answer = Array.from(selectedCheckboxes).map(cb => cb.value);
                break;
                
            case 'select':
                answer = questionElement.value;
                break;
        }
        
        // Validar resposta obrigatória
        if (questionElement.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
            isValid = false;
            questionElement.style.borderColor = '#e74c3c';
        } else {
            questionElement.style.borderColor = '';
        }
        
        answers.push({
            questionId: question.id,
            questionText: question.text,
            answer: answer
        });
    });
    
    if (!isValid) {
        alert('Por favor, responda todas as questões obrigatórias.');
        return;
    }
    
    const response = {
        id: Date.now().toString(),
        formId: form.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        answers: answers,
        submittedAt: new Date().toISOString()
    };
    
    responses.push(response);
    localStorage.setItem('responses', JSON.stringify(responses));
    
    alert('Formulário respondido com sucesso! Obrigado pela sua participação.');
    closeAllModals();
    loadAvailableForms();
    loadAnsweredForms();
}