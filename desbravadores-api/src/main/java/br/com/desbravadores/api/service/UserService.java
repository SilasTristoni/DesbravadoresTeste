package br.com.desbravadores.api.service;

import org.springframework.beans.factory.annotation.Autowired; // IMPORT ADICIONADO
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // IMPORT ADICIONADO

import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.UserRepository; // IMPORT ADICIONADO

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository; // INJEÇÃO DO REPOSITÓRIO DE GRUPOS

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(User newUser) {
        newUser.setRole(Role.DESBRAVADOR);
        return createUser(newUser);
    }

    /**
     * MÉTODO ATUALIZADO
     * Agora, ele contém a lógica para definir o líder do grupo automaticamente.
     * @Transactional garante que todas as operações no banco de dados (salvar utilizador e
     * atualizar grupo) sejam executadas como uma única transação.
     */
    @Transactional
    public User createUser(User user) {
        // Codifica a senha antes de salvar
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);

        // Salva o utilizador para que ele tenha um ID
        User savedUser = userRepository.save(user);

        // ---- NOVA LÓGICA DE NEGÓCIO ADICIONADA AQUI ----
        // Verifica se o novo utilizador é um MONITOR e se foi associado a um grupo
        if (savedUser.getRole() == Role.MONITOR && savedUser.getGroup() != null) {
            
            System.out.println("--- DETETADO NOVO MONITOR PARA O GRUPO ID: " + savedUser.getGroup().getId() + " ---");

            // Busca o grupo no banco de dados para garantir que temos a entidade completa
            Group groupToUpdate = groupRepository.findById(savedUser.getGroup().getId()).orElse(null);

            if (groupToUpdate != null) {
                // Define o novo MONITOR como o líder do grupo
                groupToUpdate.setLeader(savedUser);
                // Salva a alteração no grupo
                groupRepository.save(groupToUpdate);
                System.out.println("--- GRUPO ATUALIZADO COM O NOVO LÍDER ---");
            }
        }

        return savedUser;
    }
}