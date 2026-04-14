import { fetchApi } from "../../core/apiClient.js";
import { resolveAssetUrl } from "../../core/url.js";
import { showToast } from "../../ui/toast.js";

let currentUserData = null;
let isEditing = false;

function calculateXpForNextLevel(currentLevel) {
    return 100 + (currentLevel * 50);
}

function getTokenPayload() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        return null;
    }

    try {
        const payload = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

function isAdminRole(role) {
    return role === "MONITOR" || role === "DIRETOR";
}

function getUserName(user) {
    return `${user.name || ""} ${user.surname || ""}`.trim() || user.username || "Utilizador";
}

function getUserSubtitle(user) {
    const groupName = user.group?.name || "Sem unidade";
    const unitRole = user.unitRole ? ` • ${user.unitRole}` : "";
    return `${groupName}${unitRole}`;
}

function getAvatarUrl(user) {
    if (user.avatar && user.avatar.startsWith("/file/")) {
        return `${resolveAssetUrl(user.avatar)}?v=${Date.now()}`;
    }

    return user.avatar || "img/escoteiro1.png";
}

function getBackgroundStyle(background) {
    const imageUrl = background?.imageUrl ? resolveAssetUrl(background.imageUrl) : null;
    const textColor = background?.textColor || "#FFFFFF";

    if (imageUrl) {
        return `background: linear-gradient(135deg, rgba(8, 25, 17, 0.18), rgba(8, 25, 17, 0.42)), url(${imageUrl}) center/cover no-repeat; color: ${textColor};`;
    }

    return `background: ${background?.gradient || "linear-gradient(135deg, #1f4b2d, #386641)"}; color: ${textColor};`;
}

function getPageItems(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.content)) {
        return payload.content;
    }

    return [];
}

