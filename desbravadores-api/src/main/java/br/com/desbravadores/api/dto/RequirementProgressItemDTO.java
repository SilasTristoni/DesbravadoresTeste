package br.com.desbravadores.api.dto;

import java.time.LocalDateTime;

import br.com.desbravadores.api.model.Requirement;

public class RequirementProgressItemDTO {
    private Long id;
    private String title;
    private String category;
    private String classLevel;
    private String description;
    private String iconName;
    private int displayOrder;
    private boolean completed;
    private LocalDateTime completedAt;

    public RequirementProgressItemDTO(Requirement requirement, boolean completed, LocalDateTime completedAt) {
        this.id = requirement.getId();
        this.title = requirement.getTitle();
        this.category = requirement.getCategory();
        this.classLevel = requirement.getClassLevel();
        this.description = requirement.getDescription();
        this.iconName = requirement.getIconName();
        this.displayOrder = requirement.getDisplayOrder();
        this.completed = completed;
        this.completedAt = completedAt;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getClassLevel() { return classLevel; }
    public String getDescription() { return description; }
    public String getIconName() { return iconName; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isCompleted() { return completed; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
