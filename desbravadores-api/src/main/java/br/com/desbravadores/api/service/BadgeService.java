package br.com.desbravadores.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.model.Badge;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.BadgeRepository;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class BadgeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BadgeRepository badgeRepository;

    @Transactional
    public User assignBadgeToUser(Long userId, Long badgeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado com o ID: " + userId));
        
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new RuntimeException("Emblema não encontrado com o ID: " + badgeId));

        user.getBadges().add(badge);

        return userRepository.save(user);
    }

    /**
     * NOVO MÉTODO ADICIONADO AQUI
     * Remove um emblema de um utilizador.
     * @param userId O ID do utilizador.
     * @param badgeId O ID do emblema a ser removido.
     */
    @Transactional
    public void removeBadgeFromUser(Long userId, Long badgeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado com o ID: " + userId));
        
        // Procura o emblema na coleção de emblemas do utilizador e remove-o se existir
        user.getBadges().removeIf(badge -> badge.getId().equals(badgeId));

        // Salva o utilizador para persistir a remoção na tabela 'user_badges'
        userRepository.save(user);
    }
}