function formatDateTime(value) {
    if (!value) {
        return "Nao concluido";
    }

    return new Date(value).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function translateSpecialtyStatus(status) {
    const labels = {
        NOT_STARTED: "Nao iniciada",
        IN_PROGRESS: "Em andamento",
        COMPLETED: "Concluida"
    };

    return labels[status] || status || "Nao iniciada";
}

function renderIdentityDisplay(user, canEdit) {
    return `
        <div class="profile-identity-copy">
            <p class="profile-overline">${user.username || "perfil"}</p>
            <h2>${getUserName(user)}</h2>
            <p>${getUserSubtitle(user)}</p>
        </div>
        ${canEdit ? `
            <button id="editProfileBtn" class="edit-btn" type="button" aria-label="Editar perfil">
                <i class="fa-solid fa-pen"></i>
            </button>
        ` : ""}
    `;
}

function renderIdentityEditForm(user) {
    return `
        <form id="edit-profile-form" class="edit-form edit-form-visible">
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-name">Nome</label>
                    <input type="text" id="edit-name" value="${user.name || ""}" required>
                </div>
                <div class="form-group">
                    <label for="edit-surname">Sobrenome</label>
                    <input type="text" id="edit-surname" value="${user.surname || ""}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-avatar">Avatar</label>
                <input type="file" id="edit-avatar" accept="image/*">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-save-sidebar">Salvar</button>
                <button type="button" id="cancelEditBtn" class="btn-cancel-sidebar">Cancelar</button>
            </div>
        </form>
    `;
}

function renderAchievementsTab(user) {
    const achievements = user.achievements || [];

    if (achievements.length === 0) {
        return '<p class="empty-state">Nenhum emblema desbloqueado ainda.</p>';
    }

    return `
        <div class="profile-achievement-grid">
            ${achievements.map((achievement) => `
                <article class="profile-achievement-card">
                    <img
                        src="${achievement.icon ? resolveAssetUrl(achievement.icon) : "img/escoteiro1.png"}"
                        alt="${achievement.name}"
                        class="profile-achievement-icon">
                    <div>
                        <span class="profile-achievement-type">${achievement.rewardType === "SEAL" ? "Selo" : "Emblema"}</span>
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description || "Sem descricao."}</p>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function renderBackgroundsTab(user, backgrounds, canEditBackground) {
    if (backgrounds.length === 0) {
        return '<p class="empty-state">Nenhum fundo disponivel.</p>';
    }

    return `
        <div class="backgrounds-grid">
            ${backgrounds.map((background) => {
                const selected = user.selectedBackground?.id === background.id;
                return `
                    <article
                        class="background-card ${selected ? "selected" : ""} ${canEditBackground ? "" : "locked"}"
                        data-bg-id="${background.id}">
                        <div class="background-preview" style="${getBackgroundStyle(background)}"></div>
                        <div class="background-info">
                            <strong>${background.name}</strong>
                            <span>${selected ? "Selecionado" : canEditBackground ? "Disponivel" : "Visualizacao"}</span>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function renderRequirementProgressTab(progress) {
    const items = progress?.items || [];

    return `
        <div class="progress-summary-grid">
            <article class="progress-summary-card">
                <span>Total</span>
                <strong>${progress?.totalRequirements || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Concluidos</span>
                <strong>${progress?.completedRequirements || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Pendentes</span>
                <strong>${progress?.remainingRequirements || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Conclusao</span>
                <strong>${progress?.completionPercentage || 0}%</strong>
            </article>
        </div>
        <div class="progress-rail">
            <div class="progress-rail-fill" style="width: ${progress?.completionPercentage || 0}%"></div>
        </div>
        <div class="profile-list">
            ${items.length > 0 ? items.map((item) => `
                <article class="profile-list-card ${item.completed ? "is-complete" : ""}">
                    <div class="profile-list-head">
                        <div>
                            <span class="profile-list-tag">${item.category || "Requisito"}</span>
                            <h4>${item.title}</h4>
                        </div>
                        <span class="profile-list-status ${item.completed ? "success" : "pending"}">
                            ${item.completed ? "Concluido" : "Pendente"}
                        </span>
                    </div>
                    <p>${item.description || "Sem descricao."}</p>
                    <div class="profile-list-foot">
                        <span>Classe: ${item.classLevel || progress?.classLevel || "Geral"}</span>
                        <span>${item.completed ? `Atualizado em ${formatDateTime(item.completedAt)}` : "Aguardando validacao"}</span>
                    </div>
                </article>
            `).join("") : '<p class="empty-state">Nenhum requisito cadastrado.</p>'}
        </div>
    `;
}

function renderSpecialtyProgressTab(progress) {
    const items = progress?.items || [];

    return `
        <div class="progress-summary-grid">
            <article class="progress-summary-card">
                <span>Total</span>
                <strong>${progress?.totalSpecialties || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Concluidas</span>
                <strong>${progress?.completedSpecialties || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Em andamento</span>
                <strong>${progress?.inProgressSpecialties || 0}</strong>
            </article>
            <article class="progress-summary-card">
                <span>Nao iniciadas</span>
                <strong>${progress?.notStartedSpecialties || 0}</strong>
            </article>
        </div>
        <div class="profile-list specialty-list">
            ${items.length > 0 ? items.map((item) => `
                <article class="profile-list-card specialty-card">
                    <div class="specialty-accent" style="background: ${item.accentColor || "#386641"};"></div>
                    <div class="specialty-body">
                        <div class="profile-list-head">
                            <div>
                                <span class="profile-list-tag">${item.area || "Especialidade"}</span>
                                <h4>${item.name}</h4>
                            </div>
                            <span class="profile-list-status status-${(item.status || "NOT_STARTED").toLowerCase()}">
                                ${translateSpecialtyStatus(item.status)}
                            </span>
                        </div>
                        <p>${item.description || "Sem descricao."}</p>
                        <div class="profile-list-foot">
                            <span>${item.iconName || "Catalogo oficial"}</span>
                            <span>${item.updatedAt ? `Atualizado em ${formatDateTime(item.updatedAt)}` : "Sem progresso registrado"}</span>
                        </div>
                    </div>
                </article>
            `).join("") : '<p class="empty-state">Nenhuma especialidade cadastrada.</p>'}
        </div>
    `;
}

function renderGroupTab(group) {
    if (!group) {
        return '<p class="empty-state">Este utilizador ainda nao foi vinculado a uma unidade.</p>';
    }

    const details = group.group || group;
    const members = group.members || [];

    return `
        <section class="unit-profile-card" style="border-top-color: ${details.accentColor || "#386641"};">
            <div class="unit-profile-head">
                <div>
                    <p class="profile-overline">Minha unidade</p>
                    <h3>${details.name}</h3>
                    <p>${details.description || "Sem descricao cadastrada."}</p>
                </div>
                <div class="unit-profile-metrics">
                    <span><strong>${group.totalXp || 0}</strong> XP</span>
                    <span><strong>${members.length}</strong> membros</span>
                </div>
            </div>
            <div class="unit-member-list">
                ${members.length > 0 ? members.map((member) => `
                    <article class="unit-member-card">
                        <div>
                            <strong>${getUserName(member)}</strong>
                            <p>${member.unitRole || member.role || "Membro"}</p>
                        </div>
                        <span>Nivel ${member.level || 1} • ${member.xp || 0} XP</span>
                    </article>
                `).join("") : '<p class="empty-state">Nenhum membro encontrado nesta unidade.</p>'}
            </div>
        </section>
    `;
}

function renderAttendanceTab(history) {
    if (!history.length) {
        return '<p class="empty-state">Nenhum registro de frequencia encontrado.</p>';
    }

    return `
        <div class="attendance-history-list">
            ${history.map((record) => `
                <article class="attendance-record ${record.present ? "present" : "absent"}">
                    <span class="date">${new Date(record.date).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}</span>
                    <span class="status">${record.present ? "PRESENTE" : "AUSENTE"}</span>
                    <span class="group">${record.groupName || "Sem unidade"}</span>
                </article>
            `).join("")}
        </div>
    `;
}

function bindTabNavigation(viewElement) {
    const buttons = viewElement.querySelectorAll(".tab-btn");
    const panels = viewElement.querySelectorAll(".tab-content");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;
            buttons.forEach((item) => item.classList.toggle("active", item === button));
            panels.forEach((panel) => panel.classList.toggle("active", panel.id === `${targetTab}-tab-content`));
        });
    });
}

