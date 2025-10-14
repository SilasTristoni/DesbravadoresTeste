package br.com.desbravadores.api.dto;

import java.util.List;

import br.com.desbravadores.api.model.Group;

public class GroupDetailsDTO {
    private Group group;
    // Agora a lista é do nosso novo tipo MemberDTO
    private List<MemberDTO> members;

    public GroupDetailsDTO(Group group, List<MemberDTO> members) {
        this.group = group;
        this.members = members;
    }

    // Getters e Setters
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public List<MemberDTO> getMembers() { return members; }
    public void setMembers(List<MemberDTO> members) { this.members = members; }
}