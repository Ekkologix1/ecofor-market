-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "public"."activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "public"."activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "public"."activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "categories_active_idx" ON "public"."categories"("active");

-- CreateIndex
CREATE INDEX "categories_order_idx" ON "public"."categories"("order");

-- CreateIndex
CREATE INDEX "order_items_productSku_idx" ON "public"."order_items"("productSku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "public"."products"("categoryId");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "public"."products"("active");

-- CreateIndex
CREATE INDEX "products_featured_idx" ON "public"."products"("featured");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "public"."products"("stock");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "public"."products"("createdAt");

-- CreateIndex
CREATE INDEX "products_basePrice_idx" ON "public"."products"("basePrice");

-- CreateIndex
CREATE INDEX "products_wholesalePrice_idx" ON "public"."products"("wholesalePrice");

-- CreateIndex
CREATE INDEX "users_type_idx" ON "public"."users"("type");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_validated_idx" ON "public"."users"("validated");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "public"."users"("createdAt");
