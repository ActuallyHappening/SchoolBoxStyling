const knownKeys = [
  "topBar",
  "topBarIcons",
  "leftBar",
  "timetableHeaders",
  "background",

  "sectionHeaders",

  // "topBarColour",
  // "leftBarColour",
  // "rightBarColour",

  // "mainSchoolBoxIconURL",
  // "secondarySchoolBoxIconURL",
  // "deleteIMGSrc",

  // "bodyBackgroundColour",
  // "timetablePeriodHeaders",
] as const;
export type KnownKeys = typeof knownKeys[number];

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
const debounce = <T extends (...args: any[]) => any>(
  callback: T,
  waitFor: number,
  debug?: { debugExecuted?: string; debugBounced?: string }
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): ReturnType<T> => {
    let result: any;
    console.log(debug?.debugBounced ?? "& Bounced");
    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(debug?.debugExecuted ?? "& Executed");
      result = callback(...args);
    }, waitFor);
    return result;
  };
};

// #endregion

// #region Memory manipulation

/**
 * Represents what is stored in memory, actually.
 * Abstracts away from specific storage types,
 * so that e.g. switching to firebase is as simple as implementing this
 */
interface MemoryUnit {
  domSpec: DOMSpecification;
  // resetInfo: ResetInfo;
}

/**
 * Information needed to reset a specific knownKey
 */
type ResetInfo = {
  initialSpec: DOMSpecification;
};

/**
 * What should be stored in memory.
 * Example: `cache` should be of this type, return of chrome storage retrieval should be of this type, e.t.c.
 */
type Memory<Unit extends MemoryUnit | any = MemoryUnit> = {
  [key in KnownKeys]?: Unit;
};

// #region Cache

const cache: Memory<MemoryUnit> = {};
const resetInfo: Memory<ResetInfo> = {};

// #endregion cache

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
const getStorageData = (key: KnownKeys): Promise<MemoryUnit> =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get([key], (result) =>
      chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(result[key])
    )
  );

/**
 * Usage:
 * ``ts
 * await setStorageData("myKey", "newValue");
 * ```
 * @param data Data to be stored
 * @returns true if good, else rejects
 */
const setStorageData = (key: KnownKeys, data: MemoryUnit): Promise<boolean> =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.set({ key: data }, () =>
      chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(true)
    )
  );

/**
 * Get a key. Use this function, as it handles caching for you.
 * @param key Key to retrieve from storage
 * @returns The Memory Unit stored (as promise)
 */
async function getKey(key: KnownKeys): Promise<MemoryUnit> {
  if (cache[key]) {
    return cache[key]!;
  } else {
    console.warn("Key", key, "not found in cache. Searching storage...");
    return await getStorageData(key);
  }
}

const _setKey = debounce(setStorageData, 1000, {
  debugExecuted: "Set key EXECUTED",
  debugBounced: "Set key debounced",
});
/**
 * Sets the desired `key`s (`domSpec`) `property` (commonly `assignedValue`) to `value` in storage,
 * note this *uses a cache*.
 *
 * ## Use this function, as it will properly update the DOM.
 * ### Note: this will set the `assignedValue` property on the internal `MemoryUnit` object by default.
 *
 *
 * Usage:
 * ```ts
 * await setKey("topbar", "new colour", "background-color");
 * ```
 * @param key Key to set
 * @param value Value to set key to
 */
async function setKey<
  Property extends keyof MemoryUnit["domSpec"] = "assignedValue"
>(
  key: KnownKeys,
  value: MemoryUnit["domSpec"][Property],
  property: Property = "assignedValue" as any
) {
  if (!cache[key]) {
    console.warn(
      "Key",
      key,
      "not found in cache during call to `setKey`.\nThe cache should be the source of truth, as storage is slow.\nTo fix this, load the cache with all desired values from storage. This is usually done automatically when `content.ts` is first loaded.\nAutomatically calling `getKey` to load the cache (this is an implementation detail fix) ..."
    );
    cache[key] = await getKey(key);
  }
  cache[key]!.domSpec[property] = value;
  _setKey(key, cache[key]!);
}

// #endregion storage

// #endregion memory

// #region UserRequests

/**
 * What is sent to content.ts
 */
export interface UserRequest {
  key: KnownKeys;
  do: PossibleActions;

  __is_user_request: true;
}

type PossibleActions =
  | "RESET"
  | {
      newAssignedValue: DOMSpecification["assignedValue"];
    };

