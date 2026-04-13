package br.com.desbravadores.api.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.RequirementProgressItemDTO;
import br.com.desbravadores.api.dto.RequirementProgressResponseDTO;
import br.com.desbravadores.api.dto.SpecialtyProgressItemDTO;
import br.com.desbravadores.api.dto.SpecialtyProgressResponseDTO;
import br.com.desbravadores.api.model.Requirement;
import br.com.desbravadores.api.model.Specialty;
import br.com.desbravadores.api.model.SpecialtyProgressStatus;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.model.UserRequirementProgress;
import br.com.desbravadores.api.model.UserSpecialtyProgress;
import br.com.desbravadores.api.repository.RequirementRepository;
import br.com.desbravadores.api.repository.SpecialtyRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.repository.UserRequirementProgressRepository;
import br.com.desbravadores.api.repository.UserSpecialtyProgressRepository;

@Service
public class LearningProgressService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private UserRequirementProgressRepository userRequirementProgressRepository;

    @Autowired
    private UserSpecialtyProgressRepository userSpecialtyProgressRepository;

    @Transactional(readOnly = true)
    public RequirementProgressResponseDTO getRequirementProgress(Long userId, String classLevel) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));

        List<Requirement> requirements = requirementRepository.findAll().stream()
                .filter(requirement -> classLevel == null || classLevel.isBlank() || requirement.getClassLevel().equalsIgnoreCase(classLevel.trim()))
                .sorted(Comparator.comparing(Requirement::getClassLevel, String.CASE_INSENSITIVE_ORDER)
                        .thenComparingInt(Requirement::getDisplayOrder)
                        .thenComparing(Requirement::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<UserRequirementProgress> progressList = userRequirementProgressRepository.findByUserId(user.getId());
        Map<Long, UserRequirementProgress> progressByRequirementId = progressList.stream()
                .collect(Collectors.toMap(progress -> progress.getRequirement().getId(), Function.identity()));

        List<RequirementProgressItemDTO> items = requirements.stream()
                .map(requirement -> {
                    UserRequirementProgress progress = progressByRequirementId.get(requirement.getId());
                    boolean completed = progress != null && progress.isCompleted();
                    LocalDateTime completedAt = progress != null ? progress.getCompletedAt() : null;
                    return new RequirementProgressItemDTO(requirement, completed, completedAt);
                })
                .toList();

        int completedCount = (int) items.stream().filter(RequirementProgressItemDTO::isCompleted).count();
        int totalCount = items.size();
        int remainingCount = Math.max(0, totalCount - completedCount);
        int completionPercentage = totalCount == 0 ? 0 : (int) Math.round((completedCount * 100.0) / totalCount);
        String effectiveClassLevel = classLevel == null || classLevel.isBlank()
                ? items.stream().map(RequirementProgressItemDTO::getClassLevel).filter(Objects::nonNull).findFirst().orElse("Sem classe")
                : classLevel.trim();

        return new RequirementProgressResponseDTO(
                effectiveClassLevel,
                totalCount,
                completedCount,
                remainingCount,
                completionPercentage,
                items
        );
    }

    @Transactional
    public RequirementProgressResponseDTO updateRequirementProgress(Long userId, Long requirementId, boolean completed) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));
        Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new RuntimeException("Requisito nao encontrado."));

        UserRequirementProgress progress = userRequirementProgressRepository
                .findByUserIdAndRequirementId(user.getId(), requirement.getId())
                .orElseGet(() -> {
                    UserRequirementProgress newProgress = new UserRequirementProgress();
                    newProgress.setUser(user);
                    newProgress.setRequirement(requirement);
                    return newProgress;
                });

        progress.setCompleted(completed);
        progress.setCompletedAt(completed ? LocalDateTime.now() : null);
        userRequirementProgressRepository.save(progress);

        return getRequirementProgress(userId, requirement.getClassLevel());
    }

    @Transactional(readOnly = true)
    public SpecialtyProgressResponseDTO getSpecialtyProgress(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));

        List<Specialty> specialties = specialtyRepository.findAll().stream()
                .sorted(Comparator.comparing(Specialty::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<UserSpecialtyProgress> progressList = userSpecialtyProgressRepository.findByUserId(user.getId());
        Map<Long, UserSpecialtyProgress> progressBySpecialtyId = progressList.stream()
                .collect(Collectors.toMap(progress -> progress.getSpecialty().getId(), Function.identity()));

        List<SpecialtyProgressItemDTO> items = specialties.stream()
                .map(specialty -> {
                    UserSpecialtyProgress progress = progressBySpecialtyId.get(specialty.getId());
                    SpecialtyProgressStatus status = progress != null ? progress.getStatus() : SpecialtyProgressStatus.NOT_STARTED;
                    LocalDateTime updatedAt = progress != null ? progress.getUpdatedAt() : null;
                    return new SpecialtyProgressItemDTO(specialty, status, updatedAt);
                })
                .toList();

        int totalCount = items.size();
        int completedCount = (int) items.stream().filter(item -> item.getStatus() == SpecialtyProgressStatus.COMPLETED).count();
        int inProgressCount = (int) items.stream().filter(item -> item.getStatus() == SpecialtyProgressStatus.IN_PROGRESS).count();
        int notStartedCount = Math.max(0, totalCount - completedCount - inProgressCount);

        return new SpecialtyProgressResponseDTO(
                totalCount,
                completedCount,
                inProgressCount,
                notStartedCount,
                items
        );
    }

    @Transactional
    public SpecialtyProgressResponseDTO updateSpecialtyProgress(Long userId, Long specialtyId, SpecialtyProgressStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizador nao encontrado."));
        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new RuntimeException("Especialidade nao encontrada."));

        UserSpecialtyProgress progress = userSpecialtyProgressRepository
                .findByUserIdAndSpecialtyId(user.getId(), specialty.getId())
                .orElseGet(() -> {
                    UserSpecialtyProgress newProgress = new UserSpecialtyProgress();
                    newProgress.setUser(user);
                    newProgress.setSpecialty(specialty);
                    return newProgress;
                });

        progress.setStatus(status);
        progress.setUpdatedAt(LocalDateTime.now());
        userSpecialtyProgressRepository.save(progress);

        return getSpecialtyProgress(userId);
    }
}
