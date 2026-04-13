package br.com.desbravadores.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.desbravadores.api.model.UserRequirementProgress;

public interface UserRequirementProgressRepository extends JpaRepository<UserRequirementProgress, Long> {

    List<UserRequirementProgress> findByUserId(Long userId);
    Optional<UserRequirementProgress> findByUserIdAndRequirementId(Long userId, Long requirementId);
}
