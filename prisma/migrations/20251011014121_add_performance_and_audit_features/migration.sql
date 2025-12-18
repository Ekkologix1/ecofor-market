-- AlterTable
ALTER TABLE "public"."cart_items" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."carts" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."order_status_history" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."price_rules" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "activity_logs_userId_action_idx" ON "public"."activity_logs"("userId", "action");

-- CreateIndex
CREATE INDEX "activity_logs_action_createdAt_idx" ON "public"."activity_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "public"."activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "cart_items_deletedAt_idx" ON "public"."cart_items"("deletedAt");

-- CreateIndex
CREATE INDEX "cart_items_cartId_deletedAt_idx" ON "public"."cart_items"("cartId", "deletedAt");

-- CreateIndex
CREATE INDEX "carts_userId_idx" ON "public"."carts"("userId");

-- CreateIndex
CREATE INDEX "carts_deletedAt_idx" ON "public"."carts"("deletedAt");

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "public"."categories"("deletedAt");

-- CreateIndex
CREATE INDEX "categories_active_order_idx" ON "public"."categories"("active", "order");

-- CreateIndex
CREATE INDEX "order_items_deletedAt_idx" ON "public"."order_items"("deletedAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_deletedAt_idx" ON "public"."order_items"("orderId", "deletedAt");

-- CreateIndex
CREATE INDEX "order_items_productId_orderId_idx" ON "public"."order_items"("productId", "orderId");

-- CreateIndex
CREATE INDEX "order_status_history_deletedAt_idx" ON "public"."order_status_history"("deletedAt");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_changedAt_idx" ON "public"."order_status_history"("orderId", "changedAt");

-- CreateIndex
CREATE INDEX "order_status_history_toStatus_changedAt_idx" ON "public"."order_status_history"("toStatus", "changedAt");

-- CreateIndex
CREATE INDEX "order_status_history_changedBy_changedAt_idx" ON "public"."order_status_history"("changedBy", "changedAt");

-- CreateIndex
CREATE INDEX "orders_deletedAt_idx" ON "public"."orders"("deletedAt");

-- CreateIndex
CREATE INDEX "orders_userId_status_idx" ON "public"."orders"("userId", "status");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "public"."orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "public"."orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_type_status_idx" ON "public"."orders"("type", "status");

-- CreateIndex
CREATE INDEX "orders_shippingMethod_status_idx" ON "public"."orders"("shippingMethod", "status");

-- CreateIndex
CREATE INDEX "orders_processedBy_status_idx" ON "public"."orders"("processedBy", "status");

-- CreateIndex
CREATE INDEX "orders_assignedTo_status_idx" ON "public"."orders"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "price_rules_active_idx" ON "public"."price_rules"("active");

-- CreateIndex
CREATE INDEX "price_rules_userType_idx" ON "public"."price_rules"("userType");

-- CreateIndex
CREATE INDEX "price_rules_deletedAt_idx" ON "public"."price_rules"("deletedAt");

-- CreateIndex
CREATE INDEX "price_rules_active_userType_idx" ON "public"."price_rules"("active", "userType");

-- CreateIndex
CREATE INDEX "price_rules_active_minQuantity_idx" ON "public"."price_rules"("active", "minQuantity");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "public"."products"("deletedAt");

-- CreateIndex
CREATE INDEX "products_categoryId_active_idx" ON "public"."products"("categoryId", "active");

-- CreateIndex
CREATE INDEX "products_active_featured_idx" ON "public"."products"("active", "featured");

-- CreateIndex
CREATE INDEX "products_active_promotion_idx" ON "public"."products"("active", "promotion");

-- CreateIndex
CREATE INDEX "products_categoryId_stock_idx" ON "public"."products"("categoryId", "stock");

-- CreateIndex
CREATE INDEX "products_basePrice_active_idx" ON "public"."products"("basePrice", "active");

-- CreateIndex
CREATE INDEX "products_featured_active_idx" ON "public"."products"("featured", "active");

-- CreateIndex
CREATE INDEX "products_promotion_promotionStart_promotionEnd_idx" ON "public"."products"("promotion", "promotionStart", "promotionEnd");

-- CreateIndex
CREATE INDEX "session_logs_userId_startTime_idx" ON "public"."session_logs"("userId", "startTime");

-- CreateIndex
CREATE INDEX "session_logs_startTime_endTime_idx" ON "public"."session_logs"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "public"."users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_type_role_idx" ON "public"."users"("type", "role");

-- CreateIndex
CREATE INDEX "users_validated_type_idx" ON "public"."users"("validated", "type");

-- CreateIndex
CREATE INDEX "users_role_deletedAt_idx" ON "public"."users"("role", "deletedAt");

-- CreateIndex
CREATE INDEX "users_createdAt_type_idx" ON "public"."users"("createdAt", "type");
