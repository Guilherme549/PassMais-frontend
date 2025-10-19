// cypress/support/dataGenerator.js
import { faker } from '@faker-js/faker/locale/pt_BR';

/**
 * Brazilian Data Generator - Gera CPF, telefones e CEPs válidos
 */
class BrazilianDataGenerator {
    generateCPF(formatted = true) {
        const randomDigits = () => Math.floor(Math.random() * 10);
        const digits = [];
        
        for (let i = 0; i < 9; i++) {
            digits.push(randomDigits());
        }
        
        // Calculate first verification digit
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += digits[i] * (10 - i);
        }
        let firstVerifier = (sum * 10) % 11;
        if (firstVerifier === 10) firstVerifier = 0;
        digits.push(firstVerifier);
        
        // Calculate second verification digit
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += digits[i] * (11 - i);
        }
        let secondVerifier = (sum * 10) % 11;
        if (secondVerifier === 10) secondVerifier = 0;
        digits.push(secondVerifier);
        
        const cpf = digits.join('');
        
        if (formatted) {
            return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
        }
        return cpf;
    }
    
    generatePhone(mobile = true) {
        const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '27'];
        const ddd = faker.helpers.arrayElement(ddds);
        
        if (mobile) {
            const firstDigit = 9;
            const secondDigit = faker.number.int({ min: 5, max: 9 });
            const firstPart = faker.number.int({ min: 1000, max: 9999 });
            const secondPart = faker.number.int({ min: 1000, max: 9999 });
            return `(${ddd}) ${firstDigit}${secondDigit}${firstPart}-${secondPart}`;
        } else {
            const firstDigit = faker.number.int({ min: 2, max: 5 });
            const firstPart = faker.number.int({ min: 100, max: 999 });
            const secondPart = faker.number.int({ min: 1000, max: 9999 });
            return `(${ddd}) ${firstDigit}${firstPart}-${secondPart}`;
        }
    }
    
    generateCEP() {
        const firstPart = faker.number.int({ min: 10000, max: 99999 });
        const secondPart = faker.number.int({ min: 100, max: 999 });
        return `${firstPart}-${secondPart}`;
    }
}

/**
 * Main Test Data Generator
 */
class TestDataGenerator {
    constructor() {
        this.faker = faker;
        this.br = new BrazilianDataGenerator();
    }
    
    /**
     * Generate a strong password
     */
    generatePassword() {
        const timestamp = Date.now();
        return `Senha@${timestamp}`;
    }
    
    /**
     * Generate patient data for registration
     */
    generatePatient() {
        const timestamp = Date.now();
        
        return {
            fullName: faker.person.fullName(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: `paciente.teste${timestamp}@gmail.com`,
            phone: this.br.generatePhone(true),
            cpf: this.br.generateCPF(),
            password: this.generatePassword()
        };
    }
    
    /**
     * Generate doctor data for registration
     */
    generateDoctor() {
        const timestamp = Date.now();
        const specialties = ['Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia', 'Dermatologia', 'Psiquiatria'];
        
        return {
            // Personal info
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: `dr.teste${timestamp}@gmail.com`,
            phone: this.br.generatePhone(true),
            cpf: this.br.generateCPF(),
            
            // Birth date
            day: faker.number.int({ min: 1, max: 28 }).toString(),
            month: faker.number.int({ min: 1, max: 12 }).toString(),
            year: faker.number.int({ min: 1960, max: 1995 }).toString(),
            
            // Professional info
            // crm: `CRM/SP ${faker.number.int({ min: 100000, max: 999999 })}`,
            crm: `${faker.number.int({ min: 100000, max: 999999 })}`,
            specialty: faker.helpers.arrayElement(specialties),
            about: 'Médico com experiência em atendimento humanizado e tratamentos modernos.',
            
            // Clinic info
            clinicName: `Clínica Saúde ${faker.number.int({ min: 100, max: 999 })}`,
            clinicAddress: `Rua ${faker.location.street()}, ${faker.number.int({ min: 1, max: 999 })}`,
            clinicCity: faker.helpers.arrayElement(['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba']),
            clinicZipCode: this.br.generateCEP(),
            
            // Password
            password: this.generatePassword()
        };
    }
}

// Export singleton instance
const dataGenerator = new TestDataGenerator();

export default dataGenerator;