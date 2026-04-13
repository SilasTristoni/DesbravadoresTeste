package br.com.desbravadores.api.dto;

import java.util.List;

public class SpecialtyProgressResponseDTO {
    private int totalSpecialties;
    private int completedSpecialties;
    private int inProgressSpecialties;
    private int notStartedSpecialties;
    private List<SpecialtyProgressItemDTO> items;

    public SpecialtyProgressResponseDTO(
            int totalSpecialties,
            int completedSpecialties,
            int inProgressSpecialties,
            int notStartedSpecialties,
            List<SpecialtyProgressItemDTO> items) {
        this.totalSpecialties = totalSpecialties;
        this.completedSpecialties = completedSpecialties;
        this.inProgressSpecialties = inProgressSpecialties;
        this.notStartedSpecialties = notStartedSpecialties;
        this.items = items;
    }

    public int getTotalSpecialties() { return totalSpecialties; }
    public int getCompletedSpecialties() { return completedSpecialties; }
    public int getInProgressSpecialties() { return inProgressSpecialties; }
    public int getNotStartedSpecialties() { return notStartedSpecialties; }
    public List<SpecialtyProgressItemDTO> getItems() { return items; }
}
