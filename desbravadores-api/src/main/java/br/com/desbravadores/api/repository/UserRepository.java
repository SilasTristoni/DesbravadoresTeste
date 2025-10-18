package br.com.desbravadores.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository; // NOVO IMPORT
import org.springframework.stereotype.Repository; // NOVO IMPORT

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    
    // MÉTODOS ATUALIZADOS PARA PAGINAÇÃO
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByGroupIdAndRole(Long groupId, Role role, Pageable pageable);
    
    // Métodos antigos que retornavam List<> que não foram substituídos para manter compatibilidade
    List<User> findByRole(Role role); // Mantido por compatibilidade em outros locais
    
    long countByGroupId(Long groupId);
    List<User> findByGroupIdAndRole(Long groupId, Role role); // Mantido por compatibilidade

    // Procura todos os utilizadores (independentemente do cargo) que pertencem a um grupo.
    List<User> findByGroupId(Long groupId);
}