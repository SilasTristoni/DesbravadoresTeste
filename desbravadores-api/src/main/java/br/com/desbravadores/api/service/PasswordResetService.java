package br.com.desbravadores.api.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.desbravadores.api.dto.PasswordResetRequestDTO;
import br.com.desbravadores.api.dto.PasswordResetStatusDTO;
import br.com.desbravadores.api.model.PasswordResetRequest;
import br.com.desbravadores.api.model.PasswordResetStatus;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.PasswordResetRequestRepository;
import br.com.desbravadores.api.repository.UserRepository;

@Service
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] RESET_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    @Autowired
    private PasswordResetRequestRepository passwordResetRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void requestReset(String username) {
        String normalizedUsername = normalizeUsername(username);
        if (normalizedUsername == null) {
            return;
        }

        userRepository.findByUsername(normalizedUsername).ifPresent(user -> {
            PasswordResetRequest activeRequest = passwordResetRequestRepository
                    .findTop1ByUserIdAndStatusInOrderByRequestedAtDesc(
                            user.getId(),
                            List.of(PasswordResetStatus.PENDING, PasswordResetStatus.APPROVED)
                    )
                    .orElse(null);

            if (activeRequest != null) {
                expireIfNeeded(activeRequest);
                if (activeRequest.getStatus() == PasswordResetStatus.PENDING || activeRequest.getStatus() == PasswordResetStatus.APPROVED) {
                    return;
                }
            }

            PasswordResetRequest request = new PasswordResetRequest();
            request.setUser(user);
            request.setRequestedIdentifier(normalizedUsername);
            request.setRequestedAt(LocalDateTime.now());
            request.setStatus(PasswordResetStatus.PENDING);
            passwordResetRequestRepository.save(request);
        });
    }

    @Transactional
    public PasswordResetStatusDTO getPublicResetStatus(String username) {
        String normalizedUsername = normalizeUsername(username);
        if (normalizedUsername == null) {
            return new PasswordResetStatusDTO(PasswordResetStatus.EXPIRED, null, null, null, null);
        }

        return userRepository.findByUsername(normalizedUsername)
                .map(user -> passwordResetRequestRepository
                        .findTop1ByUserIdAndStatusInOrderByRequestedAtDesc(
                                user.getId(),
                                List.of(
                                        PasswordResetStatus.PENDING,
                                        PasswordResetStatus.APPROVED,
                                        PasswordResetStatus.USED,
                                        PasswordResetStatus.REJECTED,
                                        PasswordResetStatus.EXPIRED
                                )
                        )
                        .map(request -> {
                            expireIfNeeded(request);
                            return request;
                        })
                        .map(request -> new PasswordResetStatusDTO(
                                request.getStatus(),
                                request.getRequestedAt(),
                                request.getApprovedAt(),
                                request.getExpiresAt(),
                                request.getCompletedAt()
                        ))
                        .orElse(new PasswordResetStatusDTO(PasswordResetStatus.EXPIRED, null, null, null, null)))
                .orElse(new PasswordResetStatusDTO(PasswordResetStatus.EXPIRED, null, null, null, null));
    }

    @Transactional
    public List<PasswordResetRequestDTO> listRecentRequests() {
        return passwordResetRequestRepository.findTop20ByOrderByRequestedAtDesc().stream()
                .map(this::toAdminDto)
                .toList();
    }

    @Transactional
    public PasswordResetRequestDTO approveRequest(Long requestId, String actorUsername) {
        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitacao de redefinicao nao encontrada."));

        expireIfNeeded(request);

        if (request.getStatus() == PasswordResetStatus.USED) {
            throw new RuntimeException("Esta solicitacao ja foi utilizada.");
        }

        if (request.getStatus() == PasswordResetStatus.REJECTED) {
            throw new RuntimeException("Esta solicitacao ja foi recusada.");
        }

        request.setStatus(PasswordResetStatus.APPROVED);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedBy(normalizeActor(actorUsername));
        request.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        request.setResetCode(generateResetCode());

        return new PasswordResetRequestDTO(passwordResetRequestRepository.save(request));
    }

    @Transactional
    public PasswordResetRequestDTO rejectRequest(Long requestId, String actorUsername) {
        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitacao de redefinicao nao encontrada."));

        if (request.getStatus() == PasswordResetStatus.USED) {
            throw new RuntimeException("Nao e possivel recusar uma solicitacao ja utilizada.");
        }

        request.setStatus(PasswordResetStatus.REJECTED);
        request.setApprovedBy(normalizeActor(actorUsername));
        request.setApprovedAt(LocalDateTime.now());
        request.setExpiresAt(null);
        request.setResetCode(null);

        return new PasswordResetRequestDTO(passwordResetRequestRepository.save(request));
    }

    @Transactional
    public void confirmReset(String username, String resetCode, String newPassword) {
        String normalizedUsername = normalizeUsername(username);
        String normalizedCode = normalizeCode(resetCode);

        if (normalizedUsername == null || normalizedCode == null) {
            throw new RuntimeException("Identificador ou codigo invalidos.");
        }

        PasswordResetRequest request = passwordResetRequestRepository
                .findTop1ByUserUsernameAndResetCodeAndStatusOrderByRequestedAtDesc(
                        normalizedUsername,
                        normalizedCode,
                        PasswordResetStatus.APPROVED
                )
                .orElseThrow(() -> new RuntimeException("Codigo de redefinicao invalido ou expirado."));

        expireIfNeeded(request);

        if (request.getStatus() != PasswordResetStatus.APPROVED) {
            throw new RuntimeException("Codigo de redefinicao invalido ou expirado.");
        }

        userService.validatePasswordForReset(newPassword);

        User user = request.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        request.setStatus(PasswordResetStatus.USED);
        request.setCompletedAt(LocalDateTime.now());
        request.setResetCode(null);
        request.setExpiresAt(null);
        passwordResetRequestRepository.save(request);
    }

    private PasswordResetRequestDTO toAdminDto(PasswordResetRequest request) {
        expireIfNeeded(request);
        return new PasswordResetRequestDTO(request);
    }

    private void expireIfNeeded(PasswordResetRequest request) {
        if (request.getStatus() == PasswordResetStatus.APPROVED
                && request.getExpiresAt() != null
                && request.getExpiresAt().isBefore(LocalDateTime.now())) {
            request.setStatus(PasswordResetStatus.EXPIRED);
            request.setResetCode(null);
            passwordResetRequestRepository.save(request);
        }
    }

    private String generateResetCode() {
        StringBuilder builder = new StringBuilder(10);
        for (int index = 0; index < 10; index++) {
            builder.append(RESET_CODE_ALPHABET[RANDOM.nextInt(RESET_CODE_ALPHABET.length)]);
        }
        return builder.toString();
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            return null;
        }
        String normalized = username.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeCode(String resetCode) {
        if (resetCode == null) {
            return null;
        }
        String normalized = resetCode.trim().toUpperCase();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeActor(String actorUsername) {
        if (actorUsername == null || actorUsername.trim().isBlank()) {
            return "sistema";
        }
        return actorUsername.trim();
    }
}
