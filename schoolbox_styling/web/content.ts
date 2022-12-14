const PROD = true;

// console.log("TESTING!");
// console.log("window", window);
type configs = "*" | "url-backgrounds";
type Config = {
  [key in configs]: "enabled" | string;
};
const config: Promise<Config> = fetch(
  "https://firestore.googleapis.com/v1/projects/better-schoolbox-1f647/databases/(default)/documents/default-config/global"
)
  .then((resp) => resp.json())
  .then((resp) => {
    const _config = resp.fields as Record<configs, { stringValue: string }>;
    const config: Config = {
      "*": _config["*"].stringValue,
      "url-backgrounds": _config["url-backgrounds"].stringValue,
    };
    if (!config["*"]) {
      config["*"] = "enabled";
      console.warn("No config found for *");
    }
    if (!config["url-backgrounds"]) {
      config["url-backgrounds"] = "enabled";
      console.warn("No config found for url-backgrounds");
    }
    console.warn("Config:", config);
    return config;
    // XXX potential runtime checking here
  });

type querySelector = string;
type attr1 = "__style__" | "src" | "innerHTML";
type attr2 = "background" | undefined;
type assignedValue = string;

/**
 * Uses - in name, i.e.
 *
 * default-config = {...}
 */
type _defaultConfig = {
  _inbuilt_shared: { _inbuilt_keys: KnownKeys[] } & {
    [key in KnownKeys]: [querySelector, attr1, attr2];
  };
  emmanuel_sensible_defaults: {
    [key in KnownKeys]: assignedValue;
  };
};

const knownKeys = [
  "topBar",
  // "topBarIcons",
  "leftBar",
  "timetableHeaders",
  "background",

  "iconNotifications",
  "nameText",

  // "sectionHeaders",
] as const;
export type KnownKeys = typeof knownKeys[number];

// TODO: Implement text colour changes
/*
--body-foreground-h1-s: 10%;
*/

// TODO: Populate default values for known keys

const _knownDefaults: Record<
  KnownKeys,
  Omit<DOMSpecification, "assignedValue">
> = {
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
  iconNotifications: {
    querySelector: "a.icon-notifications, label#notification-toggle-full",
    attribute1: "style",
    attribute2: "background",
  },
  nameText: {
    querySelector: "h1>strong",
    attribute1: "innerText",
  },
};

/**
 * Default memory units, loaded with actual values from DOM.
 */
const knownDefaults: Required<Memory<DOMSpecification>> = {} as any;
for (const _key of Object.keys(_knownDefaults)) {
  const key = _key as KnownKeys;
  const _none = "NOT FOUND ON DOM!";
  let assignedValue: DOMSpecification["assignedValue"] = _none;

  const spec = _knownDefaults[key];
  const Node = document.querySelector(spec.querySelector);
  let computedStyles;
  if (!Node) {
    console.error(
      `Could not find element with querySelector: ${spec.querySelector}`
    );
    computedStyles = { background: "initial" };
  } else {
    computedStyles = window.getComputedStyle(Node);
  }

  if (spec.attribute2) {
    if (spec.attribute1 !== "style") {
      console.warn(
        "attribute2 is set, but attribute1 is not style\nThis might not work as expected!\nGrabbing from raw _query (DOM node)"
      );
      // @ts-ignore
      assignedValue = Node[spec.attribute1][spec.attribute2];
    } else {
      // @ts-ignore
      assignedValue = computedStyles[spec.attribute2!];
    }
  } else {
    // @ts-ignore
    assignedValue = (Node ?? { src: "initial" })[spec.attribute1];
  }

  // console.log("Got assigned value '", assignedValue, "' for key", key);

  knownDefaults[key] = {
    ..._knownDefaults[key],
    assignedValue: assignedValue === _none ? "" : assignedValue,
  };
}
//   {
//     key: "deleteIMGSrc",
//     querySelector: 'img[src][alt="Emmanuel College"]',
//     firstLevelProperty: "srcset",
//     newValWrapper: "$$$",
//     defaultValue: "DELETE",
//   },

