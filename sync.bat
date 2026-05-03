@echo off
copy index.html www\
copy style.css www\
copy script.js www\
copy manifest.json www\
copy sw.js www\
copy icon.png www\
npx cap sync
echo Done! Now click play in Android Studio 🌸
pause