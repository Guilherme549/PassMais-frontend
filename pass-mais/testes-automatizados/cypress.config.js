const { defineConfig } = require('cypress') 

module.exports = defineConfig({
  e2e: {
    // baseUrl: 'http://localhost:3000',
    baseUrl: 'https://www.passmais.com.br/',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    
    // Padrões de arquivos de teste
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configurações para ambientes
    env: {
      // Variáveis de ambiente para testes
      usuario_teste: 'usuario@teste.com',
      senha_teste: 'senha123'
    }
  },
})