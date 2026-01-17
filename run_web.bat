@echo off
title He thong Chan doan Benh Cay Trong

echo Dang khoi dong Backend FastAPI...
:: Di chuyen vao thu muc be va chay app.py
start cmd /k "cd be && python app.py"

echo Dang cho Backend on dinh (5 giay)...
timeout /t 5

echo Dang mo giao diện web...
:: Mo file diagnosis.html trong thu muc fe/components
start "" "fe/components/diagnosis.html"

echo Hoan tat! He thong da san sang.
pause