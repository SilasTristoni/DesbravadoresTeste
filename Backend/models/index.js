const sequelize = require("../config/database");
const UserFactory = require("./user");
const GroupFactory = require("./group");
const TaskFactory = require("./task");

const User = UserFactory(sequelize);
const Group = GroupFactory(sequelize);
const Task = TaskFactory(sequelize);

// Definindo as associações
// Um Grupo pode ter muitos Usuários
Group.hasMany(User, {
  foreignKey: "groupId",
  as: "members",
});
// Um Usuário pertence a um Grupo
User.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

// Um Usuário (Líder) pode ser responsável por um Grupo
User.hasOne(Group, {
  foreignKey: "leaderId",
  as: "ledGroup",
});
Group.belongsTo(User, {
  foreignKey: "leaderId",
  as: "leader",
});

const db = {
  sequelize,
  User,
  Group,
  Task,
};

module.exports = db;
