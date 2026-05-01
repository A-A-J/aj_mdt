CREATE TABLE IF NOT EXISTS `aj_mdt_cases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `citizenid` varchar(50) DEFAULT NULL,
  `citizen_name` varchar(150) DEFAULT NULL,
  `officer_citizenid` varchar(50) DEFAULT NULL,
  `officer_name` varchar(150) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`),
  KEY `status` (`status`)
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
  `fine` int(11) NOT NULL DEFAULT 0,
  `jail` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `aj_mdt_laws` (`title_ar`, `title_en`, `fine`, `jail`) VALUES
('السرقة', 'Theft', 1500, 0),
('الاعتداء', 'Assault', 2500, 10),
('الهروب من الشرطة', 'Evading Police', 3000, 15),
('حيازة سلاح غير مرخص', 'Illegal Weapon Possession', 5000, 25),
('غسيل أموال', 'Money Laundering', 10000, 40);
