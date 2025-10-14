package br.com.desbravadores.api.controller;

import java.util.List;
import java.util.stream.Collectors; // IMPORT ADICIONADO

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * MÉTODO ATUALIZADO
     * Converte manualmente os membros para MemberDTO, garantindo que os dados estão completos.
     */
    @GetMapping
    public ResponseEntity<List<GroupDetailsDTO>> getAllGroups() {
        List<Group> groups = groupRepository.findAll();
        
        List<GroupDetailsDTO> groupDetails = groups.stream().map(group -> {
            List<User> allMembersInGroup = userRepository.findByGroupId(group.getId());
            
            // Converte a lista de User para uma lista de MemberDTO
            List<MemberDTO> memberDTOs = allMembersInGroup.stream()
                .filter(user -> user.getRole() != Role.DIRETOR)
                .map(MemberDTO::new) // Constrói um MemberDTO para cada utilizador
                .collect(Collectors.toList());

            return new GroupDetailsDTO(group, memberDTOs);
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(groupDetails);
    }

    // O resto dos métodos (POST, PUT, DELETE) permanecem os mesmos...
    @PostMapping
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Group> createGroup(@RequestBody Group newGroup) {
        Group savedGroup = groupRepository.save(newGroup);
        return ResponseEntity.status(201).body(savedGroup);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DIRETOR')")
    public ResponseEntity<Group> updateGroup(@PathVariable Long id, @RequestBody Group groupDetails) {
        return groupRepository.findById(id).map(group -> {
            group.setName(groupDetails.getName());
            group.setLeader(groupDetails.getLeader());
            Group updatedGroup = groupRepository.save(group);
            return ResponseEntity.ok(updatedGroup);
        }).orElse(ResponseEntity.notFound().build());
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
}