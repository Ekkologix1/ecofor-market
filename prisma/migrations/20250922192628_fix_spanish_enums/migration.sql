/*
  Warnings:

  - The values [PERCENTAGE,FIXED] on the enum `DiscountType` will be removed. If these variants are still used in the database, this will fail.
  - The values [RECEIVED,VALIDATING,APPROVED,PREPARING,READY,SHIPPED,DELIVERED,QUOTE,CANCELLED,REJECTED,ON_HOLD] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PURCHASE,QUOTE] on the enum `OrderType` will be removed. If these variants are still used in the database, this will fail.
  - The values [STORE_PICKUP,FREE_DELIVERY,SCHEDULED_ROUTE,SPECIAL_DELIVERY] on the enum `ShippingMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."DiscountType_new" AS ENUM ('PORCENTAJE', 'FIJO');
ALTER TABLE "public"."price_rules" ALTER COLUMN "discountType" DROP DEFAULT;
ALTER TABLE "public"."price_rules" ALTER COLUMN "discountType" TYPE "public"."DiscountType_new" USING ("discountType"::text::"public"."DiscountType_new");
ALTER TYPE "public"."DiscountType" RENAME TO "DiscountType_old";
ALTER TYPE "public"."DiscountType_new" RENAME TO "DiscountType";
DROP TYPE "public"."DiscountType_old";
ALTER TABLE "public"."price_rules" ALTER COLUMN "discountType" SET DEFAULT 'PORCENTAJE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('RECIBIDO', 'VALIDANDO', 'APROBADO', 'PREPARANDO', 'LISTO', 'EN_RUTA', 'ENTREGADO', 'COTIZACION', 'CANCELADO', 'RECHAZADO', 'EN_ESPERA');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TABLE "public"."order_status_history" ALTER COLUMN "fromStatus" TYPE "public"."OrderStatus_new" USING ("fromStatus"::text::"public"."OrderStatus_new");
ALTER TABLE "public"."order_status_history" ALTER COLUMN "toStatus" TYPE "public"."OrderStatus_new" USING ("toStatus"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'RECIBIDO';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderType_new" AS ENUM ('COMPRA', 'COTIZACION');
ALTER TABLE "public"."orders" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "type" TYPE "public"."OrderType_new" USING ("type"::text::"public"."OrderType_new");
ALTER TYPE "public"."OrderType" RENAME TO "OrderType_old";
ALTER TYPE "public"."OrderType_new" RENAME TO "OrderType";
DROP TYPE "public"."OrderType_old";
ALTER TABLE "public"."orders" ALTER COLUMN "type" SET DEFAULT 'COMPRA';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ShippingMethod_new" AS ENUM ('RETIRO_TIENDA', 'DESPACHO_GRATIS', 'RUTA_PROGRAMADA', 'COURIER', 'DESPACHO_ESPECIAL');
ALTER TABLE "public"."orders" ALTER COLUMN "shippingMethod" DROP DEFAULT;
ALTER TABLE "public"."orders" ALTER COLUMN "shippingMethod" TYPE "public"."ShippingMethod_new" USING ("shippingMethod"::text::"public"."ShippingMethod_new");
ALTER TYPE "public"."ShippingMethod" RENAME TO "ShippingMethod_old";
ALTER TYPE "public"."ShippingMethod_new" RENAME TO "ShippingMethod";
DROP TYPE "public"."ShippingMethod_old";
ALTER TABLE "public"."orders" ALTER COLUMN "shippingMethod" SET DEFAULT 'RETIRO_TIENDA';
COMMIT;

-- AlterTable
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'RECIBIDO',
ALTER COLUMN "type" SET DEFAULT 'COMPRA',
ALTER COLUMN "shippingMethod" SET DEFAULT 'RETIRO_TIENDA';

-- AlterTable
ALTER TABLE "public"."price_rules" ALTER COLUMN "discountType" SET DEFAULT 'PORCENTAJE';
