package br.com.desbravadores.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "xp_log")
public class XpLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private XpSourceType sourceType = XpSourceType.ADMIN_ADJUSTMENT;

    @Column(length = 64)
    private String referenceType;

    private Long referenceId;

    @Column(length = 255)
    private String referenceLabel;

    @Column(length = 255)
    private String performedBy;

    @Column(nullable = false)
    private int balanceAfter;

    @Column(nullable = false)
    private int levelAfter;

    @Column(nullable = false)
    private int currentLevelXpAfter;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public XpSourceType getSourceType() { return sourceType; }
    public void setSourceType(XpSourceType sourceType) { this.sourceType = sourceType; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public String getReferenceLabel() { return referenceLabel; }
    public void setReferenceLabel(String referenceLabel) { this.referenceLabel = referenceLabel; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }
    public int getLevelAfter() { return levelAfter; }
    public void setLevelAfter(int levelAfter) { this.levelAfter = levelAfter; }
    public int getCurrentLevelXpAfter() { return currentLevelXpAfter; }
    public void setCurrentLevelXpAfter(int currentLevelXpAfter) { this.currentLevelXpAfter = currentLevelXpAfter; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
