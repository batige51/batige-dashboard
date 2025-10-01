#!/bin/bash
echo "🔧 Correction automatique des relations Prisma..."

# Règle 1: FactureLine utilise dpgfLine (pas dpgf)
# Rechercher tous les fichiers qui utilisent des lignes de facture
echo "→ Correction de fl.dpgf -> fl.dpgfLine"
find app/api -name "*.ts" -type f -exec grep -l "fl\.dpgf" {} \; | while read file; do
  echo "  Fixing: $file"
  sed -i 's/fl\.dpgf/fl.dpgfLine/g' "$file"
done

# Règle 2: Facture.lignes (pas lines)
echo "→ Correction de lines -> lignes"
find app/api -name "*.ts" -type f -exec grep -l "facture\.lines\|lines:" {} \; | while read file; do
  echo "  Fixing: $file"
  sed -i 's/facture\.lines/facture.lignes/g' "$file"
  sed -i 's/lines: {/lignes: {/g' "$file"
done

echo ""
echo "✅ Corrections appliquées. Lancement du build..."
npm run build
