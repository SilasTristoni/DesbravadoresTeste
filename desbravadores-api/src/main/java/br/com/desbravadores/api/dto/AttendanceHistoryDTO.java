package br.com.desbravadores.api.dto;

import java.time.LocalDate;

public class AttendanceHistoryDTO {
    private LocalDate date;
    private boolean present;
    private String groupName;

    public AttendanceHistoryDTO(LocalDate date, boolean present, String groupName) {
        this.date = date;
        this.present = present;
        this.groupName = groupName;
    }

    // Getters e Setters
    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public boolean isPresent() {
        return present;
    }

    public void setPresent(boolean present) {
        this.present = present;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }
}
