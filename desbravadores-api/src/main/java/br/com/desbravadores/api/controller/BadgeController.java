package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.desbravadores.api.model.Badge;
import br.com.desbravadores.api.repository.BadgeRepository;
import br.com.desbravadores.api.service.BadgeService;
import br.com.desbravadores.api.service.FileStorageService;

@RestController
@RequestMapping("/api")
public class BadgeController {

    @Autowired
    private BadgeRepository badgeRepository;

    @Autowired
    private BadgeService badgeService;
    
    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/badges")
    @Cacheable("badges") // Habilita o cache para este endpoint
    public ResponseEntity<List<Badge>> getAllBadges() {
        // Simula um delay para demonstrar o efeito do cache (remover em produção)
        try {
            Thread.sleep(2000); 
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok(badgeRepository.findAll());
    }

    @PostMapping("/admin/badges")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Badge> createBadge(@RequestParam("name") String name,
                                             @RequestParam("description") String description,
                                             @RequestParam("iconFile") MultipartFile iconFile) {
        
        String iconFilename = fileStorageService.store(iconFile);
        String iconUrl = "/file/" + iconFilename; // CORREÇÃO

        Badge newBadge = new Badge();
        newBadge.setName(name);
        newBadge.setDescription(description);
        newBadge.setIcon(iconUrl);

        Badge savedBadge = badgeRepository.save(newBadge);
        return ResponseEntity.status(201).body(savedBadge);
    }

    @PostMapping("/admin/users/{userId}/badges")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> assignBadge(@PathVariable Long userId, @RequestBody Map<String, Long> payload) {
        Long badgeId = payload.get("badgeId");
        badgeService.assignBadgeToUser(userId, badgeId);
        return ResponseEntity.ok(Map.of("message", "Emblema atribuído com sucesso."));
    }

    @DeleteMapping("/admin/users/{userId}/badges/{badgeId}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Void> removeBadge(@PathVariable Long userId, @PathVariable Long badgeId) {
        badgeService.removeBadgeFromUser(userId, badgeId);
        return ResponseEntity.noContent().build();
    }
}