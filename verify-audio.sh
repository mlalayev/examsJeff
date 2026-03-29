#!/bin/bash

# Audio File Verification Script
# Run this on your production server to verify audio files are accessible

echo "==================================="
echo "Audio File Verification Script"
echo "==================================="
echo ""

# Check if audio directory exists
echo "1. Checking if audio directory exists..."
if [ -d "/root/examsJeff/public/audio" ]; then
    echo "✓ Audio directory exists: /root/examsJeff/public/audio"
else
    echo "✗ Audio directory NOT found: /root/examsJeff/public/audio"
    exit 1
fi
echo ""

# List audio files
echo "2. Audio files in directory:"
ls -lh /root/examsJeff/public/audio/*.mp3 2>/dev/null
if [ $? -eq 0 ]; then
    FILE_COUNT=$(ls -1 /root/examsJeff/public/audio/*.mp3 2>/dev/null | wc -l)
    echo "✓ Found $FILE_COUNT audio file(s)"
else
    echo "✗ No .mp3 files found"
fi
echo ""

# Check permissions
echo "3. Checking permissions..."
AUDIO_DIR_PERMS=$(stat -c "%a" /root/examsJeff/public/audio 2>/dev/null)
if [ "$AUDIO_DIR_PERMS" = "755" ] || [ "$AUDIO_DIR_PERMS" = "775" ]; then
    echo "✓ Directory permissions OK: $AUDIO_DIR_PERMS"
else
    echo "⚠ Directory permissions: $AUDIO_DIR_PERMS (recommended: 755)"
fi

# Check file permissions
FIRST_FILE=$(ls /root/examsJeff/public/audio/*.mp3 2>/dev/null | head -1)
if [ -n "$FIRST_FILE" ]; then
    FILE_PERMS=$(stat -c "%a" "$FIRST_FILE")
    if [ "$FILE_PERMS" = "644" ] || [ "$FILE_PERMS" = "664" ]; then
        echo "✓ File permissions OK: $FILE_PERMS"
    else
        echo "⚠ File permissions: $FILE_PERMS (recommended: 644)"
    fi
fi
echo ""

# Check ownership
echo "4. Checking ownership..."
AUDIO_DIR_OWNER=$(stat -c "%U:%G" /root/examsJeff/public/audio)
echo "   Directory owner: $AUDIO_DIR_OWNER"
if [ -n "$FIRST_FILE" ]; then
    FILE_OWNER=$(stat -c "%U:%G" "$FIRST_FILE")
    echo "   File owner: $FILE_OWNER"
fi
echo ""

# Test Nginx configuration
echo "5. Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration has errors"
    sudo nginx -t
fi
echo ""

# Check if Nginx audio location is configured
echo "6. Checking Nginx audio location block..."
if grep -q "location.*audio" /etc/nginx/sites-available/aimentor 2>/dev/null; then
    echo "✓ Audio location block found in Nginx config"
    grep -A 5 "location.*audio" /etc/nginx/sites-available/aimentor | head -10
else
    echo "✗ Audio location block NOT found in Nginx config"
fi
echo ""

# Test HTTP access to a file
echo "7. Testing HTTP access to audio files..."
if [ -n "$FIRST_FILE" ]; then
    FILENAME=$(basename "$FIRST_FILE")
    echo "   Testing: https://exams.jeff.az/audio/$FILENAME"
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://exams.jeff.az/audio/$FILENAME")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✓ HTTP Status: $HTTP_STATUS (OK)"
        
        # Check content type
        CONTENT_TYPE=$(curl -s -I "https://exams.jeff.az/audio/$FILENAME" | grep -i "content-type" | cut -d: -f2 | tr -d '[:space:]')
        echo "   Content-Type: $CONTENT_TYPE"
        
        if [[ "$CONTENT_TYPE" == *"audio"* ]]; then
            echo "✓ Content-Type is correct"
        else
            echo "⚠ Content-Type might be incorrect"
        fi
    else
        echo "✗ HTTP Status: $HTTP_STATUS (Expected 200)"
        echo "   This means files exist but are not accessible via web"
    fi
else
    echo "⚠ No audio files to test"
fi
echo ""

# Check Nginx logs
echo "8. Recent Nginx audio errors (last 10):"
if [ -f "/var/log/nginx/audio_error.log" ]; then
    sudo tail -10 /var/log/nginx/audio_error.log 2>/dev/null || echo "   (No errors or log file not accessible)"
else
    echo "   Audio error log not found (this is OK if audio logging is not yet configured)"
fi
echo ""

# Summary
echo "==================================="
echo "Summary & Recommendations"
echo "==================================="
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Everything looks good! Audio files should be accessible."
else
    echo "⚠ Issues detected. Recommended actions:"
    echo ""
    echo "1. Fix permissions (if needed):"
    echo "   sudo chown -R www-data:www-data /root/examsJeff/public/audio/"
    echo "   sudo chmod 755 /root/examsJeff/public/audio/"
    echo "   sudo chmod 644 /root/examsJeff/public/audio/*.mp3"
    echo ""
    echo "2. Update Nginx config:"
    echo "   sudo cp /root/examsJeff/nginx-production.conf /etc/nginx/sites-available/aimentor"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "3. Check logs:"
    echo "   sudo tail -f /var/log/nginx/aimentor_error.log"
fi
echo ""
