# Úložiště cvičení z AI Studio Builderu

Webová galerie interaktivních cvičení vytvořených v AI Studio Builderu.

## 🚀 Jak přidat nové cvičení

### Krok 1: Stáhněte cvičení z AI Studio Builderu

V Builderu klikněte na ikonu stažení a uložte ZIP soubor.

### Krok 2: Spusťte build příkaz

Otevřete terminál ve složce projektu a spusťte:

```bash
npm run add-exercise "C:\cesta\k\vašemu\cvičení.zip"
```

Skript automaticky:

- ✅ Rozbalí ZIP
- ✅ Nainstaluje závislosti
- ✅ Vytvoří produkční build
- ✅ Zkopíruje výsledek do složky `exercises/`

### Krok 3: Nasaďte na Netlify

```bash
git add .
git commit -m "Přidáno cvičení: název"
git push
```

## 📁 Struktura projektu

```
├── index.html           # Hlavní stránka
├── styles/main.css      # Styly
├── scripts/
│   ├── app.js           # Aplikační logika
│   └── build-exercise.js # Build skript
├── exercises/           # Zkompilovaná cvičení
│   └── nazev-cviceni/
│       ├── index.html
│       └── meta.json
└── package.json
```

## 🛠️ Lokální vývoj

```bash
# Instalace závislostí
npm install

# Spuštění dev serveru
npm run dev
```

Web běží na <http://localhost:3000>

## 📋 Požadavky

- Node.js 18+
- npm 9+
