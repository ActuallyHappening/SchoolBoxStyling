"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
// Replaced by macro.py
const PROD = true;
const knownKeys = [
    "topBar",
    // "topBarIcons",
    "leftBar",
    "timetableHeaders",
    "background",
    // "sectionHeaders",
];
// TODO: Populate default values for known keys
const _knownDefaults = {
    topBar: {
        querySelector: "nav.tab-bar",
        attribute1: "style",
        attribute2: "background",
        // assignedValue:
        //   document.querySelector("nav.tab-bar")?.style.backgroundColor,
    },
    leftBar: {
        querySelector: "aside#left-menu",
        attribute1: "style",
        attribute2: "background",
        // assignedValue:
        //   document.querySelector("aside#left-menu")?.style.backgroundColor,
    },
    timetableHeaders: {
        querySelector: "table.timetable[data-timetable]>thead>tr>th",
        attribute1: "style",
        attribute2: "background",
        // assignedValue: document.querySelector(
        //   "table.timetable[data-timetable]>thead>tr>th"
        // )?.style.backgroundColor,
    },
    background: {
        querySelector: "body",
        attribute1: "style",
        attribute2: "background",
        // assignedValue:
        //   document.querySelector("body")?.style.backgroundColor ??
        //   "rgb(237, 237, 237)",
    },
};
/**
 * Default memory units, loaded with actual values from DOM.
 */
const knownDefaults = {};
for (const _key of Object.keys(_knownDefaults)) {
    const key = _key;
    const _none = "NOT FOUND ON DOM!";
    let assignedValue = _none;
    const spec = _knownDefaults[key];
    const Node = document.querySelector(spec.querySelector);
    let computedStyles;
    if (!Node) {
        console.error(`Could not find element with querySelector: ${spec.querySelector}`);
        computedStyles = { background: "initial" };
    }
    else {
        computedStyles = window.getComputedStyle(Node);
    }
    if (spec.attribute2) {
        if (spec.attribute1 !== "style") {
            console.warn("attribute2 is set, but attribute1 is not style\nThis might not work as expected!\nGrabbing from raw _query (DOM node)");
            // @ts-ignore
            assignedValue = Node[spec.attribute1][spec.attribute2];
        }
        else {
            // @ts-ignore
            assignedValue = computedStyles[spec.attribute2];
        }
    }
    else {
        // @ts-ignore
        assignedValue = (Node !== null && Node !== void 0 ? Node : { src: "initial" })[spec.attribute1];
    }
    // console.log("Got assigned value '", assignedValue, "' for key", key);
    knownDefaults[key] = Object.assign(Object.assign({}, _knownDefaults[key]), { assignedValue: assignedValue === _none ? "" : assignedValue });
}
//   {
//     key: "deleteIMGSrc",
//     querySelector: 'img[src][alt="Emmanuel College"]',
//     firstLevelProperty: "srcset",
//     newValWrapper: "$$$",
//     defaultValue: "DELETE",
//   },
const defaultMemory = {};
for (const key of knownKeys) {
    defaultMemory[key] = { domSpec: knownDefaults[key] };
}
for (const key of knownKeys) {
    if (!defaultMemory[key]) {
        console.error(`Key ${key} not found in defaultMemory!`);
    }
    if (!((_a = defaultMemory[key]) === null || _a === void 0 ? void 0 : _a.domSpec)) {
        console.error(`Key ${key} not found in defaultMemorys domSpecs!`);
    }
}
console.log("content.js loaded");
// #region Helpers
/**
 * Usage:
 * ```ts
 * function expensiveFunction() {
 *  // Do something expensive
 * }
 * const cheapFunc = debounce(expensiveFunction, 1000, {debugExecuted: "Expensive function executed", debugBounced: "Expensive function was debounced"});
 * // Or call it directly
 * expensiveFunction() // Immediate
 * cheapFunc() // Debounced
 * ```
 * @param fn Function to be executed
 * @param delay Delay before execution
 */
