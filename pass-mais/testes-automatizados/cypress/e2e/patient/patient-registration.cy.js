import PatientRegistrationPage from '../../pages/patiente/PatientRegistrationPage';
import dataGenerator from '../../support/dataGenerator';

describe('[US-0002] - Patient Registration Pass+', () => {
    let newPatient;
    
    beforeEach(() => {
        PatientRegistrationPage.visit();
        newPatient = dataGenerator.generatePatient();
    });
    
    it('CT-007 - Successful patient registration with complete data', () => {
        PatientRegistrationPage.fillFullName(newPatient.fullName);
        PatientRegistrationPage.fillEmail(newPatient.email);
        PatientRegistrationPage.fillPhone(newPatient.phone);
        PatientRegistrationPage.fillPassword(newPatient.password);
        PatientRegistrationPage.fillConfirmPassword(newPatient.password);
        PatientRegistrationPage.acceptTerms();
        PatientRegistrationPage.submit();
        PatientRegistrationPage.validateRegistrationSuccess();
        
        cy.writeFile(`cypress/fixtures/registered-patient-${Date.now()}.json`, newPatient);
    });
    
    it('CT-008 - Registration with existing email', () => {
        const firstPatient = dataGenerator.generatePatient();
        PatientRegistrationPage.fillFullName(firstPatient.fullName);
        PatientRegistrationPage.fillEmail(firstPatient.email);
        PatientRegistrationPage.fillPhone(firstPatient.phone);
        PatientRegistrationPage.fillPassword(firstPatient.password);
        PatientRegistrationPage.fillConfirmPassword(firstPatient.password);
        PatientRegistrationPage.acceptTerms();
        PatientRegistrationPage.submit();
        
        // Try to register again with same email
        PatientRegistrationPage.visit();
        const secondPatient = dataGenerator.generatePatient();
        PatientRegistrationPage.fillFullName(secondPatient.fullName);
        PatientRegistrationPage.fillEmail(firstPatient.email); // Same email
        PatientRegistrationPage.fillPhone(secondPatient.phone);
        PatientRegistrationPage.fillPassword(secondPatient.password);
        PatientRegistrationPage.fillConfirmPassword(secondPatient.password);
        PatientRegistrationPage.acceptTerms();
        PatientRegistrationPage.submit();
        PatientRegistrationPage.validateRegistrationFailure();
    });
    
    it('CT-009 - Registration with mismatched passwords', () => {
        const differentPassword = dataGenerator.generatePassword();
        
        PatientRegistrationPage.fillFullName(newPatient.fullName);
        PatientRegistrationPage.fillEmail(newPatient.email);
        PatientRegistrationPage.fillPhone(newPatient.phone);
        PatientRegistrationPage.fillPassword(newPatient.password);
        PatientRegistrationPage.fillConfirmPassword(differentPassword);
        PatientRegistrationPage.acceptTerms();
        PatientRegistrationPage.submit();
        PatientRegistrationPage.validatePasswordMismatch();
    });
    
    it('CT-010 - Registration without accepting terms', () => {
        PatientRegistrationPage.fillFullName(newPatient.fullName);
        PatientRegistrationPage.fillEmail(newPatient.email);
        PatientRegistrationPage.fillPhone(newPatient.phone);
        PatientRegistrationPage.fillPassword(newPatient.password);
        PatientRegistrationPage.fillConfirmPassword(newPatient.password);
        // Not accepting terms
        PatientRegistrationPage.submit();
        PatientRegistrationPage.validateTermsRequired();
    });
    
    // it('CT-011 - Registration with invalid email format', () => {
    //     const invalidEmails = [
    //         'invalidemail',
    //         '@example.com',
    //         'user@',
    //         'user name@example.com',
    //         'user@example',
    //         'user..name@example.com'
    //     ];
        
    //     const invalidEmail = dataGenerator.faker.helpers.arrayElement(invalidEmails);
        
    //     PatientRegistrationPage.fillFullName(newPatient.fullName);
    //     PatientRegistrationPage.fillEmail(invalidEmail);
    //     PatientRegistrationPage.fillPhone(newPatient.phone);
    //     PatientRegistrationPage.fillPassword(newPatient.password);
    //     PatientRegistrationPage.fillConfirmPassword(newPatient.password);
    //     PatientRegistrationPage.acceptTerms();
    //     PatientRegistrationPage.submit();
    //     PatientRegistrationPage.validateFieldError('email');
    // });

    it.only('CT-013 - Navigate to login', () => {
        PatientRegistrationPage.clickLogin();
        cy.url().should('include', '/login');
    });
    
});