/**
 * Handles a user request, including the reset logic and using `setKey` to update the DOM.
 * @param request Request to handle
 */
function handleUserRequest(request: UserRequest) {
  console.log("Handling user request", request);
}

// #endregion user requests

// #region DOM manipulation

/**
 * Represents a specific mutation to the DOM.
 * Examples include:
 * - Setting an attribute, like style
 */
interface DOMSpecification {
  querySelector: string;
  attribute1: string;
  attribute2?: string;
  assignedValue: string;

  // warn: {
  //   onMany: boolean;
  // }
}

function executeDOMSpecification(spec: DOMSpecification) {
  queryMany(spec.querySelector, (elem) => {
    if (spec.attribute2) {
      // @ts-ignore
      elem[spec.attribute1][spec.attribute2] = spec.assignedValue;
    } else {
      // @ts-ignore
      elem[spec.attribute1] = spec.assignedValue;
    }
  });
}

function queryMany(querySelector: string, callback: (elem: Node) => void) {
  const elements = document.querySelectorAll(querySelector);
  if (elements.length == 0) {
    console.warn(
      `Did query for '${querySelector}', but matched nothing.\nTry copy pasting this into your browser:\ndocument.querySelectedAll("${querySelector}")\nIf nothing is returned, you may have made a mistake with your query selector.\nRemember to split multiple selectors with commas, like 'nav-bar, #id, .class'`
    );
  }
  elements.forEach(callback);
}

// #endregion

//

// #region Execution

// Retrieve data from chrome storage and put into cache
knownKeys.forEach(async (key) => {
  const data = await getStorageData(key);
  if (data) {
    if (cache[key]) {
      console.warn(
        "Overwriting cache for key",
        key,
        "because it is initial run.\nThis could happen when duplicate items in `kno wnKeys` list exist."
      );
    }
    console.log("Setting cache for key", key, "to", data);
    cache[key] = data;
  } else {
    console.warn(
      "No data found for key",
      key,
      "in initial storage fetch.\nThis is typically because the user has not selected anything for this key yet."
    );
  }
});

// Listen for messages from popup.ts
chrome.runtime.onMessage.addListener((request: UserRequest) => {
  if (!request.__is_user_request) {
    console.warn(
      "Received message from popup.ts, but it was not a user request.\nIgnoring.",
      request
    );
    return;
  }
  handleUserRequest(request);
});

// #region

// // #region OTHER
// /**
//  * Keys used to find known values in storage.
//  * This is simple a prefixed version of `KnownKeys`.
//  */
// type StorageKey = `betterSchoolBoxExtensionStorage-${KnownKeys}`;
// /**
//  * What is stored in storage.
//  * This is no different to `Action` interface,
//  * as the 'current' value is in `Action.storedValue`
//  */
// type StorageValue = ParamPayload;
// function getFromStorage(
//   itemName: KnownKeys,
//   callback: (value: StorageValue) => void
// ) {
//   const storageKey = _genStorageKey(itemName);
//   chrome.storage.sync.get([storageKey], (items) => {
//     const data = items[storageKey];
//     if (!data) {
//       console.warn(
//         `Retrieving item '${itemName}' from storage found nothing.\nIf no value for ${itemName} has ever been stored, this is expected.\nOtherwise, a typo in ${itemName} is likely the cause.\n Raw storage key: ${storageKey}`
//       );
//     }
//     console.log(
//       "Retrieved",
//       data,
//       "under key",
//       itemName,
//       "from synced local storage."
//     );
//     callback(data);
//   });
// }

// function _genStorageKey(key: KnownKeys): StorageKey {
//   return `betterSchoolBoxExtensionStorage-${key}`;
// }

// function setToStorage(itemName: KnownKeys, value: StorageValue) {
//   const storageKey = _genStorageKey(itemName);
//   console.log(
//     "Setting",
//     value,
//     "under key",
//     storageKey,
//     "in synced local storage."
//   );
//   chrome.storage.sync.set({
//     [storageKey]: value,
//   });
// }

// export interface EventPayload {
//   key: KnownKeys;
//   newValue: ParamPayload;
// }
// function listenForMessage(
//   key: KnownKeys,
//   callback: (value: ParamPayload) => void
// ) {
//   chrome.runtime.onMessage.addListener(
//     (msg: EventPayload, sender, response) => {
//       if (msg.key === key) {
//         console.log(
//           "[listenForMessage] Received message for key",
//           key,
//           "with value",
//           msg.newValue
//         );
//         callback(msg.newValue);
//       }
//     }
//   );
// }

