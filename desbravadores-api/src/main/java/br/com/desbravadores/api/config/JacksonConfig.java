package br.com.desbravadores.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;

@Configuration
public class JacksonConfig {

    /**
     * Registra o módulo Hibernate para que o Jackson saiba como lidar com proxies.
     * Isso complementa o @Transactional nos controllers.
     */
    @Bean
    public Hibernate5JakartaModule hibernate5Module() {
        Hibernate5JakartaModule module = new Hibernate5JakartaModule();
        // Não tentar forçar o carregamento, se a sessão estiver fechada, ele ignora.
        module.configure(Hibernate5JakartaModule.Feature.FORCE_LAZY_LOADING, false);
        return module;
    }
}