package br.com.desbravadores.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "requirements")
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String classLevel;

    @Column(nullable = false, length = 512)
    private String description;

    @Column(nullable = false)
    private String iconName;

    @Column(nullable = true)
    private String iconImageUrl;

    @Column(nullable = true)
    private Integer iconSize;

    @Column(nullable = false)
    private int displayOrder;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getClassLevel() { return classLevel; }
    public void setClassLevel(String classLevel) { this.classLevel = classLevel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIconName() { return iconName; }
    public void setIconName(String iconName) { this.iconName = iconName; }
    public String getIconImageUrl() { return iconImageUrl; }
    public void setIconImageUrl(String iconImageUrl) { this.iconImageUrl = iconImageUrl; }
    public Integer getIconSize() { return iconSize; }
    public void setIconSize(Integer iconSize) { this.iconSize = iconSize; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
