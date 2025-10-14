package br.com.desbravadores.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica a configuração a todos os endpoints da API
                // Permite requisições vindas destas origens (o seu frontend)
                .allowedOrigins("http://127.0.0.1:5500", "http://localhost:5500") 
                // Define quais métodos HTTP são permitidos
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") 
                // Permite que todos os cabeçalhos sejam enviados na requisição
                .allowedHeaders("*") 
                // Permite o envio de credenciais (como cookies ou tokens de autenticação)
                .allowCredentials(true);
    }
}