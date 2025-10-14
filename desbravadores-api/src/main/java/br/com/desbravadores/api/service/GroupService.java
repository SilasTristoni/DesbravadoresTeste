package br.com.desbravadores.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    public void deleteGroup(Long groupId) {
        // Verifica se existem utilizadores associados a este grupo
        long memberCount = userRepository.countByGroupId(groupId);

        if (memberCount > 0) {
            // Se existirem membros, lança uma exceção com uma mensagem clara.
            throw new IllegalStateException("Não é possível apagar um grupo que possui membros associados.");
        }

        // Se não houver membros, apaga o grupo.
        groupRepository.deleteById(groupId);
    }
}