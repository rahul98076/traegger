$body = @{ username = "rahul"; password = "StrongAdminPassword!2026" } | ConvertTo-Json;
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body $body -ContentType "application/json";
$adminToken = $response.access_token;
$headers = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" };

Write-Output "1. Fetching full menu (unauthenticated should work)..."
$menu = Invoke-RestMethod -Uri "http://localhost:8000/api/menu" -Method Get
$menuCount = $menu.Count
Write-Output "Found $menuCount items in seed."

Write-Output "`n2. Fetching 'marzipan_treats' category..."
$marzipan = Invoke-RestMethod -Uri "http://localhost:8000/api/menu?category=marzipan_treats" -Method Get -Headers $headers
$marzCount = $marzipan.Count
Write-Output "Found $marzCount marzipan items."

Write-Output "`n3. Creating new menu item (admin)..."
$newItem = @{ name = "Test Item"; category = "other"; size_unit = "1 pc"; price_paise = 50000; is_available = 1 } | ConvertTo-Json
$created = Invoke-RestMethod -Uri "http://localhost:8000/api/menu" -Method Post -Headers $headers -Body $newItem
Write-Output "Created item ID: $($created.id)"

Write-Output "`n4. Toggling availability..."
$toggleBody = @{ is_available = 0 } | ConvertTo-Json
$toggled = Invoke-RestMethod -Uri "http://localhost:8000/api/menu/$($created.id)/availability" -Method Patch -Headers $headers -Body $toggleBody
Write-Output "Item availability is now: $($toggled.is_available)"

Write-Output "`n5. Fetching available only..."
$allAvailable = Invoke-RestMethod -Uri "http://localhost:8000/api/menu?available_only=true" -Method Get -Headers $headers
$availCount = $allAvailable.Count
Write-Output "Found $availCount available items. Original seed count was $menuCount."
if ($availCount -eq $menuCount) {
    Write-Output "Filter verified (test item is unavailable and excluded)."
} else {
    Write-Output "Filter mismatch!"
}
