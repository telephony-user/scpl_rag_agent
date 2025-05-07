# test_preprocess.ps1

Write-Host "Тестовый скрипт для preprocess.mjs"
Write-Host "==================================="
Write-Host "ВАЖНО: Этот скрипт использует ЗАГЛУШКИ для LLM эндпоинтов и API ключей."
Write-Host "Это означает, что реальные вызовы к LLM для анализа и генерации Mermaid НЕ ПРОИЗОЙДУТ."
Write-Host "Ожидаемое поведение: изображения НЕ будут преобразованы в Mermaid, теги <img> останутся."
Write-Host "Проверяется корректность обработки ошибок и пропуск шагов LLM."
Write-Host ""
Write-Host "Для полноценного теста с реальными LLM вызовами, вам нужно установить"
Write-Host "корректные значения для следующих переменных окружения перед запуском node:"
Write-Host "  - LLM_IMAGE_ENDPOINT, LLM_API_KEY"
Write-Host "  - GUARD_LLM_IMAGE_ENDPOINT, GUARD_LLM_API_KEY (или они унаследуют значения от LLM_)"
Write-Host "  - GIT_REPO_URL (ОБЯЗАТЕЛЬНО! Укажите корректный URL ниже)"
Write-Host "-----------------------------------"

# --- Конфигурация ---
$ModuleId = "Demo-Meetups-Recordings-v4-20250131-115822"
# !!! ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ URL РЕПОЗИТОРИЯ !!!
$env:GIT_REPO_URL = "https_ваш_реальный_git_repo_url_здесь" # Например, "https://github.com/user/repo.git"
$env:SKIP_SVG = "false" # Или "true" для тестирования другого сценария

# Используем заглушки для LLM - это приведет к ошибкам при вызове axios.post
# и протестирует обработку этих ошибок в preprocess.mjs
$env:LLM_IMAGE_ENDPOINT = "http://localhost/dummy_llm_endpoint"
$env:LLM_API_KEY = "dummy_api_key"
$env:GUARD_LLM_IMAGE_ENDPOINT = "http://localhost/dummy_guard_llm_endpoint"
$env:GUARD_LLM_API_KEY = "dummy_guard_api_key"
# Модель можно оставить, она не будет реально использоваться с заглушками эндпоинтов
$env:MERMAID_LLM_MODEL = "dummy/model"
$env:GUARD_IMAGE_MODEL = "dummy/guard_model"


Write-Host "Установлены следующие временные переменные окружения для этого сеанса:"
Write-Host "GIT_REPO_URL: $env:GIT_REPO_URL"
Write-Host "SKIP_SVG: $env:SKIP_SVG"
Write-Host "LLM_IMAGE_ENDPOINT: $env:LLM_IMAGE_ENDPOINT"
Write-Host "GUARD_LLM_IMAGE_ENDPOINT: $env:GUARD_LLM_IMAGE_ENDPOINT"
Write-Host ""

if ($env:GIT_REPO_URL -eq "https_ваш_реальный_git_repo_url_здесь") {
    Write-Error "ПОЖАЛУЙСТА, ОТРЕДАКТИРУЙТЕ СКРИПТ И УКАЖИТЕ РЕАЛЬНЫЙ GIT_REPO_URL В ФАЙЛЕ test_preprocess.ps1."
    exit 1
}

Write-Host "Запуск preprocess.mjs для модуля: $ModuleId..."
Write-Host "Ожидайте вывода логов. Это может занять некоторое время..."
Write-Host "-----------------------------------"

node scripts/preprocess.mjs --module $ModuleId

Write-Host "-----------------------------------"
Write-Host "Завершение работы preprocess.mjs."
Write-Host ""
Write-Host "Инструкции по проверке:"
Write-Host "1. Просмотрите ЛОГИ ВЫШЕ:"
Write-Host "   - Должны быть сообщения об ошибках при попытке вызова LLM (для Guard LLM и Mermaid LLM), т.к. эндпоинты - заглушки."
Write-Host "     Например: '[Guard LLM] Error checking image ...', '[Mermaid Generator] Ошибка при запросе к LLM ...'"
Write-Host "   - Сообщения от Guard LLM должны указывать, что изображение НЕ считается диаграммой из-за ошибки."
Write-Host "     (Или, если GUARD_LLM_IMAGE_ENDPOINT не задан в .env, то `isImageADiagram` вернет true по умолчанию - '[Guard LLM] Guard LLM endpoint or API key not configured. Assuming image IS a diagram...')"
Write-Host "     Например: '[Guard LLM] Due to error, assuming image ... is NOT a diagram.'"
Write-Host "   - Сообщения от Mermaid Generator должны указывать на неудачу получения ответа от LLM."
Write-Host "     Например: '[Main Processor] Не удалось получить ответ от LLM для ...'"
Write-Host "   - Проверьте статистику в конце логов `processAndReplaceImages`: `Отправлено на обработку в Mermaid LLM` должно быть 0 (или очень мало, если Guard LLM не был сконфигурирован и возвращал true по умолчанию)."

Write-Host "2. Проверьте СОЗДАННЫЕ ЧАНКИ в директории:"
Write-Host "   `source_md/$ModuleId/processed_chunks/`"
Write-Host "   - Откройте несколько .md файлов чанков."
Write-Host "   - Теги <img> для НЕ-SVG изображений должны были ОСТАТЬСЯ БЕЗ ИЗМЕНЕНИЙ (не преобразованы в \`\`\`mermaid)."
Write-Host "   - SVG изображения должны остаться как <img> (т.к. они и так не обрабатываются LLM, независимо от SKIP_SVG)."
Write-Host "   - Если в исходных MD были изображения, файлы которых отсутствовали, теги <img> для них также должны остаться (и в логах должны быть предупреждения 'Файл изображения не найден')."
Write-Host ""
Write-Host "3. (Опционально) Очистка:"
Write-Host "   - Удалите директорию `source_md/$ModuleId` если она больше не нужна для тестов (но она будет перезаписана при следующем запуске preprocess для этого модуля)."
Write-Host "   - Временная директория, создаваемая preprocess.mjs (путь будет в логах), должна удаляться автоматически. Проверьте это."
Write-Host ""
Write-Host "Тестовый прогон завершен."

# Сброс переменных окружения, установленных для этого скрипта
# Это важно, чтобы они не влияли на другие операции в том же сеансе PowerShell
Write-Host "Очистка временных переменных окружения..."
Remove-Item Env:GIT_REPO_URL -ErrorAction SilentlyContinue
Remove-Item Env:SKIP_SVG -ErrorAction SilentlyContinue
Remove-Item Env:LLM_IMAGE_ENDPOINT -ErrorAction SilentlyContinue
Remove-Item Env:LLM_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:GUARD_LLM_IMAGE_ENDPOINT -ErrorAction SilentlyContinue
Remove-Item Env:GUARD_LLM_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:MERMAID_LLM_MODEL -ErrorAction SilentlyContinue
Remove-Item Env:GUARD_IMAGE_MODEL -ErrorAction SilentlyContinue

Write-Host "Временные переменные окружения были очищены." 