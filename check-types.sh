#!/bin/bash
echo "🔍 Vérification des types TypeScript..."
echo ""

# Build et capturer toutes les erreurs
npm run build 2>&1 | tee build-errors.log

# Extraire les fichiers avec erreurs
echo ""
echo "📋 Résumé des fichiers avec erreurs :"
grep "Type error:" build-errors.log | sed 's/.*\(\.\/.*\.ts\):.*/\1/' | sort -u

echo ""
echo "📄 Détails complets dans build-errors.log"
