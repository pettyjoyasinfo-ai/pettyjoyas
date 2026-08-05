-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: pettyjoyas
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Casa',
  `street` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addresses_customer_id_foreign` (`customer_id`),
  CONSTRAINT `addresses_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT '0',
  `position` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_parent_id_foreign` (`parent_id`),
  CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'anillos','Anillos',NULL,'/assets/img/category/4/category-1.jpg',NULL,1,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,'collares','Collares',NULL,'/assets/img/category/4/category-2.jpg',NULL,1,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,'aros','Aros',NULL,'/assets/img/category/4/category-3.jpg',NULL,1,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,'pulseras','Pulseras',NULL,'/assets/img/category/4/category-4.jpg',NULL,1,3,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,'conjuntos','Conjuntos',NULL,'/assets/img/category/4/category-5.jpg',NULL,1,4,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,'relojes','Relojes',NULL,'/assets/img/category/4/category-1.jpg',NULL,0,5,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_redemptions`
--

DROP TABLE IF EXISTS `coupon_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_redemptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `amount` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coupon_redemptions_coupon_id_foreign` (`coupon_id`),
  KEY `coupon_redemptions_order_id_foreign` (`order_id`),
  KEY `coupon_redemptions_customer_id_foreign` (`customer_id`),
  CONSTRAINT `coupon_redemptions_coupon_id_foreign` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_redemptions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_redemptions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_redemptions`
--

LOCK TABLES `coupon_redemptions` WRITE;
/*!40000 ALTER TABLE `coupon_redemptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupon_redemptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int NOT NULL,
  `min_subtotal` int DEFAULT NULL,
  `max_uses` int unsigned DEFAULT NULL,
  `used_count` int unsigned NOT NULL DEFAULT '0',
  `starts_at` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'BIENVENIDA10','percent',10,NULL,NULL,184,NULL,NULL,1,'10% primera compra','2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,'PETTY15','percent',15,120000,100,52,NULL,NULL,1,'15% desde $120.000','2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,'ENVIOGRATIS','fixed',6500,50000,NULL,210,NULL,NULL,1,'Descuento de envío','2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `document` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `segment` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nuevo',
  `vip` tinyint(1) NOT NULL DEFAULT '0',
  `tags` json DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_email_unique` (`email`),
  KEY `customers_user_id_foreign` (`user_id`),
  CONSTRAINT `customers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'María Pérez','maria.perez@gmail.com','+54 9 11 5123-4567','1992-07-12',NULL,'vip',1,'[\"frecuente\"]','Talle de anillo 16. Le encantan las perlas.',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,'Lucía Martínez','lu.martinez@hotmail.com','+54 9 11 6234-5678','1990-09-03',NULL,'recurrente',0,NULL,NULL,NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,'Sofía Díaz','sofidiaz@gmail.com','+54 9 351 412-3456','1998-06-21',NULL,'nuevo',0,'[\"influencer\"]',NULL,NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,'Carla Gómez','carla.g@yahoo.com','+54 9 11 7345-6789','1988-06-28',NULL,'recurrente',0,'[\"mayorista\"]',NULL,NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,'Julieta Ríos','julirios@gmail.com','+54 9 261 523-4567','1995-11-15',NULL,'inactivo',0,NULL,NULL,NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_flows`
--

DROP TABLE IF EXISTS `email_flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_flows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sent_count` int unsigned NOT NULL DEFAULT '0',
  `open_rate` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_flows`
--

