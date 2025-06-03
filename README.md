# Pass+

O Pass+ é um software desenvolvido com o objetivo de facilitar o agendamento e gerenciamento de consultas médicas. Ele oferece uma solução prática e eficiente tanto para os pacientes, que podem marcar, remarcar ou cancelar consultas de forma simples, quanto para os profissionais de saúde e clínicas, que conseguem organizar melhor sua agenda e o fluxo de atendimentos.

## Premissas
 - Ter o node.js instalado na maquina.
 - Ter o Docker intalado na maquina.


1. Clonar o repositório:

```bash
git clone https://github.com/Guilherme549/PassMais-frontend.git
```

2. Criar os arquivos `.env` necessários:

```bash
cd pass-mais
cp .env.sample .env
```

O arquivo `.env.example` contem as variáveis de ambiente mínimas para a execução da aplicação, porém nem todas as funcionalidades estarão disponíveis e/ou funcionais.

3. Executando

Para executar a aplicação, com todos os componentes, em ambiente de desenvolvimento, executar:

```bash
docker compose up -d --build
```


Abra [http://localhost:3000](http://localhost:3000) para acessar a aplicação no seu navegador.
