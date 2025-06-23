/**
 * Middleware para verificar se o usuário tem a role 'admin'.
 * Este middleware deve ser usado DEPOIS do verifyToken,
 * pois ele depende do req.user que o verifyToken adiciona.
 */
const verifyAdmin = (req, res, next) => {
  // O objeto req.user foi adicionado pelo middleware verifyToken
  if (req.user && req.user.role === 'admin') {
    // Se o usuário tem a role 'admin', permite que a requisição continue
    next();
  } else {
    // Caso contrário, retorna um erro de acesso proibido
    return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

module.exports = verifyAdmin;