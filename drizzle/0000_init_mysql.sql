-- MySQL schema for School Election System (use with XAMPP or any MySQL 8+)

CREATE TABLE IF NOT EXISTS `elections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `academic_year` varchar(32) NOT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `is_active` int NOT NULL DEFAULT 1,
  `code` varchar(8) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `elections_code_unique` (`code`)
);

CREATE TABLE IF NOT EXISTS `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `seats_count` int NOT NULL DEFAULT 1,
  `grade_eligibility` json DEFAULT ('[]'),
  `order_index` int NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `positions_election_id_elections_id_fk` (`election_id`),
  CONSTRAINT `positions_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `parties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `election_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(32) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `parties_election_id_elections_id_fk` (`election_id`),
  CONSTRAINT `parties_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_id` int NOT NULL,
  `party_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `grade` varchar(32) DEFAULT NULL,
  `bio` text,
  `image_url` text,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `candidates_position_id_positions_id_fk` (`position_id`),
  KEY `candidates_party_id_parties_id_fk` (`party_id`),
  CONSTRAINT `candidates_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `candidates_party_id_parties_id_fk` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `student_id` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL DEFAULT 'voter',
  `name` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_student_id_unique` (`student_id`)
);

CREATE TABLE IF NOT EXISTS `votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `position_id` int NOT NULL,
  `candidate_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `votes_user_position_election` (`user_id`,`position_id`,`election_id`),
  KEY `votes_election_id_elections_id_fk` (`election_id`),
  KEY `votes_position_id_positions_id_fk` (`position_id`),
  KEY `votes_candidate_id_candidates_id_fk` (`candidate_id`),
  KEY `votes_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `votes_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votes_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votes_candidate_id_candidates_id_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(64) NOT NULL,
  `entity_type` varchar(64) NOT NULL,
  `entity_id` varchar(64) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_log_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);
