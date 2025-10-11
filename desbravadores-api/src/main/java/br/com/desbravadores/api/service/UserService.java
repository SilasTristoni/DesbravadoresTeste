package br.com.desbravadores.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Para o registro PÚBLICO. Sempre cria um DESBRAVADOR.
     */
    public User registerUser(User newUser) {
        newUser.setRole(Role.DESBRAVADOR);
        // Reutiliza a lógica principal de criação de usuário
        return createUser(newUser); 
    }

    /**
     * Para criação de usuários pelo ADMIN.
     * O cargo é definido pelo que vem no corpo da requisição.
     */
    public User createUser(User user) {
        // Codifica a senha antes de salvar
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);

        // Salva o usuário no banco de dados com o cargo que foi fornecido
        return userRepository.save(user);
    }
}