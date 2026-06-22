package br.com.desbravadores.api.service;

import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class TokenService {

    @Value("${jwt.expiration.ms}")
    private long expirationTimeMillis;

    private final Key secretKey;

    public TokenService(@Value("${jwt.secret}") String jwtSecret) {
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("jwt.secret/JWT_SECRET must have at least 32 bytes for HS256.");
        }
        this.secretKey = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(User user) {
        Date expirationDate = new Date(System.currentTimeMillis() + expirationTimeMillis);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        claims.put("name", user.getName());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(expirationDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * NOVO MÉTODO: Renova um token existente.
     * Mantém as informações (claims) do token antigo, mas atualiza a data de expiração.
     */
    public String refreshToken(String oldToken) {
        // Remove prefixo Bearer se existir
        if (oldToken.startsWith("Bearer ")) {
            oldToken = oldToken.substring(7);
        }
        
        // Extrai todas as informações do token antigo
        final Claims claims = extractAllClaims(oldToken);
        
        // Calcula a nova data de expiração
        Date expirationDate = new Date(System.currentTimeMillis() + expirationTimeMillis);

        return Jwts.builder()
                .setClaims(claims) // Reaproveita os dados (userId, role, etc)
                .setSubject(claims.getSubject())
                .setIssuedAt(new Date(System.currentTimeMillis())) // Nova data de emissão
                .setExpiration(expirationDate) // Nova data de expiração
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
