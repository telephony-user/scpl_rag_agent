Модуль SCPL.Core.AgentHelper

SberContact Platform

Exported on 2025-01-30 18:46:24

# Table of Contents

1 Архитектура взаимодействия компонентов [5](#архитектура-взаимодействия-компонентов)

2 Требования к записи экранов [8](#требования-к-записи-экранов)

3 Требования к реализации AgentHelper [9](#требования-к-реализации-agenthelper)

4 Основные характеристики [12](#основные-характеристики)

5 Сообщения Web-Socket в сторону AgentServer [13](#сообщения-web-socket-в-сторону-agentserver)

5.1 agentHelperInfo - редактирование [13](#agenthelperinfo---редактирование)

5.2 newRecBatch [14](#newrecbatch)

5.3 resultRestartScreenRecord [16](#resultrestartscreenrecord)

5.4 resultStartScreenRecord [17](#resultstartscreenrecord)

5.5 resultStartStream [19](#resultstartstream)

5.6 resultStopScreenRecord [21](#resultstopscreenrecord)

5.7 resultStopStream [23](#resultstopstream)

5.8 streamBlob [24](#streamblob)

6 Сообщения Web-Socket в сторону JsSDK [26](#сообщения-web-socket-в-сторону-jssdk)

6.1 resultAgentOpenConnect [26](#resultagentopenconnect)

7 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [28](#фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.1 v1 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [28](#v1-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.1.1 1. Описание фичи [28](#описание-фичи)

7.1.2 2. Описание процесса/сервиса TO BE [28](#описание-процессасервиса-to-be)

7.1.3 3. Описание запросов [30](#описание-запросов)

7.2 v2 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [39](#v2-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.2.1 1. Описание фичи [39](#описание-фичи-1)

7.2.2 2. Описание процесса/сервиса TO BE [39](#описание-процессасервиса-to-be-1)

7.2.3 3. Описание запросов [42](#описание-запросов-1)

7.3 v3 R2.1.0 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [54](#v3-r2.1.0-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.3.1 1. Описание фичи [54](#описание-фичи-2)

7.3.2 2. Описание процесса/сервиса TO BE [54](#описание-процессасервиса-to-be-2)

7.3.3 3. Описание запросов [58](#описание-запросов-2)

7.4 v4 R2.8.0 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [75](#v4-r2.8.0-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.4.1 1. Описание фичи [76](#описание-фичи-3)

7.4.2 2. Описание процесса/сервиса TO BE [76](#описание-процессасервиса-to-be-3)

7.4.3 3. Описание запросов [79](#описание-запросов-3)

7.5 v5 R2.11 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии" [96](#v5-r2.11-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

7.5.1 1. Описание фичи [97](#описание-фичи-4)

7.5.2 2. Описание процесса/сервиса TO BE [97](#описание-процессасервиса-to-be-4)

7.5.3 3. Описание запросов [101](#описание-запросов-4)

8 Фича Core.AgentHelper "Запись экрана оператора" [119](#фича-core.agenthelper-запись-экрана-оператора)

8.1 v1 Фича Core.AgentHelper "Запись экрана оператора" [119](#v1-фича-core.agenthelper-запись-экрана-оператора)

8.1.1 1. Описание фичи [119](#описание-фичи-5)

8.1.2 2. Описание процесса/сервиса TO BE [119](#описание-процессасервиса-to-be-5)

8.1.3 3. Описание запросов [121](#описание-запросов-5)

8.2 v2 Фича Core.AgentHelper "Запись экрана оператора" [127](#v2-фича-core.agenthelper-запись-экрана-оператора)

8.2.1 1. Описание фичи [128](#описание-фичи-6)

8.2.2 2. Описание процесса/сервиса TO BE [128](#описание-процессасервиса-to-be-6)

8.2.3 3. Описание запросов [131](#описание-запросов-6)

8.3 v3 R 1.11.0 Фича Core.AgentHelper "Запись экрана оператора" [136](#v3-r-1.11.0-фича-core.agenthelper-запись-экрана-оператора)

8.3.1 1. Описание фичи [136](#описание-фичи-7)

8.3.2 2. Описание процесса/сервиса TO BE [136](#описание-процессасервиса-to-be-7)

8.3.3 3. Описание запросов [140](#описание-запросов-7)

8.4 v4 R 1.12.0 Фича Core.AgentHelper "Запись экрана оператора" [146](#v4-r-1.12.0-фича-core.agenthelper-запись-экрана-оператора)

8.4.1 1. Описание фичи [146](#описание-фичи-8)

8.4.2 2. Описание процесса/сервиса TO BE [146](#описание-процессасервиса-to-be-8)

8.4.3 3. Описание запросов [150](#описание-запросов-8)

8.5 v5 R 2.8 Фича Core.AgentHelper "Запись экрана оператора" [158](#v5-r-2.8-фича-core.agenthelper-запись-экрана-оператора)

8.5.1 1. Описание фичи [158](#описание-фичи-9)

8.5.2 2. Описание процесса/сервиса TO BE [158](#описание-процессасервиса-to-be-9)

8.5.3 3. Описание запросов [162](#описание-запросов-9)

8.6 v6 R3.2 Фича Core.AgentHelper "Запись экрана оператора" [170](#v6-r3.2-фича-core.agenthelper-запись-экрана-оператора)

8.6.1 1. Описание фичи [170](#описание-фичи-10)

8.6.2 2. Описание процесса/сервиса TO BE [170](#описание-процессасервиса-to-be-10)

8.6.3 3. Описание запросов [176](#описание-запросов-10)

9 Фича Core.AgentHelper "Остановка записи экрана оператора" [187](#фича-core.agenthelper-остановка-записи-экрана-оператора)

9.1 v1 Фича Core.AgentHelper "Остановка записи экрана оператора" [187](#v1-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.1.1 1. Описание фичи [187](#описание-фичи-11)

9.1.2 2. Описание процесса/сервиса TO BE [187](#описание-процессасервиса-to-be-11)

9.2 v2 Фича Core.AgentHelper "Остановка записи экрана оператора" [191](#v2-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.2.1 1. Описание фичи [191](#описание-фичи-12)

9.2.2 2. Описание процесса/сервиса TO BE [191](#описание-процессасервиса-to-be-12)

9.3 v3 R1.11.0 Фича Core.AgentHelper "Остановка записи экрана оператора" [195](#v3-r1.11.0-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.3.1 1. Описание фичи [196](#описание-фичи-13)

9.3.2 2. Описание процесса/сервиса TO BE [196](#описание-процессасервиса-to-be-13)

9.3.3 3. Описание запросов [198](#описание-запросов-11)

9.4 v4 R1.12.0 Фича Core.AgentHelper "Остановка записи экрана оператора" [202](#v4-r1.12.0-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.4.1 1. Описание фичи [203](#описание-фичи-14)

9.4.2 2. Описание процесса/сервиса TO BE [203](#описание-процессасервиса-to-be-14)

9.4.3 3. Описание запросов [205](#описание-запросов-12)

9.5 v5 R2.8 Фича Core.AgentHelper "Остановка записи экрана оператора" [208](#v5-r2.8-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.5.1 1. Описание фичи [208](#описание-фичи-15)

9.5.2 2. Описание процесса/сервиса TO BE [208](#описание-процессасервиса-to-be-15)

9.5.3 3. Описание запросов [211](#описание-запросов-13)

9.6 v6 R3.2 Фича Core.AgentHelper "Остановка записи экрана оператора" [214](#v6-r3.2-фича-core.agenthelper-остановка-записи-экрана-оператора)

9.6.1 1. Описание фичи [214](#описание-фичи-16)

9.6.2 2. Описание процесса/сервиса TO BE [214](#описание-процессасервиса-to-be-16)

9.6.3 3. Описание запросов [218](#описание-запросов-14)

10 Параметры записи экранов, передаваемые из AgentServer в AgentHelper для использования в ffmpeg [222](#параметры-записи-экранов-передаваемые-из-agentserver-в-agenthelper-для-использования-в-ffmpeg)

11 Взаимодействие компонентов для записи экранов при back-to-back подключении [224](#взаимодействие-компонентов-для-записи-экранов-при-back-to-back-подключении)

12 Архив Core.AgentHelper [225](#архив-core.agenthelper)

12.1 архив-resultGetDisplayInfo [225](#архив-resultgetdisplayinfo)

13 Фича Core.AgentHelper "Запись вне платформы" [228](#фича-core.agenthelper-запись-вне-платформы)

13.1 R2.12 Фича "Запись экрана оператора вне платформы" [228](#r2.12-фича-запись-экрана-оператора-вне-платформы)

13.1.1 1. Описание фичи [228](#описание-фичи-17)

13.1.2 2. Описание процесса/сервиса TO BE [228](#описание-процессасервиса-to-be-17)

13.1.3 3. Описание запросов [230](#описание-запросов-15)

13.2 R2.12 Фича "Остановка записи экрана оператора вне платформы" [230](#r2.12-фича-остановка-записи-экрана-оператора-вне-платформы)

13.2.1 1. Описание фичи [231](#описание-фичи-18)

13.2.2 2. Описание процесса/сервиса TO BE [231](#описание-процессасервиса-to-be-18)

13.2.3 3. Описание запросов [232](#описание-запросов-16)

13.3 R2.12 Фича "Подключение агента записи экрана оператора для записи вне платформы" [233](#r2.12-фича-подключение-агента-записи-экрана-оператора-для-записи-вне-платформы)

13.3.1 ID фичи в JIRA [233](#id-фичи-в-jira)

13.3.2 1. Описание фичи [233](#описание-фичи-19)

13.3.3 2. Описание процесса/сервиса TO BE [233](#описание-процессасервиса-to-be-19)

13.3.4 3. Примеры запросов [236](#примеры-запросов)

13.3.5 Бизнес-требования [236](#бизнес-требования)

- [Архитектура взаимодействия компонентов](#архитектура-взаимодействия-компонентов)

- [Требования к записи экранов](#требования-к-записи-экранов)

- [Требования к реализации AgentHelper](#требования-к-реализации-agenthelper)

- [Основные характеристики](#основные-характеристики)

- [Сообщения Web-Socket в сторону AgentServer](#сообщения-web-socket-в-сторону-agentserver)

- [Сообщения Web-Socket в сторону JsSDK](#сообщения-web-socket-в-сторону-jssdk)

- [Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

- [Фича Core.AgentHelper "Запись экрана оператора"](#фича-core.agenthelper-запись-экрана-оператора)

- [Фича Core.AgentHelper "Остановка записи экрана оператора"](#фича-core.agenthelper-остановка-записи-экрана-оператора)

- [Параметры записи экранов, передаваемые из AgentServer в AgentHelper для использования в ffmpeg](#параметры-записи-экранов-передаваемые-из-agentserver-в-agenthelper-для-использования-в-ffmpeg)

- [Взаимодействие компонентов для записи экранов при back-to-back подключении](#взаимодействие-компонентов-для-записи-экранов-при-back-to-back-подключении)

- [Архив Core.AgentHelper](#архив-core.agenthelper)

- [Фича Core.AgentHelper "Запись вне платформы"](#фича-core.agenthelper-запись-вне-платформы)

# Архитектура взаимодействия компонентов

<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image1.png" style="width:5.90069in;height:2.98183in" />

BPMN

<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image2.png" style="width:5.90069in;height:3.47259in" />

<table>
<colgroup>
<col style="width: 6%" />
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 12%" />
<col style="width: 10%" />
<col style="width: 29%" />
</colgroup>
<thead>
<tr class="header">
<th>Номер </th>
<th>Инициатор</th>
<th>Получатель</th>
<th><p>Тип</p>
<p>взаим.</p></th>
<th>Протокол</th>
<th>Назначение</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>wss1</td>
<td><p>SCPL JS SDK</p>
<p>Оператора</p></td>
<td>AgentProxyServer +AgentServer</td>
<td>Асинхронное</td>
<td>wss</td>
<td>Организация сессии пользователей для управления статусами и взаимодействиями, включая управление медиа</td>
</tr>
<tr class="even">
<td>ws2</td>
<td><p>SCPL JS SDK</p>
<p>Оператора</p></td>
<td>SCPL.Core.AgentHelper</td>
<td>Асинхронное</td>
<td>ws</td>
<td><p>Определение  запущенного SCPL Helper App на рабочем месте оператора.</p>
<p>Инициализация SCPL Helper App данными для подключения/переподключения к SCPL</p></td>
</tr>
<tr class="odd">
<td>wss3 </td>
<td>SCPL.Core.AgentHelper</td>
<td>AgentProxyServer +AgentServer</td>
<td>Асинхронное</td>
<td>wss</td>
<td><p>Подключение к тому-же AgentServer, на котором работает оператор</p>
<p>Выполнение команд по управлению записью экрана/экранов и трансляции экрана супервизору</p>
<p>Передача трафика экрана для супервизора</p></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 28%" />
<col style="width: 71%" />
<col style="width: 0%" />
</colgroup>
<thead>
<tr class="header">
<th>Модуль</th>
<th>Функциональность</th>
<th></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>AgentHelper под Windows как сервис</td>
<td>При</td>
<td></td>
</tr>
<tr class="even">
<td>AgentServer+JS SDK</td>
<td><p>Определение наличия AgentHelper и параметров </p>
<p>Установка регистрации из браузера на AgentHelper</p>
<p>Получение профиля записи экрана для оператора</p>
<p>Получение JWT-токена</p>
<p>Инициализация ScreenRecorder в части организации регистрации AgentHelper на AgentServer</p>
<p>Прием регистрации AgentHelper</p>
<p>Управление записью экрана оператора через AgentHelper</p>
<p>Формирование идентификаторов сегментов для записи экранов</p></td>
<td></td>
</tr>
<tr class="odd">
<td>ScreenRecorder</td>
<td><p>Получение трафика записи экрана и метаданных</p>
<p>Получение параметров записи экрана из AgentServer?</p>
<p>Передача данных о записи экрана в отчетность (как)?</p></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 16%" />
<col style="width: 80%" />
<col style="width: 0%" />
<col style="width: 0%" />
<col style="width: 0%" />
</colgroup>
<tbody>
<tr class="odd">
<td>регистрация</td>
<td><p>АГС выписывает JVT токен в AUTh</p>
<p>при поднятии wss1</p>
<p>передается запрос на подключение helper + передача токена</p>
<p>ответ - агента записи нет/ есть - подключился/нет</p>
<p>АГС - SDK: запрос на подкл.xение хелпера (URI для подключения к хелперу, URI для подключения к АГС, JVT token</p>
<p>SDK, userID)+ уровень логирования logLevel (? из профиля записи)</p>
<p>SDK - helper: попытка открыть Ws2</p>
<p>helper-ASG:  попытка открыть WSS3, реги</p>
<p>ASG-Auth: проверка JVT токена на валидность - да/нет</p>
<p>helper-SDK: результат открытия wss3 - поднял/не поднял/не подключился - нет оператора, нет сессии</p></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td>при закрытии wss3 не забыть отозвать токен</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td><p>сдох агс, переподняли wss1 на другом агс</p>
<p>переподключение со стороны хелпера</p></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td><p>уровень логирования - и в иницииализирующем событии, и в отдельном запросе</p>
<p>при попытке восстановления хелпера продолжается выполняться заданная логика в течение времени восстановления , если не подняли, то процессы останавливаем</p></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td><p>рассмотреть кейсы обрыва связи:</p>
<ul>
<li><p>порвался ws2</p></li>
<li><p>порвался wss3 - retry на стороне хелпера + если неуспешно, то сообщить агс и отправить запрос на подключение заново</p></li>
</ul></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

# Требования к записи экранов

<table>
<colgroup>
<col style="width: 5%" />
<col style="width: 3%" />
<col style="width: 87%" />
<col style="width: 0%" />
<col style="width: 0%" />
<col style="width: 0%" />
</colgroup>
<tbody>
<tr class="odd">
<td>КФ.</td>
<td>32</td>
<td>Должна быть доступна функция поиска (по различным критериям) и воспроизведения записей (запись голоса, экрана оператора) голосовых взаимодействий</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td>КФ.</td>
<td>33</td>
<td>Должна быть доступна функция поиска (по различным критериям) и воспроизведения записей экранов оператора для неголосовых взаимодействий</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td>КФ.</td>
<td>71</td>
<td>Должна быть возможность записи экрана рабочего места оператора во время обработки голосового взаимодействия, включая постобработку.<br />
Запись должна осуществляться и сохраняться в привязке к обработке конкретного взаимодействия оператором</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td>ОФ.</td>
<td>45</td>
<td>Должна быть возможность записи экрана рабочего места оператора во время обработки неголосового взаимодействия, включая постобработку. Запись должна осуществляться и сохраняться в привязке к обработке конкретного взаимодействия оператором</td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="even">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</tbody>
</table>

# Требования к реализации AgentHelper

<table>
<colgroup>
<col style="width: 82%" />
<col style="width: 17%" />
</colgroup>
<thead>
<tr class="header">
<th>Требование</th>
<th>Этап реализации</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Поддержка ОС Windows</td>
<td>1</td>
</tr>
<tr class="even">
<td>Поддержка ОС Linux</td>
<td></td>
</tr>
<tr class="odd">
<td>Поддержка ОС MacOS</td>
<td></td>
</tr>
<tr class="even">
<td>Захват экрана под Windows с использованием Desktop Duplication API (DXGI)</td>
<td></td>
</tr>
<tr class="odd">
<td>Работа AgentHelper как сервис Windows, демон Linux</td>
<td></td>
</tr>
<tr class="even">
<td>Необходима поддержка записи нескольких мониторов на рабочем месте с централизованной настройкой.</td>
<td></td>
</tr>
<tr class="odd">
<td><p>AgentHelper должен реализовывать WebSocket-сервер для получения управляющих команд из Web-приложения </p>
<p>Сервер должен слушать только на адресе 127.0.0.1 (localhost)</p></td>
<td></td>
</tr>
<tr class="even">
<td><p>По соединению WebSocket должна быть возможность</p>
<ul>
<li><p>Передать в AgentHelper</p>
<ul>
<li><p>URI для подключения к AgentProxyServer, </p></li>
<li><p>AgentHelper URI для подключения к ScreenRecorder,</p></li>
<li><p>токен для подключения,</p></li>
<li><p>идентификатор оператора,</p></li>
<li><p>ID-тенанта</p></li>
<li><p>уровень логирования</p></li>
<li><p>ID-сессии</p></li>
</ul></li>
<li><p>Передавать из AgentHelper в JS SDK</p>
<ul>
<li><p>версию AgentHelper</p></li>
<li><p>ошибки установления регистрации AgentHelper на AgentServer</p></li>
<li><p>события о потере регистрации AgentHelper на AgentServer </p></li>
</ul></li>
<li><p>Инициировать закрытие WebSocket при вылогинивании оператора</p></li>
<li><p>Корректно обрабатывать в AgentHelper разрыв WS-соединения в пределах timeout при при перезагрузке страницы в браузере (без перерегистрации на AgentServer и прерывания записи экранов)</p></li>
<li><p>Восстановить WebSocket соединение при обрыве</p></li>
</ul></td>
<td></td>
</tr>
<tr class="odd">
<td>AgentHelper должен поддерживать подключение к нему нескольких web-приложений и работать с каждым подключением независимо от других</td>
<td></td>
</tr>
<tr class="even">
<td><p>AgentHelper должен подключаться к AgentServer по grpc/wss.</p>
<p>Через это подключение должна поддерживаться следующая функциональность:</p>
<ul>
<li><p>Передача данных об AgentHelper:</p>
<ul>
<li><p>Токен для подключения</p></li>
<li><p>Идентификатор оператора</p></li>
<li><p>Идентификатор тенанта</p></li>
<li><p>Версия AgentHelper</p></li>
<li><p>Версия ОС</p></li>
<li><p>Кол-во и параметры дисплеев оператора</p></li>
<li><p>IP-адрес рабочего места</p></li>
<li><p>Возможности AgentHelper</p></li>
</ul></li>
<li><p>Получение и исполнение команд на запись экрана (старт, останов, пауза, снятие с паузы)</p></li>
<li><p>Получение от AgentServer параметры записи экрана (вплоть того, что на каждый вызов): частота кадров, параметры профиля сжатия и др</p></li>
<li><p>Получение и исполнение команд на передачу экрана супервизору</p></li>
<li><p>Передача трафика оператора для супервизора</p></li>
<li><p>Поддержка WebSocket со стороны AgentHelper</p></li>
<li><p>Завершение регистрации со стороны AgentServer</p></li>
<li><p>Завершение регистрации со стороны AgentHelper</p></li>
</ul></td>
<td></td>
</tr>
<tr class="odd">
<td><p>При взаимодействии с ScreenRecorder по grpc AgentHelper должен:</p>
<ul>
<li><p>передавать метаданные для записи экрана на ScreenRecorder (идентификатор оператора, идентификатор сегмента, timestamp)</p></li>
<li><p>передавать стрим для записи экрана на ScreenRecorder.</p></li>
<li><p>отдельно передавать данные экранов для разных мониторов (в разных grpc стримах)</p></li>
<li><p>передавать отдельные стримы под отдельные сегменты записи экранов</p></li>
<li><p>переживать перезагрузку pod</p></li>
<li><p>переживать разрыв grpc</p></li>
</ul></td>
<td></td>
</tr>
<tr class="even">
<td>Возможность получения и использования уровня логирования от AgentServer (через JSSDK или через прямую регистрацию)</td>
<td></td>
</tr>
<tr class="odd">
<td>AgentHelper должен реализовывать логирование с настраиваемым уровнем и поддержкой ротации</td>
<td></td>
</tr>
<tr class="even">
<td><p>Конфиг AgentServer должен содержать, как минимум:</p>
<ul>
<li><p>порт для ws сервера</p></li>
<li><p>уровень логирования </p></li>
<li><p>объем хранимых логов (в днях или чем-то еще)</p></li>
</ul></td>
<td></td>
</tr>
<tr class="odd">
<td></td>
<td></td>
</tr>
</tbody>
</table>

# Основные характеристики

<table>
<colgroup>
<col style="width: 51%" />
<col style="width: 48%" />
</colgroup>
<thead>
<tr class="header">
<th></th>
<th>SCPL</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Поддержка ОС на рабочих местах</td>
<td><p>Windows</p>
<p>Linux</p>
<p>MacOS</p></td>
</tr>
<tr class="even">
<td>Способы захвата экрана под Windows</td>
<td><p>Desktop Duplication API - DXGI</p>
<p>(GDI как fallback)</p></td>
</tr>
<tr class="odd">
<td>Частота захвата экрана (FrameRate)</td>
<td><p>5 FPS (можно регулировать)</p>
<p>1-30</p></td>
</tr>
<tr class="even">
<td>Кодек захвата записи экрана</td>
<td>H.264</td>
</tr>
<tr class="odd">
<td>Возможность аппаратного ускорения encoder</td>
<td></td>
</tr>
<tr class="even">
<td><p>Возможность настройки баланса</p>
<p>качества/компрессии сжатия</p></td>
<td>Да, отдельно для каждого монитора</td>
</tr>
<tr class="odd">
<td>Инструмент захвата записи экрана</td>
<td></td>
</tr>
<tr class="even">
<td>Способ сжатия</td>
<td>?</td>
</tr>
<tr class="odd">
<td>Протокол передачи записи экрана на сервер</td>
<td>grpc</td>
</tr>
<tr class="even">
<td>Возможность шифрования записей экрана</td>
<td>? FS GW?</td>
</tr>
<tr class="odd">
<td><p>Просмотр экрана оператора</p>
<p>супервизором в реальном времени</p></td>
<td><p>Да</p>
<p>Форк на стороне SCPL Helper и передаем на AG по grpc</p></td>
</tr>
<tr class="even">
<td>Контейнер для хранения записей экранов на сервере</td>
<td>не используем</td>
</tr>
<tr class="odd">
<td>Как реализован сервер записи экранов</td>
<td><p>Windows-сервис</p>
<p>Linux-демон</p></td>
</tr>
<tr class="even">
<td>Куда записываются файлы</td>
<td>Стриминг в S3</td>
</tr>
<tr class="odd">
<td>Где долговременное хранение</td>
<td>S3</td>
</tr>
<tr class="even">
<td>Пережимается ли на бэке запись экрана для хранения </td>
<td>Нет</td>
</tr>
<tr class="odd">
<td><p>Пережимается ли запись экрана для</p>
<p>воспроизведения в рабочем месте супервизора (из записи)</p></td>
<td><p>Нет</p>
<p>Добавляем голос</p></td>
</tr>
<tr class="even">
<td>Способ воспроизведения записи экрана</td>
<td>HTTP Streaming</td>
</tr>
</tbody>
</table>

# Сообщения Web-Socket в сторону AgentServer

- [agentHelperInfo - редактирование](#agenthelperinfo---редактирование)

- [newRecBatch](#newrecbatch)

- [resultRestartScreenRecord](#resultrestartscreenrecord)

- [resultStartScreenRecord](#resultstartscreenrecord)

- [resultStartStream](#resultstartstream)

- [resultStopScreenRecord](#resultstopscreenrecord)

- [resultStopStream](#resultstopstream)

- [streamBlob](#streamblob)

## agentHelperInfo - редактирование

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 24%" />
<col style="width: 8%" />
<col style="width: 51%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p><em>agentHelperInfo </em>- передача данных о рабочему месте оператора</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>computerName</td>
<td>string</td>
<td>Имя компьютера, в котором запущена платформа, если используется ВАРМ. При подключении с АРМ значение совпадает с realComputerName</td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>realComputerName</td>
<td>string</td>
<td>Реальное имя устройства, с которого подключен оператор</td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>realComputerIP</td>
<td>string</td>
<td>Реальный  IP-адрес устройства, с которого подключен оператор</td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>osLogin</td>
<td>string</td>
<td>Операционная система устройства, с которого подключен оператор <img src="D:\scpl full proj\pandoc sandbox\output\media/media/image4.svg" style="width:0.1667in;height:0.1667in" alt="(вопрос)" /></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>osDomain</td>
<td>string</td>
<td>Домен устройства, с которого подключен оператор <img src="D:\scpl full proj\pandoc sandbox\output\media/media/image4.svg" style="width:0.1667in;height:0.1667in" alt="(вопрос)" /></td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>versionAgentHelper</td>
<td>string</td>
<td>Версия AgentHelper, если он был обнаружен на рабочем месте.</td>
<td>[0...1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentHelperInfo",</p>
<p>"description": "передача данных о рабочему месте оператора",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"computerName": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"realComputerName": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"realComputerIP": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"osLogin": {</p>
<p>"type": "string"</p>
<p>},        </p>
<p>"osDomain": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"versionAgentHelper": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>}</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action": "agentHelperInfo",</p>
<p>"version": "v1.0",</p>
<p>"data": {</p>
<p>"computerName": "ccc-fv-452",</p>
<p>"realComputerName": "cac-jo-257",</p>
<p>"realComputerIP": "1.2.3.4",</p>
<p>"osLogin": "0123456789",</p>
<p>"osDomain": "GAMMA.SBER.RU",</p>
<p>"versionAgentHelper": "AgentHelper 1.9.1.14"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## newRecBatch

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 64%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p>newRecBatch  - сообщение содержащее имя файла записи</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат создания файла записи. Возможные значения:</p>
<ul>
<li><p>succes</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>fileName</td>
<td>string</td>
<td>Имя файла</td>
<td>[1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "newRecBatch",</p>
<p>"description": "сообщение содержащее имя файла записи",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string",</p>
<p>"enum": [</p>
<p>"success",</p>
<p>"error"</p>
<p>]</p>
<p>},</p>
<p>"fileName": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result",</p>
<p>"fileName"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"newRecBatch",</p>
<p>"version": "1.0",</p>
<p>"data": {</p>
<p>"result": "success",</p>
<p>"fileName": "ABCDEFG"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## resultRestartScreenRecord

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p><em>resultRestartScreenRecord</em> - сообщение о результате исполнения запроса на начало записи экранов пользователя с учётом добавленного workitm</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события <em>restartScreenRecord</em></td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции изменения</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultRestartScreenRecord",</p>
<p>"description": "сообщение о результате исполнения запроса на начало записи экранов пользователя с учётом добавленного workitm",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultRestartScreenRecord",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## resultStartScreenRecord

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>resultStartScreenRecord - сообщение о результате исполнения запроса на начало записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события startSceenRecord</td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции изменения</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultStartScreenRecord",</p>
<p>"description": "сообщение о результате исполнения запроса на начало записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultStartScreenRecord",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## resultStartStream

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>resultStartStream</em>  - сообщение о результате исполнения запроса просмотра экрана оператора </p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события <em>startStream</em></td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции изменения</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultStartStream",</p>
<p>"description": "сообщение о результате исполнения запроса просмотра экрана оператора",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultStartStream",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## resultStopScreenRecord

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>resultStopScreenRecord - сообщение о результате исполнения запроса на остановку записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события stopSceenRecord</td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции изменения</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultStartScreenRecord",</p>
<p>"description": "сообщение о результате исполнения запроса на остановку записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultStopScreenRecord",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## resultStopStream

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>resultStopStream</em> - сообщение о результате исполнения запроса остановки просмотра экрана оператора </p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события <em>stopStream</em></td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции изменения</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultStopStream",</p>
<p>"description": "сообщение о результате исполнения запроса остановки просмотра экрана оператора",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultStopStream",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## streamBlob

Параметры сообщения

<table>
<colgroup>
<col style="width: 1%" />
<col style="width: 11%" />
<col style="width: 8%" />
<col style="width: 63%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em><u>streamBlob</u></em> - сообщение содержащее массив байт</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>payload</td>
<td>string</td>
<td>Массив байт</td>
<td>[1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "streamBlob",</p>
<p>"description": "сообщение содержащее поток информации",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"payload": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"payload"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action": "streamBlob",</p>
<p>"version": "1.0",</p>
<p>"data": {</p>
<p>"payload": "массив байт"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# Сообщения Web-Socket в сторону JsSDK

- [resultAgentOpenConnect](#resultagentopenconnect)

## resultAgentOpenConnect

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>resultAgentOpenConnect - результат обработки запроса на подключение агента записи экранов к AgentServer</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события agentOpenConnect</td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения запроса</p>
<p>Возможные значения:</p>
<ul>
<li><p>success - запрос принят</p></li>
<li><p>error - запрос не принят</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultAgentOpenConnect",</p>
<p>"description": "результат обработки запроса на подключение агента записи экранов к AgentServer",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultAgentOpenConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"

- [v1 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#v1-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

- [v2 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#v2-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

- [v3 R2.1.0 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#v3-r2.1.0-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

- [v4 R2.8.0 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#v4-r2.8.0-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

- [v5 R2.11 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"](#v5-r2.11-фича-core.agenthelper-подключение-агента-записи-экрана-оператора-при-старте-операторской-сессии)

## v1 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"

- [1. Описание фичи](#описание-фичи)

- [2. Описание процесса/сервиса TO BE](#описание-процессасервиса-to-be)

- [3. Описание запросов](#описание-запросов)

  - [web-socket сообщения](#web-socket-сообщения)

    - [getAgentHelperData (JsSDK-\>AgS)](#getagenthelperdata-jssdk-ags)

    - [resultGetAgentHelperData (AgS>JsSDK)](#resultgetagenthelperdata-agsjssdk)

    - [agentOpenConnect (JsSDK -\>AH)](#agentopenconnect-jssdk--ah)

    - [resultAgentOpetConnect (AH > JsSDK)](#resultagentopetconnect-ah-jssdk)

    - [agentHelperConnect (JsSDK-\>AgS)](#agenthelperconnect-jssdk-ags)

**ID фичи в JIRA**

[<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image6.svg" style="width:0.13889in;height:0.13889in" alt="Epic" /> SCPL-3494](https://jira.sberbank.ru/browse/SCPL-3494?src=confmacro) - Запись экранов **<span class="smallcaps"> done </span>**

### 1. Описание фичи

При старте операторской сессии необходимо инициировать процесс подключения агента записи экрана оператора для получения команд управления логикой записи

### 2. Описание процесса/сервиса TO BE

<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image7.png" style="width:5.90069in;height:3.33637in" />

<table>
<colgroup>
<col style="width: 3%" />
<col style="width: 62%" />
<col style="width: 34%" />
</colgroup>
<thead>
<tr class="header">
<th>№</th>
<th>Описание шага</th>
<th>Результат выполнения шага</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>JsSDK инициирует обращение к AgentHelper за информацией по подключению к агенту записи экранов</td>
<td>JsSDK направляет запрос <a href="#getagenthelperdata-jssdk-ags"><em>getAgentHelperData</em></a></td>
</tr>
<tr class="even">
<td>2</td>
<td>AgentServer обращается в Auth сервис за генерацией JWT-токена для подключения AgentHelper</td>
<td>Auth сервис генерит JWT-токен и передает его AgentServer'у</td>
</tr>
<tr class="odd">
<td>3</td>
<td>AgentServer отправляет в сторону JsSDK запрос на подключение агента записи</td>
<td><p>AgentServer передает <a href="#resultgetagenthelperdata-agsjssdk"><em>resultGetAgentHelperData</em></a> с параметрами подключения к AgentHelper, в котором передается</p>
<ul>
<li><p>URI AgentHelper, по которому должен JsSDK должен запрашивать подключение</p></li>
<li><p>URI AgentServer, по которому должен обращаться AgentHelper для установки соединения</p></li>
<li><p>JWT-токен</p></li>
</ul></td>
</tr>
<tr class="even">
<td>4</td>
<td>JsSDK инициирует обращение к AgentHelper по полученному в сообщении URI</td>
<td><p>Осуществляется попытка открыть незащищенное web-socket подключение</p>
<ul>
<li><p>если подключение неуспешное, то осуществляется переход на шаг 5</p></li>
<li><p>если подключение успешное, то осуществляется переход на шаг 6</p></li>
</ul></td>
</tr>
<tr class="odd">
<td>5</td>
<td>При неуспешной попытке подключения к AgentHelper JsSDK передает результат исполнения запроса в AgentServer</td>
<td>AgentServer получает ответ с неуспешным результатом обращения в AgentHelper <a href="#agenthelperconnect-jssdk-ags"><em>agentHelperConnect</em></a> </td>
</tr>
<tr class="even">
<td>6</td>
<td>После установления ws соединения JsSDK направляет сообщение с информацией о подключении к AgentServer</td>
<td><p>JsSDK передает ws сообщение <a href="#agentopenconnect-jssdk--ah"><em>agentOpenConnect</em></a> , в котором передает</p>
<ul>
<li><p>URI AgentServer, по которому должен обращаться AgentHelper для установки соединения</p></li>
<li><p>JWT-токен</p>
<p>из полученного от AgentServer сообщения (см шаг 3)</p></li>
</ul></td>
</tr>
<tr class="odd">
<td>7</td>
<td>AgentHelper пытается установить защищенное web-socket  подключение  к AgentServer  по полученному URI</td>
<td>AgentHelper инициирует подключение к AgentServer по указанному URI и передает полученный JWT токен</td>
</tr>
<tr class="even">
<td>8</td>
<td>AgentServer проверяет валидность полученного от AgentHelper токена</td>
<td></td>
</tr>
<tr class="odd">
<td>9</td>
<td><p>Если токен валидный, то между AgentHelper и AgentServer устанавливается защищенное web-socket подключение. AgentServer сохраняет параметры AgentHelper, который к нему подключился в связке с текущей операторской сессией</p>
<p>Если токен невалидный, то подключение к AgentServer не установлено</p></td>
<td></td>
</tr>
<tr class="even">
<td>10</td>
<td>JsSDK передает AgentServer результат подключения AgentHelper к AgentServer</td>
<td><p>AgentHelper передает в JsSDK сообщение  <a href="#resultagentopetconnect-ah-jssdk"><em>resultAgentOpenConnect</em></a></p>
<p>result = success в случае успешного подключения</p>
<p>result = error в случае неуспешного подключения</p></td>
</tr>
<tr class="odd">
<td>11</td>
<td>JsSDK передает в AgentServer сообщение <a href="#agenthelperconnect-jssdk-ags"><em>agentHelperConnect</em></a> о неуспешной попытке подключения AgentHelper к AgentServer</td>
<td><p>AgentServer</p>
<ul>
<li><p>Проверяет заданные правила по повторным попыткам подключения</p></li>
</ul></td>
</tr>
</tbody>
</table>

### 3. Описание запросов

#### web-socket сообщения

##### getAgentHelperData (JsSDK-\>AgS) 

Параметры сообщения

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>getAgentHelperData </em>- Запрос на передачу данных для подключения к агенту записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td>Ответный transaction на запрос данных </td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "getAgentHelperData",</p>
<p>"description": "Запрос на передачу данных для подключения к агенту записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"getAgentHelperData",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string"</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### resultGetAgentHelperData (AgS>JsSDK)

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 19%" />
<col style="width: 8%" />
<col style="width: 56%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p><em>resultGetAgenHelperData </em>- Передача данных для инициализации подключения к агенту записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction на запрос <em>getAgentHelperData</em></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td>Причина ошибки исполнения запроса. Заполняется только для result = error</td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>agentHelperURI</td>
<td>string</td>
<td><p>Адрес для подключения к AgentHelper </p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>agentServerURI</td>
<td>string</td>
<td><p>Адрес AgentServer, к которому должен запрашивать подключение агент записи экранов</p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td> screenServer</td>
<td>string</td>
<td><p>Адрес screenServer для отправки потока </p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>JWTToken</td>
<td>string</td>
<td><p>Аутентификационный токен</p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultGetAgenHelperData",</p>
<p>"description": "Передача данных для инициализации подключения к агенту записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"agentHelperURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"agentServerURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"screenServer": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"JWTToken": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultGetAgenHelperData",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"result":"success",</p>
<p>"agentHelperURI":"XXX",</p>
<p>"agentServerURI":"XXX",</p>
<p>"screenServer":"screenServer",</p>
<p>"JWTToken":"XXX"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### agentOpenConnect (JsSDK -\>AH)

Параметры сообщения

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 8%" />
<col style="width: 57%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentHelper</p>
<p><em>agentOpenConnect </em>- сообщение для подключения агента записи экранов к AgentServer</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>agentServerURI</td>
<td>string</td>
<td>Адрес AgentServer, к которому должен запрашивать подключение агент записи экранов</td>
<td>[1]</td>
</tr>
<tr class="even">
<td>JWTToken</td>
<td>string</td>
<td>Аутентификационный токен</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>userID</td>
<td>UUID</td>
<td>Идентификатор пользователя</td>
<td>[1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentOpenConnect",</p>
<p>"description": "результат подключения агента записи",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"agentServerURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"JWTToken": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"userID": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"agentServerURI",</p>
<p>"JWTToken",</p>
<p>"userID"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"agentHelperConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"agentServerURI":"XXX",</p>
<p>"JWTToken":"WWW",</p>
<p>"userID": "UUID"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### resultAgentOpetConnect (AH > JsSDK) 

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>resultAgentOpenConnect - результат обработки запроса на подключение агента записи экранов к AgentServer</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события agentOpenConnect</td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения запроса</p>
<p>Возможные значения:</p>
<ul>
<li><p>success - запрос принят</p></li>
<li><p>error - запрос не принят</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultAgentOpenConnect",</p>
<p>"description": "результат обработки запроса на подключение агента записи экранов к AgentServer",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultAgentOpenConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### agentHelperConnect (JsSDK-\>AgS)

Параметры сообщения

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>agentHelperConnect </em>- результат подключения агента записи</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td>Ответный transaction на запрос данных </td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>result</td>
<td>string</td>
<td><p>Результат исполнения запроса</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>resultDesc</td>
<td>string</td>
<td><p>Причина неуспешного подключения. Заполняется только для result = error</p>
<p>Возможные значения:</p>
<p>"AgentHelper not found" - не удалось подключиться к агенту записи</p>
<p>"connection failedf" - агент записи не смог установить подключение к AgentServer</p>
<p>"invalid token" - аутентификационный токен невалиден</p></td>
<td>[0...1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentHelperConnect",</p>
<p>"description": "результат подключения агента записи",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"agentHelperConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"result":"error",</p>
<p>"resultDesc":"invalid token"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## v2 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"

- [1. Описание фичи](#описание-фичи-1)

- [2. Описание процесса/сервиса TO BE](#описание-процессасервиса-to-be-1)

- [3. Описание запросов](#описание-запросов-1)

  - [web-socket сообщения](#web-socket-сообщения-1)

    - [getAgentHelperData (JsSDK-\>AgS)](#getagenthelperdata-jssdk-ags-1)

    - [resultGetAgentHelperData (AgS>JsSDK)](#resultgetagenthelperdata-agsjssdk-1)

    - [agentOpenConnect (JsSDK -\>AH)](#agentopenconnect-jssdk--ah-1)

    - [resultAgentOpenConnect (AH > JsSDK)](#resultagentopenconnect-ah-jssdk)

    - [agentHelperConnect (JsSDK-\>AgS)](#agenthelperconnect-jssdk-ags-1)

    - [agentHelperConnectionState (AgS > JsSDK)](#agenthelperconnectionstate-ags-jssdk)

**ID фичи в JIRA**

[<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image6.svg" style="width:0.13889in;height:0.13889in" alt="Epic" /> SCPL-3494](https://jira.sberbank.ru/browse/SCPL-3494?src=confmacro) - Запись экранов **<span class="smallcaps"> done </span>**

[<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image6.svg" style="width:0.13889in;height:0.13889in" alt="Epic" /> SCPL-6585](https://jira.sberbank.ru/browse/SCPL-6585?src=confmacro) - Q3 Развитие агента записи экранов **<span class="smallcaps"> done </span>**

### 1. Описание фичи

При старте операторской сессии необходимо инициировать процесс подключения агента записи экрана оператора для получения команд управления логикой записи

### 2. Описание процесса/сервиса TO BE

<img src="D:\scpl full proj\pandoc sandbox\output\media/media/image8.png" style="width:5.90069in;height:2.99446in" />

<table>
<colgroup>
<col style="width: 3%" />
<col style="width: 31%" />
<col style="width: 64%" />
</colgroup>
<thead>
<tr class="header">
<th>№</th>
<th>Описание шага</th>
<th>Результат выполнения шага</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>JsSDK инициирует обращение к AgentHelper за информацией по подключению к агенту записи экранов</td>
<td>JsSDK направляет запрос <a href="#getagenthelperdata-jssdk-ags-1"><em>getAgentHelperData</em></a></td>
</tr>
<tr class="even">
<td>2</td>
<td>AgentServer обращается в Auth сервис за генерацией JWT-токена для подключения AgentHelper</td>
<td>Auth сервис генерит JWT-токен и передает его AgentServer'у</td>
</tr>
<tr class="odd">
<td>3</td>
<td>AgentServer отправляет в сторону JsSDK запрос на подключение агента записи</td>
<td><p>AgentServer передает <a href="#resultgetagenthelperdata-agsjssdk-1"><em>resultGetAgentHelperData</em></a> с параметрами подключения к AgentHelper, в котором передается</p>
<ul>
<li><p>URI AgentHelper, по которому должен JsSDK должен запрашивать подключение</p></li>
<li><p>URI AgentServer, по которому должен обращаться AgentHelper для установки соединения</p></li>
<li><p>JWT-токен</p></li>
</ul></td>
</tr>
<tr class="even">
<td>4</td>
<td>JsSDK инициирует обращение к AgentHelper по полученному в сообщении URI</td>
<td><p>Осуществляется попытка открыть незащищенное web-socket подключение</p>
<ul>
<li><p>если подключение неуспешное, то осуществляется переход на шаг 5</p></li>
<li><p>если подключение успешное, то осуществляется переход на шаг 6</p>
<p>В сторону рабочего места отдается уведомление о статусе открытия ws подключения к AgentHelper</p></li>
</ul></td>
</tr>
<tr class="odd">
<td>5</td>
<td>При неуспешной попытке подключения к AgentHelper JsSDK передает результат исполнения запроса в AgentServer</td>
<td>AgentServer получает ответ с неуспешным результатом обращения в AgentHelper <a href="#agenthelperconnect-jssdk-ags-1"><em>agentHelperConnect</em></a> </td>
</tr>
<tr class="even">
<td>6</td>
<td>После установления ws соединения JsSDK направляет сообщение с информацией о подключении к AgentServer</td>
<td><p>JsSDK передает ws сообщение <a href="#agentopenconnect-jssdk--ah-1"><em>agentOpenConnect</em></a> , в котором передает</p>
<ul>
<li><p>URI AgentServer, по которому должен обращаться AgentHelper для установки соединения</p></li>
<li><p>JWT-токен</p>
<p>из полученного от AgentServer сообщения (см шаг 3)</p></li>
</ul></td>
</tr>
<tr class="odd">
<td>7</td>
<td>JsSDK передает AgentServer результат обработки запроса на подключение AgentHelper к AgentServer</td>
<td><p>AgentHelper передает в JsSDK сообщение  <a href="#scroll-bookmark-57"><em>resultAgentOpenConnect</em></a></p>
<ul>
<li><p>result = success - AgentHelper принял запрос на организацию подключения к AgentServer. Осуществляется переход на шаг 8</p></li>
<li><p>result = error - AgentHelper не смог принять в работу запрос на организацию подключения к AgentServer. Процесс завершен</p></li>
</ul></td>
</tr>
<tr class="even">
<td>8</td>
<td>AgentHelper пытается установить защищенное web-socket  подключение  к AgentServer  по полученному URI</td>
<td>AgentHelper инициирует подключение к AgentServer по указанному URI и передает полученный JWT токен</td>
</tr>
<tr class="odd">
<td>9</td>
<td>AgentServer проверяет валидность полученного от AgentHelper токена</td>
<td><ul>
<li><p>Если токен валидный, то осуществляется переход на шаг 10</p></li>
<li><p>Если токен невалидный , то AgentHelper приостанавливает попытки реконнекта и осуществляется переход на шаг 11</p></li>
</ul></td>
</tr>
<tr class="even">
<td>10</td>
<td>AgentHelper пытается установить устанавливается защищенное web-socket подключение с AgentServer</td>
<td><ul>
<li><p>Если соединение установлено, то AgentServer сохраняет параметры AgentHelper, который к нему подключился в связке с текущей операторской сессией. Осуществляется переход на шаг 11</p></li>
<li><p>Если соединение не установлено, то осуществляется повторная попытка через заданное время. Период повторных попыток подключения получен AgentHelper'ом в сообщении <em><a href="#getagenthelperdata-jssdk-ags-1">getAgentHelperData</a> </em>на шаге 1. </p></li>
</ul></td>
</tr>
<tr class="odd">
<td>11</td>
<td>AgentServer передает в JsSDK информацию об актуальном состоянии подключение агента записи экраном </td>
<td><p>AgentServer передает в JsSDKсообщение <a href="#agenthelperconnectionstate-ags-jssdk"><em><strong>agentHelperConnectionState</strong></em></a></p>
<ul>
<li><p>connectionState = active - AgentHelper подключен</p></li>
<li><p>connectionState = inactive - AgentHelper не подключен</p>
<ul>
<li><p>при деактивации подключения AgentServer в errorDesc передает ошибку  (по возможности реализовать передачу ошибки из-за разрыва wed-socket подключения (<strong>connectionLost</strong>) и из-за невалидного токена (<strong>tokenInvalid</strong>)</p>
<p><img src="D:\scpl full proj\pandoc sandbox\output\media/media/image10.svg" style="width:0.1667in;height:0.1667in" alt="(предупреждение)" /> AgentServer уведомляет JsSDK каждый раз при изменении состояния подключения</p></li>
</ul></li>
</ul></td>
</tr>
</tbody>
</table>

### 3. Описание запросов

#### web-socket сообщения

##### getAgentHelperData (JsSDK-\>AgS) 

getAgentHelperData

Параметры сообщения

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>getAgentHelperData </em>- Запрос на передачу данных для подключения к агенту записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td>Ответный transaction на запрос данных </td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "getAgentHelperData",</p>
<p>"description": "Запрос на передачу данных для подключения к агенту записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"getAgentHelperData",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string"</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### resultGetAgentHelperData (AgS>JsSDK)

resultGetAgentHelperData

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 19%" />
<col style="width: 8%" />
<col style="width: 56%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p><em>resultGetAgentHelperData </em>- Передача данных для инициализации подключения к агенту записи экранов пользователя</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction на запрос <em>getAgentHelperData</em></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения операции</p>
<p>Возможные значения:</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td>Причина ошибки исполнения запроса. Заполняется только для result = error</td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>agentHelperURI</td>
<td>string</td>
<td><p>Адрес для подключения к AgentHelper </p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>agentServerURI</td>
<td>string</td>
<td><p>Адрес AgentServer, к которому должен запрашивать подключение агент записи экранов</p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td> screenServer</td>
<td>string</td>
<td><p>Адрес screenServer для отправки потока </p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td></td>
<td>JWTToken</td>
<td>string</td>
<td><p>Аутентификационный токен</p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
<tr class="odd">
<td></td>
<td>retryDelay</td>
<td>string</td>
<td><p>Период повторения попытки установления подключения к AgentServer</p>
<p>Обязательно для result = success</p></td>
<td>[0...1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultGetAgentHelperData",</p>
<p>"description": "Передача данных для инициализации подключения к агенту записи экранов пользователя",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"agentHelperURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"agentServerURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"screenServer": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"JWTToken": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"retryDelay":{</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultGetAgentHelperData",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"result":"success",</p>
<p>"agentHelperURI":"XXX",</p>
<p>"agentServerURI":"XXX",</p>
<p>"screenServer":"screenServer",</p>
<p>"JWTToken":"XXX",</p>
<p>"retryDelay": "1"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### agentOpenConnect (JsSDK -\>AH)

agentOpenConnect

Параметры сообщения

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 8%" />
<col style="width: 57%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentHelper</p>
<p><em>agentOpenConnect </em>- сообщение для подключения агента записи экранов к AgentServer</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td></td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>agentServerURI</td>
<td>string</td>
<td>Адрес AgentServer, к которому должен запрашивать подключение агент записи экранов</td>
<td>[1]</td>
</tr>
<tr class="even">
<td>JWTToken</td>
<td>string</td>
<td>Аутентификационный токен</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>userID</td>
<td>UUID</td>
<td>Идентификатор пользователя</td>
<td>[1]</td>
</tr>
<tr class="even">
<td>retryDelay</td>
<td>string</td>
<td>Период повторения попытки установления подключения к AgentServer</td>
<td>[1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentOpenConnect",</p>
<p>"description": "результат подключения агента записи",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"agentServerURI": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"JWTToken": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"userID": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"retryDelay": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"agentServerURI",</p>
<p>"JWTToken",</p>
<p>"userID",</p>
<p>"retryDelay"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"agentHelperConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"agentServerURI":"XXX",</p>
<p>"JWTToken":"WWW",</p>
<p>"userID": "UUID",</p>
<p>"retryDelay":"1"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### resultAgentOpenConnect (AH > JsSDK) 

resultAgentOpenConnect

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 13%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>resultAgentOpenConnect - результат обработки запроса на подключение агента записи экранов к AgentServer</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td>Ответный transaction при обработке события agentOpenConnect</td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>result</td>
<td>string</td>
<td><p>Результат выполнения запроса</p>
<p>Возможные значения:</p>
<ul>
<li><p>success - запрос принят</p></li>
<li><p>error - запрос не принят</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>Причина ошибки исполнения запроса</p>
<p>Заполняется только для result = error</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "resultAgentOpenConnect",</p>
<p>"description": "результат обработки запроса на подключение агента записи экранов к AgentServer",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"transaction",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"resultAgentOpenConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"result":"error",</p>
<p>"resultDesc":"xxx"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### agentHelperConnect (JsSDK-\>AgS)

agentHelperConnect

Параметры сообщения

<table>
<colgroup>
<col style="width: 14%" />
<col style="width: 8%" />
<col style="width: 62%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th>Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.AgentServer</p>
<p><em>agentHelperConnect </em>- результат подключения агента записи</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>transaction</td>
<td>string</td>
<td>Ответный transaction на запрос данных </td>
<td>[0...1]</td>
</tr>
<tr class="even">
<td>data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td>result</td>
<td>string</td>
<td><p>Результат исполнения запроса</p>
<ul>
<li><p>success</p></li>
<li><p>error</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="even">
<td>resultDesc</td>
<td>string</td>
<td><p>Причина неуспешного подключения. Заполняется только для result = error</p>
<p>Возможные значения:</p>
<p>"AgentHelper not found" - не удалось подключиться к агенту записи</p>
<p>"connection failedf" - агент записи не смог установить подключение к AgentServer</p>
<p>"invalid token" - аутентификационный токен невалиден</p></td>
<td>[0...1]</td>
</tr>
</tbody>
</table>

Json-схема сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentHelperConnect",</p>
<p>"description": "результат подключения агента записи",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"result": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"result"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"agentHelperConnect",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data":{</p>
<p>"result":"error",</p>
<p>"resultDesc":"invalid token"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

##### agentHelperConnectionState (AgS > JsSDK)

agentHelperConnectionState

Параметры сообщения

<table>
<colgroup>
<col style="width: 0%" />
<col style="width: 20%" />
<col style="width: 8%" />
<col style="width: 55%" />
<col style="width: 15%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="2">Элемент</th>
<th>Тип</th>
<th>Описание</th>
<th>Кратность</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td colspan="2">action</td>
<td>string</td>
<td><p>Название сообщения в сторону Core.JsSDK</p>
<p>agentHelperConnectionState - состояние подключения агента записи экрана в рамках сессии текущего оператора</p></td>
<td>[1]</td>
</tr>
<tr class="even">
<td colspan="2">version</td>
<td>string</td>
<td>Версия API. По умолчанию 1.0</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td colspan="2">transaction</td>
<td>string</td>
<td></td>
<td>[0..1]</td>
</tr>
<tr class="even">
<td colspan="2">data</td>
<td>object</td>
<td>Тело сообщения</td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>userID</td>
<td>string</td>
<td>Идентификатор пользователя</td>
<td>[1]</td>
</tr>
<tr class="even">
<td></td>
<td>connectionState</td>
<td>string</td>
<td><p>Текущее состояние подключения к агенту записи экранов</p>
<p>Возможные значения:</p>
<ul>
<li><p>active</p></li>
<li><p>inactive</p></li>
</ul></td>
<td>[1]</td>
</tr>
<tr class="odd">
<td></td>
<td>resultDesc</td>
<td>string</td>
<td><p>описание ошибки</p>
<p>только при connectionState=inactive</p></td>
<td>[0..1]</td>
</tr>
</tbody>
</table>

JSON-схема

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"$schema": "http://json-schema.org/draft-04/schema#",</p>
<p>"title": "agentHelperConnectionState",</p>
<p>"description": "состояние подключения агента записи экрана в рамках сессии текущего оператора",</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"action": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"version": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"transaction": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"data": {</p>
<p>"type": "object",</p>
<p>"properties": {</p>
<p>"userID": {</p>
<p>"type": "string"</p>
<p>},</p>
<p>"connectionState": {</p>
<p>"type": "string",</p>
<p>"enum":[</p>
<p>"active",</p>
<p>"inactive"</p>
<p>]</p>
<p>},</p>
<p>"resultDesc": {</p>
<p>"type": "string"</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"userID",</p>
<p>"connectionState"</p>
<p>]</p>
<p>}</p>
<p>},</p>
<p>"required": [</p>
<p>"action",</p>
<p>"version",</p>
<p>"data"</p>
<p>]</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

Пример сообщения

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th><blockquote>
<p>{</p>
<p>"action":"agentHelperConnectionState",</p>
<p>"version": "1.0",</p>
<p>"transaction": "string",</p>
<p>"data": {</p>
<p>"userID":"UUID",</p>
<p>"connectionState":"active"</p>
<p>}</p>
<p>}</p>
</blockquote></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## v3 R2.1.0 Фича Core.AgentHelper "Подключение агента записи экрана оператора при старте операторской сессии"

- [1. Описание фичи](#описание-фичи-2)

- [2. Описание процесса/сервиса TO BE](#описание-процессасервиса-to-be-2)

- [3. Описание запросов](#описание-запросов-2)

  - [web-socket сообщения](#web-socket-сообщения-2)

    - [getAgentHelperData (JsSDK-\>AgS)](#getagenthelperdata-jssdk-ags-2)

    - [resultGetAgentHelperData (AgS>JsSDK)](#resultgetagenthelperdata-agsjssdk-2)

    - [agentOpenConnect (JsSDK -\>AH)](#agentopenconnect-jssdk--ah-2)

    - [resultAgentOpenConnect (AH > JsSDK)](#resultagentopenconnect-ah-jssdk-1)

    - [agentHelperConnect (JsSDK-\>AgS)](#agenthelperconnect-jssdk-ags-2)

    - [agentHelperConnectionState (AgS > JsSDK)](#agenthelperconnectionstate-ags-jssdk-1)

    - [agentHelperInfo (AH > AgS)](#agenthelperinfo-ah-ags)

  - [REST-запросы](#rest-запросы)

    - [/private/v1.0/users/{id}](#privatev1.0usersid)

