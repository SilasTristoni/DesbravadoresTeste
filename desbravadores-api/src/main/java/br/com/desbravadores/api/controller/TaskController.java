package br.com.desbravadores.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.TaskResponseDTO;
import br.com.desbravadores.api.model.Task;
import br.com.desbravadores.api.service.TaskService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> createTask(@RequestBody Task task, Authentication authentication) {
        try {
            return ResponseEntity.status(201).body(taskService.createTask(task, authentication));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task taskDetails, Authentication authentication) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, taskDetails, authentication));
        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : "Nao foi possivel atualizar a tarefa.";
            if (message.contains("nao encontrada")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("message", message));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('DESBRAVADOR', 'MONITOR', 'DIRETOR')")
    public ResponseEntity<?> getTasksByMonth(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(value = "groupId", required = false) Long groupId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            Pageable pageable,
            Authentication authentication) {

        boolean pagedRequest = page != null || size != null || pageable.getSort().isSorted();
        if (pagedRequest) {
            Page<TaskResponseDTO> taskPage = taskService.getTasksPage(year, month, groupId, pageable, authentication);
            return ResponseEntity.ok(taskPage);
        }

        Sort sort = Sort.by(Sort.Order.asc("date"), Sort.Order.asc("time"));
        List<TaskResponseDTO> tasks = taskService.getTasksList(year, month, groupId, sort, authentication);
        return ResponseEntity.ok(tasks);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        try {
            taskService.deleteTask(id, authentication);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : "Nao foi possivel apagar a tarefa.";
            if (message.contains("nao encontrada")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("message", message));
        }
    }
}
