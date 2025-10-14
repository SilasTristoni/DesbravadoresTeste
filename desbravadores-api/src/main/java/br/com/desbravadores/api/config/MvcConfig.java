package br.com.desbravadores.api.config;

import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer; // IMPORT ADICIONADO

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ---- CONFIGURAÇÃO ATUALIZADA AQUI ----
        // Converte o caminho relativo 'uploads' para um caminho absoluto
        String uploadPath = Paths.get("uploads").toFile().getAbsolutePath();

        // Mapeia requisições para a URL /uploads/** para a pasta física 'uploads'
        // O "file:/" é crucial para indicar que é um caminho no sistema de ficheiros.
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/" + uploadPath + "/");
    }
}