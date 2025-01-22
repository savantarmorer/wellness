cd public/icons

# Renomear os ícones principais
Copy-Item "72.png" -Destination "icon-72x72.png"
Copy-Item "android-launchericon-96-96.png" -Destination "icon-96x96.png"
Copy-Item "128.png" -Destination "icon-128x128.png"
Copy-Item "144.png" -Destination "icon-144x144.png"
Copy-Item "152.png" -Destination "icon-152x152.png"
Copy-Item "192.png" -Destination "icon-192x192.png"
Copy-Item "512.png" -Destination "icon-384x384.png"
Copy-Item "512.png" -Destination "icon-512x512.png"

# Ícones adicionais
Copy-Item "192.png" -Destination "favicon-196.png"
Copy-Item "180.png" -Destination "icon-180x180.png"
Copy-Item "167.png" -Destination "icon-167x167.png"

# Splash screens (usando o maior ícone disponível como base)
Copy-Item "1024.png" -Destination "splash-2048x2732.png"
Copy-Item "1024.png" -Destination "splash-1668x2224.png"
Copy-Item "1024.png" -Destination "splash-1536x2048.png"
Copy-Item "1024.png" -Destination "splash-1125x2436.png"
Copy-Item "1024.png" -Destination "splash-1242x2208.png"
Copy-Item "1024.png" -Destination "splash-750x1334.png"
Copy-Item "1024.png" -Destination "splash-640x1136.png" 