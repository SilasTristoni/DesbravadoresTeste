const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// Rotas para Admin gerenciar conquistas
router.post('/', verifyToken, verifyAdmin, achievementController.createAchievement);
router.get('/', verifyToken, verifyAdmin, achievementController.getAllAchievements);
router.post('/grant', verifyToken, verifyAdmin, achievementController.grantAchievement);

// Rota para um usuário ver suas próprias conquistas
router.get('/user/:userId', verifyToken, achievementController.getUserAchievements);

module.exports = router;