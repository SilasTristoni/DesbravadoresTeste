package br.com.desbravadores.api.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.XpLog;
import br.com.desbravadores.api.model.XpSourceType;

@Repository
public interface XpLogRepository extends JpaRepository<XpLog, Long> {

    List<XpLog> findTop12ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            select coalesce(sum(log.amount), 0)
            from XpLog log
            where log.user.id = :userId
              and log.sourceType in :sourceTypes
            """)
    int sumAmountByUserIdAndSourceTypes(@Param("userId") Long userId, @Param("sourceTypes") Collection<XpSourceType> sourceTypes);
}
