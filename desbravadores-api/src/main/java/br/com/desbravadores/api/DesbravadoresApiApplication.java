package br.com.desbravadores.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

@SpringBootApplication
@EntityScan(basePackages = "br.com.desbravadores.api.model") 
@EnableJpaRepositories(basePackages = "br.com.desbravadores.api.repository")
@EnableCaching
// Adicione esta anotação para corrigir o aviso de serialização de página
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class DesbravadoresApiApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(DesbravadoresApiApplication.class, args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(DesbravadoresApiApplication.class);
    }

}