const debounce = (callback, waitFor, debug) => {
    let timeout;
    return (...args) => {
        let result;
        (debug === null || debug === void 0 ? void 0 : debug.debugBounced) ? console.log(debug === null || debug === void 0 ? void 0 : debug.debugBounced) : null;
        timeout && clearTimeout(timeout);
        timeout = setTimeout(() => {
            var _a;
            console.log((_a = debug === null || debug === void 0 ? void 0 : debug.debugExecuted) !== null && _a !== void 0 ? _a : "& Executed");
            result = callback(...args);
        }, waitFor);
        return result;
    };
};
// #region Cache
const cache = {};
const resetInfo = {};
for (const _key of knownKeys) {
    const key = _key;
    resetInfo[key] = [
        {
            initialSpec: knownDefaults[key],
        },
    ];
}
// XXX: Add other reset info here
// #endregion
// #region Storage manipulation
/**
 * Usage:
 * ```ts
 * const dataUnderKey = await getStorageData("myKey");
 * ```
 *
 * @param key Key to retrieve from storage
 * @returns Promise that resolves to the value stored under the key
 */
const getStorageData = (key) => new Promise((resolve, reject) => chrome.storage.sync.get([key], (result) => {
    var _a;
    let parsedResult;
    if (!result[key]) {
        console.warn("[getStorageData] No data found for key", key, "in storage");
        resolve(undefined);
        return;
    }
    try {
        parsedResult = JSON.parse(result[key]);
    }
    catch (e) {
        console.error("Could not parse result", result, "with key", key);
        reject(e);
        return;
    }
    console.log("[getStorageData] key:", key, "assignedValue", (_a = parsedResult === null || parsedResult === void 0 ? void 0 : parsedResult.domSpec) === null || _a === void 0 ? void 0 : _a.assignedValue, PROD ? "" : "result:", PROD ? "" : parsedResult, PROD ? "" : "raw:", PROD ? "" : result[key], PROD ? "" : "lastError:", PROD ? "" : chrome.runtime.lastError);
    if (!parsedResult) {
        reject(new Error("Parsed result is falsy"));
        return;
    }
    if (!parsedResult.domSpec) {
        reject(new Error("Parsed result has no domSpec"));
        return;
    }
    if (!validateDOMSpecification(parsedResult.domSpec)) {
        reject(new Error("Parsed result has invalid domSpec"));
        return;
    }
    chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(parsedResult);
}));
/**
 * Usage:
 * ```ts
 * await setStorageData("myKey", "newValue");
 * ```
 * Sets the value of `key` to `value` in actual storage.
 * @param data Data to be stored
 * @returns true if good, else rejects
 */
const setStorageData = (key, data) => new Promise((resolve, reject) => {
    const dataToStore = JSON.stringify(data);
    chrome.storage.sync.set({ [key]: dataToStore }, () => {
        console.log("[setStorageData] key:", key, "data:", data, PROD ? "" : "stringified", PROD ? "" : dataToStore, PROD ? "" : "last error:", PROD ? "" : chrome.runtime.lastError, PROD ? "" : "[note]: Checking if storage was set ...");
        if (PROD)
            return;
        // Test
        chrome.storage.sync.get([key], (result) => {
            if (result[key] === dataToStore) {
                console.log("[setStorageData] [test] Successful!!");
                resolve(true);
            }
            else {
                console.error("[setStorageData] [test] Failed!!");
                reject(false);
            }
        });
        chrome.runtime.lastError
            ? reject(Error(chrome.runtime.lastError.message))
            : resolve(true);
    });
});
/**
 * Get a key. Use this function, as it handles caching for you.
 * Returns a MemoryUnit or **undefined** if not found.
 *
 * Will **not** return a default, unless `fillDefaults` is set to true.
 * If this is the case, when undefined is returned, it will be set to the default.
 * The default is found from `defaultMemory[key]`.
 *
 * @param key Key to retrieve from storage
 * @returns The Memory Unit stored (as promise)
 */
