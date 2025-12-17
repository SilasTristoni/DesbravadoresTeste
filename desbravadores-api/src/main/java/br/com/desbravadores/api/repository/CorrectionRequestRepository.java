package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.CorrectionRequest;

@Repository
public interface CorrectionRequestRepository extends JpaRepository<CorrectionRequest, Long> {

    // Busca solicitações pendentes (não aprovadas) para o Admin ver
    List<CorrectionRequest> findByApprovedFalseOrderByRequestedAtDesc();
    
    // NOVO: Verifica se já existe uma solicitação pendente para este grupo nesta data
    boolean existsByGroupIdAndDateReferenceAndApprovedFalse(Long groupId, LocalDate dateReference);
}