package br.com.desbravadores.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    
    // --- MÉTODOS ATUALIZADOS PARA PAGINAÇÃO ---
    
    Page<User> findByRole(Role role, Pageable pageable);
    
    Page<User> findByGroupIdAndRole(Long groupId, Role role, Pageable pageable);
    
    // NOVO: Adicionado para corrigir o erro no AdminController
    Page<User> findByGroupId(Long groupId, Pageable pageable);
    
    // --- Métodos antigos (mantidos para compatibilidade) ---
    
    List<User> findByRole(Role role); 
    
    long countByGroupId(Long groupId);
    
    List<User> findByGroupIdAndRole(Long groupId, Role role); 

    List<User> findByGroupId(Long groupId);
}