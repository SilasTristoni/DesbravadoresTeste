const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Middlewares ---
// Habilita o CORS para permitir que seu frontend (em outra porta/domínio) acesse a API
app.use(cors());
// Permite que o servidor entenda requisições com corpo em formato JSON
app.use(express.json());
// Serve os arquivos estáticos do seu projeto frontend
// IMPORTANTE: Ajuste o caminho se a sua pasta backend não for irmã da pasta do projeto
app.use(express.static(path.join(__dirname, '../silastristoni/desbravadoresteste/DesbravadoresTeste-1471bebdb80d17a609d7b26d1d944c1ef8617b83')));


// --- Gerenciamento de Dados (Banco de Dados JSON) ---
const dataPath = path.join(__dirname, 'data', 'appState.json');
let appState = {};

// Tenta ler o arquivo de dados de forma síncrona na inicialização
try {
    const data = fs.readFileSync(dataPath, 'utf8');
    appState = JSON.parse(data);
    console.log("Estado da aplicação carregado com sucesso.");
} catch (err) {
    console.error("ERRO CRÍTICO: Não foi possível carregar o arquivo appState.json. O servidor não pode iniciar.", err);
    process.exit(1); // Encerra o processo se não conseguir ler os dados
}

// Função para salvar o estado atual no arquivo JSON
const saveState = () => {
    fs.writeFile(dataPath, JSON.stringify(appState, null, 2), (err) => {
        if (err) {
            console.error("Erro ao salvar o estado da aplicação:", err);
        } else {
            console.log("Estado da aplicação salvo com sucesso.");
        }
    });
};

// Middleware para injetar o estado e a função de salvar em todas as requisições
app.use((req, res, next) => {
    req.appState = appState;
    req.saveState = saveState;
    next();
});

// --- Rotas da API ---
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);


// --- Rota Principal para Servir a Aplicação ---
// Redireciona a raiz para o app principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../silastristoni/desbravadoresteste/DesbravadoresTeste-1471bebdb80d17a609d7b26d1d944c1ef8617b83', 'app.html'));
});


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});