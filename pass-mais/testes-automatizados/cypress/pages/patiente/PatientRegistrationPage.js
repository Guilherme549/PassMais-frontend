class PatientRegistrationPage {
    visit() {
        cy.visit('/register');
    }
    
    fillFullName(fullName) {
        cy.get('#fullName').type(fullName);
    }
    
    fillEmail(email) {
        cy.get('#email').type(email);
    }
    
    fillPhone(phone) {
        cy.get('#phone').type(phone);
    }
    
    fillCPF(cpf) {
        cy.get('#cpf').type(cpf);
    }
    
    fillRG(rg) {
        cy.get('#rg').type(rg);
    }
    
    fillDateOfBirth(date) {
        cy.get('#dateOfBirth').type(date);
    }
    
    selectGender(gender) {
        cy.get('#gender').select(gender);
    }
    
    fillAddress(address) {
        cy.get('#street').type(address.street);
        cy.get('#number').type(address.number);
        if (address.complement) {
            cy.get('#complement').type(address.complement);
        }
        cy.get('#neighborhood').type(address.neighborhood);
        cy.get('#city').type(address.city);
        cy.get('#state').select(address.state);
        cy.get('#cep').type(address.cep);
    }
    
    selectHealthPlan(plan) {
        cy.get('#healthPlan').select(plan);
    }
    
    fillHealthPlanNumber(number) {
        cy.get('#healthPlanNumber').type(number);
    }
    
    fillPassword(password) {
        cy.get('#password').type(password, { log: false });
    }
    
    fillConfirmPassword(confirmPassword) {
        cy.get('#confirmPassword').type(confirmPassword, { log: false });
    }
    
    acceptTerms() {
        cy.get('#acceptTerms').check();
    }
    
    submit() {
        cy.contains('button', 'Criar conta').click();
    }
    
    clickLogin() {
        cy.contains('Faça login em sua conta').click();
    }
    
    validateRegistrationSuccess() {
        cy.get('.items-center').should('contain.text', 'Usuário criado com sucesso!');
        cy.url().should('include', '/login');
    }
    
    validateRegistrationFailure() {
        cy.get('li').should('contain.text', 'Erro ao criar conta');
    }

    validatePasswordMismatch() {
        cy.get('li').should('contain.text', 'As senhas devem ser iguais.');
    }

    validateTermsRequired() {
        cy.get('li').should('contain.text', 'É necessário aceitar os termos e condições.');
    }


    
    validateFieldError(field) {
        cy.get(`#${field}-error`).should('be.visible');
    }
    
    // Helper method to fill all required fields
    fillRequiredFields(patient) {
        this.fillFullName(patient.fullName);
        this.fillEmail(patient.email);
        this.fillPhone(patient.phone);
        this.fillPassword(patient.password);
        this.fillConfirmPassword(patient.password);
        this.acceptTerms();
    }
    
    // Helper method to fill complete form
    fillCompleteForm(patient) {
        this.fillFullName(patient.fullName);
        this.fillEmail(patient.email);
        this.fillPhone(patient.phone);
        this.fillCPF(patient.cpf);
        this.fillRG(patient.rg);
        this.fillDateOfBirth(patient.dateOfBirth);
        this.selectGender(patient.gender);
        this.fillAddress(patient.address);
        if (patient.healthPlan !== 'Sem plano') {
            this.selectHealthPlan(patient.healthPlan);
            if (patient.healthPlanNumber) {
                this.fillHealthPlanNumber(patient.healthPlanNumber);
            }
        }
        this.fillPassword(patient.password);
        this.fillConfirmPassword(patient.password);
        this.acceptTerms();
    }
}

export default new PatientRegistrationPage();