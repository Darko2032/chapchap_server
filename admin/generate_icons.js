const fs = require('fs');
const path = require('path');

// Création du dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Tailles d'icônes à générer
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Génération d'un SVG simple pour chaque taille
sizes.forEach(size => {
    // Créer un SVG simple avec "CC" pour CHAP-CHAP Admin
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#0175C2" />
        <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size*0.5}" 
              font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">CC</text>
        <rect x="${size*0.1}" y="${size*0.1}" width="${size*0.8}" height="${size*0.8}" 
              stroke="#FFC107" stroke-width="${size*0.05}" fill="none" />
    </svg>`;
    
    // Écrire le fichier SVG
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    
    console.log(`Icône ${size}x${size} générée: ${svgPath}`);
});

console.log('\nToutes les icônes ont été générées en format SVG dans le dossier "icons".');
console.log('Note: Pour un usage en production, convertissez ces SVG en PNG avec un outil comme Inkscape ou une bibliothèque Node.js.');
