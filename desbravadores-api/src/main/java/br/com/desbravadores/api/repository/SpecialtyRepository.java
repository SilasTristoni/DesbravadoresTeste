package br.com.desbravadores.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.desbravadores.api.model.Specialty;

public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {

    Optional<Specialty> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
