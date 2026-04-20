package br.com.desbravadores.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Achievement;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Achievement> findByNameIgnoreCase(String name);
}
