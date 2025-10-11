package br.com.desbravadores.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.User; // Importe o Optional

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // NOVO MÉTODO ADICIONADO
    // O Spring Data JPA é inteligente o suficiente para criar a consulta
    // SQL necessária apenas pela assinatura do método.
    // "Encontre um usuário pelo seu email".
    Optional<User> findByEmail(String email);
}