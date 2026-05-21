@echo off
chcp 65001 >nul
echo ============================================================
echo   LOAD TEST - He Thong Web
echo   Thoi gian: %date% %time%
echo ============================================================
echo.

:: ============================================================
:: CAU HINH - SUA TAI DAY
:: ============================================================

:: Duong dan den JMeter (sua cho phu hop voi may cua ban)
set JMETER_HOME=C:\apache-jmeter-5.6.3

:: So user dong thoi
set THREADS=50

:: Thoi gian tang tai (giay)
set RAMP_UP=60

:: Tong thoi gian test (giay) - 300 = 5 phut
set DURATION=300

:: ============================================================
:: KHONG CAN SUA PHIA DUOI
:: ============================================================

:: Kiem tra JMeter ton tai
if not exist "%JMETER_HOME%\bin\jmeter.bat" (
    echo [LOI] Khong tim thay JMeter tai: %JMETER_HOME%
    echo Vui long sua bien JMETER_HOME trong file nay.
    echo Download JMeter tai: https://jmeter.apache.org/download_jmeter.cgi
    pause
    exit /b 1
)

:: Di chuyen ve thu muc goc cua project
cd /d "%~dp0\.."

:: Tao thu muc reports neu chua co
if not exist "reports" mkdir reports

:: Xoa ket qua cu (neu co)
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set RESULT_FILE=reports\results_%TIMESTAMP%.csv
set REPORT_DIR=reports\html-report_%TIMESTAMP%

echo [INFO] Cau hinh test:
echo   - Users dong thoi : %THREADS%
echo   - Thoi gian ramp-up: %RAMP_UP% giay
echo   - Thoi gian test   : %DURATION% giay
echo   - Ket qua CSV      : %RESULT_FILE%
echo   - Bao cao HTML     : %REPORT_DIR%
echo.
echo [INFO] Dang chay load test... (Non-GUI mode)
echo ============================================================
echo.

:: Chay JMeter o che do non-GUI
"%JMETER_HOME%\bin\jmeter.bat" -n ^
    -t test-plan.jmx ^
    -l "%RESULT_FILE%" ^
    -j "reports\jmeter_%TIMESTAMP%.log" ^
    -Jthreads=%THREADS% ^
    -Jrampup=%RAMP_UP% ^
    -Jduration=%DURATION% ^
    -q user.properties ^
    -e -o "%REPORT_DIR%"

echo.
echo ============================================================
if %errorlevel% equ 0 (
    echo [THANH CONG] Load test hoan tat!
    echo.
    echo Mo bao cao HTML tai:
    echo   %REPORT_DIR%\index.html
    echo.
    echo Dang mo bao cao trong trinh duyet...
    start "" "%REPORT_DIR%\index.html"
) else (
    echo [LOI] Load test gap loi! Kiem tra log tai:
    echo   reports\jmeter_%TIMESTAMP%.log
)
echo ============================================================
pause
