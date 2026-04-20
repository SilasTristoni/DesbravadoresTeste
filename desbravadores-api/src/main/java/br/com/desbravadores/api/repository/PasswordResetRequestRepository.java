package br.com.desbravadores.api.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.PasswordResetRequest;
import br.com.desbravadores.api.model.PasswordResetStatus;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

    Optional<PasswordResetRequest> findTop1ByUserIdAndStatusInOrderByRequestedAtDesc(Long userId, Collection<PasswordResetStatus> statuses);

    Optional<PasswordResetRequest> findTop1ByUserUsernameAndResetCodeAndStatusOrderByRequestedAtDesc(
            String username,
            String resetCode,
            PasswordResetStatus status
    );

    List<PasswordResetRequest> findTop20ByOrderByRequestedAtDesc();
}
