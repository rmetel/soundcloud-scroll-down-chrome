// Copyright (c) 2017, Ralph Metel. All rights reserved.

var ago = $('#ago'),
    languagesDropDown = $('#languages'),
    periodsDropDown = $('#periods'),
    dropdownDays = $('#dropdownDays'),
    goTo = $('#goTo'),
    goToDate = $('#goToDate'),
    headline = $('#headline'),
    version = $('#version'),
    isRunning = false,
    languageSupport = {
        'eng': 'English',
        'ger': 'Deutsch',
        'rus': 'Русский',
        'tur': 'Türkçe'
    },
    selectedLanguage = 'eng',
    selectedPeriod = 'd',
    selectedDate = 1,
    submitButton = $('#submitButton'),
    tab,
    texts = {
        'ago': {
            'eng': 'ago',
            'rus': 'назад',
            'tur': 'önceki'
        },
        'cancel': {
            'eng': 'Сancel',
            'ger': 'Abbrechen',
            'rus': 'Отменить',
            'tur': 'Iptal'
        },
        'day': {
            'eng': {'default': 'day', 'optional': 'day'},
            'ger': {'default': 'Tag', 'optional': 'Tag'},
            'rus': {'default': 'день', 'optional': 'дня'},
            'tur': {'default': 'gün', 'optional': 'gün'}
        },
        'days': {
            'eng': {'default': 'days', 'optional': 'days'},
            'ger': {'default': 'Tage', 'optional': 'Tagen'},
            'rus': {'default': 'дни', 'optional': 'дней'},
            'tur': {'default': 'gün', 'optional': 'gün'}
        },
        'goto': {
            'eng': 'Find posts ',
            'ger': 'Finde Posts vor ',
            'rus': 'Найти посты ',
            'tur': 'şarkıları bul '
        },
        "month" : {
            "eng": {'default': 'month', 'optional': 'month'},
            "ger": {'default': 'Monat', 'optional': 'Monat'},
            "rus": {'default': 'месяц', 'optional': 'месяца'},
            "tur": {'default': 'ay', 'optional': 'ay'}
        },
        "months" : {
            "eng": {'default': 'months', 'optional': 'months'},
            "ger": {'default': 'Monate', 'optional': 'Monaten'},
            "rus": {'default': 'месяцы', 'optional': 'месяцев'},
            "tur": {'default': 'ay', 'optional': 'ay'}
        },
        'search': {
            'eng': 'Search',
            'ger': 'Suchen',
            'rus': 'Найти',
            'tur': 'Ara'
        },
        "week" : {
            "eng": "week",
            "ger": "Woche",
            "rus": "неделя",
            "tur": "hafta"
        },
        "weeks" : {
            "eng": "weeks",
            "ger": "Wochen",
            "rus": "недели",
            "tur": "hafta"
        }
    },
    url;

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url, tab.id);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Get data from chrome storage
 *
 * @param {param(string)} name of data saved in storage
 * @param {function(string)} callback called after data has been retrieved
 */
function getStorage(param, callback) {
  chrome.storage.sync.get(param, (items) => {
    callback(chrome.runtime.lastError ? null : items[param]);
  });
}

/**
 * Sets all texts in selected language
 */
function changeTexts(language) {
    var dayNumber = parseInt(dropdownDays.val().split("_")[0]),
        dayText = " ",
        agoText = " " + texts.ago[language],
        period = selectedPeriod == 'd' ? 'day' : 'month';

    if(dayNumber > 1) {
        period += 's';
    }

    switch(language){
        case "ger":
            if(dayNumber == 1)
                dayText += texts[period][language]['default'];
            else
                dayText += texts[period][language]['optional'];
            agoText = "";
            break;
        case "rus":
            if(dayNumber == 1) {
                dayText += texts[period][language]['default'];
            } else if(dayNumber == 2 || dayNumber == 3 || dayNumber == 4 || dayNumber == 22 || dayNumber == 23 || dayNumber == 24) {
                period = period.substr(0, period.length - 1);
                dayText += texts[period][language]['optional'];
            } else {
                dayText += texts[period][language]['optional'];
            }
            break;
        default:
            if(dayNumber == 1)
                dayText += texts[period][language]['default'];
            else
                dayText += texts[period][language]['default'];
            break;
    }

    if(language == 'tur') {
      goTo.html(dayNumber + dayText);
      goToDate.html(agoText);
      ago.html(texts.goto[language]);
    } else {
      goTo.html(texts.goto[language]);
      goToDate.html(dayNumber + dayText);
      ago.html(agoText);
    }

    submitButton.html(texts.search[language]);
}

