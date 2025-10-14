package br.com.desbravadores.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
// Estas anotações forçam o Spring a procurar nos pacotes corretos
@EntityScan(basePackages = "br.com.desbravadores.api.model") 
@EnableJpaRepositories(basePackages = "br.com.desbravadores.api.repository")
public class DesbravadoresApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DesbravadoresApiApplication.class, args);
    }

}