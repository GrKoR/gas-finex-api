/** @OnlyCurrentDoc */

const FINEX_CACHE = CacheService.getScriptCache();
const FINEX_CACHE_MAX_AGE = 6*60*60; // 6 Hours

/**
 * API: https://api.finex-etf.ru/v1/
 * NAV path: https://api.finex-etf.ru/v1/fonds/nav 
 */
class FinexAPI {
  constructor() {
    this.baseUrl = 'https://api.finex-etf.ru/v1/';
  }

  _makeApiCall(methodUrl) {
    const url = this.baseUrl + methodUrl;
    Logger.log(`[Finex API Call] ${url}`);
    const params = {'escaping': false, 'headers': {'accept': 'application/json'}};
    const response = UrlFetchApp.fetch(url, params);
    if (response.getResponseCode() == 200) return JSON.parse(response.getContentText());
  }

  _getDataFromCache(key) {
    const cached = FINEX_CACHE.get(key);
    if (cached === null) {
      Logger.log(`[Finex Cache] No ${key} in cache.`);
      return null;
    }
    Logger.log(`[Finex Cache] ${key} loaded from cache.`);
    return JSON.parse(cached);
  }

  _saveDataToCache(key, data) {
    Logger.log(`[Finex Cache] ${key} saved to cache.`);
    FINEX_CACHE.put(key, JSON.stringify(data), FINEX_CACHE_MAX_AGE);
  }

  _getETFInfoFromCacheByTicker(ticker) {
    const postfix = '_info';
    var cache_key = ticker + postfix;
    return this._getDataFromCache(cache_key);
  }

  _saveETFInfoToCacheByTicker(ticker, data) {
    const postfix = '_info';
    var cache_key = ticker + postfix;
    this._saveDataToCache(cache_key, data);
  }

  _getETFNavFromCache() {
    var cache_key = 'FINEX_NAV';
    return this._getDataFromCache(cache_key);
  }

  _saveETFNavToCache(data) {
    const cache_key = 'FINEX_NAV';
    this._saveDataToCache(cache_key, data);
  }

  /**
   * Возвращает данные по конкретному тикеру ETF Finex.
   * Если ЕТФ отсутствует, то вернёт null.
   * 
   * Формат объекта ЕТФ:
   *  {"ticker":"FXUS","isin":"IE00BD3QHZ91","start_date":"2013-10-14","closure_date":null,"name":"Акции / США",
   *    "country":["США"],"class_active":"Акции","currency_fond":"USD",
   *    "yields":[
   *        {"value":0.00612709,"period":"1d","currency":"RUB"},
   *        {"value":0.0030668,"period":"1d","currency":"USD"},
   *        {"value":0.02162289,"period":"1m","currency":"RUB"},
   *        {"value":0.06052982,"period":"1m","currency":"USD"},
   *        {"value":0.11630641,"period":"6m","currency":"RUB"},
   *        {"value":-0.01292729,"period":"6m","currency":"USD"},
   *        {"value":-0.19801041,"period":"1y","currency":"RUB"},
   *        {"value":-0.08685853,"period":"1y","currency":"USD"},
   *        {"value":0.38257011,"period":"3y","currency":"RUB"},
   *        {"value":0.25281583,"period":"3y","currency":"USD"},
   *        {"value":0.80613263,"period":"5y","currency":"RUB"},
   *        {"value":0.45425857,"period":"5y","currency":"USD"},
   *        {"value":0.04799463,"period":"td","currency":"RUB"},
   *        {"value":0.06311363,"period":"td","currency":"USD"},
   *        {"value":4.2471827,"period":"max","currency":"RUB"},
   *        {"value":1.43778333,"period":"max","currency":"USD"}
   *    ],
   *    "icon_svg":"https://cdn.finex-etf.ru/fonds/fxus.svg",
   *    "original_name":"FinEx USA UCITS ETF","index":"SUSLMCN",
   *    "currency_trading":["RUB","USD"],
   *    "price":60.730000000000004,"is_active":true,"is_holiday":false
   *  }
   */
  getETFByTicker(ticker, ignoreCache = false) {
    const cached = this._getETFInfoFromCacheByTicker(ticker);
    if (cached != null && !ignoreCache) {
      return cached;
    }

    const url = `fonds/?ticker=${ticker}`;
    var data = this._makeApiCall(url);
    if (data.length == 0) data = null;
    data = data[0];
    this._saveETFInfoToCacheByTicker(ticker, data);
    return data;
  }

