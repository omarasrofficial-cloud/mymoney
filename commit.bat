@echo off
set PATH=C:\Users\88018\git\cmd;C:\Users\88018\nodejs;C:\Users\88018\gh;%PATH%
cd /d C:\Users\88018\.gemini\antigravity\scratch\mymoney
git config user.name "MyMoney User"
git config user.email "user@mymoney.local"
git add .
git commit -m "Initial commit: MyMoney PWA offline personal finance tracker"
git branch -M main
git log --oneline
