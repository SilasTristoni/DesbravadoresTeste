package br.com.desbravadores.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.model.Notification;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.NotificationRepository;
import br.com.desbravadores.api.repository.UserRepository;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Notification notification = notificationRepository.findById(id).orElseThrow();

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.noContent().build();
    }
}