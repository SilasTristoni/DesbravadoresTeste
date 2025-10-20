package br.com.desbravadores.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Achievement;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    // Apenas os métodos padrão do JpaRepository são necessários agora.
}