LOCK TABLES `email_flows` WRITE;
/*!40000 ALTER TABLE `email_flows` DISABLE KEYS */;
INSERT INTO `email_flows` VALUES (1,'Bienvenida + cupón 10%','Al registrarse',NULL,1,412,62,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,'Carrito abandonado (3 recordatorios)','1h / 24h / 72h',NULL,1,1240,41,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,'Cumpleaños 25% off','7 días antes',NULL,1,96,78,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,'Post-compra: cuidado de tu joya','3 días post entrega',NULL,1,388,55,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,'Reactivación 90 días','Sin compras 90 días',NULL,0,154,23,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `email_flows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_13_203945_create_personal_access_tokens_table',1),(5,'2026_06_13_210000_add_role_to_users_table',1),(6,'2026_06_13_210001_create_categories_table',1),(7,'2026_06_13_210002_create_products_table',1),(8,'2026_06_13_210003_create_product_variants_table',1),(9,'2026_06_13_210004_create_product_images_table',1),(10,'2026_06_13_210005_create_stock_movements_table',1),(11,'2026_06_13_210006_create_customers_table',1),(12,'2026_06_13_210007_create_addresses_table',1),(13,'2026_06_13_210008_create_coupons_table',1),(14,'2026_06_13_210009_create_orders_table',1),(15,'2026_06_13_210010_create_order_items_table',1),(16,'2026_06_13_210011_create_coupon_redemptions_table',1),(17,'2026_06_13_210012_create_payments_table',1),(18,'2026_06_13_210013_create_email_flows_table',1),(19,'2026_06_13_210014_create_sync_events_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_variant_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variant_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` int NOT NULL,
  `quantity` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_product_id_foreign` (`product_id`),
  KEY `order_items_product_variant_id_foreign` (`product_variant_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_product_variant_id_foreign` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,10,NULL,'Collar Choker Onda',NULL,49000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,2,11,NULL,'Anillo Sello Monograma',NULL,71000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,3,2,NULL,'Collar Gota Celeste',NULL,76000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,4,7,NULL,'Collar Iniciales Lettre',NULL,58000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,5,8,NULL,'Aros Pendientes Gala',NULL,95000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,6,7,NULL,'Collar Iniciales Lettre',NULL,58000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(7,7,12,NULL,'Reloj Minimal Petite',NULL,134000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(8,8,8,NULL,'Aros Pendientes Gala',NULL,95000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(9,9,1,NULL,'Anillo Solitario Aura',NULL,89000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(10,10,8,NULL,'Aros Pendientes Gala',NULL,95000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(11,11,8,NULL,'Aros Pendientes Gala',NULL,95000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(12,12,5,NULL,'Conjunto Perla Margot',NULL,138000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(13,13,5,NULL,'Conjunto Perla Margot',NULL,138000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(14,14,1,NULL,'Anillo Solitario Aura',NULL,89000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(15,15,10,NULL,'Collar Choker Onda',NULL,49000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(16,16,1,NULL,'Anillo Solitario Aura',NULL,89000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(17,17,8,NULL,'Aros Pendientes Gala',NULL,95000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(18,18,7,NULL,'Collar Iniciales Lettre',NULL,58000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(19,19,6,NULL,'Anillo Eternity Pavé',NULL,112000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(20,20,2,NULL,'Collar Gota Celeste',NULL,76000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(21,21,5,NULL,'Conjunto Perla Margot',NULL,138000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(22,22,9,NULL,'Pulsera Tennis Brillante',NULL,156000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(23,23,12,NULL,'Reloj Minimal Petite',NULL,134000,1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(24,24,3,NULL,'Aros Argolla Luna',NULL,42000,2,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `customer_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `shipping_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` int NOT NULL DEFAULT '0',
  `discount` int NOT NULL DEFAULT '0',
  `shipping_cost` int NOT NULL DEFAULT '0',
  `total` int NOT NULL DEFAULT '0',
  `coupon_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` json DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_number_unique` (`number`),
  KEY `orders_customer_id_foreign` (`customer_id`),
  KEY `orders_user_id_foreign` (`user_id`),
  KEY `orders_channel_status_index` (`channel`,`status`),
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'PJ-002001','local',4,NULL,'entregado','transferencia','aprobado',NULL,98000,0,0,98000,NULL,NULL,NULL,'2025-10-06 17:59:00','2025-10-06 17:59:00'),(2,'PJ-002002','local',5,NULL,'pagado','mercadopago','aprobado',NULL,71000,0,0,71000,NULL,NULL,NULL,'2025-12-26 21:31:00','2025-12-26 21:31:00'),(3,'PJ-002003','online',2,NULL,'preparacion','mercadopago','aprobado','envio',76000,0,6500,82500,NULL,NULL,NULL,'2026-04-29 21:17:00','2026-04-29 21:17:00'),(4,'PJ-002004','online',1,NULL,'preparacion','efectivo','aprobado','envio',116000,11600,0,104400,'BIENVENIDA10',NULL,NULL,'2025-09-14 16:17:00','2025-09-14 16:17:00'),(5,'PJ-002005','online',5,NULL,'pagado','mercadopago','aprobado','envio',190000,0,0,190000,NULL,NULL,NULL,'2025-09-05 13:32:00','2025-09-05 13:32:00'),(6,'PJ-002006','online',1,NULL,'entregado','mercadopago','aprobado','envio',58000,0,6500,64500,NULL,NULL,NULL,'2026-01-26 12:24:00','2026-01-26 12:24:00'),(7,'PJ-002007','local',1,NULL,'enviado','mercadopago','aprobado',NULL,134000,0,0,134000,NULL,NULL,NULL,'2025-08-28 19:14:00','2025-08-28 19:14:00'),(8,'PJ-002008','online',3,NULL,'preparacion','mercadopago','aprobado','envio',95000,9500,0,85500,'BIENVENIDA10',NULL,NULL,'2025-11-05 14:35:00','2025-11-05 14:35:00'),(9,'PJ-002009','online',4,NULL,'entregado','transferencia','aprobado','envio',178000,0,0,178000,NULL,NULL,NULL,'2025-10-19 17:09:00','2025-10-19 17:09:00'),(10,'PJ-002010','online',3,NULL,'entregado','efectivo','aprobado','envio',190000,0,0,190000,NULL,NULL,NULL,'2025-11-17 15:25:00','2025-11-17 15:25:00'),(11,'PJ-002011','online',2,NULL,'enviado','mercadopago','aprobado','envio',190000,0,0,190000,NULL,NULL,NULL,'2025-12-27 23:16:00','2025-12-27 23:16:00'),(12,'PJ-002012','online',4,NULL,'entregado','transferencia','aprobado','envio',276000,27600,0,248400,'BIENVENIDA10',NULL,NULL,'2025-09-11 19:08:00','2025-09-11 19:08:00'),(13,'PJ-002013','online',5,NULL,'pagado','transferencia','aprobado','envio',276000,0,0,276000,NULL,NULL,NULL,'2026-01-13 23:11:00','2026-01-13 23:11:00'),(14,'PJ-002014','online',5,NULL,'enviado','efectivo','aprobado','envio',178000,0,0,178000,NULL,NULL,NULL,'2025-10-03 19:29:00','2025-10-03 19:29:00'),(15,'PJ-002015','online',2,NULL,'entregado','transferencia','aprobado','envio',98000,0,0,98000,NULL,NULL,NULL,'2025-11-26 16:00:00','2025-11-26 16:00:00'),(16,'PJ-002016','online',1,NULL,'pagado','efectivo','aprobado','envio',178000,17800,0,160200,'BIENVENIDA10',NULL,NULL,'2026-01-02 19:28:00','2026-01-02 19:28:00'),(17,'PJ-002017','local',4,NULL,'entregado','transferencia','aprobado',NULL,95000,0,0,95000,NULL,NULL,NULL,'2025-12-22 22:11:00','2025-12-22 22:11:00'),(18,'PJ-002018','online',4,NULL,'pagado','efectivo','aprobado','envio',116000,0,0,116000,NULL,NULL,NULL,'2026-01-04 19:59:00','2026-01-04 19:59:00'),(19,'PJ-002019','online',5,NULL,'enviado','efectivo','aprobado','envio',224000,0,0,224000,NULL,NULL,NULL,'2025-09-24 15:22:00','2025-09-24 15:22:00'),(20,'PJ-002020','online',5,NULL,'entregado','transferencia','aprobado','envio',76000,7600,6500,74900,'BIENVENIDA10',NULL,NULL,'2026-03-03 18:00:00','2026-03-03 18:00:00'),(21,'PJ-002021','local',4,NULL,'enviado','efectivo','aprobado',NULL,138000,0,0,138000,NULL,NULL,NULL,'2025-12-02 15:14:00','2025-12-02 15:14:00'),(22,'PJ-002022','online',3,NULL,'entregado','transferencia','aprobado','envio',156000,0,0,156000,NULL,NULL,NULL,'2025-12-08 17:28:00','2025-12-08 17:28:00'),(23,'PJ-002023','local',5,NULL,'entregado','efectivo','aprobado',NULL,134000,0,0,134000,NULL,NULL,NULL,'2025-12-06 21:40:00','2025-12-06 21:40:00'),(24,'PJ-002024','local',5,NULL,'entregado','transferencia','aprobado',NULL,84000,8400,0,75600,'BIENVENIDA10',NULL,NULL,'2026-03-04 23:50:00','2026-03-04 23:50:00');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `amount` int NOT NULL,
  `raw` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_order_id_foreign` (`order_id`),
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_foreign` (`product_id`),
  CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,'/assets/img/product/4/product-1.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,1,'/assets/img/product/details/4/main/product-details-main-1.jpg',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,2,'/assets/img/product/4/product-2.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,3,'/assets/img/product/4/product-3.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,4,'/assets/img/product/4/product-4.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,5,'/assets/img/product/4/product-5.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(7,6,'/assets/img/product/4/product-6.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(8,7,'/assets/img/product/4/product-7.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(9,8,'/assets/img/product/4/product-8.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(10,9,'/assets/img/product/4/product-9.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(11,10,'/assets/img/product/4/product-10.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(12,11,'/assets/img/product/4/product-11.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(13,12,'/assets/img/product/4/product-12.jpg',0,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_delta` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_variants_sku_unique` (`sku`),
  UNIQUE KEY `product_variants_barcode_unique` (`barcode`),
  KEY `product_variants_product_id_foreign` (`product_id`),
  CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'Talle 12','talle','12','ANILLOSOLITARIOAURA-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,1,'Talle 14','talle','14','ANILLOSOLITARIOAURA-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,1,'Talle 16','talle','16','ANILLOSOLITARIOAURA-2',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,1,'Talle 18','talle','18','ANILLOSOLITARIOAURA-3',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,1,'Talle 20','talle','20','ANILLOSOLITARIOAURA-4',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,2,'Largo 40 cm','largo','40','COLLARGOTACELESTE-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(7,2,'Largo 45 cm','largo','45','COLLARGOTACELESTE-1',NULL,4000,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(8,3,'Plata 925','material','Plata 925','AROSARGOLLALUNA-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(9,3,'Oro 18k','material','Oro 18k','AROSARGOLLALUNA-1',NULL,25200,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(10,4,'Dorado','color','Dorado','PULSERAESCLAVAVIENNA-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(11,4,'Plateado','color','Plateado','PULSERAESCLAVAVIENNA-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(12,6,'Talle 12','talle','12','ANILLOETERNITYPAVE-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(13,6,'Talle 14','talle','14','ANILLOETERNITYPAVE-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(14,6,'Talle 16','talle','16','ANILLOETERNITYPAVE-2',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(15,6,'Talle 18','talle','18','ANILLOETERNITYPAVE-3',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(16,6,'Talle 20','talle','20','ANILLOETERNITYPAVE-4',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(17,7,'Letra A','color','A','COLLARINICIALESLETTRE-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(18,7,'Letra M','color','M','COLLARINICIALESLETTRE-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(19,7,'Letra S','color','S','COLLARINICIALESLETTRE-2',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(20,11,'Talle 12','talle','12','ANILLOSELLOMONOGRAMA-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(21,11,'Talle 14','talle','14','ANILLOSELLOMONOGRAMA-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(22,11,'Talle 16','talle','16','ANILLOSELLOMONOGRAMA-2',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(23,11,'Talle 18','talle','18','ANILLOSELLOMONOGRAMA-3',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(24,11,'Talle 20','talle','20','ANILLOSELLOMONOGRAMA-4',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(25,12,'Dorado','color','Dorado','RELOJMINIMALPETITE-0',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(26,12,'Plateado','color','Plateado','RELOJMINIMALPETITE-1',NULL,0,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `collection` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` int unsigned NOT NULL,
  `compare_at_price` int unsigned DEFAULT NULL,
  `short_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specs` json DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT '0.0',
  `reviews_count` int unsigned NOT NULL DEFAULT '0',
  `badges` json DEFAULT NULL,
  `barcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  UNIQUE KEY `products_barcode_unique` (`barcode`),
  KEY `products_category_id_index` (`category_id`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'anillo-solitario-aura','Anillo Solitario Aura',1,NULL,89000,119000,'Anillo Solitario Aura — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"12\"}',4.8,36,'[\"oferta\", \"destacado\"]','7791491990000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,'collar-gota-celeste','Collar Gota Celeste',2,NULL,76000,NULL,'Collar Gota Celeste — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"40\"}',4.9,21,'[\"nuevo\"]','7795975690000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,'aros-argolla-luna','Aros Argolla Luna',3,NULL,42000,52000,'Aros Argolla Luna — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Plata 925\"}',4.7,48,'[\"oferta\"]','7795271680000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,'pulsera-esclava-vienna','Pulsera Esclava Vienna',4,NULL,64000,NULL,'Pulsera Esclava Vienna — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Dorado\"}',4.6,14,'[]','7797451740000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,'conjunto-perla-margot','Conjunto Perla Margot',5,NULL,138000,165000,'Conjunto Perla Margot — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Plata 925\"}',5.0,9,'[\"oferta\", \"destacado\"]','7794209640000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,'anillo-eternity-pave','Anillo Eternity Pavé',1,NULL,112000,NULL,'Anillo Eternity Pavé — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"12\"}',4.8,17,'[\"destacado\"]','7795488590000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(7,'collar-iniciales-lettre','Collar Iniciales Lettre',2,NULL,58000,NULL,'Collar Iniciales Lettre — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"A\"}',4.9,31,'[\"nuevo\"]','7797640530000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(8,'aros-pendientes-gala','Aros Pendientes Gala',3,NULL,95000,124000,'Aros Pendientes Gala — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Plata 925\"}',4.7,12,'[\"oferta\"]','7792932620000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(9,'pulsera-tennis-brillante','Pulsera Tennis Brillante',4,NULL,156000,NULL,'Pulsera Tennis Brillante — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Plata 925\"}',5.0,8,'[\"destacado\"]','7790964560000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(10,'collar-choker-onda','Collar Choker Onda',2,NULL,49000,62000,'Collar Choker Onda — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Plata 925\"}',4.5,19,'[\"oferta\"]','7794029120000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(11,'anillo-sello-monograma','Anillo Sello Monograma',1,NULL,71000,NULL,'Anillo Sello Monograma — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"12\"}',4.6,7,'[]','7792297950000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(12,'reloj-minimal-petite','Reloj Minimal Petite',6,NULL,134000,159000,'Reloj Minimal Petite — joya de autor en oro y plata.','Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.','{\"garantia\": \"De por vida en el armado\", \"material\": \"Dorado\"}',4.8,5,'[\"oferta\", \"nuevo\"]','7798162180000',1,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `product_variant_id` bigint unsigned DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `reference_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_movements_product_variant_id_foreign` (`product_variant_id`),
  KEY `stock_movements_reference_type_reference_id_index` (`reference_type`,`reference_id`),
  KEY `stock_movements_user_id_foreign` (`user_id`),
  KEY `stock_movements_product_id_product_variant_id_index` (`product_id`,`product_variant_id`),
  CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_product_variant_id_foreign` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_movements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,1,'PURCHASE',3,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(2,1,2,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(3,1,3,'PURCHASE',5,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(4,1,4,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(5,1,5,'PURCHASE',7,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(6,2,6,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(7,2,7,'PURCHASE',5,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(8,3,8,'PURCHASE',8,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(9,3,9,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(10,4,10,'PURCHASE',7,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(11,4,11,'PURCHASE',9,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(12,5,NULL,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(13,6,12,'PURCHASE',3,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(14,6,13,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(15,6,14,'PURCHASE',5,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(16,6,15,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(17,6,16,'PURCHASE',7,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(18,7,17,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(19,7,18,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(20,7,19,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(21,8,NULL,'PURCHASE',8,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(22,9,NULL,'PURCHASE',5,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(23,10,NULL,'PURCHASE',14,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(24,11,20,'PURCHASE',3,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(25,11,21,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(26,11,22,'PURCHASE',5,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(27,11,23,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(28,11,24,'PURCHASE',7,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(29,12,25,'PURCHASE',4,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12'),(30,12,26,'PURCHASE',6,NULL,NULL,'Carga inicial (seed)',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_events`
--

DROP TABLE IF EXISTS `sync_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'accepted',
  `client_created_at` bigint DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `error` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_events`
--

LOCK TABLES `sync_events` WRITE;
/*!40000 ALTER TABLE `sync_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cliente',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Romina P.','admin@pettyjoyas.com','admin',NULL,NULL,NULL,'$2y$12$QmhBiQMjZ5rNiDyGivN2/OEFlojx0hZAWpznarwaUxyRFQdNjs81y',NULL,'2026-06-17 06:58:11','2026-06-17 06:58:11'),(2,'Julián M.','vendedor@pettyjoyas.com','vendedor',NULL,NULL,NULL,'$2y$12$LtCPaaFMOBIeRVm4E7P6wOgzfLtuVC4MCcu7l207acMx.qnGwQ/pq',NULL,'2026-06-17 06:58:12','2026-06-17 06:58:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-17  1:06:30
