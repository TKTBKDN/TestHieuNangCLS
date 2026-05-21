#!/bin/bash
echo "============================================================"
echo "  LOAD TEST - He Thong Web"
echo "  Thoi gian: $(date)"
echo "============================================================"
echo ""

# ============================================================
# CAU HINH - SUA TAI DAY
# ============================================================

# Duong dan den JMeter
JMETER_HOME="${JMETER_HOME:-/opt/apache-jmeter-5.6.3}"

# So user dong thoi
THREADS="${1:-50}"

# Thoi gian tang tai (giay)
RAMP_UP="${2:-60}"

# Tong thoi gian test (giay)
DURATION="${3:-300}"

# ============================================================
# KHONG CAN SUA PHIA DUOI
# ============================================================

# Kiem tra JMeter
if [ ! -f "$JMETER_HOME/bin/jmeter" ]; then
    echo "[LOI] Khong tim thay JMeter tai: $JMETER_HOME"
    echo "Sua bien JMETER_HOME hoac truyen qua env variable."
    exit 1
fi

# Di chuyen ve thu muc goc
cd "$(dirname "$0")/.."

# Tao thu muc reports
mkdir -p reports

# Timestamp cho ket qua
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_FILE="reports/results_${TIMESTAMP}.csv"
REPORT_DIR="reports/html-report_${TIMESTAMP}"

echo "[INFO] Cau hinh test:"
echo "  - Users dong thoi : $THREADS"
echo "  - Thoi gian ramp-up: $RAMP_UP giay"
echo "  - Thoi gian test   : $DURATION giay"
echo "  - Ket qua CSV      : $RESULT_FILE"
echo "  - Bao cao HTML     : $REPORT_DIR"
echo ""
echo "[INFO] Dang chay load test... (Non-GUI mode)"
echo "============================================================"
echo ""

# Chay JMeter
"$JMETER_HOME/bin/jmeter" -n \
    -t test-plan.jmx \
    -l "$RESULT_FILE" \
    -j "reports/jmeter_${TIMESTAMP}.log" \
    -Jthreads=$THREADS \
    -Jrampup=$RAMP_UP \
    -Jduration=$DURATION \
    -q user.properties \
    -e -o "$REPORT_DIR"

echo ""
echo "============================================================"
if [ $? -eq 0 ]; then
    echo "[THANH CONG] Load test hoan tat!"
    echo ""
    echo "Mo bao cao HTML tai:"
    echo "  $REPORT_DIR/index.html"
    
    # Tu dong mo bao cao
    if command -v xdg-open &> /dev/null; then
        xdg-open "$REPORT_DIR/index.html"
    elif command -v open &> /dev/null; then
        open "$REPORT_DIR/index.html"
    fi
else
    echo "[LOI] Load test gap loi! Kiem tra log tai:"
    echo "  reports/jmeter_${TIMESTAMP}.log"
fi
echo "============================================================"
