package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.AttendanceRecord;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    // Busca registros de um grupo em uma data específica
    List<AttendanceRecord> findByGroupIdAndDate(Long groupId, LocalDate date);

    // Busca histórico de um usuário
    List<AttendanceRecord> findByUserIdOrderByDateDesc(Long userId);

    // --- NOVOS MÉTODOS PARA ESTATÍSTICAS ---
    
    // Conta quantas vezes o usuário esteve presente
    long countByUserIdAndPresentTrue(Long userId);
    
    // Conta quantas chamadas ocorreram no total para o grupo (para base do cálculo de %)
    long countByGroupId(Long groupId);
}