// /**
//  *
//  * @param {String} param the parameter, e.g. 'https://myimg.com'
//  * @param {String} wrapper 'url($$$)', note use of `$$$` as placeholder for value
//  * @returns The wrapper with value replaced in it
//  */
// function _evalValueWrapper(param: string, wrapper: string) {
//   return wrapper.replace("$$$", param);
// }

// /**
//  * Represents a possible thing that this extension updates in its entirety.
//  * This is only an explanation of what the action does.
//  * It does not contain a reference to the actions current value.
//  */
// interface Action {
//   /**
//    * Which action this updates.
//    */
//   key: KnownKeys;

//   querySelector: string;
//   firstLevelProperty: "style" | "src" | "srcset";
//   secondLevelProperty?: string;

//   newValWrapper: `${string}$$$${string}`;
//   defaultValue?: ParamPayload;
// }

// /**
//  * Either css colour,
//  * or url to image
//  */
// export type ParamPayload =
//   | `rgb(${number}, ${number}, ${number})`
//   | `https://${string}.${string}/${string}`
//   | "empty"
//   | "DELETE";

// function executeActionInScope(
//   action: Action,
//   scope: "update" | "delete",
//   param: ParamPayload
// ) {
//   if (scope == "update") {
//     // Update DOM in some way
//     const {
//       querySelector,
//       firstLevelProperty,
//       secondLevelProperty,
//       newValWrapper,
//     } = action;
//     queryMany(querySelector, (element: Node) => {
//       if (secondLevelProperty) {
//         try {
//           // @ts-ignore
//           element[firstLevelProperty][secondLevelProperty] = _evalValueWrapper(
//             param,
//             newValWrapper
//           );
//         } catch (e) {
//           console.error(
//             "error caught which execute action",
//             action,
//             "in scope",
//             scope,
//             "with param",
//             param,
//             ";; Error:",
//             e
//           );
//         }
//       } else {
//         try {
//           // @ts-ignore
//           element[firstLevelProperty] = _evalValueWrapper(param, newValWrapper);
//           if (action.key == "deleteIMGSrc") {
//             console.warn(
//               "DELETE IMG SRC",
//               "element",
//               element,
//               "firstLevelProperty",
//               firstLevelProperty,
//               "secondLevelProperty",
//               secondLevelProperty,
//               "newValWrapper",
//               newValWrapper,
//               "param",
//               param
//             );
//           }
//         } catch (e) {
//           console.error(
//             "error caught which execute action",
//             action,
//             "in scope",
//             scope,
//             "with param",
//             param,
//             ";; Error:",
//             e
//           );
//         }
//       }
//     });
//   } else if (scope == "delete") {
//     // Delete DOM in some way
//     const { querySelector } = action;
//     queryMany(querySelector, (element: Node) => {
//       element.parentElement?.removeChild(element);
//     });
//   }
// }

// /**
//  * Registers an action to appropriate event listeners.
//  * This 'deserializes' it, basically.
//  * @param action Action to register to appropriate event listeners
//  */
// function registerAction(action: Action) {
//   const { key } = action;
//   getFromStorage(key, (newestValue) => {
//     // initial load, trigger 'update'
//     if (!newestValue || newestValue == "empty") {
//       if (action.defaultValue) {
//         console.log(
//           "Loading default value for",
//           key,
//           "which is",
//           action.defaultValue
//         );
//         executeActionInScope(
//           action,
//           action.defaultValue == "DELETE" ? "delete" : "update",
//           action.defaultValue
//         );
//         return;
//       }
//     }
//     console.log(
//       "initial load, triggering 'update' for key",
//       key,
//       "and action",
//       action,
//       "with newest value",
//       newestValue
//     );
//     executeActionInScope(action, "update", newestValue);
//   });
//   chrome.storage.onChanged.addListener((changes, areaName) => {
//     console.log("storage changed", changes, areaName);
//     const keyChanges = changes[_genStorageKey(key)];
//     if (areaName === "sync" && keyChanges?.newValue) {
//       // storageUpdated trigger update
//       console.log(
//         "[registered onChanged listener] Detected change in storage key",
//         key,
//         "and enacting action in scope",
//         action,
//         "with new value",
//         keyChanges.newValue
//       );
//       executeActionInScope(action, "update", keyChanges.newValue);
//     }
//   });
//   listenForMessage(key, (value) => {
//     // messageReceived trigger update
//     console.log(
//       "Detected message for key",
//       key,
//       "and updating action",
//       action,
//       "with new value",
//       value
//     );
//     setToStorage(key, value); // Should trigger update
//     // executeActionInScope(action, "update", value);
//   });
// }

