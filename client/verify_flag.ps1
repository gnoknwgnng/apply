$adminSecret = "admin123"
$headers = @{ "Content-Type" = "application/json" }
$adminHeaders = @{ "x-admin-secret" = $adminSecret; "Content-Type" = "application/json" }

# 1. Report
Write-Host "1. Reporting 9999999999..."
$body = @{ contact = "9999999999"; type = "phone"; fraud_type = "Test Scam"; description = "Backend Verify" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/report" -Method Post -Headers $headers -Body $body
} catch {
    Write-Host "Report Error: $_"
}

# 2. Get Contact ID
Write-Host "2. Getting ID..."
try {
    $reports = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/reports" -Method Get -Headers $adminHeaders
    # Write-Host "DEBUG Reports Count: $($reports.Count)"
    # Write-Host "DEBUG First Report: $($reports[0] | ConvertTo-Json -Depth 2)"
    
    # Filter for our test contact (hash comparison is hard, so just take the most recent one created today)
    $target = $reports[0] 
    $contactId = $target.contact_id
    Write-Host "   Target ID: $contactId"

    if (-not $contactId) {
        Write-Host "ERROR: Could not find contact ID"
        exit
    }

    # 3. Flag It
    Write-Host "3. Flagging Contact..."
    $flagBody = @{ status = "flagged" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3001/api/admin/contacts/$contactId/status" -Method Post -Headers $adminHeaders -Body $flagBody

    # 4. Search and Verify
    Write-Host "4. Searching..."
    $searchRes = Invoke-RestMethod -Uri "http://localhost:3001/api/search?q=9999999999" -Method Get
    Write-Host "   Status: $($searchRes.status)"

    if ($searchRes.status -eq "Flagged") {
        Write-Host "SUCCESS: Status is Flagged"
    } else {
        Write-Host "FAILURE: Status is $($searchRes.status)"
    }

} catch {
    Write-Host "Fatal Error: $_"
}
