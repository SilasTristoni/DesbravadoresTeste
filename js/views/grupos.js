import { appState } from '../state.js';

export function renderGruposView(viewElement) {
    const { users, groups } = appState;

    viewElement.innerHTML = `
        <div class="group-accordion-container" id="groupAccordion"></div>
    `;

    const accordionContainer = viewElement.querySelector('#groupAccordion');
    if (!accordionContainer) return;

    Object.values(groups).forEach(group => {
        const members = Object.values(users).filter(user => user.groupId === group.id && user.rank !== 'Chefe de Seção');
        const leader = users[group.leaderId];
        const leaderName = leader ? `${leader.name} ${leader.surname}` : 'Líder não definido';

        const cardElement = document.createElement('div');
        cardElement.className = 'group-card';
        
        cardElement.innerHTML = `
            <div class="group-card-header" style="background-image: ${group.gradient};">
                <div class="group-info">
                    <div class="group-card-name">${group.name}</div>
                    <div class="group-card-details">${members.length} desbravadores</div>
                </div>
                <div class="group-leader-info">
                    <div class="leader-text">
                        <div class="leader-name">${leaderName}</div>
                        <div class="leader-title">Responsável</div>
                    </div>
                    <img src="${leader ? leader.avatar : ''}" alt="Líder" class="leader-avatar">
                </div>
            </div>
            <div class="group-members-panel">
                <div class="members-list">
                    ${members.map(member => `
                        <div class="member-item" data-user-id="${member.id}">
                            <img src="${member.avatar}" alt="Avatar" class="avatar-img">
                            <div class="member-info">
                                <div class="member-name">${member.name} ${member.surname}</div>
                                <div class="member-rank">${member.rank || ''}</div>
                            </div>
                            <div class="profile-link-icon">→</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        accordionContainer.appendChild(cardElement);
    });

    accordionContainer.querySelectorAll('.group-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const panel = header.nextElementSibling;
            const card = header.parentElement;
            const isActive = card.classList.contains('active');

            accordionContainer.querySelectorAll('.group-card.active').forEach(activeCard => {
                activeCard.classList.remove('active');
                activeCard.querySelector('.group-members-panel').style.maxHeight = null;
            });

            if (!isActive) {
                card.classList.add('active');
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });

    accordionContainer.querySelectorAll('.member-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = item.dataset.userId;
            const navigateEvent = new CustomEvent('navigate', {
                detail: { view: 'perfil', data: userId }
            });
            window.dispatchEvent(navigateEvent);
        });
    });
}