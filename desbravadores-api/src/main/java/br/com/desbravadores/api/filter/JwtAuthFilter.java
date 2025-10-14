package br.com.desbravadores.api.filter;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import br.com.desbravadores.api.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // --- LOGS DE DEPURACAO ---
        System.out.println("\n--- JWT AUTH FILTER ---");
        System.out.println("A processar requisição para: " + request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            System.out.println("Token encontrado no cabeçalho.");
            try {
                username = tokenService.extractUsername(token);
                System.out.println("Username extraído do token: " + username);
            } catch (Exception e) {
                System.out.println("Erro ao extrair username do token: " + e.getMessage());
            }
        } else {
            System.out.println("Nenhum cabeçalho 'Authorization' com 'Bearer' token encontrado.");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("Contexto de segurança está vazio. A carregar detalhes do utilizador...");
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // ---- ESTE É O LOG MAIS IMPORTANTE ----
            System.out.println("PERMISSÕES (AUTHORITIES) CARREGADAS PARA O UTILIZADOR: " + userDetails.getAuthorities());
            
            if (tokenService.validateToken(token, userDetails)) {
                System.out.println("Token é VÁLIDO. A configurar contexto de segurança.");
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                System.out.println("Validação do token FALHOU.");
            }
        }
        System.out.println("--- FIM DO FILTRO JWT ---");
        filterChain.doFilter(request, response);
    }
}