async function saveMyProfile(viewElement) {
    const form = viewElement.querySelector("#edit-profile-form");
    const submitButton = form.querySelector(".btn-save-sidebar");
    const formData = new FormData();
    const avatarFile = viewElement.querySelector("#edit-avatar")?.files?.[0];

    formData.append("name", viewElement.querySelector("#edit-name").value.trim());
    formData.append("surname", viewElement.querySelector("#edit-surname").value.trim());

    if (avatarFile) {
        formData.append("avatarFile", avatarFile);
    }

    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";

    try {
        await fetchApi("/api/profile/me", {
            method: "PUT",
            body: formData
        });
        isEditing = false;
        showToast("Perfil atualizado com sucesso.", "success");
        await renderProfileView(viewElement, null);
    } catch (error) {
        showToast(error.message || "Nao foi possivel atualizar o perfil.", "error");
        submitButton.disabled = false;
        submitButton.textContent = "Salvar";
    }
}

function bindIdentityActions(viewElement, user, canEdit) {
    const wrapper = viewElement.querySelector("#identity-actions");
    if (!wrapper) {
        return;
    }

    wrapper.innerHTML = isEditing && canEdit ? renderIdentityEditForm(user) : renderIdentityDisplay(user, canEdit);

    if (!isEditing && canEdit) {
        wrapper.querySelector("#editProfileBtn")?.addEventListener("click", () => {
            isEditing = true;
            bindIdentityActions(viewElement, user, canEdit);
        });
        return;
    }

    wrapper.querySelector("#cancelEditBtn")?.addEventListener("click", () => {
        isEditing = false;
        bindIdentityActions(viewElement, currentUserData || user, canEdit);
    });

    wrapper.querySelector("#edit-profile-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveMyProfile(viewElement);
    });
}

