-- Orden alfabético en español, igual en cualquier sistema operativo:
-- "Ámbar" va junto a "Ambar", antes de "Cuero" (la intercalación ICU "es" de PostgreSQL).
ALTER TABLE "Product" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "es-x-icu";
ALTER TABLE "Brand" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "es-x-icu";
ALTER TABLE "Category" ALTER COLUMN "name" SET DATA TYPE TEXT COLLATE "es-x-icu";
