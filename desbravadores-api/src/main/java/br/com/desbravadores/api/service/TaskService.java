package br.com.desbravadores.api.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.TaskResponseDTO;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.Task;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.TaskRepository;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ApiDtoMapper apiDtoMapper;

    @Transactional
    public TaskResponseDTO createTask(Task task, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);

        task.setTitle(normalizeRequired(task.getTitle(), "O titulo da tarefa e obrigatorio."));
        task.setDescription(normalizeOptional(task.getDescription()));
        task.setDate(requireNonNull(task.getDate(), "A data da tarefa e obrigatoria."));
        task.setTime(requireNonNull(task.getTime(), "A hora da tarefa e obrigatoria."));
        task.setGroup(resolveTargetGroup(currentUser, task.getGroup(), true));

        return apiDtoMapper.toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponseDTO updateTask(Long id, Task taskDetails, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);

        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarefa nao encontrada."));

        ensureWriteAccess(currentUser, existingTask);

        existingTask.setTitle(normalizeRequired(taskDetails.getTitle(), "O titulo da tarefa e obrigatorio."));
        existingTask.setDescription(normalizeOptional(taskDetails.getDescription()));
        existingTask.setDate(requireNonNull(taskDetails.getDate(), "A data da tarefa e obrigatoria."));
        existingTask.setTime(requireNonNull(taskDetails.getTime(), "A hora da tarefa e obrigatoria."));

        if (currentUser.getRole() == Role.DIRETOR && taskDetails.getGroup() != null) {
            existingTask.setGroup(resolveTargetGroup(currentUser, taskDetails.getGroup(), false));
        }

        return apiDtoMapper.toTaskResponse(taskRepository.save(existingTask));
    }

    @Transactional(readOnly = true)
    public Page<TaskResponseDTO> getTasksPage(int year, int month, Long groupId, Pageable pageable, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        TaskVisibility visibility = resolveVisibility(currentUser, groupId);
        YearMonth yearMonth = YearMonth.of(year, month);

        return taskRepository.findVisibleTasks(
                        yearMonth.atDay(1),
                        yearMonth.atEndOfMonth(),
                        visibility.groupId(),
                        visibility.includeAll(),
                        pageable
                )
                .map(apiDtoMapper::toTaskResponse);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getTasksList(int year, int month, Long groupId, Sort sort, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        TaskVisibility visibility = resolveVisibility(currentUser, groupId);
        YearMonth yearMonth = YearMonth.of(year, month);
        Sort effectiveSort = sort.isSorted()
                ? sort
                : Sort.by(Sort.Order.asc("date"), Sort.Order.asc("time"));

        return taskRepository.findVisibleTasks(
                        yearMonth.atDay(1),
                        yearMonth.atEndOfMonth(),
                        visibility.groupId(),
                        visibility.includeAll(),
                        effectiveSort
                )
                .stream()
                .map(apiDtoMapper::toTaskResponse)
                .toList();
    }

    @Transactional
    public void deleteTask(Long id, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarefa nao encontrada."));

        ensureWriteAccess(currentUser, task);
        taskRepository.delete(task);
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilizador autenticado nao encontrado."));
    }

    private TaskVisibility resolveVisibility(User currentUser, Long requestedGroupId) {
        if (currentUser.getRole() == Role.DIRETOR) {
            return new TaskVisibility(requestedGroupId, requestedGroupId == null);
        }

        Long groupId = currentUser.getGroup() != null ? currentUser.getGroup().getId() : null;
        return new TaskVisibility(groupId, false);
    }

    private void ensureWriteAccess(User currentUser, Task task) {
        if (currentUser.getRole() == Role.DIRETOR) {
            return;
        }

        Long currentGroupId = currentUser.getGroup() != null ? currentUser.getGroup().getId() : null;
        Long taskGroupId = task.getGroup() != null ? task.getGroup().getId() : null;

        if (currentGroupId == null || taskGroupId == null || !currentGroupId.equals(taskGroupId)) {
            throw new RuntimeException("Voce nao tem permissao para alterar esta tarefa.");
        }
    }

    private Group resolveTargetGroup(User currentUser, Group requestedGroup, boolean allowGlobalForDirector) {
        if (currentUser.getRole() == Role.DIRETOR) {
            if (requestedGroup != null && requestedGroup.getId() != null) {
                return groupRepository.findById(requestedGroup.getId())
                        .orElseThrow(() -> new RuntimeException("Unidade nao encontrada."));
            }

            if (currentUser.getGroup() != null) {
                return currentUser.getGroup();
            }

            return allowGlobalForDirector ? null : null;
        }

        if (currentUser.getGroup() == null) {
            throw new RuntimeException("O utilizador precisa estar vinculado a uma unidade para gerir tarefas.");
        }

        return currentUser.getGroup();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new RuntimeException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private <T> T requireNonNull(T value, String message) {
        if (value == null) {
            throw new RuntimeException(message);
        }
        return value;
    }

    private record TaskVisibility(Long groupId, boolean includeAll) {
    }
}
