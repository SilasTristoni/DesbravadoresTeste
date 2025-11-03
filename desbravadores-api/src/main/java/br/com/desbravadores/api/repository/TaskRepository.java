package br.com.desbravadores.api.repository;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // MÉTODO ATUALIZADO para encontrar tarefas com paginação
    Page<Task> findByDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
}