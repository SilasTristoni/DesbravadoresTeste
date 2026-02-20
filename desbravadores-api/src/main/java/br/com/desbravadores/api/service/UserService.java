package br.com.desbravadores.api.service;

import br.com.desbravadores.api.dto.PasswordChangeDTO;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // --- MÉTODO RESTAURADO PARA O PROFILE CONTROLLER ---
    @Transactional
    public void changeUserPassword(String email, PasswordChangeDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Senha atual incorreta");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    // --- MÉTODO DE ATUALIZAÇÃO CORRIGIDO ---
    @Transactional
    public User updateUser(Long id, User updateData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado com o ID: " + id));

        if (updateData.getName() != null) existingUser.setName(updateData.getName());
        if (updateData.getSurname() != null) existingUser.setSurname(updateData.getSurname());
        if (updateData.getEmail() != null) existingUser.setEmail(updateData.getEmail());
        
        // CORREÇÃO: Removida a comparação '!= null' para int primitivo
        // Se no seu Model 'level' for 'int', ele sempre terá um valor (0 por padrão).
        // Se for 'Integer', o erro não aconteceria. Ajustado para garantir compatibilidade:
        existingUser.setLevel(updateData.getLevel());
        
        if (updateData.getRole() != null) {
            existingUser.setRole(updateData.getRole());
        }

        if (updateData.getGroup() != null && updateData.getGroup().getId() != null) {
            Group group = groupRepository.findById(updateData.getGroup().getId())
                    .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
            existingUser.setGroup(group);
        } else if (updateData.getRole() != null && updateData.getRole().toString().equals("DIRETOR")) {
            existingUser.setGroup(null);
        }

        return userRepository.save(existingUser);
    }
}