package br.com.desbravadores.api.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "correction_requests")
public class CorrectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne
    @JoinColumn(name = "monitor_id", nullable = false)
    private User monitor;

    @Column(nullable = false)
    private LocalDate dateReference;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    // Armazenamos os IDs como JSON String simples (Ex: "[1,5,9]")
    @Column(columnDefinition = "TEXT")
    private String presentIdsJson; 

    // Armazenamos justificativas como JSON String (Ex: "{\"3\":\"Doente\"}")
    @Column(columnDefinition = "TEXT")
    private String justificationsJson;

    @Column(nullable = false)
    private boolean approved = false;

    public CorrectionRequest() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public User getMonitor() { return monitor; }
    public void setMonitor(User monitor) { this.monitor = monitor; }
    public LocalDate getDateReference() { return dateReference; }
    public void setDateReference(LocalDate dateReference) { this.dateReference = dateReference; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public String getPresentIdsJson() { return presentIdsJson; }
    public void setPresentIdsJson(String presentIdsJson) { this.presentIdsJson = presentIdsJson; }
    public String getJustificationsJson() { return justificationsJson; }
    public void setJustificationsJson(String justificationsJson) { this.justificationsJson = justificationsJson; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
}