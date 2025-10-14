package br.com.desbravadores.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    // O JpaRepository já nos dá métodos como findAll(), save(), findById(), etc.
}