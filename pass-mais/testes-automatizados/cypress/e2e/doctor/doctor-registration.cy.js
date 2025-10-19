import DoctorRegistrationPage from '../../pages/doctor/DoctorRegistrationPage';
import doctorGenerator from '../../support/dataGenerator';

describe('[US-0004] - Doctor Registration Pass+', () => {
    let doctor;
    
    beforeEach(() => {
        DoctorRegistrationPage.visit();
        // Gera dados novos para cada teste
        doctor = doctorGenerator.generateDoctor();
    });
    
    it.only('CT-001 - Successful doctor registration', () => {
        // Preenche todos os campos com dados dinâmicos
        DoctorRegistrationPage.fillFirstName(doctor.firstName);
        DoctorRegistrationPage.fillLastName(doctor.lastName);
        DoctorRegistrationPage.fillEmail(doctor.email);
        DoctorRegistrationPage.fillPhone(doctor.phone);
        DoctorRegistrationPage.fillCPF(doctor.cpf);
        DoctorRegistrationPage.fillDay(doctor.day);
        DoctorRegistrationPage.fillMonth(doctor.month);
        DoctorRegistrationPage.fillYear(doctor.year);
        DoctorRegistrationPage.fillCRM(doctor.crm);
        DoctorRegistrationPage.fillSpecialty(doctor.specialty);
        DoctorRegistrationPage.fillAbout(doctor.about);
        DoctorRegistrationPage.fillClinicName(doctor.clinicName);
        DoctorRegistrationPage.fillClinicAddress(doctor.clinicAddress);
        DoctorRegistrationPage.fillClinicCity(doctor.clinicCity);
        DoctorRegistrationPage.fillClinicZipCode(doctor.clinicZipCode);
        DoctorRegistrationPage.fillPassword(doctor.password);
        DoctorRegistrationPage.fillConfirmPassword(doctor.password);
        DoctorRegistrationPage.acceptTerms();
        DoctorRegistrationPage.submit();
        
        DoctorRegistrationPage.validateRegistrationSuccess();
    });
    
    it('CT-002 - Registration with mismatched passwords', () => {
        DoctorRegistrationPage.fillFirstName(doctor.firstName);
        DoctorRegistrationPage.fillLastName(doctor.lastName);
        DoctorRegistrationPage.fillEmail(doctor.email);
        DoctorRegistrationPage.fillPhone(doctor.phone);
        DoctorRegistrationPage.fillCPF(doctor.cpf);
        DoctorRegistrationPage.fillDay(doctor.day);
        DoctorRegistrationPage.fillMonth(doctor.month);
        DoctorRegistrationPage.fillYear(doctor.year);
        DoctorRegistrationPage.fillCRM(doctor.crm);
        DoctorRegistrationPage.fillSpecialty(doctor.specialty);
        DoctorRegistrationPage.fillAbout(doctor.about);
        DoctorRegistrationPage.fillClinicName(doctor.clinicName);
        DoctorRegistrationPage.fillClinicAddress(doctor.clinicAddress);
        DoctorRegistrationPage.fillClinicCity(doctor.clinicCity);
        DoctorRegistrationPage.fillClinicZipCode(doctor.clinicZipCode);
        DoctorRegistrationPage.fillPassword(doctor.password);
        DoctorRegistrationPage.fillConfirmPassword('SenhaDiferente@123');
        DoctorRegistrationPage.acceptTerms();
        DoctorRegistrationPage.submit();
        
        DoctorRegistrationPage.validateRegistrationFailurePassword();
    });
    
    it('CT-003 - Registration without accepting terms', () => {
        DoctorRegistrationPage.fillFirstName(doctor.firstName);
        DoctorRegistrationPage.fillLastName(doctor.lastName);
        DoctorRegistrationPage.fillEmail(doctor.email);
        DoctorRegistrationPage.fillPhone(doctor.phone);
        DoctorRegistrationPage.fillCPF(doctor.cpf);
        DoctorRegistrationPage.fillDay(doctor.day);
        DoctorRegistrationPage.fillMonth(doctor.month);
        DoctorRegistrationPage.fillYear(doctor.year);
        DoctorRegistrationPage.fillCRM(doctor.crm);
        DoctorRegistrationPage.fillSpecialty(doctor.specialty);
        DoctorRegistrationPage.fillAbout(doctor.about);
        DoctorRegistrationPage.fillClinicName(doctor.clinicName);
        DoctorRegistrationPage.fillClinicAddress(doctor.clinicAddress);
        DoctorRegistrationPage.fillClinicCity(doctor.clinicCity);
        DoctorRegistrationPage.fillClinicZipCode(doctor.clinicZipCode);
        DoctorRegistrationPage.fillPassword(doctor.password);
        DoctorRegistrationPage.fillConfirmPassword(doctor.password);
        // NÃO aceita os termos
        DoctorRegistrationPage.submit();
        
        cy.get('li').should('contain', 'É necessário aceitar os termos e condições.');

    });
    
    it('CT-005 - Registration with invalid CPF', () => {
        DoctorRegistrationPage.fillFirstName(doctor.firstName);
        DoctorRegistrationPage.fillLastName(doctor.lastName);
        DoctorRegistrationPage.fillEmail(doctor.email);
        DoctorRegistrationPage.fillPhone(doctor.phone);
        DoctorRegistrationPage.fillCPF('111.111.111-11'); // CPF inválido
        DoctorRegistrationPage.fillDay(doctor.day);
        DoctorRegistrationPage.fillMonth(doctor.month);
        DoctorRegistrationPage.fillYear(doctor.year);
        DoctorRegistrationPage.fillCRM(doctor.crm);
        DoctorRegistrationPage.fillSpecialty(doctor.specialty);
        DoctorRegistrationPage.fillAbout(doctor.about);
        DoctorRegistrationPage.fillClinicName(doctor.clinicName);
        DoctorRegistrationPage.fillClinicAddress(doctor.clinicAddress);
        DoctorRegistrationPage.fillClinicCity(doctor.clinicCity);
        DoctorRegistrationPage.fillClinicZipCode(doctor.clinicZipCode);
        DoctorRegistrationPage.fillPassword(doctor.password);
        DoctorRegistrationPage.fillConfirmPassword(doctor.password);
        DoctorRegistrationPage.acceptTerms();
        DoctorRegistrationPage.submit();
        
        DoctorRegistrationPage.validateRegistrationFailureCpf();
    });
});