function getKey(key, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cache[key]) {
            return cache[key];
        }
        else {
            console.warn("Key", key, "not found in cache. Searching storage...");
            const d = yield getStorageData(key);
            if (d) {
                cache[key] = d;
                return d;
            }
            else {
                if (options === null || options === void 0 ? void 0 : options.fillDefaults) {
                    console.warn("Key", key, "not found in storage. Setting default value");
                    const defaultMem = defaultMemory[key];
                    // setStorageData(key, defaultMem);
                    cache[key] = defaultMem;
                    return defaultMem;
                }
                else {
                    console.warn("Key", key, "not found in storage. Returning undefined");
                    return undefined;
                }
            }
        }
    });
}
const _setKeyList = knownKeys.map((key) => {
    return debounce(setStorageData, 1000, {
        debugExecuted: `Set '${key}' EXECUTED`,
        debugBounced: `Set '${key}' debounced`,
    });
});
const _setKey = _setKeyList.reduce((previousValue, currentValue, i) => {
    previousValue[knownKeys[i]] = currentValue;
    return previousValue;
}, {});
console.info("Set key", _setKey);
/**
 * Sets the desired `key`s (`domSpec`) `property` (commonly `assignedValue`) to `value` in storage,
 * note this *uses a cache*.
 *
 * ## Use this function, as it will properly update the DOM.
 * ### Note: this will set the `assignedValue` property on the internal `MemoryUnit.domSpec` object by default. To set the `domSpec` property, repeatedly call this function
 *
 *
 * Usage:
 * ```ts
 * await setKey("topbar", "new colour", "assignedValue");
 * ```
 * @param key Key to set
 * @param value Value to set key to
 */
function setKey(key, value, property = "assignedValue") {
    return __awaiter(this, void 0, void 0, function* () {
        if (!cache[key]) {
            console.warn("Key", key, "not found in cache during call to `setKey`.\nThe cache should be the source of truth, as storage is slow.\nTo fix this, load the cache with all desired values from storage. This is usually done automatically when `content.ts` is first loaded.\nAutomatically calling `getKey` to load the cache (this is an implementation detail fix) ...");
            cache[key] = yield getKey(key, { fillDefaults: true });
        }
        // TODO: unmounting logic could go here
        // E.g. resetting the DOM to the initial state, then re-adding the new DOM
        // This would allow changes such as to `querySelector` to work as expected
        cache[key].domSpec[property] = value;
        _setKey[key](key, cache[key]); // Debounces
        // Update DOM
        executeDOMSpecification(cache[key].domSpec);
    });
}
/**
 * Handles a user request, including the reset logic and using `setKey` to update the DOM.
 * @param request Request to handle
 */
