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

        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            User adminUser = new User();
            adminUser.setName("Admin");
            adminUser.setSurname("do Sistema");
            adminUser.setUsername(adminUsername);
            adminUser.setPassword(passwordEncoder.encode("adm123")); 
            adminUser.setRole(Role.DIRETOR);
            adminUser.setAvatar("img/escoteiro.png");
            adminUser.setLevel(99);
            adminUser.setXp(0);
            adminUser.setGroup(null);

            userRepository.save(adminUser);
            log.info("Default administrator created with username={}", adminUsername);
        } else {
            log.info("Default administrator already exists with username={}", adminUsername);
        }
    }
}
