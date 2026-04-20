package br.com.desbravadores.api.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.PasswordChangeDTO;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.UserRepository;

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
            throw new RuntimeException("A senha deve ter no minimo 8 caracteres, uma letra maiuscula, um numero e um caractere especial.");
        }
    }

    public void validatePasswordForReset(String password) {
        validatePasswordStrength(password);
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
            throw new RuntimeException("O identificador do utilizador e obrigatorio.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Ja existe um utilizador com esse identificador.");
        }

        String password = normalizeOptional(user.getPassword());
        if (password == null) {
            throw new RuntimeException("A senha do utilizador e obrigatoria.");
        }

        user.setName(normalizeRequired(user.getName(), "O nome do utilizador e obrigatorio."));
        user.setSurname(normalizeRequired(user.getSurname(), "O sobrenome do utilizador e obrigatorio."));
        user.setUsername(username);
        user.setUnitRole(normalizeOptional(user.getUnitRole()));
        user.setAvatar(normalizeOptional(user.getAvatar()) != null ? normalizeOptional(user.getAvatar()) : "assets/images/escoteiro1.png");
        user.setRole(requireRole(user.getRole()));
        user.setLevel(normalizeLevel(user.getLevel()));
        user.setXp(Math.max(user.getXp(), 0));
        user.setTotalXp(XpProgressionPolicy.totalXpForSnapshot(user.getLevel(), user.getXp()));
        user.setGroup(resolveGroup(user.getRole(), user.getGroup()));

        validatePasswordStrength(password);
        user.setPassword(passwordEncoder.encode(password));

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void changeUserPassword(String username, PasswordChangeDTO dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Senha atual incorreta");
        }

        validatePasswordStrength(dto.getNewPassword());
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User updateData) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado com o ID: " + id));

        if (updateData.getName() != null) {
            existingUser.setName(normalizeRequired(updateData.getName(), "O nome do utilizador e obrigatorio."));
        }
        if (updateData.getSurname() != null) {
            existingUser.setSurname(normalizeRequired(updateData.getSurname(), "O sobrenome do utilizador e obrigatorio."));
        }
        if (updateData.getUsername() != null) {
            String username = normalizeUsername(updateData.getUsername());
            if (username == null || username.isBlank()) {
                throw new RuntimeException("O identificador do utilizador e obrigatorio.");
            }
            boolean usernameInUse = userRepository.existsByUsername(username)
                    && !username.equals(existingUser.getUsername());
            if (usernameInUse) {
                throw new RuntimeException("Ja existe um utilizador com esse identificador.");
            }
            existingUser.setUsername(username);
        }

        if (updateData.getUnitRole() != null) {
            existingUser.setUnitRole(normalizeOptional(updateData.getUnitRole()));
        }

        if (updateData.getLevel() > 0) {
            existingUser.setLevel(normalizeLevel(updateData.getLevel()));
            existingUser.setTotalXp(XpProgressionPolicy.totalXpForSnapshot(existingUser.getLevel(), existingUser.getXp()));
        }

        if (updateData.getRole() != null) {
            existingUser.setRole(requireRole(updateData.getRole()));
        }

        if (updateData.getPassword() != null && !updateData.getPassword().isBlank()) {
            validatePasswordStrength(updateData.getPassword());
            existingUser.setPassword(passwordEncoder.encode(updateData.getPassword()));
        }

        if (updateData.getGroup() != null && updateData.getGroup().getId() != null) {
            existingUser.setGroup(resolveGroup(existingUser.getRole(), updateData.getGroup()));
        } else if (existingUser.getRole() == Role.DIRETOR) {
            existingUser.setGroup(null);
        }

        return userRepository.save(existingUser);
    }

    private Role requireRole(Role role) {
        if (role == null) {
            throw new RuntimeException("O cargo do utilizador e obrigatorio.");
        }
        return role;
    }

    private Group resolveGroup(Role role, Group groupPayload) {
        if (role == Role.DIRETOR) {
            return null;
        }

        if (groupPayload == null || groupPayload.getId() == null) {
            return null;
        }

        return groupRepository.findById(groupPayload.getId())
                .orElseThrow(() -> new RuntimeException("Grupo nao encontrado"));
    }

    private int normalizeLevel(int level) {
        return level > 0 ? level : 1;
    }

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new RuntimeException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
