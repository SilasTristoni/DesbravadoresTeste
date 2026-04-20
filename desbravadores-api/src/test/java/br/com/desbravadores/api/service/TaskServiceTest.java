package br.com.desbravadores.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import br.com.desbravadores.api.dto.TaskResponseDTO;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.Task;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.TaskRepository;
import br.com.desbravadores.api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(taskService, "apiDtoMapper", new ApiDtoMapper());
    }

    @Test
    void createTaskAssignsAuthenticatedGroupForMonitor() {
        Group group = new Group();
        group.setId(8L);
        group.setName("Aguia");

        User monitor = new User();
        monitor.setUsername("monitor");
        monitor.setRole(Role.MONITOR);
        monitor.setGroup(group);

        Task newTask = new Task();
        newTask.setTitle("  Reuniao semanal  ");
        newTask.setDescription("  Planeamento da unidade  ");
        newTask.setDate(LocalDate.of(2026, 4, 21));
        newTask.setTime(LocalTime.of(19, 30));

        Authentication authentication = new UsernamePasswordAuthenticationToken("monitor", "x");

        when(userRepository.findByUsername("monitor")).thenReturn(java.util.Optional.of(monitor));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(15L);
            return saved;
        });

        TaskResponseDTO response = taskService.createTask(newTask, authentication);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertThat(captor.getValue().getGroup().getId()).isEqualTo(8L);
        assertThat(captor.getValue().getTitle()).isEqualTo("Reuniao semanal");
        assertThat(response.groupName()).isEqualTo("Aguia");
    }

    @Test
    void updateTaskRejectsTaskOutsideMonitorGroup() {
        Group monitorGroup = new Group();
        monitorGroup.setId(8L);

        Group otherGroup = new Group();
        otherGroup.setId(9L);

        User monitor = new User();
        monitor.setUsername("monitor");
        monitor.setRole(Role.MONITOR);
        monitor.setGroup(monitorGroup);

        Task existingTask = new Task();
        existingTask.setId(33L);
        existingTask.setGroup(otherGroup);

        Task updatePayload = new Task();
        updatePayload.setTitle("Nova");
        updatePayload.setDate(LocalDate.now());
        updatePayload.setTime(LocalTime.NOON);

        Authentication authentication = new UsernamePasswordAuthenticationToken("monitor", "x");

        when(userRepository.findByUsername("monitor")).thenReturn(java.util.Optional.of(monitor));
        when(taskRepository.findById(33L)).thenReturn(java.util.Optional.of(existingTask));

        assertThatThrownBy(() -> taskService.updateTask(33L, updatePayload, authentication))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("permissao");
    }

    @Test
    void getTasksListAllowsDirectorToSeeGlobalCatalogWithoutGroupFilter() {
        User director = new User();
        director.setUsername("diretor");
        director.setRole(Role.DIRETOR);

        Task globalTask = new Task();
        globalTask.setId(1L);
        globalTask.setTitle("Campori");
        globalTask.setDate(LocalDate.of(2026, 5, 1));
        globalTask.setTime(LocalTime.of(9, 0));

        Authentication authentication = new UsernamePasswordAuthenticationToken("diretor", "x");

        when(userRepository.findByUsername("diretor")).thenReturn(java.util.Optional.of(director));
        when(taskRepository.findVisibleTasks(any(LocalDate.class), any(LocalDate.class), any(), any(Boolean.class), any(Sort.class)))
                .thenReturn(List.of(globalTask));

        List<TaskResponseDTO> tasks = taskService.getTasksList(2026, 5, null, Sort.unsorted(), authentication);

        assertThat(tasks).hasSize(1);
        assertThat(tasks.get(0).global()).isTrue();
    }
}