  /**
   * Возвращает данные по всем ЕТФ, подходящим по условию.
   * 
   * @param {string} isActive - Фильтрация по активности фондов.
   *                            Одно из значений:
   *                                null (вывод всех ЕТФ),
   *                                true (вывод только активных ЕТФ),
   *                                false (вывод уже закрытых ЕТФ).
   * @return {Array}          - Массив с данными о ЕТФ. Формат данных см. в комментарии к методу getETFByTicker().
   *                            Если ЕТФ отсутствуют, то вернёт пустой массив.
   * @customfunction
   */
  getAllETFs(isActive = null) {
    // TODO: не придумал, как загружать из кеша все ETF, если они у нас там по отдельности лежат...
    if (typeof isActive == 'boolean') {
      isActive = ((isActive) ? 'true' : 'false');
    } else {
      isActive = 'unknown';
    }
    const url = `fonds/?is_active=${isActive}`;
    const data = this._makeApiCall(url);
    return data;
  }

  /**
   * Возвращает объект, атрибуты которого - фонды ЕТФ. Типа такого:
   * {
   *     "FXBC": {
   *         "ticker": "FXBC",
   *         "currency": "USD",
   *         "value": 0.388359,
   *         "date": "2023-01-27"
   *     },
   *     "FXEM": {
   *         "ticker": "FXEM",
   *         "currency": "USD",
   *         "value": 0.890717,
   *         "date": "2023-01-27"
   *     },
   * }
   */
  getNAVs(ignoreCache = false) {
    const cached = this._getETFNavFromCache();
    if (cached != null && !ignoreCache) {
      return cached;
    }

    const url = 'fonds/nav';
    const data = this._makeApiCall(url);
    this._saveETFNavToCache(data);
    return data;
  }

  /**
   * Возвращает NAV заданного тикером фонда.
   * Объект такого формата:
   * {
   *    "ticker": "FXEM",
   *    "currency": "USD",
   *    "value": 0.890717,
   *    "date": "2023-01-27"
   * }
   */
  getNAVByTicker(ticker, ignoreCache = false) {
    const data = this.getNAVs(ignoreCache);
    if (data.hasOwnProperty(ticker)) return data[ticker];
    return null;
  }

}

const finexClient = new FinexAPI();

/**
 * Получение значения NAV фонда по тикеру
 * 
 * @param {"FXUS"} ticker Тикер инструмента
 * @return {}             значение NAV
 * @customfunction
 */
function FINEX_getNAVValueByTicker(ticker, dummy) {
  // dummy attribute uses for auto-refreshing the value each time the sheet is updating.
  // see https://stackoverflow.com/a/27656313
  var nav = finexClient.getNAVByTicker(ticker);
  if (nav === null) return null;
  return nav.value;
}

/**
 * Получение даты NAV фонда по тикеру
 * 
 * @param {"FXUS"} ticker Тикер инструмента
 * @return {}             дата NAV
 * @customfunction
 */
function FINEX_getNAVDateByTicker(ticker, dummy) {
  // dummy attribute uses for auto-refreshing the value each time the sheet is updating.
  // see https://stackoverflow.com/a/27656313
  var nav = finexClient.getNAVByTicker(ticker);
  if (nav === null) return null;
  return isoToDate(nav.date);
}

/**
 * Получение валюты NAV фонда по тикеру
 * 
 * @param {"FXUS"} ticker Тикер инструмента
 * @return {}             валюта NAV
 * @customfunction
 */
function FINEX_getNAVCurrencyByTicker(ticker, dummy) {
  // dummy attribute uses for auto-refreshing the value each time the sheet is updating.
  // see https://stackoverflow.com/a/27656313
  var nav = finexClient.getNAVByTicker(ticker);
  if (nav === null) return null;
  return nav.currency;
}

function test(){
  const ignoreCache = false;
  //FINEX_CACHE.remove("FINEX_NAV");
  //var data = finexClient.getNAVs(ignoreCache);
  //Logger.log(data);
  var data = finexClient.getETFByTicker("FXRB", ignoreCache);
  Logger.log(data);
}
