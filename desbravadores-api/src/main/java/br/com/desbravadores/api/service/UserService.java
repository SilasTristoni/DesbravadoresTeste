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

    private void validatePasswordStrength(String password) {
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).{8,}$";
        if (password == null || !password.matches(regex)) {
            throw new RuntimeException("A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um caractere especial.");
        }
    }

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        String username = normalizeUsername(user.getUsername());
        if (username == null || username.isBlank()) {
            throw new RuntimeException("O identificador do utilizador é obrigatório.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Já existe um utilizador com esse identificador.");
        }

        user.setUsername(username);
        user.setUnitRole(normalizeOptional(user.getUnitRole()));

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            validatePasswordStrength(user.getPassword());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void changeUserPassword(String username, PasswordChangeDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Senha atual incorreta");
        }

        validatePasswordStrength(dto.getNewPassword());
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User updateData) {
        User existingUser = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilizador não encontrado com o ID: " + id));

        if (updateData.getName() != null) existingUser.setName(updateData.getName());
        if (updateData.getSurname() != null) existingUser.setSurname(updateData.getSurname());
        if (updateData.getUsername() != null) {
            String username = normalizeUsername(updateData.getUsername());
            if (username == null || username.isBlank()) {
                throw new RuntimeException("O identificador do utilizador é obrigatório.");
            }
            boolean usernameInUse = userRepository.existsByUsername(username)
                    && !username.equals(existingUser.getUsername());
            if (usernameInUse) {
                throw new RuntimeException("Já existe um utilizador com esse identificador.");
            }
            existingUser.setUsername(username);
        }

        if (updateData.getUnitRole() != null) {
            existingUser.setUnitRole(normalizeOptional(updateData.getUnitRole()));
        }
        
        existingUser.setLevel(updateData.getLevel());
        
        if (updateData.getRole() != null) {
            existingUser.setRole(updateData.getRole());
        }
        if (updateData.getPassword() != null && !updateData.getPassword().isEmpty()) {
            validatePasswordStrength(updateData.getPassword());
            existingUser.setPassword(passwordEncoder.encode(updateData.getPassword())); 
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

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
