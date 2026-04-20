package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
        select t
        from Task t
        where t.date between :startDate and :endDate
          and (
              :includeAll = true
              or t.group is null
              or (:groupId is not null and t.group.id = :groupId)
          )
        """)
    Page<Task> findVisibleTasks(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("groupId") Long groupId,
            @Param("includeAll") boolean includeAll,
            Pageable pageable
    );

    @Query("""
        select t
        from Task t
        where t.date between :startDate and :endDate
          and (
              :includeAll = true
              or t.group is null
              or (:groupId is not null and t.group.id = :groupId)
          )
        """)
    List<Task> findVisibleTasks(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("groupId") Long groupId,
            @Param("includeAll") boolean includeAll,
            Sort sort
    );
}
