-- CreateTable
CREATE TABLE "parent_children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_children_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_children_parentId_idx" ON "parent_children"("parentId");

-- CreateIndex
CREATE INDEX "parent_children_childId_idx" ON "parent_children"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_children_parentId_childId_key" ON "parent_children"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_childId_fkey" FOREIGN KEY ("childId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

