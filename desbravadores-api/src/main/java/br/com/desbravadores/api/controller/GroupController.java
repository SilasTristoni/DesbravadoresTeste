package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.GroupDetailsDTO;
import br.com.desbravadores.api.dto.MemberDTO;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.GroupRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.GroupService;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupService groupService;

    @GetMapping
    @Transactional
    public ResponseEntity<Page<GroupDetailsDTO>> getAllGroups(Pageable pageable) {
        Page<Group> groupPage = groupRepository.findAll(pageable);

        List<GroupDetailsDTO> groupDetailsList = groupPage.getContent().stream()
                .map(this::buildGroupDetails)
                .collect(Collectors.toList());

        Page<GroupDetailsDTO> groupDetailsPage = new PageImpl<>(groupDetailsList, pageable, groupPage.getTotalElements());
        return ResponseEntity.ok(groupDetailsPage);
    }

    @GetMapping("/me")
    @Transactional
    public ResponseEntity<?> getMyGroup(Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName()).orElseThrow();

        if (currentUser.getGroup() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "O utilizador nao pertence a nenhuma unidade."));
        }

        return groupRepository.findById(currentUser.getGroup().getId())
                .map(group -> ResponseEntity.ok(buildGroupDetails(group)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> createGroup(@RequestBody Group newGroup) {
        try {
            normalizeGroup(newGroup);
            Group savedGroup = groupRepository.save(newGroup);

            if (savedGroup.getLeader() != null) {
                userRepository.findById(savedGroup.getLeader().getId()).ifPresent(leader -> {
                    leader.setGroup(savedGroup);
                    userRepository.save(leader);
                });
            }

            return ResponseEntity.status(201).body(savedGroup);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> updateGroup(@PathVariable Long id, @RequestBody Group groupDetails) {
        try {
            return groupRepository.findById(id).map(group -> {
                normalizeGroup(groupDetails);
                group.setName(groupDetails.getName());
                group.setDescription(groupDetails.getDescription());
                group.setAccentColor(groupDetails.getAccentColor());
                group.setLeader(groupDetails.getLeader());

                Group updatedGroup = groupRepository.save(group);

                if (updatedGroup.getLeader() != null) {
                    userRepository.findById(updatedGroup.getLeader().getId()).ifPresent(leader -> {
                        leader.setGroup(updatedGroup);
                        userRepository.save(leader);
                    });
                }

                return ResponseEntity.ok(updatedGroup);
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        try {
            groupService.deleteGroup(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    private GroupDetailsDTO buildGroupDetails(Group group) {
        if (group.getLeader() != null) {
            Hibernate.initialize(group.getLeader());
        }

        List<User> allMembersInGroup = userRepository.findByGroupId(group.getId());

        allMembersInGroup.forEach(user -> {
            Hibernate.initialize(user.getSelectedBackground());
            Hibernate.initialize(user.getAchievements());
            Hibernate.initialize(user.getUnlockedBackgrounds());
        });

        List<MemberDTO> memberDTOs = allMembersInGroup.stream()
                .filter(user -> user.getRole() != Role.DIRETOR)
                .map(MemberDTO::new)
                .collect(Collectors.toList());

        int totalXp = allMembersInGroup.stream()
                .filter(user -> user.getRole() != Role.DIRETOR)
                .mapToInt(User::getXp)
                .sum();

        return new GroupDetailsDTO(group, memberDTOs, totalXp);
    }

    private void normalizeGroup(Group group) {
        group.setName(normalizeRequired(group.getName(), "O nome da unidade e obrigatorio."));
        group.setDescription(normalizeOptional(group.getDescription()));
        group.setAccentColor(normalizeColor(group.getAccentColor()));
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeColor(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return "#27408b";
        }
        return normalized.startsWith("#") ? normalized : "#" + normalized;
    }
}
