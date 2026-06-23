package br.com.desbravadores.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserDetailsService userDetailsService;

    @Test
    void defaultAdminHasDirectorAuthorityAndCanLoadAdminUserLists() throws Exception {
        User admin = userRepository.findByUsername("adm").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.DIRETOR);

        UserDetails adminDetails = userDetailsService.loadUserByUsername("adm");
        assertThat(adminDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("DIRETOR");

        String token = loginAndExtractToken("adm", "adm123");

        mockMvc.perform(get("/api/admin/users/monitors?page=0&size=999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users?page=0&size=5&sort=name,asc")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void commonUserCannotLoadDirectorOnlyAdminLists() throws Exception {
        User user = new User();
        user.setName("Usuario");
        user.setSurname("Comum");
        user.setUsername("comum");
        user.setPassword(passwordEncoder.encode("Senha@123"));
        user.setRole(Role.DESBRAVADOR);
        user.setAvatar("assets/images/escoteiro1.png");
        user.setLevel(1);
        user.setXp(0);
        user.setTotalXp(0);
        userRepository.save(user);

        String token = loginAndExtractToken("comum", "Senha@123");

        mockMvc.perform(get("/api/admin/users/monitors?page=0&size=999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void publicPagesAndLoginRemainPublic() throws Exception {
        mockMvc.perform(get("/login.html"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/admin.html"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"adm\",\"password\":\"adm123\"}"))
                .andExpect(status().isOk());
    }

    private String loginAndExtractToken(String username, String password) throws Exception {
        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginPayload(username, password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return json.get("token").asText();
    }

    private record LoginPayload(String username, String password) {
    }
}
