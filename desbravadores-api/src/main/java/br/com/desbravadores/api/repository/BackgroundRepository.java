package br.com.desbravadores.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.desbravadores.api.model.Background;

@Repository
public interface BackgroundRepository extends JpaRepository<Background, Long> {
}