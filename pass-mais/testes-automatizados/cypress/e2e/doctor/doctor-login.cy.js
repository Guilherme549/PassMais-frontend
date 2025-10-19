import DoctorLoginPage from '../../pages/doctor/DoctorLoginPage';

describe('[US-0003] - Doctor Login Pass+ ', () => {
    // Dados estáticos para login
    const validDoctor = {
        email: 'dr.teste1760536436076@gmail.com',
        password: 'Senha@1760536436077'
    };
    
    beforeEach(() => {
        DoctorLoginPage.visit();
    });
    
    it('CT-001 - Successful login with valid credentials', () => {
        DoctorLoginPage.fillEmail(validDoctor.email);
        DoctorLoginPage.fillPassword(validDoctor.password);
        DoctorLoginPage.submit();
        DoctorLoginPage.validateLoginSuccess();
    });
    
    it('CT-002 - Login with invalid email', () => {
        DoctorLoginPage.fillEmail('invalido@gmail.com');
        DoctorLoginPage.fillPassword('123456');
        DoctorLoginPage.submit();
        DoctorLoginPage.validateLoginFailure();
    });
    
    it('CT-003 - Login with invalid password', () => {
        DoctorLoginPage.fillEmail('medico@gmail.com');
        DoctorLoginPage.fillPassword('senhaerrada');
        DoctorLoginPage.submit();
        DoctorLoginPage.validateLoginFailure();
    });
    
    it('CT-007 - Navigate to forgot password', () => {
        DoctorLoginPage.clickForgotPassword();
        cy.url().should('include', '/esqueceu-senha');
    });
    
    it('CT-008 - Navigate to registration', () => {
        DoctorLoginPage.clickRegister();
        cy.url().should('include', '/medicos/register-medico');
    });
    
    it.only('CT-010 - Navigate to patient login', () => {
        DoctorLoginPage.clickPatientLogin();
        cy.url().should('include', '/login');
    });
});