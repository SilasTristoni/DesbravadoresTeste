const express = require('express');
const router = express.Router();

// Rota para registrar a chamada
router.post('/chamada', (req, res) => {
    const { presentUserIds } = req.body;
    if (!Array.isArray(presentUserIds)) {
        return res.status(400).json({ message: "O corpo da requisição deve conter um array 'presentUserIds'." });
    }

    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const attendanceSet = new Set(req.appState.attendance[today] || []);
    presentUserIds.forEach(userId => attendanceSet.add(userId));
    req.appState.attendance[today] = [...attendanceSet];

    req.saveState();
    res.status(200).json({ message: 'Presença registrada com sucesso.' });
});

// Rota para adicionar uma nova tarefa na agenda
router.post('/tarefas', (req, res) => {
    const { date, time, title, description } = req.body;
    if (!date || !time || !title) {
        return res.status(400).json({ message: "Os campos 'date', 'time' e 'title' são obrigatórios." });
    }

    const dateObj = new Date(date + 'T00:00:00Z');
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();

    if (!req.appState.agenda.activities[year]) req.appState.agenda.activities[year] = {};
    if (!req.appState.agenda.activities[year][month]) req.appState.agenda.activities[year][month] = {};
    if (!req.appState.agenda.activities[year][month][day]) req.appState.agenda.activities[year][month][day] = [];

    req.appState.agenda.activities[year][month][day].push({ time, title, description });

    req.saveState();

    // --- CORREÇÃO APLICADA AQUI ---
    // Em vez de enviar texto, enviamos um objeto JSON com uma chave "message"
    res.status(201).json({ message: 'Tarefa adicionada com sucesso!' });
});

module.exports = router;