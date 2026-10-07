# Conan RP-Planer

Desktopanwendung für den Conan RP-Planer · Made by Elion

## Bestätigungsseite für Supabase

Die Datei `index.html` ist die sichere GitHub-Pages-Zielseite für E-Mail-Bestätigungen und Passwortwiederherstellungen.

Nach Aktivierung von GitHub Pages lautet die Adresse:

```text
https://mikejaeson1-wq.github.io/conan-rp-planer/
```

Diese Adresse wird in Supabase unter **Authentication → URL Configuration** als **Site URL** und **Redirect URL** eingetragen.

Die Seite verarbeitet Supabase-Schlüssel ausschließlich lokal im Browser, entfernt sie danach aus der sichtbaren Browseradresse und sendet sie an keinen weiteren Dienst.

## Downloadseite

Die öffentliche Download- und Installationsseite liegt unter:

```text
https://mikejaeson1-wq.github.io/conan-rp-planer/download/
```

Sie fragt über die öffentliche GitHub-API automatisch das neueste Release ab, bietet die verfügbaren Windows-Installer an und enthält die vollständige Ersteinrichtung. Der QR-Code unter `download/qr-download.png` verweist dauerhaft auf diese Seite.
