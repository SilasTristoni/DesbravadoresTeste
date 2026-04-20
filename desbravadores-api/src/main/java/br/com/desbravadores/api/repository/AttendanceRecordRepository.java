package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.AttendanceRecord;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByGroupIdAndDate(Long groupId, LocalDate date);

    List<AttendanceRecord> findByUserIdOrderByDateDesc(Long userId);

    long countByUserIdAndPresentTrue(Long userId);

    long countDistinctDateByGroupId(Long groupId);
}