function handleUserRequest(request) {
    const key = request.key;
    const action = request.do;
    if (action === "RESET") {
        console.log("Handling RESET request for request: ", request);
        if (!resetInfo[key]) {
            console.warn(`Reset info not found for key '${key}' during reset.\nThis is probably a bug. When initializing, remember to capture the initial DOM state.\nDoing nothing.`);
            return;
        }
        // Loop through each initialSpec
        resetInfo[key].forEach((info) => {
            const initial = info.initialSpec;
            // Loop through initial, and set each property
            for (const _property in initial) {
                const property = _property;
                console.log(`Setting ${key}.${property} to ${initial[property]}`);
                setKey(key, initial[property], property);
            }
        });
    }
    else {
        console.log("Handling request:", request);
        setKey(key, action.newAssignedValue);
    }
}
function _updateElem(elem, spec) {
    if (spec.attribute2) {
        // @ts-ignore
        elem[spec.attribute1][spec.attribute2] = "initial";
        // @ts-ignore
        elem[spec.attribute1][spec.attribute2] = spec.assignedValue;
        // console.log(
        //   "[_updateElem] Set attribute2",
        //   spec.attribute2,
        //   "of",
        //   elem,
        //   "to",
        //   spec.assignedValue
        // );
    }
    else {
        console.log("[_updateElem] setting attribute1", spec.attribute1, "of", elem, "to", spec.assignedValue);
        // @ts-ignore
        elem[spec.attribute1] = spec.assignedValue;
    }
}
function executeDOMSpecification(spec) {
    if (!spec) {
        console.warn("No DOM specification provided. Doing nothing.");
        return;
    }
    if (!(spec === null || spec === void 0 ? void 0 : spec.querySelector)) {
        console.error("No querySelector found in spec:", spec);
        return;
    }
    queryMany(spec.querySelector, (elem) => {
        _updateElem(elem, spec);
    });
}
function queryMany(querySelector, callback) {
    const elements = document.querySelectorAll(querySelector);
    if (elements.length == 0) {
        console.warn(`Did query for '${querySelector}', but matched nothing.\nTry copy pasting this into your browser:\ndocument.querySelectedAll("${querySelector}")\nIf nothing is returned, you may have made a mistake with your query selector.\nRemember to split multiple selectors with commas, like 'nav-bar, #id, .class'`);
    }
    elements.forEach(callback);
}
// #endregion
// #region Runtime Validation
function validateDOMSpecification(spec) {
    if (!spec) {
        console.error("No DOM specification provided. Doing nothing.");
        return false;
    }
    if (!(spec === null || spec === void 0 ? void 0 : spec.querySelector)) {
        console.error("No querySelector found in spec:", spec);
        return false;
    }
    if (!(spec === null || spec === void 0 ? void 0 : spec.attribute1)) {
        console.error("No attribute1 found in spec:", spec);
        return false;
    }
    if (!(spec === null || spec === void 0 ? void 0 : spec.assignedValue)) {
        console.error("No assignedValue found in spec:", spec);
        return false;
    }
    return true;
}
// #endregion
// #region Execution
chrome.storage.sync.get(null, (everything) => {
    var _a, _b, _c;
    if (!everything) {
        console.warn("[initial] No storage found");
        return;
    }
    for (const storageKey in everything) {
        const key = storageKey;
        let _parsed;
        try {
            _parsed = JSON.parse(everything[key]);
        }
        catch (e) {
            console.error(`Failed to parse JSON for key '${key}'\nValue: ${everything[key]}; e:`, e);
            continue;
        }
        const value = _parsed;
        if (!key) {
            console.warn("[initial] No storage key found", key, value);
            continue;
        }
        if (!value) {
            console.warn("[initial] No storage value found", key, value);
            continue;
        }
        if (knownKeys.indexOf(key) == -1) {
            console.warn(`[initial] Key '${key}' found in storage, but not in knownKeys.\nThis is probably a bug.\nValue:`, value);
        }
        if (!validateDOMSpecification(value.domSpec)) {
            const MANUAL_newValue = console.warn(`[initial] Invalid DOM specification found for key '${key}' in initial storage fetch.\nThis is probably a bug.\nValue:`, value, "\nSetting a default value, [fatal] this will override any valid settings data under key", key, "[manual implementation] Setting to");
            chrome.storage.sync.set({ [key]: JSON.stringify(defaultMemory[key]) });
            continue;
        }
        cache[key] = value;
        // Validating value's properties against defaults
        if (((_a = value === null || value === void 0 ? void 0 : value.domSpec) === null || _a === void 0 ? void 0 : _a.querySelector) !==
            ((_c = (_b = defaultMemory[key]) === null || _b === void 0 ? void 0 : _b.domSpec) === null || _c === void 0 ? void 0 : _c.querySelector)) {
            console.warn(`Key '${key}' has a different querySelector than the default.\nThis is probably a bug.\nValue:`, value);
        }
        // Use official means, including updating the DOMd
        setKey(key, value === null || value === void 0 ? void 0 : value.domSpec.assignedValue);
    }
});
// // Retrieve data from chrome storage and put into cache
// knownKeys.forEach(async (key) => {
//   // Populate cache
//   const data = await getStorageData(key);
//   if (cache[key]) {
//     console.warn(
//       "Overwriting cache for key",
//       key,
//       "because it is initial run.\nThis could happen when duplicate items in `kno wnKeys` list exist."
//     );
//   }
//   console.log(
//     "[initial] Setting cache for key",
//     key,
//     "to assignedValue",
//     data?.domSpec?.assignedValue,
//     "domSpec",
//     data?.domSpec,
//     PROD ? "" : "data:",
//     PROD ? "" : data
//   );
//   cache[key] = data;
//   executeDOMSpecification(data!.domSpec);
// });
// Listen for messages from popup.ts
chrome.runtime.onMessage.addListener((request) => {
    if (!request.__is_user_request) {
        console.warn("Received message from popup.ts, but it was not a user request.\nIgnoring.", request);
        return;
    }
    handleUserRequest(request);
});
if (!PROD) {
    // Testing storage
    const v = "test123";
    chrome.storage.sync.set({ test: v }, () => {
        console.log("Set test value");
        chrome.storage.sync.get(["test"], (result) => {
            console.log("Value currently is ", result.test, "should be", v, "is?", result.test === v);
            if (result.test !== v) {
                throw new Error("Test failed");
            }
        });
    });
}
// #endregion
//# sourceMappingURL=content.js.map