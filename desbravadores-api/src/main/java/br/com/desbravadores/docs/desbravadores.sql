-- 1. Tabelas de Estrutura Base (Catálogos e Configurações)

CREATE TABLE `groups` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `leader_id` bigint COMMENT 'Líder do grupo (Monitor)'
);

CREATE TABLE `backgrounds` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `image_url` varchar(255),
  `text_color` varchar(255) DEFAULT '#FFFFFF',
  `gradient` varchar(255)
);

CREATE TABLE `achievements` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(512) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `xp_reward` int NOT NULL DEFAULT 0,
  `reward_type` varchar(50) NOT NULL COMMENT 'Enum: BADGE, BACKGROUND, SEAL'
);

-- 2. Tabela Principal de Usuários

CREATE TABLE `users` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `surname` varchar(255),
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(255),
  `level` int NOT NULL DEFAULT 1,
  `xp` int NOT NULL DEFAULT 0,
  `role` varchar(50) NOT NULL COMMENT 'Enum: DESBRAVADOR, MONITOR, DIRETOR',
  `group_id` bigint,
  `selected_background_id` bigint
);

-- 3. Tabelas Associativas (Otimizadas para MVP)

CREATE TABLE `user_achievements` (
  `user_id` bigint NOT NULL,
  `achievement_id` bigint NOT NULL,
  `unlocked_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `achievement_id`)
);

CREATE TABLE `user_unlocked_backgrounds` (
  `user_id` bigint NOT NULL,
  `background_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`, `background_id`)
);

-- 4. Tabelas Operacionais (Dia a dia do Clube)

CREATE TABLE `tasks` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `group_id` bigint COMMENT 'A qual grupo esta tarefa pertence'
);

CREATE TABLE `attendance_records` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `date` date NOT NULL,
  `user_id` bigint NOT NULL COMMENT 'Aluno presente',
  `group_id` bigint NOT NULL,
  `recorded_by_id` bigint NOT NULL COMMENT 'Monitor que fez a chamada'
);

CREATE TABLE `notifications` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `message` varchar(255) NOT NULL,
  `is_read` boolean NOT NULL DEFAULT FALSE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` bigint NOT NULL
);

CREATE TABLE `xp_log` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `amount` int NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` bigint NOT NULL
);

-- 5. Definição de Relacionamentos (Foreign Keys)

-- Relacionamentos de Grupo e Usuário
ALTER TABLE `groups` ADD FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`);
ALTER TABLE `users` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);
ALTER TABLE `users` ADD FOREIGN KEY (`selected_background_id`) REFERENCES `backgrounds` (`id`);

-- Relacionamentos de Gamificação (MVP Otimizado)
ALTER TABLE `user_achievements` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_achievements` ADD FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_unlocked_backgrounds` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_unlocked_backgrounds` ADD FOREIGN KEY (`background_id`) REFERENCES `backgrounds` (`id`) ON DELETE CASCADE;

-- Relacionamentos Operacionais
ALTER TABLE `tasks` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

ALTER TABLE `attendance_records` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
ALTER TABLE `attendance_records` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);
ALTER TABLE `attendance_records` ADD FOREIGN KEY (`recorded_by_id`) REFERENCES `users` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `xp_log` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;