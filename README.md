# gas-finex-nav
Finex updates NAV for its own ETFs on the site using a non-public API. This Google Apps script provides functions for working with NAV from Finex.

Скрипт написан для собственных нужд, потому что надоело искать и обновлять оценку стоимости акций `замороженных` фондов Finex.  

Надеюсь, скрипт пригодится кому-нибудь ещё.  


## Установка
* Создать или открыть документ Google Spreadsheets http://drive.google.com
* В меню `Tools` выбрать `Script Editor`
* Дать проекту имя, например `FinexNAV`
* Скопировать код из [Code.gs](https://raw.githubusercontent.com/GrKoR/gas-finex-nav/master/Finex-API.gs) и заменить им дефолтный текст скрипта вашей таблицы.
* Сохранить скрипт

На этом всё.   

## Обновления формул из меню
По умолчанию таблицы Google очень редко обновляют значения формул, делающих запросы на внешние ресурсы. Если хочется в главном меню таблицы получить меню, с помощью которого можно будет принудительно обновлять данные котировок, то выполните написанное ниже.  

### Добавление меню
В скрипт нужно добавить код, создающий меню.  
Откройте скрипт вашей таблицы (меню `Tools` -> `Script Editor`). В начало файла вставьте следующий код:  
```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Finex')
      .addItem('Обновить котировки', 'refresh')
      .addToUi();
}

function refresh() {
  var updateDateRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('UPDATE_DATE').getCell(1, 1);
  if (updateDateRange != null) {
    updateDateRange.setValue(new Date());
  } else {
    SpreadsheetApp.getUi().ui.alert('You should specify the named range "UPDATE_DATE" for using this function.');
  }
}
```
Сохраните скрипт. Вкладку с кодом можно закрывать.  

Закройте таблицу и откройте заново. Это нужно, чтобы в главном меню отобразился пункт `Finex`.

### Изменение формул
В документе Google Spreadsheets выберите любую ненужную ячейку и присвоить ей имя `UPDATE_DATE` с помощью меню `Data`->`Named ranges`->`Add named range`. В эту ячейку по команде меню `Finex`->`Обновить котировки` будет вставляется текущая дата. Данная ячейка может использоваться в качестве необязательного параметра `dummy` любой функции для [принудительного обновления формул](https://stackoverflow.com/a/27656313).  

Чтобы по команде из меню формулы `FINEX_xxx()` пересчитывались, нужно в каждую такую формулу добавить последним значением ссылку на созданный именованный диапазон.  
Например, в ячейке A1 была формула:  
```
= FINEX_getNAVValueByTicker("FXUS")
```
Её следует изменить так:  
```
= FINEX_getNAVValueByTicker("FXUS"; UPDATE_DATE)
```


## Возможности
Теперь при работе с этим документом на всех листах будут доступны функции: 
* `FINEX_getNAVValueByTicker()`
* `FINEX_getNAVDateByTicker()`
* `FINEX_getNAVCurrencyByTicker()`

**Особенности:** Во все функции последним параметром можно передавать случайное число, дату или ссылку на именованый диапазон `UPDATE_DATE`. Этот параметр нигде в коде не используется, но позволяет принудительно пересчитать функции.  
Если используете именованый диапазон `UPDATE_DATE`, то не забудьте его создать как описано выше.

### FINEX_getNAVValueByTicker()
Получение значения NAV фонда по тикеру.  

Параметры:
* `ticker` - тикер инструмента.
* `dummy` - не обязательный параметр для принудительного апдейта формулы.

Возвращаемое значение: число, последнее значение NAV фонда.

Примеры:
```
= FINEX_getNAVValueByTicker("FXUS")
= FINEX_getNAVValueByTicker("FXUS", random())
= FINEX_getNAVValueByTicker("FXUS", A1)
= FINEX_getNAVValueByTicker("FXUS", UPDATE_DATE)
```

### FINEX_getNAVDateByTicker()
Получение даты NAV фонда по тикеру.  

Параметры:
* `ticker` - тикер инструмента.
* `dummy` - не обязательный параметр для принудительного апдейта формулы.

Возвращаемое значение: дата последнего значения NAV фонда.

Примеры:
```
= FINEX_getNAVDateByTicker("FXUS")
= FINEX_getNAVDateByTicker("FXUS", random())
= FINEX_getNAVDateByTicker("FXUS", A1)
= FINEX_getNAVDateByTicker("FXUS", UPDATE_DATE)
```

### FINEX_getNAVCurrencyByTicker()
Получение даты NAV фонда по тикеру.  

Параметры:
* `ticker` - тикер инструмента.
* `dummy` - не обязательный параметр для принудительного апдейта формулы.

Возвращаемое значение: строка, валюта возвращаемого значения NAV фонда. Пока может быть одной из следующих: `USD`, `RUB`, `EUR`, `KZT`. 

Примеры:
```
= FINEX_getNAVCurrencyByTicker("FXUS")
= FINEX_getNAVCurrencyByTicker("FXUS", random())
= FINEX_getNAVCurrencyByTicker("FXUS", A1)
= FINEX_getNAVCurrencyByTicker("FXUS", UPDATE_DATE)
```


## Для любопытных

### Ссылки
API url: https://api.finex-etf.ru/v1/fonds/  
Документация: https://app.swaggerhub.com/apis-docs/wizard/Fonds/1.0.0  

### Разрешения
Finex разрешили использовать API "разумно", а также распроспространять их.  

Ссылка на сообщение Владимира Крейнделя в Telegram: https://t.me/c/1345818950/37242  

![GAS Finex API permissions image](https://raw.githubusercontent.com/GrKoR/gas-finex-nav/master/images/permissions.png "GAS Finex API permissions image")