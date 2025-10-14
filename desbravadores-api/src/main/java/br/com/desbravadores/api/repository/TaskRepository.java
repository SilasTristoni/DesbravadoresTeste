package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Novo método para encontrar todas as tarefas entre duas datas (início e fim do mês)
    List<Task> findByDateBetween(LocalDate startDate, LocalDate endDate);
}
