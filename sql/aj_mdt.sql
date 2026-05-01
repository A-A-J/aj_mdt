CREATE TABLE IF NOT EXISTS `aj_mdt_cases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `citizenid` varchar(50) DEFAULT NULL,
  `citizen_name` varchar(150) DEFAULT NULL,
  `officer_citizenid` varchar(50) DEFAULT NULL,
  `officer_name` varchar(150) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'غير منفذة',
  `case_type` varchar(50) NOT NULL DEFAULT 'قضية',
  `content` longtext DEFAULT NULL,
  `description` text DEFAULT NULL,
  `officers` longtext DEFAULT NULL,
  `suspects` longtext DEFAULT NULL,
  `violations` longtext DEFAULT NULL,
  `action_taken` varchar(50) DEFAULT NULL,
  `extra_details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`),
  KEY `status` (`status`),
  KEY `case_type` (`case_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `aj_mdt_cases`
  ADD COLUMN IF NOT EXISTS `case_type` varchar(50) NOT NULL DEFAULT 'قضية',
  ADD COLUMN IF NOT EXISTS `content` longtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `officers` longtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `suspects` longtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `violations` longtext DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `action_taken` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `extra_details` text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `aj_mdt_citizen_images` (
  `citizenid` varchar(50) NOT NULL,
  `image_url` text DEFAULT NULL,
  `updated_by` varchar(150) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aj_mdt_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) DEFAULT NULL,
  `officer_name` varchar(150) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` varchar(100) DEFAULT NULL,
  `old_data` longtext DEFAULT NULL,
  `new_data` longtext DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `action` (`action`),
  KEY `target_type` (`target_type`),
  KEY `target_id` (`target_id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aj_mdt_wanted` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `danger` varchar(50) NOT NULL DEFAULT 'medium',
  `created_by` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aj_mdt_vehicle_flags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plate` varchar(20) NOT NULL,
  `owner_citizenid` varchar(50) DEFAULT NULL,
  `owner_name` varchar(150) DEFAULT NULL,
  `violation` varchar(255) NOT NULL,
  `created_by` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `plate` (`plate`),
  KEY `owner_citizenid` (`owner_citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aj_mdt_laws` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title_ar` varchar(150) NOT NULL,
  `title_en` varchar(150) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'مخالفة',
  `fine` int(11) NOT NULL DEFAULT 0,
  `jail` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `aj_mdt_laws`
  ADD COLUMN IF NOT EXISTS `type` varchar(50) NOT NULL DEFAULT 'مخالفة';

INSERT INTO `aj_mdt_laws` (`title_ar`, `title_en`, `type`, `fine`, `jail`) VALUES
('السرقة', 'Theft', 'قضية', 1500, 0),
('الاعتداء', 'Assault', 'قضية', 2500, 10),
('الهروب من الشرطة', 'Evading Police', 'مخالفة', 3000, 15),
('حيازة سلاح غير مرخص', 'Illegal Weapon Possession', 'قضية', 5000, 25),
('غسيل أموال', 'Money Laundering', 'قضية', 10000, 40)
ON DUPLICATE KEY UPDATE title_ar = VALUES(title_ar);
