'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Um usuário pertence a um grupo
      User.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group'
      });

      // Um usuário pode ter muitas conquistas
      User.belongsToMany(models.Achievement, {
        through: 'UserAchievements', // Nome da tabela de junção
        foreignKey: 'userId',
        otherKey: 'achievementId',
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rank: {
      type: DataTypes.STRING,
      defaultValue: 'Aventureiro',
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user' // 'user' ou 'admin'
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    sequelize,
    modelName: 'User',
  });

  // Método para validar a senha do usuário
  User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  return User;
};
