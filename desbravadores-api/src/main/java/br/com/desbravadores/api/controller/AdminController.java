package br.com.desbravadores.api.controller;

import java.util.Map;
import java.util.Optional;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.XpAdjustmentRequestDTO;
import br.com.desbravadores.api.dto.XpSummaryDTO;
import br.com.desbravadores.api.dto.UserResponseDTO;
import br.com.desbravadores.api.dto.UserSummaryDTO;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.ApiDtoMapper;
import br.com.desbravadores.api.service.GamificationService;
import br.com.desbravadores.api.service.UserService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private ApiDtoMapper apiDtoMapper;

    @PreAuthorize("hasAuthority('DIRETOR')")
    @PostMapping("/users")
    public ResponseEntity<?> createUserByAdmin(@RequestBody User newUser) {
        try {
            User savedUser = userService.createUser(newUser);
            return ResponseEntity.status(201).body(apiDtoMapper.toUserSummary(savedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/remove-group")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<UserSummaryDTO> removeUserFromGroup(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setGroup(null);
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(apiDtoMapper.toUserSummary(savedUser));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    @Transactional
    public ResponseEntity<Page<UserSummaryDTO>> getAllUsers(
            @RequestParam(value = "groupId", required = false) Long groupId,
            Pageable pageable,
            Authentication authentication) {

        User currentUser = userRepository.findByUsername(authentication.getName()).orElseThrow();
        boolean isDirector = authentication.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("DIRETOR"));

        Page<User> userPage;

        if (isDirector) {
            userPage = groupId != null
                    ? userRepository.findByGroupIdAndRole(groupId, Role.DESBRAVADOR, pageable)
                    : userRepository.findByRole(Role.DESBRAVADOR, pageable);
        } else {
            if (currentUser.getGroup() == null) {
                return ResponseEntity.ok(Page.empty(pageable));
            }
            userPage = userRepository.findByGroupIdAndRole(currentUser.getGroup().getId(), Role.DESBRAVADOR, pageable);
        }

        return ResponseEntity.ok(userPage.map(apiDtoMapper::toUserSummary));
    }

    @GetMapping("/users/monitors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Page<UserSummaryDTO>> getAllMonitors(Pageable pageable) {
        return ResponseEntity.ok(userRepository.findByRole(Role.MONITOR, pageable).map(apiDtoMapper::toUserSummary));
    }

    @GetMapping("/users/directors")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Page<UserSummaryDTO>> getAllDirectors(Pageable pageable) {
        return ResponseEntity.ok(userRepository.findByRole(Role.DIRETOR, pageable).map(apiDtoMapper::toUserSummary));
    }

    @PostMapping("/users/{userId}/achievements/{achievementId}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<?> grantAchievement(@PathVariable Long userId, @PathVariable Long achievementId, Authentication authentication) {
        gamificationService.manuallyUnlockAchievement(userId, achievementId, authentication.getName());
        return ResponseEntity.ok().body(Map.of("message", "Conquista concedida com sucesso."));
    }

    @DeleteMapping("/users/{userId}/achievements/{achievementId}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<?> revokeAchievement(@PathVariable Long userId, @PathVariable Long achievementId, Authentication authentication) {
        gamificationService.revokeAchievement(userId, achievementId, authentication.getName());
        return ResponseEntity.ok().body(Map.of("message", "Conquista revogada com sucesso."));
    }

    @GetMapping("/users/{id}/xp")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    public ResponseEntity<XpSummaryDTO> getUserXpSummary(@PathVariable Long id) {
        return ResponseEntity.ok(gamificationService.getXpSummary(id));
    }

    @PostMapping("/users/{id}/xp-adjustments")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> adjustUserXp(
            @PathVariable Long id,
            @Valid @RequestBody XpAdjustmentRequestDTO payload,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(gamificationService.adjustXp(id, payload.amount(), payload.reason(), authentication.getName()));
        } catch (RuntimeException error) {
            return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
        }
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyAuthority('DIRETOR', 'MONITOR')")
    @Transactional
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        user.ifPresent(u -> {
            Hibernate.initialize(u.getGroup());
            Hibernate.initialize(u.getAchievements());
            Hibernate.initialize(u.getSelectedBackground());
            Hibernate.initialize(u.getUnlockedBackgrounds());
        });
        return user.map(apiDtoMapper::toUserResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updateData) {
        try {
            User updatedUser = userService.updateUser(id, updateData);
            return ResponseEntity.ok(apiDtoMapper.toUserResponse(updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
