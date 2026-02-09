-- Add password_changed flag to users table

ALTER TABLE `users` ADD COLUMN `password_changed` int NOT NULL DEFAULT 0;
