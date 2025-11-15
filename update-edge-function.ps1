# Script para actualizar Edge Function desde PowerShell
# NO EJECUTAR - Solo de referencia

Write-Host "Para actualizar la Edge Function, sigue estos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a Supabase Dashboard:" -ForegroundColor Green
Write-Host "   https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/functions" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Clic en 'generate-invite'" -ForegroundColor Green
Write-Host ""
Write-Host "3. Si ves un editor de código:" -ForegroundColor Green
Write-Host "   - Busca la línea que dice: https://iybjzqtiispacfmmynsx..." -ForegroundColor White
Write-Host "   - Cámbiala por: sento://invite/`${group_id}?t=`${inviteToken}" -ForegroundColor White
Write-Host "   - Clic 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "4. Si NO ves editor:" -ForegroundColor Green
Write-Host "   - Busca botón 'Edit function'" -ForegroundColor White
Write-Host "   - O 'New version'" -ForegroundColor White
Write-Host "   - O 'Update'" -ForegroundColor White
Write-Host ""
Write-Host "CAMBIO EXACTO:" -ForegroundColor Yellow
Write-Host "Línea 202 del archivo index.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "ANTES:" -ForegroundColor Red
Write-Host 'const deepLink = `https://iybjzqtiispacfmmynsx.supabase.co/invite/${group_id}?t=${inviteToken}`;' -ForegroundColor Red
Write-Host ""
Write-Host "DESPUÉS:" -ForegroundColor Green
Write-Host 'const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;' -ForegroundColor Green

