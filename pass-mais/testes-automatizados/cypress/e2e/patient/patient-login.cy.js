import PatientLoginPage from '../../pages/patiente/PatientLoginPage';
import dataGenerator from '../../support/dataGenerator';

describe('[US-0001] - Patient Login Pass+', () => {
    // Dados estáticos para login
    const validPatient = {
        email: 'kevin@gmail.com',
        password: '123456'
    };
    
    beforeEach(() => {
        PatientLoginPage.visit();
    });
    
    it('CT-001 - Successful login with valid credentials', () => {
        PatientLoginPage.fillEmail(validPatient.email);
        PatientLoginPage.fillPassword(validPatient.password);
        PatientLoginPage.submit();
        PatientLoginPage.validateLoginSuccess();
    });
    
    it('CT-002 - Login with invalid email', () => {
        const fakeEmail = dataGenerator.faker.internet.email();
        
        PatientLoginPage.fillEmail(fakeEmail);
        PatientLoginPage.fillPassword(validPatient.password);
        PatientLoginPage.submit();
        PatientLoginPage.validateLoginFailure();
    });
    
    it('CT-003 - Login with invalid password', () => {
        PatientLoginPage.fillEmail(validPatient.email);
        PatientLoginPage.fillPassword('WrongPassword@123');
        PatientLoginPage.submit();
        PatientLoginPage.validateLoginFailure();
    });
    
    it('CT-004 - Login with empty email', () => {
        PatientLoginPage.fillPassword(validPatient.password);
        PatientLoginPage.submit();
        PatientLoginPage.validateFieldError('email');
        //posso colocar uma validaçaõ de url que de continuar no /login
    });
    
    it('CT-005 - Login with empty password', () => {
        PatientLoginPage.fillEmail(validPatient.email);
        PatientLoginPage.submit();
        PatientLoginPage.validateFieldError('password');
    });
    
    it('CT-006 - Login with both fields empty', () => {
        PatientLoginPage.submit();
        PatientLoginPage.validateFieldError('email');
        PatientLoginPage.validateFieldError('password');
    });
    
    it('CT-007 - Navigate to forgot password', () => {
        PatientLoginPage.clickForgotPassword();
        cy.url().should('include', '/reset-password');
    });
    
    it.only('CT-008 - Navigate to registration', () => {
        PatientLoginPage.clickCreateAccount();
        cy.url().should('include', '/register');
    });
    
    it('CT-009 - Login with invalid email format', () => {
        const invalidEmails = ['invalidemail', '@example.com', 'user@', 'user..@example.com'];
        
        invalidEmails.forEach(email => {
            PatientLoginPage.visit();
            PatientLoginPage.fillEmail(email);
            PatientLoginPage.fillPassword(validPatient.password);
            PatientLoginPage.submit();
            PatientLoginPage.validateFieldError('email');
        });
    });
    
});
