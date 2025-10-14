package br.com.desbravadores.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Badge;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    // O Spring Data JPA já nos fornece todos os métodos básicos de que precisamos (findAll, save, etc.)
}