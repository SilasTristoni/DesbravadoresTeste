package br.com.desbravadores.api.service;

import java.util.Collection;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = repository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        
        // ---- CORREÇÃO CRÍTICA AQUI ----
        // Removemos o prefixo "ROLE_". Agora a permissão será exatamente
        // o nome do Enum (ex: "DIRETOR", "MONITOR").
        GrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
        Collection<GrantedAuthority> authorities = Collections.singletonList(authority);

        // Retornamos o objeto User do Spring Security com a permissão explícita.
        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), authorities);
    }
}