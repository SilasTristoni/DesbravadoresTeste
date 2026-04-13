package br.com.desbravadores.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ServerPortConfig implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    private static final Logger log = LoggerFactory.getLogger(ServerPortConfig.class);

    @Value("${app.server.port-mode:fixed}")
    private String portMode;

    @Value("${app.server.fixed-port:${server.port:8080}}")
    private int fixedPort;

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        if ("dynamic".equalsIgnoreCase(portMode)) {
            factory.setPort(0);
            return;
        }

        factory.setPort(fixedPort);
    }

    @EventListener
    public void onWebServerReady(WebServerInitializedEvent event) {
        int activePort = event.getWebServer().getPort();
        log.info("Application running on http://localhost:{} (mode: {})", activePort, portMode);
        log.info("Frontend available at http://localhost:{}/login.html", activePort);
    }
}
