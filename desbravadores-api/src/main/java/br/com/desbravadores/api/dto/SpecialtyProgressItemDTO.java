package br.com.desbravadores.api.dto;

import java.time.LocalDateTime;

import br.com.desbravadores.api.model.Specialty;
import br.com.desbravadores.api.model.SpecialtyProgressStatus;

public class SpecialtyProgressItemDTO {
    private Long id;
    private String name;
    private String area;
    private String description;
    private String iconName;
    private String iconImageUrl;
    private Integer iconSize;
    private String accentColor;
    private SpecialtyProgressStatus status;
    private LocalDateTime updatedAt;

    public SpecialtyProgressItemDTO(Specialty specialty, SpecialtyProgressStatus status, LocalDateTime updatedAt) {
        this.id = specialty.getId();
        this.name = specialty.getName();
        this.area = specialty.getArea();
        this.description = specialty.getDescription();
        this.iconName = specialty.getIconName();
        this.iconImageUrl = specialty.getIconImageUrl();
        this.iconSize = specialty.getIconSize();
        this.accentColor = specialty.getAccentColor();
        this.status = status;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getArea() { return area; }
    public String getDescription() { return description; }
    public String getIconName() { return iconName; }
    public String getIconImageUrl() { return iconImageUrl; }
    public Integer getIconSize() { return iconSize; }
    public String getAccentColor() { return accentColor; }
    public SpecialtyProgressStatus getStatus() { return status; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
