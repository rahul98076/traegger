$body = @{ username = "rahul"; password = "StrongAdminPassword!2026" } | ConvertTo-Json;
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body $body -ContentType "application/json";
$adminToken = $response.access_token;
Write-Output "Admin Token generated."

# Create new user 'penny' as editor
$pennyUser = @{ username = "penny"; display_name = "Penny"; password = "Password123"; role = "editor" } | ConvertTo-Json;
$headers = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" };
Write-Output "Adding penny..."
Invoke-RestMethod -Uri "http://localhost:8000/api/users" -Method Post -Headers $headers -Body $pennyUser | ConvertTo-Json;

# Get users
Write-Output "Getting users..."
Invoke-RestMethod -Uri "http://localhost:8000/api/users" -Method Get -Headers $headers | ConvertTo-Json;

# Login as penny
Write-Output "Logging in as penny..."
$bodyPenny = @{ username = "penny"; password = "Password123" } | ConvertTo-Json;
$responsePenny = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body $bodyPenny -ContentType "application/json";
$pennyToken = $responsePenny.access_token;

# Try to list users as penny (should fail 403)
Write-Output "Trying to list users as editor (expecting 403)..."
try {
    $editorHeaders = @{ Authorization = "Bearer $pennyToken" };
    Invoke-RestMethod -Uri "http://localhost:8000/api/users" -Method Get -Headers $editorHeaders;
} catch {
    Write-Output "Failed as expected: $($_.Exception.Message)"
}
