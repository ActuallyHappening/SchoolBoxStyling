(function () {
    'use strict';

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const stringToByteArray$1 = function (str) {
        // TODO(user): Use native implementations if/when available
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 128) {
                out[p++] = c;
            }
            else if (c < 2048) {
                out[p++] = (c >> 6) | 192;
                out[p++] = (c & 63) | 128;
            }
            else if ((c & 0xfc00) === 0xd800 &&
                i + 1 < str.length &&
                (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
                // Surrogate Pair
                c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                out[p++] = (c >> 18) | 240;
                out[p++] = ((c >> 12) & 63) | 128;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
            else {
                out[p++] = (c >> 12) | 224;
                out[p++] = ((c >> 6) & 63) | 128;
                out[p++] = (c & 63) | 128;
            }
        }
        return out;
    };
    /**
     * Turns an array of numbers into the string given by the concatenation of the
     * characters to which the numbers correspond.
     * @param bytes Array of numbers representing characters.
     * @return Stringification of the array.
     */
    const byteArrayToString = function (bytes) {
        // TODO(user): Use native implementations if/when available
        const out = [];
        let pos = 0, c = 0;
        while (pos < bytes.length) {
            const c1 = bytes[pos++];
            if (c1 < 128) {
                out[c++] = String.fromCharCode(c1);
            }
            else if (c1 > 191 && c1 < 224) {
                const c2 = bytes[pos++];
                out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
            }
            else if (c1 > 239 && c1 < 365) {
                // Surrogate Pair
                const c2 = bytes[pos++];
                const c3 = bytes[pos++];
                const c4 = bytes[pos++];
                const u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
                    0x10000;
                out[c++] = String.fromCharCode(0xd800 + (u >> 10));
                out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
            }
            else {
                const c2 = bytes[pos++];
                const c3 = bytes[pos++];
                out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            }
        }
        return out.join('');
    };
    // We define it as an object literal instead of a class because a class compiled down to es5 can't
    // be treeshaked. https://github.com/rollup/rollup/issues/1691
    // Static lookup maps, lazily populated by init_()
    const base64 = {
        /**
         * Maps bytes to characters.
         */
        byteToCharMap_: null,
        /**
         * Maps characters to bytes.
         */
        charToByteMap_: null,
        /**
         * Maps bytes to websafe characters.
         * @private
         */
        byteToCharMapWebSafe_: null,
        /**
         * Maps websafe characters to bytes.
         * @private
         */
        charToByteMapWebSafe_: null,
        /**
         * Our default alphabet, shared between
         * ENCODED_VALS and ENCODED_VALS_WEBSAFE
         */
        ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
        /**
         * Our default alphabet. Value 64 (=) is special; it means "nothing."
         */
        get ENCODED_VALS() {
            return this.ENCODED_VALS_BASE + '+/=';
        },
        /**
         * Our websafe alphabet.
         */
        get ENCODED_VALS_WEBSAFE() {
            return this.ENCODED_VALS_BASE + '-_.';
        },
        /**
         * Whether this browser supports the atob and btoa functions. This extension
         * started at Mozilla but is now implemented by many browsers. We use the
         * ASSUME_* variables to avoid pulling in the full useragent detection library
         * but still allowing the standard per-browser compilations.
         *
         */
        HAS_NATIVE_SUPPORT: typeof atob === 'function',
        /**
         * Base64-encode an array of bytes.
         *
         * @param input An array of bytes (numbers with
         *     value in [0, 255]) to encode.
         * @param webSafe Boolean indicating we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeByteArray(input, webSafe) {
            if (!Array.isArray(input)) {
                throw Error('encodeByteArray takes an array as a parameter');
            }
            this.init_();
            const byteToCharMap = webSafe
                ? this.byteToCharMapWebSafe_
                : this.byteToCharMap_;
            const output = [];
            for (let i = 0; i < input.length; i += 3) {
                const byte1 = input[i];
                const haveByte2 = i + 1 < input.length;
                const byte2 = haveByte2 ? input[i + 1] : 0;
                const haveByte3 = i + 2 < input.length;
                const byte3 = haveByte3 ? input[i + 2] : 0;
                const outByte1 = byte1 >> 2;
                const outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
                let outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
                let outByte4 = byte3 & 0x3f;
                if (!haveByte3) {
                    outByte4 = 64;
                    if (!haveByte2) {
                        outByte3 = 64;
                    }
                }
                output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
            }
            return output.join('');
        },
        /**
         * Base64-encode a string.
         *
         * @param input A string to encode.
         * @param webSafe If true, we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeString(input, webSafe) {
            // Shortcut for Mozilla browsers that implement
            // a native base64 encoder in the form of "btoa/atob"
            if (this.HAS_NATIVE_SUPPORT && !webSafe) {
                return btoa(input);
            }
            return this.encodeByteArray(stringToByteArray$1(input), webSafe);
        },
        /**
         * Base64-decode a string.
         *
         * @param input to decode.
         * @param webSafe True if we should use the
         *     alternative alphabet.
         * @return string representing the decoded value.
         */
        decodeString(input, webSafe) {
            // Shortcut for Mozilla browsers that implement
            // a native base64 encoder in the form of "btoa/atob"
            if (this.HAS_NATIVE_SUPPORT && !webSafe) {
                return atob(input);
            }
            return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
        },
        /**
         * Base64-decode a string.
         *
         * In base-64 decoding, groups of four characters are converted into three
         * bytes.  If the encoder did not apply padding, the input length may not
         * be a multiple of 4.
         *
         * In this case, the last group will have fewer than 4 characters, and
         * padding will be inferred.  If the group has one or two characters, it decodes
         * to one byte.  If the group has three characters, it decodes to two bytes.
         *
         * @param input Input to decode.
         * @param webSafe True if we should use the web-safe alphabet.
         * @return bytes representing the decoded value.
         */
        decodeStringToByteArray(input, webSafe) {
            this.init_();
            const charToByteMap = webSafe
                ? this.charToByteMapWebSafe_
                : this.charToByteMap_;
            const output = [];
            for (let i = 0; i < input.length;) {
                const byte1 = charToByteMap[input.charAt(i++)];
                const haveByte2 = i < input.length;
                const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
                ++i;
                const haveByte3 = i < input.length;
                const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
                ++i;
                const haveByte4 = i < input.length;
                const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
                ++i;
                if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
                    throw Error();
                }
                const outByte1 = (byte1 << 2) | (byte2 >> 4);
                output.push(outByte1);
                if (byte3 !== 64) {
                    const outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
                    output.push(outByte2);
                    if (byte4 !== 64) {
                        const outByte3 = ((byte3 << 6) & 0xc0) | byte4;
                        output.push(outByte3);
                    }
                }
            }
            return output;
        },
        /**
         * Lazy static initialization function. Called before
         * accessing any of the static map variables.
         * @private
         */
        init_() {
            if (!this.byteToCharMap_) {
                this.byteToCharMap_ = {};
                this.charToByteMap_ = {};
                this.byteToCharMapWebSafe_ = {};
                this.charToByteMapWebSafe_ = {};
                // We want quick mappings back and forth, so we precompute two maps.
                for (let i = 0; i < this.ENCODED_VALS.length; i++) {
                    this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
                    this.charToByteMap_[this.byteToCharMap_[i]] = i;
                    this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
                    this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
                    // Be forgiving when decoding and correctly decode both encodings.
                    if (i >= this.ENCODED_VALS_BASE.length) {
                        this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                        this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
                    }
                }
            }
        }
    };
    /**
     * URL-safe base64 encoding
     */
    const base64Encode = function (str) {
        const utf8Bytes = stringToByteArray$1(str);
        return base64.encodeByteArray(utf8Bytes, true);
    };
    /**
     * URL-safe base64 encoding (without "." padding in the end).
     * e.g. Used in JSON Web Token (JWT) parts.
     */
    const base64urlEncodeWithoutPadding = function (str) {
        // Use base64url encoding and remove padding in the end (dot characters).
        return base64Encode(str).replace(/\./g, '');
    };
    /**
     * URL-safe base64 decoding
     *
     * NOTE: DO NOT use the global atob() function - it does NOT support the
     * base64Url variant encoding.
     *
     * @param str To be decoded
     * @return Decoded result, if possible
     */
    const base64Decode = function (str) {
        try {
            return base64.decodeString(str, true);
        }
        catch (e) {
            console.error('base64Decode failed: ', e);
        }
        return null;
    };
    /**
     * This method checks if indexedDB is supported by current browser/service worker context
     * @return true if indexedDB is supported by current browser/service worker context
     */
    function isIndexedDBAvailable() {
        return typeof indexedDB === 'object';
    }
    /**
     * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
     * if errors occur during the database open operation.
     *
     * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
     * private browsing)
     */
    function validateIndexedDBOpenable() {
        return new Promise((resolve, reject) => {
            try {
                let preExist = true;
                const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
                const request = self.indexedDB.open(DB_CHECK_NAME);
                request.onsuccess = () => {
                    request.result.close();
                    // delete database only when it doesn't pre-exist
                    if (!preExist) {
                        self.indexedDB.deleteDatabase(DB_CHECK_NAME);
                    }
                    resolve(true);
                };
                request.onupgradeneeded = () => {
                    preExist = false;
                };
                request.onerror = () => {
                    var _a;
                    reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || '');
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Polyfill for `globalThis` object.
     * @returns the `globalThis` object for the given environment.
     */
    function getGlobal() {
        if (typeof self !== 'undefined') {
            return self;
        }
        if (typeof window !== 'undefined') {
            return window;
        }
        if (typeof global !== 'undefined') {
            return global;
        }
        throw new Error('Unable to locate global object.');
    }

    /**
     * @license
     * Copyright 2022 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
    /**
     * Attempt to read defaults from a JSON string provided to
     * process.env.__FIREBASE_DEFAULTS__ or a JSON file whose path is in
     * process.env.__FIREBASE_DEFAULTS_PATH__
     */
    const getDefaultsFromEnvVariable = () => {
        if (typeof process === 'undefined') {
            return;
        }
        const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
        const defaultsJsonPath = process.env.__FIREBASE_DEFAULTS_PATH__;
        if (defaultsJsonString) {
            if (defaultsJsonPath) {
                console.warn(`Values were provided for both __FIREBASE_DEFAULTS__ ` +
                    `and __FIREBASE_DEFAULTS_PATH__. __FIREBASE_DEFAULTS_PATH__ ` +
                    `will be ignored.`);
            }
            return JSON.parse(defaultsJsonString);
        }
        if (defaultsJsonPath && typeof require !== 'undefined') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const json = require(defaultsJsonPath);
                return json;
            }
            catch (e) {
                console.warn(`Unable to read defaults from file provided to ` +
                    `__FIREBASE_DEFAULTS_PATH__: ${defaultsJsonPath}`);
            }
        }
    };
    const getDefaultsFromCookie = () => {
        if (typeof document === 'undefined') {
            return;
        }
        const match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
        const decoded = match && base64Decode(match[1]);
        return decoded && JSON.parse(decoded);
    };
    /**
     * Get the __FIREBASE_DEFAULTS__ object. It checks in order:
     * (1) if such an object exists as a property of `globalThis`
     * (2) if such an object was provided on a shell environment variable
     * (3) if such an object exists in a cookie
     */
    const getDefaults = () => getDefaultsFromGlobal() ||
        getDefaultsFromEnvVariable() ||
        getDefaultsFromCookie();
    /**
     * Returns Firebase app config stored in the __FIREBASE_DEFAULTS__ object.
     * @public
     */
    const getDefaultAppConfig = () => { var _a; return (_a = getDefaults()) === null || _a === void 0 ? void 0 : _a.config; };

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Deferred {
        constructor() {
            this.reject = () => { };
            this.resolve = () => { };
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
        /**
         * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
         * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
         * and returns a node-style callback which will resolve or reject the Deferred's promise.
         */
        wrapCallback(callback) {
            return (error, value) => {
                if (error) {
                    this.reject(error);
                }
                else {
                    this.resolve(value);
                }
                if (typeof callback === 'function') {
                    // Attaching noop handler just in case developer wasn't expecting
                    // promises
                    this.promise.catch(() => { });
                    // Some of our callbacks don't expect a value and our own tests
                    // assert that the parameter length is 1
                    if (callback.length === 1) {
                        callback(error);
                    }
                    else {
                        callback(error, value);
                    }
                }
            };
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @fileoverview Standardized Firebase Error.
     *
     * Usage:
     *
     *   // Typescript string literals for type-safe codes
     *   type Err =
     *     'unknown' |
     *     'object-not-found'
     *     ;
     *
     *   // Closure enum for type-safe error codes
     *   // at-enum {string}
     *   var Err = {
     *     UNKNOWN: 'unknown',
     *     OBJECT_NOT_FOUND: 'object-not-found',
     *   }
     *
     *   let errors: Map<Err, string> = {
     *     'generic-error': "Unknown error",
     *     'file-not-found': "Could not find file: {$file}",
     *   };
     *
     *   // Type-safe function - must pass a valid error code as param.
     *   let error = new ErrorFactory<Err>('service', 'Service', errors);
     *
     *   ...
     *   throw error.create(Err.GENERIC);
     *   ...
     *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
     *   ...
     *   // Service: Could not file file: foo.txt (service/file-not-found).
     *
     *   catch (e) {
     *     assert(e.message === "Could not find file: foo.txt.");
     *     if ((e as FirebaseError)?.code === 'service/file-not-found') {
     *       console.log("Could not read file: " + e['file']);
     *     }
     *   }
     */
    const ERROR_NAME = 'FirebaseError';
    // Based on code from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
    class FirebaseError extends Error {
        constructor(
        /** The error code for this error. */
        code, message, 
        /** Custom data for this error. */
        customData) {
            super(message);
            this.code = code;
            this.customData = customData;
            /** The custom name for all FirebaseErrors. */
            this.name = ERROR_NAME;
            // Fix For ES5
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, FirebaseError.prototype);
            // Maintains proper stack trace for where our error was thrown.
            // Only available on V8.
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, ErrorFactory.prototype.create);
            }
        }
    }
    class ErrorFactory {
        constructor(service, serviceName, errors) {
            this.service = service;
            this.serviceName = serviceName;
            this.errors = errors;
        }
        create(code, ...data) {
            const customData = data[0] || {};
            const fullCode = `${this.service}/${code}`;
            const template = this.errors[code];
            const message = template ? replaceTemplate(template, customData) : 'Error';
            // Service Name: Error message (service/code).
            const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
            const error = new FirebaseError(fullCode, fullMessage, customData);
            return error;
        }
    }
    function replaceTemplate(template, data) {
        return template.replace(PATTERN, (_, key) => {
            const value = data[key];
            return value != null ? String(value) : `<${key}?>`;
        });
    }
    const PATTERN = /\{\$([^}]+)}/g;
    /**
     * Deep equal two objects. Support Arrays and Objects.
     */
    function deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        for (const k of aKeys) {
            if (!bKeys.includes(k)) {
                return false;
            }
            const aProp = a[k];
            const bProp = b[k];
            if (isObject(aProp) && isObject(bProp)) {
                if (!deepEqual(aProp, bProp)) {
                    return false;
                }
            }
            else if (aProp !== bProp) {
                return false;
            }
        }
        for (const k of bKeys) {
            if (!aKeys.includes(k)) {
                return false;
            }
        }
        return true;
    }
    function isObject(thing) {
        return thing !== null && typeof thing === 'object';
    }

    /**
     * Component for service name T, e.g. `auth`, `auth-internal`
     */
    class Component {
        /**
         *
         * @param name The public service name, e.g. app, auth, firestore, database
         * @param instanceFactory Service factory responsible for creating the public interface
         * @param type whether the service provided by the component is public or private
         */
        constructor(name, instanceFactory, type) {
            this.name = name;
            this.instanceFactory = instanceFactory;
            this.type = type;
            this.multipleInstances = false;
            /**
             * Properties to be added to the service namespace
             */
            this.serviceProps = {};
            this.instantiationMode = "LAZY" /* LAZY */;
            this.onInstanceCreated = null;
        }
        setInstantiationMode(mode) {
            this.instantiationMode = mode;
            return this;
        }
        setMultipleInstances(multipleInstances) {
            this.multipleInstances = multipleInstances;
            return this;
        }
        setServiceProps(props) {
            this.serviceProps = props;
            return this;
        }
        setInstanceCreatedCallback(callback) {
            this.onInstanceCreated = callback;
            return this;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
     * NameServiceMapping[T] is an alias for the type of the instance
     */
    class Provider {
        constructor(name, container) {
            this.name = name;
            this.container = container;
            this.component = null;
            this.instances = new Map();
            this.instancesDeferred = new Map();
            this.instancesOptions = new Map();
            this.onInitCallbacks = new Map();
        }
        /**
         * @param identifier A provider can provide mulitple instances of a service
         * if this.component.multipleInstances is true.
         */
        get(identifier) {
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            if (!this.instancesDeferred.has(normalizedIdentifier)) {
                const deferred = new Deferred();
                this.instancesDeferred.set(normalizedIdentifier, deferred);
                if (this.isInitialized(normalizedIdentifier) ||
                    this.shouldAutoInitialize()) {
                    // initialize the service if it can be auto-initialized
                    try {
                        const instance = this.getOrInitializeService({
                            instanceIdentifier: normalizedIdentifier
                        });
                        if (instance) {
                            deferred.resolve(instance);
                        }
                    }
                    catch (e) {
                        // when the instance factory throws an exception during get(), it should not cause
                        // a fatal error. We just return the unresolved promise in this case.
                    }
                }
            }
            return this.instancesDeferred.get(normalizedIdentifier).promise;
        }
        getImmediate(options) {
            var _a;
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
            const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                try {
                    return this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                }
                catch (e) {
                    if (optional) {
                        return null;
                    }
                    else {
                        throw e;
                    }
                }
            }
            else {
                // In case a component is not initialized and should/can not be auto-initialized at the moment, return null if the optional flag is set, or throw
                if (optional) {
                    return null;
                }
                else {
                    throw Error(`Service ${this.name} is not available`);
                }
            }
        }
        getComponent() {
            return this.component;
        }
        setComponent(component) {
            if (component.name !== this.name) {
                throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
            }
            if (this.component) {
                throw Error(`Component for ${this.name} has already been provided`);
            }
            this.component = component;
            // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
            if (!this.shouldAutoInitialize()) {
                return;
            }
            // if the service is eager, initialize the default instance
            if (isComponentEager(component)) {
                try {
                    this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
                }
                catch (e) {
                    // when the instance factory for an eager Component throws an exception during the eager
                    // initialization, it should not cause a fatal error.
                    // TODO: Investigate if we need to make it configurable, because some component may want to cause
                    // a fatal error in this case?
                }
            }
            // Create service instances for the pending promises and resolve them
            // NOTE: if this.multipleInstances is false, only the default instance will be created
            // and all promises with resolve with it regardless of the identifier.
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                try {
                    // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    instanceDeferred.resolve(instance);
                }
                catch (e) {
                    // when the instance factory throws an exception, it should not cause
                    // a fatal error. We just leave the promise unresolved.
                }
            }
        }
        clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
            this.instancesDeferred.delete(identifier);
            this.instancesOptions.delete(identifier);
            this.instances.delete(identifier);
        }
        // app.delete() will call this method on every provider to delete the services
        // TODO: should we mark the provider as deleted?
        async delete() {
            const services = Array.from(this.instances.values());
            await Promise.all([
                ...services
                    .filter(service => 'INTERNAL' in service) // legacy services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service.INTERNAL.delete()),
                ...services
                    .filter(service => '_delete' in service) // modularized services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service._delete())
            ]);
        }
        isComponentSet() {
            return this.component != null;
        }
        isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instances.has(identifier);
        }
        getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instancesOptions.get(identifier) || {};
        }
        initialize(opts = {}) {
            const { options = {} } = opts;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
            if (this.isInitialized(normalizedIdentifier)) {
                throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
            }
            if (!this.isComponentSet()) {
                throw Error(`Component ${this.name} has not been registered yet`);
            }
            const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier,
                options
            });
            // resolve any pending promise waiting for the service instance
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                if (normalizedIdentifier === normalizedDeferredIdentifier) {
                    instanceDeferred.resolve(instance);
                }
            }
            return instance;
        }
        /**
         *
         * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
         * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
         *
         * @param identifier An optional instance identifier
         * @returns a function to unregister the callback
         */
        onInit(callback, identifier) {
            var _a;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
            existingCallbacks.add(callback);
            this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
            const existingInstance = this.instances.get(normalizedIdentifier);
            if (existingInstance) {
                callback(existingInstance, normalizedIdentifier);
            }
            return () => {
                existingCallbacks.delete(callback);
            };
        }
        /**
         * Invoke onInit callbacks synchronously
         * @param instance the service instance`
         */
        invokeOnInitCallbacks(instance, identifier) {
            const callbacks = this.onInitCallbacks.get(identifier);
            if (!callbacks) {
                return;
            }
            for (const callback of callbacks) {
                try {
                    callback(instance, identifier);
                }
                catch (_a) {
                    // ignore errors in the onInit callback
                }
            }
        }
        getOrInitializeService({ instanceIdentifier, options = {} }) {
            let instance = this.instances.get(instanceIdentifier);
            if (!instance && this.component) {
                instance = this.component.instanceFactory(this.container, {
                    instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                    options
                });
                this.instances.set(instanceIdentifier, instance);
                this.instancesOptions.set(instanceIdentifier, options);
                /**
                 * Invoke onInit listeners.
                 * Note this.component.onInstanceCreated is different, which is used by the component creator,
                 * while onInit listeners are registered by consumers of the provider.
                 */
                this.invokeOnInitCallbacks(instance, instanceIdentifier);
                /**
                 * Order is important
                 * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
                 * makes `isInitialized()` return true.
                 */
                if (this.component.onInstanceCreated) {
                    try {
                        this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                    }
                    catch (_a) {
                        // ignore errors in the onInstanceCreatedCallback
                    }
                }
            }
            return instance || null;
        }
        normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
            if (this.component) {
                return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
            }
            else {
                return identifier; // assume multiple instances are supported before the component is provided.
            }
        }
        shouldAutoInitialize() {
            return (!!this.component &&
                this.component.instantiationMode !== "EXPLICIT" /* EXPLICIT */);
        }
    }
    // undefined should be passed to the service factory for the default instance
    function normalizeIdentifierForFactory(identifier) {
        return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
    }
    function isComponentEager(component) {
        return component.instantiationMode === "EAGER" /* EAGER */;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
     */
    class ComponentContainer {
        constructor(name) {
            this.name = name;
            this.providers = new Map();
        }
        /**
         *
         * @param component Component being added
         * @param overwrite When a component with the same name has already been registered,
         * if overwrite is true: overwrite the existing component with the new component and create a new
         * provider with the new component. It can be useful in tests where you want to use different mocks
         * for different tests.
         * if overwrite is false: throw an exception
         */
        addComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
            }
            provider.setComponent(component);
        }
        addOrOverwriteComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                // delete the existing provider from the container, so we can register the new component
                this.providers.delete(component.name);
            }
            this.addComponent(component);
        }
        /**
         * getProvider provides a type safe interface where it can only be called with a field name
         * present in NameServiceMapping interface.
         *
         * Firebase SDKs providing services should extend NameServiceMapping interface to register
         * themselves.
         */
        getProvider(name) {
            if (this.providers.has(name)) {
                return this.providers.get(name);
            }
            // create a Provider for a service that hasn't registered with Firebase
            const provider = new Provider(name, this);
            this.providers.set(name, provider);
            return provider;
        }
        getProviders() {
            return Array.from(this.providers.values());
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * A container for all of the Logger instances
     */
    const instances = [];
    /**
     * The JS SDK supports 5 log levels and also allows a user the ability to
     * silence the logs altogether.
     *
     * The order is a follows:
     * DEBUG < VERBOSE < INFO < WARN < ERROR
     *
     * All of the log types above the current log level will be captured (i.e. if
     * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
     * `VERBOSE` logs will not)
     */
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
        LogLevel[LogLevel["INFO"] = 2] = "INFO";
        LogLevel[LogLevel["WARN"] = 3] = "WARN";
        LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
        LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
    })(LogLevel || (LogLevel = {}));
    const levelStringToEnum = {
        'debug': LogLevel.DEBUG,
        'verbose': LogLevel.VERBOSE,
        'info': LogLevel.INFO,
        'warn': LogLevel.WARN,
        'error': LogLevel.ERROR,
        'silent': LogLevel.SILENT
    };
    /**
     * The default log level
     */
    const defaultLogLevel = LogLevel.INFO;
    /**
     * By default, `console.debug` is not displayed in the developer console (in
     * chrome). To avoid forcing users to have to opt-in to these logs twice
     * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
     * logs to the `console.log` function.
     */
    const ConsoleMethod = {
        [LogLevel.DEBUG]: 'log',
        [LogLevel.VERBOSE]: 'log',
        [LogLevel.INFO]: 'info',
        [LogLevel.WARN]: 'warn',
        [LogLevel.ERROR]: 'error'
    };
    /**
     * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
     * messages on to their corresponding console counterparts (if the log method
     * is supported by the current log level)
     */
    const defaultLogHandler = (instance, logType, ...args) => {
        if (logType < instance.logLevel) {
            return;
        }
        const now = new Date().toISOString();
        const method = ConsoleMethod[logType];
        if (method) {
            console[method](`[${now}]  ${instance.name}:`, ...args);
        }
        else {
            throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
        }
    };
    class Logger {
        /**
         * Gives you an instance of a Logger to capture messages according to
         * Firebase's logging scheme.
         *
         * @param name The name that the logs will be associated with
         */
        constructor(name) {
            this.name = name;
            /**
             * The log level of the given Logger instance.
             */
            this._logLevel = defaultLogLevel;
            /**
             * The main (internal) log handler for the Logger instance.
             * Can be set to a new function in internal package code but not by user.
             */
            this._logHandler = defaultLogHandler;
            /**
             * The optional, additional, user-defined log handler for the Logger instance.
             */
            this._userLogHandler = null;
            /**
             * Capture the current instance for later use
             */
            instances.push(this);
        }
        get logLevel() {
            return this._logLevel;
        }
        set logLevel(val) {
            if (!(val in LogLevel)) {
                throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
            }
            this._logLevel = val;
        }
        // Workaround for setter/getter having to be the same type.
        setLogLevel(val) {
            this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
        }
        get logHandler() {
            return this._logHandler;
        }
        set logHandler(val) {
            if (typeof val !== 'function') {
                throw new TypeError('Value assigned to `logHandler` must be a function');
            }
            this._logHandler = val;
        }
        get userLogHandler() {
            return this._userLogHandler;
        }
        set userLogHandler(val) {
            this._userLogHandler = val;
        }
        /**
         * The functions below are all based on the `console` interface
         */
        debug(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
            this._logHandler(this, LogLevel.DEBUG, ...args);
        }
        log(...args) {
            this._userLogHandler &&
                this._userLogHandler(this, LogLevel.VERBOSE, ...args);
            this._logHandler(this, LogLevel.VERBOSE, ...args);
        }
        info(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
            this._logHandler(this, LogLevel.INFO, ...args);
        }
        warn(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
            this._logHandler(this, LogLevel.WARN, ...args);
        }
        error(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
            this._logHandler(this, LogLevel.ERROR, ...args);
        }
    }
    function setLogLevel$1(level) {
        instances.forEach(inst => {
            inst.setLogLevel(level);
        });
    }
    function setUserLogHandler(logCallback, options) {
        for (const instance of instances) {
            let customLogLevel = null;
            if (options && options.level) {
                customLogLevel = levelStringToEnum[options.level];
            }
            if (logCallback === null) {
                instance.userLogHandler = null;
            }
            else {
                instance.userLogHandler = (instance, level, ...args) => {
                    const message = args
                        .map(arg => {
                        if (arg == null) {
                            return null;
                        }
                        else if (typeof arg === 'string') {
                            return arg;
                        }
                        else if (typeof arg === 'number' || typeof arg === 'boolean') {
                            return arg.toString();
                        }
                        else if (arg instanceof Error) {
                            return arg.message;
                        }
                        else {
                            try {
                                return JSON.stringify(arg);
                            }
                            catch (ignored) {
                                return null;
                            }
                        }
                    })
                        .filter(arg => arg)
                        .join(' ');
                    if (level >= (customLogLevel !== null && customLogLevel !== void 0 ? customLogLevel : instance.logLevel)) {
                        logCallback({
                            level: LogLevel[level].toLowerCase(),
                            message,
                            args,
                            type: instance.name
                        });
                    }
                };
            }
        }
    }

    const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

    let idbProxyableTypes;
    let cursorAdvanceMethods;
    // This is a function to prevent it throwing up in node environments.
    function getIdbProxyableTypes() {
        return (idbProxyableTypes ||
            (idbProxyableTypes = [
                IDBDatabase,
                IDBObjectStore,
                IDBIndex,
                IDBCursor,
                IDBTransaction,
            ]));
    }
    // This is a function to prevent it throwing up in node environments.
    function getCursorAdvanceMethods() {
        return (cursorAdvanceMethods ||
            (cursorAdvanceMethods = [
                IDBCursor.prototype.advance,
                IDBCursor.prototype.continue,
                IDBCursor.prototype.continuePrimaryKey,
            ]));
    }
    const cursorRequestMap = new WeakMap();
    const transactionDoneMap = new WeakMap();
    const transactionStoreNamesMap = new WeakMap();
    const transformCache = new WeakMap();
    const reverseTransformCache = new WeakMap();
    function promisifyRequest(request) {
        const promise = new Promise((resolve, reject) => {
            const unlisten = () => {
                request.removeEventListener('success', success);
                request.removeEventListener('error', error);
            };
            const success = () => {
                resolve(wrap(request.result));
                unlisten();
            };
            const error = () => {
                reject(request.error);
                unlisten();
            };
            request.addEventListener('success', success);
            request.addEventListener('error', error);
        });
        promise
            .then((value) => {
            // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
            // (see wrapFunction).
            if (value instanceof IDBCursor) {
                cursorRequestMap.set(value, request);
            }
            // Catching to avoid "Uncaught Promise exceptions"
        })
            .catch(() => { });
        // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
        // is because we create many promises from a single IDBRequest.
        reverseTransformCache.set(promise, request);
        return promise;
    }
    function cacheDonePromiseForTransaction(tx) {
        // Early bail if we've already created a done promise for this transaction.
        if (transactionDoneMap.has(tx))
            return;
        const done = new Promise((resolve, reject) => {
            const unlisten = () => {
                tx.removeEventListener('complete', complete);
                tx.removeEventListener('error', error);
                tx.removeEventListener('abort', error);
            };
            const complete = () => {
                resolve();
                unlisten();
            };
            const error = () => {
                reject(tx.error || new DOMException('AbortError', 'AbortError'));
                unlisten();
            };
            tx.addEventListener('complete', complete);
            tx.addEventListener('error', error);
            tx.addEventListener('abort', error);
        });
        // Cache it for later retrieval.
        transactionDoneMap.set(tx, done);
    }
    let idbProxyTraps = {
        get(target, prop, receiver) {
            if (target instanceof IDBTransaction) {
                // Special handling for transaction.done.
                if (prop === 'done')
                    return transactionDoneMap.get(target);
                // Polyfill for objectStoreNames because of Edge.
                if (prop === 'objectStoreNames') {
                    return target.objectStoreNames || transactionStoreNamesMap.get(target);
                }
                // Make tx.store return the only store in the transaction, or undefined if there are many.
                if (prop === 'store') {
                    return receiver.objectStoreNames[1]
                        ? undefined
                        : receiver.objectStore(receiver.objectStoreNames[0]);
                }
            }
            // Else transform whatever we get back.
            return wrap(target[prop]);
        },
        set(target, prop, value) {
            target[prop] = value;
            return true;
        },
        has(target, prop) {
            if (target instanceof IDBTransaction &&
                (prop === 'done' || prop === 'store')) {
                return true;
            }
            return prop in target;
        },
    };
    function replaceTraps(callback) {
        idbProxyTraps = callback(idbProxyTraps);
    }
    function wrapFunction(func) {
        // Due to expected object equality (which is enforced by the caching in `wrap`), we
        // only create one new func per func.
        // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
        if (func === IDBDatabase.prototype.transaction &&
            !('objectStoreNames' in IDBTransaction.prototype)) {
            return function (storeNames, ...args) {
                const tx = func.call(unwrap(this), storeNames, ...args);
                transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
                return wrap(tx);
            };
        }
        // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
        // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
        // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
        // with real promises, so each advance methods returns a new promise for the cursor object, or
        // undefined if the end of the cursor has been reached.
        if (getCursorAdvanceMethods().includes(func)) {
            return function (...args) {
                // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
                // the original object.
                func.apply(unwrap(this), args);
                return wrap(cursorRequestMap.get(this));
            };
        }
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            return wrap(func.apply(unwrap(this), args));
        };
    }
    function transformCachableValue(value) {
        if (typeof value === 'function')
            return wrapFunction(value);
        // This doesn't return, it just creates a 'done' promise for the transaction,
        // which is later returned for transaction.done (see idbObjectHandler).
        if (value instanceof IDBTransaction)
            cacheDonePromiseForTransaction(value);
        if (instanceOfAny(value, getIdbProxyableTypes()))
            return new Proxy(value, idbProxyTraps);
        // Return the same value back if we're not going to transform it.
        return value;
    }
    function wrap(value) {
        // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
        // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
        if (value instanceof IDBRequest)
            return promisifyRequest(value);
        // If we've already transformed this value before, reuse the transformed value.
        // This is faster, but it also provides object equality.
        if (transformCache.has(value))
            return transformCache.get(value);
        const newValue = transformCachableValue(value);
        // Not all types are transformed.
        // These may be primitive types, so they can't be WeakMap keys.
        if (newValue !== value) {
            transformCache.set(value, newValue);
            reverseTransformCache.set(newValue, value);
        }
        return newValue;
    }
    const unwrap = (value) => reverseTransformCache.get(value);

    /**
     * Open a database.
     *
     * @param name Name of the database.
     * @param version Schema version.
     * @param callbacks Additional callbacks.
     */
    function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
        const request = indexedDB.open(name, version);
        const openPromise = wrap(request);
        if (upgrade) {
            request.addEventListener('upgradeneeded', (event) => {
                upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction));
            });
        }
        if (blocked)
            request.addEventListener('blocked', () => blocked());
        openPromise
            .then((db) => {
            if (terminated)
                db.addEventListener('close', () => terminated());
            if (blocking)
                db.addEventListener('versionchange', () => blocking());
        })
            .catch(() => { });
        return openPromise;
    }

    const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
    const writeMethods = ['put', 'add', 'delete', 'clear'];
    const cachedMethods = new Map();
    function getMethod(target, prop) {
        if (!(target instanceof IDBDatabase &&
            !(prop in target) &&
            typeof prop === 'string')) {
            return;
        }
        if (cachedMethods.get(prop))
            return cachedMethods.get(prop);
        const targetFuncName = prop.replace(/FromIndex$/, '');
        const useIndex = prop !== targetFuncName;
        const isWrite = writeMethods.includes(targetFuncName);
        if (
        // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
        !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
            !(isWrite || readMethods.includes(targetFuncName))) {
            return;
        }
        const method = async function (storeName, ...args) {
            // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
            const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
            let target = tx.store;
            if (useIndex)
                target = target.index(args.shift());
            // Must reject if op rejects.
            // If it's a write operation, must reject if tx.done rejects.
            // Must reject with op rejection first.
            // Must resolve with op value.
            // Must handle both promises (no unhandled rejections)
            return (await Promise.all([
                target[targetFuncName](...args),
                isWrite && tx.done,
            ]))[0];
        };
        cachedMethods.set(prop, method);
        return method;
    }
    replaceTraps((oldTraps) => ({
        ...oldTraps,
        get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
        has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
    }));

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class PlatformLoggerServiceImpl {
        constructor(container) {
            this.container = container;
        }
        // In initial implementation, this will be called by installations on
        // auth token refresh, and installations will send this string.
        getPlatformInfoString() {
            const providers = this.container.getProviders();
            // Loop through providers and get library/version pairs from any that are
            // version components.
            return providers
                .map(provider => {
                if (isVersionServiceProvider(provider)) {
                    const service = provider.getImmediate();
                    return `${service.library}/${service.version}`;
                }
                else {
                    return null;
                }
            })
                .filter(logString => logString)
                .join(' ');
        }
    }
    /**
     *
     * @param provider check if this provider provides a VersionService
     *
     * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
     * provides VersionService. The provider is not necessarily a 'app-version'
     * provider.
     */
    function isVersionServiceProvider(provider) {
        const component = provider.getComponent();
        return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* VERSION */;
    }

    const name$o = "https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js";
    const version$1 = "0.8.0";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logger = new Logger('https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js');

    const name$n = "@firebase/app-compat";

    const name$m = "@firebase/analytics-compat";

    const name$l = "@firebase/analytics";

    const name$k = "@firebase/app-check-compat";

    const name$j = "@firebase/app-check";

    const name$i = "@firebase/auth";

    const name$h = "@firebase/auth-compat";

    const name$g = "@firebase/database";

    const name$f = "@firebase/database-compat";

    const name$e = "@firebase/functions";

    const name$d = "@firebase/functions-compat";

    const name$c = "@firebase/installations";

    const name$b = "@firebase/installations-compat";

    const name$a = "@firebase/messaging";

    const name$9 = "@firebase/messaging-compat";

    const name$8 = "@firebase/performance";

    const name$7 = "@firebase/performance-compat";

    const name$6 = "@firebase/remote-config";

    const name$5 = "@firebase/remote-config-compat";

    const name$4 = "@firebase/storage";

    const name$3 = "@firebase/storage-compat";

    const name$2 = "@firebase/firestore";

    const name$1 = "@firebase/firestore-compat";

    const name$p = "firebase";
    const version$2 = "9.11.0";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The default app name
     *
     * @internal
     */
    const DEFAULT_ENTRY_NAME = '[DEFAULT]';
    const PLATFORM_LOG_STRING = {
        [name$o]: 'fire-core',
        [name$n]: 'fire-core-compat',
        [name$l]: 'fire-analytics',
        [name$m]: 'fire-analytics-compat',
        [name$j]: 'fire-app-check',
        [name$k]: 'fire-app-check-compat',
        [name$i]: 'fire-auth',
        [name$h]: 'fire-auth-compat',
        [name$g]: 'fire-rtdb',
        [name$f]: 'fire-rtdb-compat',
        [name$e]: 'fire-fn',
        [name$d]: 'fire-fn-compat',
        [name$c]: 'fire-iid',
        [name$b]: 'fire-iid-compat',
        [name$a]: 'fire-fcm',
        [name$9]: 'fire-fcm-compat',
        [name$8]: 'fire-perf',
        [name$7]: 'fire-perf-compat',
        [name$6]: 'fire-rc',
        [name$5]: 'fire-rc-compat',
        [name$4]: 'fire-gcs',
        [name$3]: 'fire-gcs-compat',
        [name$2]: 'fire-fst',
        [name$1]: 'fire-fst-compat',
        'fire-js': 'fire-js',
        [name$p]: 'fire-js-all'
    };

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @internal
     */
    const _apps = new Map();
    /**
     * Registered components.
     *
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _components = new Map();
    /**
     * @param component - the component being added to this app's container
     *
     * @internal
     */
    function _addComponent(app, component) {
        try {
            app.container.addComponent(component);
        }
        catch (e) {
            logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
        }
    }
    /**
     *
     * @internal
     */
    function _addOrOverwriteComponent(app, component) {
        app.container.addOrOverwriteComponent(component);
    }
    /**
     *
     * @param component - the component to register
     * @returns whether or not the component is registered successfully
     *
     * @internal
     */
    function _registerComponent(component) {
        const componentName = component.name;
        if (_components.has(componentName)) {
            logger.debug(`There were multiple attempts to register component ${componentName}.`);
            return false;
        }
        _components.set(componentName, component);
        // add the component to existing app instances
        for (const app of _apps.values()) {
            _addComponent(app, component);
        }
        return true;
    }
    /**
     *
     * @param app - FirebaseApp instance
     * @param name - service name
     *
     * @returns the provider for the service with the matching name
     *
     * @internal
     */
    function _getProvider(app, name) {
        const heartbeatController = app.container
            .getProvider('heartbeat')
            .getImmediate({ optional: true });
        if (heartbeatController) {
            void heartbeatController.triggerHeartbeat();
        }
        return app.container.getProvider(name);
    }
    /**
     *
     * @param app - FirebaseApp instance
     * @param name - service name
     * @param instanceIdentifier - service instance identifier in case the service supports multiple instances
     *
     * @internal
     */
    function _removeServiceInstance(app, name, instanceIdentifier = DEFAULT_ENTRY_NAME) {
        _getProvider(app, name).clearInstance(instanceIdentifier);
    }
    /**
     * Test only
     *
     * @internal
     */
    function _clearComponents() {
        _components.clear();
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERRORS = {
        ["no-app" /* NO_APP */]: "No Firebase App '{$appName}' has been created - " +
            'call Firebase App.initializeApp()',
        ["bad-app-name" /* BAD_APP_NAME */]: "Illegal App name: '{$appName}",
        ["duplicate-app" /* DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
        ["app-deleted" /* APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
        ["no-options" /* NO_OPTIONS */]: 'Need to provide options, when not being deployed to hosting via source.',
        ["invalid-app-argument" /* INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
            'Firebase App instance.',
        ["invalid-log-argument" /* INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.',
        ["idb-open" /* IDB_OPEN */]: 'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',
        ["idb-get" /* IDB_GET */]: 'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',
        ["idb-set" /* IDB_WRITE */]: 'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',
        ["idb-delete" /* IDB_DELETE */]: 'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.'
    };
    const ERROR_FACTORY = new ErrorFactory('app', 'Firebase', ERRORS);

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class FirebaseAppImpl {
        constructor(options, config, container) {
            this._isDeleted = false;
            this._options = Object.assign({}, options);
            this._config = Object.assign({}, config);
            this._name = config.name;
            this._automaticDataCollectionEnabled =
                config.automaticDataCollectionEnabled;
            this._container = container;
            this.container.addComponent(new Component('app', () => this, "PUBLIC" /* PUBLIC */));
        }
        get automaticDataCollectionEnabled() {
            this.checkDestroyed();
            return this._automaticDataCollectionEnabled;
        }
        set automaticDataCollectionEnabled(val) {
            this.checkDestroyed();
            this._automaticDataCollectionEnabled = val;
        }
        get name() {
            this.checkDestroyed();
            return this._name;
        }
        get options() {
            this.checkDestroyed();
            return this._options;
        }
        get config() {
            this.checkDestroyed();
            return this._config;
        }
        get container() {
            return this._container;
        }
        get isDeleted() {
            return this._isDeleted;
        }
        set isDeleted(val) {
            this._isDeleted = val;
        }
        /**
         * This function will throw an Error if the App has already been deleted -
         * use before performing API actions on the App.
         */
        checkDestroyed() {
            if (this.isDeleted) {
                throw ERROR_FACTORY.create("app-deleted" /* APP_DELETED */, { appName: this._name });
            }
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The current SDK version.
     *
     * @public
     */
    const SDK_VERSION = version$2;
    function initializeApp(_options, rawConfig = {}) {
        let options = _options;
        if (typeof rawConfig !== 'object') {
            const name = rawConfig;
            rawConfig = { name };
        }
        const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
        const name = config.name;
        if (typeof name !== 'string' || !name) {
            throw ERROR_FACTORY.create("bad-app-name" /* BAD_APP_NAME */, {
                appName: String(name)
            });
        }
        options || (options = getDefaultAppConfig());
        if (!options) {
            throw ERROR_FACTORY.create("no-options" /* NO_OPTIONS */);
        }
        const existingApp = _apps.get(name);
        if (existingApp) {
            // return the existing app if options and config deep equal the ones in the existing app.
            if (deepEqual(options, existingApp.options) &&
                deepEqual(config, existingApp.config)) {
                return existingApp;
            }
            else {
                throw ERROR_FACTORY.create("duplicate-app" /* DUPLICATE_APP */, { appName: name });
            }
        }
        const container = new ComponentContainer(name);
        for (const component of _components.values()) {
            container.addComponent(component);
        }
        const newApp = new FirebaseAppImpl(options, config, container);
        _apps.set(name, newApp);
        return newApp;
    }
    /**
     * Retrieves a {@link @firebase/app#FirebaseApp} instance.
     *
     * When called with no arguments, the default app is returned. When an app name
     * is provided, the app corresponding to that name is returned.
     *
     * An exception is thrown if the app being retrieved has not yet been
     * initialized.
     *
     * @example
     * ```javascript
     * // Return the default app
     * const app = getApp();
     * ```
     *
     * @example
     * ```javascript
     * // Return a named app
     * const otherApp = getApp("otherApp");
     * ```
     *
     * @param name - Optional name of the app to return. If no name is
     *   provided, the default is `"[DEFAULT]"`.
     *
     * @returns The app corresponding to the provided app name.
     *   If no app name is provided, the default app is returned.
     *
     * @public
     */
    function getApp(name = DEFAULT_ENTRY_NAME) {
        const app = _apps.get(name);
        if (!app && name === DEFAULT_ENTRY_NAME) {
            return initializeApp();
        }
        if (!app) {
            throw ERROR_FACTORY.create("no-app" /* NO_APP */, { appName: name });
        }
        return app;
    }
    /**
     * A (read-only) array of all initialized apps.
     * @public
     */
    function getApps() {
        return Array.from(_apps.values());
    }
    /**
     * Renders this app unusable and frees the resources of all associated
     * services.
     *
     * @example
     * ```javascript
     * deleteApp(app)
     *   .then(function() {
     *     console.log("App deleted successfully");
     *   })
     *   .catch(function(error) {
     *     console.log("Error deleting app:", error);
     *   });
     * ```
     *
     * @public
     */
    async function deleteApp(app) {
        const name = app.name;
        if (_apps.has(name)) {
            _apps.delete(name);
            await Promise.all(app.container
                .getProviders()
                .map(provider => provider.delete()));
            app.isDeleted = true;
        }
    }
    /**
     * Registers a library's name and version for platform logging purposes.
     * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
     * @param version - Current version of that library.
     * @param variant - Bundle variant, e.g., node, rn, etc.
     *
     * @public
     */
    function registerVersion(libraryKeyOrName, version, variant) {
        var _a;
        // TODO: We can use this check to whitelist strings when/if we set up
        // a good whitelist system.
        let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
        if (variant) {
            library += `-${variant}`;
        }
        const libraryMismatch = library.match(/\s|\//);
        const versionMismatch = version.match(/\s|\//);
        if (libraryMismatch || versionMismatch) {
            const warning = [
                `Unable to register library "${library}" with version "${version}":`
            ];
            if (libraryMismatch) {
                warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
            }
            if (libraryMismatch && versionMismatch) {
                warning.push('and');
            }
            if (versionMismatch) {
                warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
            }
            logger.warn(warning.join(' '));
            return;
        }
        _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* VERSION */));
    }
    /**
     * Sets log handler for all Firebase SDKs.
     * @param logCallback - An optional custom log handler that executes user code whenever
     * the Firebase SDK makes a logging call.
     *
     * @public
     */
    function onLog(logCallback, options) {
        if (logCallback !== null && typeof logCallback !== 'function') {
            throw ERROR_FACTORY.create("invalid-log-argument" /* INVALID_LOG_ARGUMENT */);
        }
        setUserLogHandler(logCallback, options);
    }
    /**
     * Sets log level for all Firebase SDKs.
     *
     * All of the log types above the current log level are captured (i.e. if
     * you set the log level to `info`, errors are logged, but `debug` and
     * `verbose` logs are not).
     *
     * @public
     */
    function setLogLevel(logLevel) {
        setLogLevel$1(logLevel);
    }

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DB_NAME = 'firebase-heartbeat-database';
    const DB_VERSION = 1;
    const STORE_NAME = 'firebase-heartbeat-store';
    let dbPromise = null;
    function getDbPromise() {
        if (!dbPromise) {
            dbPromise = openDB(DB_NAME, DB_VERSION, {
                upgrade: (db, oldVersion) => {
                    // We don't use 'break' in this switch statement, the fall-through
                    // behavior is what we want, because if there are multiple versions between
                    // the old version and the current version, we want ALL the migrations
                    // that correspond to those versions to run, not only the last one.
                    // eslint-disable-next-line default-case
                    switch (oldVersion) {
                        case 0:
                            db.createObjectStore(STORE_NAME);
                    }
                }
            }).catch(e => {
                throw ERROR_FACTORY.create("idb-open" /* IDB_OPEN */, {
                    originalErrorMessage: e.message
                });
            });
        }
        return dbPromise;
    }
    async function readHeartbeatsFromIndexedDB(app) {
        var _a;
        try {
            const db = await getDbPromise();
            return db
                .transaction(STORE_NAME)
                .objectStore(STORE_NAME)
                .get(computeKey(app));
        }
        catch (e) {
            if (e instanceof FirebaseError) {
                logger.warn(e.message);
            }
            else {
                const idbGetError = ERROR_FACTORY.create("idb-get" /* IDB_GET */, {
                    originalErrorMessage: (_a = e) === null || _a === void 0 ? void 0 : _a.message
                });
                logger.warn(idbGetError.message);
            }
        }
    }
    async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
        var _a;
        try {
            const db = await getDbPromise();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const objectStore = tx.objectStore(STORE_NAME);
            await objectStore.put(heartbeatObject, computeKey(app));
            return tx.done;
        }
        catch (e) {
            if (e instanceof FirebaseError) {
                logger.warn(e.message);
            }
            else {
                const idbGetError = ERROR_FACTORY.create("idb-set" /* IDB_WRITE */, {
                    originalErrorMessage: (_a = e) === null || _a === void 0 ? void 0 : _a.message
                });
                logger.warn(idbGetError.message);
            }
        }
    }
    function computeKey(app) {
        return `${app.name}!${app.options.appId}`;
    }

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const MAX_HEADER_BYTES = 1024;
    // 30 days
    const STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;
    class HeartbeatServiceImpl {
        constructor(container) {
            this.container = container;
            /**
             * In-memory cache for heartbeats, used by getHeartbeatsHeader() to generate
             * the header string.
             * Stores one record per date. This will be consolidated into the standard
             * format of one record per user agent string before being sent as a header.
             * Populated from indexedDB when the controller is instantiated and should
             * be kept in sync with indexedDB.
             * Leave public for easier testing.
             */
            this._heartbeatsCache = null;
            const app = this.container.getProvider('app').getImmediate();
            this._storage = new HeartbeatStorageImpl(app);
            this._heartbeatsCachePromise = this._storage.read().then(result => {
                this._heartbeatsCache = result;
                return result;
            });
        }
        /**
         * Called to report a heartbeat. The function will generate
         * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
         * to IndexedDB.
         * Note that we only store one heartbeat per day. So if a heartbeat for today is
         * already logged, subsequent calls to this function in the same day will be ignored.
         */
        async triggerHeartbeat() {
            const platformLogger = this.container
                .getProvider('platform-logger')
                .getImmediate();
            // This is the "Firebase user agent" string from the platform logger
            // service, not the browser user agent.
            const agent = platformLogger.getPlatformInfoString();
            const date = getUTCDateString();
            if (this._heartbeatsCache === null) {
                this._heartbeatsCache = await this._heartbeatsCachePromise;
            }
            // Do not store a heartbeat if one is already stored for this day
            // or if a header has already been sent today.
            if (this._heartbeatsCache.lastSentHeartbeatDate === date ||
                this._heartbeatsCache.heartbeats.some(singleDateHeartbeat => singleDateHeartbeat.date === date)) {
                return;
            }
            else {
                // There is no entry for this date. Create one.
                this._heartbeatsCache.heartbeats.push({ date, agent });
            }
            // Remove entries older than 30 days.
            this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter(singleDateHeartbeat => {
                const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
                const now = Date.now();
                return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
            });
            return this._storage.overwrite(this._heartbeatsCache);
        }
        /**
         * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
         * It also clears all heartbeats from memory as well as in IndexedDB.
         *
         * NOTE: Consuming product SDKs should not send the header if this method
         * returns an empty string.
         */
        async getHeartbeatsHeader() {
            if (this._heartbeatsCache === null) {
                await this._heartbeatsCachePromise;
            }
            // If it's still null or the array is empty, there is no data to send.
            if (this._heartbeatsCache === null ||
                this._heartbeatsCache.heartbeats.length === 0) {
                return '';
            }
            const date = getUTCDateString();
            // Extract as many heartbeats from the cache as will fit under the size limit.
            const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
            const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
            // Store last sent date to prevent another being logged/sent for the same day.
            this._heartbeatsCache.lastSentHeartbeatDate = date;
            if (unsentEntries.length > 0) {
                // Store any unsent entries if they exist.
                this._heartbeatsCache.heartbeats = unsentEntries;
                // This seems more likely than emptying the array (below) to lead to some odd state
                // since the cache isn't empty and this will be called again on the next request,
                // and is probably safest if we await it.
                await this._storage.overwrite(this._heartbeatsCache);
            }
            else {
                this._heartbeatsCache.heartbeats = [];
                // Do not wait for this, to reduce latency.
                void this._storage.overwrite(this._heartbeatsCache);
            }
            return headerString;
        }
    }
    function getUTCDateString() {
        const today = new Date();
        // Returns date format 'YYYY-MM-DD'
        return today.toISOString().substring(0, 10);
    }
    function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
        // Heartbeats grouped by user agent in the standard format to be sent in
        // the header.
        const heartbeatsToSend = [];
        // Single date format heartbeats that are not sent.
        let unsentEntries = heartbeatsCache.slice();
        for (const singleDateHeartbeat of heartbeatsCache) {
            // Look for an existing entry with the same user agent.
            const heartbeatEntry = heartbeatsToSend.find(hb => hb.agent === singleDateHeartbeat.agent);
            if (!heartbeatEntry) {
                // If no entry for this user agent exists, create one.
                heartbeatsToSend.push({
                    agent: singleDateHeartbeat.agent,
                    dates: [singleDateHeartbeat.date]
                });
                if (countBytes(heartbeatsToSend) > maxSize) {
                    // If the header would exceed max size, remove the added heartbeat
                    // entry and stop adding to the header.
                    heartbeatsToSend.pop();
                    break;
                }
            }
            else {
                heartbeatEntry.dates.push(singleDateHeartbeat.date);
                // If the header would exceed max size, remove the added date
                // and stop adding to the header.
                if (countBytes(heartbeatsToSend) > maxSize) {
                    heartbeatEntry.dates.pop();
                    break;
                }
            }
            // Pop unsent entry from queue. (Skipped if adding the entry exceeded
            // quota and the loop breaks early.)
            unsentEntries = unsentEntries.slice(1);
        }
        return {
            heartbeatsToSend,
            unsentEntries
        };
    }
    class HeartbeatStorageImpl {
        constructor(app) {
            this.app = app;
            this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
        }
        async runIndexedDBEnvironmentCheck() {
            if (!isIndexedDBAvailable()) {
                return false;
            }
            else {
                return validateIndexedDBOpenable()
                    .then(() => true)
                    .catch(() => false);
            }
        }
        /**
         * Read all heartbeats.
         */
        async read() {
            const canUseIndexedDB = await this._canUseIndexedDBPromise;
            if (!canUseIndexedDB) {
                return { heartbeats: [] };
            }
            else {
                const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
                return idbHeartbeatObject || { heartbeats: [] };
            }
        }
        // overwrite the storage with the provided heartbeats
        async overwrite(heartbeatsObject) {
            var _a;
            const canUseIndexedDB = await this._canUseIndexedDBPromise;
            if (!canUseIndexedDB) {
                return;
            }
            else {
                const existingHeartbeatsObject = await this.read();
                return writeHeartbeatsToIndexedDB(this.app, {
                    lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
                    heartbeats: heartbeatsObject.heartbeats
                });
            }
        }
        // add heartbeats
        async add(heartbeatsObject) {
            var _a;
            const canUseIndexedDB = await this._canUseIndexedDBPromise;
            if (!canUseIndexedDB) {
                return;
            }
            else {
                const existingHeartbeatsObject = await this.read();
                return writeHeartbeatsToIndexedDB(this.app, {
                    lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== void 0 ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
                    heartbeats: [
                        ...existingHeartbeatsObject.heartbeats,
                        ...heartbeatsObject.heartbeats
                    ]
                });
            }
        }
    }
    /**
     * Calculate bytes of a HeartbeatsByUserAgent array after being wrapped
     * in a platform logging header JSON object, stringified, and converted
     * to base 64.
     */
    function countBytes(heartbeatsCache) {
        // base64 has a restricted set of characters, all of which should be 1 byte.
        return base64urlEncodeWithoutPadding(
        // heartbeatsCache wrapper properties
        JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function registerCoreComponents(variant) {
        _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* PRIVATE */));
        _registerComponent(new Component('heartbeat', container => new HeartbeatServiceImpl(container), "PRIVATE" /* PRIVATE */));
        // Register `app` package.
        registerVersion(name$o, version$1, variant);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name$o, version$1, 'esm2017');
        // Register platform SDK identifier (no version).
        registerVersion('fire-js', '');
    }

    /**
     * Firebase App
     *
     * @remarks This package coordinates the communication between the different Firebase components
     * @packageDocumentation
     */
    registerCoreComponents('');

    var name = "firebase";
    var version = "9.11.0";

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    registerVersion(name, version, 'cdn');

    var firebase_app = /*#__PURE__*/Object.freeze({
        __proto__: null,
        FirebaseError: FirebaseError,
        SDK_VERSION: SDK_VERSION,
        _DEFAULT_ENTRY_NAME: DEFAULT_ENTRY_NAME,
        _addComponent: _addComponent,
        _addOrOverwriteComponent: _addOrOverwriteComponent,
        _apps: _apps,
        _clearComponents: _clearComponents,
        _components: _components,
        _getProvider: _getProvider,
        _registerComponent: _registerComponent,
        _removeServiceInstance: _removeServiceInstance,
        deleteApp: deleteApp,
        getApp: getApp,
        getApps: getApps,
        initializeApp: initializeApp,
        onLog: onLog,
        registerVersion: registerVersion,
        setLogLevel: setLogLevel
    });

    const o$2={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const r=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let t=0;t<e.length;t+=3){const o=e[t],i=t+1<e.length,a=i?e[t+1]:0,s=t+2<e.length,c=s?e[t+2]:0,h=o>>2,l=(3&o)<<4|a>>4;let u=(15&a)<<2|c>>6,p=63&c;s||(p=64,i||(u=64)),n.push(r[h],r[l],r[u],r[p]);}return n.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(function(e){const t=[];let r=0;for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);o<128?t[r++]=o:o<2048?(t[r++]=o>>6|192,t[r++]=63&o|128):55296==(64512&o)&&n+1<e.length&&56320==(64512&e.charCodeAt(n+1))?(o=65536+((1023&o)<<10)+(1023&e.charCodeAt(++n)),t[r++]=o>>18|240,t[r++]=o>>12&63|128,t[r++]=o>>6&63|128,t[r++]=63&o|128):(t[r++]=o>>12|224,t[r++]=o>>6&63|128,t[r++]=63&o|128);}return t}(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):function(e){const t=[];let r=0,n=0;for(;r<e.length;){const o=e[r++];if(o<128)t[n++]=String.fromCharCode(o);else if(o>191&&o<224){const i=e[r++];t[n++]=String.fromCharCode((31&o)<<6|63&i);}else if(o>239&&o<365){const i=((7&o)<<18|(63&e[r++])<<12|(63&e[r++])<<6|63&e[r++])-65536;t[n++]=String.fromCharCode(55296+(i>>10)),t[n++]=String.fromCharCode(56320+(1023&i));}else {const i=e[r++],a=e[r++];t[n++]=String.fromCharCode((15&o)<<12|(63&i)<<6|63&a);}}return t.join("")}(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const r=t?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let t=0;t<e.length;){const o=r[e.charAt(t++)],i=t<e.length?r[e.charAt(t)]:0;++t;const a=t<e.length?r[e.charAt(t)]:64;++t;const s=t<e.length?r[e.charAt(t)]:64;if(++t,null==o||null==i||null==a||null==s)throw Error();const c=o<<2|i>>4;if(n.push(c),64!==a){const e=i<<4&240|a>>2;if(n.push(e),64!==s){const e=a<<6&192|s;n.push(e);}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e);}}},i$1=function(e){try{return o$2.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e);}return null};function a$2(){return "object"==typeof indexedDB}class s{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t;}));}wrapCallback(e){return (t,r)=>{t?this.reject(t):this.resolve(r),"function"==typeof e&&(this.promise.catch((()=>{})),1===e.length?e(t):e(t,r));}}}let c$2 = class c extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name="FirebaseError",Object.setPrototypeOf(this,c$2.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,h$2.prototype.create);}};let h$2 = class h{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r;}create(e,...t){const r=t[0]||{},n=`${this.service}/${e}`,o=this.errors[e],i=o?function(e,t){return e.replace(l$2,((e,r)=>{const n=t[r];return null!=n?String(n):`<${r}?>`}))}(o,r):"Error",a=`${this.serviceName}: ${i} (${n}).`;return new c$2(n,a,r)}};const l$2=/\{\$([^}]+)}/g;function u$2(e){return JSON.parse(e)}const p$2=function(e){const t=function(e){let t={},r={},n={},o="";try{const a=e.split(".");t=u$2(i$1(a[0])||""),r=u$2(i$1(a[1])||""),o=a[2],n=r.d||{},delete r.d;}catch(e){}return {header:t,claims:r,data:n,signature:o}}(e).claims;return "object"==typeof t&&t.hasOwnProperty("iat")?t.iat:null};let d$2 = class d{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null;}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}};var g$2;!function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT";}(g$2||(g$2={}));const f$2={debug:g$2.DEBUG,verbose:g$2.VERBOSE,info:g$2.INFO,warn:g$2.WARN,error:g$2.ERROR,silent:g$2.SILENT},E$2=g$2.INFO,b$2={[g$2.DEBUG]:"log",[g$2.VERBOSE]:"log",[g$2.INFO]:"info",[g$2.WARN]:"warn",[g$2.ERROR]:"error"},w$2=(e,t,...r)=>{if(t<e.logLevel)return;const n=(new Date).toISOString(),o=b$2[t];if(!o)throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`);console[o](`[${n}]  ${e.name}:`,...r);};const _$2=new Map,k$2={activated:!1,tokenObservers:[]},v$2={initialized:!1,enabled:!1};function y$2(e){return _$2.get(e)||k$2}function m$2(e,t){_$2.set(e,t);}function A$2(){return v$2}const T$2="https://content-firebaseappcheck.googleapis.com/v1",S$2=3e4,O$2=96e4;let C$2 = class C{constructor(e,t,r,n,o){if(this.operation=e,this.retryPolicy=t,this.getWaitDuration=r,this.lowerBound=n,this.upperBound=o,this.pending=null,this.nextErrorWaitInterval=n,n>o)throw new Error("Proactive refresh lower bound greater than upper bound!")}start(){this.nextErrorWaitInterval=this.lowerBound,this.process(!0).catch((()=>{}));}stop(){this.pending&&(this.pending.reject("cancelled"),this.pending=null);}isRunning(){return !!this.pending}async process(e){this.stop();try{this.pending=new s,await(t=this.getNextRun(e),new Promise((e=>{setTimeout(e,t);}))),this.pending.resolve(),await this.pending.promise,this.pending=new s,await this.operation(),this.pending.resolve(),await this.pending.promise,this.process(!0).catch((()=>{}));}catch(e){this.retryPolicy(e)?this.process(!1).catch((()=>{})):this.stop();}var t;}getNextRun(e){if(e)return this.nextErrorWaitInterval=this.lowerBound,this.getWaitDuration();{const e=this.nextErrorWaitInterval;return this.nextErrorWaitInterval*=2,this.nextErrorWaitInterval>this.upperBound&&(this.nextErrorWaitInterval=this.upperBound),e}}};const R$2=new h$2("appCheck","AppCheck",{"already-initialized":"You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.","use-before-activation":"App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.","fetch-network-error":"Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-parse-error":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status-error":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","recaptcha-error":"ReCAPTCHA error.",throttled:"Requests throttled due to {$httpStatus} error. Attempts allowed again after {$time}"});function D$2(e=!1){var t;return e?null===(t=self.grecaptcha)||void 0===t?void 0:t.enterprise:self.grecaptcha}function P$2(e){if(!y$2(e).activated)throw R$2.create("use-before-activation",{appName:e.name})}function x$2(e){const t=Math.round(e/1e3),r=Math.floor(t/86400),n=Math.floor((t-3600*r*24)/3600),o=Math.floor((t-3600*r*24-3600*n)/60),i=t-3600*r*24-3600*n-60*o;let a="";return r&&(a+=I$2(r)+"d:"),n&&(a+=I$2(n)+"h:"),a+=I$2(o)+"m:"+I$2(i)+"s",a}function I$2(e){return 0===e?"00":e>=10?e.toString():"0"+e}async function N$2({url:e,body:t},r){var n,o;const i={"Content-Type":"application/json"},a=r.getImmediate({optional:!0});if(a){const e=await a.getHeartbeatsHeader();e&&(i["X-Firebase-Client"]=e);}const s={method:"POST",body:JSON.stringify(t),headers:i};let c,h;try{c=await fetch(e,s);}catch(e){throw R$2.create("fetch-network-error",{originalErrorMessage:null===(n=e)||void 0===n?void 0:n.message})}if(200!==c.status)throw R$2.create("fetch-status-error",{httpStatus:c.status});try{h=await c.json();}catch(e){throw R$2.create("fetch-parse-error",{originalErrorMessage:null===(o=e)||void 0===o?void 0:o.message})}const l=h.ttl.match(/^([\d.]+)(s)$/);if(!l||!l[2]||isNaN(Number(l[1])))throw R$2.create("fetch-parse-error",{originalErrorMessage:`ttl field (timeToLive) is not in standard Protobuf Duration format: ${h.ttl}`});const u=1e3*Number(l[1]),p=Date.now();return {token:h.token,expireTimeMillis:p+u,issuedAtTimeMillis:p}}const M$2="firebase-app-check-store";let B$2=null;function j$2(){return B$2||(B$2=new Promise(((e,t)=>{var r;try{const r=indexedDB.open("firebase-app-check-database",1);r.onsuccess=t=>{e(t.target.result);},r.onerror=e=>{var r;t(R$2.create("storage-open",{originalErrorMessage:null===(r=e.target.error)||void 0===r?void 0:r.message}));},r.onupgradeneeded=e=>{const t=e.target.result;if(0===e.oldVersion)t.createObjectStore(M$2,{keyPath:"compositeKey"});};}catch(e){t(R$2.create("storage-open",{originalErrorMessage:null===(r=e)||void 0===r?void 0:r.message}));}})),B$2)}async function L$2(e,t){const r=(await j$2()).transaction(M$2,"readwrite"),n=r.objectStore(M$2).put({compositeKey:e,value:t});return new Promise(((e,t)=>{n.onsuccess=t=>{e();},r.onerror=e=>{var r;t(R$2.create("storage-set",{originalErrorMessage:null===(r=e.target.error)||void 0===r?void 0:r.message}));};}))}async function H$2(e){const t=(await j$2()).transaction(M$2,"readonly"),r=t.objectStore(M$2).get(e);return new Promise(((e,n)=>{r.onsuccess=t=>{const r=t.target.result;e(r?r.value:void 0);},t.onerror=e=>{var t;n(R$2.create("storage-get",{originalErrorMessage:null===(t=e.target.error)||void 0===t?void 0:t.message}));};}))}function $$2(e){return `${e.options.appId}-${e.name}`}const W$2=new class{constructor(e){this.name=e,this._logLevel=E$2,this._logHandler=w$2,this._userLogHandler=null;}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in g$2))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e;}setLogLevel(e){this._logLevel="string"==typeof e?f$2[e]:e;}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e;}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e;}debug(...e){this._userLogHandler&&this._userLogHandler(this,g$2.DEBUG,...e),this._logHandler(this,g$2.DEBUG,...e);}log(...e){this._userLogHandler&&this._userLogHandler(this,g$2.VERBOSE,...e),this._logHandler(this,g$2.VERBOSE,...e);}info(...e){this._userLogHandler&&this._userLogHandler(this,g$2.INFO,...e),this._logHandler(this,g$2.INFO,...e);}warn(...e){this._userLogHandler&&this._userLogHandler(this,g$2.WARN,...e),this._logHandler(this,g$2.WARN,...e);}error(...e){this._userLogHandler&&this._userLogHandler(this,g$2.ERROR,...e),this._logHandler(this,g$2.ERROR,...e);}}("@firebase/app-check");async function F$2(e){if(a$2()){let t;try{t=await function(e){return H$2($$2(e))}(e);}catch(e){W$2.warn(`Failed to read token from IndexedDB. Error: ${e}`);}return t}}function V$2(e,t){return a$2()?function(e,t){return L$2($$2(e),t)}(e,t).catch((e=>{W$2.warn(`Failed to write token to IndexedDB. Error: ${e}`);})):Promise.resolve()}async function K$2(){let e;try{e=await H$2("debug-token");}catch(e){}if(e)return e;{const e="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(e=>{const t=16*Math.random()|0;return ("x"===e?t:3&t|8).toString(16)}));return (t=e,L$2("debug-token",t)).catch((e=>W$2.warn(`Failed to persist debug token to IndexedDB. Error: ${e}`))),e}var t;}function z$2(){return A$2().enabled}async function U$2(){const e=A$2();if(e.enabled&&e.token)return e.token.promise;throw Error("\n            Can't get debug token in production mode.\n        ")}function q$1(){const e=function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}(),t=A$2();if(t.initialized=!0,"string"!=typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN&&!0!==e.FIREBASE_APPCHECK_DEBUG_TOKEN)return;t.enabled=!0;const r=new s;t.token=r,"string"==typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN?r.resolve(e.FIREBASE_APPCHECK_DEBUG_TOKEN):r.resolve(K$2());}const G$2={error:"UNKNOWN_ERROR"};async function X$2(e,t=!1){const r=e.app;P$2(r);const n=y$2(r);let o,i=n.token;if(i&&!ee$1(i)&&(m$2(r,Object.assign(Object.assign({},n),{token:void 0})),i=void 0),!i){const e=await n.cachedTokenPromise;e&&(ee$1(e)?i=e:await V$2(r,void 0));}if(!t&&i&&ee$1(i))return {token:i.token};let a,s=!1;if(z$2()){n.exchangeTokenPromise||(n.exchangeTokenPromise=N$2(function(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return {url:`${T$2}/projects/${r}/apps/${n}:exchangeDebugToken?key=${o}`,body:{debug_token:t}}}(r,await U$2()),e.heartbeatServiceProvider).finally((()=>{n.exchangeTokenPromise=void 0;})),s=!0);const t=await n.exchangeTokenPromise;return await V$2(r,t),m$2(r,Object.assign(Object.assign({},n),{token:t})),{token:t.token}}try{n.exchangeTokenPromise||(n.exchangeTokenPromise=n.provider.getToken().finally((()=>{n.exchangeTokenPromise=void 0;})),s=!0),i=await n.exchangeTokenPromise;}catch(e){"appCheck/throttled"===e.code?W$2.warn(e.message):W$2.error(e),o=e;}return i?o?a=ee$1(i)?{token:i.token,internalError:o}:te$1(o):(a={token:i.token},m$2(r,Object.assign(Object.assign({},n),{token:i})),await V$2(r,i)):a=te$1(o),s&&Q$2(r,a),a}function J$2(e,t,r,n){const{app:o}=e,i=y$2(o),a={next:r,error:n,type:t};if(m$2(o,Object.assign(Object.assign({},i),{tokenObservers:[...i.tokenObservers,a]})),i.token&&ee$1(i.token)){const t=i.token;Promise.resolve().then((()=>{r({token:t.token}),Z$2(e);})).catch((()=>{}));}i.cachedTokenPromise.then((()=>Z$2(e)));}function Y$2(e,t){const r=y$2(e),n=r.tokenObservers.filter((e=>e.next!==t));0===n.length&&r.tokenRefresher&&r.tokenRefresher.isRunning()&&r.tokenRefresher.stop(),m$2(e,Object.assign(Object.assign({},r),{tokenObservers:n}));}function Z$2(e){const{app:t}=e,r=y$2(t);let n=r.tokenRefresher;n||(n=function(e){const{app:t}=e;return new C$2((async()=>{let r;if(r=y$2(t).token?await X$2(e,!0):await X$2(e),r.error)throw r.error;if(r.internalError)throw r.internalError}),(()=>!0),(()=>{const e=y$2(t);if(e.token){let t=e.token.issuedAtTimeMillis+.5*(e.token.expireTimeMillis-e.token.issuedAtTimeMillis)+3e5;const r=e.token.expireTimeMillis-3e5;return t=Math.min(t,r),Math.max(0,t-Date.now())}return 0}),S$2,O$2)}(e),m$2(t,Object.assign(Object.assign({},r),{tokenRefresher:n}))),!n.isRunning()&&r.isTokenAutoRefreshEnabled&&n.start();}function Q$2(e,t){const r=y$2(e).tokenObservers;for(const e of r)try{"EXTERNAL"===e.type&&null!=t.error?e.error(t.error):e.next(t);}catch(e){}}function ee$1(e){return e.expireTimeMillis-Date.now()>0}function te$1(e){return {token:(t=G$2,o$2.encodeString(JSON.stringify(t),!1)),error:e};var t;}let re$1 = class re{constructor(e,t){this.app=e,this.heartbeatServiceProvider=t;}_delete(){const{tokenObservers:e}=y$2(this.app);for(const t of e)Y$2(this.app,t.next);return Promise.resolve()}};function ne$1(e,t){const r=y$2(e),n=new s;m$2(e,Object.assign(Object.assign({},r),{reCAPTCHAState:{initialized:n}}));const o=ae$1(e),i=D$2(!1);return i?ie$1(e,t,i,o,n):function(e){const t=document.createElement("script");t.src="https://www.google.com/recaptcha/api.js",t.onload=e,document.head.appendChild(t);}((()=>{const r=D$2(!1);if(!r)throw new Error("no recaptcha");ie$1(e,t,r,o,n);})),n.promise}function oe$1(e,t){const r=y$2(e),n=new s;m$2(e,Object.assign(Object.assign({},r),{reCAPTCHAState:{initialized:n}}));const o=ae$1(e),i=D$2(!0);return i?ie$1(e,t,i,o,n):function(e){const t=document.createElement("script");t.src="https://www.google.com/recaptcha/enterprise.js",t.onload=e,document.head.appendChild(t);}((()=>{const r=D$2(!0);if(!r)throw new Error("no recaptcha");ie$1(e,t,r,o,n);})),n.promise}function ie$1(e,t,r,n,o){r.ready((()=>{!function(e,t,r,n){const o=r.render(n,{sitekey:t,size:"invisible"}),i=y$2(e);m$2(e,Object.assign(Object.assign({},i),{reCAPTCHAState:Object.assign(Object.assign({},i.reCAPTCHAState),{widgetId:o})}));}(e,t,r,n),o.resolve(r);}));}function ae$1(e){const t=`fire_app_check_${e.name}`,r=document.createElement("div");return r.id=t,r.style.display="none",document.body.appendChild(r),t}async function se$1(e){P$2(e);const t=y$2(e).reCAPTCHAState,r=await t.initialized.promise;return new Promise(((t,n)=>{const o=y$2(e).reCAPTCHAState;r.ready((()=>{t(r.execute(o.widgetId,{action:"fire_app_check"}));}));}))}let ce$1 = class ce{constructor(e){this._siteKey=e,this._throttleData=null;}async getToken(){var e,t;pe$1(this._throttleData);const r=await se$1(this._app).catch((e=>{throw R$2.create("recaptcha-error")}));let n;try{n=await N$2(function(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return {url:`${T$2}/projects/${r}/apps/${n}:exchangeRecaptchaV3Token?key=${o}`,body:{recaptcha_v3_token:t}}}(this._app,r),this._heartbeatServiceProvider);}catch(r){throw (null===(e=r.code)||void 0===e?void 0:e.includes("fetch-status-error"))?(this._throttleData=ue$1(Number(null===(t=r.customData)||void 0===t?void 0:t.httpStatus),this._throttleData),R$2.create("throttled",{time:x$2(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):r}return this._throttleData=null,n}initialize(t){this._app=t,this._heartbeatServiceProvider=_getProvider(t,"heartbeat"),ne$1(t,this._siteKey).catch((()=>{}));}isEqual(e){return e instanceof ce$1&&this._siteKey===e._siteKey}};let he$1 = class he{constructor(e){this._siteKey=e,this._throttleData=null;}async getToken(){var e,t;pe$1(this._throttleData);const r=await se$1(this._app).catch((e=>{throw R$2.create("recaptcha-error")}));let n;try{n=await N$2(function(e,t){const{projectId:r,appId:n,apiKey:o}=e.options;return {url:`${T$2}/projects/${r}/apps/${n}:exchangeRecaptchaEnterpriseToken?key=${o}`,body:{recaptcha_enterprise_token:t}}}(this._app,r),this._heartbeatServiceProvider);}catch(r){throw (null===(e=r.code)||void 0===e?void 0:e.includes("fetch-status-error"))?(this._throttleData=ue$1(Number(null===(t=r.customData)||void 0===t?void 0:t.httpStatus),this._throttleData),R$2.create("throttled",{time:x$2(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):r}return this._throttleData=null,n}initialize(t){this._app=t,this._heartbeatServiceProvider=_getProvider(t,"heartbeat"),oe$1(t,this._siteKey).catch((()=>{}));}isEqual(e){return e instanceof he$1&&this._siteKey===e._siteKey}};let le$1 = class le{constructor(e){this._customProviderOptions=e;}async getToken(){const e=await this._customProviderOptions.getToken(),t=p$2(e.token),r=null!==t&&t<Date.now()&&t>0?1e3*t:Date.now();return Object.assign(Object.assign({},e),{issuedAtTimeMillis:r})}initialize(e){this._app=e;}isEqual(e){return e instanceof le$1&&this._customProviderOptions.getToken.toString()===e._customProviderOptions.getToken.toString()}};function ue$1(e,t){if(404===e||403===e)return {backoffCount:1,allowRequestsAfter:Date.now()+864e5,httpStatus:e};{const r=t?t.backoffCount:0,n=function(e,t=1e3,r=2){const n=t*Math.pow(r,e),o=Math.round(.5*n*(Math.random()-.5)*2);return Math.min(144e5,n+o)}(r,1e3,2);return {backoffCount:r+1,allowRequestsAfter:Date.now()+n,httpStatus:e}}}function pe$1(e){if(e&&Date.now()-e.allowRequestsAfter<=0)throw R$2.create("throttled",{time:x$2(e.allowRequestsAfter-Date.now()),httpStatus:e.httpStatus})}function de$1(r=getApp(),n){var o;r=(o=r)&&o._delegate?o._delegate:o;const i=_getProvider(r,"app-check");if(A$2().initialized||q$1(),z$2()&&U$2().then((e=>console.log(`App Check debug token: ${e}. You will need to add it to your app's App Check settings in the Firebase console for it to work.`))),i.isInitialized()){const e=i.getImmediate(),t=i.getOptions();if(t.isTokenAutoRefreshEnabled===n.isTokenAutoRefreshEnabled&&t.provider.isEqual(n.provider))return e;throw R$2.create("already-initialized",{appName:r.name})}const a=i.initialize({options:n});return function(e,t,r){const n=y$2(e),o=Object.assign(Object.assign({},n),{activated:!0});o.provider=t,o.cachedTokenPromise=F$2(e).then((t=>(t&&ee$1(t)&&(m$2(e,Object.assign(Object.assign({},y$2(e)),{token:t})),Q$2(e,{token:t.token})),t))),o.isTokenAutoRefreshEnabled=void 0===r?e.automaticDataCollectionEnabled:r,m$2(e,o),o.provider.initialize(e);}(r,n.provider,n.isTokenAutoRefreshEnabled),y$2(r).isTokenAutoRefreshEnabled&&J$2(a,"INTERNAL",(()=>{})),a}function ge$1(e,t){const r=e.app,n=y$2(r);n.tokenRefresher&&(!0===t?n.tokenRefresher.start():n.tokenRefresher.stop()),m$2(r,Object.assign(Object.assign({},n),{isTokenAutoRefreshEnabled:t}));}async function fe$1(e,t){const r=await X$2(e,t);if(r.error)throw r.error;return {token:r.token}}function Ee$1(e,t,r,n){let o=()=>{},i=()=>{};return o=null!=t.next?t.next.bind(t):t,null!=t.error?i=t.error.bind(t):r&&(i=r),J$2(e,"EXTERNAL",o,i),()=>Y$2(e.app,o)}_registerComponent(new d$2("app-check",(e=>function(e,t){return new re$1(e,t)}(e.getProvider("app").getImmediate(),e.getProvider("heartbeat"))),"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback(((e,t,r)=>{e.getProvider("app-check-internal").initialize();}))),_registerComponent(new d$2("app-check-internal",(e=>function(e){return {getToken:t=>X$2(e,t),addTokenListener:t=>J$2(e,"INTERNAL",t),removeTokenListener:t=>Y$2(e.app,t)}}(e.getProvider("app-check").getImmediate())),"PUBLIC").setInstantiationMode("EXPLICIT")),registerVersion("@firebase/app-check","0.5.13");

    var firebase_app_check = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CustomProvider: le$1,
        ReCaptchaEnterpriseProvider: he$1,
        ReCaptchaV3Provider: ce$1,
        getToken: fe$1,
        initializeAppCheck: de$1,
        onTokenChanged: Ee$1,
        setTokenAutoRefreshEnabled: ge$1
    });

    function i(){return "object"==typeof indexedDB}let a$1 = class a extends Error{constructor(t,e,n){super(e),this.code=t,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,a$1.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,o$1.prototype.create);}};let o$1 = class o{constructor(t,e,n){this.service=t,this.serviceName=e,this.errors=n;}create(t,...e){const n=e[0]||{},s=`${this.service}/${t}`,r=this.errors[t],i=r?function(t,e){return t.replace(c$1,((t,n)=>{const s=e[n];return null!=s?String(s):`<${n}?>`}))}(r,n):"Error",o=`${this.serviceName}: ${i} (${s}).`;return new a$1(s,o,n)}};const c$1=/\{\$([^}]+)}/g;function u$1(t,e=1e3,n=2){const s=e*Math.pow(n,t),r=Math.round(.5*s*(Math.random()-.5)*2);return Math.min(144e5,s+r)}function l$1(t){return t&&t._delegate?t._delegate:t}let g$1 = class g{constructor(t,e,n){this.name=t,this.instanceFactory=e,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null;}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}};var h$1;!function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT";}(h$1||(h$1={}));const f$1={debug:h$1.DEBUG,verbose:h$1.VERBOSE,info:h$1.INFO,warn:h$1.WARN,error:h$1.ERROR,silent:h$1.SILENT},d$1=h$1.INFO,p$1={[h$1.DEBUG]:"log",[h$1.VERBOSE]:"log",[h$1.INFO]:"info",[h$1.WARN]:"warn",[h$1.ERROR]:"error"},m$1=(t,e,...n)=>{if(e<t.logLevel)return;const s=(new Date).toISOString(),r=p$1[e];if(!r)throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`);console[r](`[${s}]  ${t.name}:`,...n);};let w$1 = class w{constructor(t){this.name=t,this._logLevel=d$1,this._logHandler=m$1,this._userLogHandler=null;}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in h$1))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t;}setLogLevel(t){this._logLevel="string"==typeof t?f$1[t]:t;}get logHandler(){return this._logHandler}set logHandler(t){if("function"!=typeof t)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t;}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t;}debug(...t){this._userLogHandler&&this._userLogHandler(this,h$1.DEBUG,...t),this._logHandler(this,h$1.DEBUG,...t);}log(...t){this._userLogHandler&&this._userLogHandler(this,h$1.VERBOSE,...t),this._logHandler(this,h$1.VERBOSE,...t);}info(...t){this._userLogHandler&&this._userLogHandler(this,h$1.INFO,...t),this._logHandler(this,h$1.INFO,...t);}warn(...t){this._userLogHandler&&this._userLogHandler(this,h$1.WARN,...t),this._logHandler(this,h$1.WARN,...t);}error(...t){this._userLogHandler&&this._userLogHandler(this,h$1.ERROR,...t),this._logHandler(this,h$1.ERROR,...t);}};let v$1,_$1;const y$1=new WeakMap,b$1=new WeakMap,E$1=new WeakMap,S$1=new WeakMap,I$1=new WeakMap;let C$1={get(t,e,n){if(t instanceof IDBTransaction){if("done"===e)return b$1.get(t);if("objectStoreNames"===e)return t.objectStoreNames||E$1.get(t);if("store"===e)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return M$1(t[e])},set:(t,e,n)=>(t[e]=n,!0),has:(t,e)=>t instanceof IDBTransaction&&("done"===e||"store"===e)||e in t};function T$1(t){return t!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(_$1||(_$1=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(t)?function(...e){return t.apply(D$1(this),e),M$1(y$1.get(this))}:function(...e){return M$1(t.apply(D$1(this),e))}:function(e,...n){const s=t.call(D$1(this),e,...n);return E$1.set(s,e.sort?e.sort():[e]),M$1(s)}}function L$1(t){return "function"==typeof t?T$1(t):(t instanceof IDBTransaction&&function(t){if(b$1.has(t))return;const e=new Promise(((e,n)=>{const s=()=>{t.removeEventListener("complete",r),t.removeEventListener("error",i),t.removeEventListener("abort",i);},r=()=>{e(),s();},i=()=>{n(t.error||new DOMException("AbortError","AbortError")),s();};t.addEventListener("complete",r),t.addEventListener("error",i),t.addEventListener("abort",i);}));b$1.set(t,e);}(t),e=t,(v$1||(v$1=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((t=>e instanceof t))?new Proxy(t,C$1):t);var e;}function M$1(t){if(t instanceof IDBRequest)return function(t){const e=new Promise(((e,n)=>{const s=()=>{t.removeEventListener("success",r),t.removeEventListener("error",i);},r=()=>{e(M$1(t.result)),s();},i=()=>{n(t.error),s();};t.addEventListener("success",r),t.addEventListener("error",i);}));return e.then((e=>{e instanceof IDBCursor&&y$1.set(e,t);})).catch((()=>{})),I$1.set(e,t),e}(t);if(S$1.has(t))return S$1.get(t);const e=L$1(t);return e!==t&&(S$1.set(t,e),I$1.set(e,t)),e}const D$1=t=>I$1.get(t);const k$1=["get","getKey","getAll","getAllKeys","count"],F$1=["put","add","delete","clear"],P$1=new Map;function O$1(t,e){if(!(t instanceof IDBDatabase)||e in t||"string"!=typeof e)return;if(P$1.get(e))return P$1.get(e);const n=e.replace(/FromIndex$/,""),s=e!==n,r=F$1.includes(n);if(!(n in(s?IDBIndex:IDBObjectStore).prototype)||!r&&!k$1.includes(n))return;const i=async function(t,...e){const i=this.transaction(t,r?"readwrite":"readonly");let a=i.store;return s&&(a=a.index(e.shift())),(await Promise.all([a[n](...e),r&&i.done]))[0]};return P$1.set(e,i),i}C$1=(t=>({...t,get:(e,n,s)=>O$1(e,n)||t.get(e,n,s),has:(e,n)=>!!O$1(e,n)||t.has(e,n)}))(C$1);const N$1="@firebase/installations",j$1=new o$1("installations","Installations",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."});function R$1(t){return t instanceof a$1&&t.code.includes("request-failed")}function A$1({projectId:t}){return `https://firebaseinstallations.googleapis.com/v1/projects/${t}/installations`}function B$1(t){return {token:t.token,requestStatus:2,expiresIn:(e=t.expiresIn,Number(e.replace("s","000"))),creationTime:Date.now()};var e;}async function $$1(t,e){const n=(await e.json()).error;return j$1.create("request-failed",{requestName:t,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function H$1({apiKey:t}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t})}function x$1(t,{refreshToken:e}){const n=H$1(t);return n.append("Authorization",function(t){return `FIS_v2 ${t}`}(e)),n}async function q(t){const e=await t();return e.status>=500&&e.status<600?t():e}function K$1(t){return new Promise((e=>{setTimeout(e,t);}))}const U$1=/^[cdef][\w-]{21}$/;function V$1(){try{const t=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(t),t[0]=112+t[0]%16;const e=function(t){return (e=t,btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")).substr(0,22);var e;}(t);return U$1.test(e)?e:""}catch(t){return ""}}function z$1(t){return `${t.appName}!${t.appId}`}const G$1=new Map;function W$1(t,e){const n=z$1(t);J$1(n,e),function(t,e){const n=function(){!Y$1&&"BroadcastChannel"in self&&(Y$1=new BroadcastChannel("[Firebase] FID Change"),Y$1.onmessage=t=>{J$1(t.data.key,t.data.fid);});return Y$1}();n&&n.postMessage({key:t,fid:e});0===G$1.size&&Y$1&&(Y$1.close(),Y$1=null);}(n,e);}function J$1(t,e){const n=G$1.get(t);if(n)for(const t of n)t(e);}let Y$1=null;const Z$1="firebase-installations-store";let Q$1=null;function X$1(){return Q$1||(Q$1=function(t,e,{blocked:n,upgrade:s,blocking:r,terminated:i}={}){const a=indexedDB.open(t,e),o=M$1(a);return s&&a.addEventListener("upgradeneeded",(t=>{s(M$1(a.result),t.oldVersion,t.newVersion,M$1(a.transaction));})),n&&a.addEventListener("blocked",(()=>n())),o.then((t=>{i&&t.addEventListener("close",(()=>i())),r&&t.addEventListener("versionchange",(()=>r()));})).catch((()=>{})),o}("firebase-installations-database",1,{upgrade:(t,e)=>{if(0===e)t.createObjectStore(Z$1);}})),Q$1}async function tt$1(t,e){const n=z$1(t),s=(await X$1()).transaction(Z$1,"readwrite"),r=s.objectStore(Z$1),i=await r.get(n);return await r.put(e,n),await s.done,i&&i.fid===e.fid||W$1(t,e.fid),e}async function et$1(t){const e=z$1(t),n=(await X$1()).transaction(Z$1,"readwrite");await n.objectStore(Z$1).delete(e),await n.done;}async function nt$1(t,e){const n=z$1(t),s=(await X$1()).transaction(Z$1,"readwrite"),r=s.objectStore(Z$1),i=await r.get(n),a=e(i);return void 0===a?await r.delete(n):await r.put(a,n),await s.done,!a||i&&i.fid===a.fid||W$1(t,a.fid),a}async function st$1(t){let e;const n=await nt$1(t.appConfig,(n=>{const s=function(t){return at$1(t||{fid:V$1(),registrationStatus:0})}(n),r=function(t,e){if(0===e.registrationStatus){if(!navigator.onLine){return {installationEntry:e,registrationPromise:Promise.reject(j$1.create("app-offline"))}}const n={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},s=async function(t,e){try{const n=await async function({appConfig:t,heartbeatServiceProvider:e},{fid:n}){const s=A$1(t),r=H$1(t),i=e.getImmediate({optional:!0});if(i){const t=await i.getHeartbeatsHeader();t&&r.append("x-firebase-client",t);}const a={fid:n,authVersion:"FIS_v2",appId:t.appId,sdkVersion:"w:0.5.13"},o={method:"POST",headers:r,body:JSON.stringify(a)},c=await q((()=>fetch(s,o)));if(c.ok){const t=await c.json();return {fid:t.fid||n,registrationStatus:2,refreshToken:t.refreshToken,authToken:B$1(t.authToken)}}throw await $$1("Create Installation",c)}(t,e);return tt$1(t.appConfig,n)}catch(n){throw R$1(n)&&409===n.customData.serverCode?await et$1(t.appConfig):await tt$1(t.appConfig,{fid:e.fid,registrationStatus:0}),n}}(t,n);return {installationEntry:n,registrationPromise:s}}return 1===e.registrationStatus?{installationEntry:e,registrationPromise:rt$1(t)}:{installationEntry:e}}(t,s);return e=r.registrationPromise,r.installationEntry}));return ""===n.fid?{installationEntry:await e}:{installationEntry:n,registrationPromise:e}}async function rt$1(t){let e=await it$1(t.appConfig);for(;1===e.registrationStatus;)await K$1(100),e=await it$1(t.appConfig);if(0===e.registrationStatus){const{installationEntry:e,registrationPromise:n}=await st$1(t);return n||e}return e}function it$1(t){return nt$1(t,(t=>{if(!t)throw j$1.create("installation-not-found");return at$1(t)}))}function at$1(t){return 1===(e=t).registrationStatus&&e.registrationTime+1e4<Date.now()?{fid:t.fid,registrationStatus:0}:t;var e;}async function ot$1({appConfig:t,heartbeatServiceProvider:e},n){const s=function(t,{fid:e}){return `${A$1(t)}/${e}/authTokens:generate`}(t,n),r=x$1(t,n),i=e.getImmediate({optional:!0});if(i){const t=await i.getHeartbeatsHeader();t&&r.append("x-firebase-client",t);}const a={installation:{sdkVersion:"w:0.5.13",appId:t.appId}},o={method:"POST",headers:r,body:JSON.stringify(a)},c=await q((()=>fetch(s,o)));if(c.ok){return B$1(await c.json())}throw await $$1("Generate Auth Token",c)}async function ct$1(t,e=!1){let n;const s=await nt$1(t.appConfig,(s=>{if(!lt$1(s))throw j$1.create("not-registered");const r=s.authToken;if(!e&&function(t){return 2===t.requestStatus&&!function(t){const e=Date.now();return e<t.creationTime||t.creationTime+t.expiresIn<e+36e5}(t)}(r))return s;if(1===r.requestStatus)return n=async function(t,e){let n=await ut$1(t.appConfig);for(;1===n.authToken.requestStatus;)await K$1(100),n=await ut$1(t.appConfig);const s=n.authToken;return 0===s.requestStatus?ct$1(t,e):s}(t,e),s;{if(!navigator.onLine)throw j$1.create("app-offline");const e=function(t){const e={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},t),{authToken:e})}(s);return n=async function(t,e){try{const n=await ot$1(t,e),s=Object.assign(Object.assign({},e),{authToken:n});return await tt$1(t.appConfig,s),n}catch(n){if(!R$1(n)||401!==n.customData.serverCode&&404!==n.customData.serverCode){const n=Object.assign(Object.assign({},e),{authToken:{requestStatus:0}});await tt$1(t.appConfig,n);}else await et$1(t.appConfig);throw n}}(t,e),e}}));return n?await n:s.authToken}function ut$1(t){return nt$1(t,(t=>{if(!lt$1(t))throw j$1.create("not-registered");const e=t.authToken;return 1===(n=e).requestStatus&&n.requestTime+1e4<Date.now()?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t;var n;}))}function lt$1(t){return void 0!==t&&2===t.registrationStatus}async function gt$1(t,e=!1){const n=t;await async function(t){const{registrationPromise:e}=await st$1(t);e&&await e;}(n);return (await ct$1(n,e)).token}function ht$1(t){return j$1.create("missing-app-config-values",{valueName:t})}const ft$1=t=>{const e=t.getProvider("app").getImmediate(),s=_getProvider(e,"installations").getImmediate();return {getId:()=>async function(t){const e=t,{installationEntry:n,registrationPromise:s}=await st$1(e);return s?s.catch(console.error):ct$1(e).catch(console.error),n.fid}(s),getToken:t=>gt$1(s,t)}};_registerComponent(new g$1("installations",(t=>{const e=t.getProvider("app").getImmediate(),s=function(t){if(!t||!t.options)throw ht$1("App Configuration");if(!t.name)throw ht$1("App Name");const e=["projectId","apiKey","appId"];for(const n of e)if(!t.options[n])throw ht$1(n);return {appName:t.name,projectId:t.options.projectId,apiKey:t.options.apiKey,appId:t.options.appId}}(e);return {app:e,appConfig:s,heartbeatServiceProvider:_getProvider(e,"heartbeat"),_delete:()=>Promise.resolve()}}),"PUBLIC")),_registerComponent(new g$1("installations-internal",ft$1,"PRIVATE")),registerVersion(N$1,"0.5.13"),registerVersion(N$1,"0.5.13","esm2017");const dt$1="@firebase/remote-config";let pt$1 = class pt{constructor(){this.listeners=[];}addEventListener(t){this.listeners.push(t);}abort(){this.listeners.forEach((t=>t()));}};const mt$1=new o$1("remoteconfig","Remote Config",{"registration-window":"Undefined window object. This SDK only supports usage in a browser environment.","registration-project-id":"Undefined project identifier. Check Firebase app initialization.","registration-api-key":"Undefined API key. Check Firebase app initialization.","registration-app-id":"Undefined app identifier. Check Firebase app initialization.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","storage-delete":"Error thrown when deleting from storage. Original error: {$originalErrorMessage}.","fetch-client-network":"Fetch client failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-timeout":'The config fetch request timed out.  Configure timeout using "fetchTimeoutMillis" SDK setting.',"fetch-throttle":'The config fetch request timed out while in an exponential backoff state. Configure timeout using "fetchTimeoutMillis" SDK setting. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.',"fetch-client-parse":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","indexed-db-unavailable":"Indexed DB is not supported by current browser"});const wt$1=["1","true","t","yes","y","on"];let vt$1 = class vt{constructor(t,e=""){this._source=t,this._value=e;}asString(){return this._value}asBoolean(){return "static"!==this._source&&wt$1.indexOf(this._value.toLowerCase())>=0}asNumber(){if("static"===this._source)return 0;let t=Number(this._value);return isNaN(t)&&(t=0),t}getSource(){return this._source}};function _t$1(t=getApp()){t=l$1(t);return _getProvider(t,"remote-config").getImmediate()}async function yt$1(t){const e=l$1(t),[n,s]=await Promise.all([e._storage.getLastSuccessfulFetchResponse(),e._storage.getActiveConfigEtag()]);return !!(n&&n.config&&n.eTag&&n.eTag!==s)&&(await Promise.all([e._storageCache.setActiveConfig(n.config),e._storage.setActiveConfigEtag(n.eTag)]),!0)}function bt$1(t){const e=l$1(t);return e._initializePromise||(e._initializePromise=e._storageCache.loadFromStorage().then((()=>{e._isInitializationComplete=!0;}))),e._initializePromise}async function Et$1(t){const e=l$1(t),n=new pt$1;setTimeout((async()=>{n.abort();}),e.settings.fetchTimeoutMillis);try{await e._client.fetch({cacheMaxAgeMillis:e.settings.minimumFetchIntervalMillis,signal:n}),await e._storageCache.setLastFetchStatus("success");}catch(t){const n=function(t,e){return t instanceof a$1&&-1!==t.code.indexOf(e)}(t,"fetch-throttle")?"throttle":"failure";throw await e._storageCache.setLastFetchStatus(n),t}}function St$1(t){const e=l$1(t);return function(t={},e={}){return Object.keys(Object.assign(Object.assign({},t),e))}(e._storageCache.getActiveConfig(),e.defaultConfig).reduce(((e,n)=>(e[n]=Lt$1(t,n),e)),{})}function It$1(t,e){return Lt$1(l$1(t),e).asBoolean()}function Ct$1(t,e){return Lt$1(l$1(t),e).asNumber()}function Tt$1(t,e){return Lt$1(l$1(t),e).asString()}function Lt$1(t,e){const n=l$1(t);n._isInitializationComplete||n._logger.debug(`A value was requested for key "${e}" before SDK initialization completed. Await on ensureInitialized if the intent was to get a previously activated value.`);const s=n._storageCache.getActiveConfig();return s&&void 0!==s[e]?new vt$1("remote",s[e]):n.defaultConfig&&void 0!==n.defaultConfig[e]?new vt$1("default",String(n.defaultConfig[e])):(n._logger.debug(`Returning static value for key "${e}". Define a default or remote value if this is unintentional.`),new vt$1("static"))}function Mt$1(t,e){const n=l$1(t);switch(e){case"debug":n._logger.logLevel=h$1.DEBUG;break;case"silent":n._logger.logLevel=h$1.SILENT;break;default:n._logger.logLevel=h$1.ERROR;}}let Dt$1 = class Dt{constructor(t,e,n,s){this.client=t,this.storage=e,this.storageCache=n,this.logger=s;}isCachedDataFresh(t,e){if(!e)return this.logger.debug("Config fetch cache check. Cache unpopulated."),!1;const n=Date.now()-e,s=n<=t;return this.logger.debug(`Config fetch cache check. Cache age millis: ${n}. Cache max age millis (minimumFetchIntervalMillis setting): ${t}. Is cache hit: ${s}.`),s}async fetch(t){const[e,n]=await Promise.all([this.storage.getLastSuccessfulFetchTimestampMillis(),this.storage.getLastSuccessfulFetchResponse()]);if(n&&this.isCachedDataFresh(t.cacheMaxAgeMillis,e))return n;t.eTag=n&&n.eTag;const s=await this.client.fetch(t),r=[this.storageCache.setLastSuccessfulFetchTimestampMillis(Date.now())];return 200===s.status&&r.push(this.storage.setLastSuccessfulFetchResponse(s)),await Promise.all(r),s}};function kt$1(t=navigator){return t.languages&&t.languages[0]||t.language}let Ft$1 = class Ft{constructor(t,e,n,s,r,i){this.firebaseInstallations=t,this.sdkVersion=e,this.namespace=n,this.projectId=s,this.apiKey=r,this.appId=i;}async fetch(t){var e,n,s;const[r,i]=await Promise.all([this.firebaseInstallations.getId(),this.firebaseInstallations.getToken()]),a=`${window.FIREBASE_REMOTE_CONFIG_URL_BASE||"https://firebaseremoteconfig.googleapis.com"}/v1/projects/${this.projectId}/namespaces/${this.namespace}:fetch?key=${this.apiKey}`,o={"Content-Type":"application/json","Content-Encoding":"gzip","If-None-Match":t.eTag||"*"},c={sdk_version:this.sdkVersion,app_instance_id:r,app_instance_id_token:i,app_id:this.appId,language_code:kt$1()},u={method:"POST",headers:o,body:JSON.stringify(c)},l=fetch(a,u),g=new Promise(((e,n)=>{t.signal.addEventListener((()=>{const t=new Error("The operation was aborted.");t.name="AbortError",n(t);}));}));let h;try{await Promise.race([l,g]),h=await l;}catch(t){let s="fetch-client-network";throw "AbortError"===(null===(e=t)||void 0===e?void 0:e.name)&&(s="fetch-timeout"),mt$1.create(s,{originalErrorMessage:null===(n=t)||void 0===n?void 0:n.message})}let f=h.status;const d=h.headers.get("ETag")||void 0;let p,m;if(200===h.status){let t;try{t=await h.json();}catch(t){throw mt$1.create("fetch-client-parse",{originalErrorMessage:null===(s=t)||void 0===s?void 0:s.message})}p=t.entries,m=t.state;}if("INSTANCE_STATE_UNSPECIFIED"===m?f=500:"NO_CHANGE"===m?f=304:"NO_TEMPLATE"!==m&&"EMPTY_CONFIG"!==m||(p={}),304!==f&&200!==f)throw mt$1.create("fetch-status",{httpStatus:f});return {status:f,eTag:d,config:p}}};let Pt$1 = class Pt{constructor(t,e){this.client=t,this.storage=e;}async fetch(t){const e=await this.storage.getThrottleMetadata()||{backoffCount:0,throttleEndTimeMillis:Date.now()};return this.attemptFetch(t,e)}async attemptFetch(t,{throttleEndTimeMillis:e,backoffCount:n}){await function(t,e){return new Promise(((n,s)=>{const r=Math.max(e-Date.now(),0),i=setTimeout(n,r);t.addEventListener((()=>{clearTimeout(i),s(mt$1.create("fetch-throttle",{throttleEndTimeMillis:e}));}));}))}(t.signal,e);try{const e=await this.client.fetch(t);return await this.storage.deleteThrottleMetadata(),e}catch(e){if(!function(t){if(!(t instanceof a$1&&t.customData))return !1;const e=Number(t.customData.httpStatus);return 429===e||500===e||503===e||504===e}(e))throw e;const s={throttleEndTimeMillis:Date.now()+u$1(n),backoffCount:n+1};return await this.storage.setThrottleMetadata(s),this.attemptFetch(t,s)}}};let Ot$1 = class Ot{constructor(t,e,n,s,r){this.app=t,this._client=e,this._storageCache=n,this._storage=s,this._logger=r,this._isInitializationComplete=!1,this.settings={fetchTimeoutMillis:6e4,minimumFetchIntervalMillis:432e5},this.defaultConfig={};}get fetchTimeMillis(){return this._storageCache.getLastSuccessfulFetchTimestampMillis()||-1}get lastFetchStatus(){return this._storageCache.getLastFetchStatus()||"no-fetch-yet"}};function Nt$1(t,e){var n;const s=t.target.error||void 0;return mt$1.create(e,{originalErrorMessage:s&&(null===(n=s)||void 0===n?void 0:n.message)})}let jt$1 = class jt{constructor(t,e,n,s=function(){return new Promise(((t,e)=>{var n;try{const n=indexedDB.open("firebase_remote_config",1);n.onerror=t=>{e(Nt$1(t,"storage-open"));},n.onsuccess=e=>{t(e.target.result);},n.onupgradeneeded=t=>{const e=t.target.result;0===t.oldVersion&&e.createObjectStore("app_namespace_store",{keyPath:"compositeKey"});};}catch(t){e(mt$1.create("storage-open",{originalErrorMessage:null===(n=t)||void 0===n?void 0:n.message}));}}))}()){this.appId=t,this.appName=e,this.namespace=n,this.openDbPromise=s;}getLastFetchStatus(){return this.get("last_fetch_status")}setLastFetchStatus(t){return this.set("last_fetch_status",t)}getLastSuccessfulFetchTimestampMillis(){return this.get("last_successful_fetch_timestamp_millis")}setLastSuccessfulFetchTimestampMillis(t){return this.set("last_successful_fetch_timestamp_millis",t)}getLastSuccessfulFetchResponse(){return this.get("last_successful_fetch_response")}setLastSuccessfulFetchResponse(t){return this.set("last_successful_fetch_response",t)}getActiveConfig(){return this.get("active_config")}setActiveConfig(t){return this.set("active_config",t)}getActiveConfigEtag(){return this.get("active_config_etag")}setActiveConfigEtag(t){return this.set("active_config_etag",t)}getThrottleMetadata(){return this.get("throttle_metadata")}setThrottleMetadata(t){return this.set("throttle_metadata",t)}deleteThrottleMetadata(){return this.delete("throttle_metadata")}async get(t){const e=await this.openDbPromise;return new Promise(((n,s)=>{var r;const i=e.transaction(["app_namespace_store"],"readonly").objectStore("app_namespace_store"),a=this.createCompositeKey(t);try{const t=i.get(a);t.onerror=t=>{s(Nt$1(t,"storage-get"));},t.onsuccess=t=>{const e=t.target.result;n(e?e.value:void 0);};}catch(t){s(mt$1.create("storage-get",{originalErrorMessage:null===(r=t)||void 0===r?void 0:r.message}));}}))}async set(t,e){const n=await this.openDbPromise;return new Promise(((s,r)=>{var i;const a=n.transaction(["app_namespace_store"],"readwrite").objectStore("app_namespace_store"),o=this.createCompositeKey(t);try{const t=a.put({compositeKey:o,value:e});t.onerror=t=>{r(Nt$1(t,"storage-set"));},t.onsuccess=()=>{s();};}catch(t){r(mt$1.create("storage-set",{originalErrorMessage:null===(i=t)||void 0===i?void 0:i.message}));}}))}async delete(t){const e=await this.openDbPromise;return new Promise(((n,s)=>{var r;const i=e.transaction(["app_namespace_store"],"readwrite").objectStore("app_namespace_store"),a=this.createCompositeKey(t);try{const t=i.delete(a);t.onerror=t=>{s(Nt$1(t,"storage-delete"));},t.onsuccess=()=>{n();};}catch(t){s(mt$1.create("storage-delete",{originalErrorMessage:null===(r=t)||void 0===r?void 0:r.message}));}}))}createCompositeKey(t){return [this.appId,this.appName,this.namespace,t].join()}};let Rt$1 = class Rt{constructor(t){this.storage=t;}getLastFetchStatus(){return this.lastFetchStatus}getLastSuccessfulFetchTimestampMillis(){return this.lastSuccessfulFetchTimestampMillis}getActiveConfig(){return this.activeConfig}async loadFromStorage(){const t=this.storage.getLastFetchStatus(),e=this.storage.getLastSuccessfulFetchTimestampMillis(),n=this.storage.getActiveConfig(),s=await t;s&&(this.lastFetchStatus=s);const r=await e;r&&(this.lastSuccessfulFetchTimestampMillis=r);const i=await n;i&&(this.activeConfig=i);}setLastFetchStatus(t){return this.lastFetchStatus=t,this.storage.setLastFetchStatus(t)}setLastSuccessfulFetchTimestampMillis(t){return this.lastSuccessfulFetchTimestampMillis=t,this.storage.setLastSuccessfulFetchTimestampMillis(t)}setActiveConfig(t){return this.activeConfig=t,this.storage.setActiveConfig(t)}};async function At$1(t){return t=l$1(t),await Et$1(t),yt$1(t)}async function Bt$1(){if(!i())return !1;try{return await new Promise(((t,e)=>{try{let n=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(s),t(!0);},r.onupgradeneeded=()=>{n=!1;},r.onerror=()=>{var t;e((null===(t=r.error)||void 0===t?void 0:t.message)||"");};}catch(t){e(t);}}))}catch(t){return !1}}_registerComponent(new g$1("remote-config",(function(t,{instanceIdentifier:e}){const n=t.getProvider("app").getImmediate(),s=t.getProvider("installations-internal").getImmediate();if("undefined"==typeof window)throw mt$1.create("registration-window");if(!i())throw mt$1.create("indexed-db-unavailable");const{projectId:a,apiKey:o,appId:c}=n.options;if(!a)throw mt$1.create("registration-project-id");if(!o)throw mt$1.create("registration-api-key");if(!c)throw mt$1.create("registration-app-id");e=e||"firebase";const u=new jt$1(c,n.name,e),l=new Rt$1(u),g=new w$1(dt$1);g.logLevel=h$1.ERROR;const f=new Ft$1(s,SDK_VERSION,e,a,o,c),d=new Pt$1(f,u),p=new Dt$1(d,u,l,g),m=new Ot$1(n,p,l,u,g);return bt$1(m),m}),"PUBLIC").setMultipleInstances(!0)),registerVersion(dt$1,"0.3.12"),registerVersion(dt$1,"0.3.12","esm2017");

    var firebase_remote_config = /*#__PURE__*/Object.freeze({
        __proto__: null,
        activate: yt$1,
        ensureInitialized: bt$1,
        fetchAndActivate: At$1,
        fetchConfig: Et$1,
        getAll: St$1,
        getBoolean: It$1,
        getNumber: Ct$1,
        getRemoteConfig: _t$1,
        getString: Tt$1,
        getValue: Lt$1,
        isSupported: Bt$1,
        setLogLevel: Mt$1
    });

    const o=function(t){const e=[];let n=0;for(let s=0;s<t.length;s++){let r=t.charCodeAt(s);r<128?e[n++]=r:r<2048?(e[n++]=r>>6|192,e[n++]=63&r|128):55296==(64512&r)&&s+1<t.length&&56320==(64512&t.charCodeAt(s+1))?(r=65536+((1023&r)<<10)+(1023&t.charCodeAt(++s)),e[n++]=r>>18|240,e[n++]=r>>12&63|128,e[n++]=r>>6&63|128,e[n++]=63&r|128):(e[n++]=r>>12|224,e[n++]=r>>6&63|128,e[n++]=63&r|128);}return e},a={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let e=0;e<t.length;e+=3){const r=t[e],i=e+1<t.length,o=i?t[e+1]:0,a=e+2<t.length,u=a?t[e+2]:0,c=r>>2,h=(3&r)<<4|o>>4;let l=(15&o)<<2|u>>6,d=63&u;a||(d=64,i||(l=64)),s.push(n[c],n[h],n[l],n[d]);}return s.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(o(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):function(t){const e=[];let n=0,s=0;for(;n<t.length;){const r=t[n++];if(r<128)e[s++]=String.fromCharCode(r);else if(r>191&&r<224){const i=t[n++];e[s++]=String.fromCharCode((31&r)<<6|63&i);}else if(r>239&&r<365){const i=((7&r)<<18|(63&t[n++])<<12|(63&t[n++])<<6|63&t[n++])-65536;e[s++]=String.fromCharCode(55296+(i>>10)),e[s++]=String.fromCharCode(56320+(1023&i));}else {const i=t[n++],o=t[n++];e[s++]=String.fromCharCode((15&r)<<12|(63&i)<<6|63&o);}}return e.join("")}(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let e=0;e<t.length;){const r=n[t.charAt(e++)],i=e<t.length?n[t.charAt(e)]:0;++e;const o=e<t.length?n[t.charAt(e)]:64;++e;const a=e<t.length?n[t.charAt(e)]:64;if(++e,null==r||null==i||null==o||null==a)throw Error();const u=r<<2|i>>4;if(s.push(u),64!==o){const t=i<<4&240|o>>2;if(s.push(t),64!==a){const t=o<<6&192|a;s.push(t);}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t);}}},u=function(t){return function(t){const e=o(t);return a.encodeByteArray(e,!0)}(t).replace(/\./g,"")};function c(){return "undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""}function h(){return !function(){try{return "[object process]"===Object.prototype.toString.call(global.process)}catch(t){return !1}}()&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}const l=()=>function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}().__FIREBASE_DEFAULTS__,d=()=>{if("undefined"==typeof document)return;const t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/),e=t&&function(t){try{return a.decodeString(t,!0)}catch(t){console.error("base64Decode failed: ",t);}return null}(t[1]);return e&&JSON.parse(e)},f=()=>l()||(()=>{if("undefined"==typeof process)return;const t=process.env.__FIREBASE_DEFAULTS__,e=process.env.__FIREBASE_DEFAULTS_PATH__;if(t)return e&&console.warn("Values were provided for both __FIREBASE_DEFAULTS__ and __FIREBASE_DEFAULTS_PATH__. __FIREBASE_DEFAULTS_PATH__ will be ignored."),JSON.parse(t);if(e&&"undefined"!=typeof require)try{return require(e)}catch(t){console.warn(`Unable to read defaults from file provided to __FIREBASE_DEFAULTS_PATH__: ${e}`);}})()||d();class m extends Error{constructor(t,e,n){super(e),this.code=t,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,m.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,g.prototype.create);}}class g{constructor(t,e,n){this.service=t,this.serviceName=e,this.errors=n;}create(t,...e){const n=e[0]||{},s=`${this.service}/${t}`,r=this.errors[t],i=r?function(t,e){return t.replace(p,((t,n)=>{const s=e[n];return null!=s?String(s):`<${n}?>`}))}(r,n):"Error",o=`${this.serviceName}: ${i} (${s}).`;return new m(s,o,n)}}const p=/\{\$([^}]+)}/g;function y(t,e){if(t===e)return !0;const n=Object.keys(t),s=Object.keys(e);for(const r of n){if(!s.includes(r))return !1;const n=t[r],i=e[r];if(w(n)&&w(i)){if(!y(n,i))return !1}else if(n!==i)return !1}for(const t of s)if(!n.includes(t))return !1;return !0}function w(t){return null!==t&&"object"==typeof t}function v(t){return t&&t._delegate?t._delegate:t}class I{constructor(t,e,n){this.name=t,this.instanceFactory=e,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null;}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}var b;!function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT";}(b||(b={}));const E={debug:b.DEBUG,verbose:b.VERBOSE,info:b.INFO,warn:b.WARN,error:b.ERROR,silent:b.SILENT},T=b.INFO,S={[b.DEBUG]:"log",[b.VERBOSE]:"log",[b.INFO]:"info",[b.WARN]:"warn",[b.ERROR]:"error"},_=(t,e,...n)=>{if(e<t.logLevel)return;const s=(new Date).toISOString(),r=S[e];if(!r)throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`);console[r](`[${s}]  ${t.name}:`,...n);};var A,D="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},x=x||{},C=D||self;function N(){}function k(t){var e=typeof t;return "array"==(e="object"!=e?e:t?Array.isArray(t)?"array":e:"null")||"object"==e&&"number"==typeof t.length}function R(t){var e=typeof t;return "object"==e&&null!=t||"function"==e}var L="closure_uid_"+(1e9*Math.random()>>>0),M=0;function O(t,e,n){return t.call.apply(t.bind,arguments)}function V(t,e,n){if(!t)throw Error();if(2<arguments.length){var s=Array.prototype.slice.call(arguments,2);return function(){var n=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(n,s),t.apply(e,n)}}return function(){return t.apply(e,arguments)}}function F(t,e,n){return (F=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?O:V).apply(null,arguments)}function P(t,e){var n=Array.prototype.slice.call(arguments,1);return function(){var e=n.slice();return e.push.apply(e,arguments),t.apply(this,e)}}function U(t,e){function n(){}n.prototype=e.prototype,t.X=e.prototype,t.prototype=new n,t.prototype.constructor=t,t.Vb=function(t,n,s){for(var r=Array(arguments.length-2),i=2;i<arguments.length;i++)r[i-2]=arguments[i];return e.prototype[n].apply(t,r)};}function B(){this.s=this.s,this.o=this.o;}B.prototype.s=!1,B.prototype.na=function(){if(!this.s&&(this.s=!0,this.M(),0)){(function(t){return Object.prototype.hasOwnProperty.call(t,L)&&t[L]||(t[L]=++M)})(this);}},B.prototype.M=function(){if(this.o)for(;this.o.length;)this.o.shift()();};const G=Array.prototype.indexOf?function(t,e){return Array.prototype.indexOf.call(t,e,void 0)}:function(t,e){if("string"==typeof t)return "string"!=typeof e||1!=e.length?-1:t.indexOf(e,0);for(let n=0;n<t.length;n++)if(n in t&&t[n]===e)return n;return -1};function K(t){const e=t.length;if(0<e){const n=Array(e);for(let s=0;s<e;s++)n[s]=t[s];return n}return []}function j(t,e){for(let e=1;e<arguments.length;e++){const n=arguments[e];if(k(n)){const e=t.length||0,s=n.length||0;t.length=e+s;for(let r=0;r<s;r++)t[e+r]=n[r];}else t.push(n);}}function $(t,e){this.type=t,this.g=this.target=e,this.defaultPrevented=!1;}$.prototype.h=function(){this.defaultPrevented=!0;};var Q=function(){if(!C.addEventListener||!Object.defineProperty)return !1;var t=!1,e=Object.defineProperty({},"passive",{get:function(){t=!0;}});try{C.addEventListener("test",N,e),C.removeEventListener("test",N,e);}catch(t){}return t}();function z(t){return /^[\s\xa0]*$/.test(t)}var H=String.prototype.trim?function(t){return t.trim()}:function(t){return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(t)[1]};function W(t,e){return t<e?-1:t>e?1:0}function Y(){var t=C.navigator;return t&&(t=t.userAgent)?t:""}function X(t){return -1!=Y().indexOf(t)}function J(t){return J[" "](t),t}J[" "]=N;var Z,tt,et=X("Opera"),nt=X("Trident")||X("MSIE"),st=X("Edge"),rt=st||nt,it=X("Gecko")&&!(-1!=Y().toLowerCase().indexOf("webkit")&&!X("Edge"))&&!(X("Trident")||X("MSIE"))&&!X("Edge"),ot=-1!=Y().toLowerCase().indexOf("webkit")&&!X("Edge");function at(){var t=C.document;return t?t.documentMode:void 0}t:{var ut="",ct=(tt=Y(),it?/rv:([^\);]+)(\)|;)/.exec(tt):st?/Edge\/([\d\.]+)/.exec(tt):nt?/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(tt):ot?/WebKit\/(\S+)/.exec(tt):et?/(?:Version)[ \/]?(\S+)/.exec(tt):void 0);if(ct&&(ut=ct?ct[1]:""),nt){var ht=at();if(null!=ht&&ht>parseFloat(ut)){Z=String(ht);break t}}Z=ut;}var lt,dt={};function ft(){return function(t){var e=dt;return Object.prototype.hasOwnProperty.call(e,9)?e[9]:e[9]=t(9)}((function(){let t=0;const e=H(String(Z)).split("."),n=H("9").split("."),s=Math.max(e.length,n.length);for(let o=0;0==t&&o<s;o++){var r=e[o]||"",i=n[o]||"";do{if(r=/(\d*)(\D*)(.*)/.exec(r)||["","","",""],i=/(\d*)(\D*)(.*)/.exec(i)||["","","",""],0==r[0].length&&0==i[0].length)break;t=W(0==r[1].length?0:parseInt(r[1],10),0==i[1].length?0:parseInt(i[1],10))||W(0==r[2].length,0==i[2].length)||W(r[2],i[2]),r=r[3],i=i[3];}while(0==t)}return 0<=t}))}if(C.document&&nt){var mt=at();lt=mt||(parseInt(Z,10)||void 0);}else lt=void 0;var gt=lt;function pt(t,e){if($.call(this,t?t.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,t){var n=this.type=t.type,s=t.changedTouches&&t.changedTouches.length?t.changedTouches[0]:null;if(this.target=t.target||t.srcElement,this.g=e,e=t.relatedTarget){if(it){t:{try{J(e.nodeName);var r=!0;break t}catch(t){}r=!1;}r||(e=null);}}else "mouseover"==n?e=t.fromElement:"mouseout"==n&&(e=t.toElement);this.relatedTarget=e,s?(this.clientX=void 0!==s.clientX?s.clientX:s.pageX,this.clientY=void 0!==s.clientY?s.clientY:s.pageY,this.screenX=s.screenX||0,this.screenY=s.screenY||0):(this.clientX=void 0!==t.clientX?t.clientX:t.pageX,this.clientY=void 0!==t.clientY?t.clientY:t.pageY,this.screenX=t.screenX||0,this.screenY=t.screenY||0),this.button=t.button,this.key=t.key||"",this.ctrlKey=t.ctrlKey,this.altKey=t.altKey,this.shiftKey=t.shiftKey,this.metaKey=t.metaKey,this.pointerId=t.pointerId||0,this.pointerType="string"==typeof t.pointerType?t.pointerType:yt[t.pointerType]||"",this.state=t.state,this.i=t,t.defaultPrevented&&pt.X.h.call(this);}}U(pt,$);var yt={2:"touch",3:"pen",4:"mouse"};pt.prototype.h=function(){pt.X.h.call(this);var t=this.i;t.preventDefault?t.preventDefault():t.returnValue=!1;};var wt="closure_listenable_"+(1e6*Math.random()|0),vt=0;function It(t,e,n,s,r){this.listener=t,this.proxy=null,this.src=e,this.type=n,this.capture=!!s,this.ha=r,this.key=++vt,this.ba=this.ea=!1;}function bt(t){t.ba=!0,t.listener=null,t.proxy=null,t.src=null,t.ha=null;}function Et(t,e,n){for(const s in t)e.call(n,t[s],s,t);}function Tt(t){const e={};for(const n in t)e[n]=t[n];return e}const St="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function _t(t,e){let n,s;for(let e=1;e<arguments.length;e++){for(n in s=arguments[e],s)t[n]=s[n];for(let e=0;e<St.length;e++)n=St[e],Object.prototype.hasOwnProperty.call(s,n)&&(t[n]=s[n]);}}function At(t){this.src=t,this.g={},this.h=0;}function Dt(t,e){var n=e.type;if(n in t.g){var s,r=t.g[n],i=G(r,e);(s=0<=i)&&Array.prototype.splice.call(r,i,1),s&&(bt(e),0==t.g[n].length&&(delete t.g[n],t.h--));}}function xt(t,e,n,s){for(var r=0;r<t.length;++r){var i=t[r];if(!i.ba&&i.listener==e&&i.capture==!!n&&i.ha==s)return r}return -1}At.prototype.add=function(t,e,n,s,r){var i=t.toString();(t=this.g[i])||(t=this.g[i]=[],this.h++);var o=xt(t,e,s,r);return -1<o?(e=t[o],n||(e.ea=!1)):((e=new It(e,this.src,i,!!s,r)).ea=n,t.push(e)),e};var Ct="closure_lm_"+(1e6*Math.random()|0),Nt={};function kt(t,e,n,s,r){if(s&&s.once)return Lt(t,e,n,s,r);if(Array.isArray(e)){for(var i=0;i<e.length;i++)kt(t,e[i],n,s,r);return null}return n=Bt(n),t&&t[wt]?t.N(e,n,R(s)?!!s.capture:!!s,r):Rt(t,e,n,!1,s,r)}function Rt(t,e,n,s,r,i){if(!e)throw Error("Invalid event type");var o=R(r)?!!r.capture:!!r,a=Pt(t);if(a||(t[Ct]=a=new At(t)),(n=a.add(e,n,s,o,i)).proxy)return n;if(s=function(){function t(n){return e.call(t.src,t.listener,n)}const e=Ft;return t}(),n.proxy=s,s.src=t,s.listener=n,t.addEventListener)Q||(r=o),void 0===r&&(r=!1),t.addEventListener(e.toString(),s,r);else if(t.attachEvent)t.attachEvent(Vt(e.toString()),s);else {if(!t.addListener||!t.removeListener)throw Error("addEventListener and attachEvent are unavailable.");t.addListener(s);}return n}function Lt(t,e,n,s,r){if(Array.isArray(e)){for(var i=0;i<e.length;i++)Lt(t,e[i],n,s,r);return null}return n=Bt(n),t&&t[wt]?t.O(e,n,R(s)?!!s.capture:!!s,r):Rt(t,e,n,!0,s,r)}function Mt(t,e,n,s,r){if(Array.isArray(e))for(var i=0;i<e.length;i++)Mt(t,e[i],n,s,r);else s=R(s)?!!s.capture:!!s,n=Bt(n),t&&t[wt]?(t=t.i,(e=String(e).toString())in t.g&&(-1<(n=xt(i=t.g[e],n,s,r))&&(bt(i[n]),Array.prototype.splice.call(i,n,1),0==i.length&&(delete t.g[e],t.h--)))):t&&(t=Pt(t))&&(e=t.g[e.toString()],t=-1,e&&(t=xt(e,n,s,r)),(n=-1<t?e[t]:null)&&Ot(n));}function Ot(t){if("number"!=typeof t&&t&&!t.ba){var e=t.src;if(e&&e[wt])Dt(e.i,t);else {var n=t.type,s=t.proxy;e.removeEventListener?e.removeEventListener(n,s,t.capture):e.detachEvent?e.detachEvent(Vt(n),s):e.addListener&&e.removeListener&&e.removeListener(s),(n=Pt(e))?(Dt(n,t),0==n.h&&(n.src=null,e[Ct]=null)):bt(t);}}}function Vt(t){return t in Nt?Nt[t]:Nt[t]="on"+t}function Ft(t,e){if(t.ba)t=!0;else {e=new pt(e,this);var n=t.listener,s=t.ha||t.src;t.ea&&Ot(t),t=n.call(s,e);}return t}function Pt(t){return (t=t[Ct])instanceof At?t:null}var Ut="__closure_events_fn_"+(1e9*Math.random()>>>0);function Bt(t){return "function"==typeof t?t:(t[Ut]||(t[Ut]=function(e){return t.handleEvent(e)}),t[Ut])}function qt(){B.call(this),this.i=new At(this),this.P=this,this.I=null;}function Gt(t,e){var n,s=t.I;if(s)for(n=[];s;s=s.I)n.push(s);if(t=t.P,s=e.type||e,"string"==typeof e)e=new $(e,t);else if(e instanceof $)e.target=e.target||t;else {var r=e;_t(e=new $(s,t),r);}if(r=!0,n)for(var i=n.length-1;0<=i;i--){var o=e.g=n[i];r=Kt(o,s,!0,e)&&r;}if(r=Kt(o=e.g=t,s,!0,e)&&r,r=Kt(o,s,!1,e)&&r,n)for(i=0;i<n.length;i++)r=Kt(o=e.g=n[i],s,!1,e)&&r;}function Kt(t,e,n,s){if(!(e=t.i.g[String(e)]))return !0;e=e.concat();for(var r=!0,i=0;i<e.length;++i){var o=e[i];if(o&&!o.ba&&o.capture==n){var a=o.listener,u=o.ha||o.src;o.ea&&Dt(t.i,o),r=!1!==a.call(u,s)&&r;}}return r&&!s.defaultPrevented}U(qt,B),qt.prototype[wt]=!0,qt.prototype.removeEventListener=function(t,e,n,s){Mt(this,t,e,n,s);},qt.prototype.M=function(){if(qt.X.M.call(this),this.i){var t,e=this.i;for(t in e.g){for(var n=e.g[t],s=0;s<n.length;s++)bt(n[s]);delete e.g[t],e.h--;}}this.I=null;},qt.prototype.N=function(t,e,n,s){return this.i.add(String(t),e,!1,n,s)},qt.prototype.O=function(t,e,n,s){return this.i.add(String(t),e,!0,n,s)};var jt=C.JSON.stringify;function $t(){var t=Jt;let e=null;return t.g&&(e=t.g,t.g=t.g.next,t.g||(t.h=null),e.next=null),e}var Qt,zt=new class{constructor(t,e){this.i=t,this.j=e,this.h=0,this.g=null;}get(){let t;return 0<this.h?(this.h--,t=this.g,this.g=t.next,t.next=null):t=this.i(),t}}((()=>new Ht),(t=>t.reset()));class Ht{constructor(){this.next=this.g=this.h=null;}set(t,e){this.h=t,this.g=e,this.next=null;}reset(){this.next=this.g=this.h=null;}}function Wt(t){C.setTimeout((()=>{throw t}),0);}function Yt(t,e){Qt||function(){var t=C.Promise.resolve(void 0);Qt=function(){t.then(Zt);};}(),Xt||(Qt(),Xt=!0),Jt.add(t,e);}var Xt=!1,Jt=new class{constructor(){this.h=this.g=null;}add(t,e){const n=zt.get();n.set(t,e),this.h?this.h.next=n:this.g=n,this.h=n;}};function Zt(){for(var t;t=$t();){try{t.h.call(t.g);}catch(t){Wt(t);}var e=zt;e.j(t),100>e.h&&(e.h++,t.next=e.g,e.g=t);}Xt=!1;}function te(t,e){qt.call(this),this.h=t||1,this.g=e||C,this.j=F(this.kb,this),this.l=Date.now();}function ee(t){t.ca=!1,t.R&&(t.g.clearTimeout(t.R),t.R=null);}function ne(t,e,n){if("function"==typeof t)n&&(t=F(t,n));else {if(!t||"function"!=typeof t.handleEvent)throw Error("Invalid listener argument");t=F(t.handleEvent,t);}return 2147483647<Number(e)?-1:C.setTimeout(t,e||0)}function se(t){t.g=ne((()=>{t.g=null,t.i&&(t.i=!1,se(t));}),t.j);const e=t.h;t.h=null,t.m.apply(null,e);}U(te,qt),(A=te.prototype).ca=!1,A.R=null,A.kb=function(){if(this.ca){var t=Date.now()-this.l;0<t&&t<.8*this.h?this.R=this.g.setTimeout(this.j,this.h-t):(this.R&&(this.g.clearTimeout(this.R),this.R=null),Gt(this,"tick"),this.ca&&(ee(this),this.start()));}},A.start=function(){this.ca=!0,this.R||(this.R=this.g.setTimeout(this.j,this.h),this.l=Date.now());},A.M=function(){te.X.M.call(this),ee(this),delete this.g;};class re extends B{constructor(t,e){super(),this.m=t,this.j=e,this.h=null,this.i=!1,this.g=null;}l(t){this.h=arguments,this.g?this.i=!0:se(this);}M(){super.M(),this.g&&(C.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null);}}function ie(t){B.call(this),this.h=t,this.g={};}U(ie,B);var oe=[];function ae(t,e,n,s){Array.isArray(n)||(n&&(oe[0]=n.toString()),n=oe);for(var r=0;r<n.length;r++){var i=kt(e,n[r],s||t.handleEvent,!1,t.h||t);if(!i)break;t.g[i.key]=i;}}function ue(t){Et(t.g,(function(t,e){this.g.hasOwnProperty(e)&&Ot(t);}),t),t.g={};}function ce(){this.g=!0;}function he(t,e,n,s){t.info((function(){return "XMLHTTP TEXT ("+e+"): "+function(t,e){if(!t.g)return e;if(!e)return null;try{var n=JSON.parse(e);if(n)for(t=0;t<n.length;t++)if(Array.isArray(n[t])){var s=n[t];if(!(2>s.length)){var r=s[1];if(Array.isArray(r)&&!(1>r.length)){var i=r[0];if("noop"!=i&&"stop"!=i&&"close"!=i)for(var o=1;o<r.length;o++)r[o]="";}}}return jt(n)}catch(t){return e}}(t,n)+(s?" "+s:"")}));}ie.prototype.M=function(){ie.X.M.call(this),ue(this);},ie.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")},ce.prototype.Aa=function(){this.g=!1;},ce.prototype.info=function(){};var le={},de=null;function fe(){return de=de||new qt}function me(t){$.call(this,le.Oa,t);}function ge(t){const e=fe();Gt(e,new me(e));}function pe(t,e){$.call(this,le.STAT_EVENT,t),this.stat=e;}function ye(t){const e=fe();Gt(e,new pe(e,t));}function we(t,e){$.call(this,le.Pa,t),this.size=e;}function ve(t,e){if("function"!=typeof t)throw Error("Fn must not be null and must be a function");return C.setTimeout((function(){t();}),e)}le.Oa="serverreachability",U(me,$),le.STAT_EVENT="statevent",U(pe,$),le.Pa="timingevent",U(we,$);var Ie={NO_ERROR:0,lb:1,yb:2,xb:3,sb:4,wb:5,zb:6,La:7,TIMEOUT:8,Cb:9},be={qb:"complete",Mb:"success",Ma:"error",La:"abort",Eb:"ready",Fb:"readystatechange",TIMEOUT:"timeout",Ab:"incrementaldata",Db:"progress",tb:"downloadprogress",Ub:"uploadprogress"};function Ee(){}function Te(t){return t.h||(t.h=t.i())}function Se(){}Ee.prototype.h=null;var _e,Ae={OPEN:"a",pb:"b",Ma:"c",Bb:"d"};function De(){$.call(this,"d");}function xe(){$.call(this,"c");}function Ce(){}function Ne(t,e,n,s){this.l=t,this.j=e,this.m=n,this.U=s||1,this.S=new ie(this),this.O=Re,t=rt?125:void 0,this.T=new te(t),this.H=null,this.i=!1,this.s=this.A=this.v=this.K=this.F=this.V=this.B=null,this.D=[],this.g=null,this.C=0,this.o=this.u=null,this.Y=-1,this.I=!1,this.N=0,this.L=null,this.$=this.J=this.Z=this.P=!1,this.h=new ke;}function ke(){this.i=null,this.g="",this.h=!1;}U(De,$),U(xe,$),U(Ce,Ee),Ce.prototype.g=function(){return new XMLHttpRequest},Ce.prototype.i=function(){return {}},_e=new Ce;var Re=45e3,Le={},Me={};function Oe(t,e,n){t.K=1,t.v=tn(We(e)),t.s=n,t.P=!0,Ve(t,null);}function Ve(t,e){t.F=Date.now(),Be(t),t.A=We(t.v);var n=t.A,s=t.U;Array.isArray(s)||(s=[String(s)]),mn(n.i,"t",s),t.C=0,n=t.l.H,t.h=new ke,t.g=fs(t.l,n?e:null,!t.s),0<t.N&&(t.L=new re(F(t.Ka,t,t.g),t.N)),ae(t.S,t.g,"readystatechange",t.hb),e=t.H?Tt(t.H):{},t.s?(t.u||(t.u="POST"),e["Content-Type"]="application/x-www-form-urlencoded",t.g.da(t.A,t.u,t.s,e)):(t.u="GET",t.g.da(t.A,t.u,null,e)),ge(),function(t,e,n,s,r,i){t.info((function(){if(t.g)if(i)for(var o="",a=i.split("&"),u=0;u<a.length;u++){var c=a[u].split("=");if(1<c.length){var h=c[0];c=c[1];var l=h.split("_");o=2<=l.length&&"type"==l[1]?o+(h+"=")+c+"&":o+(h+"=redacted&");}}else o=null;else o=i;return "XMLHTTP REQ ("+s+") [attempt "+r+"]: "+e+"\n"+n+"\n"+o}));}(t.j,t.u,t.A,t.m,t.U,t.s);}function Fe(t){return !!t.g&&("GET"==t.u&&2!=t.K&&t.l.Da)}function Pe(t,e,n){let s,r=!0;for(;!t.I&&t.C<n.length;){if(s=Ue(t,n),s==Me){4==e&&(t.o=4,ye(14),r=!1),he(t.j,t.m,null,"[Incomplete Response]");break}if(s==Le){t.o=4,ye(15),he(t.j,t.m,n,"[Invalid Chunk]"),r=!1;break}he(t.j,t.m,s,null),$e(t,s);}Fe(t)&&s!=Me&&s!=Le&&(t.h.g="",t.C=0),4!=e||0!=n.length||t.h.h||(t.o=1,ye(16),r=!1),t.i=t.i&&r,r?0<n.length&&!t.$&&(t.$=!0,(e=t.l).g==t&&e.$&&!e.K&&(e.j.info("Great, no buffering proxy detected. Bytes received: "+n.length),is(e),e.K=!0,ye(11))):(he(t.j,t.m,n,"[Invalid Chunked Response]"),je(t),Ke(t));}function Ue(t,e){var n=t.C,s=e.indexOf("\n",n);return -1==s?Me:(n=Number(e.substring(n,s)),isNaN(n)?Le:(s+=1)+n>e.length?Me:(e=e.substr(s,n),t.C=s+n,e))}function Be(t){t.V=Date.now()+t.O,qe(t,t.O);}function qe(t,e){if(null!=t.B)throw Error("WatchDog timer not null");t.B=ve(F(t.fb,t),e);}function Ge(t){t.B&&(C.clearTimeout(t.B),t.B=null);}function Ke(t){0==t.l.G||t.I||us(t.l,t);}function je(t){Ge(t);var e=t.L;e&&"function"==typeof e.na&&e.na(),t.L=null,ee(t.T),ue(t.S),t.g&&(e=t.g,t.g=null,e.abort(),e.na());}function $e(t,e){try{var n=t.l;if(0!=n.G&&(n.g==t||In(n.h,t)))if(!t.J&&In(n.h,t)&&3==n.G){try{var s=n.Fa.g.parse(e);}catch(t){s=null;}if(Array.isArray(s)&&3==s.length){var r=s;if(0==r[0]){t:if(!n.u){if(n.g){if(!(n.g.F+3e3<t.F))break t;as(n),Xn(n);}rs(n),ye(18);}}else n.Ba=r[1],0<n.Ba-n.T&&37500>r[2]&&n.L&&0==n.A&&!n.v&&(n.v=ve(F(n.bb,n),6e3));if(1>=vn(n.h)&&n.ja){try{n.ja();}catch(t){}n.ja=void 0;}}else hs(n,11);}else if((t.J||n.g==t)&&as(n),!z(e))for(r=n.Fa.g.parse(e),e=0;e<r.length;e++){let c=r[e];if(n.T=c[0],c=c[1],2==n.G)if("c"==c[0]){n.I=c[1],n.ka=c[2];const e=c[3];null!=e&&(n.ma=e,n.j.info("VER="+n.ma));const r=c[4];null!=r&&(n.Ca=r,n.j.info("SVER="+n.Ca));const h=c[5];null!=h&&"number"==typeof h&&0<h&&(s=1.5*h,n.J=s,n.j.info("backChannelRequestTimeoutMs_="+s)),s=n;const l=t.g;if(l){const t=l.g?l.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(t){var i=s.h;i.g||-1==t.indexOf("spdy")&&-1==t.indexOf("quic")&&-1==t.indexOf("h2")||(i.j=i.l,i.g=new Set,i.h&&(bn(i,i.h),i.h=null));}if(s.D){const t=l.g?l.g.getResponseHeader("X-HTTP-Session-Id"):null;t&&(s.za=t,Ze(s.F,s.D,t));}}n.G=3,n.l&&n.l.xa(),n.$&&(n.P=Date.now()-t.F,n.j.info("Handshake RTT: "+n.P+"ms"));var o=t;if((s=n).sa=ds(s,s.H?s.ka:null,s.V),o.J){En(s.h,o);var a=o,u=s.J;u&&a.setTimeout(u),a.B&&(Ge(a),Be(a)),s.g=o;}else ss(s);0<n.i.length&&Zn(n);}else "stop"!=c[0]&&"close"!=c[0]||hs(n,7);else 3==n.G&&("stop"==c[0]||"close"==c[0]?"stop"==c[0]?hs(n,7):Yn(n):"noop"!=c[0]&&n.l&&n.l.wa(c),n.A=0);}ge(4);}catch(t){}}function Qe(t,e){if(t.forEach&&"function"==typeof t.forEach)t.forEach(e,void 0);else if(k(t)||"string"==typeof t)Array.prototype.forEach.call(t,e,void 0);else for(var n=function(t){if(t.oa&&"function"==typeof t.oa)return t.oa();if(!t.W||"function"!=typeof t.W){if("undefined"!=typeof Map&&t instanceof Map)return Array.from(t.keys());if(!("undefined"!=typeof Set&&t instanceof Set)){if(k(t)||"string"==typeof t){var e=[];t=t.length;for(var n=0;n<t;n++)e.push(n);return e}e=[],n=0;for(const s in t)e[n++]=s;return e}}}(t),s=function(t){if(t.W&&"function"==typeof t.W)return t.W();if("undefined"!=typeof Map&&t instanceof Map||"undefined"!=typeof Set&&t instanceof Set)return Array.from(t.values());if("string"==typeof t)return t.split("");if(k(t)){for(var e=[],n=t.length,s=0;s<n;s++)e.push(t[s]);return e}for(s in e=[],n=0,t)e[n++]=t[s];return e}(t),r=s.length,i=0;i<r;i++)e.call(void 0,s[i],n&&n[i],t);}(A=Ne.prototype).setTimeout=function(t){this.O=t;},A.hb=function(t){t=t.target;const e=this.L;e&&3==jn(t)?e.l():this.Ka(t);},A.Ka=function(t){try{if(t==this.g)t:{const h=jn(this.g);var e=this.g.Ea();const l=this.g.aa();if(!(3>h)&&(3!=h||rt||this.g&&(this.h.h||this.g.fa()||$n(this.g)))){this.I||4!=h||7==e||ge(8==e||0>=l?3:2),Ge(this);var n=this.g.aa();this.Y=n;e:if(Fe(this)){var s=$n(this.g);t="";var r=s.length,i=4==jn(this.g);if(!this.h.i){if("undefined"==typeof TextDecoder){je(this),Ke(this);var o="";break e}this.h.i=new C.TextDecoder;}for(e=0;e<r;e++)this.h.h=!0,t+=this.h.i.decode(s[e],{stream:i&&e==r-1});s.splice(0,r),this.h.g+=t,this.C=0,o=this.h.g;}else o=this.g.fa();if(this.i=200==n,function(t,e,n,s,r,i,o){t.info((function(){return "XMLHTTP RESP ("+s+") [ attempt "+r+"]: "+e+"\n"+n+"\n"+i+" "+o}));}(this.j,this.u,this.A,this.m,this.U,h,n),this.i){if(this.Z&&!this.J){e:{if(this.g){var a,u=this.g;if((a=u.g?u.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!z(a)){var c=a;break e}}c=null;}if(!(n=c)){this.i=!1,this.o=3,ye(12),je(this),Ke(this);break t}he(this.j,this.m,n,"Initial handshake response via X-HTTP-Initial-Response"),this.J=!0,$e(this,n);}this.P?(Pe(this,h,o),rt&&this.i&&3==h&&(ae(this.S,this.T,"tick",this.gb),this.T.start())):(he(this.j,this.m,o,null),$e(this,o)),4==h&&je(this),this.i&&!this.I&&(4==h?us(this.l,this):(this.i=!1,Be(this)));}else 400==n&&0<o.indexOf("Unknown SID")?(this.o=3,ye(12)):(this.o=0,ye(13)),je(this),Ke(this);}}}catch(t){}},A.gb=function(){if(this.g){var t=jn(this.g),e=this.g.fa();this.C<e.length&&(Ge(this),Pe(this,t,e),this.i&&4!=t&&Be(this));}},A.cancel=function(){this.I=!0,je(this);},A.fb=function(){this.B=null;const t=Date.now();0<=t-this.V?(function(t,e){t.info((function(){return "TIMEOUT: "+e}));}(this.j,this.A),2!=this.K&&(ge(),ye(17)),je(this),this.o=2,Ke(this)):qe(this,this.V-t);};var ze=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function He(t,e){if(this.g=this.s=this.j="",this.m=null,this.o=this.l="",this.h=!1,t instanceof He){this.h=void 0!==e?e:t.h,Ye(this,t.j),this.s=t.s,this.g=t.g,Xe(this,t.m),this.l=t.l,e=t.i;var n=new hn;n.i=e.i,e.g&&(n.g=new Map(e.g),n.h=e.h),Je(this,n),this.o=t.o;}else t&&(n=String(t).match(ze))?(this.h=!!e,Ye(this,n[1]||"",!0),this.s=en(n[2]||""),this.g=en(n[3]||"",!0),Xe(this,n[4]),this.l=en(n[5]||"",!0),Je(this,n[6]||"",!0),this.o=en(n[7]||"")):(this.h=!!e,this.i=new hn(null,this.h));}function We(t){return new He(t)}function Ye(t,e,n){t.j=n?en(e,!0):e,t.j&&(t.j=t.j.replace(/:$/,""));}function Xe(t,e){if(e){if(e=Number(e),isNaN(e)||0>e)throw Error("Bad port number "+e);t.m=e;}else t.m=null;}function Je(t,e,n){e instanceof hn?(t.i=e,function(t,e){e&&!t.j&&(ln(t),t.i=null,t.g.forEach((function(t,e){var n=e.toLowerCase();e!=n&&(dn(this,e),mn(this,n,t));}),t)),t.j=e;}(t.i,t.h)):(n||(e=nn(e,un)),t.i=new hn(e,t.h));}function Ze(t,e,n){t.i.set(e,n);}function tn(t){return Ze(t,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),t}function en(t,e){return t?e?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function nn(t,e,n){return "string"==typeof t?(t=encodeURI(t).replace(e,sn),n&&(t=t.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),t):null}function sn(t){return "%"+((t=t.charCodeAt(0))>>4&15).toString(16)+(15&t).toString(16)}He.prototype.toString=function(){var t=[],e=this.j;e&&t.push(nn(e,rn,!0),":");var n=this.g;return (n||"file"==e)&&(t.push("//"),(e=this.s)&&t.push(nn(e,rn,!0),"@"),t.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),null!=(n=this.m)&&t.push(":",String(n))),(n=this.l)&&(this.g&&"/"!=n.charAt(0)&&t.push("/"),t.push(nn(n,"/"==n.charAt(0)?an:on,!0))),(n=this.i.toString())&&t.push("?",n),(n=this.o)&&t.push("#",nn(n,cn)),t.join("")};var rn=/[#\/\?@]/g,on=/[#\?:]/g,an=/[#\?]/g,un=/[#\?@]/g,cn=/#/g;function hn(t,e){this.h=this.g=null,this.i=t||null,this.j=!!e;}function ln(t){t.g||(t.g=new Map,t.h=0,t.i&&function(t,e){if(t){t=t.split("&");for(var n=0;n<t.length;n++){var s=t[n].indexOf("="),r=null;if(0<=s){var i=t[n].substring(0,s);r=t[n].substring(s+1);}else i=t[n];e(i,r?decodeURIComponent(r.replace(/\+/g," ")):"");}}}(t.i,(function(e,n){t.add(decodeURIComponent(e.replace(/\+/g," ")),n);})));}function dn(t,e){ln(t),e=gn(t,e),t.g.has(e)&&(t.i=null,t.h-=t.g.get(e).length,t.g.delete(e));}function fn(t,e){return ln(t),e=gn(t,e),t.g.has(e)}function mn(t,e,n){dn(t,e),0<n.length&&(t.i=null,t.g.set(gn(t,e),K(n)),t.h+=n.length);}function gn(t,e){return e=String(e),t.j&&(e=e.toLowerCase()),e}(A=hn.prototype).add=function(t,e){ln(this),this.i=null,t=gn(this,t);var n=this.g.get(t);return n||this.g.set(t,n=[]),n.push(e),this.h+=1,this},A.forEach=function(t,e){ln(this),this.g.forEach((function(n,s){n.forEach((function(n){t.call(e,n,s,this);}),this);}),this);},A.oa=function(){ln(this);const t=Array.from(this.g.values()),e=Array.from(this.g.keys()),n=[];for(let s=0;s<e.length;s++){const r=t[s];for(let t=0;t<r.length;t++)n.push(e[s]);}return n},A.W=function(t){ln(this);let e=[];if("string"==typeof t)fn(this,t)&&(e=e.concat(this.g.get(gn(this,t))));else {t=Array.from(this.g.values());for(let n=0;n<t.length;n++)e=e.concat(t[n]);}return e},A.set=function(t,e){return ln(this),this.i=null,fn(this,t=gn(this,t))&&(this.h-=this.g.get(t).length),this.g.set(t,[e]),this.h+=1,this},A.get=function(t,e){return t&&0<(t=this.W(t)).length?String(t[0]):e},A.toString=function(){if(this.i)return this.i;if(!this.g)return "";const t=[],e=Array.from(this.g.keys());for(var n=0;n<e.length;n++){var s=e[n];const i=encodeURIComponent(String(s)),o=this.W(s);for(s=0;s<o.length;s++){var r=i;""!==o[s]&&(r+="="+encodeURIComponent(String(o[s]))),t.push(r);}}return this.i=t.join("&")};function pn(t){this.l=t||yn,C.PerformanceNavigationTiming?t=0<(t=C.performance.getEntriesByType("navigation")).length&&("hq"==t[0].nextHopProtocol||"h2"==t[0].nextHopProtocol):t=!!(C.g&&C.g.Ga&&C.g.Ga()&&C.g.Ga().Zb),this.j=t?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[];}var yn=10;function wn(t){return !!t.h||!!t.g&&t.g.size>=t.j}function vn(t){return t.h?1:t.g?t.g.size:0}function In(t,e){return t.h?t.h==e:!!t.g&&t.g.has(e)}function bn(t,e){t.g?t.g.add(e):t.h=e;}function En(t,e){t.h&&t.h==e?t.h=null:t.g&&t.g.has(e)&&t.g.delete(e);}function Tn(t){if(null!=t.h)return t.i.concat(t.h.D);if(null!=t.g&&0!==t.g.size){let e=t.i;for(const n of t.g.values())e=e.concat(n.D);return e}return K(t.i)}function Sn(){}function _n(){this.g=new Sn;}function An(t,e,n){const s=n||"";try{Qe(t,(function(t,n){let r=t;R(t)&&(r=jt(t)),e.push(s+n+"="+encodeURIComponent(r));}));}catch(t){throw e.push(s+"type="+encodeURIComponent("_badmap")),t}}function Dn(t,e,n,s,r){try{e.onload=null,e.onerror=null,e.onabort=null,e.ontimeout=null,r(s);}catch(t){}}function xn(t){this.l=t.$b||null,this.j=t.ib||!1;}function Cn(t,e){qt.call(this),this.D=t,this.u=e,this.m=void 0,this.readyState=Nn,this.status=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.v=new Headers,this.h=null,this.C="GET",this.B="",this.g=!1,this.A=this.j=this.l=null;}pn.prototype.cancel=function(){if(this.i=Tn(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&0!==this.g.size){for(const t of this.g.values())t.cancel();this.g.clear();}},Sn.prototype.stringify=function(t){return C.JSON.stringify(t,void 0)},Sn.prototype.parse=function(t){return C.JSON.parse(t,void 0)},U(xn,Ee),xn.prototype.g=function(){return new Cn(this.l,this.j)},xn.prototype.i=function(t){return function(){return t}}({}),U(Cn,qt);var Nn=0;function kn(t){t.j.read().then(t.Sa.bind(t)).catch(t.ga.bind(t));}function Rn(t){t.readyState=4,t.l=null,t.j=null,t.A=null,Ln(t);}function Ln(t){t.onreadystatechange&&t.onreadystatechange.call(t);}(A=Cn.prototype).open=function(t,e){if(this.readyState!=Nn)throw this.abort(),Error("Error reopening a connection");this.C=t,this.B=e,this.readyState=1,Ln(this);},A.send=function(t){if(1!=this.readyState)throw this.abort(),Error("need to call open() first. ");this.g=!0;const e={headers:this.v,method:this.C,credentials:this.m,cache:void 0};t&&(e.body=t),(this.D||C).fetch(new Request(this.B,e)).then(this.Va.bind(this),this.ga.bind(this));},A.abort=function(){this.response=this.responseText="",this.v=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch((()=>{})),1<=this.readyState&&this.g&&4!=this.readyState&&(this.g=!1,Rn(this)),this.readyState=Nn;},A.Va=function(t){if(this.g&&(this.l=t,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=t.headers,this.readyState=2,Ln(this)),this.g&&(this.readyState=3,Ln(this),this.g)))if("arraybuffer"===this.responseType)t.arrayBuffer().then(this.Ta.bind(this),this.ga.bind(this));else if(void 0!==C.ReadableStream&&"body"in t){if(this.j=t.body.getReader(),this.u){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[];}else this.response=this.responseText="",this.A=new TextDecoder;kn(this);}else t.text().then(this.Ua.bind(this),this.ga.bind(this));},A.Sa=function(t){if(this.g){if(this.u&&t.value)this.response.push(t.value);else if(!this.u){var e=t.value?t.value:new Uint8Array(0);(e=this.A.decode(e,{stream:!t.done}))&&(this.response=this.responseText+=e);}t.done?Rn(this):Ln(this),3==this.readyState&&kn(this);}},A.Ua=function(t){this.g&&(this.response=this.responseText=t,Rn(this));},A.Ta=function(t){this.g&&(this.response=t,Rn(this));},A.ga=function(){this.g&&Rn(this);},A.setRequestHeader=function(t,e){this.v.append(t,e);},A.getResponseHeader=function(t){return this.h&&this.h.get(t.toLowerCase())||""},A.getAllResponseHeaders=function(){if(!this.h)return "";const t=[],e=this.h.entries();for(var n=e.next();!n.done;)n=n.value,t.push(n[0]+": "+n[1]),n=e.next();return t.join("\r\n")},Object.defineProperty(Cn.prototype,"withCredentials",{get:function(){return "include"===this.m},set:function(t){this.m=t?"include":"same-origin";}});var Mn=C.JSON.parse;function On(t){qt.call(this),this.headers=new Map,this.u=t||null,this.h=!1,this.C=this.g=null,this.H="",this.m=0,this.j="",this.l=this.F=this.v=this.D=!1,this.B=0,this.A=null,this.J=Vn,this.K=this.L=!1;}U(On,qt);var Vn="",Fn=/^https?$/i,Pn=["POST","PUT"];function Un(t,e){t.h=!1,t.g&&(t.l=!0,t.g.abort(),t.l=!1),t.j=e,t.m=5,Bn(t),Gn(t);}function Bn(t){t.D||(t.D=!0,Gt(t,"complete"),Gt(t,"error"));}function qn(t){if(t.h&&void 0!==x&&(!t.C[1]||4!=jn(t)||2!=t.aa()))if(t.v&&4==jn(t))ne(t.Ha,0,t);else if(Gt(t,"readystatechange"),4==jn(t)){t.h=!1;try{const a=t.aa();t:switch(a){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var e=!0;break t;default:e=!1;}var n;if(!(n=e)){var s;if(s=0===a){var r=String(t.H).match(ze)[1]||null;if(!r&&C.self&&C.self.location){var i=C.self.location.protocol;r=i.substr(0,i.length-1);}s=!Fn.test(r?r.toLowerCase():"");}n=s;}if(n)Gt(t,"complete"),Gt(t,"success");else {t.m=6;try{var o=2<jn(t)?t.g.statusText:"";}catch(t){o="";}t.j=o+" ["+t.aa()+"]",Bn(t);}}finally{Gn(t);}}}function Gn(t,e){if(t.g){Kn(t);const n=t.g,s=t.C[0]?N:null;t.g=null,t.C=null,e||Gt(t,"ready");try{n.onreadystatechange=s;}catch(t){}}}function Kn(t){t.g&&t.K&&(t.g.ontimeout=null),t.A&&(C.clearTimeout(t.A),t.A=null);}function jn(t){return t.g?t.g.readyState:0}function $n(t){try{if(!t.g)return null;if("response"in t.g)return t.g.response;switch(t.J){case Vn:case"text":return t.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in t.g)return t.g.mozResponseArrayBuffer}return null}catch(t){return null}}function Qn(t){let e="";return Et(t,(function(t,n){e+=n,e+=":",e+=t,e+="\r\n";})),e}function zn(t,e,n){t:{for(s in n){var s=!1;break t}s=!0;}s||(n=Qn(n),"string"==typeof t?null!=n&&encodeURIComponent(String(n)):Ze(t,e,n));}function Hn(t,e,n){return n&&n.internalChannelParams&&n.internalChannelParams[t]||e}function Wn(t){this.Ca=0,this.i=[],this.j=new ce,this.ka=this.sa=this.F=this.V=this.g=this.za=this.D=this.ia=this.o=this.S=this.s=null,this.$a=this.U=0,this.Ya=Hn("failFast",!1,t),this.L=this.v=this.u=this.m=this.l=null,this.Y=!0,this.pa=this.Ba=this.T=-1,this.Z=this.A=this.C=0,this.Wa=Hn("baseRetryDelayMs",5e3,t),this.ab=Hn("retryDelaySeedMs",1e4,t),this.Za=Hn("forwardChannelMaxRetries",2,t),this.ta=Hn("forwardChannelRequestTimeoutMs",2e4,t),this.ra=t&&t.xmlHttpFactory||void 0,this.Da=t&&t.Yb||!1,this.J=void 0,this.H=t&&t.supportsCrossDomainXhr||!1,this.I="",this.h=new pn(t&&t.concurrentRequestLimit),this.Fa=new _n,this.O=t&&t.fastHandshake||!1,this.N=t&&t.encodeInitMessageHeaders||!1,this.O&&this.N&&(this.N=!1),this.Xa=t&&t.Wb||!1,t&&t.Aa&&this.j.Aa(),t&&t.forceLongPolling&&(this.Y=!1),this.$=!this.O&&this.Y&&t&&t.detectBufferingProxy||!1,this.ja=void 0,this.P=0,this.K=!1,this.la=this.B=null;}function Yn(t){if(Jn(t),3==t.G){var e=t.U++,n=We(t.F);Ze(n,"SID",t.I),Ze(n,"RID",e),Ze(n,"TYPE","terminate"),es(t,n),(e=new Ne(t,t.j,e,void 0)).K=2,e.v=tn(We(n)),n=!1,C.navigator&&C.navigator.sendBeacon&&(n=C.navigator.sendBeacon(e.v.toString(),"")),!n&&C.Image&&((new Image).src=e.v,n=!0),n||(e.g=fs(e.l,null),e.g.da(e.v)),e.F=Date.now(),Be(e);}ls(t);}function Xn(t){t.g&&(is(t),t.g.cancel(),t.g=null);}function Jn(t){Xn(t),t.u&&(C.clearTimeout(t.u),t.u=null),as(t),t.h.cancel(),t.m&&("number"==typeof t.m&&C.clearTimeout(t.m),t.m=null);}function Zn(t){wn(t.h)||t.m||(t.m=!0,Yt(t.Ja,t),t.C=0);}function ts(t,e){var n;n=e?e.m:t.U++;const s=We(t.F);Ze(s,"SID",t.I),Ze(s,"RID",n),Ze(s,"AID",t.T),es(t,s),t.o&&t.s&&zn(s,t.o,t.s),n=new Ne(t,t.j,n,t.C+1),null===t.o&&(n.H=t.s),e&&(t.i=e.D.concat(t.i)),e=ns(t,n,1e3),n.setTimeout(Math.round(.5*t.ta)+Math.round(.5*t.ta*Math.random())),bn(t.h,n),Oe(n,s,e);}function es(t,e){t.ia&&Et(t.ia,(function(t,n){Ze(e,n,t);})),t.l&&Qe({},(function(t,n){Ze(e,n,t);}));}function ns(t,e,n){n=Math.min(t.i.length,n);var s=t.l?F(t.l.Qa,t.l,t):null;t:{var r=t.i;let e=-1;for(;;){const t=["count="+n];-1==e?0<n?(e=r[0].h,t.push("ofs="+e)):e=0:t.push("ofs="+e);let i=!0;for(let o=0;o<n;o++){let n=r[o].h;const a=r[o].g;if(n-=e,0>n)e=Math.max(0,r[o].h-100),i=!1;else try{An(a,t,"req"+n+"_");}catch(t){s&&s(a);}}if(i){s=t.join("&");break t}}}return t=t.i.splice(0,n),e.D=t,s}function ss(t){t.g||t.u||(t.Z=1,Yt(t.Ia,t),t.A=0);}function rs(t){return !(t.g||t.u||3<=t.A)&&(t.Z++,t.u=ve(F(t.Ia,t),cs(t,t.A)),t.A++,!0)}function is(t){null!=t.B&&(C.clearTimeout(t.B),t.B=null);}function os(t){t.g=new Ne(t,t.j,"rpc",t.Z),null===t.o&&(t.g.H=t.s),t.g.N=0;var e=We(t.sa);Ze(e,"RID","rpc"),Ze(e,"SID",t.I),Ze(e,"CI",t.L?"0":"1"),Ze(e,"AID",t.T),Ze(e,"TYPE","xmlhttp"),es(t,e),t.o&&t.s&&zn(e,t.o,t.s),t.J&&t.g.setTimeout(t.J);var n=t.g;t=t.ka,n.K=1,n.v=tn(We(e)),n.s=null,n.P=!0,Ve(n,t);}function as(t){null!=t.v&&(C.clearTimeout(t.v),t.v=null);}function us(t,e){var n=null;if(t.g==e){as(t),is(t),t.g=null;var s=2;}else {if(!In(t.h,e))return;n=e.D,En(t.h,e),s=1;}if(0!=t.G)if(t.pa=e.Y,e.i)if(1==s){n=e.s?e.s.length:0,e=Date.now()-e.F;var r=t.C;Gt(s=fe(),new we(s,n)),Zn(t);}else ss(t);else if(3==(r=e.o)||0==r&&0<t.pa||!(1==s&&function(t,e){return !(vn(t.h)>=t.h.j-(t.m?1:0)||(t.m?(t.i=e.D.concat(t.i),0):1==t.G||2==t.G||t.C>=(t.Ya?0:t.Za)||(t.m=ve(F(t.Ja,t,e),cs(t,t.C)),t.C++,0)))}(t,e)||2==s&&rs(t)))switch(n&&0<n.length&&(e=t.h,e.i=e.i.concat(n)),r){case 1:hs(t,5);break;case 4:hs(t,10);break;case 3:hs(t,6);break;default:hs(t,2);}}function cs(t,e){let n=t.Wa+Math.floor(Math.random()*t.ab);return t.l||(n*=2),n*e}function hs(t,e){if(t.j.info("Error code "+e),2==e){var n=null;t.l&&(n=null);var s=F(t.jb,t);n||(n=new He("//www.google.com/images/cleardot.gif"),C.location&&"http"==C.location.protocol||Ye(n,"https"),tn(n)),function(t,e){const n=new ce;if(C.Image){const s=new Image;s.onload=P(Dn,n,s,"TestLoadImage: loaded",!0,e),s.onerror=P(Dn,n,s,"TestLoadImage: error",!1,e),s.onabort=P(Dn,n,s,"TestLoadImage: abort",!1,e),s.ontimeout=P(Dn,n,s,"TestLoadImage: timeout",!1,e),C.setTimeout((function(){s.ontimeout&&s.ontimeout();}),1e4),s.src=t;}else e(!1);}(n.toString(),s);}else ye(2);t.G=0,t.l&&t.l.va(e),ls(t),Jn(t);}function ls(t){if(t.G=0,t.la=[],t.l){const e=Tn(t.h);0==e.length&&0==t.i.length||(j(t.la,e),j(t.la,t.i),t.h.i.length=0,K(t.i),t.i.length=0),t.l.ua();}}function ds(t,e,n){var s=n instanceof He?We(n):new He(n,void 0);if(""!=s.g)e&&(s.g=e+"."+s.g),Xe(s,s.m);else {var r=C.location;s=r.protocol,e=e?e+"."+r.hostname:r.hostname,r=+r.port;var i=new He(null,void 0);s&&Ye(i,s),e&&(i.g=e),r&&Xe(i,r),n&&(i.l=n),s=i;}return n=t.D,e=t.za,n&&e&&Ze(s,n,e),Ze(s,"VER",t.ma),es(t,s),s}function fs(t,e,n){if(e&&!t.H)throw Error("Can't create secondary domain capable XhrIo object.");return (e=n&&t.Da&&!t.ra?new On(new xn({ib:!0})):new On(t.ra)).L=t.H,e}function ms(){}function gs(){if(nt&&!(10<=Number(gt)))throw Error("Environmental error: no available transport.")}function ps(t,e){qt.call(this),this.g=new Wn(e),this.l=t,this.h=e&&e.messageUrlParams||null,t=e&&e.messageHeaders||null,e&&e.clientProtocolHeaderRequired&&(t?t["X-Client-Protocol"]="webchannel":t={"X-Client-Protocol":"webchannel"}),this.g.s=t,t=e&&e.initMessageHeaders||null,e&&e.messageContentType&&(t?t["X-WebChannel-Content-Type"]=e.messageContentType:t={"X-WebChannel-Content-Type":e.messageContentType}),e&&e.ya&&(t?t["X-WebChannel-Client-Profile"]=e.ya:t={"X-WebChannel-Client-Profile":e.ya}),this.g.S=t,(t=e&&e.Xb)&&!z(t)&&(this.g.o=t),this.A=e&&e.supportsCrossDomainXhr||!1,this.v=e&&e.sendRawJson||!1,(e=e&&e.httpSessionIdParam)&&!z(e)&&(this.g.D=e,null!==(t=this.h)&&e in t&&(e in(t=this.h)&&delete t[e])),this.j=new vs(this);}function ys(t){De.call(this);var e=t.__sm__;if(e){t:{for(const n in e){t=n;break t}t=void 0;}(this.i=t)&&(t=this.i,e=null!==e&&t in e?e[t]:void 0),this.data=e;}else this.data=t;}function ws(){xe.call(this),this.status=1;}function vs(t){this.g=t;}(A=On.prototype).da=function(t,e,n,s){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.H+"; newUri="+t);e=e?e.toUpperCase():"GET",this.H=t,this.j="",this.m=0,this.D=!1,this.h=!0,this.g=this.u?this.u.g():_e.g(),this.C=this.u?Te(this.u):Te(_e),this.g.onreadystatechange=F(this.Ha,this);try{this.F=!0,this.g.open(e,String(t),!0),this.F=!1;}catch(t){return void Un(this,t)}if(t=n||"",n=new Map(this.headers),s)if(Object.getPrototypeOf(s)===Object.prototype)for(var r in s)n.set(r,s[r]);else {if("function"!=typeof s.keys||"function"!=typeof s.get)throw Error("Unknown input type for opt_headers: "+String(s));for(const t of s.keys())n.set(t,s.get(t));}s=Array.from(n.keys()).find((t=>"content-type"==t.toLowerCase())),r=C.FormData&&t instanceof C.FormData,!(0<=G(Pn,e))||s||r||n.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[t,e]of n)this.g.setRequestHeader(t,e);this.J&&(this.g.responseType=this.J),"withCredentials"in this.g&&this.g.withCredentials!==this.L&&(this.g.withCredentials=this.L);try{Kn(this),0<this.B&&((this.K=function(t){return nt&&ft()&&"number"==typeof t.timeout&&void 0!==t.ontimeout}(this.g))?(this.g.timeout=this.B,this.g.ontimeout=F(this.qa,this)):this.A=ne(this.qa,this.B,this)),this.v=!0,this.g.send(t),this.v=!1;}catch(t){Un(this,t);}},A.qa=function(){void 0!==x&&this.g&&(this.j="Timed out after "+this.B+"ms, aborting",this.m=8,Gt(this,"timeout"),this.abort(8));},A.abort=function(t){this.g&&this.h&&(this.h=!1,this.l=!0,this.g.abort(),this.l=!1,this.m=t||7,Gt(this,"complete"),Gt(this,"abort"),Gn(this));},A.M=function(){this.g&&(this.h&&(this.h=!1,this.l=!0,this.g.abort(),this.l=!1),Gn(this,!0)),On.X.M.call(this);},A.Ha=function(){this.s||(this.F||this.v||this.l?qn(this):this.eb());},A.eb=function(){qn(this);},A.aa=function(){try{return 2<jn(this)?this.g.status:-1}catch(t){return -1}},A.fa=function(){try{return this.g?this.g.responseText:""}catch(t){return ""}},A.Ra=function(t){if(this.g){var e=this.g.responseText;return t&&0==e.indexOf(t)&&(e=e.substring(t.length)),Mn(e)}},A.Ea=function(){return this.m},A.Na=function(){return "string"==typeof this.j?this.j:String(this.j)},(A=Wn.prototype).ma=8,A.G=1,A.Ja=function(t){if(this.m)if(this.m=null,1==this.G){if(!t){this.U=Math.floor(1e5*Math.random()),t=this.U++;const r=new Ne(this,this.j,t,void 0);let i=this.s;if(this.S&&(i?(i=Tt(i),_t(i,this.S)):i=this.S),null!==this.o||this.N||(r.H=i,i=null),this.O)t:{for(var e=0,n=0;n<this.i.length;n++){var s=this.i[n];if(void 0===(s="__data__"in s.g&&"string"==typeof(s=s.g.__data__)?s.length:void 0))break;if(4096<(e+=s)){e=n;break t}if(4096===e||n===this.i.length-1){e=n+1;break t}}e=1e3;}else e=1e3;e=ns(this,r,e),Ze(n=We(this.F),"RID",t),Ze(n,"CVER",22),this.D&&Ze(n,"X-HTTP-Session-Id",this.D),es(this,n),i&&(this.N?e="headers="+encodeURIComponent(String(Qn(i)))+"&"+e:this.o&&zn(n,this.o,i)),bn(this.h,r),this.Xa&&Ze(n,"TYPE","init"),this.O?(Ze(n,"$req",e),Ze(n,"SID","null"),r.Z=!0,Oe(r,n,null)):Oe(r,n,e),this.G=2;}}else 3==this.G&&(t?ts(this,t):0==this.i.length||wn(this.h)||ts(this));},A.Ia=function(){if(this.u=null,os(this),this.$&&!(this.K||null==this.g||0>=this.P)){var t=2*this.P;this.j.info("BP detection timer enabled: "+t),this.B=ve(F(this.cb,this),t);}},A.cb=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.L=!1,this.K=!0,ye(10),Xn(this),os(this));},A.bb=function(){null!=this.v&&(this.v=null,Xn(this),rs(this),ye(19));},A.jb=function(t){t?(this.j.info("Successfully pinged google.com"),ye(2)):(this.j.info("Failed to ping google.com"),ye(1));},(A=ms.prototype).xa=function(){},A.wa=function(){},A.va=function(){},A.ua=function(){},A.Qa=function(){},gs.prototype.g=function(t,e){return new ps(t,e)},U(ps,qt),ps.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.H=!0);var t=this.g,e=this.l,n=this.h||void 0;ye(0),t.V=e,t.ia=n||{},t.L=t.Y,t.F=ds(t,null,t.V),Zn(t);},ps.prototype.close=function(){Yn(this.g);},ps.prototype.u=function(t){var e=this.g;if("string"==typeof t){var n={};n.__data__=t,t=n;}else this.v&&((n={}).__data__=jt(t),t=n);e.i.push(new class{constructor(t,e){this.h=t,this.g=e;}}(e.$a++,t)),3==e.G&&Zn(e);},ps.prototype.M=function(){this.g.l=null,delete this.j,Yn(this.g),delete this.g,ps.X.M.call(this);},U(ys,De),U(ws,xe),U(vs,ms),vs.prototype.xa=function(){Gt(this.g,"a");},vs.prototype.wa=function(t){Gt(this.g,new ys(t));},vs.prototype.va=function(t){Gt(this.g,new ws());},vs.prototype.ua=function(){Gt(this.g,"b");},gs.prototype.createWebChannel=gs.prototype.g,ps.prototype.send=ps.prototype.u,ps.prototype.open=ps.prototype.m,ps.prototype.close=ps.prototype.close,Ie.NO_ERROR=0,Ie.TIMEOUT=8,Ie.HTTP_ERROR=6,be.COMPLETE="complete",Se.EventType=Ae,Ae.OPEN="a",Ae.CLOSE="b",Ae.ERROR="c",Ae.MESSAGE="d",qt.prototype.listen=qt.prototype.N,On.prototype.listenOnce=On.prototype.O,On.prototype.getLastError=On.prototype.Na,On.prototype.getLastErrorCode=On.prototype.Ea,On.prototype.getStatus=On.prototype.aa,On.prototype.getResponseJson=On.prototype.Ra,On.prototype.getResponseText=On.prototype.fa,On.prototype.send=On.prototype.da;var Is=Ie,bs=be,Es=le,Ts=10,Ss=11,_s=xn,As=Se,Ds=On;const xs="@firebase/firestore";class Cs{constructor(t){this.uid=t;}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}Cs.UNAUTHENTICATED=new Cs(null),Cs.GOOGLE_CREDENTIALS=new Cs("google-credentials-uid"),Cs.FIRST_PARTY=new Cs("first-party-uid"),Cs.MOCK_USER=new Cs("mock-user");let Ns="9.11.0";const ks=new class{constructor(t){this.name=t,this._logLevel=T,this._logHandler=_,this._userLogHandler=null;}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in b))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t;}setLogLevel(t){this._logLevel="string"==typeof t?E[t]:t;}get logHandler(){return this._logHandler}set logHandler(t){if("function"!=typeof t)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t;}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t;}debug(...t){this._userLogHandler&&this._userLogHandler(this,b.DEBUG,...t),this._logHandler(this,b.DEBUG,...t);}log(...t){this._userLogHandler&&this._userLogHandler(this,b.VERBOSE,...t),this._logHandler(this,b.VERBOSE,...t);}info(...t){this._userLogHandler&&this._userLogHandler(this,b.INFO,...t),this._logHandler(this,b.INFO,...t);}warn(...t){this._userLogHandler&&this._userLogHandler(this,b.WARN,...t),this._logHandler(this,b.WARN,...t);}error(...t){this._userLogHandler&&this._userLogHandler(this,b.ERROR,...t),this._logHandler(this,b.ERROR,...t);}}("@firebase/firestore");function Rs(){return ks.logLevel}function Ls(t){ks.setLogLevel(t);}function Ms(t,...e){if(ks.logLevel<=b.DEBUG){const n=e.map(Fs);ks.debug(`Firestore (${Ns}): ${t}`,...n);}}function Os(t,...e){if(ks.logLevel<=b.ERROR){const n=e.map(Fs);ks.error(`Firestore (${Ns}): ${t}`,...n);}}function Vs(t,...e){if(ks.logLevel<=b.WARN){const n=e.map(Fs);ks.warn(`Firestore (${Ns}): ${t}`,...n);}}function Fs(t){if("string"==typeof t)return t;try{return e=t,JSON.stringify(e)}catch(e){return t}var e;}function Ps(t="Unexpected state"){const e=`FIRESTORE (${Ns}) INTERNAL ASSERTION FAILED: `+t;throw Os(e),new Error(e)}function Us(t,e){t||Ps();}function Bs(t,e){t||Ps();}function qs(t,e){return t}const Gs={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class Ks extends m{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`;}}class js{constructor(){this.promise=new Promise(((t,e)=>{this.resolve=t,this.reject=e;}));}}class $s{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`);}}class Qs{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable((()=>e(Cs.UNAUTHENTICATED)));}shutdown(){}}class zs{constructor(t){this.token=t,this.changeListener=null;}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(t,e){this.changeListener=e,t.enqueueRetryable((()=>e(this.token.user)));}shutdown(){this.changeListener=null;}}class Hs{constructor(t){this.t=t,this.currentUser=Cs.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null;}start(t,e){let n=this.i;const s=t=>this.i!==n?(n=this.i,e(t)):Promise.resolve();let r=new js;this.o=()=>{this.i++,this.currentUser=this.u(),r.resolve(),r=new js,t.enqueueRetryable((()=>s(this.currentUser)));};const i=()=>{const e=r;t.enqueueRetryable((async()=>{await e.promise,await s(this.currentUser);}));},o=t=>{Ms("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=t,this.auth.addAuthTokenListener(this.o),i();};this.t.onInit((t=>o(t))),setTimeout((()=>{if(!this.auth){const t=this.t.getImmediate({optional:!0});t?o(t):(Ms("FirebaseAuthCredentialsProvider","Auth not yet detected"),r.resolve(),r=new js);}}),0),i();}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then((e=>this.i!==t?(Ms("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):e?(Us("string"==typeof e.accessToken),new $s(e.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0;}shutdown(){this.auth&&this.auth.removeAuthTokenListener(this.o);}u(){const t=this.auth&&this.auth.getUid();return Us(null===t||"string"==typeof t),new Cs(t)}}class Ws{constructor(t,e,n,s){this.h=t,this.l=e,this.m=n,this.g=s,this.type="FirstParty",this.user=Cs.FIRST_PARTY,this.p=new Map;}I(){return this.g?this.g():(Us(!("object"!=typeof this.h||null===this.h||!this.h.auth||!this.h.auth.getAuthHeaderValueForFirstParty)),this.h.auth.getAuthHeaderValueForFirstParty([]))}get headers(){this.p.set("X-Goog-AuthUser",this.l);const t=this.I();return t&&this.p.set("Authorization",t),this.m&&this.p.set("X-Goog-Iam-Authorization-Token",this.m),this.p}}class Ys{constructor(t,e,n,s){this.h=t,this.l=e,this.m=n,this.g=s;}getToken(){return Promise.resolve(new Ws(this.h,this.l,this.m,this.g))}start(t,e){t.enqueueRetryable((()=>e(Cs.FIRST_PARTY)));}shutdown(){}invalidateToken(){}}class Xs{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value);}}class Js{constructor(t){this.T=t,this.forceRefresh=!1,this.appCheck=null,this.A=null;}start(t,e){const n=t=>{null!=t.error&&Ms("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${t.error.message}`);const n=t.token!==this.A;return this.A=t.token,Ms("FirebaseAppCheckTokenProvider",`Received ${n?"new":"existing"} token.`),n?e(t.token):Promise.resolve()};this.o=e=>{t.enqueueRetryable((()=>n(e)));};const s=t=>{Ms("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=t,this.appCheck.addTokenListener(this.o);};this.T.onInit((t=>s(t))),setTimeout((()=>{if(!this.appCheck){const t=this.T.getImmediate({optional:!0});t?s(t):Ms("FirebaseAppCheckTokenProvider","AppCheck not yet detected");}}),0);}getToken(){const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then((t=>t?(Us("string"==typeof t.token),this.A=t.token,new Xs(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0;}shutdown(){this.appCheck&&this.appCheck.removeTokenListener(this.o);}}class Zs{getToken(){return Promise.resolve(new Xs(""))}invalidateToken(){}start(t,e){}shutdown(){}}function tr(t){const e="undefined"!=typeof self&&(self.crypto||self.msCrypto),n=new Uint8Array(t);if(e&&"function"==typeof e.getRandomValues)e.getRandomValues(n);else for(let e=0;e<t;e++)n[e]=Math.floor(256*Math.random());return n}class er{static R(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=Math.floor(256/t.length)*t.length;let n="";for(;n.length<20;){const s=tr(40);for(let r=0;r<s.length;++r)n.length<20&&s[r]<e&&(n+=t.charAt(s[r]%t.length));}return n}}function nr(t,e){return t<e?-1:t>e?1:0}function sr(t,e,n){return t.length===e.length&&t.every(((t,s)=>n(t,e[s])))}function rr(t){return t+"\0"}class ir{constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new Ks(Gs.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new Ks(Gs.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<-62135596800)throw new Ks(Gs.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new Ks(Gs.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}static now(){return ir.fromMillis(Date.now())}static fromDate(t){return ir.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),n=Math.floor(1e6*(t-1e3*e));return new ir(e,n)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/1e6}_compareTo(t){return this.seconds===t.seconds?nr(this.nanoseconds,t.nanoseconds):nr(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return "Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return {seconds:this.seconds,nanoseconds:this.nanoseconds}}valueOf(){const t=this.seconds- -62135596800;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}class or{constructor(t){this.timestamp=t;}static fromTimestamp(t){return new or(t)}static min(){return new or(new ir(0,0))}static max(){return new or(new ir(253402300799,999999999))}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return "SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}class ar{constructor(t,e,n){void 0===e?e=0:e>t.length&&Ps(),void 0===n?n=t.length-e:n>t.length-e&&Ps(),this.segments=t,this.offset=e,this.len=n;}get length(){return this.len}isEqual(t){return 0===ar.comparator(this,t)}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof ar?t.forEach((t=>{e.push(t);})):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=void 0===t?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return 0===this.length}isPrefixOf(t){if(t.length<this.length)return !1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return !1;return !0}isImmediateParentOf(t){if(this.length+1!==t.length)return !1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return !1;return !0}forEach(t){for(let e=this.offset,n=this.limit();e<n;e++)t(this.segments[e]);}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const n=Math.min(t.length,e.length);for(let s=0;s<n;s++){const n=t.get(s),r=e.get(s);if(n<r)return -1;if(n>r)return 1}return t.length<e.length?-1:t.length>e.length?1:0}}class ur extends ar{construct(t,e,n){return new ur(t,e,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}static fromString(...t){const e=[];for(const n of t){if(n.indexOf("//")>=0)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);e.push(...n.split("/").filter((t=>t.length>0)));}return new ur(e)}static emptyPath(){return new ur([])}}const cr=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class hr extends ar{construct(t,e,n){return new hr(t,e,n)}static isValidIdentifier(t){return cr.test(t)}canonicalString(){return this.toArray().map((t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),hr.isValidIdentifier(t)||(t="`"+t+"`"),t))).join(".")}toString(){return this.canonicalString()}isKeyField(){return 1===this.length&&"__name__"===this.get(0)}static keyField(){return new hr(["__name__"])}static fromServerFormat(t){const e=[];let n="",s=0;const r=()=>{if(0===n.length)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(n),n="";};let i=!1;for(;s<t.length;){const e=t[s];if("\\"===e){if(s+1===t.length)throw new Ks(Gs.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const e=t[s+1];if("\\"!==e&&"."!==e&&"`"!==e)throw new Ks(Gs.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);n+=e,s+=2;}else "`"===e?(i=!i,s++):"."!==e||i?(n+=e,s++):(r(),s++);}if(r(),i)throw new Ks(Gs.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new hr(e)}static emptyPath(){return new hr([])}}class lr{constructor(t){this.path=t;}static fromPath(t){return new lr(ur.fromString(t))}static fromName(t){return new lr(ur.fromString(t).popFirst(5))}static empty(){return new lr(ur.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return null!==t&&0===ur.comparator(this.path,t.path)}toString(){return this.path.toString()}static comparator(t,e){return ur.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new lr(new ur(t.slice()))}}class dr{constructor(t,e,n,s){this.indexId=t,this.collectionGroup=e,this.fields=n,this.indexState=s;}}function fr(t){return t.fields.find((t=>2===t.kind))}function mr(t){return t.fields.filter((t=>2!==t.kind))}function gr(t,e){let n=nr(t.collectionGroup,e.collectionGroup);if(0!==n)return n;for(let s=0;s<Math.min(t.fields.length,e.fields.length);++s)if(n=yr(t.fields[s],e.fields[s]),0!==n)return n;return nr(t.fields.length,e.fields.length)}dr.UNKNOWN_ID=-1;class pr{constructor(t,e){this.fieldPath=t,this.kind=e;}}function yr(t,e){const n=hr.comparator(t.fieldPath,e.fieldPath);return 0!==n?n:nr(t.kind,e.kind)}class wr{constructor(t,e){this.sequenceNumber=t,this.offset=e;}static empty(){return new wr(0,br.min())}}function vr(t,e){const n=t.toTimestamp().seconds,s=t.toTimestamp().nanoseconds+1,r=or.fromTimestamp(1e9===s?new ir(n+1,0):new ir(n,s));return new br(r,lr.empty(),e)}function Ir(t){return new br(t.readTime,t.key,-1)}class br{constructor(t,e,n){this.readTime=t,this.documentKey=e,this.largestBatchId=n;}static min(){return new br(or.min(),lr.empty(),-1)}static max(){return new br(or.max(),lr.empty(),-1)}}function Er(t,e){let n=t.readTime.compareTo(e.readTime);return 0!==n?n:(n=lr.comparator(t.documentKey,e.documentKey),0!==n?n:nr(t.largestBatchId,e.largestBatchId))}const Tr="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Sr{constructor(){this.onCommittedListeners=[];}addOnCommittedListener(t){this.onCommittedListeners.push(t);}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((t=>t()));}}async function _r(t){if(t.code!==Gs.FAILED_PRECONDITION||t.message!==Tr)throw t;Ms("LocalStore","Unexpectedly lost primary lease");}class Ar{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t);}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t);}));}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&Ps(),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new Ar(((n,s)=>{this.nextCallback=e=>{this.wrapSuccess(t,e).next(n,s);},this.catchCallback=t=>{this.wrapFailure(e,t).next(n,s);};}))}toPromise(){return new Promise(((t,e)=>{this.next(t,e);}))}wrapUserFunction(t){try{const e=t();return e instanceof Ar?e:Ar.resolve(e)}catch(t){return Ar.reject(t)}}wrapSuccess(t,e){return t?this.wrapUserFunction((()=>t(e))):Ar.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction((()=>t(e))):Ar.reject(e)}static resolve(t){return new Ar(((e,n)=>{e(t);}))}static reject(t){return new Ar(((e,n)=>{n(t);}))}static waitFor(t){return new Ar(((e,n)=>{let s=0,r=0,i=!1;t.forEach((t=>{++s,t.next((()=>{++r,i&&r===s&&e();}),(t=>n(t)));})),i=!0,r===s&&e();}))}static or(t){let e=Ar.resolve(!1);for(const n of t)e=e.next((t=>t?Ar.resolve(t):n()));return e}static forEach(t,e){const n=[];return t.forEach(((t,s)=>{n.push(e.call(this,t,s));})),this.waitFor(n)}static mapArray(t,e){return new Ar(((n,s)=>{const r=t.length,i=new Array(r);let o=0;for(let a=0;a<r;a++){const u=a;e(t[u]).next((t=>{i[u]=t,++o,o===r&&n(i);}),(t=>s(t)));}}))}static doWhile(t,e){return new Ar(((n,s)=>{const r=()=>{!0===t()?e().next((()=>{r();}),s):n();};r();}))}}class Dr{constructor(t,e){this.action=t,this.transaction=e,this.aborted=!1,this.P=new js,this.transaction.oncomplete=()=>{this.P.resolve();},this.transaction.onabort=()=>{e.error?this.P.reject(new Nr(t,e.error)):this.P.resolve();},this.transaction.onerror=e=>{const n=Or(e.target.error);this.P.reject(new Nr(t,n));};}static open(t,e,n,s){try{return new Dr(e,t.transaction(s,n))}catch(t){throw new Nr(e,t)}}get v(){return this.P.promise}abort(t){t&&this.P.reject(t),this.aborted||(Ms("SimpleDb","Aborting transaction:",t?t.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort());}V(){const t=this.transaction;this.aborted||"function"!=typeof t.commit||t.commit();}store(t){const e=this.transaction.objectStore(t);return new Rr(e)}}class xr{constructor(t,e,n){this.name=t,this.version=e,this.S=n,12.2===xr.D(c())&&Os("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.");}static delete(t){return Ms("SimpleDb","Removing database:",t),Lr(window.indexedDB.deleteDatabase(t)).toPromise()}static C(){if("object"!=typeof indexedDB)return !1;if(xr.N())return !0;const t=c(),e=xr.D(t),n=0<e&&e<10,s=xr.k(t),r=0<s&&s<4.5;return !(t.indexOf("MSIE ")>0||t.indexOf("Trident/")>0||t.indexOf("Edge/")>0||n||r)}static N(){var t;return "undefined"!=typeof process&&"YES"===(null===(t=process.env)||void 0===t?void 0:t.O)}static M(t,e){return t.store(e)}static D(t){const e=t.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=e?e[1].split("_").slice(0,2).join("."):"-1";return Number(n)}static k(t){const e=t.match(/Android ([\d.]+)/i),n=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(n)}async F(t){return this.db||(Ms("SimpleDb","Opening database:",this.name),this.db=await new Promise(((e,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=t=>{const n=t.target.result;e(n);},s.onblocked=()=>{n(new Nr(t,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."));},s.onerror=e=>{const s=e.target.error;"VersionError"===s.name?n(new Ks(Gs.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):"InvalidStateError"===s.name?n(new Ks(Gs.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+s)):n(new Nr(t,s));},s.onupgradeneeded=t=>{Ms("SimpleDb",'Database "'+this.name+'" requires upgrade from version:',t.oldVersion);const e=t.target.result;this.S.$(e,s.transaction,t.oldVersion,this.version).next((()=>{Ms("SimpleDb","Database upgrade to version "+this.version+" complete");}));};}))),this.B&&(this.db.onversionchange=t=>this.B(t)),this.db}L(t){this.B=t,this.db&&(this.db.onversionchange=e=>t(e));}async runTransaction(t,e,n,s){const r="readonly"===e;let i=0;for(;;){++i;try{this.db=await this.F(t);const e=Dr.open(this.db,t,r?"readonly":"readwrite",n),i=s(e).next((t=>(e.V(),t))).catch((t=>(e.abort(t),Ar.reject(t)))).toPromise();return i.catch((()=>{})),await e.v,i}catch(t){const e=t,n="FirebaseError"!==e.name&&i<3;if(Ms("SimpleDb","Transaction failed with error:",e.message,"Retrying:",n),this.close(),!n)return Promise.reject(e)}}}close(){this.db&&this.db.close(),this.db=void 0;}}class Cr{constructor(t){this.U=t,this.q=!1,this.K=null;}get isDone(){return this.q}get G(){return this.K}set cursor(t){this.U=t;}done(){this.q=!0;}j(t){this.K=t;}delete(){return Lr(this.U.delete())}}class Nr extends Ks{constructor(t,e){super(Gs.UNAVAILABLE,`IndexedDB transaction '${t}' failed: ${e}`),this.name="IndexedDbTransactionError";}}function kr(t){return "IndexedDbTransactionError"===t.name}class Rr{constructor(t){this.store=t;}put(t,e){let n;return void 0!==e?(Ms("SimpleDb","PUT",this.store.name,t,e),n=this.store.put(e,t)):(Ms("SimpleDb","PUT",this.store.name,"<auto-key>",t),n=this.store.put(t)),Lr(n)}add(t){return Ms("SimpleDb","ADD",this.store.name,t,t),Lr(this.store.add(t))}get(t){return Lr(this.store.get(t)).next((e=>(void 0===e&&(e=null),Ms("SimpleDb","GET",this.store.name,t,e),e)))}delete(t){return Ms("SimpleDb","DELETE",this.store.name,t),Lr(this.store.delete(t))}count(){return Ms("SimpleDb","COUNT",this.store.name),Lr(this.store.count())}W(t,e){const n=this.options(t,e);if(n.index||"function"!=typeof this.store.getAll){const t=this.cursor(n),e=[];return this.H(t,((t,n)=>{e.push(n);})).next((()=>e))}{const t=this.store.getAll(n.range);return new Ar(((e,n)=>{t.onerror=t=>{n(t.target.error);},t.onsuccess=t=>{e(t.target.result);};}))}}J(t,e){const n=this.store.getAll(t,null===e?void 0:e);return new Ar(((t,e)=>{n.onerror=t=>{e(t.target.error);},n.onsuccess=e=>{t(e.target.result);};}))}Y(t,e){Ms("SimpleDb","DELETE ALL",this.store.name);const n=this.options(t,e);n.X=!1;const s=this.cursor(n);return this.H(s,((t,e,n)=>n.delete()))}Z(t,e){let n;e?n=t:(n={},e=t);const s=this.cursor(n);return this.H(s,e)}tt(t){const e=this.cursor({});return new Ar(((n,s)=>{e.onerror=t=>{const e=Or(t.target.error);s(e);},e.onsuccess=e=>{const s=e.target.result;s?t(s.primaryKey,s.value).next((t=>{t?s.continue():n();})):n();};}))}H(t,e){const n=[];return new Ar(((s,r)=>{t.onerror=t=>{r(t.target.error);},t.onsuccess=t=>{const r=t.target.result;if(!r)return void s();const i=new Cr(r),o=e(r.primaryKey,r.value,i);if(o instanceof Ar){const t=o.catch((t=>(i.done(),Ar.reject(t))));n.push(t);}i.isDone?s():null===i.G?r.continue():r.continue(i.G);};})).next((()=>Ar.waitFor(n)))}options(t,e){let n;return void 0!==t&&("string"==typeof t?n=t:e=t),{index:n,range:e}}cursor(t){let e="next";if(t.reverse&&(e="prev"),t.index){const n=this.store.index(t.index);return t.X?n.openKeyCursor(t.range,e):n.openCursor(t.range,e)}return this.store.openCursor(t.range,e)}}function Lr(t){return new Ar(((e,n)=>{t.onsuccess=t=>{const n=t.target.result;e(n);},t.onerror=t=>{const e=Or(t.target.error);n(e);};}))}let Mr=!1;function Or(t){const e=xr.D(c());if(e>=12.2&&e<13){const e="An internal error was encountered in the Indexed Database server";if(t.message.indexOf(e)>=0){const t=new Ks("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${e}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return Mr||(Mr=!0,setTimeout((()=>{throw t}),0)),t}}return t}class Vr{constructor(t,e){this.asyncQueue=t,this.et=e,this.task=null;}start(){this.nt(15e3);}stop(){this.task&&(this.task.cancel(),this.task=null);}get started(){return null!==this.task}nt(t){Ms("IndexBackiller",`Scheduled in ${t}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",t,(async()=>{this.task=null;try{Ms("IndexBackiller",`Documents written: ${await this.et.st()}`);}catch(t){kr(t)?Ms("IndexBackiller","Ignoring IndexedDB error during index backfill: ",t):await _r(t);}await this.nt(6e4);}));}}class Fr{constructor(t,e){this.localStore=t,this.persistence=e;}async st(t=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(e=>this.it(e,t)))}it(t,e){const n=new Set;let s=e,r=!0;return Ar.doWhile((()=>!0===r&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(t).next((e=>{if(null!==e&&!n.has(e))return Ms("IndexBackiller",`Processing collection: ${e}`),this.rt(t,e,s).next((t=>{s-=t,n.add(e);}));r=!1;})))).next((()=>e-s))}rt(t,e,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(t,e).next((s=>this.localStore.localDocuments.getNextDocuments(t,e,s,n).next((n=>{const r=n.changes;return this.localStore.indexManager.updateIndexEntries(t,r).next((()=>this.ot(s,n))).next((n=>(Ms("IndexBackiller",`Updating offset: ${n}`),this.localStore.indexManager.updateCollectionGroup(t,e,n)))).next((()=>r.size))}))))}ot(t,e){let n=t;return e.changes.forEach(((t,e)=>{const s=Ir(e);Er(s,n)>0&&(n=s);})),new br(n.readTime,n.documentKey,Math.max(e.batchId,t.largestBatchId))}}class Pr{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=t=>this.ut(t),this.ct=t=>e.writeSequenceNumber(t));}ut(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ct&&this.ct(t),t}}function Ur(t){let e=0;for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e++;return e}function Br(t,e){for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e(n,t[n]);}function qr(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return !1;return !0}Pr.at=-1;class Gr{constructor(t,e){this.comparator=t,this.root=e||jr.EMPTY;}insert(t,e){return new Gr(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,jr.BLACK,null,null))}remove(t){return new Gr(this.comparator,this.root.remove(t,this.comparator).copy(null,null,jr.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const n=this.comparator(t,e.key);if(0===n)return e.value;n<0?e=e.left:n>0&&(e=e.right);}return null}indexOf(t){let e=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(t,n.key);if(0===s)return e+n.left.size;s<0?n=n.left:(e+=n.left.size+1,n=n.right);}return -1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal(((e,n)=>(t(e,n),!1)));}toString(){const t=[];return this.inorderTraversal(((e,n)=>(t.push(`${e}:${n}`),!1))),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new Kr(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new Kr(this.root,t,this.comparator,!1)}getReverseIterator(){return new Kr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new Kr(this.root,t,this.comparator,!0)}}class Kr{constructor(t,e,n,s){this.isReverse=s,this.nodeStack=[];let r=1;for(;!t.isEmpty();)if(r=e?n(t.key,e):1,e&&s&&(r*=-1),r<0)t=this.isReverse?t.left:t.right;else {if(0===r){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left;}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(0===this.nodeStack.length)return null;const t=this.nodeStack[this.nodeStack.length-1];return {key:t.key,value:t.value}}}class jr{constructor(t,e,n,s,r){this.key=t,this.value=e,this.color=null!=n?n:jr.RED,this.left=null!=s?s:jr.EMPTY,this.right=null!=r?r:jr.EMPTY,this.size=this.left.size+1+this.right.size;}copy(t,e,n,s,r){return new jr(null!=t?t:this.key,null!=e?e:this.value,null!=n?n:this.color,null!=s?s:this.left,null!=r?r:this.right)}isEmpty(){return !1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,n){let s=this;const r=n(t,s.key);return s=r<0?s.copy(null,null,null,s.left.insert(t,e,n),null):0===r?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return jr.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let n,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else {if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),0===e(t,s.key)){if(s.right.isEmpty())return jr.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin());}s=s.copy(null,null,null,null,s.right.remove(t,e));}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,jr.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,jr.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw Ps();if(this.right.isRed())throw Ps();const t=this.left.check();if(t!==this.right.check())throw Ps();return t+(this.isRed()?0:1)}}jr.EMPTY=null,jr.RED=!0,jr.BLACK=!1,jr.EMPTY=new class{constructor(){this.size=0;}get key(){throw Ps()}get value(){throw Ps()}get color(){throw Ps()}get left(){throw Ps()}get right(){throw Ps()}copy(t,e,n,s,r){return this}insert(t,e,n){return new jr(t,e)}remove(t,e){return this}isEmpty(){return !0}inorderTraversal(t){return !1}reverseTraversal(t){return !1}minKey(){return null}maxKey(){return null}isRed(){return !1}checkMaxDepth(){return !0}check(){return 0}};class $r{constructor(t){this.comparator=t,this.data=new Gr(this.comparator);}has(t){return null!==this.data.get(t)}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal(((e,n)=>(t(e),!1)));}forEachInRange(t,e){const n=this.data.getIteratorFrom(t[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key);}}forEachWhile(t,e){let n;for(n=void 0!==e?this.data.getIteratorFrom(e):this.data.getIterator();n.hasNext();)if(!t(n.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new Qr(this.data.getIterator())}getIteratorFrom(t){return new Qr(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach((t=>{e=e.add(t);})),e}isEqual(t){if(!(t instanceof $r))return !1;if(this.size!==t.size)return !1;const e=this.data.getIterator(),n=t.data.getIterator();for(;e.hasNext();){const t=e.getNext().key,s=n.getNext().key;if(0!==this.comparator(t,s))return !1}return !0}toArray(){const t=[];return this.forEach((e=>{t.push(e);})),t}toString(){const t=[];return this.forEach((e=>t.push(e))),"SortedSet("+t.toString()+")"}copy(t){const e=new $r(this.comparator);return e.data=t,e}}class Qr{constructor(t){this.iter=t;}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function zr(t){return t.hasNext()?t.getNext():void 0}class Hr{constructor(t){this.fields=t,t.sort(hr.comparator);}static empty(){return new Hr([])}unionWith(t){let e=new $r(hr.comparator);for(const t of this.fields)e=e.add(t);for(const n of t)e=e.add(n);return new Hr(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return !0;return !1}isEqual(t){return sr(this.fields,t.fields,((t,e)=>t.isEqual(e)))}}function Wr(){return "undefined"!=typeof atob}class Yr{constructor(t){this.binaryString=t;}static fromBase64String(t){const e=atob(t);return new Yr(e)}static fromUint8Array(t){const e=function(t){let e="";for(let n=0;n<t.length;++n)e+=String.fromCharCode(t[n]);return e}(t);return new Yr(e)}[Symbol.iterator](){let t=0;return {next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return t=this.binaryString,btoa(t);var t;}toUint8Array(){return function(t){const e=new Uint8Array(t.length);for(let n=0;n<t.length;n++)e[n]=t.charCodeAt(n);return e}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return nr(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}Yr.EMPTY_BYTE_STRING=new Yr("");const Xr=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Jr(t){if(Us(!!t),"string"==typeof t){let e=0;const n=Xr.exec(t);if(Us(!!n),n[1]){let t=n[1];t=(t+"000000000").substr(0,9),e=Number(t);}const s=new Date(t);return {seconds:Math.floor(s.getTime()/1e3),nanos:e}}return {seconds:Zr(t.seconds),nanos:Zr(t.nanos)}}function Zr(t){return "number"==typeof t?t:"string"==typeof t?Number(t):0}function ti(t){return "string"==typeof t?Yr.fromBase64String(t):Yr.fromUint8Array(t)}function ei(t){var e,n;return "server_timestamp"===(null===(n=((null===(e=null==t?void 0:t.mapValue)||void 0===e?void 0:e.fields)||{}).__type__)||void 0===n?void 0:n.stringValue)}function ni(t){const e=t.mapValue.fields.__previous_value__;return ei(e)?ni(e):e}function si(t){const e=Jr(t.mapValue.fields.__local_write_time__.timestampValue);return new ir(e.seconds,e.nanos)}class ri{constructor(t,e,n,s,r,i,o,a){this.databaseId=t,this.appId=e,this.persistenceKey=n,this.host=s,this.ssl=r,this.forceLongPolling=i,this.autoDetectLongPolling=o,this.useFetchStreams=a;}}class ii{constructor(t,e){this.projectId=t,this.database=e||"(default)";}static empty(){return new ii("","")}get isDefaultDatabase(){return "(default)"===this.database}isEqual(t){return t instanceof ii&&t.projectId===this.projectId&&t.database===this.database}}function oi(t){return null==t}function ai(t){return 0===t&&1/t==-1/0}function ui(t){return "number"==typeof t&&Number.isInteger(t)&&!ai(t)&&t<=Number.MAX_SAFE_INTEGER&&t>=Number.MIN_SAFE_INTEGER}const ci={mapValue:{fields:{__type__:{stringValue:"__max__"}}}},hi={nullValue:"NULL_VALUE"};function li(t){return "nullValue"in t?0:"booleanValue"in t?1:"integerValue"in t||"doubleValue"in t?2:"timestampValue"in t?3:"stringValue"in t?5:"bytesValue"in t?6:"referenceValue"in t?7:"geoPointValue"in t?8:"arrayValue"in t?9:"mapValue"in t?ei(t)?4:_i(t)?9007199254740991:10:Ps()}function di(t,e){if(t===e)return !0;const n=li(t);if(n!==li(e))return !1;switch(n){case 0:case 9007199254740991:return !0;case 1:return t.booleanValue===e.booleanValue;case 4:return si(t).isEqual(si(e));case 3:return function(t,e){if("string"==typeof t.timestampValue&&"string"==typeof e.timestampValue&&t.timestampValue.length===e.timestampValue.length)return t.timestampValue===e.timestampValue;const n=Jr(t.timestampValue),s=Jr(e.timestampValue);return n.seconds===s.seconds&&n.nanos===s.nanos}(t,e);case 5:return t.stringValue===e.stringValue;case 6:return function(t,e){return ti(t.bytesValue).isEqual(ti(e.bytesValue))}(t,e);case 7:return t.referenceValue===e.referenceValue;case 8:return function(t,e){return Zr(t.geoPointValue.latitude)===Zr(e.geoPointValue.latitude)&&Zr(t.geoPointValue.longitude)===Zr(e.geoPointValue.longitude)}(t,e);case 2:return function(t,e){if("integerValue"in t&&"integerValue"in e)return Zr(t.integerValue)===Zr(e.integerValue);if("doubleValue"in t&&"doubleValue"in e){const n=Zr(t.doubleValue),s=Zr(e.doubleValue);return n===s?ai(n)===ai(s):isNaN(n)&&isNaN(s)}return !1}(t,e);case 9:return sr(t.arrayValue.values||[],e.arrayValue.values||[],di);case 10:return function(t,e){const n=t.mapValue.fields||{},s=e.mapValue.fields||{};if(Ur(n)!==Ur(s))return !1;for(const t in n)if(n.hasOwnProperty(t)&&(void 0===s[t]||!di(n[t],s[t])))return !1;return !0}(t,e);default:return Ps()}}function fi(t,e){return void 0!==(t.values||[]).find((t=>di(t,e)))}function mi(t,e){if(t===e)return 0;const n=li(t),s=li(e);if(n!==s)return nr(n,s);switch(n){case 0:case 9007199254740991:return 0;case 1:return nr(t.booleanValue,e.booleanValue);case 2:return function(t,e){const n=Zr(t.integerValue||t.doubleValue),s=Zr(e.integerValue||e.doubleValue);return n<s?-1:n>s?1:n===s?0:isNaN(n)?isNaN(s)?0:-1:1}(t,e);case 3:return gi(t.timestampValue,e.timestampValue);case 4:return gi(si(t),si(e));case 5:return nr(t.stringValue,e.stringValue);case 6:return function(t,e){const n=ti(t),s=ti(e);return n.compareTo(s)}(t.bytesValue,e.bytesValue);case 7:return function(t,e){const n=t.split("/"),s=e.split("/");for(let t=0;t<n.length&&t<s.length;t++){const e=nr(n[t],s[t]);if(0!==e)return e}return nr(n.length,s.length)}(t.referenceValue,e.referenceValue);case 8:return function(t,e){const n=nr(Zr(t.latitude),Zr(e.latitude));return 0!==n?n:nr(Zr(t.longitude),Zr(e.longitude))}(t.geoPointValue,e.geoPointValue);case 9:return function(t,e){const n=t.values||[],s=e.values||[];for(let t=0;t<n.length&&t<s.length;++t){const e=mi(n[t],s[t]);if(e)return e}return nr(n.length,s.length)}(t.arrayValue,e.arrayValue);case 10:return function(t,e){if(t===ci.mapValue&&e===ci.mapValue)return 0;if(t===ci.mapValue)return 1;if(e===ci.mapValue)return -1;const n=t.fields||{},s=Object.keys(n),r=e.fields||{},i=Object.keys(r);s.sort(),i.sort();for(let t=0;t<s.length&&t<i.length;++t){const e=nr(s[t],i[t]);if(0!==e)return e;const o=mi(n[s[t]],r[i[t]]);if(0!==o)return o}return nr(s.length,i.length)}(t.mapValue,e.mapValue);default:throw Ps()}}function gi(t,e){if("string"==typeof t&&"string"==typeof e&&t.length===e.length)return nr(t,e);const n=Jr(t),s=Jr(e),r=nr(n.seconds,s.seconds);return 0!==r?r:nr(n.nanos,s.nanos)}function pi(t){return yi(t)}function yi(t){return "nullValue"in t?"null":"booleanValue"in t?""+t.booleanValue:"integerValue"in t?""+t.integerValue:"doubleValue"in t?""+t.doubleValue:"timestampValue"in t?function(t){const e=Jr(t);return `time(${e.seconds},${e.nanos})`}(t.timestampValue):"stringValue"in t?t.stringValue:"bytesValue"in t?ti(t.bytesValue).toBase64():"referenceValue"in t?(n=t.referenceValue,lr.fromName(n).toString()):"geoPointValue"in t?`geo(${(e=t.geoPointValue).latitude},${e.longitude})`:"arrayValue"in t?function(t){let e="[",n=!0;for(const s of t.values||[])n?n=!1:e+=",",e+=yi(s);return e+"]"}(t.arrayValue):"mapValue"in t?function(t){const e=Object.keys(t.fields||{}).sort();let n="{",s=!0;for(const r of e)s?s=!1:n+=",",n+=`${r}:${yi(t.fields[r])}`;return n+"}"}(t.mapValue):Ps();var e,n;}function wi(t,e){return {referenceValue:`projects/${t.projectId}/databases/${t.database}/documents/${e.path.canonicalString()}`}}function vi(t){return !!t&&"integerValue"in t}function Ii(t){return !!t&&"arrayValue"in t}function bi(t){return !!t&&"nullValue"in t}function Ei(t){return !!t&&"doubleValue"in t&&isNaN(Number(t.doubleValue))}function Ti(t){return !!t&&"mapValue"in t}function Si(t){if(t.geoPointValue)return {geoPointValue:Object.assign({},t.geoPointValue)};if(t.timestampValue&&"object"==typeof t.timestampValue)return {timestampValue:Object.assign({},t.timestampValue)};if(t.mapValue){const e={mapValue:{fields:{}}};return Br(t.mapValue.fields,((t,n)=>e.mapValue.fields[t]=Si(n))),e}if(t.arrayValue){const e={arrayValue:{values:[]}};for(let n=0;n<(t.arrayValue.values||[]).length;++n)e.arrayValue.values[n]=Si(t.arrayValue.values[n]);return e}return Object.assign({},t)}function _i(t){return "__max__"===(((t.mapValue||{}).fields||{}).__type__||{}).stringValue}function Ai(t){return "nullValue"in t?hi:"booleanValue"in t?{booleanValue:!1}:"integerValue"in t||"doubleValue"in t?{doubleValue:NaN}:"timestampValue"in t?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in t?{stringValue:""}:"bytesValue"in t?{bytesValue:""}:"referenceValue"in t?wi(ii.empty(),lr.empty()):"geoPointValue"in t?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in t?{arrayValue:{}}:"mapValue"in t?{mapValue:{}}:Ps()}function Di(t){return "nullValue"in t?{booleanValue:!1}:"booleanValue"in t?{doubleValue:NaN}:"integerValue"in t||"doubleValue"in t?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in t?{stringValue:""}:"stringValue"in t?{bytesValue:""}:"bytesValue"in t?wi(ii.empty(),lr.empty()):"referenceValue"in t?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in t?{arrayValue:{}}:"arrayValue"in t?{mapValue:{}}:"mapValue"in t?ci:Ps()}function xi(t,e){const n=mi(t.value,e.value);return 0!==n?n:t.inclusive&&!e.inclusive?-1:!t.inclusive&&e.inclusive?1:0}function Ci(t,e){const n=mi(t.value,e.value);return 0!==n?n:t.inclusive&&!e.inclusive?1:!t.inclusive&&e.inclusive?-1:0}class Ni{constructor(t){this.value=t;}static empty(){return new Ni({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let n=0;n<t.length-1;++n)if(e=(e.mapValue.fields||{})[t.get(n)],!Ti(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=Si(e);}setAll(t){let e=hr.emptyPath(),n={},s=[];t.forEach(((t,r)=>{if(!e.isImmediateParentOf(r)){const t=this.getFieldsMap(e);this.applyChanges(t,n,s),n={},s=[],e=r.popLast();}t?n[r.lastSegment()]=Si(t):s.push(r.lastSegment());}));const r=this.getFieldsMap(e);this.applyChanges(r,n,s);}delete(t){const e=this.field(t.popLast());Ti(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()];}isEqual(t){return di(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let n=0;n<t.length;++n){let s=e.mapValue.fields[t.get(n)];Ti(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(n)]=s),e=s;}return e.mapValue.fields}applyChanges(t,e,n){Br(e,((e,n)=>t[e]=n));for(const e of n)delete t[e];}clone(){return new Ni(Si(this.value))}}function ki(t){const e=[];return Br(t.fields,((t,n)=>{const s=new hr([t]);if(Ti(n)){const t=ki(n.mapValue).fields;if(0===t.length)e.push(s);else for(const n of t)e.push(s.child(n));}else e.push(s);})),new Hr(e)}class Ri{constructor(t,e,n,s,r,i){this.key=t,this.documentType=e,this.version=n,this.readTime=s,this.data=r,this.documentState=i;}static newInvalidDocument(t){return new Ri(t,0,or.min(),or.min(),Ni.empty(),0)}static newFoundDocument(t,e,n){return new Ri(t,1,e,or.min(),n,0)}static newNoDocument(t,e){return new Ri(t,2,e,or.min(),Ni.empty(),0)}static newUnknownDocument(t,e){return new Ri(t,3,e,or.min(),Ni.empty(),2)}convertToFoundDocument(t,e){return this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Ni.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Ni.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=or.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return 1===this.documentState}get hasCommittedMutations(){return 2===this.documentState}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return 0!==this.documentType}isFoundDocument(){return 1===this.documentType}isNoDocument(){return 2===this.documentType}isUnknownDocument(){return 3===this.documentType}isEqual(t){return t instanceof Ri&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new Ri(this.key,this.documentType,this.version,this.readTime,this.data.clone(),this.documentState)}toString(){return `Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}class Li{constructor(t,e=null,n=[],s=[],r=null,i=null,o=null){this.path=t,this.collectionGroup=e,this.orderBy=n,this.filters=s,this.limit=r,this.startAt=i,this.endAt=o,this.ht=null;}}function Mi(t,e=null,n=[],s=[],r=null,i=null,o=null){return new Li(t,e,n,s,r,i,o)}function Oi(t){const e=qs(t);if(null===e.ht){let t=e.path.canonicalString();null!==e.collectionGroup&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((t=>{return (e=t).field.canonicalString()+e.op.toString()+pi(e.value);var e;})).join(","),t+="|ob:",t+=e.orderBy.map((t=>function(t){return t.field.canonicalString()+t.dir}(t))).join(","),oi(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((t=>pi(t))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((t=>pi(t))).join(",")),e.ht=t;}return e.ht}function Vi(t,e){if(t.limit!==e.limit)return !1;if(t.orderBy.length!==e.orderBy.length)return !1;for(let n=0;n<t.orderBy.length;n++)if(!Ji(t.orderBy[n],e.orderBy[n]))return !1;if(t.filters.length!==e.filters.length)return !1;for(let r=0;r<t.filters.length;r++)if(n=t.filters[r],s=e.filters[r],n.op!==s.op||!n.field.isEqual(s.field)||!di(n.value,s.value))return !1;var n,s;return t.collectionGroup===e.collectionGroup&&!!t.path.isEqual(e.path)&&!!to(t.startAt,e.startAt)&&to(t.endAt,e.endAt)}function Fi(t){return lr.isDocumentKey(t.path)&&null===t.collectionGroup&&0===t.filters.length}function Pi(t,e){return t.filters.filter((t=>t instanceof qi&&t.field.isEqual(e)))}function Ui(t,e,n){let s=hi,r=!0;for(const n of Pi(t,e)){let t=hi,e=!0;switch(n.op){case"<":case"<=":t=Ai(n.value);break;case"==":case"in":case">=":t=n.value;break;case">":t=n.value,e=!1;break;case"!=":case"not-in":t=hi;}xi({value:s,inclusive:r},{value:t,inclusive:e})<0&&(s=t,r=e);}if(null!==n)for(let i=0;i<t.orderBy.length;++i)if(t.orderBy[i].field.isEqual(e)){const t=n.position[i];xi({value:s,inclusive:r},{value:t,inclusive:n.inclusive})<0&&(s=t,r=n.inclusive);break}return {value:s,inclusive:r}}function Bi(t,e,n){let s=ci,r=!0;for(const n of Pi(t,e)){let t=ci,e=!0;switch(n.op){case">=":case">":t=Di(n.value),e=!1;break;case"==":case"in":case"<=":t=n.value;break;case"<":t=n.value,e=!1;break;case"!=":case"not-in":t=ci;}Ci({value:s,inclusive:r},{value:t,inclusive:e})>0&&(s=t,r=e);}if(null!==n)for(let i=0;i<t.orderBy.length;++i)if(t.orderBy[i].field.isEqual(e)){const t=n.position[i];Ci({value:s,inclusive:r},{value:t,inclusive:n.inclusive})>0&&(s=t,r=n.inclusive);break}return {value:s,inclusive:r}}class qi extends class{}{constructor(t,e,n){super(),this.field=t,this.op=e,this.value=n;}static create(t,e,n){return t.isKeyField()?"in"===e||"not-in"===e?this.lt(t,e,n):new Gi(t,e,n):"array-contains"===e?new Qi(t,n):"in"===e?new zi(t,n):"not-in"===e?new Hi(t,n):"array-contains-any"===e?new Wi(t,n):new qi(t,e,n)}static lt(t,e,n){return "in"===e?new Ki(t,n):new ji(t,n)}matches(t){const e=t.data.field(this.field);return "!="===this.op?null!==e&&this.ft(mi(e,this.value)):null!==e&&li(this.value)===li(e)&&this.ft(mi(e,this.value))}ft(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return 0===t;case"!=":return 0!==t;case">":return t>0;case">=":return t>=0;default:return Ps()}}dt(){return ["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}}class Gi extends qi{constructor(t,e,n){super(t,e,n),this.key=lr.fromName(n.referenceValue);}matches(t){const e=lr.comparator(t.key,this.key);return this.ft(e)}}class Ki extends qi{constructor(t,e){super(t,"in",e),this.keys=$i("in",e);}matches(t){return this.keys.some((e=>e.isEqual(t.key)))}}class ji extends qi{constructor(t,e){super(t,"not-in",e),this.keys=$i("not-in",e);}matches(t){return !this.keys.some((e=>e.isEqual(t.key)))}}function $i(t,e){var n;return ((null===(n=e.arrayValue)||void 0===n?void 0:n.values)||[]).map((t=>lr.fromName(t.referenceValue)))}class Qi extends qi{constructor(t,e){super(t,"array-contains",e);}matches(t){const e=t.data.field(this.field);return Ii(e)&&fi(e.arrayValue,this.value)}}class zi extends qi{constructor(t,e){super(t,"in",e);}matches(t){const e=t.data.field(this.field);return null!==e&&fi(this.value.arrayValue,e)}}class Hi extends qi{constructor(t,e){super(t,"not-in",e);}matches(t){if(fi(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return !1;const e=t.data.field(this.field);return null!==e&&!fi(this.value.arrayValue,e)}}class Wi extends qi{constructor(t,e){super(t,"array-contains-any",e);}matches(t){const e=t.data.field(this.field);return !(!Ii(e)||!e.arrayValue.values)&&e.arrayValue.values.some((t=>fi(this.value.arrayValue,t)))}}class Yi{constructor(t,e){this.position=t,this.inclusive=e;}}class Xi{constructor(t,e="asc"){this.field=t,this.dir=e;}}function Ji(t,e){return t.dir===e.dir&&t.field.isEqual(e.field)}function Zi(t,e,n){let s=0;for(let r=0;r<t.position.length;r++){const i=e[r],o=t.position[r];if(s=i.field.isKeyField()?lr.comparator(lr.fromName(o.referenceValue),n.key):mi(o,n.data.field(i.field)),"desc"===i.dir&&(s*=-1),0!==s)break}return s}function to(t,e){if(null===t)return null===e;if(null===e)return !1;if(t.inclusive!==e.inclusive||t.position.length!==e.position.length)return !1;for(let n=0;n<t.position.length;n++)if(!di(t.position[n],e.position[n]))return !1;return !0}class eo{constructor(t,e=null,n=[],s=[],r=null,i="F",o=null,a=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=n,this.filters=s,this.limit=r,this.limitType=i,this.startAt=o,this.endAt=a,this._t=null,this.wt=null,this.startAt,this.endAt;}}function no(t,e,n,s,r,i,o,a){return new eo(t,e,n,s,r,i,o,a)}function so(t){return new eo(t)}function ro(t){return 0===t.filters.length&&null===t.limit&&null==t.startAt&&null==t.endAt&&(0===t.explicitOrderBy.length||1===t.explicitOrderBy.length&&t.explicitOrderBy[0].field.isKeyField())}function io(t){return t.explicitOrderBy.length>0?t.explicitOrderBy[0].field:null}function oo(t){for(const e of t.filters)if(e.dt())return e.field;return null}function ao(t){return null!==t.collectionGroup}function uo(t){const e=qs(t);if(null===e._t){e._t=[];const t=oo(e),n=io(e);if(null!==t&&null===n)t.isKeyField()||e._t.push(new Xi(t)),e._t.push(new Xi(hr.keyField(),"asc"));else {let t=!1;for(const n of e.explicitOrderBy)e._t.push(n),n.field.isKeyField()&&(t=!0);if(!t){const t=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";e._t.push(new Xi(hr.keyField(),t));}}}return e._t}function co(t){const e=qs(t);if(!e.wt)if("F"===e.limitType)e.wt=Mi(e.path,e.collectionGroup,uo(e),e.filters,e.limit,e.startAt,e.endAt);else {const t=[];for(const n of uo(e)){const e="desc"===n.dir?"asc":"desc";t.push(new Xi(n.field,e));}const n=e.endAt?new Yi(e.endAt.position,e.endAt.inclusive):null,s=e.startAt?new Yi(e.startAt.position,e.startAt.inclusive):null;e.wt=Mi(e.path,e.collectionGroup,t,e.filters,e.limit,n,s);}return e.wt}function ho(t,e,n){return new eo(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),e,n,t.startAt,t.endAt)}function lo(t,e){return Vi(co(t),co(e))&&t.limitType===e.limitType}function fo(t){return `${Oi(co(t))}|lt:${t.limitType}`}function mo(t){return `Query(target=${function(t){let e=t.path.canonicalString();return null!==t.collectionGroup&&(e+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(e+=`, filters: [${t.filters.map((t=>{return `${(e=t).field.canonicalString()} ${e.op} ${pi(e.value)}`;var e;})).join(", ")}]`),oi(t.limit)||(e+=", limit: "+t.limit),t.orderBy.length>0&&(e+=`, orderBy: [${t.orderBy.map((t=>function(t){return `${t.field.canonicalString()} (${t.dir})`}(t))).join(", ")}]`),t.startAt&&(e+=", startAt: ",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map((t=>pi(t))).join(",")),t.endAt&&(e+=", endAt: ",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map((t=>pi(t))).join(",")),`Target(${e})`}(co(t))}; limitType=${t.limitType})`}function go(t,e){return e.isFoundDocument()&&function(t,e){const n=e.key.path;return null!==t.collectionGroup?e.key.hasCollectionId(t.collectionGroup)&&t.path.isPrefixOf(n):lr.isDocumentKey(t.path)?t.path.isEqual(n):t.path.isImmediateParentOf(n)}(t,e)&&function(t,e){for(const n of t.explicitOrderBy)if(!n.field.isKeyField()&&null===e.data.field(n.field))return !1;return !0}(t,e)&&function(t,e){for(const n of t.filters)if(!n.matches(e))return !1;return !0}(t,e)&&function(t,e){return !(t.startAt&&!function(t,e,n){const s=Zi(t,e,n);return t.inclusive?s<=0:s<0}(t.startAt,uo(t),e))&&!(t.endAt&&!function(t,e,n){const s=Zi(t,e,n);return t.inclusive?s>=0:s>0}(t.endAt,uo(t),e))}(t,e)}function po(t){return t.collectionGroup||(t.path.length%2==1?t.path.lastSegment():t.path.get(t.path.length-2))}function yo(t){return (e,n)=>{let s=!1;for(const r of uo(t)){const t=wo(r,e,n);if(0!==t)return t;s=s||r.field.isKeyField();}return 0}}function wo(t,e,n){const s=t.field.isKeyField()?lr.comparator(e.key,n.key):function(t,e,n){const s=e.data.field(t),r=n.data.field(t);return null!==s&&null!==r?mi(s,r):Ps()}(t.field,e,n);switch(t.dir){case"asc":return s;case"desc":return -1*s;default:return Ps()}}function vo(t,e){if(t.gt){if(isNaN(e))return {doubleValue:"NaN"};if(e===1/0)return {doubleValue:"Infinity"};if(e===-1/0)return {doubleValue:"-Infinity"}}return {doubleValue:ai(e)?"-0":e}}function Io(t){return {integerValue:""+t}}function bo(t,e){return ui(e)?Io(e):vo(t,e)}class Eo{constructor(){this._=void 0;}}function To(t,e,n){return t instanceof Ao?function(t,e){const n={fields:{__type__:{stringValue:"server_timestamp"},__local_write_time__:{timestampValue:{seconds:t.seconds,nanos:t.nanoseconds}}}};return e&&(n.fields.__previous_value__=e),{mapValue:n}}(n,e):t instanceof Do?xo(t,e):t instanceof Co?No(t,e):function(t,e){const n=_o(t,e),s=Ro(n)+Ro(t.yt);return vi(n)&&vi(t.yt)?Io(s):vo(t.It,s)}(t,e)}function So(t,e,n){return t instanceof Do?xo(t,e):t instanceof Co?No(t,e):n}function _o(t,e){return t instanceof ko?vi(n=e)||function(t){return !!t&&"doubleValue"in t}(n)?e:{integerValue:0}:null;var n;}class Ao extends Eo{}class Do extends Eo{constructor(t){super(),this.elements=t;}}function xo(t,e){const n=Lo(e);for(const e of t.elements)n.some((t=>di(t,e)))||n.push(e);return {arrayValue:{values:n}}}class Co extends Eo{constructor(t){super(),this.elements=t;}}function No(t,e){let n=Lo(e);for(const e of t.elements)n=n.filter((t=>!di(t,e)));return {arrayValue:{values:n}}}class ko extends Eo{constructor(t,e){super(),this.It=t,this.yt=e;}}function Ro(t){return Zr(t.integerValue||t.doubleValue)}function Lo(t){return Ii(t)&&t.arrayValue.values?t.arrayValue.values.slice():[]}class Mo{constructor(t,e){this.field=t,this.transform=e;}}class Oo{constructor(t,e){this.version=t,this.transformResults=e;}}class Vo{constructor(t,e){this.updateTime=t,this.exists=e;}static none(){return new Vo}static exists(t){return new Vo(void 0,t)}static updateTime(t){return new Vo(t)}get isNone(){return void 0===this.updateTime&&void 0===this.exists}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Fo(t,e){return void 0!==t.updateTime?e.isFoundDocument()&&e.version.isEqual(t.updateTime):void 0===t.exists||t.exists===e.isFoundDocument()}class Po{}function Uo(t,e){if(!t.hasLocalMutations||e&&0===e.fields.length)return null;if(null===e)return t.isNoDocument()?new Wo(t.key,Vo.none()):new jo(t.key,t.data,Vo.none());{const n=t.data,s=Ni.empty();let r=new $r(hr.comparator);for(let t of e.fields)if(!r.has(t)){let e=n.field(t);null===e&&t.length>1&&(t=t.popLast(),e=n.field(t)),null===e?s.delete(t):s.set(t,e),r=r.add(t);}return new $o(t.key,s,new Hr(r.toArray()),Vo.none())}}function Bo(t,e,n){t instanceof jo?function(t,e,n){const s=t.value.clone(),r=zo(t.fieldTransforms,e,n.transformResults);s.setAll(r),e.convertToFoundDocument(n.version,s).setHasCommittedMutations();}(t,e,n):t instanceof $o?function(t,e,n){if(!Fo(t.precondition,e))return void e.convertToUnknownDocument(n.version);const s=zo(t.fieldTransforms,e,n.transformResults),r=e.data;r.setAll(Qo(t)),r.setAll(s),e.convertToFoundDocument(n.version,r).setHasCommittedMutations();}(t,e,n):function(t,e,n){e.convertToNoDocument(n.version).setHasCommittedMutations();}(0,e,n);}function qo(t,e,n,s){return t instanceof jo?function(t,e,n,s){if(!Fo(t.precondition,e))return n;const r=t.value.clone(),i=Ho(t.fieldTransforms,s,e);return r.setAll(i),e.convertToFoundDocument(e.version,r).setHasLocalMutations(),null}(t,e,n,s):t instanceof $o?function(t,e,n,s){if(!Fo(t.precondition,e))return n;const r=Ho(t.fieldTransforms,s,e),i=e.data;return i.setAll(Qo(t)),i.setAll(r),e.convertToFoundDocument(e.version,i).setHasLocalMutations(),null===n?null:n.unionWith(t.fieldMask.fields).unionWith(t.fieldTransforms.map((t=>t.field)))}(t,e,n,s):function(t,e,n){return Fo(t.precondition,e)?(e.convertToNoDocument(e.version).setHasLocalMutations(),null):n}(t,e,n)}function Go(t,e){let n=null;for(const s of t.fieldTransforms){const t=e.data.field(s.field),r=_o(s.transform,t||null);null!=r&&(null===n&&(n=Ni.empty()),n.set(s.field,r));}return n||null}function Ko(t,e){return t.type===e.type&&!!t.key.isEqual(e.key)&&!!t.precondition.isEqual(e.precondition)&&!!function(t,e){return void 0===t&&void 0===e||!(!t||!e)&&sr(t,e,((t,e)=>function(t,e){return t.field.isEqual(e.field)&&function(t,e){return t instanceof Do&&e instanceof Do||t instanceof Co&&e instanceof Co?sr(t.elements,e.elements,di):t instanceof ko&&e instanceof ko?di(t.yt,e.yt):t instanceof Ao&&e instanceof Ao}(t.transform,e.transform)}(t,e)))}(t.fieldTransforms,e.fieldTransforms)&&(0===t.type?t.value.isEqual(e.value):1!==t.type||t.data.isEqual(e.data)&&t.fieldMask.isEqual(e.fieldMask))}class jo extends Po{constructor(t,e,n,s=[]){super(),this.key=t,this.value=e,this.precondition=n,this.fieldTransforms=s,this.type=0;}getFieldMask(){return null}}class $o extends Po{constructor(t,e,n,s,r=[]){super(),this.key=t,this.data=e,this.fieldMask=n,this.precondition=s,this.fieldTransforms=r,this.type=1;}getFieldMask(){return this.fieldMask}}function Qo(t){const e=new Map;return t.fieldMask.fields.forEach((n=>{if(!n.isEmpty()){const s=t.data.field(n);e.set(n,s);}})),e}function zo(t,e,n){const s=new Map;Us(t.length===n.length);for(let r=0;r<n.length;r++){const i=t[r],o=i.transform,a=e.data.field(i.field);s.set(i.field,So(o,a,n[r]));}return s}function Ho(t,e,n){const s=new Map;for(const r of t){const t=r.transform,i=n.data.field(r.field);s.set(r.field,To(t,i,e));}return s}class Wo extends Po{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[];}getFieldMask(){return null}}class Yo extends Po{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[];}getFieldMask(){return null}}class Xo{constructor(t){this.count=t;}}var Jo,Zo;function ta(t){switch(t){default:return Ps();case Gs.CANCELLED:case Gs.UNKNOWN:case Gs.DEADLINE_EXCEEDED:case Gs.RESOURCE_EXHAUSTED:case Gs.INTERNAL:case Gs.UNAVAILABLE:case Gs.UNAUTHENTICATED:return !1;case Gs.INVALID_ARGUMENT:case Gs.NOT_FOUND:case Gs.ALREADY_EXISTS:case Gs.PERMISSION_DENIED:case Gs.FAILED_PRECONDITION:case Gs.ABORTED:case Gs.OUT_OF_RANGE:case Gs.UNIMPLEMENTED:case Gs.DATA_LOSS:return !0}}function ea(t){if(void 0===t)return Os("GRPC error has no .code"),Gs.UNKNOWN;switch(t){case Jo.OK:return Gs.OK;case Jo.CANCELLED:return Gs.CANCELLED;case Jo.UNKNOWN:return Gs.UNKNOWN;case Jo.DEADLINE_EXCEEDED:return Gs.DEADLINE_EXCEEDED;case Jo.RESOURCE_EXHAUSTED:return Gs.RESOURCE_EXHAUSTED;case Jo.INTERNAL:return Gs.INTERNAL;case Jo.UNAVAILABLE:return Gs.UNAVAILABLE;case Jo.UNAUTHENTICATED:return Gs.UNAUTHENTICATED;case Jo.INVALID_ARGUMENT:return Gs.INVALID_ARGUMENT;case Jo.NOT_FOUND:return Gs.NOT_FOUND;case Jo.ALREADY_EXISTS:return Gs.ALREADY_EXISTS;case Jo.PERMISSION_DENIED:return Gs.PERMISSION_DENIED;case Jo.FAILED_PRECONDITION:return Gs.FAILED_PRECONDITION;case Jo.ABORTED:return Gs.ABORTED;case Jo.OUT_OF_RANGE:return Gs.OUT_OF_RANGE;case Jo.UNIMPLEMENTED:return Gs.UNIMPLEMENTED;case Jo.DATA_LOSS:return Gs.DATA_LOSS;default:return Ps()}}(Zo=Jo||(Jo={}))[Zo.OK=0]="OK",Zo[Zo.CANCELLED=1]="CANCELLED",Zo[Zo.UNKNOWN=2]="UNKNOWN",Zo[Zo.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Zo[Zo.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Zo[Zo.NOT_FOUND=5]="NOT_FOUND",Zo[Zo.ALREADY_EXISTS=6]="ALREADY_EXISTS",Zo[Zo.PERMISSION_DENIED=7]="PERMISSION_DENIED",Zo[Zo.UNAUTHENTICATED=16]="UNAUTHENTICATED",Zo[Zo.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Zo[Zo.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Zo[Zo.ABORTED=10]="ABORTED",Zo[Zo.OUT_OF_RANGE=11]="OUT_OF_RANGE",Zo[Zo.UNIMPLEMENTED=12]="UNIMPLEMENTED",Zo[Zo.INTERNAL=13]="INTERNAL",Zo[Zo.UNAVAILABLE=14]="UNAVAILABLE",Zo[Zo.DATA_LOSS=15]="DATA_LOSS";class na{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0;}get(t){const e=this.mapKeyFn(t),n=this.inner[e];if(void 0!==n)for(const[e,s]of n)if(this.equalsFn(e,t))return s}has(t){return void 0!==this.get(t)}set(t,e){const n=this.mapKeyFn(t),s=this.inner[n];if(void 0===s)return this.inner[n]=[[t,e]],void this.innerSize++;for(let n=0;n<s.length;n++)if(this.equalsFn(s[n][0],t))return void(s[n]=[t,e]);s.push([t,e]),this.innerSize++;}delete(t){const e=this.mapKeyFn(t),n=this.inner[e];if(void 0===n)return !1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],t))return 1===n.length?delete this.inner[e]:n.splice(s,1),this.innerSize--,!0;return !1}forEach(t){Br(this.inner,((e,n)=>{for(const[e,s]of n)t(e,s);}));}isEmpty(){return qr(this.inner)}size(){return this.innerSize}}const sa=new Gr(lr.comparator);function ra(){return sa}const ia=new Gr(lr.comparator);function oa(...t){let e=ia;for(const n of t)e=e.insert(n.key,n);return e}function aa(t){let e=ia;return t.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function ua(){return ha()}function ca(){return ha()}function ha(){return new na((t=>t.toString()),((t,e)=>t.isEqual(e)))}const la=new Gr(lr.comparator),da=new $r(lr.comparator);function fa(...t){let e=da;for(const n of t)e=e.add(n);return e}const ma=new $r(nr);function ga(){return ma}class pa{constructor(t,e,n,s,r){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=n,this.documentUpdates=s,this.resolvedLimboDocuments=r;}static createSynthesizedRemoteEventForCurrentChange(t,e){const n=new Map;return n.set(t,ya.createSynthesizedTargetChangeForCurrentChange(t,e)),new pa(or.min(),n,ga(),ra(),fa())}}class ya{constructor(t,e,n,s,r){this.resumeToken=t,this.current=e,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=r;}static createSynthesizedTargetChangeForCurrentChange(t,e){return new ya(Yr.EMPTY_BYTE_STRING,e,fa(),fa(),fa())}}class wa{constructor(t,e,n,s){this.Tt=t,this.removedTargetIds=e,this.key=n,this.Et=s;}}class va{constructor(t,e){this.targetId=t,this.At=e;}}class Ia{constructor(t,e,n=Yr.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=n,this.cause=s;}}class ba{constructor(){this.Rt=0,this.bt=Sa(),this.Pt=Yr.EMPTY_BYTE_STRING,this.vt=!1,this.Vt=!0;}get current(){return this.vt}get resumeToken(){return this.Pt}get St(){return 0!==this.Rt}get Dt(){return this.Vt}Ct(t){t.approximateByteSize()>0&&(this.Vt=!0,this.Pt=t);}xt(){let t=fa(),e=fa(),n=fa();return this.bt.forEach(((s,r)=>{switch(r){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:n=n.add(s);break;default:Ps();}})),new ya(this.Pt,this.vt,t,e,n)}Nt(){this.Vt=!1,this.bt=Sa();}kt(t,e){this.Vt=!0,this.bt=this.bt.insert(t,e);}Ot(t){this.Vt=!0,this.bt=this.bt.remove(t);}Mt(){this.Rt+=1;}Ft(){this.Rt-=1;}$t(){this.Vt=!0,this.vt=!0;}}class Ea{constructor(t){this.Bt=t,this.Lt=new Map,this.Ut=ra(),this.qt=Ta(),this.Kt=new $r(nr);}Gt(t){for(const e of t.Tt)t.Et&&t.Et.isFoundDocument()?this.Qt(e,t.Et):this.jt(e,t.key,t.Et);for(const e of t.removedTargetIds)this.jt(e,t.key,t.Et);}Wt(t){this.forEachTarget(t,(e=>{const n=this.zt(e);switch(t.state){case 0:this.Ht(e)&&n.Ct(t.resumeToken);break;case 1:n.Ft(),n.St||n.Nt(),n.Ct(t.resumeToken);break;case 2:n.Ft(),n.St||this.removeTarget(e);break;case 3:this.Ht(e)&&(n.$t(),n.Ct(t.resumeToken));break;case 4:this.Ht(e)&&(this.Jt(e),n.Ct(t.resumeToken));break;default:Ps();}}));}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.Lt.forEach(((t,n)=>{this.Ht(n)&&e(n);}));}Yt(t){const e=t.targetId,n=t.At.count,s=this.Xt(e);if(s){const t=s.target;if(Fi(t))if(0===n){const n=new lr(t.path);this.jt(e,n,Ri.newNoDocument(n,or.min()));}else Us(1===n);else this.Zt(e)!==n&&(this.Jt(e),this.Kt=this.Kt.add(e));}}te(t){const e=new Map;this.Lt.forEach(((n,s)=>{const r=this.Xt(s);if(r){if(n.current&&Fi(r.target)){const e=new lr(r.target.path);null!==this.Ut.get(e)||this.ee(s,e)||this.jt(s,e,Ri.newNoDocument(e,t));}n.Dt&&(e.set(s,n.xt()),n.Nt());}}));let n=fa();this.qt.forEach(((t,e)=>{let s=!0;e.forEachWhile((t=>{const e=this.Xt(t);return !e||2===e.purpose||(s=!1,!1)})),s&&(n=n.add(t));})),this.Ut.forEach(((e,n)=>n.setReadTime(t)));const s=new pa(t,e,this.Kt,this.Ut,n);return this.Ut=ra(),this.qt=Ta(),this.Kt=new $r(nr),s}Qt(t,e){if(!this.Ht(t))return;const n=this.ee(t,e.key)?2:0;this.zt(t).kt(e.key,n),this.Ut=this.Ut.insert(e.key,e),this.qt=this.qt.insert(e.key,this.ne(e.key).add(t));}jt(t,e,n){if(!this.Ht(t))return;const s=this.zt(t);this.ee(t,e)?s.kt(e,1):s.Ot(e),this.qt=this.qt.insert(e,this.ne(e).delete(t)),n&&(this.Ut=this.Ut.insert(e,n));}removeTarget(t){this.Lt.delete(t);}Zt(t){const e=this.zt(t).xt();return this.Bt.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}Mt(t){this.zt(t).Mt();}zt(t){let e=this.Lt.get(t);return e||(e=new ba,this.Lt.set(t,e)),e}ne(t){let e=this.qt.get(t);return e||(e=new $r(nr),this.qt=this.qt.insert(t,e)),e}Ht(t){const e=null!==this.Xt(t);return e||Ms("WatchChangeAggregator","Detected inactive target",t),e}Xt(t){const e=this.Lt.get(t);return e&&e.St?null:this.Bt.se(t)}Jt(t){this.Lt.set(t,new ba),this.Bt.getRemoteKeysForTarget(t).forEach((e=>{this.jt(t,e,null);}));}ee(t,e){return this.Bt.getRemoteKeysForTarget(t).has(e)}}function Ta(){return new Gr(lr.comparator)}function Sa(){return new Gr(lr.comparator)}const _a={asc:"ASCENDING",desc:"DESCENDING"},Aa={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"};class Da{constructor(t,e){this.databaseId=t,this.gt=e;}}function xa(t,e){return t.gt?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Ca(t,e){return t.gt?e.toBase64():e.toUint8Array()}function Na(t,e){return xa(t,e.toTimestamp())}function ka(t){return Us(!!t),or.fromTimestamp(function(t){const e=Jr(t);return new ir(e.seconds,e.nanos)}(t))}function Ra(t,e){return function(t){return new ur(["projects",t.projectId,"databases",t.database])}(t).child("documents").child(e).canonicalString()}function La(t){const e=ur.fromString(t);return Us(eu(e)),e}function Ma(t,e){return Ra(t.databaseId,e.path)}function Oa(t,e){const n=La(e);if(n.get(1)!==t.databaseId.projectId)throw new Ks(Gs.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+t.databaseId.projectId);if(n.get(3)!==t.databaseId.database)throw new Ks(Gs.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+t.databaseId.database);return new lr(Ua(n))}function Va(t,e){return Ra(t.databaseId,e)}function Fa(t){const e=La(t);return 4===e.length?ur.emptyPath():Ua(e)}function Pa(t){return new ur(["projects",t.databaseId.projectId,"databases",t.databaseId.database]).canonicalString()}function Ua(t){return Us(t.length>4&&"documents"===t.get(4)),t.popFirst(5)}function Ba(t,e,n){return {name:Ma(t,e),fields:n.value.mapValue.fields}}function qa(t,e,n){const s=Oa(t,e.name),r=ka(e.updateTime),i=new Ni({mapValue:{fields:e.fields}}),o=Ri.newFoundDocument(s,r,i);return n&&o.setHasCommittedMutations(),n?o.setHasCommittedMutations():o}function Ga(t,e){let n;if(e instanceof jo)n={update:Ba(t,e.key,e.value)};else if(e instanceof Wo)n={delete:Ma(t,e.key)};else if(e instanceof $o)n={update:Ba(t,e.key,e.data),updateMask:tu(e.fieldMask)};else {if(!(e instanceof Yo))return Ps();n={verify:Ma(t,e.key)};}return e.fieldTransforms.length>0&&(n.updateTransforms=e.fieldTransforms.map((t=>function(t,e){const n=e.transform;if(n instanceof Ao)return {fieldPath:e.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(n instanceof Do)return {fieldPath:e.field.canonicalString(),appendMissingElements:{values:n.elements}};if(n instanceof Co)return {fieldPath:e.field.canonicalString(),removeAllFromArray:{values:n.elements}};if(n instanceof ko)return {fieldPath:e.field.canonicalString(),increment:n.yt};throw Ps()}(0,t)))),e.precondition.isNone||(n.currentDocument=function(t,e){return void 0!==e.updateTime?{updateTime:Na(t,e.updateTime)}:void 0!==e.exists?{exists:e.exists}:Ps()}(t,e.precondition)),n}function Ka(t,e){const n=e.currentDocument?function(t){return void 0!==t.updateTime?Vo.updateTime(ka(t.updateTime)):void 0!==t.exists?Vo.exists(t.exists):Vo.none()}(e.currentDocument):Vo.none(),s=e.updateTransforms?e.updateTransforms.map((e=>function(t,e){let n=null;if("setToServerValue"in e)Us("REQUEST_TIME"===e.setToServerValue),n=new Ao;else if("appendMissingElements"in e){const t=e.appendMissingElements.values||[];n=new Do(t);}else if("removeAllFromArray"in e){const t=e.removeAllFromArray.values||[];n=new Co(t);}else "increment"in e?n=new ko(t,e.increment):Ps();const s=hr.fromServerFormat(e.fieldPath);return new Mo(s,n)}(t,e))):[];if(e.update){e.update.name;const r=Oa(t,e.update.name),i=new Ni({mapValue:{fields:e.update.fields}});if(e.updateMask){const t=function(t){const e=t.fieldPaths||[];return new Hr(e.map((t=>hr.fromServerFormat(t))))}(e.updateMask);return new $o(r,i,t,n,s)}return new jo(r,i,n,s)}if(e.delete){const s=Oa(t,e.delete);return new Wo(s,n)}if(e.verify){const s=Oa(t,e.verify);return new Yo(s,n)}return Ps()}function ja(t,e){return {documents:[Va(t,e.path)]}}function $a(t,e){const n={structuredQuery:{}},s=e.path;null!==e.collectionGroup?(n.parent=Va(t,s),n.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(n.parent=Va(t,s.popLast()),n.structuredQuery.from=[{collectionId:s.lastSegment()}]);const r=function(t){if(0===t.length)return;const e=t.map((t=>function(t){if("=="===t.op){if(Ei(t.value))return {unaryFilter:{field:Ya(t.field),op:"IS_NAN"}};if(bi(t.value))return {unaryFilter:{field:Ya(t.field),op:"IS_NULL"}}}else if("!="===t.op){if(Ei(t.value))return {unaryFilter:{field:Ya(t.field),op:"IS_NOT_NAN"}};if(bi(t.value))return {unaryFilter:{field:Ya(t.field),op:"IS_NOT_NULL"}}}return {fieldFilter:{field:Ya(t.field),op:Wa(t.op),value:t.value}}}(t)));return 1===e.length?e[0]:{compositeFilter:{op:"AND",filters:e}}}(e.filters);r&&(n.structuredQuery.where=r);const i=function(t){if(0!==t.length)return t.map((t=>function(t){return {field:Ya(t.field),direction:Ha(t.dir)}}(t)))}(e.orderBy);i&&(n.structuredQuery.orderBy=i);const o=function(t,e){return t.gt||oi(e)?e:{value:e}}(t,e.limit);var a;return null!==o&&(n.structuredQuery.limit=o),e.startAt&&(n.structuredQuery.startAt={before:(a=e.startAt).inclusive,values:a.position}),e.endAt&&(n.structuredQuery.endAt=function(t){return {before:!t.inclusive,values:t.position}}(e.endAt)),n}function Qa(t){let e=Fa(t.parent);const n=t.structuredQuery,s=n.from?n.from.length:0;let r=null;if(s>0){Us(1===s);const t=n.from[0];t.allDescendants?r=t.collectionId:e=e.child(t.collectionId);}let i=[];n.where&&(i=za(n.where));let o=[];n.orderBy&&(o=n.orderBy.map((t=>function(t){return new Xi(Xa(t.field),function(t){switch(t){case"ASCENDING":return "asc";case"DESCENDING":return "desc";default:return}}(t.direction))}(t))));let a=null;n.limit&&(a=function(t){let e;return e="object"==typeof t?t.value:t,oi(e)?null:e}(n.limit));let u=null;n.startAt&&(u=function(t){const e=!!t.before,n=t.values||[];return new Yi(n,e)}(n.startAt));let c=null;return n.endAt&&(c=function(t){const e=!t.before,n=t.values||[];return new Yi(n,e)}(n.endAt)),no(e,r,o,i,a,"F",u,c)}function za(t){return t?void 0!==t.unaryFilter?[Za(t)]:void 0!==t.fieldFilter?[Ja(t)]:void 0!==t.compositeFilter?t.compositeFilter.filters.map((t=>za(t))).reduce(((t,e)=>t.concat(e))):Ps():[]}function Ha(t){return _a[t]}function Wa(t){return Aa[t]}function Ya(t){return {fieldPath:t.canonicalString()}}function Xa(t){return hr.fromServerFormat(t.fieldPath)}function Ja(t){return qi.create(Xa(t.fieldFilter.field),function(t){switch(t){case"EQUAL":return "==";case"NOT_EQUAL":return "!=";case"GREATER_THAN":return ">";case"GREATER_THAN_OR_EQUAL":return ">=";case"LESS_THAN":return "<";case"LESS_THAN_OR_EQUAL":return "<=";case"ARRAY_CONTAINS":return "array-contains";case"IN":return "in";case"NOT_IN":return "not-in";case"ARRAY_CONTAINS_ANY":return "array-contains-any";default:return Ps()}}(t.fieldFilter.op),t.fieldFilter.value)}function Za(t){switch(t.unaryFilter.op){case"IS_NAN":const e=Xa(t.unaryFilter.field);return qi.create(e,"==",{doubleValue:NaN});case"IS_NULL":const n=Xa(t.unaryFilter.field);return qi.create(n,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const s=Xa(t.unaryFilter.field);return qi.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const r=Xa(t.unaryFilter.field);return qi.create(r,"!=",{nullValue:"NULL_VALUE"});default:return Ps()}}function tu(t){const e=[];return t.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function eu(t){return t.length>=4&&"projects"===t.get(0)&&"databases"===t.get(2)}function nu(t){let e="";for(let n=0;n<t.length;n++)e.length>0&&(e=ru(e)),e=su(t.get(n),e);return ru(e)}function su(t,e){let n=e;const s=t.length;for(let e=0;e<s;e++){const s=t.charAt(e);switch(s){case"\0":n+="";break;case"":n+="";break;default:n+=s;}}return n}function ru(t){return t+""}function iu(t){const e=t.length;if(Us(e>=2),2===e)return Us(""===t.charAt(0)&&""===t.charAt(1)),ur.emptyPath();const s=[];let r="";for(let i=0;i<e;){const e=t.indexOf("",i);switch((e<0||e>n)&&Ps(),t.charAt(e+1)){case"":const n=t.substring(i,e);let o;0===r.length?o=n:(r+=n,o=r,r=""),s.push(o);break;case"":r+=t.substring(i,e),r+="\0";break;case"":r+=t.substring(i,e+1);break;default:Ps();}i=e+2;}return new ur(s)}const ou=["userId","batchId"];function au(t,e){return [t,nu(e)]}function uu(t,e,n){return [t,nu(e),n]}const cu={},hu=["prefixPath","collectionGroup","readTime","documentId"],lu=["prefixPath","collectionGroup","documentId"],du=["collectionGroup","readTime","prefixPath","documentId"],fu=["canonicalId","targetId"],mu=["targetId","path"],gu=["path","targetId"],pu=["collectionId","parent"],yu=["indexId","uid"],wu=["uid","sequenceNumber"],vu=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Iu=["indexId","uid","orderedDocumentKey"],bu=["userId","collectionPath","documentId"],Eu=["userId","collectionPath","largestBatchId"],Tu=["userId","collectionGroup","largestBatchId"],Su=["mutationQueues","mutations","documentMutations","remoteDocuments","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries"],_u=[...Su,"documentOverlays"],Au=["mutationQueues","mutations","documentMutations","remoteDocumentsV14","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries","documentOverlays"],Du=Au,xu=[...Du,"indexConfiguration","indexState","indexEntries"];class Cu extends Sr{constructor(t,e){super(),this.ie=t,this.currentSequenceNumber=e;}}function Nu(t,e){const n=qs(t);return xr.M(n.ie,e)}class ku{constructor(t,e,n,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=n,this.mutations=s;}applyToRemoteDocument(t,e){const n=e.mutationResults;for(let e=0;e<this.mutations.length;e++){const s=this.mutations[e];s.key.isEqual(t.key)&&Bo(s,t,n[e]);}}applyToLocalView(t,e){for(const n of this.baseMutations)n.key.isEqual(t.key)&&(e=qo(n,t,e,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(t.key)&&(e=qo(n,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const n=ca();return this.mutations.forEach((s=>{const r=t.get(s.key),i=r.overlayedDocument;let o=this.applyToLocalView(i,r.mutatedFields);o=e.has(s.key)?null:o;const a=Uo(i,o);null!==a&&n.set(s.key,a),i.isValidDocument()||i.convertToNoDocument(or.min());})),n}keys(){return this.mutations.reduce(((t,e)=>t.add(e.key)),fa())}isEqual(t){return this.batchId===t.batchId&&sr(this.mutations,t.mutations,((t,e)=>Ko(t,e)))&&sr(this.baseMutations,t.baseMutations,((t,e)=>Ko(t,e)))}}class Ru{constructor(t,e,n,s){this.batch=t,this.commitVersion=e,this.mutationResults=n,this.docVersions=s;}static from(t,e,n){Us(t.mutations.length===n.length);let s=la;const r=t.mutations;for(let t=0;t<r.length;t++)s=s.insert(r[t].key,n[t].version);return new Ru(t,e,n,s)}}class Lu{constructor(t,e){this.largestBatchId=t,this.mutation=e;}getKey(){return this.mutation.key}isEqual(t){return null!==t&&this.mutation===t.mutation}toString(){return `Overlay{\n      largestBatchId: ${this.largestBatchId},\n      mutation: ${this.mutation.toString()}\n    }`}}class Mu{constructor(t,e,n,s,r=or.min(),i=or.min(),o=Yr.EMPTY_BYTE_STRING){this.target=t,this.targetId=e,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=r,this.lastLimboFreeSnapshotVersion=i,this.resumeToken=o;}withSequenceNumber(t){return new Mu(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken)}withResumeToken(t,e){return new Mu(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t)}withLastLimboFreeSnapshotVersion(t){return new Mu(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken)}}class Ou{constructor(t){this.re=t;}}function Vu(t,e){const n=e.key,s={prefixPath:n.getCollectionPath().popLast().toArray(),collectionGroup:n.collectionGroup,documentId:n.path.lastSegment(),readTime:Fu(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())s.document=function(t,e){return {name:Ma(t,e.key),fields:e.data.value.mapValue.fields,updateTime:xa(t,e.version.toTimestamp())}}(t.re,e);else if(e.isNoDocument())s.noDocument={path:n.path.toArray(),readTime:Pu(e.version)};else {if(!e.isUnknownDocument())return Ps();s.unknownDocument={path:n.path.toArray(),version:Pu(e.version)};}return s}function Fu(t){const e=t.toTimestamp();return [e.seconds,e.nanoseconds]}function Pu(t){const e=t.toTimestamp();return {seconds:e.seconds,nanoseconds:e.nanoseconds}}function Uu(t){const e=new ir(t.seconds,t.nanoseconds);return or.fromTimestamp(e)}function Bu(t,e){const n=(e.baseMutations||[]).map((e=>Ka(t.re,e)));for(let t=0;t<e.mutations.length-1;++t){const n=e.mutations[t];if(t+1<e.mutations.length&&void 0!==e.mutations[t+1].transform){const s=e.mutations[t+1];n.updateTransforms=s.transform.fieldTransforms,e.mutations.splice(t+1,1),++t;}}const s=e.mutations.map((e=>Ka(t.re,e))),r=ir.fromMillis(e.localWriteTimeMs);return new ku(e.batchId,r,n,s)}function qu(t){const e=Uu(t.readTime),n=void 0!==t.lastLimboFreeSnapshotVersion?Uu(t.lastLimboFreeSnapshotVersion):or.min();let s;var r;return void 0!==t.query.documents?(Us(1===(r=t.query).documents.length),s=co(so(Fa(r.documents[0])))):s=function(t){return co(Qa(t))}(t.query),new Mu(s,t.targetId,0,t.lastListenSequenceNumber,e,n,Yr.fromBase64String(t.resumeToken))}function Gu(t,e){const n=Pu(e.snapshotVersion),s=Pu(e.lastLimboFreeSnapshotVersion);let r;r=Fi(e.target)?ja(t.re,e.target):$a(t.re,e.target);const i=e.resumeToken.toBase64();return {targetId:e.targetId,canonicalId:Oi(e.target),readTime:n,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:s,query:r}}function Ku(t){const e=Qa({parent:t.parent,structuredQuery:t.structuredQuery});return "LAST"===t.limitType?ho(e,e.limit,"L"):e}function ju(t,e){return new Lu(e.largestBatchId,Ka(t.re,e.overlayMutation))}function $u(t,e){const n=e.path.lastSegment();return [t,nu(e.path.popLast()),n]}function Qu(t,e,n,s){return {indexId:t,uid:e.uid||"",sequenceNumber:n,readTime:Pu(s.readTime),documentKey:nu(s.documentKey.path),largestBatchId:s.largestBatchId}}class zu{getBundleMetadata(t,e){return Hu(t).get(e).next((t=>{if(t)return {id:(e=t).bundleId,createTime:Uu(e.createTime),version:e.version};var e;}))}saveBundleMetadata(t,e){return Hu(t).put({bundleId:(n=e).id,createTime:Pu(ka(n.createTime)),version:n.version});var n;}getNamedQuery(t,e){return Wu(t).get(e).next((t=>{if(t)return {name:(e=t).name,query:Ku(e.bundledQuery),readTime:Uu(e.readTime)};var e;}))}saveNamedQuery(t,e){return Wu(t).put(function(t){return {name:t.name,readTime:Pu(ka(t.readTime)),bundledQuery:t.bundledQuery}}(e))}}function Hu(t){return Nu(t,"bundles")}function Wu(t){return Nu(t,"namedQueries")}class Yu{constructor(t,e){this.It=t,this.userId=e;}static oe(t,e){const n=e.uid||"";return new Yu(t,n)}getOverlay(t,e){return Xu(t).get($u(this.userId,e)).next((t=>t?ju(this.It,t):null))}getOverlays(t,e){const n=ua();return Ar.forEach(e,(e=>this.getOverlay(t,e).next((t=>{null!==t&&n.set(e,t);})))).next((()=>n))}saveOverlays(t,e,n){const s=[];return n.forEach(((n,r)=>{const i=new Lu(e,r);s.push(this.ue(t,i));})),Ar.waitFor(s)}removeOverlaysForBatchId(t,e,n){const s=new Set;e.forEach((t=>s.add(nu(t.getCollectionPath()))));const r=[];return s.forEach((e=>{const s=IDBKeyRange.bound([this.userId,e,n],[this.userId,e,n+1],!1,!0);r.push(Xu(t).Y("collectionPathOverlayIndex",s));})),Ar.waitFor(r)}getOverlaysForCollection(t,e,n){const s=ua(),r=nu(e),i=IDBKeyRange.bound([this.userId,r,n],[this.userId,r,Number.POSITIVE_INFINITY],!0);return Xu(t).W("collectionPathOverlayIndex",i).next((t=>{for(const e of t){const t=ju(this.It,e);s.set(t.getKey(),t);}return s}))}getOverlaysForCollectionGroup(t,e,n,s){const r=ua();let i;const o=IDBKeyRange.bound([this.userId,e,n],[this.userId,e,Number.POSITIVE_INFINITY],!0);return Xu(t).Z({index:"collectionGroupOverlayIndex",range:o},((t,e,n)=>{const o=ju(this.It,e);r.size()<s||o.largestBatchId===i?(r.set(o.getKey(),o),i=o.largestBatchId):n.done();})).next((()=>r))}ue(t,e){return Xu(t).put(function(t,e,n){const[s,r,i]=$u(e,n.mutation.key);return {userId:e,collectionPath:r,documentId:i,collectionGroup:n.mutation.key.getCollectionGroup(),largestBatchId:n.largestBatchId,overlayMutation:Ga(t.re,n.mutation)}}(this.It,this.userId,e))}}function Xu(t){return Nu(t,"documentOverlays")}class Ju{constructor(){}ce(t,e){this.ae(t,e),e.he();}ae(t,e){if("nullValue"in t)this.le(e,5);else if("booleanValue"in t)this.le(e,10),e.fe(t.booleanValue?1:0);else if("integerValue"in t)this.le(e,15),e.fe(Zr(t.integerValue));else if("doubleValue"in t){const n=Zr(t.doubleValue);isNaN(n)?this.le(e,13):(this.le(e,15),ai(n)?e.fe(0):e.fe(n));}else if("timestampValue"in t){const n=t.timestampValue;this.le(e,20),"string"==typeof n?e.de(n):(e.de(`${n.seconds||""}`),e.fe(n.nanos||0));}else if("stringValue"in t)this._e(t.stringValue,e),this.we(e);else if("bytesValue"in t)this.le(e,30),e.me(ti(t.bytesValue)),this.we(e);else if("referenceValue"in t)this.ge(t.referenceValue,e);else if("geoPointValue"in t){const n=t.geoPointValue;this.le(e,45),e.fe(n.latitude||0),e.fe(n.longitude||0);}else "mapValue"in t?_i(t)?this.le(e,Number.MAX_SAFE_INTEGER):(this.ye(t.mapValue,e),this.we(e)):"arrayValue"in t?(this.pe(t.arrayValue,e),this.we(e)):Ps();}_e(t,e){this.le(e,25),this.Ie(t,e);}Ie(t,e){e.de(t);}ye(t,e){const n=t.fields||{};this.le(e,55);for(const t of Object.keys(n))this._e(t,e),this.ae(n[t],e);}pe(t,e){const n=t.values||[];this.le(e,50);for(const t of n)this.ae(t,e);}ge(t,e){this.le(e,37),lr.fromName(t).path.forEach((t=>{this.le(e,60),this.Ie(t,e);}));}le(t,e){t.fe(e);}we(t){t.fe(2);}}function Zu(t){if(0===t)return 8;let e=0;return t>>4==0&&(e+=4,t<<=4),t>>6==0&&(e+=2,t<<=2),t>>7==0&&(e+=1),e}function tc(t){const e=64-function(t){let e=0;for(let n=0;n<8;++n){const s=Zu(255&t[n]);if(e+=s,8!==s)break}return e}(t);return Math.ceil(e/8)}Ju.Te=new Ju;class ec{constructor(){this.buffer=new Uint8Array(1024),this.position=0;}Ee(t){const e=t[Symbol.iterator]();let n=e.next();for(;!n.done;)this.Ae(n.value),n=e.next();this.Re();}be(t){const e=t[Symbol.iterator]();let n=e.next();for(;!n.done;)this.Pe(n.value),n=e.next();this.ve();}Ve(t){for(const e of t){const t=e.charCodeAt(0);if(t<128)this.Ae(t);else if(t<2048)this.Ae(960|t>>>6),this.Ae(128|63&t);else if(e<"\ud800"||"\udbff"<e)this.Ae(480|t>>>12),this.Ae(128|63&t>>>6),this.Ae(128|63&t);else {const t=e.codePointAt(0);this.Ae(240|t>>>18),this.Ae(128|63&t>>>12),this.Ae(128|63&t>>>6),this.Ae(128|63&t);}}this.Re();}Se(t){for(const e of t){const t=e.charCodeAt(0);if(t<128)this.Pe(t);else if(t<2048)this.Pe(960|t>>>6),this.Pe(128|63&t);else if(e<"\ud800"||"\udbff"<e)this.Pe(480|t>>>12),this.Pe(128|63&t>>>6),this.Pe(128|63&t);else {const t=e.codePointAt(0);this.Pe(240|t>>>18),this.Pe(128|63&t>>>12),this.Pe(128|63&t>>>6),this.Pe(128|63&t);}}this.ve();}De(t){const e=this.Ce(t),n=tc(e);this.xe(1+n),this.buffer[this.position++]=255&n;for(let t=e.length-n;t<e.length;++t)this.buffer[this.position++]=255&e[t];}Ne(t){const e=this.Ce(t),n=tc(e);this.xe(1+n),this.buffer[this.position++]=~(255&n);for(let t=e.length-n;t<e.length;++t)this.buffer[this.position++]=~(255&e[t]);}ke(){this.Oe(255),this.Oe(255);}Me(){this.Fe(255),this.Fe(255);}reset(){this.position=0;}seed(t){this.xe(t.length),this.buffer.set(t,this.position),this.position+=t.length;}$e(){return this.buffer.slice(0,this.position)}Ce(t){const e=function(t){const e=new DataView(new ArrayBuffer(8));return e.setFloat64(0,t,!1),new Uint8Array(e.buffer)}(t),n=0!=(128&e[0]);e[0]^=n?255:128;for(let t=1;t<e.length;++t)e[t]^=n?255:0;return e}Ae(t){const e=255&t;0===e?(this.Oe(0),this.Oe(255)):255===e?(this.Oe(255),this.Oe(0)):this.Oe(e);}Pe(t){const e=255&t;0===e?(this.Fe(0),this.Fe(255)):255===e?(this.Fe(255),this.Fe(0)):this.Fe(t);}Re(){this.Oe(0),this.Oe(1);}ve(){this.Fe(0),this.Fe(1);}Oe(t){this.xe(1),this.buffer[this.position++]=t;}Fe(t){this.xe(1),this.buffer[this.position++]=~t;}xe(t){const e=t+this.position;if(e<=this.buffer.length)return;let n=2*this.buffer.length;n<e&&(n=e);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s;}}class nc{constructor(t){this.Be=t;}me(t){this.Be.Ee(t);}de(t){this.Be.Ve(t);}fe(t){this.Be.De(t);}he(){this.Be.ke();}}class sc{constructor(t){this.Be=t;}me(t){this.Be.be(t);}de(t){this.Be.Se(t);}fe(t){this.Be.Ne(t);}he(){this.Be.Me();}}class rc{constructor(){this.Be=new ec,this.Le=new nc(this.Be),this.Ue=new sc(this.Be);}seed(t){this.Be.seed(t);}qe(t){return 0===t?this.Le:this.Ue}$e(){return this.Be.$e()}reset(){this.Be.reset();}}class ic{constructor(t,e,n,s){this.indexId=t,this.documentKey=e,this.arrayValue=n,this.directionalValue=s;}Ke(){const t=this.directionalValue.length,e=0===t||255===this.directionalValue[t-1]?t+1:t,n=new Uint8Array(e);return n.set(this.directionalValue,0),e!==t?n.set([0],this.directionalValue.length):++n[n.length-1],new ic(this.indexId,this.documentKey,this.arrayValue,n)}}function oc(t,e){let n=t.indexId-e.indexId;return 0!==n?n:(n=ac(t.arrayValue,e.arrayValue),0!==n?n:(n=ac(t.directionalValue,e.directionalValue),0!==n?n:lr.comparator(t.documentKey,e.documentKey)))}function ac(t,e){for(let n=0;n<t.length&&n<e.length;++n){const s=t[n]-e[n];if(0!==s)return s}return t.length-e.length}class uc{constructor(t){this.collectionId=null!=t.collectionGroup?t.collectionGroup:t.path.lastSegment(),this.Ge=t.orderBy,this.Qe=[];for(const e of t.filters){const t=e;t.dt()?this.je=t:this.Qe.push(t);}}We(t){const e=fr(t);if(void 0!==e&&!this.ze(e))return !1;const n=mr(t);let s=0,r=0;for(;s<n.length&&this.ze(n[s]);++s);if(s===n.length)return !0;if(void 0!==this.je){const t=n[s];if(!this.He(this.je,t)||!this.Je(this.Ge[r++],t))return !1;++s;}for(;s<n.length;++s){const t=n[s];if(r>=this.Ge.length||!this.Je(this.Ge[r++],t))return !1}return !0}ze(t){for(const e of this.Qe)if(this.He(e,t))return !0;return !1}He(t,e){if(void 0===t||!t.field.isEqual(e.fieldPath))return !1;const n="array-contains"===t.op||"array-contains-any"===t.op;return 2===e.kind===n}Je(t,e){return !!t.field.isEqual(e.fieldPath)&&(0===e.kind&&"asc"===t.dir||1===e.kind&&"desc"===t.dir)}}class cc{constructor(){this.Ye=new hc;}addToCollectionParentIndex(t,e){return this.Ye.add(e),Ar.resolve()}getCollectionParents(t,e){return Ar.resolve(this.Ye.getEntries(e))}addFieldIndex(t,e){return Ar.resolve()}deleteFieldIndex(t,e){return Ar.resolve()}getDocumentsMatchingTarget(t,e){return Ar.resolve(null)}getIndexType(t,e){return Ar.resolve(0)}getFieldIndexes(t,e){return Ar.resolve([])}getNextCollectionGroupToUpdate(t){return Ar.resolve(null)}getMinOffset(t,e){return Ar.resolve(br.min())}getMinOffsetFromCollectionGroup(t,e){return Ar.resolve(br.min())}updateCollectionGroup(t,e,n){return Ar.resolve()}updateIndexEntries(t,e){return Ar.resolve()}}class hc{constructor(){this.index={};}add(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e]||new $r(ur.comparator),r=!s.has(n);return this.index[e]=s.add(n),r}has(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e];return s&&s.has(n)}getEntries(t){return (this.index[t]||new $r(ur.comparator)).toArray()}}const lc=new Uint8Array(0);class dc{constructor(t,e){this.user=t,this.databaseId=e,this.Xe=new hc,this.Ze=new na((t=>Oi(t)),((t,e)=>Vi(t,e))),this.uid=t.uid||"";}addToCollectionParentIndex(t,e){if(!this.Xe.has(e)){const n=e.lastSegment(),s=e.popLast();t.addOnCommittedListener((()=>{this.Xe.add(e);}));const r={collectionId:n,parent:nu(s)};return fc(t).put(r)}return Ar.resolve()}getCollectionParents(t,e){const n=[],s=IDBKeyRange.bound([e,""],[rr(e),""],!1,!0);return fc(t).W(s).next((t=>{for(const s of t){if(s.collectionId!==e)break;n.push(iu(s.parent));}return n}))}addFieldIndex(t,e){const n=gc(t),s=function(t){return {indexId:t.indexId,collectionGroup:t.collectionGroup,fields:t.fields.map((t=>[t.fieldPath.canonicalString(),t.kind]))}}(e);delete s.indexId;const r=n.add(s);if(e.indexState){const n=pc(t);return r.next((t=>{n.put(Qu(t,this.user,e.indexState.sequenceNumber,e.indexState.offset));}))}return r.next()}deleteFieldIndex(t,e){const n=gc(t),s=pc(t),r=mc(t);return n.delete(e.indexId).next((()=>s.delete(IDBKeyRange.bound([e.indexId],[e.indexId+1],!1,!0)))).next((()=>r.delete(IDBKeyRange.bound([e.indexId],[e.indexId+1],!1,!0))))}getDocumentsMatchingTarget(t,e){const n=mc(t);let s=!0;const r=new Map;return Ar.forEach(this.tn(e),(e=>this.en(t,e).next((t=>{s&&(s=!!t),r.set(e,t);})))).next((()=>{if(s){let t=fa();const s=[];return Ar.forEach(r,((r,i)=>{var o;Ms("IndexedDbIndexManager",`Using index ${o=r,`id=${o.indexId}|cg=${o.collectionGroup}|f=${o.fields.map((t=>`${t.fieldPath}:${t.kind}`)).join(",")}`} to execute ${Oi(e)}`);const a=function(t,e){const n=fr(e);if(void 0===n)return null;for(const e of Pi(t,n.fieldPath))switch(e.op){case"array-contains-any":return e.value.arrayValue.values||[];case"array-contains":return [e.value]}return null}(i,r),u=function(t,e){const n=new Map;for(const s of mr(e))for(const e of Pi(t,s.fieldPath))switch(e.op){case"==":case"in":n.set(s.fieldPath.canonicalString(),e.value);break;case"not-in":case"!=":return n.set(s.fieldPath.canonicalString(),e.value),Array.from(n.values())}return null}(i,r),c=function(t,e){const n=[];let s=!0;for(const r of mr(e)){const e=0===r.kind?Ui(t,r.fieldPath,t.startAt):Bi(t,r.fieldPath,t.startAt);n.push(e.value),s&&(s=e.inclusive);}return new Yi(n,s)}(i,r),h=function(t,e){const n=[];let s=!0;for(const r of mr(e)){const e=0===r.kind?Bi(t,r.fieldPath,t.endAt):Ui(t,r.fieldPath,t.endAt);n.push(e.value),s&&(s=e.inclusive);}return new Yi(n,s)}(i,r),l=this.nn(r,i,c),d=this.nn(r,i,h),f=this.sn(r,i,u),m=this.rn(r.indexId,a,l,c.inclusive,d,h.inclusive,f);return Ar.forEach(m,(r=>n.J(r,e.limit).next((e=>{e.forEach((e=>{const n=lr.fromSegments(e.documentKey);t.has(n)||(t=t.add(n),s.push(n));}));}))))})).next((()=>s))}return Ar.resolve(null)}))}tn(t){let e=this.Ze.get(t);return e||(e=[t],this.Ze.set(t,e),e)}rn(t,e,n,s,r,i,o){const a=(null!=e?e.length:1)*Math.max(n.length,r.length),u=a/(null!=e?e.length:1),c=[];for(let h=0;h<a;++h){const a=e?this.on(e[h/u]):lc,l=this.un(t,a,n[h%u],s),d=this.cn(t,a,r[h%u],i),f=o.map((e=>this.un(t,a,e,!0)));c.push(...this.createRange(l,d,f));}return c}un(t,e,n,s){const r=new ic(t,lr.empty(),e,n);return s?r:r.Ke()}cn(t,e,n,s){const r=new ic(t,lr.empty(),e,n);return s?r.Ke():r}en(t,e){const n=new uc(e),s=null!=e.collectionGroup?e.collectionGroup:e.path.lastSegment();return this.getFieldIndexes(t,s).next((t=>{let e=null;for(const s of t)n.We(s)&&(!e||s.fields.length>e.fields.length)&&(e=s);return e}))}getIndexType(t,e){let n=2;return Ar.forEach(this.tn(e),(e=>this.en(t,e).next((t=>{t?0!==n&&t.fields.length<function(t){let e=new $r(hr.comparator),n=!1;for(const s of t.filters){const t=s;t.field.isKeyField()||("array-contains"===t.op||"array-contains-any"===t.op?n=!0:e=e.add(t.field));}for(const n of t.orderBy)n.field.isKeyField()||(e=e.add(n.field));return e.size+(n?1:0)}(e)&&(n=1):n=0;})))).next((()=>n))}an(t,e){const n=new rc;for(const s of mr(t)){const t=e.data.field(s.fieldPath);if(null==t)return null;const r=n.qe(s.kind);Ju.Te.ce(t,r);}return n.$e()}on(t){const e=new rc;return Ju.Te.ce(t,e.qe(0)),e.$e()}hn(t,e){const n=new rc;return Ju.Te.ce(wi(this.databaseId,e),n.qe(function(t){const e=mr(t);return 0===e.length?0:e[e.length-1].kind}(t))),n.$e()}sn(t,e,n){if(null===n)return [];let s=[];s.push(new rc);let r=0;for(const i of mr(t)){const t=n[r++];for(const n of s)if(this.ln(e,i.fieldPath)&&Ii(t))s=this.fn(s,i,t);else {const e=n.qe(i.kind);Ju.Te.ce(t,e);}}return this.dn(s)}nn(t,e,n){return this.sn(t,e,n.position)}dn(t){const e=[];for(let n=0;n<t.length;++n)e[n]=t[n].$e();return e}fn(t,e,n){const s=[...t],r=[];for(const t of n.arrayValue.values||[])for(const n of s){const s=new rc;s.seed(n.$e()),Ju.Te.ce(t,s.qe(e.kind)),r.push(s);}return r}ln(t,e){return !!t.filters.find((t=>t instanceof qi&&t.field.isEqual(e)&&("in"===t.op||"not-in"===t.op)))}getFieldIndexes(t,e){const n=gc(t),s=pc(t);return (e?n.W("collectionGroupIndex",IDBKeyRange.bound(e,e)):n.W()).next((t=>{const e=[];return Ar.forEach(t,(t=>s.get([t.indexId,this.uid]).next((n=>{e.push(function(t,e){const n=e?new wr(e.sequenceNumber,new br(Uu(e.readTime),new lr(iu(e.documentKey)),e.largestBatchId)):wr.empty(),s=t.fields.map((([t,e])=>new pr(hr.fromServerFormat(t),e)));return new dr(t.indexId,t.collectionGroup,s,n)}(t,n));})))).next((()=>e))}))}getNextCollectionGroupToUpdate(t){return this.getFieldIndexes(t).next((t=>0===t.length?null:(t.sort(((t,e)=>{const n=t.indexState.sequenceNumber-e.indexState.sequenceNumber;return 0!==n?n:nr(t.collectionGroup,e.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(t,e,n){const s=gc(t),r=pc(t);return this._n(t).next((t=>s.W("collectionGroupIndex",IDBKeyRange.bound(e,e)).next((e=>Ar.forEach(e,(e=>r.put(Qu(e.indexId,this.user,t,n))))))))}updateIndexEntries(t,e){const n=new Map;return Ar.forEach(e,((e,s)=>{const r=n.get(e.collectionGroup);return (r?Ar.resolve(r):this.getFieldIndexes(t,e.collectionGroup)).next((r=>(n.set(e.collectionGroup,r),Ar.forEach(r,(n=>this.wn(t,e,n).next((e=>{const r=this.mn(s,n);return e.isEqual(r)?Ar.resolve():this.gn(t,s,n,e,r)})))))))}))}yn(t,e,n,s){return mc(t).put({indexId:s.indexId,uid:this.uid,arrayValue:s.arrayValue,directionalValue:s.directionalValue,orderedDocumentKey:this.hn(n,e.key),documentKey:e.key.path.toArray()})}pn(t,e,n,s){return mc(t).delete([s.indexId,this.uid,s.arrayValue,s.directionalValue,this.hn(n,e.key),e.key.path.toArray()])}wn(t,e,n){const s=mc(t);let r=new $r(oc);return s.Z({index:"documentKeyIndex",range:IDBKeyRange.only([n.indexId,this.uid,this.hn(n,e)])},((t,s)=>{r=r.add(new ic(n.indexId,e,s.arrayValue,s.directionalValue));})).next((()=>r))}mn(t,e){let n=new $r(oc);const s=this.an(e,t);if(null==s)return n;const r=fr(e);if(null!=r){const i=t.data.field(r.fieldPath);if(Ii(i))for(const r of i.arrayValue.values||[])n=n.add(new ic(e.indexId,t.key,this.on(r),s));}else n=n.add(new ic(e.indexId,t.key,lc,s));return n}gn(t,e,n,s,r){Ms("IndexedDbIndexManager","Updating index entries for document '%s'",e.key);const i=[];return function(t,e,n,s,r){const i=t.getIterator(),o=e.getIterator();let a=zr(i),u=zr(o);for(;a||u;){let t=!1,e=!1;if(a&&u){const s=n(a,u);s<0?e=!0:s>0&&(t=!0);}else null!=a?e=!0:t=!0;t?(s(u),u=zr(o)):e?(r(a),a=zr(i)):(a=zr(i),u=zr(o));}}(s,r,oc,(s=>{i.push(this.yn(t,e,n,s));}),(s=>{i.push(this.pn(t,e,n,s));})),Ar.waitFor(i)}_n(t){let e=1;return pc(t).Z({index:"sequenceNumberIndex",reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((t,n,s)=>{s.done(),e=n.sequenceNumber+1;})).next((()=>e))}createRange(t,e,n){n=n.sort(((t,e)=>oc(t,e))).filter(((t,e,n)=>!e||0!==oc(t,n[e-1])));const s=[];s.push(t);for(const r of n){const n=oc(r,t),i=oc(r,e);if(0===n)s[0]=t.Ke();else if(n>0&&i<0)s.push(r),s.push(r.Ke());else if(i>0)break}s.push(e);const r=[];for(let t=0;t<s.length;t+=2)r.push(IDBKeyRange.bound([s[t].indexId,this.uid,s[t].arrayValue,s[t].directionalValue,lc,[]],[s[t+1].indexId,this.uid,s[t+1].arrayValue,s[t+1].directionalValue,lc,[]]));return r}getMinOffsetFromCollectionGroup(t,e){return this.getFieldIndexes(t,e).next(yc)}getMinOffset(t,e){return Ar.mapArray(this.tn(e),(e=>this.en(t,e).next((t=>t||Ps())))).next(yc)}}function fc(t){return Nu(t,"collectionParents")}function mc(t){return Nu(t,"indexEntries")}function gc(t){return Nu(t,"indexConfiguration")}function pc(t){return Nu(t,"indexState")}function yc(t){Us(0!==t.length);let e=t[0].indexState.offset,n=e.largestBatchId;for(let s=1;s<t.length;s++){const r=t[s].indexState.offset;Er(r,e)<0&&(e=r),n<r.largestBatchId&&(n=r.largestBatchId);}return new br(e.readTime,e.documentKey,n)}const wc={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0};class vc{constructor(t,e,n){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=n;}static withCacheSize(t){return new vc(t,vc.DEFAULT_COLLECTION_PERCENTILE,vc.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}}function Ic(t,e,n){const s=t.store("mutations"),r=t.store("documentMutations"),i=[],o=IDBKeyRange.only(n.batchId);let a=0;const u=s.Z({range:o},((t,e,n)=>(a++,n.delete())));i.push(u.next((()=>{Us(1===a);})));const c=[];for(const t of n.mutations){const s=uu(e,t.key.path,n.batchId);i.push(r.delete(s)),c.push(t.key);}return Ar.waitFor(i).next((()=>c))}function bc(t){if(!t)return 0;let e;if(t.document)e=t.document;else if(t.unknownDocument)e=t.unknownDocument;else {if(!t.noDocument)throw Ps();e=t.noDocument;}return JSON.stringify(e).length}vc.DEFAULT_COLLECTION_PERCENTILE=10,vc.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,vc.DEFAULT=new vc(41943040,vc.DEFAULT_COLLECTION_PERCENTILE,vc.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),vc.DISABLED=new vc(-1,0,0);class Ec{constructor(t,e,n,s){this.userId=t,this.It=e,this.indexManager=n,this.referenceDelegate=s,this.In={};}static oe(t,e,n,s){Us(""!==t.uid);const r=t.isAuthenticated()?t.uid:"";return new Ec(r,e,n,s)}checkEmpty(t){let e=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Sc(t).Z({index:"userMutationsIndex",range:n},((t,n,s)=>{e=!1,s.done();})).next((()=>e))}addMutationBatch(t,e,n,s){const r=_c(t),i=Sc(t);return i.add({}).next((o=>{Us("number"==typeof o);const a=new ku(o,e,n,s),u=function(t,e,n){const s=n.baseMutations.map((e=>Ga(t.re,e))),r=n.mutations.map((e=>Ga(t.re,e)));return {userId:e,batchId:n.batchId,localWriteTimeMs:n.localWriteTime.toMillis(),baseMutations:s,mutations:r}}(this.It,this.userId,a),c=[];let h=new $r(((t,e)=>nr(t.canonicalString(),e.canonicalString())));for(const t of s){const e=uu(this.userId,t.key.path,o);h=h.add(t.key.path.popLast()),c.push(i.put(u)),c.push(r.put(e,cu));}return h.forEach((e=>{c.push(this.indexManager.addToCollectionParentIndex(t,e));})),t.addOnCommittedListener((()=>{this.In[o]=a.keys();})),Ar.waitFor(c).next((()=>a))}))}lookupMutationBatch(t,e){return Sc(t).get(e).next((t=>t?(Us(t.userId===this.userId),Bu(this.It,t)):null))}Tn(t,e){return this.In[e]?Ar.resolve(this.In[e]):this.lookupMutationBatch(t,e).next((t=>{if(t){const n=t.keys();return this.In[e]=n,n}return null}))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,s=IDBKeyRange.lowerBound([this.userId,n]);let r=null;return Sc(t).Z({index:"userMutationsIndex",range:s},((t,e,s)=>{e.userId===this.userId&&(Us(e.batchId>=n),r=Bu(this.It,e)),s.done();})).next((()=>r))}getHighestUnacknowledgedBatchId(t){const e=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=-1;return Sc(t).Z({index:"userMutationsIndex",range:e,reverse:!0},((t,e,s)=>{n=e.batchId,s.done();})).next((()=>n))}getAllMutationBatches(t){const e=IDBKeyRange.bound([this.userId,-1],[this.userId,Number.POSITIVE_INFINITY]);return Sc(t).W("userMutationsIndex",e).next((t=>t.map((t=>Bu(this.It,t)))))}getAllMutationBatchesAffectingDocumentKey(t,e){const n=au(this.userId,e.path),s=IDBKeyRange.lowerBound(n),r=[];return _c(t).Z({range:s},((n,s,i)=>{const[o,a,u]=n,c=iu(a);if(o===this.userId&&e.path.isEqual(c))return Sc(t).get(u).next((t=>{if(!t)throw Ps();Us(t.userId===this.userId),r.push(Bu(this.It,t));}));i.done();})).next((()=>r))}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new $r(nr);const s=[];return e.forEach((e=>{const r=au(this.userId,e.path),i=IDBKeyRange.lowerBound(r),o=_c(t).Z({range:i},((t,s,r)=>{const[i,o,a]=t,u=iu(o);i===this.userId&&e.path.isEqual(u)?n=n.add(a):r.done();}));s.push(o);})),Ar.waitFor(s).next((()=>this.En(t,n)))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,s=n.length+1,r=au(this.userId,n),i=IDBKeyRange.lowerBound(r);let o=new $r(nr);return _c(t).Z({range:i},((t,e,r)=>{const[i,a,u]=t,c=iu(a);i===this.userId&&n.isPrefixOf(c)?c.length===s&&(o=o.add(u)):r.done();})).next((()=>this.En(t,o)))}En(t,e){const n=[],s=[];return e.forEach((e=>{s.push(Sc(t).get(e).next((t=>{if(null===t)throw Ps();Us(t.userId===this.userId),n.push(Bu(this.It,t));})));})),Ar.waitFor(s).next((()=>n))}removeMutationBatch(t,e){return Ic(t.ie,this.userId,e).next((n=>(t.addOnCommittedListener((()=>{this.An(e.batchId);})),Ar.forEach(n,(e=>this.referenceDelegate.markPotentiallyOrphaned(t,e))))))}An(t){delete this.In[t];}performConsistencyCheck(t){return this.checkEmpty(t).next((e=>{if(!e)return Ar.resolve();const n=IDBKeyRange.lowerBound([this.userId]),s=[];return _c(t).Z({range:n},((t,e,n)=>{if(t[0]===this.userId){const e=iu(t[1]);s.push(e);}else n.done();})).next((()=>{Us(0===s.length);}))}))}containsKey(t,e){return Tc(t,this.userId,e)}Rn(t){return Ac(t).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:-1,lastStreamToken:""}))}}function Tc(t,e,n){const s=au(e,n.path),r=s[1],i=IDBKeyRange.lowerBound(s);let o=!1;return _c(t).Z({range:i,X:!0},((t,n,s)=>{const[i,a,u]=t;i===e&&a===r&&(o=!0),s.done();})).next((()=>o))}function Sc(t){return Nu(t,"mutations")}function _c(t){return Nu(t,"documentMutations")}function Ac(t){return Nu(t,"mutationQueues")}class Dc{constructor(t){this.bn=t;}next(){return this.bn+=2,this.bn}static Pn(){return new Dc(0)}static vn(){return new Dc(-1)}}class xc{constructor(t,e){this.referenceDelegate=t,this.It=e;}allocateTargetId(t){return this.Vn(t).next((e=>{const n=new Dc(e.highestTargetId);return e.highestTargetId=n.next(),this.Sn(t,e).next((()=>e.highestTargetId))}))}getLastRemoteSnapshotVersion(t){return this.Vn(t).next((t=>or.fromTimestamp(new ir(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(t){return this.Vn(t).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(t,e,n){return this.Vn(t).next((s=>(s.highestListenSequenceNumber=e,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),e>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=e),this.Sn(t,s))))}addTargetData(t,e){return this.Dn(t,e).next((()=>this.Vn(t).next((n=>(n.targetCount+=1,this.Cn(e,n),this.Sn(t,n))))))}updateTargetData(t,e){return this.Dn(t,e)}removeTargetData(t,e){return this.removeMatchingKeysForTargetId(t,e.targetId).next((()=>Cc(t).delete(e.targetId))).next((()=>this.Vn(t))).next((e=>(Us(e.targetCount>0),e.targetCount-=1,this.Sn(t,e))))}removeTargets(t,e,n){let s=0;const r=[];return Cc(t).Z(((i,o)=>{const a=qu(o);a.sequenceNumber<=e&&null===n.get(a.targetId)&&(s++,r.push(this.removeTargetData(t,a)));})).next((()=>Ar.waitFor(r))).next((()=>s))}forEachTarget(t,e){return Cc(t).Z(((t,n)=>{const s=qu(n);e(s);}))}Vn(t){return Nc(t).get("targetGlobalKey").next((t=>(Us(null!==t),t)))}Sn(t,e){return Nc(t).put("targetGlobalKey",e)}Dn(t,e){return Cc(t).put(Gu(this.It,e))}Cn(t,e){let n=!1;return t.targetId>e.highestTargetId&&(e.highestTargetId=t.targetId,n=!0),t.sequenceNumber>e.highestListenSequenceNumber&&(e.highestListenSequenceNumber=t.sequenceNumber,n=!0),n}getTargetCount(t){return this.Vn(t).next((t=>t.targetCount))}getTargetData(t,e){const n=Oi(e),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let r=null;return Cc(t).Z({range:s,index:"queryTargetsIndex"},((t,n,s)=>{const i=qu(n);Vi(e,i.target)&&(r=i,s.done());})).next((()=>r))}addMatchingKeys(t,e,n){const s=[],r=kc(t);return e.forEach((e=>{const i=nu(e.path);s.push(r.put({targetId:n,path:i})),s.push(this.referenceDelegate.addReference(t,n,e));})),Ar.waitFor(s)}removeMatchingKeys(t,e,n){const s=kc(t);return Ar.forEach(e,(e=>{const r=nu(e.path);return Ar.waitFor([s.delete([n,r]),this.referenceDelegate.removeReference(t,n,e)])}))}removeMatchingKeysForTargetId(t,e){const n=kc(t),s=IDBKeyRange.bound([e],[e+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(t,e){const n=IDBKeyRange.bound([e],[e+1],!1,!0),s=kc(t);let r=fa();return s.Z({range:n,X:!0},((t,e,n)=>{const s=iu(t[1]),i=new lr(s);r=r.add(i);})).next((()=>r))}containsKey(t,e){const n=nu(e.path),s=IDBKeyRange.bound([n],[rr(n)],!1,!0);let r=0;return kc(t).Z({index:"documentTargetsIndex",X:!0,range:s},(([t,e],n,s)=>{0!==t&&(r++,s.done());})).next((()=>r>0))}se(t,e){return Cc(t).get(e).next((t=>t?qu(t):null))}}function Cc(t){return Nu(t,"targets")}function Nc(t){return Nu(t,"targetGlobal")}function kc(t){return Nu(t,"targetDocuments")}function Rc([t,e],[n,s]){const r=nr(t,n);return 0===r?nr(e,s):r}class Lc{constructor(t){this.xn=t,this.buffer=new $r(Rc),this.Nn=0;}kn(){return ++this.Nn}On(t){const e=[t,this.kn()];if(this.buffer.size<this.xn)this.buffer=this.buffer.add(e);else {const t=this.buffer.last();Rc(e,t)<0&&(this.buffer=this.buffer.delete(t).add(e));}}get maxValue(){return this.buffer.last()[0]}}class Mc{constructor(t,e,n){this.garbageCollector=t,this.asyncQueue=e,this.localStore=n,this.Mn=null;}start(){-1!==this.garbageCollector.params.cacheSizeCollectionThreshold&&this.Fn(6e4);}stop(){this.Mn&&(this.Mn.cancel(),this.Mn=null);}get started(){return null!==this.Mn}Fn(t){Ms("LruGarbageCollector",`Garbage collection scheduled in ${t}ms`),this.Mn=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,(async()=>{this.Mn=null;try{await this.localStore.collectGarbage(this.garbageCollector);}catch(t){kr(t)?Ms("LruGarbageCollector","Ignoring IndexedDB error during garbage collection: ",t):await _r(t);}await this.Fn(3e5);}));}}class Oc{constructor(t,e){this.$n=t,this.params=e;}calculateTargetCount(t,e){return this.$n.Bn(t).next((t=>Math.floor(e/100*t)))}nthSequenceNumber(t,e){if(0===e)return Ar.resolve(Pr.at);const n=new Lc(e);return this.$n.forEachTarget(t,(t=>n.On(t.sequenceNumber))).next((()=>this.$n.Ln(t,(t=>n.On(t))))).next((()=>n.maxValue))}removeTargets(t,e,n){return this.$n.removeTargets(t,e,n)}removeOrphanedDocuments(t,e){return this.$n.removeOrphanedDocuments(t,e)}collect(t,e){return -1===this.params.cacheSizeCollectionThreshold?(Ms("LruGarbageCollector","Garbage collection skipped; disabled"),Ar.resolve(wc)):this.getCacheSize(t).next((n=>n<this.params.cacheSizeCollectionThreshold?(Ms("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),wc):this.Un(t,e)))}getCacheSize(t){return this.$n.getCacheSize(t)}Un(t,e){let n,s,r,i,o,a,u;const c=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next((e=>(e>this.params.maximumSequenceNumbersToCollect?(Ms("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${e}`),s=this.params.maximumSequenceNumbersToCollect):s=e,i=Date.now(),this.nthSequenceNumber(t,s)))).next((s=>(n=s,o=Date.now(),this.removeTargets(t,n,e)))).next((e=>(r=e,a=Date.now(),this.removeOrphanedDocuments(t,n)))).next((t=>(u=Date.now(),Rs()<=b.DEBUG&&Ms("LruGarbageCollector",`LRU Garbage Collection\n\tCounted targets in ${i-c}ms\n\tDetermined least recently used ${s} in `+(o-i)+"ms\n"+`\tRemoved ${r} targets in `+(a-o)+"ms\n"+`\tRemoved ${t} documents in `+(u-a)+"ms\n"+`Total Duration: ${u-c}ms`),Ar.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:r,documentsRemoved:t}))))}}class Vc{constructor(t,e){this.db=t,this.garbageCollector=function(t,e){return new Oc(t,e)}(this,e);}Bn(t){const e=this.qn(t);return this.db.getTargetCache().getTargetCount(t).next((t=>e.next((e=>t+e))))}qn(t){let e=0;return this.Ln(t,(t=>{e++;})).next((()=>e))}forEachTarget(t,e){return this.db.getTargetCache().forEachTarget(t,e)}Ln(t,e){return this.Kn(t,((t,n)=>e(n)))}addReference(t,e,n){return Fc(t,n)}removeReference(t,e,n){return Fc(t,n)}removeTargets(t,e,n){return this.db.getTargetCache().removeTargets(t,e,n)}markPotentiallyOrphaned(t,e){return Fc(t,e)}Gn(t,e){return function(t,e){let n=!1;return Ac(t).tt((s=>Tc(t,s,e).next((t=>(t&&(n=!0),Ar.resolve(!t)))))).next((()=>n))}(t,e)}removeOrphanedDocuments(t,e){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let r=0;return this.Kn(t,((i,o)=>{if(o<=e){const e=this.Gn(t,i).next((e=>{if(!e)return r++,n.getEntry(t,i).next((()=>(n.removeEntry(i,or.min()),kc(t).delete([0,nu(i.path)]))))}));s.push(e);}})).next((()=>Ar.waitFor(s))).next((()=>n.apply(t))).next((()=>r))}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(t,n)}updateLimboDocument(t,e){return Fc(t,e)}Kn(t,e){const n=kc(t);let s,r=Pr.at;return n.Z({index:"documentTargetsIndex"},(([t,n],{path:i,sequenceNumber:o})=>{0===t?(r!==Pr.at&&e(new lr(iu(s)),r),r=o,s=i):r=Pr.at;})).next((()=>{r!==Pr.at&&e(new lr(iu(s)),r);}))}getCacheSize(t){return this.db.getRemoteDocumentCache().getSize(t)}}function Fc(t,e){return kc(t).put(function(t,e){return {targetId:0,path:nu(t.path),sequenceNumber:e}}(e,t.currentSequenceNumber))}class Pc{constructor(){this.changes=new na((t=>t.toString()),((t,e)=>t.isEqual(e))),this.changesApplied=!1;}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t);}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,Ri.newInvalidDocument(t).setReadTime(e));}getEntry(t,e){this.assertNotApplied();const n=this.changes.get(e);return void 0!==n?Ar.resolve(n):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}class Uc{constructor(t){this.It=t;}setIndexManager(t){this.indexManager=t;}addEntry(t,e,n){return Kc(t).put(n)}removeEntry(t,e,n){return Kc(t).delete(function(t,e){const n=t.path.toArray();return [n.slice(0,n.length-2),n[n.length-2],Fu(e),n[n.length-1]]}(e,n))}updateMetadata(t,e){return this.getMetadata(t).next((n=>(n.byteSize+=e,this.Qn(t,n))))}getEntry(t,e){let n=Ri.newInvalidDocument(e);return Kc(t).Z({index:"documentKeyIndex",range:IDBKeyRange.only(jc(e))},((t,s)=>{n=this.jn(e,s);})).next((()=>n))}Wn(t,e){let n={size:0,document:Ri.newInvalidDocument(e)};return Kc(t).Z({index:"documentKeyIndex",range:IDBKeyRange.only(jc(e))},((t,s)=>{n={document:this.jn(e,s),size:bc(s)};})).next((()=>n))}getEntries(t,e){let n=ra();return this.zn(t,e,((t,e)=>{const s=this.jn(t,e);n=n.insert(t,s);})).next((()=>n))}Hn(t,e){let n=ra(),s=new Gr(lr.comparator);return this.zn(t,e,((t,e)=>{const r=this.jn(t,e);n=n.insert(t,r),s=s.insert(t,bc(e));})).next((()=>({documents:n,Jn:s})))}zn(t,e,n){if(e.isEmpty())return Ar.resolve();let s=new $r(Qc);e.forEach((t=>s=s.add(t)));const r=IDBKeyRange.bound(jc(s.first()),jc(s.last())),i=s.getIterator();let o=i.getNext();return Kc(t).Z({index:"documentKeyIndex",range:r},((t,e,s)=>{const r=lr.fromSegments([...e.prefixPath,e.collectionGroup,e.documentId]);for(;o&&Qc(o,r)<0;)n(o,null),o=i.getNext();o&&o.isEqual(r)&&(n(o,e),o=i.hasNext()?i.getNext():null),o?s.j(jc(o)):s.done();})).next((()=>{for(;o;)n(o,null),o=i.hasNext()?i.getNext():null;}))}getAllFromCollection(t,e,n){const s=[e.popLast().toArray(),e.lastSegment(),Fu(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],r=[e.popLast().toArray(),e.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return Kc(t).W(IDBKeyRange.bound(s,r,!0)).next((t=>{let e=ra();for(const n of t){const t=this.jn(lr.fromSegments(n.prefixPath.concat(n.collectionGroup,n.documentId)),n);e=e.insert(t.key,t);}return e}))}getAllFromCollectionGroup(t,e,n,s){let r=ra();const i=$c(e,n),o=$c(e,br.max());return Kc(t).Z({index:"collectionGroupIndex",range:IDBKeyRange.bound(i,o,!0)},((t,e,n)=>{const i=this.jn(lr.fromSegments(e.prefixPath.concat(e.collectionGroup,e.documentId)),e);r=r.insert(i.key,i),r.size===s&&n.done();})).next((()=>r))}newChangeBuffer(t){return new qc(this,!!t&&t.trackRemovals)}getSize(t){return this.getMetadata(t).next((t=>t.byteSize))}getMetadata(t){return Gc(t).get("remoteDocumentGlobalKey").next((t=>(Us(!!t),t)))}Qn(t,e){return Gc(t).put("remoteDocumentGlobalKey",e)}jn(t,e){if(e){const t=function(t,e){let n;if(e.document)n=qa(t.re,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const t=lr.fromSegments(e.noDocument.path),s=Uu(e.noDocument.readTime);n=Ri.newNoDocument(t,s),e.hasCommittedMutations&&n.setHasCommittedMutations();}else {if(!e.unknownDocument)return Ps();{const t=lr.fromSegments(e.unknownDocument.path),s=Uu(e.unknownDocument.version);n=Ri.newUnknownDocument(t,s);}}return e.readTime&&n.setReadTime(function(t){const e=new ir(t[0],t[1]);return or.fromTimestamp(e)}(e.readTime)),n}(this.It,e);if(!t.isNoDocument()||!t.version.isEqual(or.min()))return t}return Ri.newInvalidDocument(t)}}function Bc(t){return new Uc(t)}class qc extends Pc{constructor(t,e){super(),this.Yn=t,this.trackRemovals=e,this.Xn=new na((t=>t.toString()),((t,e)=>t.isEqual(e)));}applyChanges(t){const e=[];let n=0,s=new $r(((t,e)=>nr(t.canonicalString(),e.canonicalString())));return this.changes.forEach(((r,i)=>{const o=this.Xn.get(r);if(e.push(this.Yn.removeEntry(t,r,o.readTime)),i.isValidDocument()){const a=Vu(this.Yn.It,i);s=s.add(r.path.popLast());const u=bc(a);n+=u-o.size,e.push(this.Yn.addEntry(t,r,a));}else if(n-=o.size,this.trackRemovals){const n=Vu(this.Yn.It,i.convertToNoDocument(or.min()));e.push(this.Yn.addEntry(t,r,n));}})),s.forEach((n=>{e.push(this.Yn.indexManager.addToCollectionParentIndex(t,n));})),e.push(this.Yn.updateMetadata(t,n)),Ar.waitFor(e)}getFromCache(t,e){return this.Yn.Wn(t,e).next((t=>(this.Xn.set(e,{size:t.size,readTime:t.document.readTime}),t.document)))}getAllFromCache(t,e){return this.Yn.Hn(t,e).next((({documents:t,Jn:e})=>(e.forEach(((e,n)=>{this.Xn.set(e,{size:n,readTime:t.get(e).readTime});})),t)))}}function Gc(t){return Nu(t,"remoteDocumentGlobal")}function Kc(t){return Nu(t,"remoteDocumentsV14")}function jc(t){const e=t.path.toArray();return [e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function $c(t,e){const n=e.documentKey.path.toArray();return [t,Fu(e.readTime),n.slice(0,n.length-2),n.length>0?n[n.length-1]:""]}function Qc(t,e){const n=t.path.toArray(),s=e.path.toArray();let r=0;for(let t=0;t<n.length-2&&t<s.length-2;++t)if(r=nr(n[t],s[t]),r)return r;return r=nr(n.length,s.length),r||(r=nr(n[n.length-2],s[s.length-2]),r||nr(n[n.length-1],s[s.length-1]))}class zc{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e;}}class Hc{constructor(t,e,n,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=n,this.indexManager=s;}getDocument(t,e){let n=null;return this.documentOverlayCache.getOverlay(t,e).next((s=>(n=s,this.getBaseDocument(t,e,n)))).next((t=>(null!==n&&qo(n.mutation,t,Hr.empty(),ir.now()),t)))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next((e=>this.getLocalViewOfDocuments(t,e,fa()).next((()=>e))))}getLocalViewOfDocuments(t,e,n=fa()){const s=ua();return this.populateOverlays(t,s,e).next((()=>this.computeViews(t,e,s,n).next((t=>{let e=oa();return t.forEach(((t,n)=>{e=e.insert(t,n.overlayedDocument);})),e}))))}getOverlayedDocuments(t,e){const n=ua();return this.populateOverlays(t,n,e).next((()=>this.computeViews(t,e,n,fa())))}populateOverlays(t,e,n){const s=[];return n.forEach((t=>{e.has(t)||s.push(t);})),this.documentOverlayCache.getOverlays(t,s).next((t=>{t.forEach(((t,n)=>{e.set(t,n);}));}))}computeViews(t,e,n,s){let r=ra();const i=ha(),o=ha();return e.forEach(((t,e)=>{const o=n.get(e.key);s.has(e.key)&&(void 0===o||o.mutation instanceof $o)?r=r.insert(e.key,e):void 0!==o&&(i.set(e.key,o.mutation.getFieldMask()),qo(o.mutation,e,o.mutation.getFieldMask(),ir.now()));})),this.recalculateAndSaveOverlays(t,r).next((t=>(t.forEach(((t,e)=>i.set(t,e))),e.forEach(((t,e)=>{var n;return o.set(t,new zc(e,null!==(n=i.get(t))&&void 0!==n?n:null))})),o)))}recalculateAndSaveOverlays(t,e){const n=ha();let s=new Gr(((t,e)=>t-e)),r=fa();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next((t=>{for(const r of t)r.keys().forEach((t=>{const i=e.get(t);if(null===i)return;let o=n.get(t)||Hr.empty();o=r.applyToLocalView(i,o),n.set(t,o);const a=(s.get(r.batchId)||fa()).add(t);s=s.insert(r.batchId,a);}));})).next((()=>{const i=[],o=s.getReverseIterator();for(;o.hasNext();){const s=o.getNext(),a=s.key,u=s.value,c=ca();u.forEach((t=>{if(!r.has(t)){const s=Uo(e.get(t),n.get(t));null!==s&&c.set(t,s),r=r.add(t);}})),i.push(this.documentOverlayCache.saveOverlays(t,a,c));}return Ar.waitFor(i)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next((e=>this.recalculateAndSaveOverlays(t,e)))}getDocumentsMatchingQuery(t,e,n){return function(t){return lr.isDocumentKey(t.path)&&null===t.collectionGroup&&0===t.filters.length}(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):ao(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,n):this.getDocumentsMatchingCollectionQuery(t,e,n)}getNextDocuments(t,e,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,n,s).next((r=>{const i=s-r.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,n.largestBatchId,s-r.size):Ar.resolve(ua());let o=-1,a=r;return i.next((e=>Ar.forEach(e,((e,n)=>(o<n.largestBatchId&&(o=n.largestBatchId),r.get(e)?Ar.resolve():this.getBaseDocument(t,e,n).next((t=>{a=a.insert(e,t);}))))).next((()=>this.populateOverlays(t,e,r))).next((()=>this.computeViews(t,a,e,fa()))).next((t=>({batchId:o,changes:aa(t)})))))}))}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new lr(e)).next((t=>{let e=oa();return t.isFoundDocument()&&(e=e.insert(t.key,t)),e}))}getDocumentsMatchingCollectionGroupQuery(t,e,n){const s=e.collectionGroup;let r=oa();return this.indexManager.getCollectionParents(t,s).next((i=>Ar.forEach(i,(i=>{const o=function(t,e){return new eo(e,null,t.explicitOrderBy.slice(),t.filters.slice(),t.limit,t.limitType,t.startAt,t.endAt)}(e,i.child(s));return this.getDocumentsMatchingCollectionQuery(t,o,n).next((t=>{t.forEach(((t,e)=>{r=r.insert(t,e);}));}))})).next((()=>r))))}getDocumentsMatchingCollectionQuery(t,e,n){let s;return this.remoteDocumentCache.getAllFromCollection(t,e.path,n).next((r=>(s=r,this.documentOverlayCache.getOverlaysForCollection(t,e.path,n.largestBatchId)))).next((t=>{t.forEach(((t,e)=>{const n=e.getKey();null===s.get(n)&&(s=s.insert(n,Ri.newInvalidDocument(n)));}));let n=oa();return s.forEach(((s,r)=>{const i=t.get(s);void 0!==i&&qo(i.mutation,r,Hr.empty(),ir.now()),go(e,r)&&(n=n.insert(s,r));})),n}))}getBaseDocument(t,e,n){return null===n||1===n.mutation.type?this.remoteDocumentCache.getEntry(t,e):Ar.resolve(Ri.newInvalidDocument(e))}}class Wc{constructor(t){this.It=t,this.Zn=new Map,this.ts=new Map;}getBundleMetadata(t,e){return Ar.resolve(this.Zn.get(e))}saveBundleMetadata(t,e){var n;return this.Zn.set(e.id,{id:(n=e).id,version:n.version,createTime:ka(n.createTime)}),Ar.resolve()}getNamedQuery(t,e){return Ar.resolve(this.ts.get(e))}saveNamedQuery(t,e){return this.ts.set(e.name,function(t){return {name:t.name,query:Ku(t.bundledQuery),readTime:ka(t.readTime)}}(e)),Ar.resolve()}}class Yc{constructor(){this.overlays=new Gr(lr.comparator),this.es=new Map;}getOverlay(t,e){return Ar.resolve(this.overlays.get(e))}getOverlays(t,e){const n=ua();return Ar.forEach(e,(e=>this.getOverlay(t,e).next((t=>{null!==t&&n.set(e,t);})))).next((()=>n))}saveOverlays(t,e,n){return n.forEach(((n,s)=>{this.ue(t,e,s);})),Ar.resolve()}removeOverlaysForBatchId(t,e,n){const s=this.es.get(n);return void 0!==s&&(s.forEach((t=>this.overlays=this.overlays.remove(t))),this.es.delete(n)),Ar.resolve()}getOverlaysForCollection(t,e,n){const s=ua(),r=e.length+1,i=new lr(e.child("")),o=this.overlays.getIteratorFrom(i);for(;o.hasNext();){const t=o.getNext().value,i=t.getKey();if(!e.isPrefixOf(i.path))break;i.path.length===r&&t.largestBatchId>n&&s.set(t.getKey(),t);}return Ar.resolve(s)}getOverlaysForCollectionGroup(t,e,n,s){let r=new Gr(((t,e)=>t-e));const i=this.overlays.getIterator();for(;i.hasNext();){const t=i.getNext().value;if(t.getKey().getCollectionGroup()===e&&t.largestBatchId>n){let e=r.get(t.largestBatchId);null===e&&(e=ua(),r=r.insert(t.largestBatchId,e)),e.set(t.getKey(),t);}}const o=ua(),a=r.getIterator();for(;a.hasNext()&&(a.getNext().value.forEach(((t,e)=>o.set(t,e))),!(o.size()>=s)););return Ar.resolve(o)}ue(t,e,n){const s=this.overlays.get(n.key);if(null!==s){const t=this.es.get(s.largestBatchId).delete(n.key);this.es.set(s.largestBatchId,t);}this.overlays=this.overlays.insert(n.key,new Lu(e,n));let r=this.es.get(e);void 0===r&&(r=fa(),this.es.set(e,r)),this.es.set(e,r.add(n.key));}}class Xc{constructor(){this.ns=new $r(Jc.ss),this.rs=new $r(Jc.os);}isEmpty(){return this.ns.isEmpty()}addReference(t,e){const n=new Jc(t,e);this.ns=this.ns.add(n),this.rs=this.rs.add(n);}us(t,e){t.forEach((t=>this.addReference(t,e)));}removeReference(t,e){this.cs(new Jc(t,e));}hs(t,e){t.forEach((t=>this.removeReference(t,e)));}ls(t){const e=new lr(new ur([])),n=new Jc(e,t),s=new Jc(e,t+1),r=[];return this.rs.forEachInRange([n,s],(t=>{this.cs(t),r.push(t.key);})),r}fs(){this.ns.forEach((t=>this.cs(t)));}cs(t){this.ns=this.ns.delete(t),this.rs=this.rs.delete(t);}ds(t){const e=new lr(new ur([])),n=new Jc(e,t),s=new Jc(e,t+1);let r=fa();return this.rs.forEachInRange([n,s],(t=>{r=r.add(t.key);})),r}containsKey(t){const e=new Jc(t,0),n=this.ns.firstAfterOrEqual(e);return null!==n&&t.isEqual(n.key)}}class Jc{constructor(t,e){this.key=t,this._s=e;}static ss(t,e){return lr.comparator(t.key,e.key)||nr(t._s,e._s)}static os(t,e){return nr(t._s,e._s)||lr.comparator(t.key,e.key)}}class Zc{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.ws=1,this.gs=new $r(Jc.ss);}checkEmpty(t){return Ar.resolve(0===this.mutationQueue.length)}addMutationBatch(t,e,n,s){const r=this.ws;this.ws++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const i=new ku(r,e,n,s);this.mutationQueue.push(i);for(const e of s)this.gs=this.gs.add(new Jc(e.key,r)),this.indexManager.addToCollectionParentIndex(t,e.key.path.popLast());return Ar.resolve(i)}lookupMutationBatch(t,e){return Ar.resolve(this.ys(e))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,s=this.ps(n),r=s<0?0:s;return Ar.resolve(this.mutationQueue.length>r?this.mutationQueue[r]:null)}getHighestUnacknowledgedBatchId(){return Ar.resolve(0===this.mutationQueue.length?-1:this.ws-1)}getAllMutationBatches(t){return Ar.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const n=new Jc(e,0),s=new Jc(e,Number.POSITIVE_INFINITY),r=[];return this.gs.forEachInRange([n,s],(t=>{const e=this.ys(t._s);r.push(e);})),Ar.resolve(r)}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new $r(nr);return e.forEach((t=>{const e=new Jc(t,0),s=new Jc(t,Number.POSITIVE_INFINITY);this.gs.forEachInRange([e,s],(t=>{n=n.add(t._s);}));})),Ar.resolve(this.Is(n))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,s=n.length+1;let r=n;lr.isDocumentKey(r)||(r=r.child(""));const i=new Jc(new lr(r),0);let o=new $r(nr);return this.gs.forEachWhile((t=>{const e=t.key.path;return !!n.isPrefixOf(e)&&(e.length===s&&(o=o.add(t._s)),!0)}),i),Ar.resolve(this.Is(o))}Is(t){const e=[];return t.forEach((t=>{const n=this.ys(t);null!==n&&e.push(n);})),e}removeMutationBatch(t,e){Us(0===this.Ts(e.batchId,"removed")),this.mutationQueue.shift();let n=this.gs;return Ar.forEach(e.mutations,(s=>{const r=new Jc(s.key,e.batchId);return n=n.delete(r),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)})).next((()=>{this.gs=n;}))}An(t){}containsKey(t,e){const n=new Jc(e,0),s=this.gs.firstAfterOrEqual(n);return Ar.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,Ar.resolve()}Ts(t,e){return this.ps(t)}ps(t){return 0===this.mutationQueue.length?0:t-this.mutationQueue[0].batchId}ys(t){const e=this.ps(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}class th{constructor(t){this.Es=t,this.docs=new Gr(lr.comparator),this.size=0;}setIndexManager(t){this.indexManager=t;}addEntry(t,e){const n=e.key,s=this.docs.get(n),r=s?s.size:0,i=this.Es(e);return this.docs=this.docs.insert(n,{document:e.mutableCopy(),size:i}),this.size+=i-r,this.indexManager.addToCollectionParentIndex(t,n.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size);}getEntry(t,e){const n=this.docs.get(e);return Ar.resolve(n?n.document.mutableCopy():Ri.newInvalidDocument(e))}getEntries(t,e){let n=ra();return e.forEach((t=>{const e=this.docs.get(t);n=n.insert(t,e?e.document.mutableCopy():Ri.newInvalidDocument(t));})),Ar.resolve(n)}getAllFromCollection(t,e,n){let s=ra();const r=new lr(e.child("")),i=this.docs.getIteratorFrom(r);for(;i.hasNext();){const{key:t,value:{document:r}}=i.getNext();if(!e.isPrefixOf(t.path))break;t.path.length>e.length+1||Er(Ir(r),n)<=0||(s=s.insert(r.key,r.mutableCopy()));}return Ar.resolve(s)}getAllFromCollectionGroup(t,e,n,s){Ps();}As(t,e){return Ar.forEach(this.docs,(t=>e(t)))}newChangeBuffer(t){return new eh(this)}getSize(t){return Ar.resolve(this.size)}}class eh extends Pc{constructor(t){super(),this.Yn=t;}applyChanges(t){const e=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?e.push(this.Yn.addEntry(t,s)):this.Yn.removeEntry(n);})),Ar.waitFor(e)}getFromCache(t,e){return this.Yn.getEntry(t,e)}getAllFromCache(t,e){return this.Yn.getEntries(t,e)}}class nh{constructor(t){this.persistence=t,this.Rs=new na((t=>Oi(t)),Vi),this.lastRemoteSnapshotVersion=or.min(),this.highestTargetId=0,this.bs=0,this.Ps=new Xc,this.targetCount=0,this.vs=Dc.Pn();}forEachTarget(t,e){return this.Rs.forEach(((t,n)=>e(n))),Ar.resolve()}getLastRemoteSnapshotVersion(t){return Ar.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return Ar.resolve(this.bs)}allocateTargetId(t){return this.highestTargetId=this.vs.next(),Ar.resolve(this.highestTargetId)}setTargetsMetadata(t,e,n){return n&&(this.lastRemoteSnapshotVersion=n),e>this.bs&&(this.bs=e),Ar.resolve()}Dn(t){this.Rs.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.vs=new Dc(e),this.highestTargetId=e),t.sequenceNumber>this.bs&&(this.bs=t.sequenceNumber);}addTargetData(t,e){return this.Dn(e),this.targetCount+=1,Ar.resolve()}updateTargetData(t,e){return this.Dn(e),Ar.resolve()}removeTargetData(t,e){return this.Rs.delete(e.target),this.Ps.ls(e.targetId),this.targetCount-=1,Ar.resolve()}removeTargets(t,e,n){let s=0;const r=[];return this.Rs.forEach(((i,o)=>{o.sequenceNumber<=e&&null===n.get(o.targetId)&&(this.Rs.delete(i),r.push(this.removeMatchingKeysForTargetId(t,o.targetId)),s++);})),Ar.waitFor(r).next((()=>s))}getTargetCount(t){return Ar.resolve(this.targetCount)}getTargetData(t,e){const n=this.Rs.get(e)||null;return Ar.resolve(n)}addMatchingKeys(t,e,n){return this.Ps.us(e,n),Ar.resolve()}removeMatchingKeys(t,e,n){this.Ps.hs(e,n);const s=this.persistence.referenceDelegate,r=[];return s&&e.forEach((e=>{r.push(s.markPotentiallyOrphaned(t,e));})),Ar.waitFor(r)}removeMatchingKeysForTargetId(t,e){return this.Ps.ls(e),Ar.resolve()}getMatchingKeysForTargetId(t,e){const n=this.Ps.ds(e);return Ar.resolve(n)}containsKey(t,e){return Ar.resolve(this.Ps.containsKey(e))}}class sh{constructor(t,e){this.Vs={},this.overlays={},this.Ss=new Pr(0),this.Ds=!1,this.Ds=!0,this.referenceDelegate=t(this),this.Cs=new nh(this),this.indexManager=new cc,this.remoteDocumentCache=function(t){return new th(t)}((t=>this.referenceDelegate.xs(t))),this.It=new Ou(e),this.Ns=new Wc(this.It);}start(){return Promise.resolve()}shutdown(){return this.Ds=!1,Promise.resolve()}get started(){return this.Ds}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new Yc,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let n=this.Vs[t.toKey()];return n||(n=new Zc(e,this.referenceDelegate),this.Vs[t.toKey()]=n),n}getTargetCache(){return this.Cs}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ns}runTransaction(t,e,n){Ms("MemoryPersistence","Starting transaction:",t);const s=new rh(this.Ss.next());return this.referenceDelegate.ks(),n(s).next((t=>this.referenceDelegate.Os(s).next((()=>t)))).toPromise().then((t=>(s.raiseOnCommittedEvent(),t)))}Ms(t,e){return Ar.or(Object.values(this.Vs).map((n=>()=>n.containsKey(t,e))))}}class rh extends Sr{constructor(t){super(),this.currentSequenceNumber=t;}}class ih{constructor(t){this.persistence=t,this.Fs=new Xc,this.$s=null;}static Bs(t){return new ih(t)}get Ls(){if(this.$s)return this.$s;throw Ps()}addReference(t,e,n){return this.Fs.addReference(n,e),this.Ls.delete(n.toString()),Ar.resolve()}removeReference(t,e,n){return this.Fs.removeReference(n,e),this.Ls.add(n.toString()),Ar.resolve()}markPotentiallyOrphaned(t,e){return this.Ls.add(e.toString()),Ar.resolve()}removeTarget(t,e){this.Fs.ls(e.targetId).forEach((t=>this.Ls.add(t.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(t,e.targetId).next((t=>{t.forEach((t=>this.Ls.add(t.toString())));})).next((()=>n.removeTargetData(t,e)))}ks(){this.$s=new Set;}Os(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return Ar.forEach(this.Ls,(n=>{const s=lr.fromPath(n);return this.Us(t,s).next((t=>{t||e.removeEntry(s,or.min());}))})).next((()=>(this.$s=null,e.apply(t))))}updateLimboDocument(t,e){return this.Us(t,e).next((t=>{t?this.Ls.delete(e.toString()):this.Ls.add(e.toString());}))}xs(t){return 0}Us(t,e){return Ar.or([()=>Ar.resolve(this.Fs.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ms(t,e)])}}class oh{constructor(t){this.It=t;}$(t,e,n,s){const r=new Dr("createOrUpgrade",e);n<1&&s>=1&&(function(t){t.createObjectStore("owner");}(t),function(t){t.createObjectStore("mutationQueues",{keyPath:"userId"}),t.createObjectStore("mutations",{keyPath:"batchId",autoIncrement:!0}).createIndex("userMutationsIndex",ou,{unique:!0}),t.createObjectStore("documentMutations");}(t),ah(t),function(t){t.createObjectStore("remoteDocuments");}(t));let i=Ar.resolve();return n<3&&s>=3&&(0!==n&&(function(t){t.deleteObjectStore("targetDocuments"),t.deleteObjectStore("targets"),t.deleteObjectStore("targetGlobal");}(t),ah(t)),i=i.next((()=>function(t){const e=t.store("targetGlobal"),n={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:or.min().toTimestamp(),targetCount:0};return e.put("targetGlobalKey",n)}(r)))),n<4&&s>=4&&(0!==n&&(i=i.next((()=>function(t,e){return e.store("mutations").W().next((n=>{t.deleteObjectStore("mutations"),t.createObjectStore("mutations",{keyPath:"batchId",autoIncrement:!0}).createIndex("userMutationsIndex",ou,{unique:!0});const s=e.store("mutations"),r=n.map((t=>s.put(t)));return Ar.waitFor(r)}))}(t,r)))),i=i.next((()=>{!function(t){t.createObjectStore("clientMetadata",{keyPath:"clientId"});}(t);}))),n<5&&s>=5&&(i=i.next((()=>this.qs(r)))),n<6&&s>=6&&(i=i.next((()=>(function(t){t.createObjectStore("remoteDocumentGlobal");}(t),this.Ks(r))))),n<7&&s>=7&&(i=i.next((()=>this.Gs(r)))),n<8&&s>=8&&(i=i.next((()=>this.Qs(t,r)))),n<9&&s>=9&&(i=i.next((()=>{!function(t){t.objectStoreNames.contains("remoteDocumentChanges")&&t.deleteObjectStore("remoteDocumentChanges");}(t);}))),n<10&&s>=10&&(i=i.next((()=>this.js(r)))),n<11&&s>=11&&(i=i.next((()=>{!function(t){t.createObjectStore("bundles",{keyPath:"bundleId"});}(t),function(t){t.createObjectStore("namedQueries",{keyPath:"name"});}(t);}))),n<12&&s>=12&&(i=i.next((()=>{!function(t){const e=t.createObjectStore("documentOverlays",{keyPath:bu});e.createIndex("collectionPathOverlayIndex",Eu,{unique:!1}),e.createIndex("collectionGroupOverlayIndex",Tu,{unique:!1});}(t);}))),n<13&&s>=13&&(i=i.next((()=>function(t){const e=t.createObjectStore("remoteDocumentsV14",{keyPath:hu});e.createIndex("documentKeyIndex",lu),e.createIndex("collectionGroupIndex",du);}(t))).next((()=>this.Ws(t,r))).next((()=>t.deleteObjectStore("remoteDocuments")))),n<14&&s>=14&&(i=i.next((()=>this.zs(t,r)))),n<15&&s>=15&&(i=i.next((()=>function(t){t.createObjectStore("indexConfiguration",{keyPath:"indexId",autoIncrement:!0}).createIndex("collectionGroupIndex","collectionGroup",{unique:!1}),t.createObjectStore("indexState",{keyPath:yu}).createIndex("sequenceNumberIndex",wu,{unique:!1}),t.createObjectStore("indexEntries",{keyPath:vu}).createIndex("documentKeyIndex",Iu,{unique:!1});}(t)))),i}Ks(t){let e=0;return t.store("remoteDocuments").Z(((t,n)=>{e+=bc(n);})).next((()=>{const n={byteSize:e};return t.store("remoteDocumentGlobal").put("remoteDocumentGlobalKey",n)}))}qs(t){const e=t.store("mutationQueues"),n=t.store("mutations");return e.W().next((e=>Ar.forEach(e,(e=>{const s=IDBKeyRange.bound([e.userId,-1],[e.userId,e.lastAcknowledgedBatchId]);return n.W("userMutationsIndex",s).next((n=>Ar.forEach(n,(n=>{Us(n.userId===e.userId);const s=Bu(this.It,n);return Ic(t,e.userId,s).next((()=>{}))}))))}))))}Gs(t){const e=t.store("targetDocuments"),n=t.store("remoteDocuments");return t.store("targetGlobal").get("targetGlobalKey").next((t=>{const s=[];return n.Z(((n,r)=>{const i=new ur(n),o=function(t){return [0,nu(t)]}(i);s.push(e.get(o).next((n=>n?Ar.resolve():(n=>e.put({targetId:0,path:nu(n),sequenceNumber:t.highestListenSequenceNumber}))(i))));})).next((()=>Ar.waitFor(s)))}))}Qs(t,e){t.createObjectStore("collectionParents",{keyPath:pu});const n=e.store("collectionParents"),s=new hc,r=t=>{if(s.add(t)){const e=t.lastSegment(),s=t.popLast();return n.put({collectionId:e,parent:nu(s)})}};return e.store("remoteDocuments").Z({X:!0},((t,e)=>{const n=new ur(t);return r(n.popLast())})).next((()=>e.store("documentMutations").Z({X:!0},(([t,e,n],s)=>{const i=iu(e);return r(i.popLast())}))))}js(t){const e=t.store("targets");return e.Z(((t,n)=>{const s=qu(n),r=Gu(this.It,s);return e.put(r)}))}Ws(t,e){const n=e.store("remoteDocuments"),s=[];return n.Z(((t,n)=>{const r=e.store("remoteDocumentsV14"),i=(o=n,o.document?new lr(ur.fromString(o.document.name).popFirst(5)):o.noDocument?lr.fromSegments(o.noDocument.path):o.unknownDocument?lr.fromSegments(o.unknownDocument.path):Ps()).path.toArray();var o;const a={prefixPath:i.slice(0,i.length-2),collectionGroup:i[i.length-2],documentId:i[i.length-1],readTime:n.readTime||[0,0],unknownDocument:n.unknownDocument,noDocument:n.noDocument,document:n.document,hasCommittedMutations:!!n.hasCommittedMutations};s.push(r.put(a));})).next((()=>Ar.waitFor(s)))}zs(t,e){const n=e.store("mutations"),s=Bc(this.It),r=new sh(ih.Bs,this.It.re);return n.W().next((t=>{const n=new Map;return t.forEach((t=>{var e;let s=null!==(e=n.get(t.userId))&&void 0!==e?e:fa();Bu(this.It,t).keys().forEach((t=>s=s.add(t))),n.set(t.userId,s);})),Ar.forEach(n,((t,n)=>{const i=new Cs(n),o=Yu.oe(this.It,i),a=r.getIndexManager(i),u=Ec.oe(i,this.It,a,r.referenceDelegate);return new Hc(s,u,o,a).recalculateAndSaveOverlaysForDocumentKeys(new Cu(e,Pr.at),t).next()}))}))}}function ah(t){t.createObjectStore("targetDocuments",{keyPath:mu}).createIndex("documentTargetsIndex",gu,{unique:!0}),t.createObjectStore("targets",{keyPath:"targetId"}).createIndex("queryTargetsIndex",fu,{unique:!0}),t.createObjectStore("targetGlobal");}const uh="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.";class ch{constructor(t,e,n,s,r,i,o,a,u,c,h=15){if(this.allowTabSynchronization=t,this.persistenceKey=e,this.clientId=n,this.Hs=r,this.window=i,this.document=o,this.Js=u,this.Ys=c,this.Xs=h,this.Ss=null,this.Ds=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Zs=null,this.inForeground=!1,this.ti=null,this.ei=null,this.ni=Number.NEGATIVE_INFINITY,this.si=t=>Promise.resolve(),!ch.C())throw new Ks(Gs.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new Vc(this,s),this.ii=e+"main",this.It=new Ou(a),this.ri=new xr(this.ii,this.Xs,new oh(this.It)),this.Cs=new xc(this.referenceDelegate,this.It),this.remoteDocumentCache=Bc(this.It),this.Ns=new zu,this.window&&this.window.localStorage?this.oi=this.window.localStorage:(this.oi=null,!1===c&&Os("IndexedDbPersistence","LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."));}start(){return this.ui().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new Ks(Gs.FAILED_PRECONDITION,uh);return this.ci(),this.ai(),this.hi(),this.runTransaction("getHighestListenSequenceNumber","readonly",(t=>this.Cs.getHighestSequenceNumber(t)))})).then((t=>{this.Ss=new Pr(t,this.Js);})).then((()=>{this.Ds=!0;})).catch((t=>(this.ri&&this.ri.close(),Promise.reject(t))))}li(t){return this.si=async e=>{if(this.started)return t(e)},t(this.isPrimary)}setDatabaseDeletedListener(t){this.ri.L((async e=>{null===e.newVersion&&await t();}));}setNetworkEnabled(t){this.networkEnabled!==t&&(this.networkEnabled=t,this.Hs.enqueueAndForget((async()=>{this.started&&await this.ui();})));}ui(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(t=>lh(t).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.fi(t).next((t=>{t||(this.isPrimary=!1,this.Hs.enqueueRetryable((()=>this.si(!1))));}))})).next((()=>this.di(t))).next((e=>this.isPrimary&&!e?this._i(t).next((()=>!1)):!!e&&this.wi(t).next((()=>!0)))))).catch((t=>{if(kr(t))return Ms("IndexedDbPersistence","Failed to extend owner lease: ",t),this.isPrimary;if(!this.allowTabSynchronization)throw t;return Ms("IndexedDbPersistence","Releasing owner lease after error during lease refresh",t),!1})).then((t=>{this.isPrimary!==t&&this.Hs.enqueueRetryable((()=>this.si(t))),this.isPrimary=t;}))}fi(t){return hh(t).get("owner").next((t=>Ar.resolve(this.mi(t))))}gi(t){return lh(t).delete(this.clientId)}async yi(){if(this.isPrimary&&!this.pi(this.ni,18e5)){this.ni=Date.now();const t=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const e=Nu(t,"clientMetadata");return e.W().next((t=>{const n=this.Ii(t,18e5),s=t.filter((t=>-1===n.indexOf(t)));return Ar.forEach(s,(t=>e.delete(t.clientId))).next((()=>s))}))})).catch((()=>[]));if(this.oi)for(const e of t)this.oi.removeItem(this.Ti(e.clientId));}}hi(){this.ei=this.Hs.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.ui().then((()=>this.yi())).then((()=>this.hi()))));}mi(t){return !!t&&t.ownerId===this.clientId}di(t){return this.Ys?Ar.resolve(!0):hh(t).get("owner").next((e=>{if(null!==e&&this.pi(e.leaseTimestampMs,5e3)&&!this.Ei(e.ownerId)){if(this.mi(e)&&this.networkEnabled)return !0;if(!this.mi(e)){if(!e.allowTabSynchronization)throw new Ks(Gs.FAILED_PRECONDITION,uh);return !1}}return !(!this.networkEnabled||!this.inForeground)||lh(t).W().next((t=>void 0===this.Ii(t,5e3).find((t=>{if(this.clientId!==t.clientId){const e=!this.networkEnabled&&t.networkEnabled,n=!this.inForeground&&t.inForeground,s=this.networkEnabled===t.networkEnabled;if(e||n&&s)return !0}return !1}))))})).next((t=>(this.isPrimary!==t&&Ms("IndexedDbPersistence",`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.Ds=!1,this.Ai(),this.ei&&(this.ei.cancel(),this.ei=null),this.Ri(),this.bi(),await this.ri.runTransaction("shutdown","readwrite",["owner","clientMetadata"],(t=>{const e=new Cu(t,Pr.at);return this._i(e).next((()=>this.gi(e)))})),this.ri.close(),this.Pi();}Ii(t,e){return t.filter((t=>this.pi(t.updateTimeMs,e)&&!this.Ei(t.clientId)))}vi(){return this.runTransaction("getActiveClients","readonly",(t=>lh(t).W().next((t=>this.Ii(t,18e5).map((t=>t.clientId))))))}get started(){return this.Ds}getMutationQueue(t,e){return Ec.oe(t,this.It,e,this.referenceDelegate)}getTargetCache(){return this.Cs}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(t){return new dc(t,this.It.re.databaseId)}getDocumentOverlayCache(t){return Yu.oe(this.It,t)}getBundleCache(){return this.Ns}runTransaction(t,e,n){Ms("IndexedDbPersistence","Starting transaction:",t);const s="readonly"===e?"readonly":"readwrite",r=15===(i=this.Xs)?xu:14===i?Du:13===i?Au:12===i?_u:11===i?Su:void Ps();var i;let o;return this.ri.runTransaction(t,s,r,(s=>(o=new Cu(s,this.Ss?this.Ss.next():Pr.at),"readwrite-primary"===e?this.fi(o).next((t=>!!t||this.di(o))).next((e=>{if(!e)throw Os(`Failed to obtain primary lease for action '${t}'.`),this.isPrimary=!1,this.Hs.enqueueRetryable((()=>this.si(!1))),new Ks(Gs.FAILED_PRECONDITION,Tr);return n(o)})).next((t=>this.wi(o).next((()=>t)))):this.Vi(o).next((()=>n(o)))))).then((t=>(o.raiseOnCommittedEvent(),t)))}Vi(t){return hh(t).get("owner").next((t=>{if(null!==t&&this.pi(t.leaseTimestampMs,5e3)&&!this.Ei(t.ownerId)&&!this.mi(t)&&!(this.Ys||this.allowTabSynchronization&&t.allowTabSynchronization))throw new Ks(Gs.FAILED_PRECONDITION,uh)}))}wi(t){const e={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return hh(t).put("owner",e)}static C(){return xr.C()}_i(t){const e=hh(t);return e.get("owner").next((t=>this.mi(t)?(Ms("IndexedDbPersistence","Releasing primary lease."),e.delete("owner")):Ar.resolve()))}pi(t,e){const n=Date.now();return !(t<n-e||t>n&&(Os(`Detected an update time that is in the future: ${t} > ${n}`),1))}ci(){null!==this.document&&"function"==typeof this.document.addEventListener&&(this.ti=()=>{this.Hs.enqueueAndForget((()=>(this.inForeground="visible"===this.document.visibilityState,this.ui())));},this.document.addEventListener("visibilitychange",this.ti),this.inForeground="visible"===this.document.visibilityState);}Ri(){this.ti&&(this.document.removeEventListener("visibilitychange",this.ti),this.ti=null);}ai(){var t;"function"==typeof(null===(t=this.window)||void 0===t?void 0:t.addEventListener)&&(this.Zs=()=>{this.Ai(),h()&&navigator.appVersion.match(/Version\/1[45]/)&&this.Hs.enterRestrictedMode(!0),this.Hs.enqueueAndForget((()=>this.shutdown()));},this.window.addEventListener("pagehide",this.Zs));}bi(){this.Zs&&(this.window.removeEventListener("pagehide",this.Zs),this.Zs=null);}Ei(t){var e;try{const n=null!==(null===(e=this.oi)||void 0===e?void 0:e.getItem(this.Ti(t)));return Ms("IndexedDbPersistence",`Client '${t}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(t){return Os("IndexedDbPersistence","Failed to get zombied client id.",t),!1}}Ai(){if(this.oi)try{this.oi.setItem(this.Ti(this.clientId),String(Date.now()));}catch(t){Os("Failed to set zombie client id.",t);}}Pi(){if(this.oi)try{this.oi.removeItem(this.Ti(this.clientId));}catch(t){}}Ti(t){return `firestore_zombie_${this.persistenceKey}_${t}`}}function hh(t){return Nu(t,"owner")}function lh(t){return Nu(t,"clientMetadata")}function dh(t,e){let n=t.projectId;return t.isDefaultDatabase||(n+="."+t.database),"firestore/"+e+"/"+n+"/"}class fh{constructor(t,e,n,s){this.targetId=t,this.fromCache=e,this.Si=n,this.Di=s;}static Ci(t,e){let n=fa(),s=fa();for(const t of e.docChanges)switch(t.type){case 0:n=n.add(t.doc.key);break;case 1:s=s.add(t.doc.key);}return new fh(t,e.fromCache,n,s)}}class mh{constructor(){this.xi=!1;}initialize(t,e){this.Ni=t,this.indexManager=e,this.xi=!0;}getDocumentsMatchingQuery(t,e,n,s){return this.ki(t,e).next((r=>r||this.Oi(t,e,s,n))).next((n=>n||this.Mi(t,e)))}ki(t,e){if(ro(e))return Ar.resolve(null);let n=co(e);return this.indexManager.getIndexType(t,n).next((s=>0===s?null:(null!==e.limit&&1===s&&(e=ho(e,null,"F"),n=co(e)),this.indexManager.getDocumentsMatchingTarget(t,n).next((s=>{const r=fa(...s);return this.Ni.getDocuments(t,r).next((s=>this.indexManager.getMinOffset(t,n).next((n=>{const i=this.Fi(e,s);return this.$i(e,i,r,n.readTime)?this.ki(t,ho(e,null,"F")):this.Bi(t,i,e,n)}))))})))))}Oi(t,e,n,s){return ro(e)||s.isEqual(or.min())?this.Mi(t,e):this.Ni.getDocuments(t,n).next((r=>{const i=this.Fi(e,r);return this.$i(e,i,n,s)?this.Mi(t,e):(Rs()<=b.DEBUG&&Ms("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),mo(e)),this.Bi(t,i,e,vr(s,-1)))}))}Fi(t,e){let n=new $r(yo(t));return e.forEach(((e,s)=>{go(t,s)&&(n=n.add(s));})),n}$i(t,e,n,s){if(null===t.limit)return !1;if(n.size!==e.size)return !0;const r="F"===t.limitType?e.last():e.first();return !!r&&(r.hasPendingWrites||r.version.compareTo(s)>0)}Mi(t,e){return Rs()<=b.DEBUG&&Ms("QueryEngine","Using full collection scan to execute query:",mo(e)),this.Ni.getDocumentsMatchingQuery(t,e,br.min())}Bi(t,e,n,s){return this.Ni.getDocumentsMatchingQuery(t,n,s).next((t=>(e.forEach((e=>{t=t.insert(e.key,e);})),t)))}}class gh{constructor(t,e,n,s){this.persistence=t,this.Li=e,this.It=s,this.Ui=new Gr(nr),this.qi=new na((t=>Oi(t)),Vi),this.Ki=new Map,this.Gi=t.getRemoteDocumentCache(),this.Cs=t.getTargetCache(),this.Ns=t.getBundleCache(),this.Qi(n);}Qi(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new Hc(this.Gi,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Gi.setIndexManager(this.indexManager),this.Li.initialize(this.localDocuments,this.indexManager);}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(e=>t.collect(e,this.Ui)))}}function ph(t,e,n,s){return new gh(t,e,n,s)}async function yh(t,e){const n=qs(t);return await n.persistence.runTransaction("Handle user change","readonly",(t=>{let s;return n.mutationQueue.getAllMutationBatches(t).next((r=>(s=r,n.Qi(e),n.mutationQueue.getAllMutationBatches(t)))).next((e=>{const r=[],i=[];let o=fa();for(const t of s){r.push(t.batchId);for(const e of t.mutations)o=o.add(e.key);}for(const t of e){i.push(t.batchId);for(const e of t.mutations)o=o.add(e.key);}return n.localDocuments.getDocuments(t,o).next((t=>({ji:t,removedBatchIds:r,addedBatchIds:i})))}))}))}function wh(t){const e=qs(t);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.Cs.getLastRemoteSnapshotVersion(t)))}function vh(t,e,n){let s=fa(),r=fa();return n.forEach((t=>s=s.add(t))),e.getEntries(t,s).next((t=>{let s=ra();return n.forEach(((n,i)=>{const o=t.get(n);i.isFoundDocument()!==o.isFoundDocument()&&(r=r.add(n)),i.isNoDocument()&&i.version.isEqual(or.min())?(e.removeEntry(n,i.readTime),s=s.insert(n,i)):!o.isValidDocument()||i.version.compareTo(o.version)>0||0===i.version.compareTo(o.version)&&o.hasPendingWrites?(e.addEntry(i),s=s.insert(n,i)):Ms("LocalStore","Ignoring outdated watch update for ",n,". Current version:",o.version," Watch version:",i.version);})),{Wi:s,zi:r}}))}function Ih(t,e){const n=qs(t);return n.persistence.runTransaction("Get next mutation batch","readonly",(t=>(void 0===e&&(e=-1),n.mutationQueue.getNextMutationBatchAfterBatchId(t,e))))}function bh(t,e){const n=qs(t);return n.persistence.runTransaction("Allocate target","readwrite",(t=>{let s;return n.Cs.getTargetData(t,e).next((r=>r?(s=r,Ar.resolve(s)):n.Cs.allocateTargetId(t).next((r=>(s=new Mu(e,r,0,t.currentSequenceNumber),n.Cs.addTargetData(t,s).next((()=>s)))))))})).then((t=>{const s=n.Ui.get(t.targetId);return (null===s||t.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(n.Ui=n.Ui.insert(t.targetId,t),n.qi.set(e,t.targetId)),t}))}async function Eh(t,e,n){const s=qs(t),r=s.Ui.get(e),i=n?"readwrite":"readwrite-primary";try{n||await s.persistence.runTransaction("Release target",i,(t=>s.persistence.referenceDelegate.removeTarget(t,r)));}catch(t){if(!kr(t))throw t;Ms("LocalStore",`Failed to update sequence numbers for target ${e}: ${t}`);}s.Ui=s.Ui.remove(e),s.qi.delete(r.target);}function Th(t,e,n){const s=qs(t);let r=or.min(),i=fa();return s.persistence.runTransaction("Execute query","readonly",(t=>function(t,e,n){const s=qs(t),r=s.qi.get(n);return void 0!==r?Ar.resolve(s.Ui.get(r)):s.Cs.getTargetData(e,n)}(s,t,co(e)).next((e=>{if(e)return r=e.lastLimboFreeSnapshotVersion,s.Cs.getMatchingKeysForTargetId(t,e.targetId).next((t=>{i=t;}))})).next((()=>s.Li.getDocumentsMatchingQuery(t,e,n?r:or.min(),n?i:fa()))).next((t=>(Ah(s,po(e),t),{documents:t,Hi:i})))))}function Sh(t,e){const n=qs(t),s=qs(n.Cs),r=n.Ui.get(e);return r?Promise.resolve(r.target):n.persistence.runTransaction("Get target data","readonly",(t=>s.se(t,e).next((t=>t?t.target:null))))}function _h(t,e){const n=qs(t),s=n.Ki.get(e)||or.min();return n.persistence.runTransaction("Get new document changes","readonly",(t=>n.Gi.getAllFromCollectionGroup(t,e,vr(s,-1),Number.MAX_SAFE_INTEGER))).then((t=>(Ah(n,e,t),t)))}function Ah(t,e,n){let s=t.Ki.get(e)||or.min();n.forEach(((t,e)=>{e.readTime.compareTo(s)>0&&(s=e.readTime);})),t.Ki.set(e,s);}async function Dh(t,e,n=fa()){const s=await bh(t,co(Ku(e.bundledQuery))),r=qs(t);return r.persistence.runTransaction("Save named query","readwrite",(t=>{const i=ka(e.readTime);if(s.snapshotVersion.compareTo(i)>=0)return r.Ns.saveNamedQuery(t,e);const o=s.withResumeToken(Yr.EMPTY_BYTE_STRING,i);return r.Ui=r.Ui.insert(o.targetId,o),r.Cs.updateTargetData(t,o).next((()=>r.Cs.removeMatchingKeysForTargetId(t,s.targetId))).next((()=>r.Cs.addMatchingKeys(t,n,s.targetId))).next((()=>r.Ns.saveNamedQuery(t,e)))}))}function xh(t,e){return `firestore_clients_${t}_${e}`}function Ch(t,e,n){let s=`firestore_mutations_${t}_${n}`;return e.isAuthenticated()&&(s+=`_${e.uid}`),s}function Nh(t,e){return `firestore_targets_${t}_${e}`}class kh{constructor(t,e,n,s){this.user=t,this.batchId=e,this.state=n,this.error=s;}static Zi(t,e,n){const s=JSON.parse(n);let r,i="object"==typeof s&&-1!==["pending","acknowledged","rejected"].indexOf(s.state)&&(void 0===s.error||"object"==typeof s.error);return i&&s.error&&(i="string"==typeof s.error.message&&"string"==typeof s.error.code,i&&(r=new Ks(s.error.code,s.error.message))),i?new kh(t,e,s.state,r):(Os("SharedClientState",`Failed to parse mutation state for ID '${e}': ${n}`),null)}tr(){const t={state:this.state,updateTimeMs:Date.now()};return this.error&&(t.error={code:this.error.code,message:this.error.message}),JSON.stringify(t)}}class Rh{constructor(t,e,n){this.targetId=t,this.state=e,this.error=n;}static Zi(t,e){const n=JSON.parse(e);let s,r="object"==typeof n&&-1!==["not-current","current","rejected"].indexOf(n.state)&&(void 0===n.error||"object"==typeof n.error);return r&&n.error&&(r="string"==typeof n.error.message&&"string"==typeof n.error.code,r&&(s=new Ks(n.error.code,n.error.message))),r?new Rh(t,n.state,s):(Os("SharedClientState",`Failed to parse target state for ID '${t}': ${e}`),null)}tr(){const t={state:this.state,updateTimeMs:Date.now()};return this.error&&(t.error={code:this.error.code,message:this.error.message}),JSON.stringify(t)}}class Lh{constructor(t,e){this.clientId=t,this.activeTargetIds=e;}static Zi(t,e){const n=JSON.parse(e);let s="object"==typeof n&&n.activeTargetIds instanceof Array,r=ga();for(let t=0;s&&t<n.activeTargetIds.length;++t)s=ui(n.activeTargetIds[t]),r=r.add(n.activeTargetIds[t]);return s?new Lh(t,r):(Os("SharedClientState",`Failed to parse client data for instance '${t}': ${e}`),null)}}class Mh{constructor(t,e){this.clientId=t,this.onlineState=e;}static Zi(t){const e=JSON.parse(t);return "object"==typeof e&&-1!==["Unknown","Online","Offline"].indexOf(e.onlineState)&&"string"==typeof e.clientId?new Mh(e.clientId,e.onlineState):(Os("SharedClientState",`Failed to parse online state: ${t}`),null)}}class Oh{constructor(){this.activeTargetIds=ga();}er(t){this.activeTargetIds=this.activeTargetIds.add(t);}nr(t){this.activeTargetIds=this.activeTargetIds.delete(t);}tr(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class Vh{constructor(t,e,n,s,r){this.window=t,this.Hs=e,this.persistenceKey=n,this.sr=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.ir=this.rr.bind(this),this.ur=new Gr(nr),this.started=!1,this.cr=[];const i=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=r,this.ar=xh(this.persistenceKey,this.sr),this.hr=function(t){return `firestore_sequence_number_${t}`}(this.persistenceKey),this.ur=this.ur.insert(this.sr,new Oh),this.lr=new RegExp(`^firestore_clients_${i}_([^_]*)$`),this.dr=new RegExp(`^firestore_mutations_${i}_(\\d+)(?:_(.*))?$`),this._r=new RegExp(`^firestore_targets_${i}_(\\d+)$`),this.wr=function(t){return `firestore_online_state_${t}`}(this.persistenceKey),this.mr=function(t){return `firestore_bundle_loaded_v2_${t}`}(this.persistenceKey),this.window.addEventListener("storage",this.ir);}static C(t){return !(!t||!t.localStorage)}async start(){const t=await this.syncEngine.vi();for(const e of t){if(e===this.sr)continue;const t=this.getItem(xh(this.persistenceKey,e));if(t){const n=Lh.Zi(e,t);n&&(this.ur=this.ur.insert(n.clientId,n));}}this.gr();const e=this.storage.getItem(this.wr);if(e){const t=this.yr(e);t&&this.pr(t);}for(const t of this.cr)this.rr(t);this.cr=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0;}writeSequenceNumber(t){this.setItem(this.hr,JSON.stringify(t));}getAllActiveQueryTargets(){return this.Ir(this.ur)}isActiveQueryTarget(t){let e=!1;return this.ur.forEach(((n,s)=>{s.activeTargetIds.has(t)&&(e=!0);})),e}addPendingMutation(t){this.Tr(t,"pending");}updateMutationState(t,e,n){this.Tr(t,e,n),this.Er(t);}addLocalQueryTarget(t){let e="not-current";if(this.isActiveQueryTarget(t)){const n=this.storage.getItem(Nh(this.persistenceKey,t));if(n){const s=Rh.Zi(t,n);s&&(e=s.state);}}return this.Ar.er(t),this.gr(),e}removeLocalQueryTarget(t){this.Ar.nr(t),this.gr();}isLocalQueryTarget(t){return this.Ar.activeTargetIds.has(t)}clearQueryState(t){this.removeItem(Nh(this.persistenceKey,t));}updateQueryState(t,e,n){this.Rr(t,e,n);}handleUserChange(t,e,n){e.forEach((t=>{this.Er(t);})),this.currentUser=t,n.forEach((t=>{this.addPendingMutation(t);}));}setOnlineState(t){this.br(t);}notifyBundleLoaded(t){this.Pr(t);}shutdown(){this.started&&(this.window.removeEventListener("storage",this.ir),this.removeItem(this.ar),this.started=!1);}getItem(t){const e=this.storage.getItem(t);return Ms("SharedClientState","READ",t,e),e}setItem(t,e){Ms("SharedClientState","SET",t,e),this.storage.setItem(t,e);}removeItem(t){Ms("SharedClientState","REMOVE",t),this.storage.removeItem(t);}rr(t){const e=t;if(e.storageArea===this.storage){if(Ms("SharedClientState","EVENT",e.key,e.newValue),e.key===this.ar)return void Os("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Hs.enqueueRetryable((async()=>{if(this.started){if(null!==e.key)if(this.lr.test(e.key)){if(null==e.newValue){const t=this.vr(e.key);return this.Vr(t,null)}{const t=this.Sr(e.key,e.newValue);if(t)return this.Vr(t.clientId,t)}}else if(this.dr.test(e.key)){if(null!==e.newValue){const t=this.Dr(e.key,e.newValue);if(t)return this.Cr(t)}}else if(this._r.test(e.key)){if(null!==e.newValue){const t=this.Nr(e.key,e.newValue);if(t)return this.kr(t)}}else if(e.key===this.wr){if(null!==e.newValue){const t=this.yr(e.newValue);if(t)return this.pr(t)}}else if(e.key===this.hr){const t=function(t){let e=Pr.at;if(null!=t)try{const n=JSON.parse(t);Us("number"==typeof n),e=n;}catch(t){Os("SharedClientState","Failed to read sequence number from WebStorage",t);}return e}(e.newValue);t!==Pr.at&&this.sequenceNumberHandler(t);}else if(e.key===this.mr){const t=this.Or(e.newValue);await Promise.all(t.map((t=>this.syncEngine.Mr(t))));}}else this.cr.push(e);}));}}get Ar(){return this.ur.get(this.sr)}gr(){this.setItem(this.ar,this.Ar.tr());}Tr(t,e,n){const s=new kh(this.currentUser,t,e,n),r=Ch(this.persistenceKey,this.currentUser,t);this.setItem(r,s.tr());}Er(t){const e=Ch(this.persistenceKey,this.currentUser,t);this.removeItem(e);}br(t){const e={clientId:this.sr,onlineState:t};this.storage.setItem(this.wr,JSON.stringify(e));}Rr(t,e,n){const s=Nh(this.persistenceKey,t),r=new Rh(t,e,n);this.setItem(s,r.tr());}Pr(t){const e=JSON.stringify(Array.from(t));this.setItem(this.mr,e);}vr(t){const e=this.lr.exec(t);return e?e[1]:null}Sr(t,e){const n=this.vr(t);return Lh.Zi(n,e)}Dr(t,e){const n=this.dr.exec(t),s=Number(n[1]),r=void 0!==n[2]?n[2]:null;return kh.Zi(new Cs(r),s,e)}Nr(t,e){const n=this._r.exec(t),s=Number(n[1]);return Rh.Zi(s,e)}yr(t){return Mh.Zi(t)}Or(t){return JSON.parse(t)}async Cr(t){if(t.user.uid===this.currentUser.uid)return this.syncEngine.Fr(t.batchId,t.state,t.error);Ms("SharedClientState",`Ignoring mutation for non-active user ${t.user.uid}`);}kr(t){return this.syncEngine.$r(t.targetId,t.state,t.error)}Vr(t,e){const n=e?this.ur.insert(t,e):this.ur.remove(t),s=this.Ir(this.ur),r=this.Ir(n),i=[],o=[];return r.forEach((t=>{s.has(t)||i.push(t);})),s.forEach((t=>{r.has(t)||o.push(t);})),this.syncEngine.Br(i,o).then((()=>{this.ur=n;}))}pr(t){this.ur.get(t.clientId)&&this.onlineStateHandler(t.onlineState);}Ir(t){let e=ga();return t.forEach(((t,n)=>{e=e.unionWith(n.activeTargetIds);})),e}}class Fh{constructor(){this.Lr=new Oh,this.Ur={},this.onlineStateHandler=null,this.sequenceNumberHandler=null;}addPendingMutation(t){}updateMutationState(t,e,n){}addLocalQueryTarget(t){return this.Lr.er(t),this.Ur[t]||"not-current"}updateQueryState(t,e,n){this.Ur[t]=e;}removeLocalQueryTarget(t){this.Lr.nr(t);}isLocalQueryTarget(t){return this.Lr.activeTargetIds.has(t)}clearQueryState(t){delete this.Ur[t];}getAllActiveQueryTargets(){return this.Lr.activeTargetIds}isActiveQueryTarget(t){return this.Lr.activeTargetIds.has(t)}start(){return this.Lr=new Oh,Promise.resolve()}handleUserChange(t,e,n){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}class Ph{qr(t){}shutdown(){}}class Uh{constructor(){this.Kr=()=>this.Gr(),this.Qr=()=>this.jr(),this.Wr=[],this.zr();}qr(t){this.Wr.push(t);}shutdown(){window.removeEventListener("online",this.Kr),window.removeEventListener("offline",this.Qr);}zr(){window.addEventListener("online",this.Kr),window.addEventListener("offline",this.Qr);}Gr(){Ms("ConnectivityMonitor","Network connectivity changed: AVAILABLE");for(const t of this.Wr)t(0);}jr(){Ms("ConnectivityMonitor","Network connectivity changed: UNAVAILABLE");for(const t of this.Wr)t(1);}static C(){return "undefined"!=typeof window&&void 0!==window.addEventListener&&void 0!==window.removeEventListener}}const Bh={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class qh{constructor(t){this.Hr=t.Hr,this.Jr=t.Jr;}Yr(t){this.Xr=t;}Zr(t){this.eo=t;}onMessage(t){this.no=t;}close(){this.Jr();}send(t){this.Hr(t);}so(){this.Xr();}io(t){this.eo(t);}ro(t){this.no(t);}}class Gh extends class{constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http";this.oo=e+"://"+t.host,this.uo="projects/"+this.databaseId.projectId+"/databases/"+this.databaseId.database+"/documents";}get co(){return !1}ao(t,e,n,s,r){const i=this.ho(t,e);Ms("RestConnection","Sending: ",i,n);const o={};return this.lo(o,s,r),this.fo(t,i,o,n).then((t=>(Ms("RestConnection","Received: ",t),t)),(e=>{throw Vs("RestConnection",`${t} failed with error: `,e,"url: ",i,"request:",n),e}))}_o(t,e,n,s,r,i){return this.ao(t,e,n,s,r)}lo(t,e,n){t["X-Goog-Api-Client"]="gl-js/ fire/"+Ns,t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach(((e,n)=>t[n]=e)),n&&n.headers.forEach(((e,n)=>t[n]=e));}ho(t,e){const n=Bh[t];return `${this.oo}/v1/${e}:${n}`}}{constructor(t){super(t),this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams;}fo(t,e,n,s){return new Promise(((r,i)=>{const o=new Ds;o.listenOnce(bs.COMPLETE,(()=>{try{switch(o.getLastErrorCode()){case Is.NO_ERROR:const e=o.getResponseJson();Ms("Connection","XHR received:",JSON.stringify(e)),r(e);break;case Is.TIMEOUT:Ms("Connection",'RPC "'+t+'" timed out'),i(new Ks(Gs.DEADLINE_EXCEEDED,"Request time out"));break;case Is.HTTP_ERROR:const n=o.getStatus();if(Ms("Connection",'RPC "'+t+'" failed with status:',n,"response text:",o.getResponseText()),n>0){const t=o.getResponseJson().error;if(t&&t.status&&t.message){const e=function(t){const e=t.toLowerCase().replace(/_/g,"-");return Object.values(Gs).indexOf(e)>=0?e:Gs.UNKNOWN}(t.status);i(new Ks(e,t.message));}else i(new Ks(Gs.UNKNOWN,"Server responded with status "+o.getStatus()));}else i(new Ks(Gs.UNAVAILABLE,"Connection failed."));break;default:Ps();}}finally{Ms("Connection",'RPC "'+t+'" completed.');}}));const a=JSON.stringify(s);o.send(e,"POST",a,n,15);}))}wo(t,e,n){const s=[this.oo,"/","google.firestore.v1.Firestore","/",t,"/channel"],r=new gs,i=fe(),o={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling};this.useFetchStreams&&(o.xmlHttpFactory=new _s({})),this.lo(o.initMessageHeaders,e,n),o.encodeInitMessageHeaders=!0;const a=s.join("");Ms("Connection","Creating WebChannel: "+a,o);const u=r.createWebChannel(a,o);let c=!1,h=!1;const l=new qh({Hr:t=>{h?Ms("Connection","Not sending because WebChannel is closed:",t):(c||(Ms("Connection","Opening WebChannel transport."),u.open(),c=!0),Ms("Connection","WebChannel sending:",t),u.send(t));},Jr:()=>u.close()}),d=(t,e,n)=>{t.listen(e,(t=>{try{n(t);}catch(t){setTimeout((()=>{throw t}),0);}}));};return d(u,As.EventType.OPEN,(()=>{h||Ms("Connection","WebChannel transport opened.");})),d(u,As.EventType.CLOSE,(()=>{h||(h=!0,Ms("Connection","WebChannel transport closed"),l.io());})),d(u,As.EventType.ERROR,(t=>{h||(h=!0,Vs("Connection","WebChannel transport errored:",t),l.io(new Ks(Gs.UNAVAILABLE,"The operation could not be completed")));})),d(u,As.EventType.MESSAGE,(t=>{var e;if(!h){const n=t.data[0];Us(!!n);const s=n,r=s.error||(null===(e=s[0])||void 0===e?void 0:e.error);if(r){Ms("Connection","WebChannel received error:",r);const t=r.status;let e=function(t){const e=Jo[t];if(void 0!==e)return ea(e)}(t),n=r.message;void 0===e&&(e=Gs.INTERNAL,n="Unknown error status: "+t+" with message "+r.message),h=!0,l.io(new Ks(e,n)),u.close();}else Ms("Connection","WebChannel received:",n),l.ro(n);}})),d(i,Es.STAT_EVENT,(t=>{t.stat===Ts?Ms("Connection","Detected buffering proxy"):t.stat===Ss&&Ms("Connection","Detected no buffering proxy");})),setTimeout((()=>{l.so();}),0),l}}function Kh(){return "undefined"!=typeof window?window:null}function jh(){return "undefined"!=typeof document?document:null}function $h(t){return new Da(t,!0)}class Qh{constructor(t,e,n=1e3,s=1.5,r=6e4){this.Hs=t,this.timerId=e,this.mo=n,this.yo=s,this.po=r,this.Io=0,this.To=null,this.Eo=Date.now(),this.reset();}reset(){this.Io=0;}Ao(){this.Io=this.po;}Ro(t){this.cancel();const e=Math.floor(this.Io+this.bo()),n=Math.max(0,Date.now()-this.Eo),s=Math.max(0,e-n);s>0&&Ms("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Io} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`),this.To=this.Hs.enqueueAfterDelay(this.timerId,s,(()=>(this.Eo=Date.now(),t()))),this.Io*=this.yo,this.Io<this.mo&&(this.Io=this.mo),this.Io>this.po&&(this.Io=this.po);}Po(){null!==this.To&&(this.To.skipDelay(),this.To=null);}cancel(){null!==this.To&&(this.To.cancel(),this.To=null);}bo(){return (Math.random()-.5)*this.Io}}class zh{constructor(t,e,n,s,r,i,o,a){this.Hs=t,this.vo=n,this.Vo=s,this.So=r,this.authCredentialsProvider=i,this.appCheckCredentialsProvider=o,this.listener=a,this.state=0,this.Do=0,this.Co=null,this.xo=null,this.stream=null,this.No=new Qh(t,e);}ko(){return 1===this.state||5===this.state||this.Oo()}Oo(){return 2===this.state||3===this.state}start(){4!==this.state?this.auth():this.Mo();}async stop(){this.ko()&&await this.close(0);}Fo(){this.state=0,this.No.reset();}$o(){this.Oo()&&null===this.Co&&(this.Co=this.Hs.enqueueAfterDelay(this.vo,6e4,(()=>this.Bo())));}Lo(t){this.Uo(),this.stream.send(t);}async Bo(){if(this.Oo())return this.close(0)}Uo(){this.Co&&(this.Co.cancel(),this.Co=null);}qo(){this.xo&&(this.xo.cancel(),this.xo=null);}async close(t,e){this.Uo(),this.qo(),this.No.cancel(),this.Do++,4!==t?this.No.reset():e&&e.code===Gs.RESOURCE_EXHAUSTED?(Os(e.toString()),Os("Using maximum backoff delay to prevent overloading the backend."),this.No.Ao()):e&&e.code===Gs.UNAUTHENTICATED&&3!==this.state&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),null!==this.stream&&(this.Ko(),this.stream.close(),this.stream=null),this.state=t,await this.listener.Zr(e);}Ko(){}auth(){this.state=1;const t=this.Go(this.Do),e=this.Do;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([t,n])=>{this.Do===e&&this.Qo(t,n);}),(e=>{t((()=>{const t=new Ks(Gs.UNKNOWN,"Fetching auth token failed: "+e.message);return this.jo(t)}));}));}Qo(t,e){const n=this.Go(this.Do);this.stream=this.Wo(t,e),this.stream.Yr((()=>{n((()=>(this.state=2,this.xo=this.Hs.enqueueAfterDelay(this.Vo,1e4,(()=>(this.Oo()&&(this.state=3),Promise.resolve()))),this.listener.Yr())));})),this.stream.Zr((t=>{n((()=>this.jo(t)));})),this.stream.onMessage((t=>{n((()=>this.onMessage(t)));}));}Mo(){this.state=5,this.No.Ro((async()=>{this.state=0,this.start();}));}jo(t){return Ms("PersistentStream",`close with error: ${t}`),this.stream=null,this.close(4,t)}Go(t){return e=>{this.Hs.enqueueAndForget((()=>this.Do===t?e():(Ms("PersistentStream","stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())));}}}class Hh extends zh{constructor(t,e,n,s,r,i){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,n,s,i),this.It=r;}Wo(t,e){return this.So.wo("Listen",t,e)}onMessage(t){this.No.reset();const e=function(t,e){let n;if("targetChange"in e){e.targetChange;const s=function(t){return "NO_CHANGE"===t?0:"ADD"===t?1:"REMOVE"===t?2:"CURRENT"===t?3:"RESET"===t?4:Ps()}(e.targetChange.targetChangeType||"NO_CHANGE"),r=e.targetChange.targetIds||[],i=function(t,e){return t.gt?(Us(void 0===e||"string"==typeof e),Yr.fromBase64String(e||"")):(Us(void 0===e||e instanceof Uint8Array),Yr.fromUint8Array(e||new Uint8Array))}(t,e.targetChange.resumeToken),o=e.targetChange.cause,a=o&&function(t){const e=void 0===t.code?Gs.UNKNOWN:ea(t.code);return new Ks(e,t.message||"")}(o);n=new Ia(s,r,i,a||null);}else if("documentChange"in e){e.documentChange;const s=e.documentChange;s.document,s.document.name,s.document.updateTime;const r=Oa(t,s.document.name),i=ka(s.document.updateTime),o=new Ni({mapValue:{fields:s.document.fields}}),a=Ri.newFoundDocument(r,i,o),u=s.targetIds||[],c=s.removedTargetIds||[];n=new wa(u,c,a.key,a);}else if("documentDelete"in e){e.documentDelete;const s=e.documentDelete;s.document;const r=Oa(t,s.document),i=s.readTime?ka(s.readTime):or.min(),o=Ri.newNoDocument(r,i),a=s.removedTargetIds||[];n=new wa([],a,o.key,o);}else if("documentRemove"in e){e.documentRemove;const s=e.documentRemove;s.document;const r=Oa(t,s.document),i=s.removedTargetIds||[];n=new wa([],i,r,null);}else {if(!("filter"in e))return Ps();{e.filter;const t=e.filter;t.targetId;const s=t.count||0,r=new Xo(s),i=t.targetId;n=new va(i,r);}}return n}(this.It,t),n=function(t){if(!("targetChange"in t))return or.min();const e=t.targetChange;return e.targetIds&&e.targetIds.length?or.min():e.readTime?ka(e.readTime):or.min()}(t);return this.listener.zo(e,n)}Ho(t){const e={};e.database=Pa(this.It),e.addTarget=function(t,e){let n;const s=e.target;return n=Fi(s)?{documents:ja(t,s)}:{query:$a(t,s)},n.targetId=e.targetId,e.resumeToken.approximateByteSize()>0?n.resumeToken=Ca(t,e.resumeToken):e.snapshotVersion.compareTo(or.min())>0&&(n.readTime=xa(t,e.snapshotVersion.toTimestamp())),n}(this.It,t);const n=function(t,e){const n=function(t,e){switch(e){case 0:return null;case 1:return "existence-filter-mismatch";case 2:return "limbo-document";default:return Ps()}}(0,e.purpose);return null==n?null:{"goog-listen-tags":n}}(this.It,t);n&&(e.labels=n),this.Lo(e);}Jo(t){const e={};e.database=Pa(this.It),e.removeTarget=t,this.Lo(e);}}class Wh extends zh{constructor(t,e,n,s,r,i){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,n,s,i),this.It=r,this.Yo=!1;}get Xo(){return this.Yo}start(){this.Yo=!1,this.lastStreamToken=void 0,super.start();}Ko(){this.Yo&&this.Zo([]);}Wo(t,e){return this.So.wo("Write",t,e)}onMessage(t){if(Us(!!t.streamToken),this.lastStreamToken=t.streamToken,this.Yo){this.No.reset();const e=function(t,e){return t&&t.length>0?(Us(void 0!==e),t.map((t=>function(t,e){let n=t.updateTime?ka(t.updateTime):ka(e);return n.isEqual(or.min())&&(n=ka(e)),new Oo(n,t.transformResults||[])}(t,e)))):[]}(t.writeResults,t.commitTime),n=ka(t.commitTime);return this.listener.tu(n,e)}return Us(!t.writeResults||0===t.writeResults.length),this.Yo=!0,this.listener.eu()}nu(){const t={};t.database=Pa(this.It),this.Lo(t);}Zo(t){const e={streamToken:this.lastStreamToken,writes:t.map((t=>Ga(this.It,t)))};this.Lo(e);}}class Yh extends class{}{constructor(t,e,n,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.So=n,this.It=s,this.su=!1;}iu(){if(this.su)throw new Ks(Gs.FAILED_PRECONDITION,"The client has already been terminated.")}ao(t,e,n){return this.iu(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([s,r])=>this.So.ao(t,e,n,s,r))).catch((t=>{throw "FirebaseError"===t.name?(t.code===Gs.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),t):new Ks(Gs.UNKNOWN,t.toString())}))}_o(t,e,n,s){return this.iu(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([r,i])=>this.So._o(t,e,n,r,i,s))).catch((t=>{throw "FirebaseError"===t.name?(t.code===Gs.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),t):new Ks(Gs.UNKNOWN,t.toString())}))}terminate(){this.su=!0;}}class Xh{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.ru=0,this.ou=null,this.uu=!0;}cu(){0===this.ru&&(this.au("Unknown"),this.ou=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.ou=null,this.hu("Backend didn't respond within 10 seconds."),this.au("Offline"),Promise.resolve()))));}lu(t){"Online"===this.state?this.au("Unknown"):(this.ru++,this.ru>=1&&(this.fu(),this.hu(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.au("Offline")));}set(t){this.fu(),this.ru=0,"Online"===t&&(this.uu=!1),this.au(t);}au(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t));}hu(t){const e=`Could not reach Cloud Firestore backend. ${t}\nThis typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.uu?(Os(e),this.uu=!1):Ms("OnlineStateTracker",e);}fu(){null!==this.ou&&(this.ou.cancel(),this.ou=null);}}class Jh{constructor(t,e,n,s,r){this.localStore=t,this.datastore=e,this.asyncQueue=n,this.remoteSyncer={},this.du=[],this._u=new Map,this.wu=new Set,this.mu=[],this.gu=r,this.gu.qr((t=>{n.enqueueAndForget((async()=>{al(this)&&(Ms("RemoteStore","Restarting streams for network reachability change."),await async function(t){const e=qs(t);e.wu.add(4),await tl(e),e.yu.set("Unknown"),e.wu.delete(4),await Zh(e);}(this));}));})),this.yu=new Xh(n,s);}}async function Zh(t){if(al(t))for(const e of t.mu)await e(!0);}async function tl(t){for(const e of t.mu)await e(!1);}function el(t,e){const n=qs(t);n._u.has(e.targetId)||(n._u.set(e.targetId,e),ol(n)?il(n):_l(n).Oo()&&sl(n,e));}function nl(t,e){const n=qs(t),s=_l(n);n._u.delete(e),s.Oo()&&rl(n,e),0===n._u.size&&(s.Oo()?s.$o():al(n)&&n.yu.set("Unknown"));}function sl(t,e){t.pu.Mt(e.targetId),_l(t).Ho(e);}function rl(t,e){t.pu.Mt(e),_l(t).Jo(e);}function il(t){t.pu=new Ea({getRemoteKeysForTarget:e=>t.remoteSyncer.getRemoteKeysForTarget(e),se:e=>t._u.get(e)||null}),_l(t).start(),t.yu.cu();}function ol(t){return al(t)&&!_l(t).ko()&&t._u.size>0}function al(t){return 0===qs(t).wu.size}function ul(t){t.pu=void 0;}async function cl(t){t._u.forEach(((e,n)=>{sl(t,e);}));}async function hl(t,e){ul(t),ol(t)?(t.yu.lu(e),il(t)):t.yu.set("Unknown");}async function ll(t,e,n){if(t.yu.set("Online"),e instanceof Ia&&2===e.state&&e.cause)try{await async function(t,e){const n=e.cause;for(const s of e.targetIds)t._u.has(s)&&(await t.remoteSyncer.rejectListen(s,n),t._u.delete(s),t.pu.removeTarget(s));}(t,e);}catch(n){Ms("RemoteStore","Failed to remove targets %s: %s ",e.targetIds.join(","),n),await dl(t,n);}else if(e instanceof wa?t.pu.Gt(e):e instanceof va?t.pu.Yt(e):t.pu.Wt(e),!n.isEqual(or.min()))try{const e=await wh(t.localStore);n.compareTo(e)>=0&&await function(t,e){const n=t.pu.te(e);return n.targetChanges.forEach(((n,s)=>{if(n.resumeToken.approximateByteSize()>0){const r=t._u.get(s);r&&t._u.set(s,r.withResumeToken(n.resumeToken,e));}})),n.targetMismatches.forEach((e=>{const n=t._u.get(e);if(!n)return;t._u.set(e,n.withResumeToken(Yr.EMPTY_BYTE_STRING,n.snapshotVersion)),rl(t,e);const s=new Mu(n.target,e,1,n.sequenceNumber);sl(t,s);})),t.remoteSyncer.applyRemoteEvent(n)}(t,n);}catch(e){Ms("RemoteStore","Failed to raise snapshot:",e),await dl(t,e);}}async function dl(t,e,n){if(!kr(e))throw e;t.wu.add(1),await tl(t),t.yu.set("Offline"),n||(n=()=>wh(t.localStore)),t.asyncQueue.enqueueRetryable((async()=>{Ms("RemoteStore","Retrying IndexedDB access"),await n(),t.wu.delete(1),await Zh(t);}));}function fl(t,e){return e().catch((n=>dl(t,n,e)))}async function ml(t){const e=qs(t),n=Al(e);let s=e.du.length>0?e.du[e.du.length-1].batchId:-1;for(;gl(e);)try{const t=await Ih(e.localStore,s);if(null===t){0===e.du.length&&n.$o();break}s=t.batchId,pl(e,t);}catch(t){await dl(e,t);}yl(e)&&wl(e);}function gl(t){return al(t)&&t.du.length<10}function pl(t,e){t.du.push(e);const n=Al(t);n.Oo()&&n.Xo&&n.Zo(e.mutations);}function yl(t){return al(t)&&!Al(t).ko()&&t.du.length>0}function wl(t){Al(t).start();}async function vl(t){Al(t).nu();}async function Il(t){const e=Al(t);for(const n of t.du)e.Zo(n.mutations);}async function bl(t,e,n){const s=t.du.shift(),r=Ru.from(s,e,n);await fl(t,(()=>t.remoteSyncer.applySuccessfulWrite(r))),await ml(t);}async function El(t,e){e&&Al(t).Xo&&await async function(t,e){if(ta(n=e.code)&&n!==Gs.ABORTED){const n=t.du.shift();Al(t).Fo(),await fl(t,(()=>t.remoteSyncer.rejectFailedWrite(n.batchId,e))),await ml(t);}var n;}(t,e),yl(t)&&wl(t);}async function Tl(t,e){const n=qs(t);n.asyncQueue.verifyOperationInProgress(),Ms("RemoteStore","RemoteStore received new credentials");const s=al(n);n.wu.add(3),await tl(n),s&&n.yu.set("Unknown"),await n.remoteSyncer.handleCredentialChange(e),n.wu.delete(3),await Zh(n);}async function Sl(t,e){const n=qs(t);e?(n.wu.delete(2),await Zh(n)):e||(n.wu.add(2),await tl(n),n.yu.set("Unknown"));}function _l(t){return t.Iu||(t.Iu=function(t,e,n){const s=qs(t);return s.iu(),new Hh(e,s.So,s.authCredentials,s.appCheckCredentials,s.It,n)}(t.datastore,t.asyncQueue,{Yr:cl.bind(null,t),Zr:hl.bind(null,t),zo:ll.bind(null,t)}),t.mu.push((async e=>{e?(t.Iu.Fo(),ol(t)?il(t):t.yu.set("Unknown")):(await t.Iu.stop(),ul(t));}))),t.Iu}function Al(t){return t.Tu||(t.Tu=function(t,e,n){const s=qs(t);return s.iu(),new Wh(e,s.So,s.authCredentials,s.appCheckCredentials,s.It,n)}(t.datastore,t.asyncQueue,{Yr:vl.bind(null,t),Zr:El.bind(null,t),eu:Il.bind(null,t),tu:bl.bind(null,t)}),t.mu.push((async e=>{e?(t.Tu.Fo(),await ml(t)):(await t.Tu.stop(),t.du.length>0&&(Ms("RemoteStore",`Stopping write stream with ${t.du.length} pending writes`),t.du=[]));}))),t.Tu}class Dl{constructor(t,e,n,s,r){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=n,this.op=s,this.removalCallback=r,this.deferred=new js,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((t=>{}));}static createAndSchedule(t,e,n,s,r){const i=Date.now()+n,o=new Dl(t,e,i,s,r);return o.start(n),o}start(t){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),t);}skipDelay(){return this.handleDelayElapsed()}cancel(t){null!==this.timerHandle&&(this.clearTimeout(),this.deferred.reject(new Ks(Gs.CANCELLED,"Operation cancelled"+(t?": "+t:""))));}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>null!==this.timerHandle?(this.clearTimeout(),this.op().then((t=>this.deferred.resolve(t)))):Promise.resolve()));}clearTimeout(){null!==this.timerHandle&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null);}}function xl(t,e){if(Os("AsyncQueue",`${e}: ${t}`),kr(t))return new Ks(Gs.UNAVAILABLE,`${e}: ${t}`);throw t}class Cl{constructor(t){this.comparator=t?(e,n)=>t(e,n)||lr.comparator(e.key,n.key):(t,e)=>lr.comparator(t.key,e.key),this.keyedMap=oa(),this.sortedSet=new Gr(this.comparator);}static emptySet(t){return new Cl(t.comparator)}has(t){return null!=this.keyedMap.get(t)}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal(((e,n)=>(t(e),!1)));}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof Cl))return !1;if(this.size!==t.size)return !1;const e=this.sortedSet.getIterator(),n=t.sortedSet.getIterator();for(;e.hasNext();){const t=e.getNext().key,s=n.getNext().key;if(!t.isEqual(s))return !1}return !0}toString(){const t=[];return this.forEach((e=>{t.push(e.toString());})),0===t.length?"DocumentSet ()":"DocumentSet (\n  "+t.join("  \n")+"\n)"}copy(t,e){const n=new Cl;return n.comparator=this.comparator,n.keyedMap=t,n.sortedSet=e,n}}class Nl{constructor(){this.Eu=new Gr(lr.comparator);}track(t){const e=t.doc.key,n=this.Eu.get(e);n?0!==t.type&&3===n.type?this.Eu=this.Eu.insert(e,t):3===t.type&&1!==n.type?this.Eu=this.Eu.insert(e,{type:n.type,doc:t.doc}):2===t.type&&2===n.type?this.Eu=this.Eu.insert(e,{type:2,doc:t.doc}):2===t.type&&0===n.type?this.Eu=this.Eu.insert(e,{type:0,doc:t.doc}):1===t.type&&0===n.type?this.Eu=this.Eu.remove(e):1===t.type&&2===n.type?this.Eu=this.Eu.insert(e,{type:1,doc:n.doc}):0===t.type&&1===n.type?this.Eu=this.Eu.insert(e,{type:2,doc:t.doc}):Ps():this.Eu=this.Eu.insert(e,t);}Au(){const t=[];return this.Eu.inorderTraversal(((e,n)=>{t.push(n);})),t}}class kl{constructor(t,e,n,s,r,i,o,a){this.query=t,this.docs=e,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=r,this.fromCache=i,this.syncStateChanged=o,this.excludesMetadataChanges=a;}static fromInitialDocuments(t,e,n,s){const r=[];return e.forEach((t=>{r.push({type:0,doc:t});})),new kl(t,e,Cl.emptySet(e),r,n,s,!0,!1)}get hasPendingWrites(){return !this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&lo(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return !1;const e=this.docChanges,n=t.docChanges;if(e.length!==n.length)return !1;for(let t=0;t<e.length;t++)if(e[t].type!==n[t].type||!e[t].doc.isEqual(n[t].doc))return !1;return !0}}class Rl{constructor(){this.Ru=void 0,this.listeners=[];}}class Ll{constructor(){this.queries=new na((t=>fo(t)),lo),this.onlineState="Unknown",this.bu=new Set;}}async function Ml(t,e){const n=qs(t),s=e.query;let r=!1,i=n.queries.get(s);if(i||(r=!0,i=new Rl),r)try{i.Ru=await n.onListen(s);}catch(t){const n=xl(t,`Initialization of query '${mo(e.query)}' failed`);return void e.onError(n)}n.queries.set(s,i),i.listeners.push(e),e.Pu(n.onlineState),i.Ru&&e.vu(i.Ru)&&Pl(n);}async function Ol(t,e){const n=qs(t),s=e.query;let r=!1;const i=n.queries.get(s);if(i){const t=i.listeners.indexOf(e);t>=0&&(i.listeners.splice(t,1),r=0===i.listeners.length);}if(r)return n.queries.delete(s),n.onUnlisten(s)}function Vl(t,e){const n=qs(t);let s=!1;for(const t of e){const e=t.query,r=n.queries.get(e);if(r){for(const e of r.listeners)e.vu(t)&&(s=!0);r.Ru=t;}}s&&Pl(n);}function Fl(t,e,n){const s=qs(t),r=s.queries.get(e);if(r)for(const t of r.listeners)t.onError(n);s.queries.delete(e);}function Pl(t){t.bu.forEach((t=>{t.next();}));}class Ul{constructor(t,e,n){this.query=t,this.Vu=e,this.Su=!1,this.Du=null,this.onlineState="Unknown",this.options=n||{};}vu(t){if(!this.options.includeMetadataChanges){const e=[];for(const n of t.docChanges)3!==n.type&&e.push(n);t=new kl(t.query,t.docs,t.oldDocs,e,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0);}let e=!1;return this.Su?this.Cu(t)&&(this.Vu.next(t),e=!0):this.xu(t,this.onlineState)&&(this.Nu(t),e=!0),this.Du=t,e}onError(t){this.Vu.error(t);}Pu(t){this.onlineState=t;let e=!1;return this.Du&&!this.Su&&this.xu(this.Du,t)&&(this.Nu(this.Du),e=!0),e}xu(t,e){if(!t.fromCache)return !0;const n="Offline"!==e;return !(this.options.ku&&n||t.docs.isEmpty()&&"Offline"!==e)}Cu(t){if(t.docChanges.length>0)return !0;const e=this.Du&&this.Du.hasPendingWrites!==t.hasPendingWrites;return !(!t.syncStateChanged&&!e)&&!0===this.options.includeMetadataChanges}Nu(t){t=kl.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache),this.Su=!0,this.Vu.next(t);}}class Bl{constructor(t,e){this.payload=t,this.byteLength=e;}Ou(){return "metadata"in this.payload}}class ql{constructor(t){this.It=t;}Ji(t){return Oa(this.It,t)}Yi(t){return t.metadata.exists?qa(this.It,t.document,!1):Ri.newNoDocument(this.Ji(t.metadata.name),this.Xi(t.metadata.readTime))}Xi(t){return ka(t)}}class Gl{constructor(t,e,n){this.Mu=t,this.localStore=e,this.It=n,this.queries=[],this.documents=[],this.collectionGroups=new Set,this.progress=Kl(t);}Fu(t){this.progress.bytesLoaded+=t.byteLength;let e=this.progress.documentsLoaded;if(t.payload.namedQuery)this.queries.push(t.payload.namedQuery);else if(t.payload.documentMetadata){this.documents.push({metadata:t.payload.documentMetadata}),t.payload.documentMetadata.exists||++e;const n=ur.fromString(t.payload.documentMetadata.name);this.collectionGroups.add(n.get(n.length-2));}else t.payload.document&&(this.documents[this.documents.length-1].document=t.payload.document,++e);return e!==this.progress.documentsLoaded?(this.progress.documentsLoaded=e,Object.assign({},this.progress)):null}$u(t){const e=new Map,n=new ql(this.It);for(const s of t)if(s.metadata.queries){const t=n.Ji(s.metadata.name);for(const n of s.metadata.queries){const s=(e.get(n)||fa()).add(t);e.set(n,s);}}return e}async complete(){const t=await async function(t,e,n,s){const r=qs(t);let i=fa(),o=ra();for(const t of n){const n=e.Ji(t.metadata.name);t.document&&(i=i.add(n));const s=e.Yi(t);s.setReadTime(e.Xi(t.metadata.readTime)),o=o.insert(n,s);}const a=r.Gi.newChangeBuffer({trackRemovals:!0}),u=await bh(r,function(t){return co(so(ur.fromString(`__bundle__/docs/${t}`)))}(s));return r.persistence.runTransaction("Apply bundle documents","readwrite",(t=>vh(t,a,o).next((e=>(a.apply(t),e))).next((e=>r.Cs.removeMatchingKeysForTargetId(t,u.targetId).next((()=>r.Cs.addMatchingKeys(t,i,u.targetId))).next((()=>r.localDocuments.getLocalViewOfDocuments(t,e.Wi,e.zi))).next((()=>e.Wi))))))}(this.localStore,new ql(this.It),this.documents,this.Mu.id),e=this.$u(this.documents);for(const t of this.queries)await Dh(this.localStore,t,e.get(t.name));return this.progress.taskState="Success",{progress:this.progress,Bu:this.collectionGroups,Lu:t}}}function Kl(t){return {taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:t.totalDocuments,totalBytes:t.totalBytes}}class jl{constructor(t){this.key=t;}}class $l{constructor(t){this.key=t;}}class Ql{constructor(t,e){this.query=t,this.Uu=e,this.qu=null,this.current=!1,this.Ku=fa(),this.mutatedKeys=fa(),this.Gu=yo(t),this.Qu=new Cl(this.Gu);}get ju(){return this.Uu}Wu(t,e){const n=e?e.zu:new Nl,s=e?e.Qu:this.Qu;let r=e?e.mutatedKeys:this.mutatedKeys,i=s,o=!1;const a="F"===this.query.limitType&&s.size===this.query.limit?s.last():null,u="L"===this.query.limitType&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal(((t,e)=>{const c=s.get(t),h=go(this.query,e)?e:null,l=!!c&&this.mutatedKeys.has(c.key),d=!!h&&(h.hasLocalMutations||this.mutatedKeys.has(h.key)&&h.hasCommittedMutations);let f=!1;c&&h?c.data.isEqual(h.data)?l!==d&&(n.track({type:3,doc:h}),f=!0):this.Hu(c,h)||(n.track({type:2,doc:h}),f=!0,(a&&this.Gu(h,a)>0||u&&this.Gu(h,u)<0)&&(o=!0)):!c&&h?(n.track({type:0,doc:h}),f=!0):c&&!h&&(n.track({type:1,doc:c}),f=!0,(a||u)&&(o=!0)),f&&(h?(i=i.add(h),r=d?r.add(t):r.delete(t)):(i=i.delete(t),r=r.delete(t)));})),null!==this.query.limit)for(;i.size>this.query.limit;){const t="F"===this.query.limitType?i.last():i.first();i=i.delete(t.key),r=r.delete(t.key),n.track({type:1,doc:t});}return {Qu:i,zu:n,$i:o,mutatedKeys:r}}Hu(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,n){const s=this.Qu;this.Qu=t.Qu,this.mutatedKeys=t.mutatedKeys;const r=t.zu.Au();r.sort(((t,e)=>function(t,e){const n=t=>{switch(t){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return Ps()}};return n(t)-n(e)}(t.type,e.type)||this.Gu(t.doc,e.doc))),this.Ju(n);const i=e?this.Yu():[],o=0===this.Ku.size&&this.current?1:0,a=o!==this.qu;return this.qu=o,0!==r.length||a?{snapshot:new kl(this.query,t.Qu,s,r,t.mutatedKeys,0===o,a,!1),Xu:i}:{Xu:i}}Pu(t){return this.current&&"Offline"===t?(this.current=!1,this.applyChanges({Qu:this.Qu,zu:new Nl,mutatedKeys:this.mutatedKeys,$i:!1},!1)):{Xu:[]}}Zu(t){return !this.Uu.has(t)&&!!this.Qu.has(t)&&!this.Qu.get(t).hasLocalMutations}Ju(t){t&&(t.addedDocuments.forEach((t=>this.Uu=this.Uu.add(t))),t.modifiedDocuments.forEach((t=>{})),t.removedDocuments.forEach((t=>this.Uu=this.Uu.delete(t))),this.current=t.current);}Yu(){if(!this.current)return [];const t=this.Ku;this.Ku=fa(),this.Qu.forEach((t=>{this.Zu(t.key)&&(this.Ku=this.Ku.add(t.key));}));const e=[];return t.forEach((t=>{this.Ku.has(t)||e.push(new $l(t));})),this.Ku.forEach((n=>{t.has(n)||e.push(new jl(n));})),e}tc(t){this.Uu=t.Hi,this.Ku=fa();const e=this.Wu(t.documents);return this.applyChanges(e,!0)}ec(){return kl.fromInitialDocuments(this.query,this.Qu,this.mutatedKeys,0===this.qu)}}class zl{constructor(t,e,n){this.query=t,this.targetId=e,this.view=n;}}class Hl{constructor(t){this.key=t,this.nc=!1;}}class Wl{constructor(t,e,n,s,r,i){this.localStore=t,this.remoteStore=e,this.eventManager=n,this.sharedClientState=s,this.currentUser=r,this.maxConcurrentLimboResolutions=i,this.sc={},this.ic=new na((t=>fo(t)),lo),this.rc=new Map,this.oc=new Set,this.uc=new Gr(lr.comparator),this.cc=new Map,this.ac=new Xc,this.hc={},this.lc=new Map,this.fc=Dc.vn(),this.onlineState="Unknown",this.dc=void 0;}get isPrimaryClient(){return !0===this.dc}}async function Yl(t,e){const n=Ed(t);let s,r;const i=n.ic.get(e);if(i)s=i.targetId,n.sharedClientState.addLocalQueryTarget(s),r=i.view.ec();else {const t=await bh(n.localStore,co(e));n.isPrimaryClient&&el(n.remoteStore,t);const i=n.sharedClientState.addLocalQueryTarget(t.targetId);s=t.targetId,r=await Xl(n,e,s,"current"===i);}return r}async function Xl(t,e,n,s){t._c=(e,n,s)=>async function(t,e,n,s){let r=e.view.Wu(n);r.$i&&(r=await Th(t.localStore,e.query,!1).then((({documents:t})=>e.view.Wu(t,r))));const i=s&&s.targetChanges.get(e.targetId),o=e.view.applyChanges(r,t.isPrimaryClient,i);return ud(t,e.targetId,o.Xu),o.snapshot}(t,e,n,s);const r=await Th(t.localStore,e,!0),i=new Ql(e,r.Hi),o=i.Wu(r.documents),a=ya.createSynthesizedTargetChangeForCurrentChange(n,s&&"Offline"!==t.onlineState),u=i.applyChanges(o,t.isPrimaryClient,a);ud(t,n,u.Xu);const c=new zl(e,n,i);return t.ic.set(e,c),t.rc.has(n)?t.rc.get(n).push(e):t.rc.set(n,[e]),u.snapshot}async function Jl(t,e){const n=qs(t),s=n.ic.get(e),r=n.rc.get(s.targetId);if(r.length>1)return n.rc.set(s.targetId,r.filter((t=>!lo(t,e)))),void n.ic.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Eh(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),nl(n.remoteStore,s.targetId),od(n,s.targetId);})).catch(_r)):(od(n,s.targetId),await Eh(n.localStore,s.targetId,!0));}async function Zl(t,e){const n=qs(t);try{const t=await function(t,e){const n=qs(t),s=e.snapshotVersion;let r=n.Ui;return n.persistence.runTransaction("Apply remote event","readwrite-primary",(t=>{const i=n.Gi.newChangeBuffer({trackRemovals:!0});r=n.Ui;const o=[];e.targetChanges.forEach(((i,a)=>{const u=r.get(a);if(!u)return;o.push(n.Cs.removeMatchingKeys(t,i.removedDocuments,a).next((()=>n.Cs.addMatchingKeys(t,i.addedDocuments,a))));let c=u.withSequenceNumber(t.currentSequenceNumber);e.targetMismatches.has(a)?c=c.withResumeToken(Yr.EMPTY_BYTE_STRING,or.min()).withLastLimboFreeSnapshotVersion(or.min()):i.resumeToken.approximateByteSize()>0&&(c=c.withResumeToken(i.resumeToken,s)),r=r.insert(a,c),function(t,e,n){return 0===t.resumeToken.approximateByteSize()||e.snapshotVersion.toMicroseconds()-t.snapshotVersion.toMicroseconds()>=3e8||n.addedDocuments.size+n.modifiedDocuments.size+n.removedDocuments.size>0}(u,c,i)&&o.push(n.Cs.updateTargetData(t,c));}));let a=ra(),u=fa();if(e.documentUpdates.forEach((s=>{e.resolvedLimboDocuments.has(s)&&o.push(n.persistence.referenceDelegate.updateLimboDocument(t,s));})),o.push(vh(t,i,e.documentUpdates).next((t=>{a=t.Wi,u=t.zi;}))),!s.isEqual(or.min())){const e=n.Cs.getLastRemoteSnapshotVersion(t).next((e=>n.Cs.setTargetsMetadata(t,t.currentSequenceNumber,s)));o.push(e);}return Ar.waitFor(o).next((()=>i.apply(t))).next((()=>n.localDocuments.getLocalViewOfDocuments(t,a,u))).next((()=>a))})).then((t=>(n.Ui=r,t)))}(n.localStore,e);e.targetChanges.forEach(((t,e)=>{const s=n.cc.get(e);s&&(Us(t.addedDocuments.size+t.modifiedDocuments.size+t.removedDocuments.size<=1),t.addedDocuments.size>0?s.nc=!0:t.modifiedDocuments.size>0?Us(s.nc):t.removedDocuments.size>0&&(Us(s.nc),s.nc=!1));})),await ld(n,t,e);}catch(t){await _r(t);}}function td(t,e,n){const s=qs(t);if(s.isPrimaryClient&&0===n||!s.isPrimaryClient&&1===n){const t=[];s.ic.forEach(((n,s)=>{const r=s.view.Pu(e);r.snapshot&&t.push(r.snapshot);})),function(t,e){const n=qs(t);n.onlineState=e;let s=!1;n.queries.forEach(((t,n)=>{for(const t of n.listeners)t.Pu(e)&&(s=!0);})),s&&Pl(n);}(s.eventManager,e),t.length&&s.sc.zo(t),s.onlineState=e,s.isPrimaryClient&&s.sharedClientState.setOnlineState(e);}}async function ed(t,e,n){const s=qs(t);s.sharedClientState.updateQueryState(e,"rejected",n);const r=s.cc.get(e),i=r&&r.key;if(i){let t=new Gr(lr.comparator);t=t.insert(i,Ri.newNoDocument(i,or.min()));const n=fa().add(i),r=new pa(or.min(),new Map,new $r(nr),t,n);await Zl(s,r),s.uc=s.uc.remove(i),s.cc.delete(e),hd(s);}else await Eh(s.localStore,e,!1).then((()=>od(s,e,n))).catch(_r);}async function nd(t,e){const n=qs(t),s=e.batch.batchId;try{const t=await function(t,e){const n=qs(t);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",(t=>{const s=e.batch.keys(),r=n.Gi.newChangeBuffer({trackRemovals:!0});return function(t,e,n,s){const r=n.batch,i=r.keys();let o=Ar.resolve();return i.forEach((t=>{o=o.next((()=>s.getEntry(e,t))).next((e=>{const i=n.docVersions.get(t);Us(null!==i),e.version.compareTo(i)<0&&(r.applyToRemoteDocument(e,n),e.isValidDocument()&&(e.setReadTime(n.commitVersion),s.addEntry(e)));}));})),o.next((()=>t.mutationQueue.removeMutationBatch(e,r)))}(n,t,e,r).next((()=>r.apply(t))).next((()=>n.mutationQueue.performConsistencyCheck(t))).next((()=>n.documentOverlayCache.removeOverlaysForBatchId(t,s,e.batch.batchId))).next((()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(t,function(t){let e=fa();for(let n=0;n<t.mutationResults.length;++n)t.mutationResults[n].transformResults.length>0&&(e=e.add(t.batch.mutations[n].key));return e}(e)))).next((()=>n.localDocuments.getDocuments(t,s)))}))}(n.localStore,e);id(n,s,null),rd(n,s),n.sharedClientState.updateMutationState(s,"acknowledged"),await ld(n,t);}catch(t){await _r(t);}}async function sd(t,e,n){const s=qs(t);try{const t=await function(t,e){const n=qs(t);return n.persistence.runTransaction("Reject batch","readwrite-primary",(t=>{let s;return n.mutationQueue.lookupMutationBatch(t,e).next((e=>(Us(null!==e),s=e.keys(),n.mutationQueue.removeMutationBatch(t,e)))).next((()=>n.mutationQueue.performConsistencyCheck(t))).next((()=>n.documentOverlayCache.removeOverlaysForBatchId(t,s,e))).next((()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(t,s))).next((()=>n.localDocuments.getDocuments(t,s)))}))}(s.localStore,e);id(s,e,n),rd(s,e),s.sharedClientState.updateMutationState(e,"rejected",n),await ld(s,t);}catch(n){await _r(n);}}function rd(t,e){(t.lc.get(e)||[]).forEach((t=>{t.resolve();})),t.lc.delete(e);}function id(t,e,n){const s=qs(t);let r=s.hc[s.currentUser.toKey()];if(r){const t=r.get(e);t&&(n?t.reject(n):t.resolve(),r=r.remove(e)),s.hc[s.currentUser.toKey()]=r;}}function od(t,e,n=null){t.sharedClientState.removeLocalQueryTarget(e);for(const s of t.rc.get(e))t.ic.delete(s),n&&t.sc.wc(s,n);t.rc.delete(e),t.isPrimaryClient&&t.ac.ls(e).forEach((e=>{t.ac.containsKey(e)||ad(t,e);}));}function ad(t,e){t.oc.delete(e.path.canonicalString());const n=t.uc.get(e);null!==n&&(nl(t.remoteStore,n),t.uc=t.uc.remove(e),t.cc.delete(n),hd(t));}function ud(t,e,n){for(const s of n)s instanceof jl?(t.ac.addReference(s.key,e),cd(t,s)):s instanceof $l?(Ms("SyncEngine","Document no longer in limbo: "+s.key),t.ac.removeReference(s.key,e),t.ac.containsKey(s.key)||ad(t,s.key)):Ps();}function cd(t,e){const n=e.key,s=n.path.canonicalString();t.uc.get(n)||t.oc.has(s)||(Ms("SyncEngine","New document in limbo: "+n),t.oc.add(s),hd(t));}function hd(t){for(;t.oc.size>0&&t.uc.size<t.maxConcurrentLimboResolutions;){const e=t.oc.values().next().value;t.oc.delete(e);const n=new lr(ur.fromString(e)),s=t.fc.next();t.cc.set(s,new Hl(n)),t.uc=t.uc.insert(n,s),el(t.remoteStore,new Mu(co(so(n.path)),s,2,Pr.at));}}async function ld(t,e,n){const s=qs(t),r=[],i=[],o=[];s.ic.isEmpty()||(s.ic.forEach(((t,a)=>{o.push(s._c(a,e,n).then((t=>{if((t||n)&&s.isPrimaryClient&&s.sharedClientState.updateQueryState(a.targetId,(null==t?void 0:t.fromCache)?"not-current":"current"),t){r.push(t);const e=fh.Ci(a.targetId,t);i.push(e);}})));})),await Promise.all(o),s.sc.zo(r),await async function(t,e){const n=qs(t);try{await n.persistence.runTransaction("notifyLocalViewChanges","readwrite",(t=>Ar.forEach(e,(e=>Ar.forEach(e.Si,(s=>n.persistence.referenceDelegate.addReference(t,e.targetId,s))).next((()=>Ar.forEach(e.Di,(s=>n.persistence.referenceDelegate.removeReference(t,e.targetId,s)))))))));}catch(t){if(!kr(t))throw t;Ms("LocalStore","Failed to update sequence numbers: "+t);}for(const t of e){const e=t.targetId;if(!t.fromCache){const t=n.Ui.get(e),s=t.snapshotVersion,r=t.withLastLimboFreeSnapshotVersion(s);n.Ui=n.Ui.insert(e,r);}}}(s.localStore,i));}async function dd(t,e){const n=qs(t);if(!n.currentUser.isEqual(e)){Ms("SyncEngine","User change. New user:",e.toKey());const t=await yh(n.localStore,e);n.currentUser=e,function(t,e){t.lc.forEach((t=>{t.forEach((t=>{t.reject(new Ks(Gs.CANCELLED,"'waitForPendingWrites' promise is rejected due to a user change."));}));})),t.lc.clear();}(n),n.sharedClientState.handleUserChange(e,t.removedBatchIds,t.addedBatchIds),await ld(n,t.ji);}}function fd(t,e){const n=qs(t),s=n.cc.get(e);if(s&&s.nc)return fa().add(s.key);{let t=fa();const s=n.rc.get(e);if(!s)return t;for(const e of s){const s=n.ic.get(e);t=t.unionWith(s.view.ju);}return t}}async function md(t,e){const n=qs(t),s=await Th(n.localStore,e.query,!0),r=e.view.tc(s);return n.isPrimaryClient&&ud(n,e.targetId,r.Xu),r}async function gd(t,e){const n=qs(t);return _h(n.localStore,e).then((t=>ld(n,t)))}async function pd(t,e,n,s){const r=qs(t),i=await function(t,e){const n=qs(t),s=qs(n.mutationQueue);return n.persistence.runTransaction("Lookup mutation documents","readonly",(t=>s.Tn(t,e).next((e=>e?n.localDocuments.getDocuments(t,e):Ar.resolve(null)))))}(r.localStore,e);null!==i?("pending"===n?await ml(r.remoteStore):"acknowledged"===n||"rejected"===n?(id(r,e,s||null),rd(r,e),function(t,e){qs(qs(t).mutationQueue).An(e);}(r.localStore,e)):Ps(),await ld(r,i)):Ms("SyncEngine","Cannot apply mutation batch with id: "+e);}async function yd(t,e,n){const s=qs(t),r=[],i=[];for(const t of e){let e;const n=s.rc.get(t);if(n&&0!==n.length){e=await bh(s.localStore,co(n[0]));for(const t of n){const e=s.ic.get(t),n=await md(s,e);n.snapshot&&i.push(n.snapshot);}}else {const n=await Sh(s.localStore,t);e=await bh(s.localStore,n),await Xl(s,wd(n),t,!1);}r.push(e);}return s.sc.zo(i),r}function wd(t){return no(t.path,t.collectionGroup,t.orderBy,t.filters,t.limit,"F",t.startAt,t.endAt)}function vd(t){const e=qs(t);return qs(qs(e.localStore).persistence).vi()}async function Id(t,e,n,s){const r=qs(t);if(r.dc)return void Ms("SyncEngine","Ignoring unexpected query state notification.");const i=r.rc.get(e);if(i&&i.length>0)switch(n){case"current":case"not-current":{const t=await _h(r.localStore,po(i[0])),s=pa.createSynthesizedRemoteEventForCurrentChange(e,"current"===n);await ld(r,t,s);break}case"rejected":await Eh(r.localStore,e,!0),od(r,e,s);break;default:Ps();}}async function bd(t,e,n){const s=Ed(t);if(s.dc){for(const t of e){if(s.rc.has(t)){Ms("SyncEngine","Adding an already active target "+t);continue}const e=await Sh(s.localStore,t),n=await bh(s.localStore,e);await Xl(s,wd(e),n.targetId,!1),el(s.remoteStore,n);}for(const t of n)s.rc.has(t)&&await Eh(s.localStore,t,!1).then((()=>{nl(s.remoteStore,t),od(s,t);})).catch(_r);}}function Ed(t){const e=qs(t);return e.remoteStore.remoteSyncer.applyRemoteEvent=Zl.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=fd.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=ed.bind(null,e),e.sc.zo=Vl.bind(null,e.eventManager),e.sc.wc=Fl.bind(null,e.eventManager),e}function Td(t){const e=qs(t);return e.remoteStore.remoteSyncer.applySuccessfulWrite=nd.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=sd.bind(null,e),e}class Sd{constructor(){this.synchronizeTabs=!1;}async initialize(t){this.It=$h(t.databaseInfo.databaseId),this.sharedClientState=this.gc(t),this.persistence=this.yc(t),await this.persistence.start(),this.localStore=this.Ic(t),this.gcScheduler=this.Tc(t,this.localStore),this.indexBackfillerScheduler=this.Ec(t,this.localStore);}Tc(t,e){return null}Ec(t,e){return null}Ic(t){return ph(this.persistence,new mh,t.initialUser,this.It)}yc(t){return new sh(ih.Bs,this.It)}gc(t){return new Fh}async terminate(){this.gcScheduler&&this.gcScheduler.stop(),await this.sharedClientState.shutdown(),await this.persistence.shutdown();}}class _d extends Sd{constructor(t,e,n){super(),this.Ac=t,this.cacheSizeBytes=e,this.forceOwnership=n,this.synchronizeTabs=!1;}async initialize(t){await super.initialize(t),await this.Ac.initialize(this,t),await Td(this.Ac.syncEngine),await ml(this.Ac.remoteStore),await this.persistence.li((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())));}Ic(t){return ph(this.persistence,new mh,t.initialUser,this.It)}Tc(t,e){const n=this.persistence.referenceDelegate.garbageCollector;return new Mc(n,t.asyncQueue,e)}Ec(t,e){const n=new Fr(e,this.persistence);return new Vr(t.asyncQueue,n)}yc(t){const e=dh(t.databaseInfo.databaseId,t.databaseInfo.persistenceKey),n=void 0!==this.cacheSizeBytes?vc.withCacheSize(this.cacheSizeBytes):vc.DEFAULT;return new ch(this.synchronizeTabs,e,t.clientId,n,t.asyncQueue,Kh(),jh(),this.It,this.sharedClientState,!!this.forceOwnership)}gc(t){return new Fh}}class Ad extends _d{constructor(t,e){super(t,e,!1),this.Ac=t,this.cacheSizeBytes=e,this.synchronizeTabs=!0;}async initialize(t){await super.initialize(t);const e=this.Ac.syncEngine;this.sharedClientState instanceof Vh&&(this.sharedClientState.syncEngine={Fr:pd.bind(null,e),$r:Id.bind(null,e),Br:bd.bind(null,e),vi:vd.bind(null,e),Mr:gd.bind(null,e)},await this.sharedClientState.start()),await this.persistence.li((async t=>{await async function(t,e){const n=qs(t);if(Ed(n),Td(n),!0===e&&!0!==n.dc){const t=n.sharedClientState.getAllActiveQueryTargets(),e=await yd(n,t.toArray());n.dc=!0,await Sl(n.remoteStore,!0);for(const t of e)el(n.remoteStore,t);}else if(!1===e&&!1!==n.dc){const t=[];let e=Promise.resolve();n.rc.forEach(((s,r)=>{n.sharedClientState.isLocalQueryTarget(r)?t.push(r):e=e.then((()=>(od(n,r),Eh(n.localStore,r,!0)))),nl(n.remoteStore,r);})),await e,await yd(n,t),function(t){const e=qs(t);e.cc.forEach(((t,n)=>{nl(e.remoteStore,n);})),e.ac.fs(),e.cc=new Map,e.uc=new Gr(lr.comparator);}(n),n.dc=!1,await Sl(n.remoteStore,!1);}}(this.Ac.syncEngine,t),this.gcScheduler&&(t&&!this.gcScheduler.started?this.gcScheduler.start():t||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(t&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():t||this.indexBackfillerScheduler.stop());}));}gc(t){const e=Kh();if(!Vh.C(e))throw new Ks(Gs.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=dh(t.databaseInfo.databaseId,t.databaseInfo.persistenceKey);return new Vh(e,t.asyncQueue,n,t.clientId,t.initialUser)}}class Dd{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=t=>td(this.syncEngine,t,1),this.remoteStore.remoteSyncer.handleCredentialChange=dd.bind(null,this.syncEngine),await Sl(this.remoteStore,this.syncEngine.isPrimaryClient));}createEventManager(t){return new Ll}createDatastore(t){const e=$h(t.databaseInfo.databaseId),n=(s=t.databaseInfo,new Gh(s));var s;return function(t,e,n,s){return new Yh(t,e,n,s)}(t.authCredentials,t.appCheckCredentials,n,e)}createRemoteStore(t){return e=this.localStore,n=this.datastore,s=t.asyncQueue,r=t=>td(this.syncEngine,t,0),i=Uh.C()?new Uh:new Ph,new Jh(e,n,s,r,i);var e,n,s,r,i;}createSyncEngine(t,e){return function(t,e,n,s,r,i,o){const a=new Wl(t,e,n,s,r,i);return o&&(a.dc=!0),a}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}terminate(){return async function(t){const e=qs(t);Ms("RemoteStore","RemoteStore shutting down."),e.wu.add(5),await tl(e),e.gu.shutdown(),e.yu.set("Unknown");}(this.remoteStore)}}function xd(t,e,n){if(!n)throw new Ks(Gs.INVALID_ARGUMENT,`Function ${t}() cannot be called with an empty ${e}.`)}function Cd(t,e,n,s){if(!0===e&&!0===s)throw new Ks(Gs.INVALID_ARGUMENT,`${t} and ${n} cannot be used together.`)}function Nd(t){if(!lr.isDocumentKey(t))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${t} has ${t.length}.`)}function kd(t){if(lr.isDocumentKey(t))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${t} has ${t.length}.`)}function Rd(t){if(void 0===t)return "undefined";if(null===t)return "null";if("string"==typeof t)return t.length>20&&(t=`${t.substring(0,20)}...`),JSON.stringify(t);if("number"==typeof t||"boolean"==typeof t)return ""+t;if("object"==typeof t){if(t instanceof Array)return "an array";{const e=function(t){return t.constructor?t.constructor.name:null}(t);return e?`a custom ${e} object`:"an object"}}return "function"==typeof t?"a function":Ps()}function Ld(t,e){if("_delegate"in t&&(t=t._delegate),!(t instanceof e)){if(e.name===t.constructor.name)throw new Ks(Gs.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=Rd(t);throw new Ks(Gs.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${n}`)}}return t}function Md(t,e){if(e<=0)throw new Ks(Gs.INVALID_ARGUMENT,`Function ${t}() requires a positive number, but it was: ${e}.`)}const Od=new Map;class Vd{constructor(t){var e;if(void 0===t.host){if(void 0!==t.ssl)throw new Ks(Gs.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0;}else this.host=t.host,this.ssl=null===(e=t.ssl)||void 0===e||e;if(this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,void 0===t.cacheSizeBytes)this.cacheSizeBytes=41943040;else {if(-1!==t.cacheSizeBytes&&t.cacheSizeBytes<1048576)throw new Ks(Gs.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes;}this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.useFetchStreams=!!t.useFetchStreams,Cd("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling);}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class Fd{constructor(t,e,n,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Vd({}),this._settingsFrozen=!1;}get app(){if(!this._app)throw new Ks(Gs.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return void 0!==this._terminateTask}_setSettings(t){if(this._settingsFrozen)throw new Ks(Gs.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Vd(t),void 0!==t.credentials&&(this._authCredentials=function(t){if(!t)return new Qs;switch(t.type){case"gapi":const e=t.client;return new Ys(e,t.sessionIndex||"0",t.iamToken||null,t.authTokenFactory||null);case"provider":return t.client;default:throw new Ks(Gs.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(t.credentials));}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask||(this._terminateTask=this._terminate()),this._terminateTask}toJSON(){return {app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const e=Od.get(t);e&&(Ms("ComponentProvider","Removing Datastore"),Od.delete(t),e.terminate());}(this),Promise.resolve()}}function Pd(t,e,n,s={}){var r;const i=(t=Ld(t,Fd))._getSettings();if("firestore.googleapis.com"!==i.host&&i.host!==e&&Vs("Host has been set in both settings() and useEmulator(), emulator host will be used"),t._setSettings(Object.assign(Object.assign({},i),{host:`${e}:${n}`,ssl:!1})),s.mockUserToken){let e,n;if("string"==typeof s.mockUserToken)e=s.mockUserToken,n=Cs.MOCK_USER;else {e=function(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n=e||"demo-project",s=t.iat||0,r=t.sub||t.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const i=Object.assign({iss:`https://securetoken.google.com/${n}`,aud:n,iat:s,exp:s+3600,auth_time:s,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},t);return [u(JSON.stringify({alg:"none",type:"JWT"})),u(JSON.stringify(i)),""].join(".")}(s.mockUserToken,null===(r=t._app)||void 0===r?void 0:r.options.projectId);const i=s.mockUserToken.sub||s.mockUserToken.user_id;if(!i)throw new Ks(Gs.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");n=new Cs(i);}t._authCredentials=new zs(new $s(e,n));}}class Ud{constructor(t,e,n){this.converter=e,this._key=n,this.type="document",this.firestore=t;}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new qd(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new Ud(this.firestore,t,this._key)}}class Bd{constructor(t,e,n){this.converter=e,this._query=n,this.type="query",this.firestore=t;}withConverter(t){return new Bd(this.firestore,t,this._query)}}class qd extends Bd{constructor(t,e,n){super(t,e,so(n)),this._path=n,this.type="collection";}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new Ud(this.firestore,null,new lr(t))}withConverter(t){return new qd(this.firestore,t,this._path)}}function Gd(t,e,...n){if(t=v(t),xd("collection","path",e),t instanceof Fd){const s=ur.fromString(e,...n);return kd(s),new qd(t,null,s)}{if(!(t instanceof Ud||t instanceof qd))throw new Ks(Gs.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=t._path.child(ur.fromString(e,...n));return kd(s),new qd(t.firestore,null,s)}}function Kd(t,e){if(t=Ld(t,Fd),xd("collectionGroup","collection id",e),e.indexOf("/")>=0)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid collection ID '${e}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Bd(t,null,function(t){return new eo(ur.emptyPath(),t)}(e))}function jd(t,e,...n){if(t=v(t),1===arguments.length&&(e=er.R()),xd("doc","path",e),t instanceof Fd){const s=ur.fromString(e,...n);return Nd(s),new Ud(t,null,new lr(s))}{if(!(t instanceof Ud||t instanceof qd))throw new Ks(Gs.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const s=t._path.child(ur.fromString(e,...n));return Nd(s),new Ud(t.firestore,t instanceof qd?t.converter:null,new lr(s))}}function $d(t,e){return t=v(t),e=v(e),(t instanceof Ud||t instanceof qd)&&(e instanceof Ud||e instanceof qd)&&t.firestore===e.firestore&&t.path===e.path&&t.converter===e.converter}function Qd(t,e){return t=v(t),e=v(e),t instanceof Bd&&e instanceof Bd&&t.firestore===e.firestore&&lo(t._query,e._query)&&t.converter===e.converter}function zd(t,e=10240){let n=0;return {async read(){if(n<t.byteLength){const s={value:t.slice(n,n+e),done:!1};return n+=e,s}return {done:!0}},async cancel(){},releaseLock(){},closed:Promise.reject("unimplemented")}}class Hd{constructor(t){this.observer=t,this.muted=!1;}next(t){this.observer.next&&this.Rc(this.observer.next,t);}error(t){this.observer.error?this.Rc(this.observer.error,t):Os("Uncaught Error in snapshot listener:",t);}bc(){this.muted=!0;}Rc(t,e){this.muted||setTimeout((()=>{this.muted||t(e);}),0);}}class Wd{constructor(t,e){this.Pc=t,this.It=e,this.metadata=new js,this.buffer=new Uint8Array,this.vc=new TextDecoder("utf-8"),this.Vc().then((t=>{t&&t.Ou()?this.metadata.resolve(t.payload.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is\n             ${JSON.stringify(null==t?void 0:t.payload)}`));}),(t=>this.metadata.reject(t)));}close(){return this.Pc.cancel()}async getMetadata(){return this.metadata.promise}async mc(){return await this.getMetadata(),this.Vc()}async Vc(){const t=await this.Sc();if(null===t)return null;const e=this.vc.decode(t),n=Number(e);isNaN(n)&&this.Dc(`length string (${e}) is not valid number`);const s=await this.Cc(n);return new Bl(JSON.parse(s),t.length+n)}xc(){return this.buffer.findIndex((t=>t==="{".charCodeAt(0)))}async Sc(){for(;this.xc()<0&&!await this.Nc(););if(0===this.buffer.length)return null;const t=this.xc();t<0&&this.Dc("Reached the end of bundle when a length string is expected.");const e=this.buffer.slice(0,t);return this.buffer=this.buffer.slice(t),e}async Cc(t){for(;this.buffer.length<t;)await this.Nc()&&this.Dc("Reached the end of bundle when more is expected.");const e=this.vc.decode(this.buffer.slice(0,t));return this.buffer=this.buffer.slice(t),e}Dc(t){throw this.Pc.cancel(),new Error(`Invalid bundle format: ${t}`)}async Nc(){const t=await this.Pc.read();if(!t.done){const e=new Uint8Array(this.buffer.length+t.value.length);e.set(this.buffer),e.set(t.value,this.buffer.length),this.buffer=e;}return t.done}}class Yd{constructor(){this.type="AggregateField";}}class Xd{constructor(t,e){this._data=e,this.type="AggregateQuerySnapshot",this.query=t;}data(){return this._data}}class Jd{constructor(t,e,n){this.query=t,this.datastore=e,this.userDataWriter=n;}run(){return async function(t,e){const n=qs(t),s=function(t,e){const n=$a(t,e);return {structuredAggregationQuery:{aggregations:[{count:{},alias:"count_alias"}],structuredQuery:n.structuredQuery},parent:n.parent}}(n.It,co(e)),r=s.parent;return n.So.co||delete s.parent,(await n._o("RunAggregationQuery",r,s,1)).filter((t=>!!t.result)).map((t=>t.result.aggregateFields))}(this.datastore,this.query._query).then((t=>{Us(void 0!==t[0]);const e=Object.entries(t[0]).filter((([t,e])=>"count_alias"===t)).map((([t,e])=>this.userDataWriter.convertValue(e)))[0];return Us("number"==typeof e),Promise.resolve(new Xd(this.query,{count:e}))}))}}class Zd{constructor(t){this.datastore=t,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastWriteError=null,this.writtenDocs=new Set;}async lookup(t){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw new Ks(Gs.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes.");const e=await async function(t,e){const n=qs(t),s=Pa(n.It)+"/documents",r={documents:e.map((t=>Ma(n.It,t)))},i=await n._o("BatchGetDocuments",s,r,e.length),o=new Map;i.forEach((t=>{const e=function(t,e){return "found"in e?function(t,e){Us(!!e.found),e.found.name,e.found.updateTime;const n=Oa(t,e.found.name),s=ka(e.found.updateTime),r=new Ni({mapValue:{fields:e.found.fields}});return Ri.newFoundDocument(n,s,r)}(t,e):"missing"in e?function(t,e){Us(!!e.missing),Us(!!e.readTime);const n=Oa(t,e.missing),s=ka(e.readTime);return Ri.newNoDocument(n,s)}(t,e):Ps()}(n.It,t);o.set(e.key.toString(),e);}));const a=[];return e.forEach((t=>{const e=o.get(t.toString());Us(!!e),a.push(e);})),a}(this.datastore,t);return e.forEach((t=>this.recordVersion(t))),e}set(t,e){this.write(e.toMutation(t,this.precondition(t))),this.writtenDocs.add(t.toString());}update(t,e){try{this.write(e.toMutation(t,this.preconditionForUpdate(t)));}catch(t){this.lastWriteError=t;}this.writtenDocs.add(t.toString());}delete(t){this.write(new Wo(t,this.precondition(t))),this.writtenDocs.add(t.toString());}async commit(){if(this.ensureCommitNotCalled(),this.lastWriteError)throw this.lastWriteError;const t=this.readVersions;this.mutations.forEach((e=>{t.delete(e.key.toString());})),t.forEach(((t,e)=>{const n=lr.fromPath(e);this.mutations.push(new Yo(n,this.precondition(n)));})),await async function(t,e){const n=qs(t),s=Pa(n.It)+"/documents",r={writes:e.map((t=>Ga(n.It,t)))};await n.ao("Commit",s,r);}(this.datastore,this.mutations),this.committed=!0;}recordVersion(t){let e;if(t.isFoundDocument())e=t.version;else {if(!t.isNoDocument())throw Ps();e=or.min();}const n=this.readVersions.get(t.key.toString());if(n){if(!e.isEqual(n))throw new Ks(Gs.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(t.key.toString(),e);}precondition(t){const e=this.readVersions.get(t.toString());return !this.writtenDocs.has(t.toString())&&e?e.isEqual(or.min())?Vo.exists(!1):Vo.updateTime(e):Vo.none()}preconditionForUpdate(t){const e=this.readVersions.get(t.toString());if(!this.writtenDocs.has(t.toString())&&e){if(e.isEqual(or.min()))throw new Ks(Gs.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return Vo.updateTime(e)}return Vo.exists(!0)}write(t){this.ensureCommitNotCalled(),this.mutations.push(t);}ensureCommitNotCalled(){}}class tf{constructor(t,e,n,s,r){this.asyncQueue=t,this.datastore=e,this.options=n,this.updateFunction=s,this.deferred=r,this.kc=n.maxAttempts,this.No=new Qh(this.asyncQueue,"transaction_retry");}run(){this.kc-=1,this.Oc();}Oc(){this.No.Ro((async()=>{const t=new Zd(this.datastore),e=this.Mc(t);e&&e.then((e=>{this.asyncQueue.enqueueAndForget((()=>t.commit().then((()=>{this.deferred.resolve(e);})).catch((t=>{this.Fc(t);}))));})).catch((t=>{this.Fc(t);}));}));}Mc(t){try{const e=this.updateFunction(t);return !oi(e)&&e.catch&&e.then?e:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Fc(t){this.kc>0&&this.$c(t)?(this.kc-=1,this.asyncQueue.enqueueAndForget((()=>(this.Oc(),Promise.resolve())))):this.deferred.reject(t);}$c(t){if("FirebaseError"===t.name){const e=t.code;return "aborted"===e||"failed-precondition"===e||!ta(e)}return !1}}class ef{constructor(t,e,n,s){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=n,this.databaseInfo=s,this.user=Cs.UNAUTHENTICATED,this.clientId=er.R(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this.authCredentials.start(n,(async t=>{Ms("FirestoreClient","Received user=",t.uid),await this.authCredentialListener(t),this.user=t;})),this.appCheckCredentials.start(n,(t=>(Ms("FirestoreClient","Received new app check token=",t),this.appCheckCredentialListener(t,this.user))));}async getConfiguration(){return {asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t;}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t;}verifyNotTerminated(){if(this.asyncQueue.isShuttingDown)throw new Ks(Gs.FAILED_PRECONDITION,"The client has already been terminated.")}terminate(){this.asyncQueue.enterRestrictedMode();const t=new js;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this.onlineComponents&&await this.onlineComponents.terminate(),this.offlineComponents&&await this.offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve();}catch(e){const n=xl(e,"Failed to shutdown persistence");t.reject(n);}})),t.promise}}async function nf(t,e){t.asyncQueue.verifyOperationInProgress(),Ms("FirestoreClient","Initializing OfflineComponentProvider");const n=await t.getConfiguration();await e.initialize(n);let s=n.initialUser;t.setCredentialChangeListener((async t=>{s.isEqual(t)||(await yh(e.localStore,t),s=t);})),e.persistence.setDatabaseDeletedListener((()=>t.terminate())),t.offlineComponents=e;}async function sf(t,e){t.asyncQueue.verifyOperationInProgress();const n=await rf(t);Ms("FirestoreClient","Initializing OnlineComponentProvider");const s=await t.getConfiguration();await e.initialize(n,s),t.setCredentialChangeListener((t=>Tl(e.remoteStore,t))),t.setAppCheckTokenChangeListener(((t,n)=>Tl(e.remoteStore,n))),t.onlineComponents=e;}async function rf(t){return t.offlineComponents||(Ms("FirestoreClient","Using default OfflineComponentProvider"),await nf(t,new Sd)),t.offlineComponents}async function of(t){return t.onlineComponents||(Ms("FirestoreClient","Using default OnlineComponentProvider"),await sf(t,new Dd)),t.onlineComponents}function af(t){return rf(t).then((t=>t.persistence))}function uf(t){return rf(t).then((t=>t.localStore))}function cf(t){return of(t).then((t=>t.remoteStore))}function hf(t){return of(t).then((t=>t.syncEngine))}function lf(t){return of(t).then((t=>t.datastore))}async function df(t){const e=await of(t),n=e.eventManager;return n.onListen=Yl.bind(null,e.syncEngine),n.onUnlisten=Jl.bind(null,e.syncEngine),n}function ff(t,e,n={}){const s=new js;return t.asyncQueue.enqueueAndForget((async()=>function(t,e,n,s,r){const i=new Hd({next:i=>{e.enqueueAndForget((()=>Ol(t,o)));const a=i.docs.has(n);!a&&i.fromCache?r.reject(new Ks(Gs.UNAVAILABLE,"Failed to get document because the client is offline.")):a&&i.fromCache&&s&&"server"===s.source?r.reject(new Ks(Gs.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):r.resolve(i);},error:t=>r.reject(t)}),o=new Ul(so(n.path),i,{includeMetadataChanges:!0,ku:!0});return Ml(t,o)}(await df(t),t.asyncQueue,e,n,s))),s.promise}function mf(t,e,n={}){const s=new js;return t.asyncQueue.enqueueAndForget((async()=>function(t,e,n,s,r){const i=new Hd({next:n=>{e.enqueueAndForget((()=>Ol(t,o))),n.fromCache&&"server"===s.source?r.reject(new Ks(Gs.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):r.resolve(n);},error:t=>r.reject(t)}),o=new Ul(n,i,{includeMetadataChanges:!0,ku:!0});return Ml(t,o)}(await df(t),t.asyncQueue,e,n,s))),s.promise}function gf(t,e,n,s){const r=function(t,e){let n;return n="string"==typeof t?(new TextEncoder).encode(t):t,function(t,e){return new Wd(t,e)}(function(t,e){if(t instanceof Uint8Array)return zd(t,e);if(t instanceof ArrayBuffer)return zd(new Uint8Array(t),e);if(t instanceof ReadableStream)return t.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")}(n),e)}(n,$h(e));t.asyncQueue.enqueueAndForget((async()=>{!function(t,e,n){const s=qs(t);(async function(t,e,n){try{const s=await e.getMetadata();if(await function(t,e){const n=qs(t),s=ka(e.createTime);return n.persistence.runTransaction("hasNewerBundle","readonly",(t=>n.Ns.getBundleMetadata(t,e.id))).then((t=>!!t&&t.createTime.compareTo(s)>=0))}(t.localStore,s))return await e.close(),n._completeWith(function(t){return {taskState:"Success",documentsLoaded:t.totalDocuments,bytesLoaded:t.totalBytes,totalDocuments:t.totalDocuments,totalBytes:t.totalBytes}}(s)),Promise.resolve(new Set);n._updateProgress(Kl(s));const r=new Gl(s,t.localStore,e.It);let i=await e.mc();for(;i;){const t=await r.Fu(i);t&&n._updateProgress(t),i=await e.mc();}const o=await r.complete();return await ld(t,o.Lu,void 0),await function(t,e){const n=qs(t);return n.persistence.runTransaction("Save bundle","readwrite",(t=>n.Ns.saveBundleMetadata(t,e)))}(t.localStore,s),n._completeWith(o.progress),Promise.resolve(o.Bu)}catch(t){return Vs("SyncEngine",`Loading bundle failed with ${t}`),n._failWith(t),Promise.resolve(new Set)}})(s,e,n).then((t=>{s.sharedClientState.notifyBundleLoaded(t);}));}(await hf(t),r,s);}));}class pf{constructor(){this.Bc=Promise.resolve(),this.Lc=[],this.Uc=!1,this.qc=[],this.Kc=null,this.Gc=!1,this.Qc=!1,this.jc=[],this.No=new Qh(this,"async_queue_retry"),this.Wc=()=>{const t=jh();t&&Ms("AsyncQueue","Visibility state changed to "+t.visibilityState),this.No.Po();};const t=jh();t&&"function"==typeof t.addEventListener&&t.addEventListener("visibilitychange",this.Wc);}get isShuttingDown(){return this.Uc}enqueueAndForget(t){this.enqueue(t);}enqueueAndForgetEvenWhileRestricted(t){this.zc(),this.Hc(t);}enterRestrictedMode(t){if(!this.Uc){this.Uc=!0,this.Qc=t||!1;const e=jh();e&&"function"==typeof e.removeEventListener&&e.removeEventListener("visibilitychange",this.Wc);}}enqueue(t){if(this.zc(),this.Uc)return new Promise((()=>{}));const e=new js;return this.Hc((()=>this.Uc&&this.Qc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise))).then((()=>e.promise))}enqueueRetryable(t){this.enqueueAndForget((()=>(this.Lc.push(t),this.Jc())));}async Jc(){if(0!==this.Lc.length){try{await this.Lc[0](),this.Lc.shift(),this.No.reset();}catch(t){if(!kr(t))throw t;Ms("AsyncQueue","Operation failed with retryable error: "+t);}this.Lc.length>0&&this.No.Ro((()=>this.Jc()));}}Hc(t){const e=this.Bc.then((()=>(this.Gc=!0,t().catch((t=>{this.Kc=t,this.Gc=!1;const e=function(t){let e=t.message||"";return t.stack&&(e=t.stack.includes(t.message)?t.stack:t.message+"\n"+t.stack),e}(t);throw Os("INTERNAL UNHANDLED ERROR: ",e),t})).then((t=>(this.Gc=!1,t))))));return this.Bc=e,e}enqueueAfterDelay(t,e,n){this.zc(),this.jc.indexOf(t)>-1&&(e=0);const s=Dl.createAndSchedule(this,t,e,n,(t=>this.Yc(t)));return this.qc.push(s),s}zc(){this.Kc&&Ps();}verifyOperationInProgress(){}async Xc(){let t;do{t=this.Bc,await t;}while(t!==this.Bc)}Zc(t){for(const e of this.qc)if(e.timerId===t)return !0;return !1}ta(t){return this.Xc().then((()=>{this.qc.sort(((t,e)=>t.targetTimeMs-e.targetTimeMs));for(const e of this.qc)if(e.skipDelay(),"all"!==t&&e.timerId===t)break;return this.Xc()}))}ea(t){this.jc.push(t);}Yc(t){const e=this.qc.indexOf(t);this.qc.splice(e,1);}}function yf(t){return function(t,e){if("object"!=typeof t||null===t)return !1;const n=t;for(const t of ["next","error","complete"])if(t in n&&"function"==typeof n[t])return !0;return !1}(t)}class wf{constructor(){this._progressObserver={},this._taskCompletionResolver=new js,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0};}onProgress(t,e,n){this._progressObserver={next:t,error:e,complete:n};}catch(t){return this._taskCompletionResolver.promise.catch(t)}then(t,e){return this._taskCompletionResolver.promise.then(t,e)}_completeWith(t){this._updateProgress(t),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(t);}_failWith(t){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(t),this._taskCompletionResolver.reject(t);}_updateProgress(t){this._lastProgress=t,this._progressObserver.next&&this._progressObserver.next(t);}}const vf=-1;class If extends Fd{constructor(t,e,n,s){super(t,e,n,s),this.type="firestore",this._queue=new pf,this._persistenceKey=(null==s?void 0:s.name)||"[DEFAULT]";}_terminate(){return this._firestoreClient||Sf(this),this._firestoreClient.terminate()}}function bf(t,e,s){s||(s="(default)");const r=_getProvider(t,"firestore");if(r.isInitialized(s)){const t=r.getImmediate({identifier:s});if(y(r.getOptions(s),e))return t;throw new Ks(Gs.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(void 0!==e.cacheSizeBytes&&-1!==e.cacheSizeBytes&&e.cacheSizeBytes<1048576)throw new Ks(Gs.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return r.initialize({options:e,instanceIdentifier:s})}function Ef(t,e){const r="object"==typeof t?t:getApp(),i="string"==typeof t?t:e||"(default)",o=_getProvider(r,"firestore").getImmediate({identifier:i});if(!o._initialized){const t=(t=>{var e,n;return null===(n=null===(e=f())||void 0===e?void 0:e.emulatorHosts)||void 0===n?void 0:n[t]})("firestore");if(t){const[e,n]=t.split(":");Pd(o,e,parseInt(n,10));}}return o}function Tf(t){return t._firestoreClient||Sf(t),t._firestoreClient.verifyNotTerminated(),t._firestoreClient}function Sf(t){var e;const n=t._freezeSettings(),s=function(t,e,n,s){return new ri(t,e,n,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,s.useFetchStreams)}(t._databaseId,(null===(e=t._app)||void 0===e?void 0:e.options.appId)||"",t._persistenceKey,n);t._firestoreClient=new ef(t._authCredentials,t._appCheckCredentials,t._queue,s);}function _f(t,e){Of(t=Ld(t,If));const n=Tf(t),s=t._freezeSettings(),r=new Dd;return Df(n,r,new _d(r,s.cacheSizeBytes,null==e?void 0:e.forceOwnership))}function Af(t){Of(t=Ld(t,If));const e=Tf(t),n=t._freezeSettings(),s=new Dd;return Df(e,s,new Ad(s,n.cacheSizeBytes))}function Df(t,e,n){const s=new js;return t.asyncQueue.enqueue((async()=>{try{await nf(t,n),await sf(t,e),s.resolve();}catch(t){const e=t;if(!function(t){return "FirebaseError"===t.name?t.code===Gs.FAILED_PRECONDITION||t.code===Gs.UNIMPLEMENTED:!("undefined"!=typeof DOMException&&t instanceof DOMException)||(22===t.code||20===t.code||11===t.code)}(e))throw e;Vs("Error enabling offline persistence. Falling back to persistence disabled: "+e),s.reject(e);}})).then((()=>s.promise))}function xf(t){if(t._initialized&&!t._terminated)throw new Ks(Gs.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const e=new js;return t._queue.enqueueAndForgetEvenWhileRestricted((async()=>{try{await async function(t){if(!xr.C())return Promise.resolve();const e=t+"main";await xr.delete(e);}(dh(t._databaseId,t._persistenceKey)),e.resolve();}catch(t){e.reject(t);}})),e.promise}function Cf(t){return function(t){const e=new js;return t.asyncQueue.enqueueAndForget((async()=>async function(t,e){const n=qs(t);al(n.remoteStore)||Ms("SyncEngine","The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const t=await function(t){const e=qs(t);return e.persistence.runTransaction("Get highest unacknowledged batch id","readonly",(t=>e.mutationQueue.getHighestUnacknowledgedBatchId(t)))}(n.localStore);if(-1===t)return void e.resolve();const s=n.lc.get(t)||[];s.push(e),n.lc.set(t,s);}catch(t){const n=xl(t,"Initialization of waitForPendingWrites() operation failed");e.reject(n);}}(await hf(t),e))),e.promise}(Tf(t=Ld(t,If)))}function Nf(t){return function(t){return t.asyncQueue.enqueue((async()=>{const e=await af(t),n=await cf(t);return e.setNetworkEnabled(!0),function(t){const e=qs(t);return e.wu.delete(0),Zh(e)}(n)}))}(Tf(t=Ld(t,If)))}function kf(t){return function(t){return t.asyncQueue.enqueue((async()=>{const e=await af(t),n=await cf(t);return e.setNetworkEnabled(!1),async function(t){const e=qs(t);e.wu.add(0),await tl(e),e.yu.set("Offline");}(n)}))}(Tf(t=Ld(t,If)))}function Rf(t){return _removeServiceInstance(t.app,"firestore",t._databaseId.database),t._delete()}function Lf(t,e){const n=Tf(t=Ld(t,If)),s=new wf;return gf(n,t._databaseId,e,s),s}function Mf(t,e){return function(t,e){return t.asyncQueue.enqueue((async()=>function(t,e){const n=qs(t);return n.persistence.runTransaction("Get named query","readonly",(t=>n.Ns.getNamedQuery(t,e)))}(await uf(t),e)))}(Tf(t=Ld(t,If)),e).then((e=>e?new Bd(t,null,e.query):null))}function Of(t){if(t._initialized||t._terminated)throw new Ks(Gs.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.")}class Vf{constructor(t){this._byteString=t;}static fromBase64String(t){try{return new Vf(Yr.fromBase64String(t))}catch(t){throw new Ks(Gs.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(t){return new Vf(Yr.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return "Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}}class Ff{constructor(...t){for(let e=0;e<t.length;++e)if(0===t[e].length)throw new Ks(Gs.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new hr(t);}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}function Pf(){return new Ff("__name__")}class Uf{constructor(t){this._methodName=t;}}class Bf{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new Ks(Gs.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new Ks(Gs.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e;}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}toJSON(){return {latitude:this._lat,longitude:this._long}}_compareTo(t){return nr(this._lat,t._lat)||nr(this._long,t._long)}}const qf=/^__.*__$/;class Gf{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n;}toMutation(t,e){return null!==this.fieldMask?new $o(t,this.data,this.fieldMask,e,this.fieldTransforms):new jo(t,this.data,e,this.fieldTransforms)}}class Kf{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n;}toMutation(t,e){return new $o(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function jf(t){switch(t){case 0:case 2:case 1:return !0;case 3:case 4:return !1;default:throw Ps()}}class $f{constructor(t,e,n,s,r,i){this.settings=t,this.databaseId=e,this.It=n,this.ignoreUndefinedProperties=s,void 0===r&&this.na(),this.fieldTransforms=r||[],this.fieldMask=i||[];}get path(){return this.settings.path}get sa(){return this.settings.sa}ia(t){return new $f(Object.assign(Object.assign({},this.settings),t),this.databaseId,this.It,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}ra(t){var e;const n=null===(e=this.path)||void 0===e?void 0:e.child(t),s=this.ia({path:n,oa:!1});return s.ua(t),s}ca(t){var e;const n=null===(e=this.path)||void 0===e?void 0:e.child(t),s=this.ia({path:n,oa:!1});return s.na(),s}aa(t){return this.ia({path:void 0,oa:!0})}ha(t){return lm(t,this.settings.methodName,this.settings.la||!1,this.path,this.settings.fa)}contains(t){return void 0!==this.fieldMask.find((e=>t.isPrefixOf(e)))||void 0!==this.fieldTransforms.find((e=>t.isPrefixOf(e.field)))}na(){if(this.path)for(let t=0;t<this.path.length;t++)this.ua(this.path.get(t));}ua(t){if(0===t.length)throw this.ha("Document fields must not be empty");if(jf(this.sa)&&qf.test(t))throw this.ha('Document fields cannot begin and end with "__"')}}class Qf{constructor(t,e,n){this.databaseId=t,this.ignoreUndefinedProperties=e,this.It=n||$h(t);}da(t,e,n,s=!1){return new $f({sa:t,methodName:e,fa:n,path:hr.emptyPath(),oa:!1,la:s},this.databaseId,this.It,this.ignoreUndefinedProperties)}}function zf(t){const e=t._freezeSettings(),n=$h(t._databaseId);return new Qf(t._databaseId,!!e.ignoreUndefinedProperties,n)}function Hf(t,e,n,s,r,i={}){const o=t.da(i.merge||i.mergeFields?2:0,e,n,r);am("Data must be an object, but it was:",o,s);const a=im(s,o);let u,c;if(i.merge)u=new Hr(o.fieldMask),c=o.fieldTransforms;else if(i.mergeFields){const t=[];for(const s of i.mergeFields){const r=um(e,s,n);if(!o.contains(r))throw new Ks(Gs.INVALID_ARGUMENT,`Field '${r}' is specified in your field mask but missing from your input data.`);dm(t,r)||t.push(r);}u=new Hr(t),c=o.fieldTransforms.filter((t=>u.covers(t.field)));}else u=null,c=o.fieldTransforms;return new Gf(new Ni(a),u,c)}class Wf extends Uf{_toFieldTransform(t){if(2!==t.sa)throw 1===t.sa?t.ha(`${this._methodName}() can only appear at the top level of your update data`):t.ha(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof Wf}}function Yf(t,e,n){return new $f({sa:3,fa:e.settings.fa,methodName:t._methodName,oa:n},e.databaseId,e.It,e.ignoreUndefinedProperties)}class Xf extends Uf{_toFieldTransform(t){return new Mo(t.path,new Ao)}isEqual(t){return t instanceof Xf}}class Jf extends Uf{constructor(t,e){super(t),this._a=e;}_toFieldTransform(t){const e=Yf(this,t,!0),n=this._a.map((t=>rm(t,e))),s=new Do(n);return new Mo(t.path,s)}isEqual(t){return this===t}}class Zf extends Uf{constructor(t,e){super(t),this._a=e;}_toFieldTransform(t){const e=Yf(this,t,!0),n=this._a.map((t=>rm(t,e))),s=new Co(n);return new Mo(t.path,s)}isEqual(t){return this===t}}class tm extends Uf{constructor(t,e){super(t),this.wa=e;}_toFieldTransform(t){const e=new ko(t.It,bo(t.It,this.wa));return new Mo(t.path,e)}isEqual(t){return this===t}}function em(t,e,n,s){const r=t.da(1,e,n);am("Data must be an object, but it was:",r,s);const i=[],o=Ni.empty();Br(s,((t,s)=>{const a=hm(e,t,n);s=v(s);const u=r.ca(a);if(s instanceof Wf)i.push(a);else {const t=rm(s,u);null!=t&&(i.push(a),o.set(a,t));}}));const a=new Hr(i);return new Kf(o,a,r.fieldTransforms)}function nm(t,e,n,s,r,i){const o=t.da(1,e,n),a=[um(e,s,n)],u=[r];if(i.length%2!=0)throw new Ks(Gs.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let t=0;t<i.length;t+=2)a.push(um(e,i[t])),u.push(i[t+1]);const c=[],h=Ni.empty();for(let t=a.length-1;t>=0;--t)if(!dm(c,a[t])){const e=a[t];let n=u[t];n=v(n);const s=o.ca(e);if(n instanceof Wf)c.push(e);else {const t=rm(n,s);null!=t&&(c.push(e),h.set(e,t));}}const l=new Hr(c);return new Kf(h,l,o.fieldTransforms)}function sm(t,e,n,s=!1){return rm(n,t.da(s?4:3,e))}function rm(t,e){if(om(t=v(t)))return am("Unsupported field value:",e,t),im(t,e);if(t instanceof Uf)return function(t,e){if(!jf(e.sa))throw e.ha(`${t._methodName}() can only be used with update() and set()`);if(!e.path)throw e.ha(`${t._methodName}() is not currently supported inside arrays`);const n=t._toFieldTransform(e);n&&e.fieldTransforms.push(n);}(t,e),null;if(void 0===t&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),t instanceof Array){if(e.settings.oa&&4!==e.sa)throw e.ha("Nested arrays are not supported");return function(t,e){const n=[];let s=0;for(const r of t){let t=rm(r,e.aa(s));null==t&&(t={nullValue:"NULL_VALUE"}),n.push(t),s++;}return {arrayValue:{values:n}}}(t,e)}return function(t,e){if(null===(t=v(t)))return {nullValue:"NULL_VALUE"};if("number"==typeof t)return bo(e.It,t);if("boolean"==typeof t)return {booleanValue:t};if("string"==typeof t)return {stringValue:t};if(t instanceof Date){const n=ir.fromDate(t);return {timestampValue:xa(e.It,n)}}if(t instanceof ir){const n=new ir(t.seconds,1e3*Math.floor(t.nanoseconds/1e3));return {timestampValue:xa(e.It,n)}}if(t instanceof Bf)return {geoPointValue:{latitude:t.latitude,longitude:t.longitude}};if(t instanceof Vf)return {bytesValue:Ca(e.It,t._byteString)};if(t instanceof Ud){const n=e.databaseId,s=t.firestore._databaseId;if(!s.isEqual(n))throw e.ha(`Document reference is for database ${s.projectId}/${s.database} but should be for database ${n.projectId}/${n.database}`);return {referenceValue:Ra(t.firestore._databaseId||e.databaseId,t._key.path)}}throw e.ha(`Unsupported field value: ${Rd(t)}`)}(t,e)}function im(t,e){const n={};return qr(t)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Br(t,((t,s)=>{const r=rm(s,e.ra(t));null!=r&&(n[t]=r);})),{mapValue:{fields:n}}}function om(t){return !("object"!=typeof t||null===t||t instanceof Array||t instanceof Date||t instanceof ir||t instanceof Bf||t instanceof Vf||t instanceof Ud||t instanceof Uf)}function am(t,e,n){if(!om(n)||!function(t){return "object"==typeof t&&null!==t&&(Object.getPrototypeOf(t)===Object.prototype||null===Object.getPrototypeOf(t))}(n)){const s=Rd(n);throw "an object"===s?e.ha(t+" a custom object"):e.ha(t+" "+s)}}function um(t,e,n){if((e=v(e))instanceof Ff)return e._internalPath;if("string"==typeof e)return hm(t,e);throw lm("Field path arguments must be of type string or ",t,!1,void 0,n)}const cm=new RegExp("[~\\*/\\[\\]]");function hm(t,e,n){if(e.search(cm)>=0)throw lm(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,t,!1,void 0,n);try{return new Ff(...e.split("."))._internalPath}catch(s){throw lm(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,t,!1,void 0,n)}}function lm(t,e,n,s,r){const i=s&&!s.isEmpty(),o=void 0!==r;let a=`Function ${e}() called with invalid data`;n&&(a+=" (via `toFirestore()`)"),a+=". ";let u="";return (i||o)&&(u+=" (found",i&&(u+=` in field ${s}`),o&&(u+=` in document ${r}`),u+=")"),new Ks(Gs.INVALID_ARGUMENT,a+t+u)}function dm(t,e){return t.some((t=>t.isEqual(e)))}class fm{constructor(t,e,n,s,r){this._firestore=t,this._userDataWriter=e,this._key=n,this._document=s,this._converter=r;}get id(){return this._key.path.lastSegment()}get ref(){return new Ud(this._firestore,this._converter,this._key)}exists(){return null!==this._document}data(){if(this._document){if(this._converter){const t=new mm(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}get(t){if(this._document){const e=this._document.data.field(gm("DocumentSnapshot.get",t));if(null!==e)return this._userDataWriter.convertValue(e)}}}class mm extends fm{data(){return super.data()}}function gm(t,e){return "string"==typeof e?hm(t,e):e instanceof Ff?e._internalPath:e._delegate._internalPath}function pm(t){if("L"===t.limitType&&0===t.explicitOrderBy.length)throw new Ks(Gs.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class ym{}function wm(t,...e){for(const n of e)t=n._apply(t);return t}class vm extends ym{constructor(t,e,n){super(),this.ma=t,this.ga=e,this.ya=n,this.type="where";}_apply(t){const e=zf(t.firestore),n=function(t,e,n,s,r,i,o){let a;if(r.isKeyField()){if("array-contains"===i||"array-contains-any"===i)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid Query. You can't perform '${i}' queries on documentId().`);if("in"===i||"not-in"===i){Mm(o,i);const e=[];for(const n of o)e.push(Lm(s,t,n));a={arrayValue:{values:e}};}else a=Lm(s,t,o);}else "in"!==i&&"not-in"!==i&&"array-contains-any"!==i||Mm(o,i),a=sm(n,"where",o,"in"===i||"not-in"===i);const u=qi.create(r,i,a);return function(t,e){if(e.dt()){const n=oo(t);if(null!==n&&!n.isEqual(e.field))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. All where filters with an inequality (<, <=, !=, not-in, >, or >=) must be on the same field. But you have inequality filters on '${n.toString()}' and '${e.field.toString()}'`);const s=io(t);null!==s&&Om(t,e.field,s);}const n=function(t,e){for(const n of t.filters)if(e.indexOf(n.op)>=0)return n.op;return null}(t,function(t){switch(t){case"!=":return ["!=","not-in"];case"array-contains":return ["array-contains","array-contains-any","not-in"];case"in":return ["array-contains-any","in","not-in"];case"array-contains-any":return ["array-contains","array-contains-any","in","not-in"];case"not-in":return ["array-contains","array-contains-any","in","not-in","!="];default:return []}}(e.op));if(null!==n)throw n===e.op?new Ks(Gs.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new Ks(Gs.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${n.toString()}' filters.`)}(t,u),u}(t._query,0,e,t.firestore._databaseId,this.ma,this.ga,this.ya);return new Bd(t.firestore,t.converter,function(t,e){const n=t.filters.concat([e]);return new eo(t.path,t.collectionGroup,t.explicitOrderBy.slice(),n,t.limit,t.limitType,t.startAt,t.endAt)}(t._query,n))}}function Im(t,e,n){const s=e,r=gm("where",t);return new vm(r,s,n)}class bm extends ym{constructor(t,e){super(),this.ma=t,this.pa=e,this.type="orderBy";}_apply(t){const e=function(t,e,n){if(null!==t.startAt)throw new Ks(Gs.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(null!==t.endAt)throw new Ks(Gs.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");const s=new Xi(e,n);return function(t,e){if(null===io(t)){const n=oo(t);null!==n&&Om(t,n,e.field);}}(t,s),s}(t._query,this.ma,this.pa);return new Bd(t.firestore,t.converter,function(t,e){const n=t.explicitOrderBy.concat([e]);return new eo(t.path,t.collectionGroup,n,t.filters.slice(),t.limit,t.limitType,t.startAt,t.endAt)}(t._query,e))}}function Em(t,e="asc"){const n=e,s=gm("orderBy",t);return new bm(s,n)}class Tm extends ym{constructor(t,e,n){super(),this.type=t,this.Ia=e,this.Ta=n;}_apply(t){return new Bd(t.firestore,t.converter,ho(t._query,this.Ia,this.Ta))}}function Sm(t){return Md("limit",t),new Tm("limit",t,"F")}function _m(t){return Md("limitToLast",t),new Tm("limitToLast",t,"L")}class Am extends ym{constructor(t,e,n){super(),this.type=t,this.Ea=e,this.Aa=n;}_apply(t){const e=Rm(t,this.type,this.Ea,this.Aa);return new Bd(t.firestore,t.converter,function(t,e){return new eo(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),t.limit,t.limitType,e,t.endAt)}(t._query,e))}}function Dm(...t){return new Am("startAt",t,!0)}function xm(...t){return new Am("startAfter",t,!1)}class Cm extends ym{constructor(t,e,n){super(),this.type=t,this.Ea=e,this.Aa=n;}_apply(t){const e=Rm(t,this.type,this.Ea,this.Aa);return new Bd(t.firestore,t.converter,function(t,e){return new eo(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),t.limit,t.limitType,t.startAt,e)}(t._query,e))}}function Nm(...t){return new Cm("endBefore",t,!1)}function km(...t){return new Cm("endAt",t,!0)}function Rm(t,e,n,s){if(n[0]=v(n[0]),n[0]instanceof fm)return function(t,e,n,s,r){if(!s)throw new Ks(Gs.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${n}().`);const i=[];for(const n of uo(t))if(n.field.isKeyField())i.push(wi(e,s.key));else {const t=s.data.field(n.field);if(ei(t))throw new Ks(Gs.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+n.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(null===t){const t=n.field.canonicalString();throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${t}' (used as the orderBy) does not exist.`)}i.push(t);}return new Yi(i,r)}(t._query,t.firestore._databaseId,e,n[0]._document,s);{const r=zf(t.firestore);return function(t,e,n,s,r,i){const o=t.explicitOrderBy;if(r.length>o.length)throw new Ks(Gs.INVALID_ARGUMENT,`Too many arguments provided to ${s}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const a=[];for(let i=0;i<r.length;i++){const u=r[i];if(o[i].field.isKeyField()){if("string"!=typeof u)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${s}(), but got a ${typeof u}`);if(!ao(t)&&-1!==u.indexOf("/"))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${s}() must be a plain document ID, but '${u}' contains a slash.`);const n=t.path.child(ur.fromString(u));if(!lr.isDocumentKey(n))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${s}() must result in a valid document path, but '${n}' is not because it contains an odd number of segments.`);const r=new lr(n);a.push(wi(e,r));}else {const t=sm(n,s,u);a.push(t);}}return new Yi(a,i)}(t._query,t.firestore._databaseId,r,e,n,s)}}function Lm(t,e,n){if("string"==typeof(n=v(n))){if(""===n)throw new Ks(Gs.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!ao(e)&&-1!==n.indexOf("/"))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);const s=e.path.child(ur.fromString(n));if(!lr.isDocumentKey(s))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${s}' is not because it has an odd number of segments (${s.length}).`);return wi(t,new lr(s))}if(n instanceof Ud)return wi(t,n._key);throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Rd(n)}.`)}function Mm(t,e){if(!Array.isArray(t)||0===t.length)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`);if(t.length>10)throw new Ks(Gs.INVALID_ARGUMENT,`Invalid Query. '${e.toString()}' filters support a maximum of 10 elements in the value array.`)}function Om(t,e,n){if(!n.isEqual(e))throw new Ks(Gs.INVALID_ARGUMENT,`Invalid query. You have a where filter with an inequality (<, <=, !=, not-in, >, or >=) on field '${e.toString()}' and so you must also use '${e.toString()}' as your first argument to orderBy(), but your first orderBy() is on field '${n.toString()}' instead.`)}class Vm{convertValue(t,e="none"){switch(li(t)){case 0:return null;case 1:return t.booleanValue;case 2:return Zr(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(ti(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 10:return this.convertObject(t.mapValue,e);default:throw Ps()}}convertObject(t,e){const n={};return Br(t.fields,((t,s)=>{n[t]=this.convertValue(s,e);})),n}convertGeoPoint(t){return new Bf(Zr(t.latitude),Zr(t.longitude))}convertArray(t,e){return (t.values||[]).map((t=>this.convertValue(t,e)))}convertServerTimestamp(t,e){switch(e){case"previous":const n=ni(t);return null==n?null:this.convertValue(n,e);case"estimate":return this.convertTimestamp(si(t));default:return null}}convertTimestamp(t){const e=Jr(t);return new ir(e.seconds,e.nanos)}convertDocumentKey(t,e){const n=ur.fromString(t);Us(eu(n));const s=new ii(n.get(1),n.get(3)),r=new lr(n.popFirst(5));return s.isEqual(e)||Os(`Document ${r} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),r}}function Fm(t,e,n){let s;return s=t?n&&(n.merge||n.mergeFields)?t.toFirestore(e,n):t.toFirestore(e):e,s}class Pm extends Vm{constructor(t){super(),this.firestore=t;}convertBytes(t){return new Vf(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new Ud(this.firestore,null,e)}}class Um{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e;}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Bm extends fm{constructor(t,e,n,s,r,i){super(t,e,n,s,i),this._firestore=t,this._firestoreImpl=t,this.metadata=r;}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new qm(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const n=this._document.data.field(gm("DocumentSnapshot.get",t));if(null!==n)return this._userDataWriter.convertValue(n,e.serverTimestamps)}}}class qm extends Bm{data(t={}){return super.data(t)}}class Gm{constructor(t,e,n,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new Um(s.hasPendingWrites,s.fromCache),this.query=n;}get docs(){const t=[];return this.forEach((e=>t.push(e))),t}get size(){return this._snapshot.docs.size}get empty(){return 0===this.size}forEach(t,e){this._snapshot.docs.forEach((n=>{t.call(e,new qm(this._firestore,this._userDataWriter,n.key,n,new Um(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter));}));}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new Ks(Gs.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=function(t,e){if(t._snapshot.oldDocs.isEmpty()){let e=0;return t._snapshot.docChanges.map((n=>({type:"added",doc:new qm(t._firestore,t._userDataWriter,n.doc.key,n.doc,new Um(t._snapshot.mutatedKeys.has(n.doc.key),t._snapshot.fromCache),t.query.converter),oldIndex:-1,newIndex:e++})))}{let n=t._snapshot.oldDocs;return t._snapshot.docChanges.filter((t=>e||3!==t.type)).map((e=>{const s=new qm(t._firestore,t._userDataWriter,e.doc.key,e.doc,new Um(t._snapshot.mutatedKeys.has(e.doc.key),t._snapshot.fromCache),t.query.converter);let r=-1,i=-1;return 0!==e.type&&(r=n.indexOf(e.doc.key),n=n.delete(e.doc.key)),1!==e.type&&(n=n.add(e.doc),i=n.indexOf(e.doc.key)),{type:Km(e.type),doc:s,oldIndex:r,newIndex:i}}))}}(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}}function Km(t){switch(t){case 0:return "added";case 2:case 3:return "modified";case 1:return "removed";default:return Ps()}}function jm(t,e){return t instanceof Bm&&e instanceof Bm?t._firestore===e._firestore&&t._key.isEqual(e._key)&&(null===t._document?null===e._document:t._document.isEqual(e._document))&&t._converter===e._converter:t instanceof Gm&&e instanceof Gm&&t._firestore===e._firestore&&Qd(t.query,e.query)&&t.metadata.isEqual(e.metadata)&&t._snapshot.isEqual(e._snapshot)}function $m(t){t=Ld(t,Ud);const e=Ld(t.firestore,If);return ff(Tf(e),t._key).then((n=>ig(e,t,n)))}class Qm extends Vm{constructor(t){super(),this.firestore=t;}convertBytes(t){return new Vf(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new Ud(this.firestore,null,e)}}function zm(t){t=Ld(t,Ud);const e=Ld(t.firestore,If),n=Tf(e),s=new Qm(e);return function(t,e){const n=new js;return t.asyncQueue.enqueueAndForget((async()=>async function(t,e,n){try{const s=await function(t,e){const n=qs(t);return n.persistence.runTransaction("read document","readonly",(t=>n.localDocuments.getDocument(t,e)))}(t,e);s.isFoundDocument()?n.resolve(s):s.isNoDocument()?n.resolve(null):n.reject(new Ks(Gs.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"));}catch(t){const s=xl(t,`Failed to get document '${e} from cache`);n.reject(s);}}(await uf(t),e,n))),n.promise}(n,t._key).then((n=>new Bm(e,s,t._key,n,new Um(null!==n&&n.hasLocalMutations,!0),t.converter)))}function Hm(t){t=Ld(t,Ud);const e=Ld(t.firestore,If);return ff(Tf(e),t._key,{source:"server"}).then((n=>ig(e,t,n)))}function Wm(t){t=Ld(t,Bd);const e=Ld(t.firestore,If),n=Tf(e),s=new Qm(e);return pm(t._query),mf(n,t._query).then((n=>new Gm(e,s,t,n)))}function Ym(t){t=Ld(t,Bd);const e=Ld(t.firestore,If),n=Tf(e),s=new Qm(e);return function(t,e){const n=new js;return t.asyncQueue.enqueueAndForget((async()=>async function(t,e,n){try{const s=await Th(t,e,!0),r=new Ql(e,s.Hi),i=r.Wu(s.documents),o=r.applyChanges(i,!1);n.resolve(o.snapshot);}catch(t){const s=xl(t,`Failed to execute query '${e} against cache`);n.reject(s);}}(await uf(t),e,n))),n.promise}(n,t._query).then((n=>new Gm(e,s,t,n)))}function Xm(t){t=Ld(t,Bd);const e=Ld(t.firestore,If),n=Tf(e),s=new Qm(e);return mf(n,t._query,{source:"server"}).then((n=>new Gm(e,s,t,n)))}function Jm(t,e,n){t=Ld(t,Ud);const s=Ld(t.firestore,If),r=Fm(t.converter,e,n);return rg(s,[Hf(zf(s),"setDoc",t._key,r,null!==t.converter,n).toMutation(t._key,Vo.none())])}function Zm(t,e,n,...s){t=Ld(t,Ud);const r=Ld(t.firestore,If),i=zf(r);let o;return o="string"==typeof(e=v(e))||e instanceof Ff?nm(i,"updateDoc",t._key,e,n,s):em(i,"updateDoc",t._key,e),rg(r,[o.toMutation(t._key,Vo.exists(!0))])}function tg(t){return rg(Ld(t.firestore,If),[new Wo(t._key,Vo.none())])}function eg(t,e){const n=Ld(t.firestore,If),s=jd(t),r=Fm(t.converter,e);return rg(n,[Hf(zf(t.firestore),"addDoc",s._key,r,null!==t.converter,{}).toMutation(s._key,Vo.exists(!1))]).then((()=>s))}function ng(t,...e){var n,s,r;t=v(t);let i={includeMetadataChanges:!1},o=0;"object"!=typeof e[o]||yf(e[o])||(i=e[o],o++);const a={includeMetadataChanges:i.includeMetadataChanges};if(yf(e[o])){const t=e[o];e[o]=null===(n=t.next)||void 0===n?void 0:n.bind(t),e[o+1]=null===(s=t.error)||void 0===s?void 0:s.bind(t),e[o+2]=null===(r=t.complete)||void 0===r?void 0:r.bind(t);}let u,c,h;if(t instanceof Ud)c=Ld(t.firestore,If),h=so(t._key.path),u={next:n=>{e[o]&&e[o](ig(c,t,n));},error:e[o+1],complete:e[o+2]};else {const n=Ld(t,Bd);c=Ld(n.firestore,If),h=n._query;const s=new Qm(c);u={next:t=>{e[o]&&e[o](new Gm(c,s,n,t));},error:e[o+1],complete:e[o+2]},pm(t._query);}return function(t,e,n,s){const r=new Hd(s),i=new Ul(e,r,n);return t.asyncQueue.enqueueAndForget((async()=>Ml(await df(t),i))),()=>{r.bc(),t.asyncQueue.enqueueAndForget((async()=>Ol(await df(t),i)));}}(Tf(c),h,a,u)}function sg(t,e){return function(t,e){const n=new Hd(e);return t.asyncQueue.enqueueAndForget((async()=>function(t,e){qs(t).bu.add(e),e.next();}(await df(t),n))),()=>{n.bc(),t.asyncQueue.enqueueAndForget((async()=>function(t,e){qs(t).bu.delete(e);}(await df(t),n)));}}(Tf(t=Ld(t,If)),yf(e)?e:{next:e})}function rg(t,e){return function(t,e){const n=new js;return t.asyncQueue.enqueueAndForget((async()=>async function(t,e,n){const s=Td(t);try{const t=await function(t,e){const n=qs(t),s=ir.now(),r=e.reduce(((t,e)=>t.add(e.key)),fa());let i,o;return n.persistence.runTransaction("Locally write mutations","readwrite",(t=>{let a=ra(),u=fa();return n.Gi.getEntries(t,r).next((t=>{a=t,a.forEach(((t,e)=>{e.isValidDocument()||(u=u.add(t));}));})).next((()=>n.localDocuments.getOverlayedDocuments(t,a))).next((r=>{i=r;const o=[];for(const t of e){const e=Go(t,i.get(t.key).overlayedDocument);null!=e&&o.push(new $o(t.key,e,ki(e.value.mapValue),Vo.exists(!0)));}return n.mutationQueue.addMutationBatch(t,s,o,e)})).next((e=>{o=e;const s=e.applyToLocalDocumentSet(i,u);return n.documentOverlayCache.saveOverlays(t,e.batchId,s)}))})).then((()=>({batchId:o.batchId,changes:aa(i)})))}(s.localStore,e);s.sharedClientState.addPendingMutation(t.batchId),function(t,e,n){let s=t.hc[t.currentUser.toKey()];s||(s=new Gr(nr)),s=s.insert(e,n),t.hc[t.currentUser.toKey()]=s;}(s,t.batchId,n),await ld(s,t.changes),await ml(s.remoteStore);}catch(t){const e=xl(t,"Failed to persist write");n.reject(e);}}(await hf(t),e,n))),n.promise}(Tf(t),e)}function ig(t,e,n){const s=n.docs.get(e._key),r=new Qm(t);return new Bm(t,r,e._key,s,new Um(n.hasPendingWrites,n.fromCache),e.converter)}function og(t,e){return Qd(t.query,e.query)&&y(t.data(),e.data())}function ag(t){const e=Ld(t.firestore,If);return function(t,e,n){const s=new js;return t.asyncQueue.enqueueAndForget((async()=>{try{if(al(await cf(t))){const r=await lf(t),i=new Jd(e,r,n).run();s.resolve(i);}else s.reject(new Ks(Gs.UNAVAILABLE,"Failed to get count result because the client is offline."));}catch(t){s.reject(t);}})),s.promise}(Tf(e),t,new Qm(e))}const ug={maxAttempts:5};class cg{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=zf(t);}set(t,e,n){this._verifyNotCommitted();const s=hg(t,this._firestore),r=Fm(s.converter,e,n),i=Hf(this._dataReader,"WriteBatch.set",s._key,r,null!==s.converter,n);return this._mutations.push(i.toMutation(s._key,Vo.none())),this}update(t,e,n,...s){this._verifyNotCommitted();const r=hg(t,this._firestore);let i;return i="string"==typeof(e=v(e))||e instanceof Ff?nm(this._dataReader,"WriteBatch.update",r._key,e,n,s):em(this._dataReader,"WriteBatch.update",r._key,e),this._mutations.push(i.toMutation(r._key,Vo.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=hg(t,this._firestore);return this._mutations=this._mutations.concat(new Wo(e._key,Vo.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new Ks(Gs.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function hg(t,e){if((t=v(t)).firestore!==e)throw new Ks(Gs.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return t}class lg extends class{constructor(t,e){this._firestore=t,this._transaction=e,this._dataReader=zf(t);}get(t){const e=hg(t,this._firestore),n=new Pm(this._firestore);return this._transaction.lookup([e._key]).then((t=>{if(!t||1!==t.length)return Ps();const s=t[0];if(s.isFoundDocument())return new fm(this._firestore,n,s.key,s,e.converter);if(s.isNoDocument())return new fm(this._firestore,n,e._key,null,e.converter);throw Ps()}))}set(t,e,n){const s=hg(t,this._firestore),r=Fm(s.converter,e,n),i=Hf(this._dataReader,"Transaction.set",s._key,r,null!==s.converter,n);return this._transaction.set(s._key,i),this}update(t,e,n,...s){const r=hg(t,this._firestore);let i;return i="string"==typeof(e=v(e))||e instanceof Ff?nm(this._dataReader,"Transaction.update",r._key,e,n,s):em(this._dataReader,"Transaction.update",r._key,e),this._transaction.update(r._key,i),this}delete(t){const e=hg(t,this._firestore);return this._transaction.delete(e._key),this}}{constructor(t,e){super(t,e),this._firestore=t;}get(t){const e=hg(t,this._firestore),n=new Qm(this._firestore);return super.get(t).then((t=>new Bm(this._firestore,n,e._key,t._document,new Um(!1,!1),e.converter)))}}function dg(t,e,n){t=Ld(t,If);const s=Object.assign(Object.assign({},ug),n);return function(t){if(t.maxAttempts<1)throw new Ks(Gs.INVALID_ARGUMENT,"Max attempts must be at least 1")}(s),function(t,e,n){const s=new js;return t.asyncQueue.enqueueAndForget((async()=>{const r=await lf(t);new tf(t.asyncQueue,r,n,e,s).run();})),s.promise}(Tf(t),(n=>e(new lg(t,n))),s)}function fg(){return new Wf("deleteField")}function mg(){return new Xf("serverTimestamp")}function gg(...t){return new Jf("arrayUnion",t)}function pg(...t){return new Zf("arrayRemove",t)}function yg(t){return new tm("increment",t)}function wg(t){return Tf(t=Ld(t,If)),new cg(t,(e=>rg(t,e)))}function vg(t,e){var n;const s=Tf(t=Ld(t,If));if(!(null===(n=s.offlineComponents)||void 0===n?void 0:n.indexBackfillerScheduler))return Vs("Cannot enable indexes when persistence is disabled"),Promise.resolve();const r=function(t){const e="string"==typeof t?function(t){var e;try{return JSON.parse(t)}catch(t){throw new Ks(Gs.INVALID_ARGUMENT,"Failed to parse JSON: "+(null===(e=t)||void 0===e?void 0:e.message))}}(t):t,n=[];if(Array.isArray(e.indexes))for(const t of e.indexes){const e=Ig(t,"collectionGroup"),s=[];if(Array.isArray(t.fields))for(const e of t.fields){const t=hm("setIndexConfiguration",Ig(e,"fieldPath"));"CONTAINS"===e.arrayConfig?s.push(new pr(t,2)):"ASCENDING"===e.order?s.push(new pr(t,0)):"DESCENDING"===e.order&&s.push(new pr(t,1));}n.push(new dr(dr.UNKNOWN_ID,e,s,wr.empty()));}return n}(e);return uf(s).then((t=>async function(t,e){const n=qs(t),s=n.indexManager,r=[];return n.persistence.runTransaction("Configure indexes","readwrite",(t=>s.getFieldIndexes(t).next((n=>function(t,e,n,s,r){t=[...t],e=[...e],t.sort(n),e.sort(n);const i=t.length,o=e.length;let a=0,u=0;for(;a<o&&u<i;){const i=n(t[u],e[a]);i<0?r(t[u++]):i>0?s(e[a++]):(a++,u++);}for(;a<o;)s(e[a++]);for(;u<i;)r(t[u++]);}(n,e,gr,(e=>{r.push(s.addFieldIndex(t,e));}),(e=>{r.push(s.deleteFieldIndex(t,e));})))).next((()=>Ar.waitFor(r)))))}(t,r)))}function Ig(t,e){if("string"!=typeof t[e])throw new Ks(Gs.INVALID_ARGUMENT,"Missing string value for: "+e);return t[e]}!function(n,s=!0){Ns=SDK_VERSION,_registerComponent(new I("firestore",((t,{instanceIdentifier:e,options:n})=>{const r=t.getProvider("app").getImmediate(),i=new If(new Hs(t.getProvider("auth-internal")),new Js(t.getProvider("app-check-internal")),function(t,e){if(!Object.prototype.hasOwnProperty.apply(t.options,["projectId"]))throw new Ks(Gs.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new ii(t.options.projectId,e)}(r,e),r);return n=Object.assign({useFetchStreams:s},n),i._setSettings(n),i}),"PUBLIC").setMultipleInstances(!0)),registerVersion(xs,"3.6.0",n),registerVersion(xs,"3.6.0","esm2017");}();

    var firebase_firestore = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AbstractUserDataWriter: Vm,
        AggregateField: Yd,
        AggregateQuerySnapshot: Xd,
        Bytes: Vf,
        CACHE_SIZE_UNLIMITED: vf,
        CollectionReference: qd,
        DocumentReference: Ud,
        DocumentSnapshot: Bm,
        FieldPath: Ff,
        FieldValue: Uf,
        Firestore: If,
        FirestoreError: Ks,
        GeoPoint: Bf,
        LoadBundleTask: wf,
        Query: Bd,
        QueryConstraint: ym,
        QueryDocumentSnapshot: qm,
        QuerySnapshot: Gm,
        SnapshotMetadata: Um,
        Timestamp: ir,
        Transaction: lg,
        WriteBatch: cg,
        _DatabaseId: ii,
        _DocumentKey: lr,
        _EmptyAppCheckTokenProvider: Zs,
        _EmptyAuthCredentialsProvider: Qs,
        _FieldPath: hr,
        _cast: Ld,
        _debugAssert: Bs,
        _isBase64Available: Wr,
        _logWarn: Vs,
        _validateIsNotUsedTogether: Cd,
        addDoc: eg,
        aggregateQuerySnapshotEqual: og,
        arrayRemove: pg,
        arrayUnion: gg,
        clearIndexedDbPersistence: xf,
        collection: Gd,
        collectionGroup: Kd,
        connectFirestoreEmulator: Pd,
        deleteDoc: tg,
        deleteField: fg,
        disableNetwork: kf,
        doc: jd,
        documentId: Pf,
        enableIndexedDbPersistence: _f,
        enableMultiTabIndexedDbPersistence: Af,
        enableNetwork: Nf,
        endAt: km,
        endBefore: Nm,
        ensureFirestoreConfigured: Tf,
        executeWrite: rg,
        getCountFromServer: ag,
        getDoc: $m,
        getDocFromCache: zm,
        getDocFromServer: Hm,
        getDocs: Wm,
        getDocsFromCache: Ym,
        getDocsFromServer: Xm,
        getFirestore: Ef,
        increment: yg,
        initializeFirestore: bf,
        limit: Sm,
        limitToLast: _m,
        loadBundle: Lf,
        namedQuery: Mf,
        onSnapshot: ng,
        onSnapshotsInSync: sg,
        orderBy: Em,
        query: wm,
        queryEqual: Qd,
        refEqual: $d,
        runTransaction: dg,
        serverTimestamp: mg,
        setDoc: Jm,
        setIndexConfiguration: vg,
        setLogLevel: Ls,
        snapshotEqual: jm,
        startAfter: xm,
        startAt: Dm,
        terminate: Rf,
        updateDoc: Zm,
        waitForPendingWrites: Cf,
        where: Im,
        writeBatch: wg
    });

    [
      ["firebase_core", firebase_app],
      ["firebase_app_check", firebase_app_check],
      ["firebase_remote_config", firebase_remote_config],
      ["firebase_firestore", firebase_firestore]
    ].forEach((b) => {
      window["ff_trigger_" + b[0]] = async (callback) => {
        callback(b[1]);
      };
    });

})();