function bindBackgroundSelection(viewElement, backgrounds) {
    viewElement.querySelectorAll(".background-card:not(.locked)").forEach((card) => {
        card.addEventListener("click", async () => {
            const backgroundId = Number(card.dataset.bgId);
            card.style.pointerEvents = "none";
            card.style.opacity = "0.7";

            try {
                currentUserData = await fetchApi("/api/profile/me/background", {
                    method: "PUT",
                    body: JSON.stringify({ backgroundId })
                });
                showToast("Fundo do perfil atualizado.", "success");
                renderProfileView(viewElement, null);
            } catch (error) {
                showToast(error.message || "Nao foi possivel atualizar o fundo.", "error");
                card.style.pointerEvents = "auto";
                card.style.opacity = "1";
            }
        });
    });
}

async function renderMyProfile(viewElement) {
    viewElement.innerHTML = '<div class="profile-container"><p>A carregar o seu perfil...</p></div>';

    const tokenPayload = getTokenPayload();
    const adminProfile = isAdminRole(tokenPayload?.role);
    const groupPromise = adminProfile ? Promise.resolve(null) : fetchApi("/api/groups/me").catch(() => null);
    const attendancePromise = adminProfile ? Promise.resolve([]) : fetchApi("/api/chamada/history").catch(() => []);

    try {
        const [user, backgroundsResponse, requirementsProgress, specialtiesProgress, group, attendanceHistory] = await Promise.all([
            fetchApi("/api/profile/me"),
            fetchApi("/api/backgrounds?size=100"),
            fetchApi("/api/profile/me/requirements-progress").catch(() => null),
            fetchApi("/api/profile/me/specialties-progress").catch(() => null),
            groupPromise,
            attendancePromise
        ]);

        currentUserData = user;

        const backgrounds = getPageItems(backgroundsResponse);
        const xpNeeded = calculateXpForNextLevel(user.level || 1);
        const xpPercentage = xpNeeded > 0 ? Math.min(((user.xp || 0) / xpNeeded) * 100, 100) : 0;

        viewElement.innerHTML = `
            <div class="profile-container">
                <section class="profile-identity-block" id="identityBlock" style="${getBackgroundStyle(user.selectedBackground)}">
                    <div class="profile-identity-header">
                        <img src="${getAvatarUrl(user)}" alt="${getUserName(user)}" class="avatar-img">
                        <div class="info-and-edit-wrapper" id="identity-actions"></div>
                    </div>
                </section>

                <section class="profile-progress-block">
                    <div class="level-display">
                        <div class="level-badge">Nivel ${user.level || 1}</div>
                        <div class="xp-text">${user.xp || 0} / ${xpNeeded} XP</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${xpPercentage}%">${Math.round(xpPercentage)}%</div>
                    </div>
                </section>

                <section class="profile-achievements-block">
                    <div class="tabs">
                        <nav class="tab-nav">
                            <button class="tab-btn active" data-tab="achievements">Emblemas</button>
                            <button class="tab-btn" data-tab="backgrounds">Fundos</button>
                            <button class="tab-btn" data-tab="requirements">Requisitos</button>
                            <button class="tab-btn" data-tab="specialties">Especialidades</button>
                            ${adminProfile ? "" : '<button class="tab-btn" data-tab="group">Minha Unidade</button>'}
                            ${adminProfile ? "" : '<button class="tab-btn" data-tab="attendance">Frequencia</button>'}
                        </nav>
                        <div id="achievements-tab-content" class="tab-content active">${renderAchievementsTab(user)}</div>
                        <div id="backgrounds-tab-content" class="tab-content">${renderBackgroundsTab(user, backgrounds, true)}</div>
                        <div id="requirements-tab-content" class="tab-content">${requirementsProgress ? renderRequirementProgressTab(requirementsProgress) : '<p class="empty-state">Sem dados de requisitos.</p>'}</div>
                        <div id="specialties-tab-content" class="tab-content">${specialtiesProgress ? renderSpecialtyProgressTab(specialtiesProgress) : '<p class="empty-state">Sem dados de especialidades.</p>'}</div>
                        ${adminProfile ? "" : `<div id="group-tab-content" class="tab-content">${renderGroupTab(group)}</div>`}
                        ${adminProfile ? "" : `<div id="attendance-tab-content" class="tab-content">${renderAttendanceTab(attendanceHistory)}</div>`}
                    </div>
                </section>
            </div>
        `;

        bindIdentityActions(viewElement, user, true);
        bindTabNavigation(viewElement);
        bindBackgroundSelection(viewElement, backgrounds);
    } catch (error) {
        viewElement.innerHTML = `<div class="profile-container"><p style="color: #c62828;">Nao foi possivel carregar o perfil: ${error.message}</p></div>`;
    }
}

