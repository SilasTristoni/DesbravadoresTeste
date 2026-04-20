package br.com.desbravadores.api.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.XpProgressionPolicy;

@Configuration
public class XpMigrationConfig {

    @Bean
    ApplicationRunner backfillTotalXp(UserRepository userRepository) {
        return args -> userRepository.findAll().forEach(user -> {
            int derivedTotalXp = XpProgressionPolicy.totalXpForSnapshot(user.getLevel(), user.getXp());
            if (user.getTotalXp() != derivedTotalXp) {
                user.setTotalXp(derivedTotalXp);
                userRepository.save(user);
            }
        });
    }
}
