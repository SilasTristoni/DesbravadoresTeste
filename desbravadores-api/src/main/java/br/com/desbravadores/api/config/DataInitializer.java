package br.com.desbravadores.api.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Define o email do administrador padrão
        String adminEmail = "adm@gmail.com";

        // Verifica se o utilizador administrador já existe no banco de dados
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            
            System.out.println("--- CRIANDO UTILIZADOR ADMINISTRADOR PADRÃO ---");

            User adminUser = new User();
            adminUser.setName("Admin");
            adminUser.setSurname("do Sistema");
            adminUser.setEmail(adminEmail);
            // Codifica a senha padrão antes de salvar
            adminUser.setPassword(passwordEncoder.encode("adm123")); 
            adminUser.setRole(Role.DIRETOR);
            adminUser.setAvatar("img/escoteiro.png");
            adminUser.setLevel(99);
            adminUser.setXp(0);
            adminUser.setGroup(null); // O admin não pertence a um grupo

            userRepository.save(adminUser);

            System.out.println("--- UTILIZADOR ADMINISTRADOR CRIADO COM SUCESSO ---");
        }
    }
}