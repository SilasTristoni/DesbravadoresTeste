package br.com.desbravadores.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.desbravadores.api.model.Requirement;

public interface RequirementRepository extends JpaRepository<Requirement, Long> {

    Optional<Requirement> findByTitleIgnoreCaseAndClassLevelIgnoreCase(String title, String classLevel);
}
