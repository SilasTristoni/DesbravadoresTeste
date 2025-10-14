package br.com.desbravadores.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    long countByGroupId(Long groupId);
    List<User> findByGroupIdAndRole(Long groupId, Role role);

    // ---- NOVO MÉTODO ADICIONADO AQUI ----
    // Procura todos os utilizadores (independentemente do cargo) que pertencem a um grupo.
    List<User> findByGroupId(Long groupId);
}