package br.com.desbravadores.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.PasswordChangeDTO; // NOVO IMPORT
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

    public User registerUser(User newUser) {
        newUser.setRole(Role.DESBRAVADOR);
        return createUser(newUser);
    }

    @Transactional
    public User createUser(User user) {
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.MONITOR && savedUser.getGroup() != null) {
            Group groupToUpdate = groupRepository.findById(savedUser.getGroup().getId()).orElse(null);
            if (groupToUpdate != null) {
                groupToUpdate.setLeader(savedUser);
                groupRepository.save(groupToUpdate);
            }
        }

        return savedUser;
    }

    // NOVO MÉTODO PARA ALTERAR SENHA
    @Transactional
    public void changeUserPassword(String userEmail, PasswordChangeDTO passwordChangeDTO) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // 1. Verifica se a senha atual está correta
        if (!passwordEncoder.matches(passwordChangeDTO.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("A senha atual está incorreta.");
        }

        // 2. Verifica se a nova senha não está em branco
        if (passwordChangeDTO.getNewPassword() == null || passwordChangeDTO.getNewPassword().isBlank()) {
            throw new RuntimeException("A nova senha não pode estar em branco.");
        }

        // 3. Codifica e salva a nova senha
        user.setPassword(passwordEncoder.encode(passwordChangeDTO.getNewPassword()));
        userRepository.save(user);
    }
}