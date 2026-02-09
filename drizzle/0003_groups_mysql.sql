CREATE TABLE IF NOT EXISTS `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `user_groups` (
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  UNIQUE KEY `user_groups_user_group` (`user_id`, `group_id`),
  KEY `user_groups_group_id_groups_id_fk` (`group_id`),
  CONSTRAINT `user_groups_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_groups_group_id_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `election_allowed_groups` (
  `election_id` int NOT NULL,
  `group_id` int NOT NULL,
  UNIQUE KEY `election_allowed_groups_election_group` (`election_id`, `group_id`),
  KEY `election_allowed_groups_group_id_groups_id_fk` (`group_id`),
  CONSTRAINT `election_allowed_groups_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `election_allowed_groups_group_id_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
);
