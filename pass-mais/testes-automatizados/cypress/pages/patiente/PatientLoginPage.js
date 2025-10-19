class PatientLoginPage {
    visit() {
        cy.visit('/login');
    }
    
    fillEmail(email) {
        cy.get('#email').type(email);
    }
    
    fillPassword(password) {
        cy.get('#password').type(password, { log: false });
    }
    
    submit() {
        cy.contains('button', 'Entrar').click();
    }
    
    clickForgotPassword() {
        cy.contains('Esqueceu a senha?').click();
    }
    
    clickCreateAccount() {
        cy.contains('Crie uma conta').click();
    }
    
    validateLoginSuccess() {
        cy.url().should('include', '/medical-appointments');
    }
    
    validateLoginFailure() {
        cy.get('.text-red-500').should('contain.text', 'Credenciais inválidas');
    }
    
    validateFieldError(field) {
        cy.get(`#${field}-error`).should('be.visible');
    }
}

export default new PatientLoginPage();