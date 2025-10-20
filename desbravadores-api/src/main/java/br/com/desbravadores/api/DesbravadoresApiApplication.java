package br.com.desbravadores.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "br.com.desbravadores.api.model") 
@EnableJpaRepositories(basePackages = "br.com.desbravadores.api.repository")
@EnableCaching // Habilita o cache na aplicação
public class DesbravadoresApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DesbravadoresApiApplication.class, args);
    }

}