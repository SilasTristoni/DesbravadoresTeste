package br.com.desbravadores.api.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Converte o caminho relativo (ex: 'file') para um caminho absoluto
        String uploadPath = Paths.get(uploadDir).toFile().getAbsolutePath();

        // Mapeia requisições para a URL /file/** para a pasta física 'file'
        // O "file:/" é crucial para indicar que é um caminho no sistema de ficheiros.
        registry.addResourceHandler("/" + uploadDir + "/**")
                .addResourceLocations("file:/" + uploadPath + "/");
    }
}