/**
 * Fills language dropdown with possible languages
 */
function fillLanguages() {
    languagesDropDown.html('');
    var i = 0;
    for(key in languageSupport){
        languagesDropDown.append("<option value='" + key + "'" + ((i == 0) ? " selected" : "") + ">" + languageSupport[key] + "</option>");
        i++;
    }
}

/**
 * Fills dropdown with period types
 */
function fillPeriods(language) {
    periodsDropDown.html('');
    periodsDropDown.append("<option value='d' selected>" + texts.days[language]['default'] + "</option>");
    periodsDropDown.append("<option value='m'>" + texts.months[language]['default'] + "</option>");
}

/**
 * Fills dropdown with days
 */
function fillDropdownDays(language) {
    var day = texts.day[language]['default'],
        option,
        period = selectedPeriod == 'd' ? 30 : 12;

    dropdownDays.html('');
    for(i = 1; i <= period; i++){
        option = $('<option/>', {'value': i, 'text': i});
        if(i == 1) option.attr('selected', '');
        dropdownDays.append(option);
    }
}

/**
 * Calculates date in the past
 *
 * @param {date(string)} value from dropdown
 */
function calcDate(date){
    var now = new Date(),
        ms,
        pair = date.split("_"),
        period = pair[1],
        value = pair[0],
        past;

    switch(period){
        case "d":
            ms = now.setHours(now.getHours() - (value * 24));
            break;
        case "w":
            ms = now.setHours(now.getHours() - (value * 24 * 7));
            break;
        case "m":
            ms = now.setMonth(now.getMonth() - value);
            break;
        default:
            ms = now.getMilliseconds();
            break;

    }

    past = new Date(ms).toISOString();

    return past;
};

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl((url, tabId) => {
        // Initialize drop down boxes
        init(tabId);

        // Submit button listener
        submitButton.on('click', (e) => {
            e.preventDefault();
            var desiredDate = calcDate(dropdownDays.val() + "_" + periodsDropDown.val());
            if(url.indexOf("soundcloud.com/feed") > -1){
                chrome.storage.sync.set({desiredDate: desiredDate}, () => {
                    if(!isRunning) {
                        chrome.tabs.sendMessage(tab.id, {'message': 'start'});
                    } else {
                        chrome.tabs.sendMessage(tab.id, {'message': 'stop'});
                    }
                });
            }
        });

        // Language dropdown listener
        languagesDropDown.on('change', (e) => {{}
            selectedLanguage = e.target.value;
            chrome.storage.sync.set({language: selectedLanguage}, () => {
                fillPeriods(selectedLanguage);
                periodsDropDown.val(selectedPeriod);
                fillDropdownDays(selectedLanguage);
                dropdownDays.val(selectedDate);
                changeTexts(selectedLanguage);
            });
        });

        // Date dropdown listener
        periodsDropDown.on('change', (e) => {{}
            selectedPeriod = e.target.value;
            chrome.storage.sync.set({period: selectedPeriod}, () => {});
            fillDropdownDays(selectedLanguage);
            changeTexts(selectedLanguage);
        });

        // Date dropdown listener
        dropdownDays.on('change', (e) => {{}
            selectedDate = e.target.value;
            chrome.storage.sync.set({date: selectedDate}, () => {});
            changeTexts(selectedLanguage);
        });
    });
});

/**
 * Gets language and date from local storage on load
 */
function init(tabId) {
    fillLanguages();

    getStorage('language', (language) => {
        if(language)
            selectedLanguage = language;

        languagesDropDown.val(selectedLanguage);

        getStorage('period', (period) => {
            if(period)
                selectedPeriod = period;

            fillPeriods(selectedLanguage);
            periodsDropDown.val(selectedPeriod);

            getStorage('date', (date) => {
                fillDropdownDays(selectedLanguage);
                if(date) {
                    selectedDate = date;
                    dropdownDays.val(selectedDate);
                }
                changeTexts(selectedLanguage);
            });
        });
    });

    version.text(chrome.runtime.getManifest().version);

    periodsDropDown.focus();

    chrome.scripting.executeScript({
      target: {tabId: tabId},
      files: ['soundcloud-scroll-down.js']
    });
}

chrome.runtime.onMessage.addListener(function(payload, sender, sendResponse) {
    if(payload.message == "update") {
        submitButton.text(payload.running ? texts.cancel[selectedLanguage] : texts.search[selectedLanguage]);
        isRunning = payload.running;
    }
});