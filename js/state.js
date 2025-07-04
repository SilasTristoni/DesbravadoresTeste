export const appState = {
    currentUserId: 'user-1',
    users: {
'user-1': {
    id: 'user-1', name: 'João', surname: 'Silva',
    avatar: 'img/escoteiro1.png', // <--- COLOQUE O NOME DO SEU ARQUIVO AQUI
    birthDate: '2009-08-15', level: 8, rank: 'Lobinho', xp: 1840, nextLevelXp: 2000,
    groupId: 'group-1', selectedBackground: 'forest', displayedBadges: ['badge-1', 'badge-3', 'badge-5']
},
        'user-admin': {
            id: 'user-admin',
            name: 'Sérgio',
            surname: 'Ricardo',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
            birthDate: '1985-01-01',
            rank: 'Chefe de Seção',
            groupId: null,
            level: 99,
            xp: 9900,
            nextLevelXp: 10000,
            selectedBackground: 'mountain',
            displayedBadges: ['seal-1', 'badge-1']
        }
    },
    groups: {
        'group-1': { id: 'group-1', name: 'Patrulha Lince', leaderId: 'user-admin', gradient: 'linear-gradient(120deg, #2193b0 0%, #6dd5ed 100%)' },
        'group-2': { id: 'group-2', name: 'Patrulha Águia', leaderId: 'user-admin', gradient: 'linear-gradient(120deg, #11998e 0%, #38ef7d 100%)' }
    },
  badges: [
    {
      id: "badge-1",
      name: "Primeiro Acampamento",
      description: "Complete seu primeiro acampamento",
      icon: "🏕️", // Revertido para emoji
      shape: "circle",
      unlocked: true,
    },
    {
      id: "badge-2",
      name: "Espírito de Equipe",
      description: "Trabalhe em equipe em 5 atividades",
      icon: "🤝", // Revertido para emoji
      shape: "circle",
      unlocked: true,
    },
    {
      id: "badge-3",
      name: "Navegador",
      description: "Use bússola e mapa em trilhas",
      icon: "🧭", // Revertido para emoji
      shape: "circle",
      unlocked: true,
    },
    {
      id: "badge-4",
      name: "Líder Natural",
      description: "Lidere uma patrulha por 1 mês",
      icon: "👑", // Revertido para emoji
      shape: "circle",
      unlocked: false,
      progress: 75,
    },
    {
      id: "badge-5",
      name: "Mestre do Fogo",
      description: "Acenda fogueira sem fósforos",
      icon: "🔥", // Revertido para emoji
      shape: "circle",
      unlocked: true,
    },
    {
      id: "badge-6",
      name: "Explorador",
      description: "Descubra 10 trilhas diferentes",
      icon: "🗺️", // Revertido para emoji
      shape: "circle",
      unlocked: false,
      progress: 60,
    },
  ],
  seals: [
    {
      id: "seal-1",
      name: "Selo de Honra",
      description: "Demonstre valores escoteiros exemplares",
      icon: "🎖️", // Revertido para emoji
      shape: "shield",
      unlocked: true,
    },
    {
      id: "seal-2",
      name: "Selo Aventura",
      description: "Complete jornada de aventura avançada",
      icon: "🏔️", // Revertido para emoji
      shape: "shield",
      unlocked: false,
      progress: 85,
    },
    {
      id: "seal-3",
      name: "Selo Comunidade",
      description: "Sirva à comunidade por 50 horas",
      icon: "🏘️", // Revertido para emoji
      shape: "shield",
      unlocked: false,
      progress: 45,
    },
  ],
  backgrounds: [
    {
      id: "forest",
      name: "Floresta",
      unlocked: true,
      gradient: "linear-gradient(135deg, #2d5016 0%, #6b8e23 100%)",
      textColor: "#FFFFFF"
    },
    {
      id: "mountain",
      name: "Montanha",
      unlocked: true,
      gradient: "linear-gradient(135deg, #8b4513 0%, #d2b48c 100%)",
      textColor: "#FFFFFF"
    },
    {
      id: "camping",
      name: "Acampamento",
      unlocked: false,
      gradient: "linear-gradient(135deg, #ff6b35 0%, #ffd700 100%)",
      textColor: "#000000"
    },
  ],
  agenda: {
    currentMonth: 6,
    currentYear: 2025,
    selectedDay: 3,
    months: [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ],
    dayNames: [
      "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
    ],
    activities: {
      2025: {
        6: {
          18: [ { time: "09:00", title: "Cerimônia de Abertura", description: "Início oficial das atividades da semana." } ],
          21: [ { time: "10:00", title: "Trilha Ecológica Guiada", description: "Exploração da fauna e flora local." } ]
        },
        7: {
          5: [ { time: "11:00", title: "Olimpíadas Escoteiras", description: "Competições e jogos em equipe." } ]
        }
      },
    },
  },
  scoutOfTheMonth: {
      userId: 'user-1',
      reason: 'Pelo seu excelente espírito de equipe no acampamento de inverno.'
  }
};