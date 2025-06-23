const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin'); // Importe o novo middleware

// Rotas para Grupos/Patrulhas

// Rotas públicas que qualquer um (logado ou não) pode acessar
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);

// Rotas protegidas que exigem login E permissão de admin
// O array [verifyToken, verifyAdmin] garante que ambos os middlewares sejam executados em ordem.
router.post('/', [verifyToken, verifyAdmin], groupController.createGroup);
router.put('/:id', [verifyToken, verifyAdmin], groupController.updateGroup);
router.delete('/:id', [verifyToken, verifyAdmin], groupController.deleteGroup);

module.exports = router;