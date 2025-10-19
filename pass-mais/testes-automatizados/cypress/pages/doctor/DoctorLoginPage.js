class DoctorLoginPage {
    visit() {
        cy.visit('/medicos/login-medico');
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
    
    clickRegister() {
        cy.contains('Cadastre-se').click();
    }
    
    clickPatientLogin() {
        cy.contains('É um paciente? Faça login aqui').click();
    }
    
    validateLoginSuccess() {
        cy.url().should('include', '/medicos/dashboard');
        cy.get('.gap-2 > .text-3xl').should('contain', 'Bem-vindo de volta!');
    }
    
    validateLoginFailure() {
        cy.get('.text-red-600').should('contain', 'Credenciais inválidas');
    }
    
    validateFieldError(field) {
        cy.get(`#${field}-error`).should('be.visible');
    }
}

export default new DoctorLoginPage();