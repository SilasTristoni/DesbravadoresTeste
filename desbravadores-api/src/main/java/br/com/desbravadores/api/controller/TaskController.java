package br.com.desbravadores.api.controller;

import java.time.LocalDate;
import java.time.YearMonth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.Task;
import br.com.desbravadores.api.repository.TaskRepository;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    /**
     * Endpoint para criar uma nova tarefa.
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task savedTask = taskRepository.save(task);
        return ResponseEntity.status(201).body(savedTask);
    }

    /**
     * NOVO ENDPOINT: Para um MONITOR ou DIRETOR atualizar uma tarefa existente.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id).map(task -> {
            task.setTitle(taskDetails.getTitle());
            task.setDescription(taskDetails.getDescription());
            task.setDate(taskDetails.getDate());
            task.setTime(taskDetails.getTime());
            Task updatedTask = taskRepository.save(task);
            return ResponseEntity.ok(updatedTask);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint para listar as tarefas de um determinado mês e ano.
     * MÉTODO ATUALIZADO COM PAGINAÇÃO
     */
    @GetMapping
    public ResponseEntity<Page<Task>> getTasksByMonth(
            @RequestParam int year, 
            @RequestParam int month,
            Pageable pageable) { // ADICIONADO
        
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // ATUALIZADO para usar o método paginado
        Page<Task> tasks = taskRepository.findByDateBetween(startDate, endDate, pageable);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Endpoint para um MONITORE ou DIRETOR apagar uma tarefa pelo ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}