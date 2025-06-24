// Backend/routes/taskRoute.js

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// Rota para buscar todas as tarefas (acessível por qualquer usuário logado)
router.get('/', verifyToken, taskController.getAllTasks);

// Rota para criar uma nova tarefa (acessível apenas por administradores)
router.post('/', verifyToken, verifyAdmin, taskController.createTask);

module.exports = router;