const { Group, User } = require('../models');

// Criar um novo grupo
exports.createGroup = async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obter todos os grupos com seus membros e líder
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'surname', 'rank'] },
        { model: User, as: 'leader', attributes: ['id', 'name', 'surname'] }
      ]
    });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obter um grupo por ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
        include: [
            { model: User, as: 'members', attributes: ['id', 'name', 'surname', 'rank'] },
            { model: User, as: 'leader', attributes: ['id', 'name', 'surname'] }
        ]
    });
    if (!group) {
      return res.status(404).json({ message: 'Grupo não encontrado.' });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ATUALIZAÇÃO: Atualizar um grupo por ID
exports.updateGroup = async (req, res) => {
    try {
        const [updated] = await Group.update(req.body, {
            where: { id: req.params.id }
        });

        if (!updated) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        const updatedGroup = await Group.findByPk(req.params.id);
        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ATUALIZAÇÃO: Deletar um grupo por ID
exports.deleteGroup = async (req, res) => {
    try {
        const deleted = await Group.destroy({
            where: { id: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        res.status(204).send(); // Resposta de sucesso sem conteúdo
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};