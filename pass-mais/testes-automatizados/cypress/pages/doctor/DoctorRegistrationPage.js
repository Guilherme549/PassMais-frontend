class DoctorRegistrationPage {
    visit() {
        cy.visit('/medicos/register-medico');
    }
    
    fillFirstName(firstName) {
        cy.get('#firstName').type(firstName);
    }
    
    fillLastName(lastName) {
        cy.get('#lastName').type(lastName);
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
    
    fillDay(day) {
        cy.get('#day').type(day);
    }
    
    fillMonth(month) {
        cy.get('#month').type(month);
    }
    
    fillYear(year) {
        cy.get('#year').type(year);
    }
    
    fillCRM(crm) {
        cy.get('#crm').type(crm);
    }
    
    fillSpecialty(specialty) {
        cy.get('#specialty').type(specialty);
    }
    
    fillAbout(about) {
        cy.get('#about').type(about);
    }
    
    fillClinicName(clinicName) {
        cy.get('#clinicName').type(clinicName);
    }
    
    fillClinicAddress(clinicAddress) {
        cy.get('#clinicAddress').type(clinicAddress);
    }
    
    fillClinicCity(clinicCity) {
        cy.get('#clinicCity').type(clinicCity);
    }
    
    fillClinicZipCode(clinicZipCode) {
        cy.get('#clinicZipCode').type(clinicZipCode);
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
        cy.contains('button', 'Enviar cadastro para análise').click();
    }
    
    validateRegistrationSuccess() {
        cy.get('.text-2xl').should('contain', 'Seja bem-vindo de volta (Médico)');
        cy.url().should('include', '/medicos/login-medico');
    }
    
    validateRegistrationFailurePassword() {
        cy.get('li').should('contain', 'As senhas devem ser iguais.');
    }

    validateRegistrationFailureCpf() {
        cy.get('li').should('contain', 'CPF inválido.');
    }
}

export default new DoctorRegistrationPage();