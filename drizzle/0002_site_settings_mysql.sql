CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_name` varchar(255) NOT NULL DEFAULT 'School Election',
  `logo_url` text,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);

INSERT INTO `site_settings` (`id`, `school_name`, `logo_url`, `updated_at`)
VALUES (1, 'School Election', NULL, CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `id` = `id`;
