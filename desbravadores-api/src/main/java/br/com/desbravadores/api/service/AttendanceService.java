package br.com.desbravadores.api.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.dto.AttendanceHistoryDTO;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    /**
     * NOVO MÉTODO: Retorna o histórico de presenças do usuário.
     * @param user O usuário logado.
     * @return Lista de AttendanceHistoryDTO.
     */
    public List<AttendanceHistoryDTO> getUserAttendanceHistory(User user) {
        List<AttendanceRecord> records = attendanceRecordRepository.findByUserIdOrderByDateDesc(user.getId());

        return records.stream()
            .map(record -> new AttendanceHistoryDTO(
                record.getDate(),
                true, // Sempre true, pois só registramos presenças
                record.getGroup() != null ? record.getGroup().getName() : "Sem Grupo"
            ))
            .collect(Collectors.toList());
    }
}
