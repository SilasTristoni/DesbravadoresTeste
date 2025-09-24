const express = require('express');
const router = express.Router();

// Rota para obter o estado completo da aplicação
router.get('/state', (req, res) => {
    res.json(req.appState);
});

// Rota para obter dados de um usuário específico
router.get('/users/:userId', (req, res) => {
    const user = req.appState.users[req.params.userId];
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Usuário não encontrado' });
    }
});

module.exports = router;