const defaultMemory: Required<Memory> = {} as any;
for (const key of knownKeys) {
  defaultMemory[key] = { domSpec: knownDefaults[key] };
}
for (const key of knownKeys) {
  if (!defaultMemory[key]) {
    console.error(`Key ${key} not found in defaultMemory!`);
  }
  if (!defaultMemory[key]?.domSpec) {
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
const debounce = <T extends (...args: any[]) => any>(
  callback: T,
  waitFor: number,
  debug?: { debugExecuted?: string; debugBounced?: string }
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): ReturnType<T> => {
    let result: any;
    debug?.debugBounced ? console.log(debug?.debugBounced) : null;
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
 * What should be stored in memory.
 * Example: `cache` should be of this type, return of chrome storage retrieval should be of this type, e.t.c.
 */
type Memory<Unit extends MemoryUnit | any = MemoryUnit> = {
  [key in KnownKeys]?: Unit;
};

// #region Cache

const cache: Memory<MemoryUnit> = {};

// #endregion cache

// #region ResetInfo

/**
 * Information needed to reset a specific knownKey
 */
type ResetInfo = {
  initialSpec: DOMSpecification;
};

const resetInfo: Memory<ResetInfo[]> = {};

for (const _key of knownKeys) {
  const key = _key as KnownKeys;
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
const getStorageData = (key: KnownKeys): Promise<MemoryUnit | undefined> =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get([key], (result) => {
      let parsedResult: MemoryUnit;
      if (!result[key]) {
        console.warn(
          "[getStorageData] No data found for key",
          key,
          "in storage"
        );
        resolve(undefined);
        return;
      }
      try {
        parsedResult = JSON.parse(result[key] as any);
      } catch (e) {
        console.error("Could not parse result", result, "with key", key);
        reject(e);
        return;
      }
      console.log(
        "[getStorageData] key:",
        key,
        "assignedValue",
        parsedResult?.domSpec?.assignedValue,
        PROD ? "" : "result:",
        PROD ? "" : parsedResult,
        PROD ? "" : "raw:",
        PROD ? "" : result[key],
        PROD ? "" : "lastError:",
        PROD ? "" : chrome.runtime.lastError
      );
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
    })
  );

/**
 * Usage:
 * ```ts
 * await setStorageData("myKey", "newValue");
 * ```
 * Sets the value of `key` to `value` in actual storage.
 * @param data Data to be stored
 * @returns true if good, else rejects
 */
const setStorageData = (key: KnownKeys, data: MemoryUnit): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const dataToStore = JSON.stringify(data);
    chrome.storage.sync.set({ [key]: dataToStore }, () => {
      console.log(
        "[setStorageData] key:",
        key,
        "data:",
        data,
        PROD ? "" : "stringified",
        PROD ? "" : dataToStore,
        PROD ? "" : "last error:",
        PROD ? "" : chrome.runtime.lastError,
        PROD ? "" : "[note]: Checking if storage was set ..."
      );
      if (PROD) return;
      // Test
      chrome.storage.sync.get([key], (result) => {
        if (result[key] === dataToStore) {
          console.log("[setStorageData] [test] Successful!!");
          resolve(true);
        } else {
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
async function getKey(
  key: KnownKeys,
  options?: { fillDefaults: Boolean }
): Promise<MemoryUnit | undefined> {
  if (cache[key]) {
    return cache[key]!;
  } else {
    console.warn("Key", key, "not found in cache. Searching storage...");
    const d = await getStorageData(key);
    if (d) {
      cache[key] = d;
      return d;
    } else {
      if (options?.fillDefaults) {
        console.warn("Key", key, "not found in storage. Setting default value");
        const defaultMem = defaultMemory[key];
        // setStorageData(key, defaultMem);
        cache[key] = defaultMem;
        return defaultMem;
      } else {
        console.warn("Key", key, "not found in storage. Returning undefined");
        return undefined;
      }
    }
  }
}

const _setKeyList: typeof setStorageData[] = knownKeys.map((key) => {
  return debounce(setStorageData, 1000, {
    debugExecuted: `Set '${key}' EXECUTED`,
    debugBounced: `Set '${key}' debounced`,
  });
});
const _setKey: Record<KnownKeys, typeof setStorageData> = _setKeyList.reduce(
  (previousValue, currentValue, i) => {
    previousValue[knownKeys[i]] = currentValue;
    return previousValue;
  },
  {} as any
);

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
async function setKey<
  Property extends keyof MemoryUnit["domSpec"] = "assignedValue"
>(
  key: KnownKeys,
  value: MemoryUnit["domSpec"][Property],
  property: Property = "assignedValue" as any
) {
  const _config = await config;
  if (value?.includes("url") && _config["url-backgrounds"] != "enabled") {
    console.error(
      "Extension URL images disabled: ",
      _config["url-backgrounds"],
      ""
    );
    return;
  }

  if (!cache[key]) {
    console.warn(
      "Key",
      key,
      "not found in cache during call to `setKey`.\nThe cache should be the source of truth, as storage is slow.\nTo fix this, load the cache with all desired values from storage. This is usually done automatically when `content.ts` is first loaded.\nAutomatically calling `getKey` to load the cache (this is an implementation detail fix) ..."
    );
    cache[key] = await getKey(key, { fillDefaults: true });
  }

  // TODO: unmounting logic could go here
  // E.g. resetting the DOM to the initial state, then re-adding the new DOM
  // This would allow changes such as to `querySelector` to work as expected

  cache[key]!.domSpec[property] = value;
  _setKey[key](key, cache[key]!); // Debounces

  // Update DOM
  executeDOMSpecification(cache[key]!.domSpec);
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
  const key = request.key;
  const action = request.do;
  if (action === "RESET") {
    console.log("Handling RESET request for request: ", request);
    if (!resetInfo[key]) {
      console.warn(
        `Reset info not found for key '${key}' during reset.\nThis is probably a bug. When initializing, remember to capture the initial DOM state.\nDoing nothing.`
      );
      return;
    }
    // Loop through each initialSpec
    resetInfo[key]!.forEach((info) => {
      const initial = info.initialSpec;
      // Loop through initial, and set each property
      for (const _property in initial) {
        const property = _property as keyof typeof initial;

        console.log(`Setting ${key}.${property} to ${initial[property]}`);

        setKey(key, initial[property], property);
      }
    });
  } else {
    console.log("Handling request:", request);
    setKey(key, action.newAssignedValue);
  }
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

function _updateElem(elem: Node, spec: DOMSpecification) {
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
  } else {
    console.log(
      "[_updateElem] setting attribute1",
      spec.attribute1,
      "of",
      elem,
      "to",
      spec.assignedValue
    );
    // @ts-ignore
    elem[spec.attribute1] = spec.assignedValue;
  }
}

function executeDOMSpecification(spec: DOMSpecification) {
  config.then((config) => {
    if (config["*"] != "enabled") {
      console.error(
        "Not going to update the DOM, because the extension is disabled FULLY"
      );
      throw new Error("Extension (fully) disabled: " + config["*"]);
    }
    if (!spec) {
      console.warn("No DOM specification provided. Doing nothing.");
      return;
    }
    if (!spec?.querySelector) {
      console.error("No querySelector found in spec:", spec);
      return;
    }
    queryMany(spec.querySelector, (elem) => {
      _updateElem(elem, spec);
    });
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

// #region Runtime Validation

function validateDOMSpecification(spec: DOMSpecification): Boolean {
  if (!spec) {
    console.error("No DOM specification provided. Doing nothing.");
    return false;
  }
  if (!spec?.querySelector) {
    console.error("No querySelector found in spec:", spec);
    return false;
  }
  if (!spec?.attribute1) {
    console.error("No attribute1 found in spec:", spec);
    return false;
  }
  if (!spec?.assignedValue) {
    console.error("No assignedValue found in spec:", spec);
    return false;
  }
  return true;
}

// #endregion

// #region Execution
chrome.storage.sync.get(null, (everything: Record<string, string>) => {
  if (!everything) {
    console.warn("[initial] No storage found");
    return;
  }
  for (const storageKey in everything) {
    const key = storageKey as KnownKeys;
    let _parsed;
    try {
      _parsed = JSON.parse(everything[key]);
    } catch (e) {
      console.error(
        `Failed to parse JSON for key '${key}'\nValue: ${everything[key]}; e:`,
        e
      );
      continue;
    }
    const value = _parsed as MemoryUnit;

    if (!key) {
      console.warn("[initial] No storage key found", key, value);
      continue;
    }

    if (!value) {
      console.warn("[initial] No storage value found", key, value);
      continue;
    }

    if (knownKeys.indexOf(key) == -1) {
      console.warn(
        `[initial] Key '${key}' found in storage, but not in knownKeys.\nThis is probably a bug.\nValue:`,
        value
      );
    }

    if (!validateDOMSpecification(value.domSpec)) {
      const MANUAL_newValue = console.warn(
        `[initial] Invalid DOM specification found for key '${key}' in initial storage fetch.\nThis is probably a bug.\nValue:`,
        value,
        "\nSetting a default value, [fatal] this will override any valid settings data under key",
        key,
        "[manual implementation] Setting to"
      );
      chrome.storage.sync.set({
        [key]: JSON.stringify(defaultMemory[key]),
      });

      continue;
    }

    cache[key] = value;

    // Validating value's properties against defaults
    if (
      value?.domSpec?.querySelector !==
      defaultMemory[key]?.domSpec?.querySelector
    ) {
      console.warn(
        `Key '${key}' has a different querySelector than the default.\nThis is probably a bug.\nValue:`,
        value
      );
    }

    // Use official means, including updating the DOM

    const newValue = value?.domSpec.assignedValue;
    setKey(key, newValue);
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

// #endregion

// #region 1/10000 rick astley rick roll

// const insertionPoint = document.querySelector("#container");
// const rickRoll = document.createElement("iframe");
// rickRoll.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1";
// rickRoll.style.height = "60vh";
// insertionPoint?.insertBefore(rickRoll, insertionPoint.firstChild);

// #endregion
