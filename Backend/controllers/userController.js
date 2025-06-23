const { User, Group } = require('../models');

// Obter todos os usuários
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Excluir a senha da resposta
      include: { model: Group, as: 'group', attributes: ['id', 'name'] }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obter um usuário por ID (perfil público)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: { model: Group, as: 'group', attributes: ['id', 'name'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obter o perfil do usuário logado
exports.getMe = async (req, res) => {
    // O ID do usuário vem do token verificado pelo middleware
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: { model: Group, as: 'group', attributes: ['id', 'name'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Atualizar o próprio perfil
exports.updateMe = async (req, res) => {
    try {
        const [updated] = await User.update(req.body, {
            where: { id: req.user.id }
        });
        if(!updated) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};