### Hexlet tests and linter status:
[![Actions Status](https://github.com/KostylevEugene/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/KostylevEugene/ai-for-developers-project-387/actions)
[![Lighthouse CI](https://github.com/KostylevEugene/ai-for-developers-project-387/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/KostylevEugene/ai-for-developers-project-387/actions/workflows/lighthouse.yml)

# Lighthouse CI

Проект использует [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) для автоматического аудита качества фронтенда в нескольких режимах.

## Что аудируется

На каждый PR в `main` запускается workflow `.github/workflows/lighthouse.yml`, который собирает фронтенд (`npm run frontend:build`), поднимает `vite preview` на порту `4173` и прогоняет Lighthouse по 5 категориям:

- **Performance** — FCP, LCP, TBT/INP, CLS, TTFB, Speed Index.
- **Accessibility** — ARIA, контраст, alt, lang, фокус, заголовки.
- **Best Practices** — HTTPS, ошибки в консоли, HTTP-заголовки, deprecated API.
- **SEO** — title, meta description, viewport, robots.
- **PWA** — manifest, service worker (warnings, если не настроено).

## Триггеры запуска

Workflow `.github/workflows/lighthouse.yml` запускается по событиям GitHub:

| Событие | Job | Что происходит |
|---------|-----|----------------|
| `pull_request` в `main` | `audit-pr` | Кастомный PR-комментарий от `treosh/lighthouse-ci-action@v11` со summary-таблицей метрик + diff vs base. Status check `lighthouse / audit-pr` блокирует merge при accessibility < 0.9 (нужна branch protection). |
| `push` в `main` | `audit-push` | Lighthouse ставит status check на последний коммит `main`. Артефакт `lighthouse-report-push`. |
| `issues` (opened) | `audit-issue` | Парсит первый URL из тела issue, аудирует его. Если URL нет — собирает фронтенд и аудирует `http://localhost:4173`. Результат публикуется как комментарий к issue с таблицей метрик и ссылкой на полный отчёт. |
| `workflow_dispatch` | любой job | Ручной запуск из вкладки Actions. |

### Пример issue для запуска аудита внешнего URL

Откройте issue с телом, содержащим URL:

```
Проверь https://example.com — тормозит LCP
```

Workflow достанет `https://example.com`, прогонит 3 аудита, в issue появится:

```
📊 Lighthouse CI report
URL аудита: https://example.com
| Категория | Score |
| Performance | 95 |
| Accessibility | 100 |
...
```

Если URL в теле отсутствует — аудитируется собранный `vite preview` на `localhost:4173`, отчёт всё равно posted.

## Настройки порогов

Задаются в `lighthouserc.json`:

| Категория           | Уровень | Порог  |
|---------------------|---------|--------|
| `performance`       | warn    | ≥ 0.9  |
| `seo`               | warn    | ≥ 0.9  |
| `best-practices`    | warn    | ≥ 0.9  |
| `accessibility`     | **error** | ≥ 0.9 |

`accessibility < 0.9` приводит к падению status check `lighthouse / lighthouse` — это блокирует merge PR (если в Settings → Branches включена branch protection с этим check’ом).

## Где смотреть отчёты

1. **PR-комментарие от `treosh/lighthouse-ci-action@v11`**: автоматически публикуется summary-таблица метрик (LCP/FCP/TBT/CLS) с диффом относительно `main` (стрелки ↑/↓, % изменения).
2. **HTML-отчёт**: артефакт `lighthouse-report` в Summary workflow на 30 дней. Скачайте zip, откройте `.lighthouseci/index.html`.
3. **Ссылка на temporary-public-storage**: action загружает отчёт во временное хранилище Google и прикладывает ссылку в PR-комментарий.

## Локальный запуск

```bash
npm install
npm run frontend:build
npm run lhc:autorun
```

Отчёт появится в `.lighthouseci/`. Отдельные этапы:

- `npm run lhc:collect` — только сбор метрик.
- `npm run lhc:assert` — только проверка assertions по собранным метрикам.

## Изменение конфигурации

- URL/порт: `lighthouserc.json` → `ci.collect.url` (и `startServerCommand`, если порт другой).
- Пороги: `lighthouserc.json` → `ci.assert.assertions`.
- Количество прогонов: `lighthouserc.json` → `ci.collect.numberOfRuns` (по умолчанию 3 для сглаживания дисперсии).
- Preset: `ci.collect.settings.preset` — `desktop` (по умолчанию) или `mobile`.