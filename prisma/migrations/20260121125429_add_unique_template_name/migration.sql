/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `LetterTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LetterTemplate_name_key" ON "LetterTemplate"("name");
