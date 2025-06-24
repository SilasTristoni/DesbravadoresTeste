const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

// Rotas para Usuários

// Rotas protegidas para o próprio usuário
router.get('/me', verifyToken, userController.getMe);
router.put('/me', verifyToken, userController.updateMe);

// Rotas públicas ou para admins
router.get('/', userController.getAllUsers); // Pode ser protegida para admin apenas
router.get('/:id', userController.getUserById);

module.exports = router;