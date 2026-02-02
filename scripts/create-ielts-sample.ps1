# PowerShell script to create IELTS Mock Test Sample 1
$uri = "http://localhost:3000/api/admin/seed/ielts-mock-sample-1"

try {
    Write-Host "Creating IELTS Mock Test Sample 1..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json"
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Exam ID: $($response.exam.id)" -ForegroundColor Cyan
    Write-Host "Title: $($response.exam.title)" -ForegroundColor Cyan
    Write-Host "Sections: $($response.exam.sectionsCount)" -ForegroundColor Cyan
    Write-Host "Total Questions: $($response.exam.totalQuestions)" -ForegroundColor Cyan
    
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

