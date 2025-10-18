package br.com.desbravadores.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository; // NOVO IMPORT
import org.springframework.stereotype.Repository; // NOVO IMPORT

import br.com.desbravadores.api.model.Group;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    // Adiciona o método findAll com paginação
    Page<Group> findAll(Pageable pageable);
}