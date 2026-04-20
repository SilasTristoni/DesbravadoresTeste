package br.com.desbravadores.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.desbravadores.api.dto.AttendanceHistoryDTO;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void getUserAttendanceHistoryKeepsPresenceAndJustification() {
        User user = new User();
        user.setId(7L);

        Group group = new Group();
        group.setName("Aguia");

        AttendanceRecord record = new AttendanceRecord();
        record.setDate(LocalDate.of(2026, 4, 10));
        record.setPresent(false);
        record.setJustification("Doenca");
        record.setGroup(group);

        when(attendanceRecordRepository.findByUserIdOrderByDateDesc(7L)).thenReturn(List.of(record));

        List<AttendanceHistoryDTO> history = attendanceService.getUserAttendanceHistory(user);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).isPresent()).isFalse();
        assertThat(history.get(0).getGroupName()).isEqualTo("Aguia");
        assertThat(history.get(0).getJustification()).isEqualTo("Doenca");
    }
}
