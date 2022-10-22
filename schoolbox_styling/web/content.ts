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
  if (!cache[key]) {
    console.warn(
      "Key",
      key,
      "not found in cache during call to `setKey`.\nThe cache should be the source of truth, as storage is slow.\nTo fix this, load the cache with all desired values from storage. This is usually done automatically when `content.ts` is first loaded.\nAutomatically calling `getKey` to load the cache (this is an implementation detail fix) ..."
    );
    cache[key] = await getKey(key);
  }

  // TODO: unmounting logic could go here
  // E.g. resetting the DOM to the initial state, then re-adding the new DOM
  // This would allow changes such as to `querySelector` to work as expected

  cache[key]!.domSpec[property] = value;
  _setKey(key, cache[key]!);

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
        "Reset info not found for key",
        key,
        "during reset.\nThis is probably a bug. When initializing, remember to capture the initial DOM state.\nDoing nothing"
      );
      return;
    }
    const initial = resetInfo[key]!.initialSpec;
    // Loop through initial, and set each property
    for (const _property in initial) {
      const property = _property as keyof typeof initial;

      console.log("Setting", property, "of key", key, "to", initial[property]);

      setKey(key, initial[property], property);
    }
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