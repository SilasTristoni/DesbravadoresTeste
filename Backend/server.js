const express = require('express');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();

// Rotas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('Bem-vindo à API do Adventure Camp!');
});

// Sincroniza o banco de dados e inicia o servidor
db.sequelize.sync().then(() => {
  console.log('Banco de dados sincronizado.');
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
  });
}).catch(err => {
  console.error('Não foi possível conectar ao banco de dados:', err);
});