package br.com.desbravadores.api.dto;

import java.util.List;

public class RequirementProgressResponseDTO {
    private String classLevel;
    private int totalRequirements;
    private int completedRequirements;
    private int remainingRequirements;
    private int completionPercentage;
    private List<RequirementProgressItemDTO> items;

    public RequirementProgressResponseDTO(
            String classLevel,
            int totalRequirements,
            int completedRequirements,
            int remainingRequirements,
            int completionPercentage,
            List<RequirementProgressItemDTO> items) {
        this.classLevel = classLevel;
        this.totalRequirements = totalRequirements;
        this.completedRequirements = completedRequirements;
        this.remainingRequirements = remainingRequirements;
        this.completionPercentage = completionPercentage;
        this.items = items;
    }

    public String getClassLevel() { return classLevel; }
    public int getTotalRequirements() { return totalRequirements; }
    public int getCompletedRequirements() { return completedRequirements; }
    public int getRemainingRequirements() { return remainingRequirements; }
    public int getCompletionPercentage() { return completionPercentage; }
    public List<RequirementProgressItemDTO> getItems() { return items; }
}
