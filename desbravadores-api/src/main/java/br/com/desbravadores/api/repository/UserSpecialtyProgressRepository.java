package br.com.desbravadores.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.desbravadores.api.model.UserSpecialtyProgress;

public interface UserSpecialtyProgressRepository extends JpaRepository<UserSpecialtyProgress, Long> {

    List<UserSpecialtyProgress> findByUserId(Long userId);
    Optional<UserSpecialtyProgress> findByUserIdAndSpecialtyId(Long userId, Long specialtyId);
}