// const knownActionStatics: Action[] = [
//   {
//     key: "topBarColour",
//     querySelector: "nav.tab-bar",
//     firstLevelProperty: "style",
//     secondLevelProperty: "backgroundColor",
//     newValWrapper: "$$$",
//   },
//   {
//     key: "leftBarColour",
//     querySelector: "aside#left-menu",
//     firstLevelProperty: "style",
//     secondLevelProperty: "backgroundColor",
//     newValWrapper: "$$$",
//   },
//   {
//     key: "mainSchoolBoxIconURL",
//     querySelector: "div.logo-wrapper>a.logo",
//     firstLevelProperty: "style",
//     secondLevelProperty: "background",
//     newValWrapper: "url($$$) center center / contain no-repeat",
//     defaultValue: "/images/logo.php?logo=skin_logo_large&size=hidpi" as any,
//   },
//   {
//     key: "secondarySchoolBoxIconURL",
//     querySelector: "section.tab-bar-section>a.logo",
//     firstLevelProperty: "style",
//     secondLevelProperty: "background",
//     newValWrapper: "url($$$) center center / contain no-repeat",
//     defaultValue: "/images/logo.php?logo=skin_logo_square&size=normal" as any,
//   },
//   {
//     key: "deleteIMGSrc",
//     querySelector: 'img[src][alt="Emmanuel College"]',
//     firstLevelProperty: "srcset",
//     newValWrapper: "$$$",
//     defaultValue: "DELETE",
//   },
//   {
//     key: "timetablePeriodHeaders",
//     querySelector: "table.timetable[data-timetable]>thead>tr>th",
//     firstLevelProperty: "style",
//     secondLevelProperty: "backgroundColor",
//     newValWrapper: "$$$",
//   },
//   {
//     key: "bodyBackgroundColour",
//     querySelector: "body",
//     firstLevelProperty: "style",
//     secondLevelProperty: "backgroundColor",
//     newValWrapper: "$$$",
//   },
// ];

// knownActionStatics.forEach(registerAction);

// chrome.runtime.onMessage.addListener((msg, sender, response) => {
//   console.log("[debug all] Received message", msg, "from sender", sender);
// });

// const s = document.createElement("style");
// document.head.appendChild(s);

// s.innerHTML = "a[class^=icon-]:before {color: rgb(25, 60, 100) !important;}";

// /**
//  * Add a stylesheet rule to the document (it may be better practice
//  * to dynamically change classes, so style information can be kept in
//  * genuine stylesheets and avoid adding extra elements to the DOM).
//  * Note that an array is needed for declarations and rules since ECMAScript does
//  * not guarantee a predictable object iteration order, and since CSS is
//  * order-dependent.
//  * @param {Array} rules Accepts an array of JSON-encoded declarations
//  * @example
// addStylesheetRules([
//   ['h2', // Also accepts a second argument as an array of arrays instead
//     ['color', 'red'],
//     ['background-color', 'green', true] // 'true' for !important rules
//   ],
//   ['.myClass',
//     ['background-color', 'yellow']
//   ]
// ]);
// */
// function addStylesheetRules(rules: (string[] | string)[]) {
//   const styleEl = document.createElement("style");

//   // Append <style> element to <head>
//   document.head.appendChild(styleEl);

//   // Grab style element's sheet
//   const styleSheet = styleEl.sheet!;

//   for (let i = 0; i < rules.length; i++) {
//     let j = 1,
//       rule = rules[i],
//       selector = rule[0],
//       propStr = "";
//     // If the second argument of a rule is an array of arrays, correct our variables.
//     if (Array.isArray(rule[1][0])) {
//       rule = rule[1];
//       j = 0;
//     }

//     for (let pl = rule.length; j < pl; j++) {
//       const prop = rule[j];
//       propStr += `${prop[0]}: ${prop[1]}${prop[2] ? " !important" : ""};\n`;
//     }

//     // Insert CSS Rule
//     styleSheet.insertRule(
//       `${selector}{${propStr}}`,
//       styleSheet.cssRules.length
//     );
//   }
// }
// // #endregion
