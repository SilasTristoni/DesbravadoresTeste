package br.com.desbravadores.api.dto;

import java.util.List;

import br.com.desbravadores.api.model.Group;

public class GroupDetailsDTO {
    private Group group;
    private List<MemberDTO> members;
    private int totalXp;

    public GroupDetailsDTO(Group group, List<MemberDTO> members, int totalXp) {
        this.group = group;
        this.members = members;
        this.totalXp = totalXp;
    }

    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public List<MemberDTO> getMembers() { return members; }
    public void setMembers(List<MemberDTO> members) { this.members = members; }
    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }
}