async function renderExternalProfile(viewElement, userId) {
    viewElement.innerHTML = '<div class="profile-container"><p>A carregar perfil...</p></div>';

    try {
        const [user, requirementsProgress, specialtiesProgress] = await Promise.all([
            fetchApi(`/api/users/${userId}`),
            fetchApi(`/api/admin/users/${userId}/requirements-progress`).catch(() => null),
            fetchApi(`/api/admin/users/${userId}/specialties-progress`).catch(() => null)
        ]);

        const tokenPayload = getTokenPayload();
        const canManageAchievements = tokenPayload?.role === "DIRETOR" || tokenPayload?.role === "MONITOR";
        const xpNeeded = calculateXpForNextLevel(user.level || 1);
        const xpPercentage = xpNeeded > 0 ? Math.min(((user.xp || 0) / xpNeeded) * 100, 100) : 0;

        viewElement.innerHTML = `
            <div class="profile-container">
                <section class="profile-identity-block" id="identityBlock" style="${getBackgroundStyle(user.selectedBackground)}">
                    <div class="profile-identity-header">
                        <img src="${getAvatarUrl(user)}" alt="${getUserName(user)}" class="avatar-img">
                        <div class="info-and-edit-wrapper" id="identity-actions">
                            ${renderIdentityDisplay(user, false)}
                        </div>
                    </div>
                </section>

                <section class="profile-progress-block">
                    <div class="level-display">
                        <div class="level-badge">Nivel ${user.level || 1}</div>
                        <div class="xp-text">${user.xp || 0} / ${xpNeeded} XP</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${xpPercentage}%">${Math.round(xpPercentage)}%</div>
                    </div>
                </section>

                ${canManageAchievements ? `
                    <section class="profile-admin-actions">
                        <button id="manage-achievements-btn" class="action-btn" data-user-id="${user.id}">
                            Gerir emblemas e selos
                        </button>
                    </section>
                ` : ""}

                <section class="profile-achievements-block">
                    <div class="tabs">
                        <nav class="tab-nav">
                            <button class="tab-btn active" data-tab="achievements">Emblemas</button>
                            <button class="tab-btn" data-tab="requirements">Requisitos</button>
                            <button class="tab-btn" data-tab="specialties">Especialidades</button>
                        </nav>
                        <div id="achievements-tab-content" class="tab-content active">${renderAchievementsTab(user)}</div>
                        <div id="requirements-tab-content" class="tab-content">${requirementsProgress ? renderRequirementProgressTab(requirementsProgress) : '<p class="empty-state">Sem dados de requisitos.</p>'}</div>
                        <div id="specialties-tab-content" class="tab-content">${specialtiesProgress ? renderSpecialtyProgressTab(specialtiesProgress) : '<p class="empty-state">Sem dados de especialidades.</p>'}</div>
                    </div>
                </section>
            </div>
        `;

        bindTabNavigation(viewElement);

        viewElement.querySelector("#manage-achievements-btn")?.addEventListener("click", () => {
            window.dispatchEvent(new CustomEvent("navigate", {
                detail: { view: "manage-achievements", data: user.id }
            }));
        });
    } catch (error) {
        viewElement.innerHTML = `<div class="profile-container"><p style="color: #c62828;">Nao foi possivel carregar o perfil: ${error.message}</p></div>`;
    }
}

export async function renderProfileView(viewElement, userId = null) {
    isEditing = false;

    if (userId == null) {
        await renderMyProfile(viewElement);
        return;
    }

    await renderExternalProfile(viewElement, userId);
}
