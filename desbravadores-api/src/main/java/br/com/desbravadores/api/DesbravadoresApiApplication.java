package br.com.desbravadores.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling; // NOVO

@SpringBootApplication
@EntityScan(basePackages = "br.com.desbravadores.api.model") 
@EnableJpaRepositories(basePackages = "br.com.desbravadores.api.repository")
@EnableCaching
@EnableScheduling // Habilita o Scheduler
public class DesbravadoresApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DesbravadoresApiApplication.class, args);
    }
}