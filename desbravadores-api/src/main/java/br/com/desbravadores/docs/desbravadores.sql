CREATE TABLE `groups` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(512),
  `accent_color` varchar(255) DEFAULT '#27408b',
  `leader_id` bigint COMMENT 'Lider da unidade'
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
  `reward_type` varchar(50) NOT NULL
);

CREATE TABLE `specialties` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `area` varchar(255) NOT NULL,
  `description` varchar(512) NOT NULL,
  `icon_name` varchar(255) NOT NULL,
  `accent_color` varchar(255) NOT NULL
);

CREATE TABLE `requirements` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `class_level` varchar(255) NOT NULL,
  `description` varchar(512) NOT NULL,
  `icon_name` varchar(255) NOT NULL,
  `display_order` int NOT NULL DEFAULT 0
);

CREATE TABLE `users` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `surname` varchar(255),
  `username` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(255),
  `unit_role` varchar(255),
  `level` int NOT NULL DEFAULT 1,
  `xp` int NOT NULL DEFAULT 0,
  `role` varchar(50) NOT NULL,
  `group_id` bigint,
  `selected_background_id` bigint
);

CREATE TABLE `user_achievements` (
  `user_id` bigint NOT NULL,
  `achievement_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`, `achievement_id`)
);

CREATE TABLE `user_unlocked_backgrounds` (
  `user_id` bigint NOT NULL,
  `background_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`, `background_id`)
);

CREATE TABLE `user_requirement_progress` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `requirement_id` bigint NOT NULL,
  `completed` boolean NOT NULL DEFAULT FALSE,
  `completed_at` datetime,
  UNIQUE KEY `uk_user_requirement` (`user_id`, `requirement_id`)
);

CREATE TABLE `user_specialty_progress` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `specialty_id` bigint NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'NOT_STARTED',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_specialty` (`user_id`, `specialty_id`)
);

CREATE TABLE `tasks` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `group_id` bigint
);

CREATE TABLE `attendance_records` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `date` date NOT NULL,
  `user_id` bigint NOT NULL,
  `group_id` bigint NOT NULL,
  `recorded_by_id` bigint NOT NULL
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

ALTER TABLE `groups` ADD FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`);
ALTER TABLE `users` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);
ALTER TABLE `users` ADD FOREIGN KEY (`selected_background_id`) REFERENCES `backgrounds` (`id`);

ALTER TABLE `user_achievements` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_achievements` ADD FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_unlocked_backgrounds` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_unlocked_backgrounds` ADD FOREIGN KEY (`background_id`) REFERENCES `backgrounds` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_requirement_progress` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_requirement_progress` ADD FOREIGN KEY (`requirement_id`) REFERENCES `requirements` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_specialty_progress` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `user_specialty_progress` ADD FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE CASCADE;

ALTER TABLE `tasks` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;
ALTER TABLE `attendance_records` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
ALTER TABLE `attendance_records` ADD FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`);
ALTER TABLE `attendance_records` ADD FOREIGN KEY (`recorded_by_id`) REFERENCES `users` (`id`);
ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `xp_log` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
