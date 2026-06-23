package br.com.desbravadores.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.XpProgressionPolicy;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminUsername = "adm";

        var existingAdmin = userRepository.findByUsername(adminUsername);

        if (existingAdmin.isEmpty()) {
            User adminUser = new User();
            adminUser.setName("Admin");
            adminUser.setSurname("do Sistema");
            adminUser.setUsername(adminUsername);
            adminUser.setPassword(passwordEncoder.encode("adm123"));
            adminUser.setRole(Role.DIRETOR);
            adminUser.setAvatar("img/escoteiro.png");
            adminUser.setLevel(99);
            adminUser.setXp(0);
            adminUser.setTotalXp(XpProgressionPolicy.totalXpForSnapshot(adminUser.getLevel(), adminUser.getXp()));
            adminUser.setGroup(null);

            userRepository.save(adminUser);
            log.info("Default administrator created with username={}", adminUsername);
            return;
        }

        User adminUser = existingAdmin.get();
        if (adminUser.getRole() != Role.DIRETOR) {
            Role previousRole = adminUser.getRole();
            adminUser.setRole(Role.DIRETOR);
            adminUser.setGroup(null);
            userRepository.save(adminUser);
            log.warn("Default administrator role corrected username={} previousRole={} newRole={}",
                    adminUsername, previousRole, Role.DIRETOR);
            return;
        }

        log.info("Default administrator already exists with username={} role={}", adminUsername, adminUser.getRole());
    }
}
