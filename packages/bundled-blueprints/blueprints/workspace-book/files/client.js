(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/common/utils.mjs
  var utils_exports = {};
  __export(utils_exports, {
    arrayReplaceAt: () => arrayReplaceAt,
    asciiTrim: () => asciiTrim,
    assign: () => assign,
    escapeHtml: () => escapeHtml,
    escapeRE: () => escapeRE,
    fromCodePoint: () => fromCodePoint2,
    has: () => has,
    isMdAsciiPunct: () => isMdAsciiPunct,
    isPunctChar: () => isPunctChar,
    isPunctCharCode: () => isPunctCharCode,
    isSpace: () => isSpace,
    isString: () => isString,
    isValidEntityCode: () => isValidEntityCode,
    isWhiteSpace: () => isWhiteSpace,
    lib: () => lib,
    normalizeReference: () => normalizeReference,
    unescapeAll: () => unescapeAll,
    unescapeMd: () => unescapeMd
  });

  // node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/index.mjs
  var mdurl_exports = {};
  __export(mdurl_exports, {
    decode: () => decode_default,
    encode: () => encode_default,
    format: () => format,
    parse: () => parse_default
  });

  // node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/decode.mjs
  var decodeCache = {};
  function getDecodeCache(exclude) {
    let cache = decodeCache[exclude];
    if (cache) {
      return cache;
    }
    cache = decodeCache[exclude] = [];
    for (let i = 0; i < 128; i++) {
      const ch = String.fromCharCode(i);
      cache.push(ch);
    }
    for (let i = 0; i < exclude.length; i++) {
      const ch = exclude.charCodeAt(i);
      cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
    }
    return cache;
  }
  __name(getDecodeCache, "getDecodeCache");
  function decode(string, exclude) {
    if (typeof exclude !== "string") {
      exclude = decode.defaultChars;
    }
    const cache = getDecodeCache(exclude);
    return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
      let result = "";
      for (let i = 0, l = seq.length; i < l; i += 3) {
        const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
        if (b1 < 128) {
          result += cache[b1];
          continue;
        }
        if ((b1 & 224) === 192 && i + 3 < l) {
          const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
          if ((b2 & 192) === 128) {
            const chr = b1 << 6 & 1984 | b2 & 63;
            if (chr < 128) {
              result += "\uFFFD\uFFFD";
            } else {
              result += String.fromCharCode(chr);
            }
            i += 3;
            continue;
          }
        }
        if ((b1 & 240) === 224 && i + 6 < l) {
          const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
          const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
          if ((b2 & 192) === 128 && (b3 & 192) === 128) {
            const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
            if (chr < 2048 || chr >= 55296 && chr <= 57343) {
              result += "\uFFFD\uFFFD\uFFFD";
            } else {
              result += String.fromCharCode(chr);
            }
            i += 6;
            continue;
          }
        }
        if ((b1 & 248) === 240 && i + 9 < l) {
          const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
          const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
          const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
          if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
            let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
            if (chr < 65536 || chr > 1114111) {
              result += "\uFFFD\uFFFD\uFFFD\uFFFD";
            } else {
              chr -= 65536;
              result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
            }
            i += 9;
            continue;
          }
        }
        result += "\uFFFD";
      }
      return result;
    });
  }
  __name(decode, "decode");
  decode.defaultChars = ";/?:@&=+$,#";
  decode.componentChars = "";
  var decode_default = decode;

  // node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/encode.mjs
  var encodeCache = {};
  function getEncodeCache(exclude) {
    let cache = encodeCache[exclude];
    if (cache) {
      return cache;
    }
    cache = encodeCache[exclude] = [];
    for (let i = 0; i < 128; i++) {
      const ch = String.fromCharCode(i);
      if (/^[0-9a-z]$/i.test(ch)) {
        cache.push(ch);
      } else {
        cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
      }
    }
    for (let i = 0; i < exclude.length; i++) {
      cache[exclude.charCodeAt(i)] = exclude[i];
    }
    return cache;
  }
  __name(getEncodeCache, "getEncodeCache");
  function encode(string, exclude, keepEscaped) {
    if (typeof exclude !== "string") {
      keepEscaped = exclude;
      exclude = encode.defaultChars;
    }
    if (typeof keepEscaped === "undefined") {
      keepEscaped = true;
    }
    const cache = getEncodeCache(exclude);
    let result = "";
    for (let i = 0, l = string.length; i < l; i++) {
      const code2 = string.charCodeAt(i);
      if (keepEscaped && code2 === 37 && i + 2 < l) {
        if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
          result += string.slice(i, i + 3);
          i += 2;
          continue;
        }
      }
      if (code2 < 128) {
        result += cache[code2];
        continue;
      }
      if (code2 >= 55296 && code2 <= 57343) {
        if (code2 >= 55296 && code2 <= 56319 && i + 1 < l) {
          const nextCode = string.charCodeAt(i + 1);
          if (nextCode >= 56320 && nextCode <= 57343) {
            result += encodeURIComponent(string[i] + string[i + 1]);
            i++;
            continue;
          }
        }
        result += "%EF%BF%BD";
        continue;
      }
      result += encodeURIComponent(string[i]);
    }
    return result;
  }
  __name(encode, "encode");
  encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
  encode.componentChars = "-_.!~*'()";
  var encode_default = encode;

  // node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/format.mjs
  function format(url) {
    let result = "";
    result += url.protocol || "";
    result += url.slashes ? "//" : "";
    result += url.auth ? url.auth + "@" : "";
    if (url.hostname && url.hostname.indexOf(":") !== -1) {
      result += "[" + url.hostname + "]";
    } else {
      result += url.hostname || "";
    }
    result += url.port ? ":" + url.port : "";
    result += url.pathname || "";
    result += url.search || "";
    result += url.hash || "";
    return result;
  }
  __name(format, "format");

  // node_modules/.pnpm/mdurl@2.1.0/node_modules/mdurl/lib/parse.mjs
  function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.pathname = null;
  }
  __name(Url, "Url");
  var protocolPattern = /^([a-z0-9.+-]+:)/i;
  var portPattern = /:[0-9]*$/;
  var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
  var delims = ["<", ">", '"', "`", " ", "\r", "\n", "	"];
  var unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);
  var autoEscape = ["'"].concat(unwise);
  var nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
  var hostEndingChars = ["/", "?", "#"];
  var hostnameMaxLen = 255;
  var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
  var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
  var hostlessProtocol = {
    javascript: true,
    "javascript:": true
  };
  var slashedProtocol = {
    http: true,
    https: true,
    ftp: true,
    gopher: true,
    file: true,
    "http:": true,
    "https:": true,
    "ftp:": true,
    "gopher:": true,
    "file:": true
  };
  function urlParse(url, slashesDenoteHost) {
    if (url && url instanceof Url) return url;
    const u = new Url();
    u.parse(url, slashesDenoteHost);
    return u;
  }
  __name(urlParse, "urlParse");
  Url.prototype.parse = function(url, slashesDenoteHost) {
    let lowerProto, hec, slashes;
    let rest = url;
    rest = rest.trim();
    if (!slashesDenoteHost && url.split("#").length === 1) {
      const simplePath = simplePathPattern.exec(rest);
      if (simplePath) {
        this.pathname = simplePath[1];
        if (simplePath[2]) {
          this.search = simplePath[2];
        }
        return this;
      }
    }
    let proto = protocolPattern.exec(rest);
    if (proto) {
      proto = proto[0];
      lowerProto = proto.toLowerCase();
      this.protocol = proto;
      rest = rest.substr(proto.length);
    }
    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
      slashes = rest.substr(0, 2) === "//";
      if (slashes && !(proto && hostlessProtocol[proto])) {
        rest = rest.substr(2);
        this.slashes = true;
      }
    }
    if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
      let hostEnd = -1;
      for (let i = 0; i < hostEndingChars.length; i++) {
        hec = rest.indexOf(hostEndingChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
          hostEnd = hec;
        }
      }
      let auth, atSign;
      if (hostEnd === -1) {
        atSign = rest.lastIndexOf("@");
      } else {
        atSign = rest.lastIndexOf("@", hostEnd);
      }
      if (atSign !== -1) {
        auth = rest.slice(0, atSign);
        rest = rest.slice(atSign + 1);
        this.auth = auth;
      }
      hostEnd = -1;
      for (let i = 0; i < nonHostChars.length; i++) {
        hec = rest.indexOf(nonHostChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
          hostEnd = hec;
        }
      }
      if (hostEnd === -1) {
        hostEnd = rest.length;
      }
      if (rest[hostEnd - 1] === ":") {
        hostEnd--;
      }
      const host = rest.slice(0, hostEnd);
      rest = rest.slice(hostEnd);
      this.parseHost(host);
      this.hostname = this.hostname || "";
      const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
      if (!ipv6Hostname) {
        const hostparts = this.hostname.split(/\./);
        for (let i = 0, l = hostparts.length; i < l; i++) {
          const part = hostparts[i];
          if (!part) {
            continue;
          }
          if (!part.match(hostnamePartPattern)) {
            let newpart = "";
            for (let j = 0, k = part.length; j < k; j++) {
              if (part.charCodeAt(j) > 127) {
                newpart += "x";
              } else {
                newpart += part[j];
              }
            }
            if (!newpart.match(hostnamePartPattern)) {
              const validParts = hostparts.slice(0, i);
              const notHost = hostparts.slice(i + 1);
              const bit = part.match(hostnamePartStart);
              if (bit) {
                validParts.push(bit[1]);
                notHost.unshift(bit[2]);
              }
              if (notHost.length) {
                rest = notHost.join(".") + rest;
              }
              this.hostname = validParts.join(".");
              break;
            }
          }
        }
      }
      if (this.hostname.length > hostnameMaxLen) {
        this.hostname = "";
      }
      if (ipv6Hostname) {
        this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      }
    }
    const hash = rest.indexOf("#");
    if (hash !== -1) {
      this.hash = rest.substr(hash);
      rest = rest.slice(0, hash);
    }
    const qm = rest.indexOf("?");
    if (qm !== -1) {
      this.search = rest.substr(qm);
      rest = rest.slice(0, qm);
    }
    if (rest) {
      this.pathname = rest;
    }
    if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
      this.pathname = "";
    }
    return this;
  };
  Url.prototype.parseHost = function(host) {
    let port = portPattern.exec(host);
    if (port) {
      port = port[0];
      if (port !== ":") {
        this.port = port.substr(1);
      }
      host = host.substr(0, host.length - port.length);
    }
    if (host) {
      this.hostname = host;
    }
  };
  var parse_default = urlParse;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/index.mjs
  var uc_exports = {};
  __export(uc_exports, {
    Any: () => regex_default,
    Cc: () => regex_default2,
    Cf: () => regex_default3,
    P: () => regex_default4,
    S: () => regex_default5,
    Z: () => regex_default6
  });

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/properties/Any/regex.mjs
  var regex_default = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/categories/Cc/regex.mjs
  var regex_default2 = /[\0-\x1F\x7F-\x9F]/;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/categories/Cf/regex.mjs
  var regex_default3 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/categories/P/regex.mjs
  var regex_default4 = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/categories/S/regex.mjs
  var regex_default5 = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;

  // node_modules/.pnpm/uc.micro@2.1.0/node_modules/uc.micro/categories/Z/regex.mjs
  var regex_default6 = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-html.js
  var decode_data_html_default = new Uint16Array(
    // prettier-ignore
    '\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map((c) => c.charCodeAt(0))
  );

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-xml.js
  var decode_data_xml_default = new Uint16Array(
    // prettier-ignore
    "\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map((c) => c.charCodeAt(0))
  );

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode_codepoint.js
  var _a;
  var decodeMap = /* @__PURE__ */ new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376]
  ]);
  var fromCodePoint = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
    (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
      let output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    }
  );
  function replaceCodePoint(codePoint) {
    var _a2;
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return 65533;
    }
    return (_a2 = decodeMap.get(codePoint)) !== null && _a2 !== void 0 ? _a2 : codePoint;
  }
  __name(replaceCodePoint, "replaceCodePoint");

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode.js
  var CharCodes;
  (function(CharCodes2) {
    CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
    CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
    CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
    CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
    CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
    CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
    CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
    CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
    CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
    CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
    CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
  })(CharCodes || (CharCodes = {}));
  var TO_LOWER_BIT = 32;
  var BinTrieFlags;
  (function(BinTrieFlags2) {
    BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
    BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
  })(BinTrieFlags || (BinTrieFlags = {}));
  function isNumber(code2) {
    return code2 >= CharCodes.ZERO && code2 <= CharCodes.NINE;
  }
  __name(isNumber, "isNumber");
  function isHexadecimalCharacter(code2) {
    return code2 >= CharCodes.UPPER_A && code2 <= CharCodes.UPPER_F || code2 >= CharCodes.LOWER_A && code2 <= CharCodes.LOWER_F;
  }
  __name(isHexadecimalCharacter, "isHexadecimalCharacter");
  function isAsciiAlphaNumeric(code2) {
    return code2 >= CharCodes.UPPER_A && code2 <= CharCodes.UPPER_Z || code2 >= CharCodes.LOWER_A && code2 <= CharCodes.LOWER_Z || isNumber(code2);
  }
  __name(isAsciiAlphaNumeric, "isAsciiAlphaNumeric");
  function isEntityInAttributeInvalidEnd(code2) {
    return code2 === CharCodes.EQUALS || isAsciiAlphaNumeric(code2);
  }
  __name(isEntityInAttributeInvalidEnd, "isEntityInAttributeInvalidEnd");
  var EntityDecoderState;
  (function(EntityDecoderState2) {
    EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
  })(EntityDecoderState || (EntityDecoderState = {}));
  var DecodingMode;
  (function(DecodingMode2) {
    DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
    DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
    DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
  })(DecodingMode || (DecodingMode = {}));
  var EntityDecoder = class {
    static {
      __name(this, "EntityDecoder");
    }
    constructor(decodeTree, emitCodePoint, errors2) {
      this.decodeTree = decodeTree;
      this.emitCodePoint = emitCodePoint;
      this.errors = errors2;
      this.state = EntityDecoderState.EntityStart;
      this.consumed = 1;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.decodeMode = DecodingMode.Strict;
    }
    /** Resets the instance to make it reusable. */
    startEntity(decodeMode) {
      this.decodeMode = decodeMode;
      this.state = EntityDecoderState.EntityStart;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.consumed = 1;
    }
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param string The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(str, offset) {
      switch (this.state) {
        case EntityDecoderState.EntityStart: {
          if (str.charCodeAt(offset) === CharCodes.NUM) {
            this.state = EntityDecoderState.NumericStart;
            this.consumed += 1;
            return this.stateNumericStart(str, offset + 1);
          }
          this.state = EntityDecoderState.NamedEntity;
          return this.stateNamedEntity(str, offset);
        }
        case EntityDecoderState.NumericStart: {
          return this.stateNumericStart(str, offset);
        }
        case EntityDecoderState.NumericDecimal: {
          return this.stateNumericDecimal(str, offset);
        }
        case EntityDecoderState.NumericHex: {
          return this.stateNumericHex(str, offset);
        }
        case EntityDecoderState.NamedEntity: {
          return this.stateNamedEntity(str, offset);
        }
      }
    }
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericStart(str, offset) {
      if (offset >= str.length) {
        return -1;
      }
      if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
        this.state = EntityDecoderState.NumericHex;
        this.consumed += 1;
        return this.stateNumericHex(str, offset + 1);
      }
      this.state = EntityDecoderState.NumericDecimal;
      return this.stateNumericDecimal(str, offset);
    }
    addToNumericResult(str, start, end, base2) {
      if (start !== end) {
        const digitCount = end - start;
        this.result = this.result * Math.pow(base2, digitCount) + parseInt(str.substr(start, digitCount), base2);
        this.consumed += digitCount;
      }
    }
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericHex(str, offset) {
      const startIdx = offset;
      while (offset < str.length) {
        const char = str.charCodeAt(offset);
        if (isNumber(char) || isHexadecimalCharacter(char)) {
          offset += 1;
        } else {
          this.addToNumericResult(str, startIdx, offset, 16);
          return this.emitNumericEntity(char, 3);
        }
      }
      this.addToNumericResult(str, startIdx, offset, 16);
      return -1;
    }
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericDecimal(str, offset) {
      const startIdx = offset;
      while (offset < str.length) {
        const char = str.charCodeAt(offset);
        if (isNumber(char)) {
          offset += 1;
        } else {
          this.addToNumericResult(str, startIdx, offset, 10);
          return this.emitNumericEntity(char, 2);
        }
      }
      this.addToNumericResult(str, startIdx, offset, 10);
      return -1;
    }
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    emitNumericEntity(lastCp, expectedLength) {
      var _a2;
      if (this.consumed <= expectedLength) {
        (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      if (lastCp === CharCodes.SEMI) {
        this.consumed += 1;
      } else if (this.decodeMode === DecodingMode.Strict) {
        return 0;
      }
      this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
      if (this.errors) {
        if (lastCp !== CharCodes.SEMI) {
          this.errors.missingSemicolonAfterCharacterReference();
        }
        this.errors.validateNumericCharacterReference(this.result);
      }
      return this.consumed;
    }
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNamedEntity(str, offset) {
      const { decodeTree } = this;
      let current = decodeTree[this.treeIndex];
      let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      for (; offset < str.length; offset++, this.excess++) {
        const char = str.charCodeAt(offset);
        this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
        if (this.treeIndex < 0) {
          return this.result === 0 || // If we are parsing an attribute
          this.decodeMode === DecodingMode.Attribute && // We shouldn't have consumed any characters after the entity,
          (valueLength === 0 || // And there should be no invalid characters.
          isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
        }
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        if (valueLength !== 0) {
          if (char === CharCodes.SEMI) {
            return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
          }
          if (this.decodeMode !== DecodingMode.Strict) {
            this.result = this.treeIndex;
            this.consumed += this.excess;
            this.excess = 0;
          }
        }
      }
      return -1;
    }
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    emitNotTerminatedNamedEntity() {
      var _a2;
      const { result, decodeTree } = this;
      const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
      this.emitNamedEntityData(result, valueLength, this.consumed);
      (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.missingSemicolonAfterCharacterReference();
      return this.consumed;
    }
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    emitNamedEntityData(result, valueLength, consumed) {
      const { decodeTree } = this;
      this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
      if (valueLength === 3) {
        this.emitCodePoint(decodeTree[result + 2], consumed);
      }
      return consumed;
    }
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    end() {
      var _a2;
      switch (this.state) {
        case EntityDecoderState.NamedEntity: {
          return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
        }
        case EntityDecoderState.NumericDecimal: {
          return this.emitNumericEntity(0, 2);
        }
        case EntityDecoderState.NumericHex: {
          return this.emitNumericEntity(0, 3);
        }
        case EntityDecoderState.NumericStart: {
          (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
          return 0;
        }
        case EntityDecoderState.EntityStart: {
          return 0;
        }
      }
    }
  };
  function getDecoder(decodeTree) {
    let ret = "";
    const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
    return /* @__PURE__ */ __name(function decodeWithTrie(str, decodeMode) {
      let lastIndex = 0;
      let offset = 0;
      while ((offset = str.indexOf("&", offset)) >= 0) {
        ret += str.slice(lastIndex, offset);
        decoder.startEntity(decodeMode);
        const len = decoder.write(
          str,
          // Skip the "&"
          offset + 1
        );
        if (len < 0) {
          lastIndex = offset + decoder.end();
          break;
        }
        lastIndex = offset + len;
        offset = len === 0 ? lastIndex + 1 : lastIndex;
      }
      const result = ret + str.slice(lastIndex);
      ret = "";
      return result;
    }, "decodeWithTrie");
  }
  __name(getDecoder, "getDecoder");
  function determineBranch(decodeTree, current, nodeIdx, char) {
    const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
    if (branchCount === 0) {
      return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
    }
    if (jumpOffset) {
      const value = char - jumpOffset;
      return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
    }
    let lo = nodeIdx;
    let hi = lo + branchCount - 1;
    while (lo <= hi) {
      const mid = lo + hi >>> 1;
      const midVal = decodeTree[mid];
      if (midVal < char) {
        lo = mid + 1;
      } else if (midVal > char) {
        hi = mid - 1;
      } else {
        return decodeTree[mid + branchCount];
      }
    }
    return -1;
  }
  __name(determineBranch, "determineBranch");
  var htmlDecoder = getDecoder(decode_data_html_default);
  var xmlDecoder = getDecoder(decode_data_xml_default);
  function decodeHTML(str, mode = DecodingMode.Legacy) {
    return htmlDecoder(str, mode);
  }
  __name(decodeHTML, "decodeHTML");
  function decodeHTMLStrict(str) {
    return htmlDecoder(str, DecodingMode.Strict);
  }
  __name(decodeHTMLStrict, "decodeHTMLStrict");

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/encode-html.js
  function restoreDiff(arr) {
    for (let i = 1; i < arr.length; i++) {
      arr[i][0] += arr[i - 1][0] + 1;
    }
    return arr;
  }
  __name(restoreDiff, "restoreDiff");
  var encode_html_default = new Map(/* @__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: new Map(/* @__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/escape.js
  var xmlCodeMap = /* @__PURE__ */ new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [39, "&apos;"],
    [60, "&lt;"],
    [62, "&gt;"]
  ]);
  var getCodePoint = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index)
    )
  );
  function getEscaper(regex, map2) {
    return /* @__PURE__ */ __name(function escape4(data) {
      let match2;
      let lastIdx = 0;
      let result = "";
      while (match2 = regex.exec(data)) {
        if (lastIdx !== match2.index) {
          result += data.substring(lastIdx, match2.index);
        }
        result += map2.get(match2[0].charCodeAt(0));
        lastIdx = match2.index + 1;
      }
      return result + data.substring(lastIdx);
    }, "escape");
  }
  __name(getEscaper, "getEscaper");
  var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
  var escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [160, "&nbsp;"]
  ]));
  var escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [160, "&nbsp;"]
  ]));

  // node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/index.js
  var EntityLevel;
  (function(EntityLevel2) {
    EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
    EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
  })(EntityLevel || (EntityLevel = {}));
  var EncodingMode;
  (function(EncodingMode2) {
    EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
    EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
    EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
    EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
    EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
  })(EncodingMode || (EncodingMode = {}));

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/common/utils.mjs
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  __name(_class, "_class");
  function isString(obj) {
    return _class(obj) === "[object String]";
  }
  __name(isString, "isString");
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  function has(object, key) {
    return _hasOwnProperty.call(object, key);
  }
  __name(has, "has");
  function assign(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      if (!source) {
        return;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be object");
      }
      Object.keys(source).forEach(function(key) {
        obj[key] = source[key];
      });
    });
    return obj;
  }
  __name(assign, "assign");
  function arrayReplaceAt(src, pos, newElements) {
    return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
  }
  __name(arrayReplaceAt, "arrayReplaceAt");
  function isValidEntityCode(c) {
    if (c >= 55296 && c <= 57343) {
      return false;
    }
    if (c >= 64976 && c <= 65007) {
      return false;
    }
    if ((c & 65535) === 65535 || (c & 65535) === 65534) {
      return false;
    }
    if (c >= 0 && c <= 8) {
      return false;
    }
    if (c === 11) {
      return false;
    }
    if (c >= 14 && c <= 31) {
      return false;
    }
    if (c >= 127 && c <= 159) {
      return false;
    }
    if (c > 1114111) {
      return false;
    }
    return true;
  }
  __name(isValidEntityCode, "isValidEntityCode");
  function fromCodePoint2(c) {
    if (c > 65535) {
      c -= 65536;
      const surrogate1 = 55296 + (c >> 10);
      const surrogate2 = 56320 + (c & 1023);
      return String.fromCharCode(surrogate1, surrogate2);
    }
    return String.fromCharCode(c);
  }
  __name(fromCodePoint2, "fromCodePoint");
  var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
  var ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
  var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + "|" + ENTITY_RE.source, "gi");
  var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
  function replaceEntityPattern(match2, name) {
    if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
      const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      if (isValidEntityCode(code2)) {
        return fromCodePoint2(code2);
      }
      return match2;
    }
    const decoded = decodeHTML(match2);
    if (decoded !== match2) {
      return decoded;
    }
    return match2;
  }
  __name(replaceEntityPattern, "replaceEntityPattern");
  function unescapeMd(str) {
    if (str.indexOf("\\") < 0) {
      return str;
    }
    return str.replace(UNESCAPE_MD_RE, "$1");
  }
  __name(unescapeMd, "unescapeMd");
  function unescapeAll(str) {
    if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) {
      return str;
    }
    return str.replace(UNESCAPE_ALL_RE, function(match2, escaped, entity2) {
      if (escaped) {
        return escaped;
      }
      return replaceEntityPattern(match2, entity2);
    });
  }
  __name(unescapeAll, "unescapeAll");
  var HTML_ESCAPE_TEST_RE = /[&<>"]/;
  var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
  var HTML_REPLACEMENTS = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  };
  function replaceUnsafeChar(ch) {
    return HTML_REPLACEMENTS[ch];
  }
  __name(replaceUnsafeChar, "replaceUnsafeChar");
  function escapeHtml(str) {
    if (HTML_ESCAPE_TEST_RE.test(str)) {
      return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
    }
    return str;
  }
  __name(escapeHtml, "escapeHtml");
  var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
  function escapeRE(str) {
    return str.replace(REGEXP_ESCAPE_RE, "\\$&");
  }
  __name(escapeRE, "escapeRE");
  function isSpace(code2) {
    switch (code2) {
      case 9:
      case 32:
        return true;
    }
    return false;
  }
  __name(isSpace, "isSpace");
  function isWhiteSpace(code2) {
    if (code2 >= 8192 && code2 <= 8202) {
      return true;
    }
    switch (code2) {
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 32:
      case 160:
      case 5760:
      case 8239:
      case 8287:
      case 12288:
        return true;
    }
    return false;
  }
  __name(isWhiteSpace, "isWhiteSpace");
  function isPunctChar(ch) {
    return regex_default4.test(ch) || regex_default5.test(ch);
  }
  __name(isPunctChar, "isPunctChar");
  function isPunctCharCode(code2) {
    return isPunctChar(fromCodePoint2(code2));
  }
  __name(isPunctCharCode, "isPunctCharCode");
  function isMdAsciiPunct(ch) {
    switch (ch) {
      case 33:
      case 34:
      case 35:
      case 36:
      case 37:
      case 38:
      case 39:
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
      case 58:
      case 59:
      case 60:
      case 61:
      case 62:
      case 63:
      case 64:
      case 91:
      case 92:
      case 93:
      case 94:
      case 95:
      case 96:
      case 123:
      case 124:
      case 125:
      case 126:
        return true;
      default:
        return false;
    }
  }
  __name(isMdAsciiPunct, "isMdAsciiPunct");
  function normalizeReference(str) {
    str = str.trim().replace(/\s+/g, " ");
    if ("\u1E9E".toLowerCase() === "\u1E7E") {
      str = str.replace(/ẞ/g, "\xDF");
    }
    return str.toLowerCase().toUpperCase();
  }
  __name(normalizeReference, "normalizeReference");
  function isAsciiTrimmable(c) {
    return c === 32 || c === 9 || c === 10 || c === 13;
  }
  __name(isAsciiTrimmable, "isAsciiTrimmable");
  function asciiTrim(str) {
    let start = 0;
    for (; start < str.length; start++) {
      if (!isAsciiTrimmable(str.charCodeAt(start))) {
        break;
      }
    }
    let end = str.length - 1;
    for (; end >= start; end--) {
      if (!isAsciiTrimmable(str.charCodeAt(end))) {
        break;
      }
    }
    return str.slice(start, end + 1);
  }
  __name(asciiTrim, "asciiTrim");
  var lib = { mdurl: mdurl_exports, ucmicro: uc_exports };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/helpers/index.mjs
  var helpers_exports = {};
  __export(helpers_exports, {
    parseLinkDestination: () => parseLinkDestination,
    parseLinkLabel: () => parseLinkLabel,
    parseLinkTitle: () => parseLinkTitle
  });

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/helpers/parse_link_label.mjs
  function parseLinkLabel(state, start, disableNested) {
    let level, found, marker, prevPos;
    const max = state.posMax;
    const oldPos = state.pos;
    state.pos = start + 1;
    level = 1;
    while (state.pos < max) {
      marker = state.src.charCodeAt(state.pos);
      if (marker === 93) {
        level--;
        if (level === 0) {
          found = true;
          break;
        }
      }
      prevPos = state.pos;
      state.md.inline.skipToken(state);
      if (marker === 91) {
        if (prevPos === state.pos - 1) {
          level++;
        } else if (disableNested) {
          state.pos = oldPos;
          return -1;
        }
      }
    }
    let labelEnd = -1;
    if (found) {
      labelEnd = state.pos;
    }
    state.pos = oldPos;
    return labelEnd;
  }
  __name(parseLinkLabel, "parseLinkLabel");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/helpers/parse_link_destination.mjs
  function parseLinkDestination(str, start, max) {
    let code2;
    let pos = start;
    const result = {
      ok: false,
      pos: 0,
      str: ""
    };
    if (str.charCodeAt(pos) === 60) {
      pos++;
      while (pos < max) {
        code2 = str.charCodeAt(pos);
        if (code2 === 10) {
          return result;
        }
        if (code2 === 60) {
          return result;
        }
        if (code2 === 62) {
          result.pos = pos + 1;
          result.str = unescapeAll(str.slice(start + 1, pos));
          result.ok = true;
          return result;
        }
        if (code2 === 92 && pos + 1 < max) {
          pos += 2;
          continue;
        }
        pos++;
      }
      return result;
    }
    let level = 0;
    while (pos < max) {
      code2 = str.charCodeAt(pos);
      if (code2 === 32) {
        break;
      }
      if (code2 < 32 || code2 === 127) {
        break;
      }
      if (code2 === 92 && pos + 1 < max) {
        if (str.charCodeAt(pos + 1) === 32) {
          break;
        }
        pos += 2;
        continue;
      }
      if (code2 === 40) {
        level++;
        if (level > 32) {
          return result;
        }
      }
      if (code2 === 41) {
        if (level === 0) {
          break;
        }
        level--;
      }
      pos++;
    }
    if (start === pos) {
      return result;
    }
    if (level !== 0) {
      return result;
    }
    result.str = unescapeAll(str.slice(start, pos));
    result.pos = pos;
    result.ok = true;
    return result;
  }
  __name(parseLinkDestination, "parseLinkDestination");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/helpers/parse_link_title.mjs
  function parseLinkTitle(str, start, max, prev_state) {
    let code2;
    let pos = start;
    const state = {
      // if `true`, this is a valid link title
      ok: false,
      // if `true`, this link can be continued on the next line
      can_continue: false,
      // if `ok`, it's the position of the first character after the closing marker
      pos: 0,
      // if `ok`, it's the unescaped title
      str: "",
      // expected closing marker character code
      marker: 0
    };
    if (prev_state) {
      state.str = prev_state.str;
      state.marker = prev_state.marker;
    } else {
      if (pos >= max) {
        return state;
      }
      let marker = str.charCodeAt(pos);
      if (marker !== 34 && marker !== 39 && marker !== 40) {
        return state;
      }
      start++;
      pos++;
      if (marker === 40) {
        marker = 41;
      }
      state.marker = marker;
    }
    while (pos < max) {
      code2 = str.charCodeAt(pos);
      if (code2 === state.marker) {
        state.pos = pos + 1;
        state.str += unescapeAll(str.slice(start, pos));
        state.ok = true;
        return state;
      } else if (code2 === 40 && state.marker === 41) {
        return state;
      } else if (code2 === 92 && pos + 1 < max) {
        pos++;
      }
      pos++;
    }
    state.can_continue = true;
    state.str += unescapeAll(str.slice(start, pos));
    return state;
  }
  __name(parseLinkTitle, "parseLinkTitle");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/renderer.mjs
  var default_rules = {};
  default_rules.code_inline = function(tokens, idx, options, env, slf) {
    const token = tokens[idx];
    return "<code" + slf.renderAttrs(token) + ">" + escapeHtml(token.content) + "</code>";
  };
  default_rules.code_block = function(tokens, idx, options, env, slf) {
    const token = tokens[idx];
    return "<pre" + slf.renderAttrs(token) + "><code>" + escapeHtml(tokens[idx].content) + "</code></pre>\n";
  };
  default_rules.fence = function(tokens, idx, options, env, slf) {
    const token = tokens[idx];
    const info = token.info ? unescapeAll(token.info).trim() : "";
    let langName = "";
    let langAttrs = "";
    if (info) {
      const arr = info.split(/(\s+)/g);
      langName = arr[0];
      langAttrs = arr.slice(2).join("");
    }
    let highlighted;
    if (options.highlight) {
      highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
    } else {
      highlighted = escapeHtml(token.content);
    }
    if (highlighted.indexOf("<pre") === 0) {
      return highlighted + "\n";
    }
    if (info) {
      const i = token.attrIndex("class");
      const tmpAttrs = token.attrs ? token.attrs.slice() : [];
      if (i < 0) {
        tmpAttrs.push(["class", options.langPrefix + langName]);
      } else {
        tmpAttrs[i] = tmpAttrs[i].slice();
        tmpAttrs[i][1] += " " + options.langPrefix + langName;
      }
      const tmpToken = {
        attrs: tmpAttrs
      };
      return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>
`;
    }
    return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>
`;
  };
  default_rules.image = function(tokens, idx, options, env, slf) {
    const token = tokens[idx];
    token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
    return slf.renderToken(tokens, idx, options);
  };
  default_rules.hardbreak = function(tokens, idx, options) {
    return options.xhtmlOut ? "<br />\n" : "<br>\n";
  };
  default_rules.softbreak = function(tokens, idx, options) {
    return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
  };
  default_rules.text = function(tokens, idx) {
    return escapeHtml(tokens[idx].content);
  };
  default_rules.html_block = function(tokens, idx) {
    return tokens[idx].content;
  };
  default_rules.html_inline = function(tokens, idx) {
    return tokens[idx].content;
  };
  function Renderer() {
    this.rules = assign({}, default_rules);
  }
  __name(Renderer, "Renderer");
  Renderer.prototype.renderAttrs = /* @__PURE__ */ __name(function renderAttrs(token) {
    let i, l, result;
    if (!token.attrs) {
      return "";
    }
    result = "";
    for (i = 0, l = token.attrs.length; i < l; i++) {
      result += " " + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
    }
    return result;
  }, "renderAttrs");
  Renderer.prototype.renderToken = /* @__PURE__ */ __name(function renderToken(tokens, idx, options) {
    const token = tokens[idx];
    let result = "";
    if (token.hidden) {
      return "";
    }
    if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
      result += "\n";
    }
    result += (token.nesting === -1 ? "</" : "<") + token.tag;
    result += this.renderAttrs(token);
    if (token.nesting === 0 && options.xhtmlOut) {
      result += " /";
    }
    let needLf = false;
    if (token.block) {
      needLf = true;
      if (token.nesting === 1) {
        if (idx + 1 < tokens.length) {
          const nextToken = tokens[idx + 1];
          if (nextToken.type === "inline" || nextToken.hidden) {
            needLf = false;
          } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
            needLf = false;
          }
        }
      }
    }
    result += needLf ? ">\n" : ">";
    return result;
  }, "renderToken");
  Renderer.prototype.renderInline = function(tokens, options, env) {
    let result = "";
    const rules = this.rules;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;
      if (typeof rules[type] !== "undefined") {
        result += rules[type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }
    return result;
  };
  Renderer.prototype.renderInlineAsText = function(tokens, options, env) {
    let result = "";
    for (let i = 0, len = tokens.length; i < len; i++) {
      switch (tokens[i].type) {
        case "text":
          result += tokens[i].content;
          break;
        case "image":
          result += this.renderInlineAsText(tokens[i].children, options, env);
          break;
        case "html_inline":
        case "html_block":
          result += tokens[i].content;
          break;
        case "softbreak":
        case "hardbreak":
          result += "\n";
          break;
        default:
      }
    }
    return result;
  };
  Renderer.prototype.render = function(tokens, options, env) {
    let result = "";
    const rules = this.rules;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const type = tokens[i].type;
      if (type === "inline") {
        result += this.renderInline(tokens[i].children, options, env);
      } else if (typeof rules[type] !== "undefined") {
        result += rules[type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options, env);
      }
    }
    return result;
  };
  var renderer_default = Renderer;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/ruler.mjs
  function Ruler() {
    this.__rules__ = [];
    this.__cache__ = null;
  }
  __name(Ruler, "Ruler");
  Ruler.prototype.__find__ = function(name) {
    for (let i = 0; i < this.__rules__.length; i++) {
      if (this.__rules__[i].name === name) {
        return i;
      }
    }
    return -1;
  };
  Ruler.prototype.__compile__ = function() {
    const self = this;
    const chains = [""];
    self.__rules__.forEach(function(rule) {
      if (!rule.enabled) {
        return;
      }
      rule.alt.forEach(function(altName) {
        if (chains.indexOf(altName) < 0) {
          chains.push(altName);
        }
      });
    });
    self.__cache__ = {};
    chains.forEach(function(chain) {
      self.__cache__[chain] = [];
      self.__rules__.forEach(function(rule) {
        if (!rule.enabled) {
          return;
        }
        if (chain && rule.alt.indexOf(chain) < 0) {
          return;
        }
        self.__cache__[chain].push(rule.fn);
      });
    });
  };
  Ruler.prototype.at = function(name, fn, options) {
    const index = this.__find__(name);
    const opt = options || {};
    if (index === -1) {
      throw new Error("Parser rule not found: " + name);
    }
    this.__rules__[index].fn = fn;
    this.__rules__[index].alt = opt.alt || [];
    this.__cache__ = null;
  };
  Ruler.prototype.before = function(beforeName, ruleName, fn, options) {
    const index = this.__find__(beforeName);
    const opt = options || {};
    if (index === -1) {
      throw new Error("Parser rule not found: " + beforeName);
    }
    this.__rules__.splice(index, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || []
    });
    this.__cache__ = null;
  };
  Ruler.prototype.after = function(afterName, ruleName, fn, options) {
    const index = this.__find__(afterName);
    const opt = options || {};
    if (index === -1) {
      throw new Error("Parser rule not found: " + afterName);
    }
    this.__rules__.splice(index + 1, 0, {
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || []
    });
    this.__cache__ = null;
  };
  Ruler.prototype.push = function(ruleName, fn, options) {
    const opt = options || {};
    this.__rules__.push({
      name: ruleName,
      enabled: true,
      fn,
      alt: opt.alt || []
    });
    this.__cache__ = null;
  };
  Ruler.prototype.enable = function(list2, ignoreInvalid) {
    if (!Array.isArray(list2)) {
      list2 = [list2];
    }
    const result = [];
    list2.forEach(function(name) {
      const idx = this.__find__(name);
      if (idx < 0) {
        if (ignoreInvalid) {
          return;
        }
        throw new Error("Rules manager: invalid rule name " + name);
      }
      this.__rules__[idx].enabled = true;
      result.push(name);
    }, this);
    this.__cache__ = null;
    return result;
  };
  Ruler.prototype.enableOnly = function(list2, ignoreInvalid) {
    if (!Array.isArray(list2)) {
      list2 = [list2];
    }
    this.__rules__.forEach(function(rule) {
      rule.enabled = false;
    });
    this.enable(list2, ignoreInvalid);
  };
  Ruler.prototype.disable = function(list2, ignoreInvalid) {
    if (!Array.isArray(list2)) {
      list2 = [list2];
    }
    const result = [];
    list2.forEach(function(name) {
      const idx = this.__find__(name);
      if (idx < 0) {
        if (ignoreInvalid) {
          return;
        }
        throw new Error("Rules manager: invalid rule name " + name);
      }
      this.__rules__[idx].enabled = false;
      result.push(name);
    }, this);
    this.__cache__ = null;
    return result;
  };
  Ruler.prototype.getRules = function(chainName) {
    if (this.__cache__ === null) {
      this.__compile__();
    }
    return this.__cache__[chainName] || [];
  };
  var ruler_default = Ruler;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/token.mjs
  function Token(type, tag, nesting) {
    this.type = type;
    this.tag = tag;
    this.attrs = null;
    this.map = null;
    this.nesting = nesting;
    this.level = 0;
    this.children = null;
    this.content = "";
    this.markup = "";
    this.info = "";
    this.meta = null;
    this.block = false;
    this.hidden = false;
  }
  __name(Token, "Token");
  Token.prototype.attrIndex = /* @__PURE__ */ __name(function attrIndex(name) {
    if (!this.attrs) {
      return -1;
    }
    const attrs = this.attrs;
    for (let i = 0, len = attrs.length; i < len; i++) {
      if (attrs[i][0] === name) {
        return i;
      }
    }
    return -1;
  }, "attrIndex");
  Token.prototype.attrPush = /* @__PURE__ */ __name(function attrPush(attrData) {
    if (this.attrs) {
      this.attrs.push(attrData);
    } else {
      this.attrs = [attrData];
    }
  }, "attrPush");
  Token.prototype.attrSet = /* @__PURE__ */ __name(function attrSet(name, value) {
    const idx = this.attrIndex(name);
    const attrData = [name, value];
    if (idx < 0) {
      this.attrPush(attrData);
    } else {
      this.attrs[idx] = attrData;
    }
  }, "attrSet");
  Token.prototype.attrGet = /* @__PURE__ */ __name(function attrGet(name) {
    const idx = this.attrIndex(name);
    let value = null;
    if (idx >= 0) {
      value = this.attrs[idx][1];
    }
    return value;
  }, "attrGet");
  Token.prototype.attrJoin = /* @__PURE__ */ __name(function attrJoin(name, value) {
    const idx = this.attrIndex(name);
    if (idx < 0) {
      this.attrPush([name, value]);
    } else {
      this.attrs[idx][1] = this.attrs[idx][1] + " " + value;
    }
  }, "attrJoin");
  var token_default = Token;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/state_core.mjs
  function StateCore(src, md2, env) {
    this.src = src;
    this.env = env;
    this.tokens = [];
    this.inlineMode = false;
    this.md = md2;
  }
  __name(StateCore, "StateCore");
  StateCore.prototype.Token = token_default;
  var state_core_default = StateCore;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/normalize.mjs
  var NEWLINES_RE = /\r\n?|\n/g;
  var NULL_RE = /\0/g;
  function normalize(state) {
    let str;
    str = state.src.replace(NEWLINES_RE, "\n");
    str = str.replace(NULL_RE, "\uFFFD");
    state.src = str;
  }
  __name(normalize, "normalize");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/block.mjs
  function block(state) {
    let token;
    if (state.inlineMode) {
      token = new state.Token("inline", "", 0);
      token.content = state.src;
      token.map = [0, 1];
      token.children = [];
      state.tokens.push(token);
    } else {
      state.md.block.parse(state.src, state.md, state.env, state.tokens);
    }
  }
  __name(block, "block");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/inline.mjs
  function inline(state) {
    const tokens = state.tokens;
    for (let i = 0, l = tokens.length; i < l; i++) {
      const tok = tokens[i];
      if (tok.type === "inline") {
        state.md.inline.parse(tok.content, state.md, state.env, tok.children);
      }
    }
  }
  __name(inline, "inline");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/linkify.mjs
  function isLinkOpen(str) {
    return /^<a[>\s]/i.test(str);
  }
  __name(isLinkOpen, "isLinkOpen");
  function isLinkClose(str) {
    return /^<\/a\s*>/i.test(str);
  }
  __name(isLinkClose, "isLinkClose");
  function linkify(state) {
    const blockTokens = state.tokens;
    if (!state.md.options.linkify) {
      return;
    }
    for (let j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== "inline" || !state.md.linkify.pretest(blockTokens[j].content)) {
        continue;
      }
      let tokens = blockTokens[j].children;
      let htmlLinkLevel = 0;
      for (let i = tokens.length - 1; i >= 0; i--) {
        const currentToken = tokens[i];
        if (currentToken.type === "link_close") {
          i--;
          while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") {
            i--;
          }
          continue;
        }
        if (currentToken.type === "html_inline") {
          if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
            htmlLinkLevel--;
          }
          if (isLinkClose(currentToken.content)) {
            htmlLinkLevel++;
          }
        }
        if (htmlLinkLevel > 0) {
          continue;
        }
        if (currentToken.type === "text" && state.md.linkify.test(currentToken.content)) {
          const text3 = currentToken.content;
          let links = state.md.linkify.match(text3);
          const nodes = [];
          let level = currentToken.level;
          let lastPos = 0;
          if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") {
            links = links.slice(1);
          }
          for (let ln = 0; ln < links.length; ln++) {
            const url = links[ln].url;
            const fullUrl = state.md.normalizeLink(url);
            if (!state.md.validateLink(fullUrl)) {
              continue;
            }
            let urlText = links[ln].text;
            if (!links[ln].schema) {
              urlText = state.md.normalizeLinkText("http://" + urlText).replace(/^http:\/\//, "");
            } else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) {
              urlText = state.md.normalizeLinkText("mailto:" + urlText).replace(/^mailto:/, "");
            } else {
              urlText = state.md.normalizeLinkText(urlText);
            }
            const pos = links[ln].index;
            if (pos > lastPos) {
              const token = new state.Token("text", "", 0);
              token.content = text3.slice(lastPos, pos);
              token.level = level;
              nodes.push(token);
            }
            const token_o = new state.Token("link_open", "a", 1);
            token_o.attrs = [["href", fullUrl]];
            token_o.level = level++;
            token_o.markup = "linkify";
            token_o.info = "auto";
            nodes.push(token_o);
            const token_t = new state.Token("text", "", 0);
            token_t.content = urlText;
            token_t.level = level;
            nodes.push(token_t);
            const token_c = new state.Token("link_close", "a", -1);
            token_c.level = --level;
            token_c.markup = "linkify";
            token_c.info = "auto";
            nodes.push(token_c);
            lastPos = links[ln].lastIndex;
          }
          if (lastPos < text3.length) {
            const token = new state.Token("text", "", 0);
            token.content = text3.slice(lastPos);
            token.level = level;
            nodes.push(token);
          }
          blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
        }
      }
    }
  }
  __name(linkify, "linkify");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/replacements.mjs
  var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
  var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
  var SCOPED_ABBR_RE = /\((c|tm|r)\)/ig;
  var SCOPED_ABBR = {
    c: "\xA9",
    r: "\xAE",
    tm: "\u2122"
  };
  function replaceFn(match2, name) {
    return SCOPED_ABBR[name.toLowerCase()];
  }
  __name(replaceFn, "replaceFn");
  function replace_scoped(inlineTokens) {
    let inside_autolink = 0;
    for (let i = inlineTokens.length - 1; i >= 0; i--) {
      const token = inlineTokens[i];
      if (token.type === "text" && !inside_autolink) {
        token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
      }
      if (token.type === "link_open" && token.info === "auto") {
        inside_autolink--;
      }
      if (token.type === "link_close" && token.info === "auto") {
        inside_autolink++;
      }
    }
  }
  __name(replace_scoped, "replace_scoped");
  function replace_rare(inlineTokens) {
    let inside_autolink = 0;
    for (let i = inlineTokens.length - 1; i >= 0; i--) {
      const token = inlineTokens[i];
      if (token.type === "text" && !inside_autolink) {
        if (RARE_RE.test(token.content)) {
          token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1\u2014").replace(/(^|\s)--(?=\s|$)/mg, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1\u2013");
        }
      }
      if (token.type === "link_open" && token.info === "auto") {
        inside_autolink--;
      }
      if (token.type === "link_close" && token.info === "auto") {
        inside_autolink++;
      }
    }
  }
  __name(replace_rare, "replace_rare");
  function replace(state) {
    let blkIdx;
    if (!state.md.options.typographer) {
      return;
    }
    for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
      if (state.tokens[blkIdx].type !== "inline") {
        continue;
      }
      if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
        replace_scoped(state.tokens[blkIdx].children);
      }
      if (RARE_RE.test(state.tokens[blkIdx].content)) {
        replace_rare(state.tokens[blkIdx].children);
      }
    }
  }
  __name(replace, "replace");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/smartquotes.mjs
  var QUOTE_TEST_RE = /['"]/;
  var QUOTE_RE = /['"]/g;
  var APOSTROPHE = "\u2019";
  function addReplacement(replacements, tokenIdx, pos, ch) {
    if (!replacements[tokenIdx]) {
      replacements[tokenIdx] = [];
    }
    replacements[tokenIdx].push({ pos, ch });
  }
  __name(addReplacement, "addReplacement");
  function applyReplacements(str, replacements) {
    let result = "";
    let lastPos = 0;
    replacements.sort((a, b) => a.pos - b.pos);
    for (let i = 0; i < replacements.length; i++) {
      const replacement = replacements[i];
      result += str.slice(lastPos, replacement.pos) + replacement.ch;
      lastPos = replacement.pos + 1;
    }
    return result + str.slice(lastPos);
  }
  __name(applyReplacements, "applyReplacements");
  function process_inlines(tokens, state) {
    let j;
    const stack = [];
    const replacements = {};
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const thisLevel = tokens[i].level;
      for (j = stack.length - 1; j >= 0; j--) {
        if (stack[j].level <= thisLevel) {
          break;
        }
      }
      stack.length = j + 1;
      if (token.type !== "text") {
        continue;
      }
      const text3 = token.content;
      let pos = 0;
      const max = text3.length;
      OUTER:
        while (pos < max) {
          QUOTE_RE.lastIndex = pos;
          const t = QUOTE_RE.exec(text3);
          if (!t) {
            break;
          }
          let canOpen = true;
          let canClose = true;
          pos = t.index + 1;
          const isSingle = t[0] === "'";
          let lastChar = 32;
          if (t.index - 1 >= 0) {
            lastChar = text3.charCodeAt(t.index - 1);
          } else {
            for (j = i - 1; j >= 0; j--) {
              if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
              if (!tokens[j].content) continue;
              lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
              break;
            }
          }
          let nextChar = 32;
          if (pos < max) {
            nextChar = text3.charCodeAt(pos);
          } else {
            for (j = i + 1; j < tokens.length; j++) {
              if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
              if (!tokens[j].content) continue;
              nextChar = tokens[j].content.charCodeAt(0);
              break;
            }
          }
          const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
          const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
          const isLastWhiteSpace = isWhiteSpace(lastChar);
          const isNextWhiteSpace = isWhiteSpace(nextChar);
          if (isNextWhiteSpace) {
            canOpen = false;
          } else if (isNextPunctChar) {
            if (!(isLastWhiteSpace || isLastPunctChar)) {
              canOpen = false;
            }
          }
          if (isLastWhiteSpace) {
            canClose = false;
          } else if (isLastPunctChar) {
            if (!(isNextWhiteSpace || isNextPunctChar)) {
              canClose = false;
            }
          }
          if (nextChar === 34 && t[0] === '"') {
            if (lastChar >= 48 && lastChar <= 57) {
              canClose = canOpen = false;
            }
          }
          if (canOpen && canClose) {
            canOpen = isLastPunctChar;
            canClose = isNextPunctChar;
          }
          if (!canOpen && !canClose) {
            if (isSingle) {
              addReplacement(replacements, i, t.index, APOSTROPHE);
            }
            continue;
          }
          if (canClose) {
            for (j = stack.length - 1; j >= 0; j--) {
              let item = stack[j];
              if (stack[j].level < thisLevel) {
                break;
              }
              if (item.single === isSingle && stack[j].level === thisLevel) {
                item = stack[j];
                let openQuote;
                let closeQuote;
                if (isSingle) {
                  openQuote = state.md.options.quotes[2];
                  closeQuote = state.md.options.quotes[3];
                } else {
                  openQuote = state.md.options.quotes[0];
                  closeQuote = state.md.options.quotes[1];
                }
                addReplacement(replacements, i, t.index, closeQuote);
                addReplacement(replacements, item.token, item.pos, openQuote);
                stack.length = j;
                continue OUTER;
              }
            }
          }
          if (canOpen) {
            stack.push({
              token: i,
              pos: t.index,
              single: isSingle,
              level: thisLevel
            });
          } else if (canClose && isSingle) {
            addReplacement(replacements, i, t.index, APOSTROPHE);
          }
        }
    }
    Object.keys(replacements).forEach(function(tokenIdx) {
      tokens[tokenIdx].content = applyReplacements(tokens[tokenIdx].content, replacements[tokenIdx]);
    });
  }
  __name(process_inlines, "process_inlines");
  function smartquotes(state) {
    if (!state.md.options.typographer) {
      return;
    }
    for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
      if (state.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
        continue;
      }
      process_inlines(state.tokens[blkIdx].children, state);
    }
  }
  __name(smartquotes, "smartquotes");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_core/text_join.mjs
  function text_join(state) {
    let curr, last;
    const blockTokens = state.tokens;
    const l = blockTokens.length;
    for (let j = 0; j < l; j++) {
      if (blockTokens[j].type !== "inline") continue;
      const tokens = blockTokens[j].children;
      const max = tokens.length;
      for (curr = 0; curr < max; curr++) {
        if (tokens[curr].type === "text_special") {
          tokens[curr].type = "text";
        }
      }
      for (curr = last = 0; curr < max; curr++) {
        if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
          tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
        } else {
          if (curr !== last) {
            tokens[last] = tokens[curr];
          }
          last++;
        }
      }
      if (curr !== last) {
        tokens.length = last;
      }
    }
  }
  __name(text_join, "text_join");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/parser_core.mjs
  var _rules = [
    ["normalize", normalize],
    ["block", block],
    ["inline", inline],
    ["linkify", linkify],
    ["replacements", replace],
    ["smartquotes", smartquotes],
    // `text_join` finds `text_special` tokens (for escape sequences)
    // and joins them with the rest of the text
    ["text_join", text_join]
  ];
  function Core() {
    this.ruler = new ruler_default();
    for (let i = 0; i < _rules.length; i++) {
      this.ruler.push(_rules[i][0], _rules[i][1]);
    }
  }
  __name(Core, "Core");
  Core.prototype.process = function(state) {
    const rules = this.ruler.getRules("");
    for (let i = 0, l = rules.length; i < l; i++) {
      rules[i](state);
    }
  };
  Core.prototype.State = state_core_default;
  var parser_core_default = Core;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/state_block.mjs
  function StateBlock(src, md2, env, tokens) {
    this.src = src;
    this.md = md2;
    this.env = env;
    this.tokens = tokens;
    this.bMarks = [];
    this.eMarks = [];
    this.tShift = [];
    this.sCount = [];
    this.bsCount = [];
    this.blkIndent = 0;
    this.line = 0;
    this.lineMax = 0;
    this.tight = false;
    this.ddIndent = -1;
    this.listIndent = -1;
    this.parentType = "root";
    this.level = 0;
    const s = this.src;
    for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
      const ch = s.charCodeAt(pos);
      if (!indent_found) {
        if (isSpace(ch)) {
          indent++;
          if (ch === 9) {
            offset += 4 - offset % 4;
          } else {
            offset++;
          }
          continue;
        } else {
          indent_found = true;
        }
      }
      if (ch === 10 || pos === len - 1) {
        if (ch !== 10) {
          pos++;
        }
        this.bMarks.push(start);
        this.eMarks.push(pos);
        this.tShift.push(indent);
        this.sCount.push(offset);
        this.bsCount.push(0);
        indent_found = false;
        indent = 0;
        offset = 0;
        start = pos + 1;
      }
    }
    this.bMarks.push(s.length);
    this.eMarks.push(s.length);
    this.tShift.push(0);
    this.sCount.push(0);
    this.bsCount.push(0);
    this.lineMax = this.bMarks.length - 1;
  }
  __name(StateBlock, "StateBlock");
  StateBlock.prototype.push = function(type, tag, nesting) {
    const token = new token_default(type, tag, nesting);
    token.block = true;
    if (nesting < 0) this.level--;
    token.level = this.level;
    if (nesting > 0) this.level++;
    this.tokens.push(token);
    return token;
  };
  StateBlock.prototype.isEmpty = /* @__PURE__ */ __name(function isEmpty(line) {
    return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
  }, "isEmpty");
  StateBlock.prototype.skipEmptyLines = /* @__PURE__ */ __name(function skipEmptyLines(from) {
    for (let max = this.lineMax; from < max; from++) {
      if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
        break;
      }
    }
    return from;
  }, "skipEmptyLines");
  StateBlock.prototype.skipSpaces = /* @__PURE__ */ __name(function skipSpaces(pos) {
    for (let max = this.src.length; pos < max; pos++) {
      const ch = this.src.charCodeAt(pos);
      if (!isSpace(ch)) {
        break;
      }
    }
    return pos;
  }, "skipSpaces");
  StateBlock.prototype.skipSpacesBack = /* @__PURE__ */ __name(function skipSpacesBack(pos, min) {
    if (pos <= min) {
      return pos;
    }
    while (pos > min) {
      if (!isSpace(this.src.charCodeAt(--pos))) {
        return pos + 1;
      }
    }
    return pos;
  }, "skipSpacesBack");
  StateBlock.prototype.skipChars = /* @__PURE__ */ __name(function skipChars(pos, code2) {
    for (let max = this.src.length; pos < max; pos++) {
      if (this.src.charCodeAt(pos) !== code2) {
        break;
      }
    }
    return pos;
  }, "skipChars");
  StateBlock.prototype.skipCharsBack = /* @__PURE__ */ __name(function skipCharsBack(pos, code2, min) {
    if (pos <= min) {
      return pos;
    }
    while (pos > min) {
      if (code2 !== this.src.charCodeAt(--pos)) {
        return pos + 1;
      }
    }
    return pos;
  }, "skipCharsBack");
  StateBlock.prototype.getLines = /* @__PURE__ */ __name(function getLines(begin, end, indent, keepLastLF) {
    if (begin >= end) {
      return "";
    }
    const queue = new Array(end - begin);
    for (let i = 0, line = begin; line < end; line++, i++) {
      let lineIndent = 0;
      const lineStart = this.bMarks[line];
      let first = lineStart;
      let last;
      if (line + 1 < end || keepLastLF) {
        last = this.eMarks[line] + 1;
      } else {
        last = this.eMarks[line];
      }
      while (first < last && lineIndent < indent) {
        const ch = this.src.charCodeAt(first);
        if (isSpace(ch)) {
          if (ch === 9) {
            lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
          } else {
            lineIndent++;
          }
        } else if (first - lineStart < this.tShift[line]) {
          lineIndent++;
        } else {
          break;
        }
        first++;
      }
      if (lineIndent > indent) {
        queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
      } else {
        queue[i] = this.src.slice(first, last);
      }
    }
    return queue.join("");
  }, "getLines");
  StateBlock.prototype.Token = token_default;
  var state_block_default = StateBlock;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/table.mjs
  var MAX_AUTOCOMPLETED_CELLS = 65536;
  function getLine(state, line) {
    const pos = state.bMarks[line] + state.tShift[line];
    const max = state.eMarks[line];
    return state.src.slice(pos, max);
  }
  __name(getLine, "getLine");
  function escapedSplit(str) {
    const result = [];
    const max = str.length;
    let pos = 0;
    let ch = str.charCodeAt(pos);
    let isEscaped = false;
    let lastPos = 0;
    let current = "";
    while (pos < max) {
      if (ch === 124) {
        if (!isEscaped) {
          result.push(current + str.substring(lastPos, pos));
          current = "";
          lastPos = pos + 1;
        } else {
          current += str.substring(lastPos, pos - 1);
          lastPos = pos;
        }
      }
      isEscaped = ch === 92;
      pos++;
      ch = str.charCodeAt(pos);
    }
    result.push(current + str.substring(lastPos));
    return result;
  }
  __name(escapedSplit, "escapedSplit");
  function table(state, startLine, endLine, silent) {
    if (startLine + 2 > endLine) {
      return false;
    }
    let nextLine = startLine + 1;
    if (state.sCount[nextLine] < state.blkIndent) {
      return false;
    }
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      return false;
    }
    let pos = state.bMarks[nextLine] + state.tShift[nextLine];
    if (pos >= state.eMarks[nextLine]) {
      return false;
    }
    const firstCh = state.src.charCodeAt(pos++);
    if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) {
      return false;
    }
    if (pos >= state.eMarks[nextLine]) {
      return false;
    }
    const secondCh = state.src.charCodeAt(pos++);
    if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) {
      return false;
    }
    if (firstCh === 45 && isSpace(secondCh)) {
      return false;
    }
    while (pos < state.eMarks[nextLine]) {
      const ch = state.src.charCodeAt(pos);
      if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) {
        return false;
      }
      pos++;
    }
    let lineText = getLine(state, startLine + 1);
    let columns = lineText.split("|");
    const aligns = [];
    for (let i = 0; i < columns.length; i++) {
      const t = columns[i].trim();
      if (!t) {
        if (i === 0 || i === columns.length - 1) {
          continue;
        } else {
          return false;
        }
      }
      if (!/^:?-+:?$/.test(t)) {
        return false;
      }
      if (t.charCodeAt(t.length - 1) === 58) {
        aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
      } else if (t.charCodeAt(0) === 58) {
        aligns.push("left");
      } else {
        aligns.push("");
      }
    }
    lineText = getLine(state, startLine).trim();
    if (lineText.indexOf("|") === -1) {
      return false;
    }
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    columns = escapedSplit(lineText);
    if (columns.length && columns[0] === "") columns.shift();
    if (columns.length && columns[columns.length - 1] === "") columns.pop();
    const columnCount = columns.length;
    if (columnCount === 0 || columnCount !== aligns.length) {
      return false;
    }
    if (silent) {
      return true;
    }
    const oldParentType = state.parentType;
    state.parentType = "table";
    const terminatorRules = state.md.block.ruler.getRules("blockquote");
    const token_to = state.push("table_open", "table", 1);
    const tableLines = [startLine, 0];
    token_to.map = tableLines;
    const token_tho = state.push("thead_open", "thead", 1);
    token_tho.map = [startLine, startLine + 1];
    const token_htro = state.push("tr_open", "tr", 1);
    token_htro.map = [startLine, startLine + 1];
    for (let i = 0; i < columns.length; i++) {
      const token_ho = state.push("th_open", "th", 1);
      if (aligns[i]) {
        token_ho.attrs = [["style", "text-align:" + aligns[i]]];
      }
      const token_il = state.push("inline", "", 0);
      token_il.content = columns[i].trim();
      token_il.children = [];
      state.push("th_close", "th", -1);
    }
    state.push("tr_close", "tr", -1);
    state.push("thead_close", "thead", -1);
    let tbodyLines;
    let autocompletedCells = 0;
    for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) {
        break;
      }
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) {
        break;
      }
      lineText = getLine(state, nextLine).trim();
      if (!lineText) {
        break;
      }
      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        break;
      }
      columns = escapedSplit(lineText);
      if (columns.length && columns[0] === "") columns.shift();
      if (columns.length && columns[columns.length - 1] === "") columns.pop();
      autocompletedCells += columnCount - columns.length;
      if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) {
        break;
      }
      if (nextLine === startLine + 2) {
        const token_tbo = state.push("tbody_open", "tbody", 1);
        token_tbo.map = tbodyLines = [startLine + 2, 0];
      }
      const token_tro = state.push("tr_open", "tr", 1);
      token_tro.map = [nextLine, nextLine + 1];
      for (let i = 0; i < columnCount; i++) {
        const token_tdo = state.push("td_open", "td", 1);
        if (aligns[i]) {
          token_tdo.attrs = [["style", "text-align:" + aligns[i]]];
        }
        const token_il = state.push("inline", "", 0);
        token_il.content = columns[i] ? columns[i].trim() : "";
        token_il.children = [];
        state.push("td_close", "td", -1);
      }
      state.push("tr_close", "tr", -1);
    }
    if (tbodyLines) {
      state.push("tbody_close", "tbody", -1);
      tbodyLines[1] = nextLine;
    }
    state.push("table_close", "table", -1);
    tableLines[1] = nextLine;
    state.parentType = oldParentType;
    state.line = nextLine;
    return true;
  }
  __name(table, "table");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/code.mjs
  function code(state, startLine, endLine) {
    if (state.sCount[startLine] - state.blkIndent < 4) {
      return false;
    }
    let nextLine = startLine + 1;
    let last = nextLine;
    while (nextLine < endLine) {
      if (state.isEmpty(nextLine)) {
        nextLine++;
        continue;
      }
      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        nextLine++;
        last = nextLine;
        continue;
      }
      break;
    }
    state.line = last;
    const token = state.push("code_block", "code", 0);
    token.content = state.getLines(startLine, last, 4 + state.blkIndent, false) + "\n";
    token.map = [startLine, state.line];
    return true;
  }
  __name(code, "code");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/fence.mjs
  function fence(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    if (pos + 3 > max) {
      return false;
    }
    const marker = state.src.charCodeAt(pos);
    if (marker !== 126 && marker !== 96) {
      return false;
    }
    let mem = pos;
    pos = state.skipChars(pos, marker);
    let len = pos - mem;
    if (len < 3) {
      return false;
    }
    const markup = state.src.slice(mem, pos);
    const params = state.src.slice(pos, max);
    if (marker === 96) {
      if (params.indexOf(String.fromCharCode(marker)) >= 0) {
        return false;
      }
    }
    if (silent) {
      return true;
    }
    let nextLine = startLine;
    let haveEndMarker = false;
    for (; ; ) {
      nextLine++;
      if (nextLine >= endLine) {
        break;
      }
      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      if (pos < max && state.sCount[nextLine] < state.blkIndent) {
        break;
      }
      if (state.src.charCodeAt(pos) !== marker) {
        continue;
      }
      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        continue;
      }
      pos = state.skipChars(pos, marker);
      if (pos - mem < len) {
        continue;
      }
      pos = state.skipSpaces(pos);
      if (pos < max) {
        continue;
      }
      haveEndMarker = true;
      break;
    }
    len = state.sCount[startLine];
    state.line = nextLine + (haveEndMarker ? 1 : 0);
    const token = state.push("fence", "code", 0);
    token.info = params;
    token.content = state.getLines(startLine + 1, nextLine, len, true);
    token.markup = markup;
    token.map = [startLine, state.line];
    return true;
  }
  __name(fence, "fence");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/blockquote.mjs
  function blockquote(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];
    const oldLineMax = state.lineMax;
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    if (state.src.charCodeAt(pos) !== 62) {
      return false;
    }
    if (silent) {
      return true;
    }
    const oldBMarks = [];
    const oldBSCount = [];
    const oldSCount = [];
    const oldTShift = [];
    const terminatorRules = state.md.block.ruler.getRules("blockquote");
    const oldParentType = state.parentType;
    state.parentType = "blockquote";
    let lastLineEmpty = false;
    let nextLine;
    for (nextLine = startLine; nextLine < endLine; nextLine++) {
      const isOutdented = state.sCount[nextLine] < state.blkIndent;
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      if (pos >= max) {
        break;
      }
      if (state.src.charCodeAt(pos++) === 62 && !isOutdented) {
        let initial = state.sCount[nextLine] + 1;
        let spaceAfterMarker;
        let adjustTab;
        if (state.src.charCodeAt(pos) === 32) {
          pos++;
          initial++;
          adjustTab = false;
          spaceAfterMarker = true;
        } else if (state.src.charCodeAt(pos) === 9) {
          spaceAfterMarker = true;
          if ((state.bsCount[nextLine] + initial) % 4 === 3) {
            pos++;
            initial++;
            adjustTab = false;
          } else {
            adjustTab = true;
          }
        } else {
          spaceAfterMarker = false;
        }
        let offset = initial;
        oldBMarks.push(state.bMarks[nextLine]);
        state.bMarks[nextLine] = pos;
        while (pos < max) {
          const ch = state.src.charCodeAt(pos);
          if (isSpace(ch)) {
            if (ch === 9) {
              offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
            } else {
              offset++;
            }
          } else {
            break;
          }
          pos++;
        }
        lastLineEmpty = pos >= max;
        oldBSCount.push(state.bsCount[nextLine]);
        state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] = offset - initial;
        oldTShift.push(state.tShift[nextLine]);
        state.tShift[nextLine] = pos - state.bMarks[nextLine];
        continue;
      }
      if (lastLineEmpty) {
        break;
      }
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) {
        state.lineMax = nextLine;
        if (state.blkIndent !== 0) {
          oldBMarks.push(state.bMarks[nextLine]);
          oldBSCount.push(state.bsCount[nextLine]);
          oldTShift.push(state.tShift[nextLine]);
          oldSCount.push(state.sCount[nextLine]);
          state.sCount[nextLine] -= state.blkIndent;
        }
        break;
      }
      oldBMarks.push(state.bMarks[nextLine]);
      oldBSCount.push(state.bsCount[nextLine]);
      oldTShift.push(state.tShift[nextLine]);
      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = -1;
    }
    const oldIndent = state.blkIndent;
    state.blkIndent = 0;
    const token_o = state.push("blockquote_open", "blockquote", 1);
    token_o.markup = ">";
    const lines = [startLine, 0];
    token_o.map = lines;
    state.md.block.tokenize(state, startLine, nextLine);
    const token_c = state.push("blockquote_close", "blockquote", -1);
    token_c.markup = ">";
    state.lineMax = oldLineMax;
    state.parentType = oldParentType;
    lines[1] = state.line;
    for (let i = 0; i < oldTShift.length; i++) {
      state.bMarks[i + startLine] = oldBMarks[i];
      state.tShift[i + startLine] = oldTShift[i];
      state.sCount[i + startLine] = oldSCount[i];
      state.bsCount[i + startLine] = oldBSCount[i];
    }
    state.blkIndent = oldIndent;
    return true;
  }
  __name(blockquote, "blockquote");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/hr.mjs
  function hr(state, startLine, endLine, silent) {
    const max = state.eMarks[startLine];
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    const marker = state.src.charCodeAt(pos++);
    if (marker !== 42 && marker !== 45 && marker !== 95) {
      return false;
    }
    let cnt = 1;
    while (pos < max) {
      const ch = state.src.charCodeAt(pos++);
      if (ch !== marker && !isSpace(ch)) {
        return false;
      }
      if (ch === marker) {
        cnt++;
      }
    }
    if (cnt < 3) {
      return false;
    }
    if (silent) {
      return true;
    }
    state.line = startLine + 1;
    const token = state.push("hr", "hr", 0);
    token.map = [startLine, state.line];
    token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
    return true;
  }
  __name(hr, "hr");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/list.mjs
  function skipBulletListMarker(state, startLine) {
    const max = state.eMarks[startLine];
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    const marker = state.src.charCodeAt(pos++);
    if (marker !== 42 && marker !== 45 && marker !== 43) {
      return -1;
    }
    if (pos < max) {
      const ch = state.src.charCodeAt(pos);
      if (!isSpace(ch)) {
        return -1;
      }
    }
    return pos;
  }
  __name(skipBulletListMarker, "skipBulletListMarker");
  function skipOrderedListMarker(state, startLine) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    let pos = start;
    if (pos + 1 >= max) {
      return -1;
    }
    let ch = state.src.charCodeAt(pos++);
    if (ch < 48 || ch > 57) {
      return -1;
    }
    for (; ; ) {
      if (pos >= max) {
        return -1;
      }
      ch = state.src.charCodeAt(pos++);
      if (ch >= 48 && ch <= 57) {
        if (pos - start >= 10) {
          return -1;
        }
        continue;
      }
      if (ch === 41 || ch === 46) {
        break;
      }
      return -1;
    }
    if (pos < max) {
      ch = state.src.charCodeAt(pos);
      if (!isSpace(ch)) {
        return -1;
      }
    }
    return pos;
  }
  __name(skipOrderedListMarker, "skipOrderedListMarker");
  function markTightParagraphs(state, idx) {
    const level = state.level + 2;
    for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
      if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
        state.tokens[i + 2].hidden = true;
        state.tokens[i].hidden = true;
        i += 2;
      }
    }
  }
  __name(markTightParagraphs, "markTightParagraphs");
  function list(state, startLine, endLine, silent) {
    let max, pos, start, token;
    let nextLine = startLine;
    let tight = true;
    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      return false;
    }
    if (state.listIndent >= 0 && state.sCount[nextLine] - state.listIndent >= 4 && state.sCount[nextLine] < state.blkIndent) {
      return false;
    }
    let isTerminatingParagraph = false;
    if (silent && state.parentType === "paragraph") {
      if (state.sCount[nextLine] >= state.blkIndent) {
        isTerminatingParagraph = true;
      }
    }
    let isOrdered;
    let markerValue;
    let posAfterMarker;
    if ((posAfterMarker = skipOrderedListMarker(state, nextLine)) >= 0) {
      isOrdered = true;
      start = state.bMarks[nextLine] + state.tShift[nextLine];
      markerValue = Number(state.src.slice(start, posAfterMarker - 1));
      if (isTerminatingParagraph && markerValue !== 1) return false;
    } else if ((posAfterMarker = skipBulletListMarker(state, nextLine)) >= 0) {
      isOrdered = false;
    } else {
      return false;
    }
    if (isTerminatingParagraph) {
      if (state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]) return false;
    }
    if (silent) {
      return true;
    }
    const markerCharCode = state.src.charCodeAt(posAfterMarker - 1);
    const listTokIdx = state.tokens.length;
    if (isOrdered) {
      token = state.push("ordered_list_open", "ol", 1);
      if (markerValue !== 1) {
        token.attrs = [["start", markerValue]];
      }
    } else {
      token = state.push("bullet_list_open", "ul", 1);
    }
    const listLines = [nextLine, 0];
    token.map = listLines;
    token.markup = String.fromCharCode(markerCharCode);
    let prevEmptyEnd = false;
    const terminatorRules = state.md.block.ruler.getRules("list");
    const oldParentType = state.parentType;
    state.parentType = "list";
    while (nextLine < endLine) {
      pos = posAfterMarker;
      max = state.eMarks[nextLine];
      const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine]);
      let offset = initial;
      while (pos < max) {
        const ch = state.src.charCodeAt(pos);
        if (ch === 9) {
          offset += 4 - (offset + state.bsCount[nextLine]) % 4;
        } else if (ch === 32) {
          offset++;
        } else {
          break;
        }
        pos++;
      }
      const contentStart = pos;
      let indentAfterMarker;
      if (contentStart >= max) {
        indentAfterMarker = 1;
      } else {
        indentAfterMarker = offset - initial;
      }
      if (indentAfterMarker > 4) {
        indentAfterMarker = 1;
      }
      const indent = initial + indentAfterMarker;
      token = state.push("list_item_open", "li", 1);
      token.markup = String.fromCharCode(markerCharCode);
      const itemLines = [nextLine, 0];
      token.map = itemLines;
      if (isOrdered) {
        token.info = state.src.slice(start, posAfterMarker - 1);
      }
      const oldTight = state.tight;
      const oldTShift = state.tShift[nextLine];
      const oldSCount = state.sCount[nextLine];
      const oldListIndent = state.listIndent;
      state.listIndent = state.blkIndent;
      state.blkIndent = indent;
      state.tight = true;
      state.tShift[nextLine] = contentStart - state.bMarks[nextLine];
      state.sCount[nextLine] = offset;
      if (contentStart >= max && state.isEmpty(nextLine + 1)) {
        state.line = Math.min(state.line + 2, endLine);
      } else {
        state.md.block.tokenize(state, nextLine, endLine, true);
      }
      if (!state.tight || prevEmptyEnd) {
        tight = false;
      }
      prevEmptyEnd = state.line - nextLine > 1 && state.isEmpty(state.line - 1);
      state.blkIndent = state.listIndent;
      state.listIndent = oldListIndent;
      state.tShift[nextLine] = oldTShift;
      state.sCount[nextLine] = oldSCount;
      state.tight = oldTight;
      token = state.push("list_item_close", "li", -1);
      token.markup = String.fromCharCode(markerCharCode);
      nextLine = state.line;
      itemLines[1] = nextLine;
      if (nextLine >= endLine) {
        break;
      }
      if (state.sCount[nextLine] < state.blkIndent) {
        break;
      }
      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        break;
      }
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) {
        break;
      }
      if (isOrdered) {
        posAfterMarker = skipOrderedListMarker(state, nextLine);
        if (posAfterMarker < 0) {
          break;
        }
        start = state.bMarks[nextLine] + state.tShift[nextLine];
      } else {
        posAfterMarker = skipBulletListMarker(state, nextLine);
        if (posAfterMarker < 0) {
          break;
        }
      }
      if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) {
        break;
      }
    }
    if (isOrdered) {
      token = state.push("ordered_list_close", "ol", -1);
    } else {
      token = state.push("bullet_list_close", "ul", -1);
    }
    token.markup = String.fromCharCode(markerCharCode);
    listLines[1] = nextLine;
    state.line = nextLine;
    state.parentType = oldParentType;
    if (tight) {
      markTightParagraphs(state, listTokIdx);
    }
    return true;
  }
  __name(list, "list");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/reference.mjs
  function reference(state, startLine, _endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];
    let nextLine = startLine + 1;
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    if (state.src.charCodeAt(pos) !== 91) {
      return false;
    }
    function getNextLine(nextLine2) {
      const endLine = state.lineMax;
      if (nextLine2 >= endLine || state.isEmpty(nextLine2)) {
        return null;
      }
      let isContinuation = false;
      if (state.sCount[nextLine2] - state.blkIndent > 3) {
        isContinuation = true;
      }
      if (state.sCount[nextLine2] < 0) {
        isContinuation = true;
      }
      if (!isContinuation) {
        const terminatorRules = state.md.block.ruler.getRules("reference");
        const oldParentType = state.parentType;
        state.parentType = "reference";
        let terminate = false;
        for (let i = 0, l = terminatorRules.length; i < l; i++) {
          if (terminatorRules[i](state, nextLine2, endLine, true)) {
            terminate = true;
            break;
          }
        }
        state.parentType = oldParentType;
        if (terminate) {
          return null;
        }
      }
      const pos2 = state.bMarks[nextLine2] + state.tShift[nextLine2];
      const max2 = state.eMarks[nextLine2];
      return state.src.slice(pos2, max2 + 1);
    }
    __name(getNextLine, "getNextLine");
    let str = state.src.slice(pos, max + 1);
    max = str.length;
    let labelEnd = -1;
    for (pos = 1; pos < max; pos++) {
      const ch = str.charCodeAt(pos);
      if (ch === 91) {
        return false;
      } else if (ch === 93) {
        labelEnd = pos;
        break;
      } else if (ch === 10) {
        const lineContent = getNextLine(nextLine);
        if (lineContent !== null) {
          str += lineContent;
          max = str.length;
          nextLine++;
        }
      } else if (ch === 92) {
        pos++;
        if (pos < max && str.charCodeAt(pos) === 10) {
          const lineContent = getNextLine(nextLine);
          if (lineContent !== null) {
            str += lineContent;
            max = str.length;
            nextLine++;
          }
        }
      }
    }
    if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 58) {
      return false;
    }
    for (pos = labelEnd + 2; pos < max; pos++) {
      const ch = str.charCodeAt(pos);
      if (ch === 10) {
        const lineContent = getNextLine(nextLine);
        if (lineContent !== null) {
          str += lineContent;
          max = str.length;
          nextLine++;
        }
      } else if (isSpace(ch)) {
      } else {
        break;
      }
    }
    const destRes = state.md.helpers.parseLinkDestination(str, pos, max);
    if (!destRes.ok) {
      return false;
    }
    const href = state.md.normalizeLink(destRes.str);
    if (!state.md.validateLink(href)) {
      return false;
    }
    pos = destRes.pos;
    const destEndPos = pos;
    const destEndLineNo = nextLine;
    const start = pos;
    for (; pos < max; pos++) {
      const ch = str.charCodeAt(pos);
      if (ch === 10) {
        const lineContent = getNextLine(nextLine);
        if (lineContent !== null) {
          str += lineContent;
          max = str.length;
          nextLine++;
        }
      } else if (isSpace(ch)) {
      } else {
        break;
      }
    }
    let titleRes = state.md.helpers.parseLinkTitle(str, pos, max);
    while (titleRes.can_continue) {
      const lineContent = getNextLine(nextLine);
      if (lineContent === null) break;
      str += lineContent;
      pos = max;
      max = str.length;
      nextLine++;
      titleRes = state.md.helpers.parseLinkTitle(str, pos, max, titleRes);
    }
    let title;
    if (pos < max && start !== pos && titleRes.ok) {
      title = titleRes.str;
      pos = titleRes.pos;
    } else {
      title = "";
      pos = destEndPos;
      nextLine = destEndLineNo;
    }
    while (pos < max) {
      const ch = str.charCodeAt(pos);
      if (!isSpace(ch)) {
        break;
      }
      pos++;
    }
    if (pos < max && str.charCodeAt(pos) !== 10) {
      if (title) {
        title = "";
        pos = destEndPos;
        nextLine = destEndLineNo;
        while (pos < max) {
          const ch = str.charCodeAt(pos);
          if (!isSpace(ch)) {
            break;
          }
          pos++;
        }
      }
    }
    if (pos < max && str.charCodeAt(pos) !== 10) {
      return false;
    }
    const label = normalizeReference(str.slice(1, labelEnd));
    if (!label) {
      return false;
    }
    if (silent) {
      return true;
    }
    if (typeof state.env.references === "undefined") {
      state.env.references = {};
    }
    if (typeof state.env.references[label] === "undefined") {
      state.env.references[label] = { title, href };
    }
    state.line = nextLine;
    return true;
  }
  __name(reference, "reference");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/common/html_blocks.mjs
  var html_blocks_default = [
    "address",
    "article",
    "aside",
    "base",
    "basefont",
    "blockquote",
    "body",
    "caption",
    "center",
    "col",
    "colgroup",
    "dd",
    "details",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hr",
    "html",
    "iframe",
    "legend",
    "li",
    "link",
    "main",
    "menu",
    "menuitem",
    "nav",
    "noframes",
    "ol",
    "optgroup",
    "option",
    "p",
    "param",
    "search",
    "section",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "title",
    "tr",
    "track",
    "ul"
  ];

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/common/html_re.mjs
  var attr_name = "[a-zA-Z_:][a-zA-Z0-9:._-]*";
  var unquoted = "[^\"'=<>`\\x00-\\x20]+";
  var single_quoted = "'[^']*'";
  var double_quoted = '"[^"]*"';
  var attr_value = "(?:" + unquoted + "|" + single_quoted + "|" + double_quoted + ")";
  var attribute = "(?:\\s+" + attr_name + "(?:\\s*=\\s*" + attr_value + ")?)";
  var open_tag = "<[A-Za-z][A-Za-z0-9\\-]*" + attribute + "*\\s*\\/?>";
  var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
  var comment = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->";
  var processing = "<[?][\\s\\S]*?[?]>";
  var declaration = "<![A-Za-z][^>]*>";
  var cdata = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";
  var HTML_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + "|" + comment + "|" + processing + "|" + declaration + "|" + cdata + ")");
  var HTML_OPEN_CLOSE_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + ")");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/html_block.mjs
  var HTML_SEQUENCES = [
    [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true],
    [/^<!--/, /-->/, true],
    [/^<\?/, /\?>/, true],
    [/^<![A-Z]/, />/, true],
    [/^<!\[CDATA\[/, /\]\]>/, true],
    [new RegExp("^</?(" + html_blocks_default.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, true],
    [new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + "\\s*$"), /^$/, false]
  ];
  function html_block(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    if (!state.md.options.html) {
      return false;
    }
    if (state.src.charCodeAt(pos) !== 60) {
      return false;
    }
    let lineText = state.src.slice(pos, max);
    let i = 0;
    for (; i < HTML_SEQUENCES.length; i++) {
      if (HTML_SEQUENCES[i][0].test(lineText)) {
        break;
      }
    }
    if (i === HTML_SEQUENCES.length) {
      return false;
    }
    if (silent) {
      return HTML_SEQUENCES[i][2];
    }
    let nextLine = startLine + 1;
    const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
    if (!HTML_SEQUENCES[i][1].test(lineText)) {
      for (; nextLine < endLine; nextLine++) {
        if (state.sCount[nextLine] < state.blkIndent) {
          if (endsOnBlankLine || !state.isEmpty(nextLine)) {
            break;
          }
        }
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);
        if (HTML_SEQUENCES[i][1].test(lineText)) {
          if (lineText.length !== 0) {
            nextLine++;
          }
          break;
        }
      }
    }
    state.line = nextLine;
    const token = state.push("html_block", "", 0);
    token.map = [startLine, nextLine];
    token.content = state.getLines(startLine, nextLine, state.blkIndent, true);
    return true;
  }
  __name(html_block, "html_block");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/heading.mjs
  function heading(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    let ch = state.src.charCodeAt(pos);
    if (ch !== 35 || pos >= max) {
      return false;
    }
    let level = 1;
    ch = state.src.charCodeAt(++pos);
    while (ch === 35 && pos < max && level <= 6) {
      level++;
      ch = state.src.charCodeAt(++pos);
    }
    if (level > 6 || pos < max && !isSpace(ch)) {
      return false;
    }
    if (silent) {
      return true;
    }
    max = state.skipSpacesBack(max, pos);
    const tmp = state.skipCharsBack(max, 35, pos);
    if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
      max = tmp;
    }
    state.line = startLine + 1;
    const token_o = state.push("heading_open", "h" + String(level), 1);
    token_o.markup = "########".slice(0, level);
    token_o.map = [startLine, state.line];
    const token_i = state.push("inline", "", 0);
    token_i.content = asciiTrim(state.src.slice(pos, max));
    token_i.map = [startLine, state.line];
    token_i.children = [];
    const token_c = state.push("heading_close", "h" + String(level), -1);
    token_c.markup = "########".slice(0, level);
    return true;
  }
  __name(heading, "heading");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/lheading.mjs
  function lheading(state, startLine, endLine) {
    const terminatorRules = state.md.block.ruler.getRules("paragraph");
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }
    const oldParentType = state.parentType;
    state.parentType = "paragraph";
    let level = 0;
    let marker;
    let nextLine = startLine + 1;
    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      if (state.sCount[nextLine] - state.blkIndent > 3) {
        continue;
      }
      if (state.sCount[nextLine] >= state.blkIndent) {
        let pos = state.bMarks[nextLine] + state.tShift[nextLine];
        const max = state.eMarks[nextLine];
        if (pos < max) {
          marker = state.src.charCodeAt(pos);
          if (marker === 45 || marker === 61) {
            pos = state.skipChars(pos, marker);
            pos = state.skipSpaces(pos);
            if (pos >= max) {
              level = marker === 61 ? 1 : 2;
              break;
            }
          }
        }
      }
      if (state.sCount[nextLine] < 0) {
        continue;
      }
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) {
        break;
      }
    }
    if (!level) {
      state.parentType = oldParentType;
      return false;
    }
    const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
    state.line = nextLine + 1;
    const token_o = state.push("heading_open", "h" + String(level), 1);
    token_o.markup = String.fromCharCode(marker);
    token_o.map = [startLine, state.line];
    const token_i = state.push("inline", "", 0);
    token_i.content = content;
    token_i.map = [startLine, state.line - 1];
    token_i.children = [];
    const token_c = state.push("heading_close", "h" + String(level), -1);
    token_c.markup = String.fromCharCode(marker);
    state.parentType = oldParentType;
    return true;
  }
  __name(lheading, "lheading");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_block/paragraph.mjs
  function paragraph(state, startLine, endLine) {
    const terminatorRules = state.md.block.ruler.getRules("paragraph");
    const oldParentType = state.parentType;
    let nextLine = startLine + 1;
    state.parentType = "paragraph";
    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      if (state.sCount[nextLine] - state.blkIndent > 3) {
        continue;
      }
      if (state.sCount[nextLine] < 0) {
        continue;
      }
      let terminate = false;
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) {
        break;
      }
    }
    const content = asciiTrim(state.getLines(startLine, nextLine, state.blkIndent, false));
    state.line = nextLine;
    const token_o = state.push("paragraph_open", "p", 1);
    token_o.map = [startLine, state.line];
    const token_i = state.push("inline", "", 0);
    token_i.content = content;
    token_i.map = [startLine, state.line];
    token_i.children = [];
    state.push("paragraph_close", "p", -1);
    state.parentType = oldParentType;
    return true;
  }
  __name(paragraph, "paragraph");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/parser_block.mjs
  var _rules2 = [
    // First 2 params - rule name & source. Secondary array - list of rules,
    // which can be terminated by this one.
    ["table", table, ["paragraph", "reference"]],
    ["code", code],
    ["fence", fence, ["paragraph", "reference", "blockquote", "list"]],
    ["blockquote", blockquote, ["paragraph", "reference", "blockquote", "list"]],
    ["hr", hr, ["paragraph", "reference", "blockquote", "list"]],
    ["list", list, ["paragraph", "reference", "blockquote"]],
    ["reference", reference],
    ["html_block", html_block, ["paragraph", "reference", "blockquote"]],
    ["heading", heading, ["paragraph", "reference", "blockquote"]],
    ["lheading", lheading],
    ["paragraph", paragraph]
  ];
  function ParserBlock() {
    this.ruler = new ruler_default();
    for (let i = 0; i < _rules2.length; i++) {
      this.ruler.push(_rules2[i][0], _rules2[i][1], { alt: (_rules2[i][2] || []).slice() });
    }
  }
  __name(ParserBlock, "ParserBlock");
  ParserBlock.prototype.tokenize = function(state, startLine, endLine) {
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const maxNesting = state.md.options.maxNesting;
    let line = startLine;
    let hasEmptyLines = false;
    while (line < endLine) {
      state.line = line = state.skipEmptyLines(line);
      if (line >= endLine) {
        break;
      }
      if (state.sCount[line] < state.blkIndent) {
        break;
      }
      if (state.level >= maxNesting) {
        state.line = endLine;
        break;
      }
      const prevLine = state.line;
      let ok = false;
      for (let i = 0; i < len; i++) {
        ok = rules[i](state, line, endLine, false);
        if (ok) {
          if (prevLine >= state.line) {
            throw new Error("block rule didn't increment state.line");
          }
          break;
        }
      }
      if (!ok) throw new Error("none of the block rules matched");
      state.tight = !hasEmptyLines;
      if (state.isEmpty(state.line - 1)) {
        hasEmptyLines = true;
      }
      line = state.line;
      if (line < endLine && state.isEmpty(line)) {
        hasEmptyLines = true;
        line++;
        state.line = line;
      }
    }
  };
  ParserBlock.prototype.parse = function(src, md2, env, outTokens) {
    if (!src) {
      return;
    }
    const state = new this.State(src, md2, env, outTokens);
    this.tokenize(state, state.line, state.lineMax);
  };
  ParserBlock.prototype.State = state_block_default;
  var parser_block_default = ParserBlock;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/state_inline.mjs
  function StateInline(src, md2, env, outTokens) {
    this.src = src;
    this.env = env;
    this.md = md2;
    this.tokens = outTokens;
    this.tokens_meta = Array(outTokens.length);
    this.pos = 0;
    this.posMax = this.src.length;
    this.level = 0;
    this.pending = "";
    this.pendingLevel = 0;
    this.cache = {};
    this.delimiters = [];
    this._prev_delimiters = [];
    this.backticks = {};
    this.backticksScanned = false;
    this.linkLevel = 0;
  }
  __name(StateInline, "StateInline");
  StateInline.prototype.pushPending = function() {
    const token = new token_default("text", "", 0);
    token.content = this.pending;
    token.level = this.pendingLevel;
    this.tokens.push(token);
    this.pending = "";
    return token;
  };
  StateInline.prototype.push = function(type, tag, nesting) {
    if (this.pending) {
      this.pushPending();
    }
    const token = new token_default(type, tag, nesting);
    let token_meta = null;
    if (nesting < 0) {
      this.level--;
      this.delimiters = this._prev_delimiters.pop();
    }
    token.level = this.level;
    if (nesting > 0) {
      this.level++;
      this._prev_delimiters.push(this.delimiters);
      this.delimiters = [];
      token_meta = { delimiters: this.delimiters };
    }
    this.pendingLevel = this.level;
    this.tokens.push(token);
    this.tokens_meta.push(token_meta);
    return token;
  };
  StateInline.prototype.scanDelims = function(start, canSplitWord) {
    const max = this.posMax;
    const marker = this.src.charCodeAt(start);
    let lastChar;
    if (start === 0) {
      lastChar = 32;
    } else if (start === 1) {
      lastChar = this.src.charCodeAt(0);
      if ((lastChar & 63488) === 55296) {
        lastChar = 65533;
      }
    } else {
      lastChar = this.src.charCodeAt(start - 1);
      if ((lastChar & 64512) === 56320) {
        const highSurr = this.src.charCodeAt(start - 2);
        lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
      } else if ((lastChar & 64512) === 55296) {
        lastChar = 65533;
      }
    }
    let pos = start;
    while (pos < max && this.src.charCodeAt(pos) === marker) {
      pos++;
    }
    const count = pos - start;
    let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
    if ((nextChar & 64512) === 55296) {
      const lowSurr = this.src.charCodeAt(pos + 1);
      nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
    } else if ((nextChar & 64512) === 56320) {
      nextChar = 65533;
    }
    const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
    const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
    const isLastWhiteSpace = isWhiteSpace(lastChar);
    const isNextWhiteSpace = isWhiteSpace(nextChar);
    const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
    const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
    const can_open = left_flanking && (canSplitWord || !right_flanking || isLastPunctChar);
    const can_close = right_flanking && (canSplitWord || !left_flanking || isNextPunctChar);
    return { can_open, can_close, length: count };
  };
  StateInline.prototype.Token = token_default;
  var state_inline_default = StateInline;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/text.mjs
  function isTerminatorChar(ch) {
    switch (ch) {
      case 10:
      case 33:
      case 35:
      case 36:
      case 37:
      case 38:
      case 42:
      case 43:
      case 45:
      case 58:
      case 60:
      case 61:
      case 62:
      case 64:
      case 91:
      case 92:
      case 93:
      case 94:
      case 95:
      case 96:
      case 123:
      case 125:
      case 126:
        return true;
      default:
        return false;
    }
  }
  __name(isTerminatorChar, "isTerminatorChar");
  function text(state, silent) {
    let pos = state.pos;
    while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
      pos++;
    }
    if (pos === state.pos) {
      return false;
    }
    if (!silent) {
      state.pending += state.src.slice(state.pos, pos);
    }
    state.pos = pos;
    return true;
  }
  __name(text, "text");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/linkify.mjs
  var SCHEME_RE = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
  function linkify2(state, silent) {
    if (!state.md.options.linkify) return false;
    if (state.linkLevel > 0) return false;
    const pos = state.pos;
    const max = state.posMax;
    if (pos + 3 > max) return false;
    if (state.src.charCodeAt(pos) !== 58) return false;
    if (state.src.charCodeAt(pos + 1) !== 47) return false;
    if (state.src.charCodeAt(pos + 2) !== 47) return false;
    const match2 = state.pending.match(SCHEME_RE);
    if (!match2) return false;
    const proto = match2[1];
    const link2 = state.md.linkify.matchAtStart(state.src.slice(pos - proto.length));
    if (!link2) return false;
    let url = link2.url;
    if (url.length <= proto.length) return false;
    let urlEnd = url.length;
    while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) {
      urlEnd--;
    }
    if (urlEnd !== url.length) {
      url = url.slice(0, urlEnd);
    }
    const fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) return false;
    if (!silent) {
      state.pending = state.pending.slice(0, -proto.length);
      const token_o = state.push("link_open", "a", 1);
      token_o.attrs = [["href", fullUrl]];
      token_o.markup = "linkify";
      token_o.info = "auto";
      const token_t = state.push("text", "", 0);
      token_t.content = state.md.normalizeLinkText(url);
      const token_c = state.push("link_close", "a", -1);
      token_c.markup = "linkify";
      token_c.info = "auto";
    }
    state.pos += url.length - proto.length;
    return true;
  }
  __name(linkify2, "linkify");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/newline.mjs
  function newline(state, silent) {
    let pos = state.pos;
    if (state.src.charCodeAt(pos) !== 10) {
      return false;
    }
    const pmax = state.pending.length - 1;
    const max = state.posMax;
    if (!silent) {
      if (pmax >= 0 && state.pending.charCodeAt(pmax) === 32) {
        if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 32) {
          let ws = pmax - 1;
          while (ws >= 1 && state.pending.charCodeAt(ws - 1) === 32) ws--;
          state.pending = state.pending.slice(0, ws);
          state.push("hardbreak", "br", 0);
        } else {
          state.pending = state.pending.slice(0, -1);
          state.push("softbreak", "br", 0);
        }
      } else {
        state.push("softbreak", "br", 0);
      }
    }
    pos++;
    while (pos < max && isSpace(state.src.charCodeAt(pos))) {
      pos++;
    }
    state.pos = pos;
    return true;
  }
  __name(newline, "newline");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/escape.mjs
  var ESCAPED = [];
  for (let i = 0; i < 256; i++) {
    ESCAPED.push(0);
  }
  "\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
    ESCAPED[ch.charCodeAt(0)] = 1;
  });
  function escape2(state, silent) {
    let pos = state.pos;
    const max = state.posMax;
    if (state.src.charCodeAt(pos) !== 92) return false;
    pos++;
    if (pos >= max) return false;
    let ch1 = state.src.charCodeAt(pos);
    if (ch1 === 10) {
      if (!silent) {
        state.push("hardbreak", "br", 0);
      }
      pos++;
      while (pos < max) {
        ch1 = state.src.charCodeAt(pos);
        if (!isSpace(ch1)) break;
        pos++;
      }
      state.pos = pos;
      return true;
    }
    if (ch1 === 32) {
      if (!silent) {
        const token = state.push("text_special", "", 0);
        token.content = "\\";
        token.markup = "\\";
        token.info = "escape";
      }
      state.pos = pos;
      return true;
    }
    let escapedStr = state.src[pos];
    if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
      const ch2 = state.src.charCodeAt(pos + 1);
      if (ch2 >= 56320 && ch2 <= 57343) {
        escapedStr += state.src[pos + 1];
        pos++;
      }
    }
    const origStr = "\\" + escapedStr;
    if (!silent) {
      const token = state.push("text_special", "", 0);
      if (ch1 < 256 && ESCAPED[ch1] !== 0) {
        token.content = escapedStr;
      } else {
        token.content = origStr;
      }
      token.markup = origStr;
      token.info = "escape";
    }
    state.pos = pos + 1;
    return true;
  }
  __name(escape2, "escape");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/backticks.mjs
  function backtick(state, silent) {
    let pos = state.pos;
    const ch = state.src.charCodeAt(pos);
    if (ch !== 96) {
      return false;
    }
    const start = pos;
    pos++;
    const max = state.posMax;
    while (pos < max && state.src.charCodeAt(pos) === 96) {
      pos++;
    }
    const marker = state.src.slice(start, pos);
    const openerLength = marker.length;
    if (state.backticksScanned && (state.backticks[openerLength] || 0) <= start) {
      if (!silent) state.pending += marker;
      state.pos += openerLength;
      return true;
    }
    let matchEnd = pos;
    let matchStart;
    while ((matchStart = state.src.indexOf("`", matchEnd)) !== -1) {
      matchEnd = matchStart + 1;
      while (matchEnd < max && state.src.charCodeAt(matchEnd) === 96) {
        matchEnd++;
      }
      const closerLength = matchEnd - matchStart;
      if (closerLength === openerLength) {
        if (!silent) {
          const token = state.push("code_inline", "code", 0);
          token.markup = marker;
          token.content = state.src.slice(pos, matchStart).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
        }
        state.pos = matchEnd;
        return true;
      }
      state.backticks[closerLength] = matchStart;
    }
    state.backticksScanned = true;
    if (!silent) state.pending += marker;
    state.pos += openerLength;
    return true;
  }
  __name(backtick, "backtick");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/strikethrough.mjs
  function strikethrough_tokenize(state, silent) {
    const start = state.pos;
    const marker = state.src.charCodeAt(start);
    if (silent) {
      return false;
    }
    if (marker !== 126) {
      return false;
    }
    const scanned = state.scanDelims(state.pos, true);
    let len = scanned.length;
    const ch = String.fromCharCode(marker);
    if (len < 2) {
      return false;
    }
    let token;
    if (len % 2) {
      token = state.push("text", "", 0);
      token.content = ch;
      len--;
    }
    for (let i = 0; i < len; i += 2) {
      token = state.push("text", "", 0);
      token.content = ch + ch;
      state.delimiters.push({
        marker,
        length: 0,
        // disable "rule of 3" length checks meant for emphasis
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close
      });
    }
    state.pos += scanned.length;
    return true;
  }
  __name(strikethrough_tokenize, "strikethrough_tokenize");
  function postProcess(state, delimiters2) {
    let token;
    const loneMarkers = [];
    const max = delimiters2.length;
    for (let i = 0; i < max; i++) {
      const startDelim = delimiters2[i];
      if (startDelim.marker !== 126) {
        continue;
      }
      if (startDelim.end === -1) {
        continue;
      }
      const endDelim = delimiters2[startDelim.end];
      token = state.tokens[startDelim.token];
      token.type = "s_open";
      token.tag = "s";
      token.nesting = 1;
      token.markup = "~~";
      token.content = "";
      token = state.tokens[endDelim.token];
      token.type = "s_close";
      token.tag = "s";
      token.nesting = -1;
      token.markup = "~~";
      token.content = "";
      if (state.tokens[endDelim.token - 1].type === "text" && state.tokens[endDelim.token - 1].content === "~") {
        loneMarkers.push(endDelim.token - 1);
      }
    }
    while (loneMarkers.length) {
      const i = loneMarkers.pop();
      let j = i + 1;
      while (j < state.tokens.length && state.tokens[j].type === "s_close") {
        j++;
      }
      j--;
      if (i !== j) {
        token = state.tokens[j];
        state.tokens[j] = state.tokens[i];
        state.tokens[i] = token;
      }
    }
  }
  __name(postProcess, "postProcess");
  function strikethrough_postProcess(state) {
    const tokens_meta = state.tokens_meta;
    const max = state.tokens_meta.length;
    postProcess(state, state.delimiters);
    for (let curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        postProcess(state, tokens_meta[curr].delimiters);
      }
    }
  }
  __name(strikethrough_postProcess, "strikethrough_postProcess");
  var strikethrough_default = {
    tokenize: strikethrough_tokenize,
    postProcess: strikethrough_postProcess
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/emphasis.mjs
  function emphasis_tokenize(state, silent) {
    const start = state.pos;
    const marker = state.src.charCodeAt(start);
    if (silent) {
      return false;
    }
    if (marker !== 95 && marker !== 42) {
      return false;
    }
    const scanned = state.scanDelims(state.pos, marker === 42);
    for (let i = 0; i < scanned.length; i++) {
      const token = state.push("text", "", 0);
      token.content = String.fromCharCode(marker);
      state.delimiters.push({
        // Char code of the starting marker (number).
        //
        marker,
        // Total length of these series of delimiters.
        //
        length: scanned.length,
        // A position of the token this delimiter corresponds to.
        //
        token: state.tokens.length - 1,
        // If this delimiter is matched as a valid opener, `end` will be
        // equal to its position, otherwise it's `-1`.
        //
        end: -1,
        // Boolean flags that determine if this delimiter could open or close
        // an emphasis.
        //
        open: scanned.can_open,
        close: scanned.can_close
      });
    }
    state.pos += scanned.length;
    return true;
  }
  __name(emphasis_tokenize, "emphasis_tokenize");
  function postProcess2(state, delimiters2) {
    const max = delimiters2.length;
    for (let i = max - 1; i >= 0; i--) {
      const startDelim = delimiters2[i];
      if (startDelim.marker !== 95 && startDelim.marker !== 42) {
        continue;
      }
      if (startDelim.end === -1) {
        continue;
      }
      const endDelim = delimiters2[startDelim.end];
      const isStrong = i > 0 && delimiters2[i - 1].end === startDelim.end + 1 && // check that first two markers match and adjacent
      delimiters2[i - 1].marker === startDelim.marker && delimiters2[i - 1].token === startDelim.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
      delimiters2[startDelim.end + 1].token === endDelim.token + 1;
      const ch = String.fromCharCode(startDelim.marker);
      const token_o = state.tokens[startDelim.token];
      token_o.type = isStrong ? "strong_open" : "em_open";
      token_o.tag = isStrong ? "strong" : "em";
      token_o.nesting = 1;
      token_o.markup = isStrong ? ch + ch : ch;
      token_o.content = "";
      const token_c = state.tokens[endDelim.token];
      token_c.type = isStrong ? "strong_close" : "em_close";
      token_c.tag = isStrong ? "strong" : "em";
      token_c.nesting = -1;
      token_c.markup = isStrong ? ch + ch : ch;
      token_c.content = "";
      if (isStrong) {
        state.tokens[delimiters2[i - 1].token].content = "";
        state.tokens[delimiters2[startDelim.end + 1].token].content = "";
        i--;
      }
    }
  }
  __name(postProcess2, "postProcess");
  function emphasis_post_process(state) {
    const tokens_meta = state.tokens_meta;
    const max = state.tokens_meta.length;
    postProcess2(state, state.delimiters);
    for (let curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        postProcess2(state, tokens_meta[curr].delimiters);
      }
    }
  }
  __name(emphasis_post_process, "emphasis_post_process");
  var emphasis_default = {
    tokenize: emphasis_tokenize,
    postProcess: emphasis_post_process
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/link.mjs
  function link(state, silent) {
    let code2, label, res, ref;
    let href = "";
    let title = "";
    let start = state.pos;
    let parseReference = true;
    if (state.src.charCodeAt(state.pos) !== 91) {
      return false;
    }
    const oldPos = state.pos;
    const max = state.posMax;
    const labelStart = state.pos + 1;
    const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);
    if (labelEnd < 0) {
      return false;
    }
    let pos = labelEnd + 1;
    if (pos < max && state.src.charCodeAt(pos) === 40) {
      parseReference = false;
      pos++;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) {
          break;
        }
      }
      if (pos >= max) {
        return false;
      }
      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
      if (res.ok) {
        href = state.md.normalizeLink(res.str);
        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = "";
        }
        start = pos;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) {
            break;
          }
        }
        res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
        if (pos < max && start !== pos && res.ok) {
          title = res.str;
          pos = res.pos;
          for (; pos < max; pos++) {
            code2 = state.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) {
              break;
            }
          }
        }
      }
      if (pos >= max || state.src.charCodeAt(pos) !== 41) {
        parseReference = true;
      }
      pos++;
    }
    if (parseReference) {
      if (typeof state.env.references === "undefined") {
        return false;
      }
      if (pos < max && state.src.charCodeAt(pos) === 91) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);
        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
        pos = labelEnd + 1;
      }
      if (!label) {
        label = state.src.slice(labelStart, labelEnd);
      }
      ref = state.env.references[normalizeReference(label)];
      if (!ref) {
        state.pos = oldPos;
        return false;
      }
      href = ref.href;
      title = ref.title;
    }
    if (!silent) {
      state.pos = labelStart;
      state.posMax = labelEnd;
      const token_o = state.push("link_open", "a", 1);
      const attrs = [["href", href]];
      token_o.attrs = attrs;
      if (title) {
        attrs.push(["title", title]);
      }
      state.linkLevel++;
      state.md.inline.tokenize(state);
      state.linkLevel--;
      state.push("link_close", "a", -1);
    }
    state.pos = pos;
    state.posMax = max;
    return true;
  }
  __name(link, "link");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/image.mjs
  function image(state, silent) {
    let code2, content, label, pos, ref, res, title, start;
    let href = "";
    const oldPos = state.pos;
    const max = state.posMax;
    if (state.src.charCodeAt(state.pos) !== 33) {
      return false;
    }
    if (state.src.charCodeAt(state.pos + 1) !== 91) {
      return false;
    }
    const labelStart = state.pos + 2;
    const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
    if (labelEnd < 0) {
      return false;
    }
    pos = labelEnd + 1;
    if (pos < max && state.src.charCodeAt(pos) === 40) {
      pos++;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) {
          break;
        }
      }
      if (pos >= max) {
        return false;
      }
      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
      if (res.ok) {
        href = state.md.normalizeLink(res.str);
        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = "";
        }
      }
      start = pos;
      for (; pos < max; pos++) {
        code2 = state.src.charCodeAt(pos);
        if (!isSpace(code2) && code2 !== 10) {
          break;
        }
      }
      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos;
        for (; pos < max; pos++) {
          code2 = state.src.charCodeAt(pos);
          if (!isSpace(code2) && code2 !== 10) {
            break;
          }
        }
      } else {
        title = "";
      }
      if (pos >= max || state.src.charCodeAt(pos) !== 41) {
        state.pos = oldPos;
        return false;
      }
      pos++;
    } else {
      if (typeof state.env.references === "undefined") {
        return false;
      }
      if (pos < max && state.src.charCodeAt(pos) === 91) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);
        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
        pos = labelEnd + 1;
      }
      if (!label) {
        label = state.src.slice(labelStart, labelEnd);
      }
      ref = state.env.references[normalizeReference(label)];
      if (!ref) {
        state.pos = oldPos;
        return false;
      }
      href = ref.href;
      title = ref.title;
    }
    if (!silent) {
      content = state.src.slice(labelStart, labelEnd);
      const tokens = [];
      state.md.inline.parse(
        content,
        state.md,
        state.env,
        tokens
      );
      const token = state.push("image", "img", 0);
      const attrs = [["src", href], ["alt", ""]];
      token.attrs = attrs;
      token.children = tokens;
      token.content = content;
      if (title) {
        attrs.push(["title", title]);
      }
    }
    state.pos = pos;
    state.posMax = max;
    return true;
  }
  __name(image, "image");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/autolink.mjs
  var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
  var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
  function autolink(state, silent) {
    let pos = state.pos;
    if (state.src.charCodeAt(pos) !== 60) {
      return false;
    }
    const start = state.pos;
    const max = state.posMax;
    for (; ; ) {
      if (++pos >= max) return false;
      const ch = state.src.charCodeAt(pos);
      if (ch === 60) return false;
      if (ch === 62) break;
    }
    const url = state.src.slice(start + 1, pos);
    if (AUTOLINK_RE.test(url)) {
      const fullUrl = state.md.normalizeLink(url);
      if (!state.md.validateLink(fullUrl)) {
        return false;
      }
      if (!silent) {
        const token_o = state.push("link_open", "a", 1);
        token_o.attrs = [["href", fullUrl]];
        token_o.markup = "autolink";
        token_o.info = "auto";
        const token_t = state.push("text", "", 0);
        token_t.content = state.md.normalizeLinkText(url);
        const token_c = state.push("link_close", "a", -1);
        token_c.markup = "autolink";
        token_c.info = "auto";
      }
      state.pos += url.length + 2;
      return true;
    }
    if (EMAIL_RE.test(url)) {
      const fullUrl = state.md.normalizeLink("mailto:" + url);
      if (!state.md.validateLink(fullUrl)) {
        return false;
      }
      if (!silent) {
        const token_o = state.push("link_open", "a", 1);
        token_o.attrs = [["href", fullUrl]];
        token_o.markup = "autolink";
        token_o.info = "auto";
        const token_t = state.push("text", "", 0);
        token_t.content = state.md.normalizeLinkText(url);
        const token_c = state.push("link_close", "a", -1);
        token_c.markup = "autolink";
        token_c.info = "auto";
      }
      state.pos += url.length + 2;
      return true;
    }
    return false;
  }
  __name(autolink, "autolink");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/html_inline.mjs
  function isLinkOpen2(str) {
    return /^<a[>\s]/i.test(str);
  }
  __name(isLinkOpen2, "isLinkOpen");
  function isLinkClose2(str) {
    return /^<\/a\s*>/i.test(str);
  }
  __name(isLinkClose2, "isLinkClose");
  function isLetter(ch) {
    const lc = ch | 32;
    return lc >= 97 && lc <= 122;
  }
  __name(isLetter, "isLetter");
  function html_inline(state, silent) {
    if (!state.md.options.html) {
      return false;
    }
    const max = state.posMax;
    const pos = state.pos;
    if (state.src.charCodeAt(pos) !== 60 || pos + 2 >= max) {
      return false;
    }
    const ch = state.src.charCodeAt(pos + 1);
    if (ch !== 33 && ch !== 63 && ch !== 47 && !isLetter(ch)) {
      return false;
    }
    const match2 = state.src.slice(pos).match(HTML_TAG_RE);
    if (!match2) {
      return false;
    }
    if (!silent) {
      const token = state.push("html_inline", "", 0);
      token.content = match2[0];
      if (isLinkOpen2(token.content)) state.linkLevel++;
      if (isLinkClose2(token.content)) state.linkLevel--;
    }
    state.pos += match2[0].length;
    return true;
  }
  __name(html_inline, "html_inline");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/entity.mjs
  var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
  var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
  function entity(state, silent) {
    const pos = state.pos;
    const max = state.posMax;
    if (state.src.charCodeAt(pos) !== 38) return false;
    if (pos + 1 >= max) return false;
    const ch = state.src.charCodeAt(pos + 1);
    if (ch === 35) {
      const match2 = state.src.slice(pos).match(DIGITAL_RE);
      if (match2) {
        if (!silent) {
          const code2 = match2[1][0].toLowerCase() === "x" ? parseInt(match2[1].slice(1), 16) : parseInt(match2[1], 10);
          const token = state.push("text_special", "", 0);
          token.content = isValidEntityCode(code2) ? fromCodePoint2(code2) : fromCodePoint2(65533);
          token.markup = match2[0];
          token.info = "entity";
        }
        state.pos += match2[0].length;
        return true;
      }
    } else {
      const match2 = state.src.slice(pos).match(NAMED_RE);
      if (match2) {
        const decoded = decodeHTMLStrict(match2[0]);
        if (decoded !== match2[0]) {
          if (!silent) {
            const token = state.push("text_special", "", 0);
            token.content = decoded;
            token.markup = match2[0];
            token.info = "entity";
          }
          state.pos += match2[0].length;
          return true;
        }
      }
    }
    return false;
  }
  __name(entity, "entity");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/balance_pairs.mjs
  function processDelimiters(delimiters2) {
    const openersBottom = {};
    const max = delimiters2.length;
    if (!max) return;
    let headerIdx = 0;
    let lastTokenIdx = -2;
    const jumps = [];
    for (let closerIdx = 0; closerIdx < max; closerIdx++) {
      const closer = delimiters2[closerIdx];
      jumps.push(0);
      if (delimiters2[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
        headerIdx = closerIdx;
      }
      lastTokenIdx = closer.token;
      closer.length = closer.length || 0;
      if (!closer.close) continue;
      if (!openersBottom.hasOwnProperty(closer.marker)) {
        openersBottom[closer.marker] = [-1, -1, -1, -1, -1, -1];
      }
      const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
      let openerIdx = headerIdx - jumps[headerIdx] - 1;
      let newMinOpenerIdx = openerIdx;
      for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
        const opener = delimiters2[openerIdx];
        if (opener.marker !== closer.marker) continue;
        if (opener.open && opener.end < 0) {
          let isOddMatch = false;
          if (opener.close || closer.open) {
            if ((opener.length + closer.length) % 3 === 0) {
              if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
                isOddMatch = true;
              }
            }
          }
          if (!isOddMatch) {
            const lastJump = openerIdx > 0 && !delimiters2[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
            jumps[closerIdx] = closerIdx - openerIdx + lastJump;
            jumps[openerIdx] = lastJump;
            closer.open = false;
            opener.end = closerIdx;
            opener.close = false;
            newMinOpenerIdx = -1;
            lastTokenIdx = -2;
            break;
          }
        }
      }
      if (newMinOpenerIdx !== -1) {
        openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
      }
    }
  }
  __name(processDelimiters, "processDelimiters");
  function link_pairs(state) {
    const tokens_meta = state.tokens_meta;
    const max = state.tokens_meta.length;
    processDelimiters(state.delimiters);
    for (let curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        processDelimiters(tokens_meta[curr].delimiters);
      }
    }
  }
  __name(link_pairs, "link_pairs");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/rules_inline/fragments_join.mjs
  function fragments_join(state) {
    let curr, last;
    let level = 0;
    const tokens = state.tokens;
    const max = state.tokens.length;
    for (curr = last = 0; curr < max; curr++) {
      if (tokens[curr].nesting < 0) level--;
      tokens[curr].level = level;
      if (tokens[curr].nesting > 0) level++;
      if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
        tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
      } else {
        if (curr !== last) {
          tokens[last] = tokens[curr];
        }
        last++;
      }
    }
    if (curr !== last) {
      tokens.length = last;
    }
  }
  __name(fragments_join, "fragments_join");

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/parser_inline.mjs
  var _rules3 = [
    ["text", text],
    ["linkify", linkify2],
    ["newline", newline],
    ["escape", escape2],
    ["backticks", backtick],
    ["strikethrough", strikethrough_default.tokenize],
    ["emphasis", emphasis_default.tokenize],
    ["link", link],
    ["image", image],
    ["autolink", autolink],
    ["html_inline", html_inline],
    ["entity", entity]
  ];
  var _rules22 = [
    ["balance_pairs", link_pairs],
    ["strikethrough", strikethrough_default.postProcess],
    ["emphasis", emphasis_default.postProcess],
    // rules for pairs separate '**' into its own text tokens, which may be left unused,
    // rule below merges unused segments back with the rest of the text
    ["fragments_join", fragments_join]
  ];
  function ParserInline() {
    this.ruler = new ruler_default();
    for (let i = 0; i < _rules3.length; i++) {
      this.ruler.push(_rules3[i][0], _rules3[i][1]);
    }
    this.ruler2 = new ruler_default();
    for (let i = 0; i < _rules22.length; i++) {
      this.ruler2.push(_rules22[i][0], _rules22[i][1]);
    }
  }
  __name(ParserInline, "ParserInline");
  ParserInline.prototype.skipToken = function(state) {
    const pos = state.pos;
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const maxNesting = state.md.options.maxNesting;
    const cache = state.cache;
    if (typeof cache[pos] !== "undefined") {
      state.pos = cache[pos];
      return;
    }
    let ok = false;
    if (state.level < maxNesting) {
      for (let i = 0; i < len; i++) {
        state.level++;
        ok = rules[i](state, true);
        state.level--;
        if (ok) {
          if (pos >= state.pos) {
            throw new Error("inline rule didn't increment state.pos");
          }
          break;
        }
      }
    } else {
      state.pos = state.posMax;
    }
    if (!ok) {
      state.pos++;
    }
    cache[pos] = state.pos;
  };
  ParserInline.prototype.tokenize = function(state) {
    const rules = this.ruler.getRules("");
    const len = rules.length;
    const end = state.posMax;
    const maxNesting = state.md.options.maxNesting;
    while (state.pos < end) {
      const prevPos = state.pos;
      let ok = false;
      if (state.level < maxNesting) {
        for (let i = 0; i < len; i++) {
          ok = rules[i](state, false);
          if (ok) {
            if (prevPos >= state.pos) {
              throw new Error("inline rule didn't increment state.pos");
            }
            break;
          }
        }
      }
      if (ok) {
        if (state.pos >= end) {
          break;
        }
        continue;
      }
      state.pending += state.src[state.pos++];
    }
    if (state.pending) {
      state.pushPending();
    }
  };
  ParserInline.prototype.parse = function(str, md2, env, outTokens) {
    const state = new this.State(str, md2, env, outTokens);
    this.tokenize(state);
    const rules = this.ruler2.getRules("");
    const len = rules.length;
    for (let i = 0; i < len; i++) {
      rules[i](state);
    }
  };
  ParserInline.prototype.State = state_inline_default;
  var parser_inline_default = ParserInline;

  // node_modules/.pnpm/linkify-it@5.0.2/node_modules/linkify-it/lib/re.mjs
  function re_default(opts) {
    const re = {};
    opts = opts || {};
    re.src_Any = regex_default.source;
    re.src_Cc = regex_default2.source;
    re.src_Z = regex_default6.source;
    re.src_P = regex_default4.source;
    re.src_ZPCc = [re.src_Z, re.src_P, re.src_Cc].join("|");
    re.src_ZCc = [re.src_Z, re.src_Cc].join("|");
    const text_separators = "[><\uFF5C]";
    re.src_pseudo_letter = `(?:(?!${text_separators}|${re.src_ZPCc})${re.src_Any})`;
    re.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    re.src_auth = `(?:(?:(?!${re.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`;
    re.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?";
    re.src_host_terminator = `(?=$|${text_separators}|${re.src_ZPCc})(?!${opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${re.src_ZPCc}))`;
    re.src_path = `(?:[/?#](?:(?!${re.src_ZCc}|${text_separators}|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!${re.src_ZCc}|\\]).)*\\]|\\((?:(?!${re.src_ZCc}|[)]).)*\\)|\\{(?:(?!${re.src_ZCc}|[}]).)*\\}|\\"(?:(?!${re.src_ZCc}|["]).)+\\"|\\'(?:(?!${re.src_ZCc}|[']).)+\\'|\\'(?=${re.src_pseudo_letter}|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!${re.src_ZCc}|[.]|$)|` + (opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
    `,(?!${re.src_ZCc}|$)|;(?!${re.src_ZCc}|$)|\\!+(?!${re.src_ZCc}|[!]|$)|\\?(?!${re.src_ZCc}|[?]|$))+|\\/)?`;
    re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]{0,63}';
    re.src_xn = "xn--[a-z0-9\\-]{1,59}";
    re.src_domain_root = // Allow letters & digits (http://test1)
    "(?:" + re.src_xn + `|${re.src_pseudo_letter}{1,63})`;
    re.src_domain = "(?:" + re.src_xn + `|(?:${re.src_pseudo_letter})|(?:${re.src_pseudo_letter}(?:-|${re.src_pseudo_letter}){0,61}${re.src_pseudo_letter}))`;
    re.src_host = `(?:(?:(?:(?:${re.src_domain})\\.)*${re.src_domain}))`;
    re.tpl_host_fuzzy = "(?:" + re.src_ip4 + `|(?:(?:(?:${re.src_domain})\\.)+(?:%TLDS%)))`;
    re.tpl_host_no_ip_fuzzy = `(?:(?:(?:${re.src_domain})\\.)+(?:%TLDS%))`;
    re.src_host_strict = re.src_host + re.src_host_terminator;
    re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
    re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
    re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
    re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;
    re.tpl_host_fuzzy_test = `localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:${re.src_ZPCc}|>|$))`;
    re.tpl_email_fuzzy = `(^|${text_separators}|"|\\(|${re.src_ZCc})(${re.src_email_name}@${re.tpl_host_fuzzy_strict})`;
    re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
    // but can start with > (markdown blockquote)
    `(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${re.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${re.tpl_host_port_fuzzy_strict}${re.src_path})`;
    re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
    // but can start with > (markdown blockquote)
    `(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${re.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${re.tpl_host_port_no_ip_fuzzy_strict}${re.src_path})`;
    return re;
  }
  __name(re_default, "default");

  // node_modules/.pnpm/linkify-it@5.0.2/node_modules/linkify-it/index.mjs
  function assign2(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      if (!source) {
        return;
      }
      Object.keys(source).forEach(function(key) {
        obj[key] = source[key];
      });
    });
    return obj;
  }
  __name(assign2, "assign");
  function _class2(obj) {
    return Object.prototype.toString.call(obj);
  }
  __name(_class2, "_class");
  function isString2(obj) {
    return _class2(obj) === "[object String]";
  }
  __name(isString2, "isString");
  function isObject(obj) {
    return _class2(obj) === "[object Object]";
  }
  __name(isObject, "isObject");
  function isRegExp(obj) {
    return _class2(obj) === "[object RegExp]";
  }
  __name(isRegExp, "isRegExp");
  function isFunction(obj) {
    return _class2(obj) === "[object Function]";
  }
  __name(isFunction, "isFunction");
  function escapeRE2(str) {
    return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  __name(escapeRE2, "escapeRE");
  var defaultOptions = {
    fuzzyLink: true,
    fuzzyEmail: true,
    fuzzyIP: false
  };
  function isOptionsObj(obj) {
    return Object.keys(obj || {}).reduce(function(acc, k) {
      return acc || defaultOptions.hasOwnProperty(k);
    }, false);
  }
  __name(isOptionsObj, "isOptionsObj");
  var defaultSchemas = {
    "http:": {
      validate: /* @__PURE__ */ __name(function(text3, pos, self) {
        const tail = text3.slice(pos);
        if (!self.re.http) {
          self.re.http = new RegExp(
            `^\\/\\/${self.re.src_auth}${self.re.src_host_port_strict}${self.re.src_path}`,
            "i"
          );
        }
        if (self.re.http.test(tail)) {
          return tail.match(self.re.http)[0].length;
        }
        return 0;
      }, "validate")
    },
    "https:": "http:",
    "ftp:": "http:",
    "//": {
      validate: /* @__PURE__ */ __name(function(text3, pos, self) {
        const tail = text3.slice(pos);
        if (!self.re.no_http) {
          self.re.no_http = new RegExp(
            "^" + self.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
            // with code comments
            `(?:localhost|(?:(?:${self.re.src_domain})\\.)+${self.re.src_domain_root})` + self.re.src_port + self.re.src_host_terminator + self.re.src_path,
            "i"
          );
        }
        if (self.re.no_http.test(tail)) {
          if (pos >= 3 && text3[pos - 3] === ":") {
            return 0;
          }
          if (pos >= 3 && text3[pos - 3] === "/") {
            return 0;
          }
          return tail.match(self.re.no_http)[0].length;
        }
        return 0;
      }, "validate")
    },
    "mailto:": {
      validate: /* @__PURE__ */ __name(function(text3, pos, self) {
        const tail = text3.slice(pos);
        if (!self.re.mailto) {
          self.re.mailto = new RegExp(
            `^${self.re.src_email_name}@${self.re.src_host_strict}`,
            "i"
          );
        }
        if (self.re.mailto.test(tail)) {
          return tail.match(self.re.mailto)[0].length;
        }
        return 0;
      }, "validate")
    }
  };
  var tlds_2ch_src_re = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]";
  var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");
  function createValidator(re) {
    return function(text3, pos) {
      const tail = text3.slice(pos);
      if (re.test(tail)) {
        return tail.match(re)[0].length;
      }
      return 0;
    };
  }
  __name(createValidator, "createValidator");
  function createNormalizer() {
    return function(match2, self) {
      self.normalize(match2);
    };
  }
  __name(createNormalizer, "createNormalizer");
  function compile(self) {
    const re = self.re = re_default(self.__opts__);
    const tlds2 = self.__tlds__.slice();
    self.onCompile();
    if (!self.__tlds_replaced__) {
      tlds2.push(tlds_2ch_src_re);
    }
    tlds2.push(re.src_xn);
    re.src_tlds = tlds2.join("|");
    function untpl(tpl) {
      return tpl.replace("%TLDS%", re.src_tlds);
    }
    __name(untpl, "untpl");
    re.email_fuzzy = RegExp(untpl(re.tpl_email_fuzzy), "i");
    re.email_fuzzy_global = RegExp(untpl(re.tpl_email_fuzzy), "ig");
    re.link_fuzzy = RegExp(untpl(re.tpl_link_fuzzy), "i");
    re.link_fuzzy_global = RegExp(untpl(re.tpl_link_fuzzy), "ig");
    re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "i");
    re.link_no_ip_fuzzy_global = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "ig");
    re.host_fuzzy_test = RegExp(untpl(re.tpl_host_fuzzy_test), "i");
    const aliases = [];
    self.__compiled__ = {};
    function schemaError(name, val) {
      throw new Error(`(LinkifyIt) Invalid schema "${name}": ${val}`);
    }
    __name(schemaError, "schemaError");
    Object.keys(self.__schemas__).forEach(function(name) {
      const val = self.__schemas__[name];
      if (val === null) {
        return;
      }
      const compiled = { validate: null, link: null };
      self.__compiled__[name] = compiled;
      if (isObject(val)) {
        if (isRegExp(val.validate)) {
          compiled.validate = createValidator(val.validate);
        } else if (isFunction(val.validate)) {
          compiled.validate = val.validate;
        } else {
          schemaError(name, val);
        }
        if (isFunction(val.normalize)) {
          compiled.normalize = val.normalize;
        } else if (!val.normalize) {
          compiled.normalize = createNormalizer();
        } else {
          schemaError(name, val);
        }
        return;
      }
      if (isString2(val)) {
        aliases.push(name);
        return;
      }
      schemaError(name, val);
    });
    aliases.forEach(function(alias) {
      if (!self.__compiled__[self.__schemas__[alias]]) {
        return;
      }
      self.__compiled__[alias].validate = self.__compiled__[self.__schemas__[alias]].validate;
      self.__compiled__[alias].normalize = self.__compiled__[self.__schemas__[alias]].normalize;
    });
    self.__compiled__[""] = { validate: null, normalize: createNormalizer() };
    const slist = Object.keys(self.__compiled__).filter(function(name) {
      return name.length > 0 && self.__compiled__[name];
    }).map(escapeRE2).join("|");
    self.re.schema_test = RegExp(`(^|(?!_)(?:[><\uFF5C]|${re.src_ZPCc}))(${slist})`, "i");
    self.re.schema_search = RegExp(`(^|(?!_)(?:[><\uFF5C]|${re.src_ZPCc}))(${slist})`, "ig");
    self.re.schema_at_start = RegExp(`^${self.re.schema_search.source}`, "i");
    self.re.pretest = RegExp(
      `(${self.re.schema_test.source})|(${self.re.host_fuzzy_test.source})|@`,
      "i"
    );
  }
  __name(compile, "compile");
  function Match(text3, schema, index, lastIndex) {
    const raw = text3.slice(index, lastIndex);
    this.schema = schema.toLowerCase();
    this.index = index;
    this.lastIndex = lastIndex;
    this.raw = raw;
    this.text = raw;
    this.url = raw;
  }
  __name(Match, "Match");
  function LinkifyIt(schemas, options) {
    if (!(this instanceof LinkifyIt)) {
      return new LinkifyIt(schemas, options);
    }
    if (!options) {
      if (isOptionsObj(schemas)) {
        options = schemas;
        schemas = {};
      }
    }
    this.__opts__ = assign2({}, defaultOptions, options);
    this.__schemas__ = assign2({}, defaultSchemas, schemas);
    this.__compiled__ = {};
    this.__tlds__ = tlds_default;
    this.__tlds_replaced__ = false;
    this.re = {};
    compile(this);
  }
  __name(LinkifyIt, "LinkifyIt");
  LinkifyIt.prototype.add = /* @__PURE__ */ __name(function add(schema, definition) {
    this.__schemas__[schema] = definition;
    compile(this);
    return this;
  }, "add");
  LinkifyIt.prototype.set = /* @__PURE__ */ __name(function set(options) {
    this.__opts__ = assign2(this.__opts__, options);
    return this;
  }, "set");
  LinkifyIt.prototype.test = /* @__PURE__ */ __name(function test(text3) {
    if (!text3.length) {
      return false;
    }
    let m, re;
    if (this.re.schema_test.test(text3)) {
      re = this.re.schema_search;
      re.lastIndex = 0;
      while ((m = re.exec(text3)) !== null) {
        if (this.testSchemaAt(text3, m[2], re.lastIndex)) {
          return true;
        }
      }
    }
    if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
      if (text3.search(this.re.host_fuzzy_test) >= 0) {
        if (text3.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy) !== null) {
          return true;
        }
      }
    }
    if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
      if (text3.indexOf("@") >= 0) {
        if (text3.match(this.re.email_fuzzy) !== null) {
          return true;
        }
      }
    }
    return false;
  }, "test");
  LinkifyIt.prototype.pretest = /* @__PURE__ */ __name(function pretest(text3) {
    return this.re.pretest.test(text3);
  }, "pretest");
  LinkifyIt.prototype.testSchemaAt = /* @__PURE__ */ __name(function testSchemaAt(text3, schema, pos) {
    if (!this.__compiled__[schema.toLowerCase()]) {
      return 0;
    }
    return this.__compiled__[schema.toLowerCase()].validate(text3, pos, this);
  }, "testSchemaAt");
  LinkifyIt.prototype.match = /* @__PURE__ */ __name(function match(text3) {
    const result = [];
    const type_schemed = [];
    const type_fuzzy_link = [];
    const type_fuzzy_email = [];
    let m, len, re;
    function choose(a, b) {
      if (!a) {
        return b;
      }
      if (!b) {
        return a;
      }
      if (a.index !== b.index) {
        return a.index < b.index ? a : b;
      }
      return a.lastIndex >= b.lastIndex ? a : b;
    }
    __name(choose, "choose");
    if (!text3.length) {
      return null;
    }
    if (this.re.schema_test.test(text3)) {
      re = this.re.schema_search;
      re.lastIndex = 0;
      while ((m = re.exec(text3)) !== null) {
        len = this.testSchemaAt(text3, m[2], re.lastIndex);
        if (len) {
          type_schemed.push({
            schema: m[2],
            index: m.index + m[1].length,
            lastIndex: m.index + m[0].length + len
          });
        }
      }
    }
    if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
      re = this.__opts__.fuzzyIP ? this.re.link_fuzzy_global : this.re.link_no_ip_fuzzy_global;
      re.lastIndex = 0;
      while ((m = re.exec(text3)) !== null) {
        type_fuzzy_link.push({
          schema: "",
          index: m.index + m[1].length,
          lastIndex: m.index + m[0].length
        });
      }
    }
    if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
      re = this.re.email_fuzzy_global;
      re.lastIndex = 0;
      while ((m = re.exec(text3)) !== null) {
        type_fuzzy_email.push({
          schema: "mailto:",
          index: m.index + m[1].length,
          lastIndex: m.index + m[0].length
        });
      }
    }
    const indexes = [0, 0, 0];
    let lastIndex = 0;
    for (; ; ) {
      const candidates = [
        type_schemed[indexes[0]],
        type_fuzzy_email[indexes[1]],
        type_fuzzy_link[indexes[2]]
      ];
      const candidate = choose(choose(candidates[0], candidates[1]), candidates[2]);
      if (!candidate) {
        break;
      }
      if (candidate === candidates[0]) {
        indexes[0]++;
      } else if (candidate === candidates[1]) {
        indexes[1]++;
      } else {
        indexes[2]++;
      }
      if (candidate.index < lastIndex) {
        continue;
      }
      const match2 = new Match(text3, candidate.schema, candidate.index, candidate.lastIndex);
      this.__compiled__[match2.schema].normalize(match2, this);
      result.push(match2);
      lastIndex = candidate.lastIndex;
    }
    if (result.length) {
      return result;
    }
    return null;
  }, "match");
  LinkifyIt.prototype.matchAtStart = /* @__PURE__ */ __name(function matchAtStart(text3) {
    if (!text3.length) return null;
    const m = this.re.schema_at_start.exec(text3);
    if (!m) return null;
    const len = this.testSchemaAt(text3, m[2], m[0].length);
    if (!len) return null;
    const match2 = new Match(text3, m[2], m.index + m[1].length, m.index + m[0].length + len);
    this.__compiled__[match2.schema].normalize(match2, this);
    return match2;
  }, "matchAtStart");
  LinkifyIt.prototype.tlds = /* @__PURE__ */ __name(function tlds(list2, keepOld) {
    list2 = Array.isArray(list2) ? list2 : [list2];
    if (!keepOld) {
      this.__tlds__ = list2.slice();
      this.__tlds_replaced__ = true;
      compile(this);
      return this;
    }
    this.__tlds__ = this.__tlds__.concat(list2).sort().filter(function(el, idx, arr) {
      return el !== arr[idx - 1];
    }).reverse();
    compile(this);
    return this;
  }, "tlds");
  LinkifyIt.prototype.normalize = /* @__PURE__ */ __name(function normalize2(match2) {
    if (!match2.schema) {
      match2.url = `http://${match2.url}`;
    }
    if (match2.schema === "mailto:" && !/^mailto:/i.test(match2.url)) {
      match2.url = `mailto:${match2.url}`;
    }
  }, "normalize");
  LinkifyIt.prototype.onCompile = /* @__PURE__ */ __name(function onCompile() {
  }, "onCompile");
  var linkify_it_default = LinkifyIt;

  // node_modules/.pnpm/punycode.js@2.3.1/node_modules/punycode.js/punycode.es6.js
  var maxInt = 2147483647;
  var base = 36;
  var tMin = 1;
  var tMax = 26;
  var skew = 38;
  var damp = 700;
  var initialBias = 72;
  var initialN = 128;
  var delimiter = "-";
  var regexPunycode = /^xn--/;
  var regexNonASCII = /[^\0-\x7F]/;
  var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
  var errors = {
    "overflow": "Overflow: input needs wider integers to process",
    "not-basic": "Illegal input >= 0x80 (not a basic code point)",
    "invalid-input": "Invalid input"
  };
  var baseMinusTMin = base - tMin;
  var floor = Math.floor;
  var stringFromCharCode = String.fromCharCode;
  function error(type) {
    throw new RangeError(errors[type]);
  }
  __name(error, "error");
  function map(array, callback) {
    const result = [];
    let length = array.length;
    while (length--) {
      result[length] = callback(array[length]);
    }
    return result;
  }
  __name(map, "map");
  function mapDomain(domain, callback) {
    const parts = domain.split("@");
    let result = "";
    if (parts.length > 1) {
      result = parts[0] + "@";
      domain = parts[1];
    }
    domain = domain.replace(regexSeparators, ".");
    const labels = domain.split(".");
    const encoded = map(labels, callback).join(".");
    return result + encoded;
  }
  __name(mapDomain, "mapDomain");
  function ucs2decode(string) {
    const output = [];
    let counter = 0;
    const length = string.length;
    while (counter < length) {
      const value = string.charCodeAt(counter++);
      if (value >= 55296 && value <= 56319 && counter < length) {
        const extra = string.charCodeAt(counter++);
        if ((extra & 64512) == 56320) {
          output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
        } else {
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }
    return output;
  }
  __name(ucs2decode, "ucs2decode");
  var ucs2encode = /* @__PURE__ */ __name((codePoints) => String.fromCodePoint(...codePoints), "ucs2encode");
  var basicToDigit = /* @__PURE__ */ __name(function(codePoint) {
    if (codePoint >= 48 && codePoint < 58) {
      return 26 + (codePoint - 48);
    }
    if (codePoint >= 65 && codePoint < 91) {
      return codePoint - 65;
    }
    if (codePoint >= 97 && codePoint < 123) {
      return codePoint - 97;
    }
    return base;
  }, "basicToDigit");
  var digitToBasic = /* @__PURE__ */ __name(function(digit, flag) {
    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
  }, "digitToBasic");
  var adapt = /* @__PURE__ */ __name(function(delta, numPoints, firstTime) {
    let k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);
    for (; delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }
    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  }, "adapt");
  var decode2 = /* @__PURE__ */ __name(function(input) {
    const output = [];
    const inputLength = input.length;
    let i = 0;
    let n = initialN;
    let bias = initialBias;
    let basic = input.lastIndexOf(delimiter);
    if (basic < 0) {
      basic = 0;
    }
    for (let j = 0; j < basic; ++j) {
      if (input.charCodeAt(j) >= 128) {
        error("not-basic");
      }
      output.push(input.charCodeAt(j));
    }
    for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
      const oldi = i;
      for (let w = 1, k = base; ; k += base) {
        if (index >= inputLength) {
          error("invalid-input");
        }
        const digit = basicToDigit(input.charCodeAt(index++));
        if (digit >= base) {
          error("invalid-input");
        }
        if (digit > floor((maxInt - i) / w)) {
          error("overflow");
        }
        i += digit * w;
        const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
        if (digit < t) {
          break;
        }
        const baseMinusT = base - t;
        if (w > floor(maxInt / baseMinusT)) {
          error("overflow");
        }
        w *= baseMinusT;
      }
      const out = output.length + 1;
      bias = adapt(i - oldi, out, oldi == 0);
      if (floor(i / out) > maxInt - n) {
        error("overflow");
      }
      n += floor(i / out);
      i %= out;
      output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
  }, "decode");
  var encode2 = /* @__PURE__ */ __name(function(input) {
    const output = [];
    input = ucs2decode(input);
    const inputLength = input.length;
    let n = initialN;
    let delta = 0;
    let bias = initialBias;
    for (const currentValue of input) {
      if (currentValue < 128) {
        output.push(stringFromCharCode(currentValue));
      }
    }
    const basicLength = output.length;
    let handledCPCount = basicLength;
    if (basicLength) {
      output.push(delimiter);
    }
    while (handledCPCount < inputLength) {
      let m = maxInt;
      for (const currentValue of input) {
        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      }
      const handledCPCountPlusOne = handledCPCount + 1;
      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        error("overflow");
      }
      delta += (m - n) * handledCPCountPlusOne;
      n = m;
      for (const currentValue of input) {
        if (currentValue < n && ++delta > maxInt) {
          error("overflow");
        }
        if (currentValue === n) {
          let q = delta;
          for (let k = base; ; k += base) {
            const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (q < t) {
              break;
            }
            const qMinusT = q - t;
            const baseMinusT = base - t;
            output.push(
              stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
            );
            q = floor(qMinusT / baseMinusT);
          }
          output.push(stringFromCharCode(digitToBasic(q, 0)));
          bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }
      ++delta;
      ++n;
    }
    return output.join("");
  }, "encode");
  var toUnicode = /* @__PURE__ */ __name(function(input) {
    return mapDomain(input, function(string) {
      return regexPunycode.test(string) ? decode2(string.slice(4).toLowerCase()) : string;
    });
  }, "toUnicode");
  var toASCII = /* @__PURE__ */ __name(function(input) {
    return mapDomain(input, function(string) {
      return regexNonASCII.test(string) ? "xn--" + encode2(string) : string;
    });
  }, "toASCII");
  var punycode = {
    /**
     * A string representing the current Punycode.js version number.
     * @memberOf punycode
     * @type String
     */
    "version": "2.3.1",
    /**
     * An object of methods to convert from JavaScript's internal character
     * representation (UCS-2) to Unicode code points, and back.
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode
     * @type Object
     */
    "ucs2": {
      "decode": ucs2decode,
      "encode": ucs2encode
    },
    "decode": decode2,
    "encode": encode2,
    "toASCII": toASCII,
    "toUnicode": toUnicode
  };
  var punycode_es6_default = punycode;

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/presets/default.mjs
  var default_default = {
    options: {
      // Enable HTML tags in source
      html: false,
      // Use '/' to close single tags (<br />)
      xhtmlOut: false,
      // Convert '\n' in paragraphs into <br>
      breaks: false,
      // CSS language prefix for fenced blocks
      langPrefix: "language-",
      // autoconvert URL-like texts to links
      linkify: false,
      // Enable some language-neutral replacements + quotes beautification
      typographer: false,
      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: "\u201C\u201D\u2018\u2019",
      /* “”‘’ */
      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,
      // Internal protection, recursion limit
      maxNesting: 100
    },
    components: {
      core: {},
      block: {},
      inline: {}
    }
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/presets/zero.mjs
  var zero_default = {
    options: {
      // Enable HTML tags in source
      html: false,
      // Use '/' to close single tags (<br />)
      xhtmlOut: false,
      // Convert '\n' in paragraphs into <br>
      breaks: false,
      // CSS language prefix for fenced blocks
      langPrefix: "language-",
      // autoconvert URL-like texts to links
      linkify: false,
      // Enable some language-neutral replacements + quotes beautification
      typographer: false,
      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: "\u201C\u201D\u2018\u2019",
      /* “”‘’ */
      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,
      // Internal protection, recursion limit
      maxNesting: 20
    },
    components: {
      core: {
        rules: [
          "normalize",
          "block",
          "inline",
          "text_join"
        ]
      },
      block: {
        rules: [
          "paragraph"
        ]
      },
      inline: {
        rules: [
          "text"
        ],
        rules2: [
          "balance_pairs",
          "fragments_join"
        ]
      }
    }
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/presets/commonmark.mjs
  var commonmark_default = {
    options: {
      // Enable HTML tags in source
      html: true,
      // Use '/' to close single tags (<br />)
      xhtmlOut: true,
      // Convert '\n' in paragraphs into <br>
      breaks: false,
      // CSS language prefix for fenced blocks
      langPrefix: "language-",
      // autoconvert URL-like texts to links
      linkify: false,
      // Enable some language-neutral replacements + quotes beautification
      typographer: false,
      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: "\u201C\u201D\u2018\u2019",
      /* “”‘’ */
      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,
      // Internal protection, recursion limit
      maxNesting: 20
    },
    components: {
      core: {
        rules: [
          "normalize",
          "block",
          "inline",
          "text_join"
        ]
      },
      block: {
        rules: [
          "blockquote",
          "code",
          "fence",
          "heading",
          "hr",
          "html_block",
          "lheading",
          "list",
          "reference",
          "paragraph"
        ]
      },
      inline: {
        rules: [
          "autolink",
          "backticks",
          "emphasis",
          "entity",
          "escape",
          "html_inline",
          "image",
          "link",
          "newline",
          "text"
        ],
        rules2: [
          "balance_pairs",
          "emphasis",
          "fragments_join"
        ]
      }
    }
  };

  // node_modules/.pnpm/markdown-it@14.3.0/node_modules/markdown-it/lib/index.mjs
  var config = {
    default: default_default,
    zero: zero_default,
    commonmark: commonmark_default
  };
  var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
  var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
  function validateLink(url) {
    const str = url.trim().toLowerCase();
    return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
  }
  __name(validateLink, "validateLink");
  var RECODE_HOSTNAME_FOR = ["http:", "https:", "mailto:"];
  function normalizeLink(url) {
    const parsed = parse_default(url, true);
    if (parsed.hostname) {
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
        try {
          parsed.hostname = punycode_es6_default.toASCII(parsed.hostname);
        } catch (er) {
        }
      }
    }
    return encode_default(format(parsed));
  }
  __name(normalizeLink, "normalizeLink");
  function normalizeLinkText(url) {
    const parsed = parse_default(url, true);
    if (parsed.hostname) {
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
        try {
          parsed.hostname = punycode_es6_default.toUnicode(parsed.hostname);
        } catch (er) {
        }
      }
    }
    return decode_default(format(parsed), decode_default.defaultChars + "%");
  }
  __name(normalizeLinkText, "normalizeLinkText");
  function MarkdownIt(presetName, options) {
    if (!(this instanceof MarkdownIt)) {
      return new MarkdownIt(presetName, options);
    }
    if (!options) {
      if (!isString(presetName)) {
        options = presetName || {};
        presetName = "default";
      }
    }
    this.inline = new parser_inline_default();
    this.block = new parser_block_default();
    this.core = new parser_core_default();
    this.renderer = new renderer_default();
    this.linkify = new linkify_it_default();
    this.validateLink = validateLink;
    this.normalizeLink = normalizeLink;
    this.normalizeLinkText = normalizeLinkText;
    this.utils = utils_exports;
    this.helpers = assign({}, helpers_exports);
    this.options = {};
    this.configure(presetName);
    if (options) {
      this.set(options);
    }
  }
  __name(MarkdownIt, "MarkdownIt");
  MarkdownIt.prototype.set = function(options) {
    assign(this.options, options);
    return this;
  };
  MarkdownIt.prototype.configure = function(presets) {
    const self = this;
    if (isString(presets)) {
      const presetName = presets;
      presets = config[presetName];
      if (!presets) {
        throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
      }
    }
    if (!presets) {
      throw new Error("Wrong `markdown-it` preset, can't be empty");
    }
    if (presets.options) {
      self.set(presets.options);
    }
    if (presets.components) {
      Object.keys(presets.components).forEach(function(name) {
        if (presets.components[name].rules) {
          self[name].ruler.enableOnly(presets.components[name].rules);
        }
        if (presets.components[name].rules2) {
          self[name].ruler2.enableOnly(presets.components[name].rules2);
        }
      });
    }
    return this;
  };
  MarkdownIt.prototype.enable = function(list2, ignoreInvalid) {
    let result = [];
    if (!Array.isArray(list2)) {
      list2 = [list2];
    }
    ["core", "block", "inline"].forEach(function(chain) {
      result = result.concat(this[chain].ruler.enable(list2, true));
    }, this);
    result = result.concat(this.inline.ruler2.enable(list2, true));
    const missed = list2.filter(function(name) {
      return result.indexOf(name) < 0;
    });
    if (missed.length && !ignoreInvalid) {
      throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + missed);
    }
    return this;
  };
  MarkdownIt.prototype.disable = function(list2, ignoreInvalid) {
    let result = [];
    if (!Array.isArray(list2)) {
      list2 = [list2];
    }
    ["core", "block", "inline"].forEach(function(chain) {
      result = result.concat(this[chain].ruler.disable(list2, true));
    }, this);
    result = result.concat(this.inline.ruler2.disable(list2, true));
    const missed = list2.filter(function(name) {
      return result.indexOf(name) < 0;
    });
    if (missed.length && !ignoreInvalid) {
      throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + missed);
    }
    return this;
  };
  MarkdownIt.prototype.use = function(plugin) {
    const args = [this].concat(Array.prototype.slice.call(arguments, 1));
    plugin.apply(plugin, args);
    return this;
  };
  MarkdownIt.prototype.parse = function(src, env) {
    if (typeof src !== "string") {
      throw new Error("Input data should be a String");
    }
    const state = new this.core.State(src, this, env);
    this.core.process(state);
    return state.tokens;
  };
  MarkdownIt.prototype.render = function(src, env) {
    env = env || {};
    return this.renderer.render(this.parse(src, env), this.options, env);
  };
  MarkdownIt.prototype.parseInline = function(src, env) {
    const state = new this.core.State(src, this, env);
    state.inlineMode = true;
    this.core.process(state);
    return state.tokens;
  };
  MarkdownIt.prototype.renderInline = function(src, env) {
    env = env || {};
    return this.renderer.render(this.parseInline(src, env), this.options, env);
  };
  var lib_default = MarkdownIt;

  // node_modules/.pnpm/markdown-it-footnote@4.0.0/node_modules/markdown-it-footnote/index.mjs
  function render_footnote_anchor_name(tokens, idx, options, env) {
    const n = Number(tokens[idx].meta.id + 1).toString();
    let prefix = "";
    if (typeof env.docId === "string") prefix = `-${env.docId}-`;
    return prefix + n;
  }
  __name(render_footnote_anchor_name, "render_footnote_anchor_name");
  function render_footnote_caption(tokens, idx) {
    let n = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) n += `:${tokens[idx].meta.subId}`;
    return `[${n}]`;
  }
  __name(render_footnote_caption, "render_footnote_caption");
  function render_footnote_ref(tokens, idx, options, env, slf) {
    const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    const caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
    let refid = id;
    if (tokens[idx].meta.subId > 0) refid += `:${tokens[idx].meta.subId}`;
    return `<sup class="footnote-ref"><a href="#fn${id}" id="fnref${refid}">${caption}</a></sup>`;
  }
  __name(render_footnote_ref, "render_footnote_ref");
  function render_footnote_block_open(tokens, idx, options) {
    return (options.xhtmlOut ? '<hr class="footnotes-sep" />\n' : '<hr class="footnotes-sep">\n') + '<section class="footnotes">\n<ol class="footnotes-list">\n';
  }
  __name(render_footnote_block_open, "render_footnote_block_open");
  function render_footnote_block_close() {
    return "</ol>\n</section>\n";
  }
  __name(render_footnote_block_close, "render_footnote_block_close");
  function render_footnote_open(tokens, idx, options, env, slf) {
    let id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`;
    return `<li id="fn${id}" class="footnote-item">`;
  }
  __name(render_footnote_open, "render_footnote_open");
  function render_footnote_close() {
    return "</li>\n";
  }
  __name(render_footnote_close, "render_footnote_close");
  function render_footnote_anchor(tokens, idx, options, env, slf) {
    let id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`;
    return ` <a href="#fnref${id}" class="footnote-backref">\u21A9\uFE0E</a>`;
  }
  __name(render_footnote_anchor, "render_footnote_anchor");
  function footnote_plugin(md2) {
    const parseLinkLabel2 = md2.helpers.parseLinkLabel;
    const isSpace2 = md2.utils.isSpace;
    md2.renderer.rules.footnote_ref = render_footnote_ref;
    md2.renderer.rules.footnote_block_open = render_footnote_block_open;
    md2.renderer.rules.footnote_block_close = render_footnote_block_close;
    md2.renderer.rules.footnote_open = render_footnote_open;
    md2.renderer.rules.footnote_close = render_footnote_close;
    md2.renderer.rules.footnote_anchor = render_footnote_anchor;
    md2.renderer.rules.footnote_caption = render_footnote_caption;
    md2.renderer.rules.footnote_anchor_name = render_footnote_anchor_name;
    function footnote_def(state, startLine, endLine, silent) {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      if (start + 4 > max) return false;
      if (state.src.charCodeAt(start) !== 91) return false;
      if (state.src.charCodeAt(start + 1) !== 94) return false;
      let pos;
      for (pos = start + 2; pos < max; pos++) {
        if (state.src.charCodeAt(pos) === 32) return false;
        if (state.src.charCodeAt(pos) === 93) {
          break;
        }
      }
      if (pos === start + 2) return false;
      if (pos + 1 >= max || state.src.charCodeAt(++pos) !== 58) return false;
      if (silent) return true;
      pos++;
      if (!state.env.footnotes) state.env.footnotes = {};
      if (!state.env.footnotes.refs) state.env.footnotes.refs = {};
      const label = state.src.slice(start + 2, pos - 2);
      state.env.footnotes.refs[`:${label}`] = -1;
      const token_fref_o = new state.Token("footnote_reference_open", "", 1);
      token_fref_o.meta = { label };
      token_fref_o.level = state.level++;
      state.tokens.push(token_fref_o);
      const oldBMark = state.bMarks[startLine];
      const oldTShift = state.tShift[startLine];
      const oldSCount = state.sCount[startLine];
      const oldParentType = state.parentType;
      const posAfterColon = pos;
      const initial = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);
      let offset = initial;
      while (pos < max) {
        const ch = state.src.charCodeAt(pos);
        if (isSpace2(ch)) {
          if (ch === 9) {
            offset += 4 - offset % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }
        pos++;
      }
      state.tShift[startLine] = pos - posAfterColon;
      state.sCount[startLine] = offset - initial;
      state.bMarks[startLine] = posAfterColon;
      state.blkIndent += 4;
      state.parentType = "footnote";
      if (state.sCount[startLine] < state.blkIndent) {
        state.sCount[startLine] += state.blkIndent;
      }
      state.md.block.tokenize(state, startLine, endLine, true);
      state.parentType = oldParentType;
      state.blkIndent -= 4;
      state.tShift[startLine] = oldTShift;
      state.sCount[startLine] = oldSCount;
      state.bMarks[startLine] = oldBMark;
      const token_fref_c = new state.Token("footnote_reference_close", "", -1);
      token_fref_c.level = --state.level;
      state.tokens.push(token_fref_c);
      return true;
    }
    __name(footnote_def, "footnote_def");
    function footnote_inline(state, silent) {
      const max = state.posMax;
      const start = state.pos;
      if (start + 2 >= max) return false;
      if (state.src.charCodeAt(start) !== 94) return false;
      if (state.src.charCodeAt(start + 1) !== 91) return false;
      const labelStart = start + 2;
      const labelEnd = parseLinkLabel2(state, start + 1);
      if (labelEnd < 0) return false;
      if (!silent) {
        if (!state.env.footnotes) state.env.footnotes = {};
        if (!state.env.footnotes.list) state.env.footnotes.list = [];
        const footnoteId = state.env.footnotes.list.length;
        const tokens = [];
        state.md.inline.parse(
          state.src.slice(labelStart, labelEnd),
          state.md,
          state.env,
          tokens
        );
        const token = state.push("footnote_ref", "", 0);
        token.meta = { id: footnoteId };
        state.env.footnotes.list[footnoteId] = {
          content: state.src.slice(labelStart, labelEnd),
          tokens
        };
      }
      state.pos = labelEnd + 1;
      state.posMax = max;
      return true;
    }
    __name(footnote_inline, "footnote_inline");
    function footnote_ref(state, silent) {
      const max = state.posMax;
      const start = state.pos;
      if (start + 3 > max) return false;
      if (!state.env.footnotes || !state.env.footnotes.refs) return false;
      if (state.src.charCodeAt(start) !== 91) return false;
      if (state.src.charCodeAt(start + 1) !== 94) return false;
      let pos;
      for (pos = start + 2; pos < max; pos++) {
        if (state.src.charCodeAt(pos) === 32) return false;
        if (state.src.charCodeAt(pos) === 10) return false;
        if (state.src.charCodeAt(pos) === 93) {
          break;
        }
      }
      if (pos === start + 2) return false;
      if (pos >= max) return false;
      pos++;
      const label = state.src.slice(start + 2, pos - 1);
      if (typeof state.env.footnotes.refs[`:${label}`] === "undefined") return false;
      if (!silent) {
        if (!state.env.footnotes.list) state.env.footnotes.list = [];
        let footnoteId;
        if (state.env.footnotes.refs[`:${label}`] < 0) {
          footnoteId = state.env.footnotes.list.length;
          state.env.footnotes.list[footnoteId] = { label, count: 0 };
          state.env.footnotes.refs[`:${label}`] = footnoteId;
        } else {
          footnoteId = state.env.footnotes.refs[`:${label}`];
        }
        const footnoteSubId = state.env.footnotes.list[footnoteId].count;
        state.env.footnotes.list[footnoteId].count++;
        const token = state.push("footnote_ref", "", 0);
        token.meta = { id: footnoteId, subId: footnoteSubId, label };
      }
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    __name(footnote_ref, "footnote_ref");
    function footnote_tail(state) {
      let tokens;
      let current;
      let currentLabel;
      let insideRef = false;
      const refTokens = {};
      if (!state.env.footnotes) {
        return;
      }
      state.tokens = state.tokens.filter(function(tok) {
        if (tok.type === "footnote_reference_open") {
          insideRef = true;
          current = [];
          currentLabel = tok.meta.label;
          return false;
        }
        if (tok.type === "footnote_reference_close") {
          insideRef = false;
          refTokens[":" + currentLabel] = current;
          return false;
        }
        if (insideRef) {
          current.push(tok);
        }
        return !insideRef;
      });
      if (!state.env.footnotes.list) {
        return;
      }
      const list2 = state.env.footnotes.list;
      state.tokens.push(new state.Token("footnote_block_open", "", 1));
      for (let i = 0, l = list2.length; i < l; i++) {
        const token_fo = new state.Token("footnote_open", "", 1);
        token_fo.meta = { id: i, label: list2[i].label };
        state.tokens.push(token_fo);
        if (list2[i].tokens) {
          tokens = [];
          const token_po = new state.Token("paragraph_open", "p", 1);
          token_po.block = true;
          tokens.push(token_po);
          const token_i = new state.Token("inline", "", 0);
          token_i.children = list2[i].tokens;
          token_i.content = list2[i].content;
          tokens.push(token_i);
          const token_pc = new state.Token("paragraph_close", "p", -1);
          token_pc.block = true;
          tokens.push(token_pc);
        } else if (list2[i].label) {
          tokens = refTokens[`:${list2[i].label}`];
        }
        if (tokens) state.tokens = state.tokens.concat(tokens);
        let lastParagraph;
        if (state.tokens[state.tokens.length - 1].type === "paragraph_close") {
          lastParagraph = state.tokens.pop();
        } else {
          lastParagraph = null;
        }
        const t = list2[i].count > 0 ? list2[i].count : 1;
        for (let j = 0; j < t; j++) {
          const token_a = new state.Token("footnote_anchor", "", 0);
          token_a.meta = { id: i, subId: j, label: list2[i].label };
          state.tokens.push(token_a);
        }
        if (lastParagraph) {
          state.tokens.push(lastParagraph);
        }
        state.tokens.push(new state.Token("footnote_close", "", -1));
      }
      state.tokens.push(new state.Token("footnote_block_close", "", -1));
    }
    __name(footnote_tail, "footnote_tail");
    md2.block.ruler.before("reference", "footnote_def", footnote_def, { alt: ["paragraph", "reference"] });
    md2.inline.ruler.after("image", "footnote_inline", footnote_inline);
    md2.inline.ruler.after("footnote_inline", "footnote_ref", footnote_ref);
    md2.core.ruler.after("inline", "footnote_tail", footnote_tail);
  }
  __name(footnote_plugin, "footnote_plugin");

  // node_modules/.pnpm/katex@0.16.47/node_modules/katex/dist/katex.mjs
  var ParseError = class _ParseError extends Error {
    static {
      __name(this, "ParseError");
    }
    // The underlying error message without any context added.
    constructor(message, token) {
      var error2 = "KaTeX parse error: " + message;
      var start;
      var end;
      var loc = token && token.loc;
      if (loc && loc.start <= loc.end) {
        var input = loc.lexer.input;
        start = loc.start;
        end = loc.end;
        if (start === input.length) {
          error2 += " at end of input: ";
        } else {
          error2 += " at position " + (start + 1) + ": ";
        }
        var underlined = input.slice(start, end).replace(/[^]/g, "$&\u0332");
        var left;
        if (start > 15) {
          left = "\u2026" + input.slice(start - 15, start);
        } else {
          left = input.slice(0, start);
        }
        var right;
        if (end + 15 < input.length) {
          right = input.slice(end, end + 15) + "\u2026";
        } else {
          right = input.slice(end);
        }
        error2 += left + underlined + right;
      }
      super(error2);
      this.name = "ParseError";
      this.position = void 0;
      this.length = void 0;
      this.rawMessage = void 0;
      Object.setPrototypeOf(this, _ParseError.prototype);
      this.position = start;
      if (start != null && end != null) {
        this.length = end - start;
      }
      this.rawMessage = message;
    }
  };
  var uppercase = /([A-Z])/g;
  var hyphenate = /* @__PURE__ */ __name((str) => str.replace(uppercase, "-$1").toLowerCase(), "hyphenate");
  var ESCAPE_LOOKUP = {
    "&": "&amp;",
    ">": "&gt;",
    "<": "&lt;",
    '"': "&quot;",
    "'": "&#x27;"
  };
  var ESCAPE_REGEX = /[&><"']/g;
  var escape3 = /* @__PURE__ */ __name((text3) => String(text3).replace(ESCAPE_REGEX, (match2) => ESCAPE_LOOKUP[match2]), "escape");
  var getBaseElem = /* @__PURE__ */ __name((group) => {
    if (group.type === "ordgroup") {
      if (group.body.length === 1) {
        return getBaseElem(group.body[0]);
      } else {
        return group;
      }
    } else if (group.type === "color") {
      if (group.body.length === 1) {
        return getBaseElem(group.body[0]);
      } else {
        return group;
      }
    } else if (group.type === "font") {
      return getBaseElem(group.body);
    } else {
      return group;
    }
  }, "getBaseElem");
  var characterNodesTypes = /* @__PURE__ */ new Set(["mathord", "textord", "atom"]);
  var isCharacterBox = /* @__PURE__ */ __name((group) => characterNodesTypes.has(getBaseElem(group).type), "isCharacterBox");
  var protocolFromUrl = /* @__PURE__ */ __name((url) => {
    var protocol = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(url);
    if (!protocol) {
      return "_relative";
    }
    if (protocol[2] !== ":") {
      return null;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(protocol[1])) {
      return null;
    }
    return protocol[1].toLowerCase();
  }, "protocolFromUrl");
  var SETTINGS_SCHEMA = {
    displayMode: {
      type: "boolean",
      description: "Render math in display mode, which puts the math in display style (so \\int and \\sum are large, for example), and centers the math on the page on its own line.",
      cli: "-d, --display-mode"
    },
    output: {
      type: {
        enum: ["htmlAndMathml", "html", "mathml"]
      },
      description: "Determines the markup language of the output.",
      cli: "-F, --format <type>"
    },
    leqno: {
      type: "boolean",
      description: "Render display math in leqno style (left-justified tags)."
    },
    fleqn: {
      type: "boolean",
      description: "Render display math flush left."
    },
    throwOnError: {
      type: "boolean",
      default: true,
      cli: "-t, --no-throw-on-error",
      cliDescription: "Render errors (in the color given by --error-color) instead of throwing a ParseError exception when encountering an error."
    },
    errorColor: {
      type: "string",
      default: "#cc0000",
      cli: "-c, --error-color <color>",
      cliDescription: "A color string given in the format 'rgb' or 'rrggbb' (no #). This option determines the color of errors rendered by the -t option.",
      cliProcessor: /* @__PURE__ */ __name((color) => "#" + color, "cliProcessor")
    },
    macros: {
      type: "object",
      cli: "-m, --macro <def>",
      cliDescription: "Define custom macro of the form '\\foo:expansion' (use multiple -m arguments for multiple macros).",
      cliDefault: [],
      cliProcessor: /* @__PURE__ */ __name((def, defs) => {
        defs.push(def);
        return defs;
      }, "cliProcessor")
    },
    minRuleThickness: {
      type: "number",
      description: "Specifies a minimum thickness, in ems, for fraction lines, `\\sqrt` top lines, `{array}` vertical lines, `\\hline`, `\\hdashline`, `\\underline`, `\\overline`, and the borders of `\\fbox`, `\\boxed`, and `\\fcolorbox`.",
      processor: /* @__PURE__ */ __name((t) => Math.max(0, t), "processor"),
      cli: "--min-rule-thickness <size>",
      cliProcessor: parseFloat
    },
    colorIsTextColor: {
      type: "boolean",
      description: "Makes \\color behave like LaTeX's 2-argument \\textcolor, instead of LaTeX's one-argument \\color mode change.",
      cli: "-b, --color-is-text-color"
    },
    strict: {
      type: [{
        enum: ["warn", "ignore", "error"]
      }, "boolean", "function"],
      description: "Turn on strict / LaTeX faithfulness mode, which throws an error if the input uses features that are not supported by LaTeX.",
      cli: "-S, --strict",
      cliDefault: false
    },
    trust: {
      type: ["boolean", "function"],
      description: "Trust the input, enabling all HTML features such as \\url.",
      cli: "-T, --trust"
    },
    maxSize: {
      type: "number",
      default: Infinity,
      description: "If non-zero, all user-specified sizes, e.g. in \\rule{500em}{500em}, will be capped to maxSize ems. Otherwise, elements and spaces can be arbitrarily large",
      processor: /* @__PURE__ */ __name((s) => Math.max(0, s), "processor"),
      cli: "-s, --max-size <n>",
      cliProcessor: parseInt
    },
    maxExpand: {
      type: "number",
      default: 1e3,
      description: "Limit the number of macro expansions to the specified number, to prevent e.g. infinite macro loops. If set to Infinity, the macro expander will try to fully expand as in LaTeX.",
      processor: /* @__PURE__ */ __name((n) => Math.max(0, n), "processor"),
      cli: "-e, --max-expand <n>",
      cliProcessor: /* @__PURE__ */ __name((n) => n === "Infinity" ? Infinity : parseInt(n), "cliProcessor")
    },
    globalGroup: {
      type: "boolean",
      cli: false
    }
  };
  function getImplicitDefault(type) {
    if (typeof type !== "string") {
      return type.enum[0];
    }
    switch (type) {
      case "boolean":
        return false;
      case "string":
        return "";
      case "number":
        return 0;
      case "object":
        return {};
      default:
        throw new Error("Unexpected schema type; settings must declare an explicit default.");
    }
  }
  __name(getImplicitDefault, "getImplicitDefault");
  function getDefaultValue(schema) {
    if (schema.default !== void 0) {
      return schema.default;
    }
    var type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
    return getImplicitDefault(type);
  }
  __name(getDefaultValue, "getDefaultValue");
  function applySetting(target, prop, options, schema) {
    var optionValue = options[prop];
    target[prop] = optionValue !== void 0 ? schema.processor ? schema.processor(optionValue) : optionValue : getDefaultValue(schema);
  }
  __name(applySetting, "applySetting");
  var Settings = class {
    static {
      __name(this, "Settings");
    }
    constructor(options) {
      if (options === void 0) {
        options = {};
      }
      this.displayMode = void 0;
      this.output = void 0;
      this.leqno = void 0;
      this.fleqn = void 0;
      this.throwOnError = void 0;
      this.errorColor = void 0;
      this.macros = void 0;
      this.minRuleThickness = void 0;
      this.colorIsTextColor = void 0;
      this.strict = void 0;
      this.trust = void 0;
      this.maxSize = void 0;
      this.maxExpand = void 0;
      this.globalGroup = void 0;
      options = options || {};
      for (var prop of Object.keys(SETTINGS_SCHEMA)) {
        var schema = SETTINGS_SCHEMA[prop];
        if (schema) {
          applySetting(this, prop, options, schema);
        }
      }
    }
    /**
     * Report nonstrict (non-LaTeX-compatible) input.
     * Can safely not be called if `this.strict` is false in JavaScript.
     */
    reportNonstrict(errorCode, errorMsg, token) {
      var strict = this.strict;
      if (typeof strict === "function") {
        strict = strict(errorCode, errorMsg, token);
      }
      if (!strict || strict === "ignore") {
        return;
      } else if (strict === true || strict === "error") {
        throw new ParseError("LaTeX-incompatible input and strict mode is set to 'error': " + (errorMsg + " [" + errorCode + "]"), token);
      } else if (strict === "warn") {
        typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
      } else {
        typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
      }
    }
    /**
     * Check whether to apply strict (LaTeX-adhering) behavior for unusual
     * input (like `\\`).  Unlike `nonstrict`, will not throw an error;
     * instead, "error" translates to a return value of `true`, while "ignore"
     * translates to a return value of `false`.  May still print a warning:
     * "warn" prints a warning and returns `false`.
     * This is for the second category of `errorCode`s listed in the README.
     */
    useStrictBehavior(errorCode, errorMsg, token) {
      var strict = this.strict;
      if (typeof strict === "function") {
        try {
          strict = strict(errorCode, errorMsg, token);
        } catch (error2) {
          strict = "error";
        }
      }
      if (!strict || strict === "ignore") {
        return false;
      } else if (strict === true || strict === "error") {
        return true;
      } else if (strict === "warn") {
        typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
        return false;
      } else {
        typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
        return false;
      }
    }
    /**
     * Check whether to test potentially dangerous input, and return
     * `true` (trusted) or `false` (untrusted).  The sole argument `context`
     * should be an object with `command` field specifying the relevant LaTeX
     * command (as a string starting with `\`), and any other arguments, etc.
     * If `context` has a `url` field, a `protocol` field will automatically
     * get added by this function (changing the specified object).
     */
    isTrusted(context) {
      if ("url" in context && context.url && !context.protocol) {
        var protocol = protocolFromUrl(context.url);
        if (protocol == null) {
          return false;
        }
        context.protocol = protocol;
      }
      var trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
      return Boolean(trust);
    }
  };
  var Style = class {
    static {
      __name(this, "Style");
    }
    constructor(id, size, cramped) {
      this.id = void 0;
      this.size = void 0;
      this.cramped = void 0;
      this.id = id;
      this.size = size;
      this.cramped = cramped;
    }
    /**
     * Get the style of a superscript given a base in the current style.
     */
    sup() {
      return styles[sup[this.id]];
    }
    /**
     * Get the style of a subscript given a base in the current style.
     */
    sub() {
      return styles[sub[this.id]];
    }
    /**
     * Get the style of a fraction numerator given the fraction in the current
     * style.
     */
    fracNum() {
      return styles[fracNum[this.id]];
    }
    /**
     * Get the style of a fraction denominator given the fraction in the current
     * style.
     */
    fracDen() {
      return styles[fracDen[this.id]];
    }
    /**
     * Get the cramped version of a style (in particular, cramping a cramped style
     * doesn't change the style).
     */
    cramp() {
      return styles[cramp[this.id]];
    }
    /**
     * Get a text or display version of this style.
     */
    text() {
      return styles[text$1[this.id]];
    }
    /**
     * Return true if this style is tightly spaced (scriptstyle/scriptscriptstyle)
     */
    isTight() {
      return this.size >= 2;
    }
  };
  var D = 0;
  var Dc = 1;
  var T = 2;
  var Tc = 3;
  var S = 4;
  var Sc = 5;
  var SS = 6;
  var SSc = 7;
  var styles = [new Style(D, 0, false), new Style(Dc, 0, true), new Style(T, 1, false), new Style(Tc, 1, true), new Style(S, 2, false), new Style(Sc, 2, true), new Style(SS, 3, false), new Style(SSc, 3, true)];
  var sup = [S, Sc, S, Sc, SS, SSc, SS, SSc];
  var sub = [Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc];
  var fracNum = [T, Tc, S, Sc, SS, SSc, SS, SSc];
  var fracDen = [Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc];
  var cramp = [Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc];
  var text$1 = [D, Dc, T, Tc, T, Tc, T, Tc];
  var Style$1 = {
    DISPLAY: styles[D],
    TEXT: styles[T],
    SCRIPT: styles[S],
    SCRIPTSCRIPT: styles[SS]
  };
  var scriptData = [{
    // Latin characters beyond the Latin-1 characters we have metrics for.
    // Needed for Czech, Hungarian and Turkish text, for example.
    name: "latin",
    blocks: [
      [256, 591],
      // Latin Extended-A and Latin Extended-B
      [768, 879]
      // Combining Diacritical marks
    ]
  }, {
    // The Cyrillic script used by Russian and related languages.
    // A Cyrillic subset used to be supported as explicitly defined
    // symbols in symbols.js
    name: "cyrillic",
    blocks: [[1024, 1279]]
  }, {
    // Armenian
    name: "armenian",
    blocks: [[1328, 1423]]
  }, {
    // The Brahmic scripts of South and Southeast Asia
    // Devanagari (0900–097F)
    // Bengali (0980–09FF)
    // Gurmukhi (0A00–0A7F)
    // Gujarati (0A80–0AFF)
    // Oriya (0B00–0B7F)
    // Tamil (0B80–0BFF)
    // Telugu (0C00–0C7F)
    // Kannada (0C80–0CFF)
    // Malayalam (0D00–0D7F)
    // Sinhala (0D80–0DFF)
    // Thai (0E00–0E7F)
    // Lao (0E80–0EFF)
    // Tibetan (0F00–0FFF)
    // Myanmar (1000–109F)
    name: "brahmic",
    blocks: [[2304, 4255]]
  }, {
    name: "georgian",
    blocks: [[4256, 4351]]
  }, {
    // Chinese and Japanese.
    // The "k" in cjk is for Korean, but we've separated Korean out
    name: "cjk",
    blocks: [
      [12288, 12543],
      // CJK symbols and punctuation, Hiragana, Katakana
      [19968, 40879],
      // CJK ideograms
      [65280, 65376]
      // Fullwidth punctuation
      // TODO: add halfwidth Katakana and Romanji glyphs
    ]
  }, {
    // Korean
    name: "hangul",
    blocks: [[44032, 55215]]
  }];
  function scriptFromCodepoint(codepoint) {
    for (var i = 0; i < scriptData.length; i++) {
      var script2 = scriptData[i];
      for (var _i = 0; _i < script2.blocks.length; _i++) {
        var block2 = script2.blocks[_i];
        if (codepoint >= block2[0] && codepoint <= block2[1]) {
          return script2.name;
        }
      }
    }
    return null;
  }
  __name(scriptFromCodepoint, "scriptFromCodepoint");
  var allBlocks = [];
  scriptData.forEach((s) => s.blocks.forEach((b) => allBlocks.push(...b)));
  function supportedCodepoint(codepoint) {
    for (var i = 0; i < allBlocks.length; i += 2) {
      if (codepoint >= allBlocks[i] && codepoint <= allBlocks[i + 1]) {
        return true;
      }
    }
    return false;
  }
  __name(supportedCodepoint, "supportedCodepoint");
  var doubleBrushStroke = /* @__PURE__ */ __name((svgPath) => svgPath + " " + svgPath, "doubleBrushStroke");
  var hLinePad = 80;
  var sqrtMain = /* @__PURE__ */ __name(function sqrtMain2(extraVinculum, hLinePad2) {
    return "M95," + (622 + extraVinculum + hLinePad2) + "\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl" + extraVinculum / 2.075 + " -" + extraVinculum + "\nc5.3,-9.3,12,-14,20,-14\nH400000v" + (40 + extraVinculum) + "H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM" + (834 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
  }, "sqrtMain");
  var sqrtSize1 = /* @__PURE__ */ __name(function sqrtSize12(extraVinculum, hLinePad2) {
    return "M263," + (601 + extraVinculum + hLinePad2) + "c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl" + extraVinculum / 2.084 + " -" + extraVinculum + "\nc4.7,-7.3,11,-11,19,-11\nH40000v" + (40 + extraVinculum) + "H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
  }, "sqrtSize1");
  var sqrtSize2 = /* @__PURE__ */ __name(function sqrtSize22(extraVinculum, hLinePad2) {
    return "M983 " + (10 + extraVinculum + hLinePad2) + "\nl" + extraVinculum / 3.13 + " -" + extraVinculum + "\nc4,-6.7,10,-10,18,-10 H400000v" + (40 + extraVinculum) + "\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
  }, "sqrtSize2");
  var sqrtSize3 = /* @__PURE__ */ __name(function sqrtSize32(extraVinculum, hLinePad2) {
    return "M424," + (2398 + extraVinculum + hLinePad2) + "\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl" + extraVinculum / 4.223 + " -" + extraVinculum + "c4,-6.7,10,-10,18,-10 H400000\nv" + (40 + extraVinculum) + "H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M" + (1001 + extraVinculum) + " " + hLinePad2 + "\nh400000v" + (40 + extraVinculum) + "h-400000z";
  }, "sqrtSize3");
  var sqrtSize4 = /* @__PURE__ */ __name(function sqrtSize42(extraVinculum, hLinePad2) {
    return "M473," + (2713 + extraVinculum + hLinePad2) + "\nc339.3,-1799.3,509.3,-2700,510,-2702 l" + extraVinculum / 5.298 + " -" + extraVinculum + "\nc3.3,-7.3,9.3,-11,18,-11 H400000v" + (40 + extraVinculum) + "H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "H1017.7z";
  }, "sqrtSize4");
  var phasePath = /* @__PURE__ */ __name(function phasePath2(y) {
    var x = y / 2;
    return "M400000 " + y + " H0 L" + x + " 0 l65 45 L145 " + (y - 80) + " H400000z";
  }, "phasePath");
  var sqrtTall = /* @__PURE__ */ __name(function sqrtTall2(extraVinculum, hLinePad2, viewBoxHeight) {
    var vertSegment = viewBoxHeight - 54 - hLinePad2 - extraVinculum;
    return "M702 " + (extraVinculum + hLinePad2) + "H400000" + (40 + extraVinculum) + "\nH742v" + vertSegment + "l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 " + hLinePad2 + "H400000v" + (40 + extraVinculum) + "H742z";
  }, "sqrtTall");
  var sqrtPath = /* @__PURE__ */ __name(function sqrtPath2(size, extraVinculum, viewBoxHeight) {
    extraVinculum = 1e3 * extraVinculum;
    var path2 = "";
    switch (size) {
      case "sqrtMain":
        path2 = sqrtMain(extraVinculum, hLinePad);
        break;
      case "sqrtSize1":
        path2 = sqrtSize1(extraVinculum, hLinePad);
        break;
      case "sqrtSize2":
        path2 = sqrtSize2(extraVinculum, hLinePad);
        break;
      case "sqrtSize3":
        path2 = sqrtSize3(extraVinculum, hLinePad);
        break;
      case "sqrtSize4":
        path2 = sqrtSize4(extraVinculum, hLinePad);
        break;
      case "sqrtTall":
        path2 = sqrtTall(extraVinculum, hLinePad, viewBoxHeight);
    }
    return path2;
  }, "sqrtPath");
  var innerPath = /* @__PURE__ */ __name(function innerPath2(name, height) {
    switch (name) {
      case "\u239C":
        return doubleBrushStroke("M291 0 H417 V" + height + " H291z");
      case "\u2223":
        return doubleBrushStroke("M145 0 H188 V" + height + " H145z");
      case "\u2225":
        return doubleBrushStroke("M145 0 H188 V" + height + " H145z") + doubleBrushStroke("M367 0 H410 V" + height + " H367z");
      case "\u239F":
        return doubleBrushStroke("M457 0 H583 V" + height + " H457z");
      case "\u23A2":
        return doubleBrushStroke("M319 0 H403 V" + height + " H319z");
      case "\u23A5":
        return doubleBrushStroke("M263 0 H347 V" + height + " H263z");
      case "\u23AA":
        return doubleBrushStroke("M384 0 H504 V" + height + " H384z");
      case "\u23D0":
        return doubleBrushStroke("M312 0 H355 V" + height + " H312z");
      case "\u2016":
        return doubleBrushStroke("M257 0 H300 V" + height + " H257z") + doubleBrushStroke("M478 0 H521 V" + height + " H478z");
      default:
        return "";
    }
  }, "innerPath");
  var path = {
    // The doubleleftarrow geometry is from glyph U+21D0 in the font KaTeX Main
    doubleleftarrow: "M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z",
    // doublerightarrow is from glyph U+21D2 in font KaTeX Main
    doublerightarrow: "M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z",
    // leftarrow is from glyph U+2190 in font KaTeX Main
    leftarrow: "M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z",
    // overbrace is from glyphs U+23A9/23A8/23A7 in font KaTeX_Size4-Regular
    leftbrace: "M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z",
    leftbraceunder: "M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z",
    // overgroup is from the MnSymbol package (public domain)
    leftgroup: "M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z",
    leftgroupunder: "M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z",
    // Harpoons are from glyph U+21BD in font KaTeX Main
    leftharpoon: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z",
    leftharpoonplus: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z",
    leftharpoondown: "M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z",
    leftharpoondownplus: "M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z",
    // hook is from glyph U+21A9 in font KaTeX Main
    lefthook: "M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z",
    leftlinesegment: doubleBrushStroke("M40 281 V428 H0 V94 H40 V241 H400000 v40z"),
    leftbracketunder: doubleBrushStroke("M0 0 h120 V290 H399995 v120 H0z"),
    leftbracketover: doubleBrushStroke("M0 440 h120 V150 H399995 v-120 H0z"),
    leftmapsto: doubleBrushStroke("M40 281 V448H0V74H40V241H400000v40z"),
    // tofrom is from glyph U+21C4 in font KaTeX AMS Regular
    leftToFrom: "M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z",
    longequal: doubleBrushStroke("M0 50 h400000 v40H0z m0 194h40000v40H0z"),
    midbrace: "M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z",
    midbraceunder: "M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z",
    oiintSize1: "M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z",
    oiintSize2: "M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z",
    oiiintSize1: "M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z",
    oiiintSize2: "M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z",
    rightarrow: "M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z",
    rightbrace: "M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z",
    rightbraceunder: "M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z",
    rightgroup: "M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z",
    rightgroupunder: "M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z",
    rightharpoon: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z",
    rightharpoonplus: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z",
    rightharpoondown: "M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z",
    rightharpoondownplus: "M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z",
    righthook: "M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z",
    rightlinesegment: doubleBrushStroke("M399960 241 V94 h40 V428 h-40 V281 H0 v-40z"),
    rightbracketunder: doubleBrushStroke("M399995 0 h-120 V290 H0 v120 H400000z"),
    rightbracketover: doubleBrushStroke("M399995 440 h-120 V150 H0 v-120 H399995z"),
    rightToFrom: "M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z",
    // twoheadleftarrow is from glyph U+219E in font KaTeX AMS Regular
    twoheadleftarrow: "M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z",
    twoheadrightarrow: "M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z",
    // tilde1 is a modified version of a glyph from the MnSymbol package
    tilde1: "M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z",
    // ditto tilde2, tilde3, & tilde4
    tilde2: "M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z",
    tilde3: "M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z",
    tilde4: "M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z",
    // vec is from glyph U+20D7 in font KaTeX Main
    vec: "M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z",
    // widehat1 is a modified version of a glyph from the MnSymbol package
    widehat1: "M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z",
    // ditto widehat2, widehat3, & widehat4
    widehat2: "M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
    widehat3: "M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
    widehat4: "M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
    // widecheck paths are all inverted versions of widehat
    widecheck1: "M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z",
    widecheck2: "M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
    widecheck3: "M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
    widecheck4: "M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
    // The next ten paths support reaction arrows from the mhchem package.
    // Arrows for \ce{<-->} are offset from xAxis by 0.22ex, per mhchem in LaTeX
    // baraboveleftarrow is mostly from glyph U+2190 in font KaTeX Main
    baraboveleftarrow: "M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z",
    // rightarrowabovebar is mostly from glyph U+2192, KaTeX Main
    rightarrowabovebar: "M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z",
    // The short left harpoon has 0.5em (i.e. 500 units) kern on the left end.
    // Ref from mhchem.sty: \rlap{\raisebox{-.22ex}{$\kern0.5em
    baraboveshortleftharpoon: "M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z",
    rightharpoonaboveshortbar: "M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z",
    shortbaraboveleftharpoon: "M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z",
    shortrightharpoonabovebar: "M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z"
  };
  var tallDelim = /* @__PURE__ */ __name(function tallDelim2(label, midHeight) {
    switch (label) {
      case "lbrack":
        return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v1759 v84 h347 v-84\nH403z M403 1759 V0 H319 V1759 v" + midHeight + " v1759 v84 h84z";
      case "rbrack":
        return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v1759 H0 v84 H347z\nM347 1759 V0 H263 V1759 v" + midHeight + " v1759 h84z";
      case "vert":
        return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z";
      case "doublevert":
        return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z\nM367 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M410 15 H367 v585 v" + midHeight + " v585 h43z";
      case "lfloor":
        return "M319 602 V0 H403 V602 v" + midHeight + " v1715 h263 v84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
      case "rfloor":
        return "M319 602 V0 H403 V602 v" + midHeight + " v1799 H0 v-84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
      case "lceil":
        return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v602 h84z\nM403 1759 V0 H319 V1759 v" + midHeight + " v602 h84z";
      case "rceil":
        return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v602 h84z\nM347 1759 V0 h-84 V1759 v" + midHeight + " v602 h84z";
      case "lparen":
        return "M863,9c0,-2,-2,-5,-6,-9c0,0,-17,0,-17,0c-12.7,0,-19.3,0.3,-20,1\nc-5.3,5.3,-10.3,11,-15,17c-242.7,294.7,-395.3,682,-458,1162c-21.3,163.3,-33.3,349,\n-36,557 l0," + (midHeight + 84) + "c0.2,6,0,26,0,60c2,159.3,10,310.7,24,454c53.3,528,210,\n949.7,470,1265c4.7,6,9.7,11.7,15,17c0.7,0.7,7,1,19,1c0,0,18,0,18,0c4,-4,6,-7,6,-9\nc0,-2.7,-3.3,-8.7,-10,-18c-135.3,-192.7,-235.5,-414.3,-300.5,-665c-65,-250.7,-102.5,\n-544.7,-112.5,-882c-2,-104,-3,-167,-3,-189\nl0,-" + (midHeight + 92) + "c0,-162.7,5.7,-314,17,-454c20.7,-272,63.7,-513,129,-723c65.3,\n-210,155.3,-396.3,270,-559c6.7,-9.3,10,-15.3,10,-18z";
      case "rparen":
        return "M76,0c-16.7,0,-25,3,-25,9c0,2,2,6.3,6,13c21.3,28.7,42.3,60.3,\n63,95c96.7,156.7,172.8,332.5,228.5,527.5c55.7,195,92.8,416.5,111.5,664.5\nc11.3,139.3,17,290.7,17,454c0,28,1.7,43,3.3,45l0," + (midHeight + 9) + "\nc-3,4,-3.3,16.7,-3.3,38c0,162,-5.7,313.7,-17,455c-18.7,248,-55.8,469.3,-111.5,664\nc-55.7,194.7,-131.8,370.3,-228.5,527c-20.7,34.7,-41.7,66.3,-63,95c-2,3.3,-4,7,-6,11\nc0,7.3,5.7,11,17,11c0,0,11,0,11,0c9.3,0,14.3,-0.3,15,-1c5.3,-5.3,10.3,-11,15,-17\nc242.7,-294.7,395.3,-681.7,458,-1161c21.3,-164.7,33.3,-350.7,36,-558\nl0,-" + (midHeight + 144) + "c-2,-159.3,-10,-310.7,-24,-454c-53.3,-528,-210,-949.7,\n-470,-1265c-4.7,-6,-9.7,-11.7,-15,-17c-0.7,-0.7,-6.7,-1,-18,-1z";
      default:
        throw new Error("Unknown stretchy delimiter.");
    }
  }, "tallDelim");
  function isMathDomNode(node) {
    return "toText" in node;
  }
  __name(isMathDomNode, "isMathDomNode");
  var DocumentFragment = class {
    static {
      __name(this, "DocumentFragment");
    }
    // Never used; needed for satisfying interface.
    constructor(children) {
      this.children = void 0;
      this.classes = void 0;
      this.height = void 0;
      this.depth = void 0;
      this.maxFontSize = void 0;
      this.style = void 0;
      this.children = children;
      this.classes = [];
      this.height = 0;
      this.depth = 0;
      this.maxFontSize = 0;
      this.style = {};
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    /** Convert the fragment into a node. */
    toNode() {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < this.children.length; i++) {
        frag.appendChild(this.children[i].toNode());
      }
      return frag;
    }
    /** Convert the fragment into HTML markup. */
    toMarkup() {
      var markup = "";
      for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      return markup;
    }
    /**
     * Converts the math node into a string, similar to innerText. Applies to
     * MathDomNode's only.
     */
    toText() {
      return this.children.map((child) => {
        if (isMathDomNode(child)) {
          return child.toText();
        }
        throw new Error("Expected MathDomNode with toText, got " + child.constructor.name);
      }).join("");
    }
  };
  var ptPerUnit = {
    // https://en.wikibooks.org/wiki/LaTeX/Lengths and
    // https://tex.stackexchange.com/a/8263
    "pt": 1,
    // TeX point
    "mm": 7227 / 2540,
    // millimeter
    "cm": 7227 / 254,
    // centimeter
    "in": 72.27,
    // inch
    "bp": 803 / 800,
    // big (PostScript) points
    "pc": 12,
    // pica
    "dd": 1238 / 1157,
    // didot
    "cc": 14856 / 1157,
    // cicero (12 didot)
    "nd": 685 / 642,
    // new didot
    "nc": 1370 / 107,
    // new cicero (12 new didot)
    "sp": 1 / 65536,
    // scaled point (TeX's internal smallest unit)
    // https://tex.stackexchange.com/a/41371
    "px": 803 / 800
    // \pdfpxdimen defaults to 1 bp in pdfTeX and LuaTeX
  };
  var relativeUnit = {
    "ex": true,
    "em": true,
    "mu": true
  };
  var validUnit = /* @__PURE__ */ __name(function validUnit2(unit) {
    if (typeof unit !== "string") {
      unit = unit.unit;
    }
    return unit in ptPerUnit || unit in relativeUnit || unit === "ex";
  }, "validUnit");
  var calculateSize = /* @__PURE__ */ __name(function calculateSize2(sizeValue, options) {
    var scale;
    if (sizeValue.unit in ptPerUnit) {
      scale = ptPerUnit[sizeValue.unit] / options.fontMetrics().ptPerEm / options.sizeMultiplier;
    } else if (sizeValue.unit === "mu") {
      scale = options.fontMetrics().cssEmPerMu;
    } else {
      var unitOptions;
      if (options.style.isTight()) {
        unitOptions = options.havingStyle(options.style.text());
      } else {
        unitOptions = options;
      }
      if (sizeValue.unit === "ex") {
        scale = unitOptions.fontMetrics().xHeight;
      } else if (sizeValue.unit === "em") {
        scale = unitOptions.fontMetrics().quad;
      } else {
        throw new ParseError("Invalid unit: '" + sizeValue.unit + "'");
      }
      if (unitOptions !== options) {
        scale *= unitOptions.sizeMultiplier / options.sizeMultiplier;
      }
    }
    return Math.min(sizeValue.number * scale, options.maxSize);
  }, "calculateSize");
  var makeEm = /* @__PURE__ */ __name(function makeEm2(n) {
    return +n.toFixed(4) + "em";
  }, "makeEm");
  var createClass = /* @__PURE__ */ __name(function createClass2(classes) {
    return classes.filter((cls) => cls).join(" ");
  }, "createClass");
  var cssStyleToString = /* @__PURE__ */ __name(function cssStyleToString2(style2) {
    var styles2 = "";
    for (var key of Object.keys(style2)) {
      var value = style2[key];
      if (value !== void 0) {
        styles2 += hyphenate(key) + ":" + value + ";";
      }
    }
    return styles2;
  }, "cssStyleToString");
  var initNode = /* @__PURE__ */ __name(function initNode2(classes, options, style2) {
    this.classes = classes || [];
    this.attributes = {};
    this.height = 0;
    this.depth = 0;
    this.maxFontSize = 0;
    this.style = style2 || {};
    if (options) {
      if (options.style.isTight()) {
        this.classes.push("mtight");
      }
      var color = options.getColor();
      if (color) {
        this.style.color = color;
      }
    }
  }, "initNode");
  var toNode = /* @__PURE__ */ __name(function toNode2(tagName) {
    var node = document.createElement(tagName);
    node.className = createClass(this.classes);
    Object.assign(node.style, this.style);
    for (var attr of Object.keys(this.attributes)) {
      node.setAttribute(attr, this.attributes[attr]);
    }
    for (var i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }
    return node;
  }, "toNode");
  var invalidAttributeNameRegex = /[\s"'>/=\x00-\x1f]/;
  var toMarkup = /* @__PURE__ */ __name(function toMarkup2(tagName) {
    var markup = "<" + tagName;
    if (this.classes.length) {
      markup += ' class="' + escape3(createClass(this.classes)) + '"';
    }
    var styles2 = cssStyleToString(this.style);
    if (styles2) {
      markup += ' style="' + escape3(styles2) + '"';
    }
    for (var attr of Object.keys(this.attributes)) {
      if (invalidAttributeNameRegex.test(attr)) {
        throw new ParseError("Invalid attribute name '" + attr + "'");
      }
      markup += " " + attr + '="' + escape3(this.attributes[attr]) + '"';
    }
    markup += ">";
    for (var i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }
    markup += "</" + tagName + ">";
    return markup;
  }, "toMarkup");
  var Span = class {
    static {
      __name(this, "Span");
    }
    constructor(classes, children, options, style2) {
      this.children = void 0;
      this.attributes = void 0;
      this.classes = void 0;
      this.height = void 0;
      this.depth = void 0;
      this.width = void 0;
      this.maxFontSize = void 0;
      this.style = void 0;
      this.italic = void 0;
      initNode.call(this, classes, options, style2);
      this.children = children || [];
    }
    /**
     * Sets an arbitrary attribute on the span. Warning: use this wisely. Not
     * all browsers support attributes the same, and having too many custom
     * attributes is probably bad.
     */
    setAttribute(attribute2, value) {
      this.attributes[attribute2] = value;
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    toNode() {
      return toNode.call(this, "span");
    }
    toMarkup() {
      return toMarkup.call(this, "span");
    }
  };
  var Anchor = class {
    static {
      __name(this, "Anchor");
    }
    constructor(href, classes, children, options) {
      this.children = void 0;
      this.attributes = void 0;
      this.classes = void 0;
      this.height = void 0;
      this.depth = void 0;
      this.maxFontSize = void 0;
      this.style = void 0;
      initNode.call(this, classes, options);
      this.children = children || [];
      this.setAttribute("href", href);
    }
    setAttribute(attribute2, value) {
      this.attributes[attribute2] = value;
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    toNode() {
      return toNode.call(this, "a");
    }
    toMarkup() {
      return toMarkup.call(this, "a");
    }
  };
  var Img = class {
    static {
      __name(this, "Img");
    }
    constructor(src, alt, style2) {
      this.src = void 0;
      this.alt = void 0;
      this.classes = void 0;
      this.height = void 0;
      this.depth = void 0;
      this.maxFontSize = void 0;
      this.style = void 0;
      this.alt = alt;
      this.src = src;
      this.classes = ["mord"];
      this.height = 0;
      this.depth = 0;
      this.maxFontSize = 0;
      this.style = style2;
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    toNode() {
      var node = document.createElement("img");
      node.src = this.src;
      node.alt = this.alt;
      node.className = "mord";
      Object.assign(node.style, this.style);
      return node;
    }
    toMarkup() {
      var markup = '<img src="' + escape3(this.src) + '"' + (' alt="' + escape3(this.alt) + '"');
      var styles2 = cssStyleToString(this.style);
      if (styles2) {
        markup += ' style="' + escape3(styles2) + '"';
      }
      markup += "'/>";
      return markup;
    }
  };
  var iCombinations = {
    "\xEE": "\u0131\u0302",
    "\xEF": "\u0131\u0308",
    "\xED": "\u0131\u0301",
    // 'ī': '\u0131\u0304', // enable when we add Extended Latin
    "\xEC": "\u0131\u0300"
  };
  var SymbolNode = class {
    static {
      __name(this, "SymbolNode");
    }
    constructor(text3, height, depth, italic2, skew2, width, classes, style2) {
      this.text = void 0;
      this.height = void 0;
      this.depth = void 0;
      this.italic = void 0;
      this.skew = void 0;
      this.width = void 0;
      this.maxFontSize = void 0;
      this.classes = void 0;
      this.style = void 0;
      this.text = text3;
      this.height = height || 0;
      this.depth = depth || 0;
      this.italic = italic2 || 0;
      this.skew = skew2 || 0;
      this.width = width || 0;
      this.classes = classes || [];
      this.style = style2 || {};
      this.maxFontSize = 0;
      var script2 = scriptFromCodepoint(this.text.charCodeAt(0));
      if (script2) {
        this.classes.push(script2 + "_fallback");
      }
      if (/[îïíì]/.test(this.text)) {
        this.text = iCombinations[this.text];
      }
    }
    hasClass(className) {
      return this.classes.includes(className);
    }
    /**
     * Creates a text node or span from a symbol node. Note that a span is only
     * created if it is needed.
     */
    toNode() {
      var node = document.createTextNode(this.text);
      var span = null;
      if (this.italic > 0) {
        span = document.createElement("span");
        span.style.marginRight = makeEm(this.italic);
      }
      if (this.classes.length > 0) {
        span = span || document.createElement("span");
        span.className = createClass(this.classes);
      }
      if (Object.keys(this.style).length > 0) {
        span = span || document.createElement("span");
        Object.assign(span.style, this.style);
      }
      if (span) {
        span.appendChild(node);
        return span;
      } else {
        return node;
      }
    }
    /**
     * Creates markup for a symbol node.
     */
    toMarkup() {
      var needsSpan = false;
      var markup = "<span";
      if (this.classes.length) {
        needsSpan = true;
        markup += ' class="';
        markup += escape3(createClass(this.classes));
        markup += '"';
      }
      var styles2 = "";
      if (this.italic > 0) {
        styles2 += "margin-right:" + makeEm(this.italic) + ";";
      }
      styles2 += cssStyleToString(this.style);
      if (styles2) {
        needsSpan = true;
        markup += ' style="' + escape3(styles2) + '"';
      }
      var escaped = escape3(this.text);
      if (needsSpan) {
        markup += ">";
        markup += escaped;
        markup += "</span>";
        return markup;
      } else {
        return escaped;
      }
    }
  };
  var SvgNode = class {
    static {
      __name(this, "SvgNode");
    }
    constructor(children, attributes) {
      this.children = void 0;
      this.attributes = void 0;
      this.children = children || [];
      this.attributes = attributes || {};
    }
    toNode() {
      var svgNS = "http://www.w3.org/2000/svg";
      var node = document.createElementNS(svgNS, "svg");
      for (var attr of Object.keys(this.attributes)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
      for (var i = 0; i < this.children.length; i++) {
        node.appendChild(this.children[i].toNode());
      }
      return node;
    }
    toMarkup() {
      var markup = '<svg xmlns="http://www.w3.org/2000/svg"';
      for (var attr of Object.keys(this.attributes)) {
        markup += " " + attr + '="' + escape3(this.attributes[attr]) + '"';
      }
      markup += ">";
      for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      markup += "</svg>";
      return markup;
    }
  };
  var PathNode = class {
    static {
      __name(this, "PathNode");
    }
    constructor(pathName, alternate) {
      this.pathName = void 0;
      this.alternate = void 0;
      this.pathName = pathName;
      this.alternate = alternate;
    }
    toNode() {
      var svgNS = "http://www.w3.org/2000/svg";
      var node = document.createElementNS(svgNS, "path");
      if (this.alternate) {
        node.setAttribute("d", this.alternate);
      } else {
        node.setAttribute("d", path[this.pathName]);
      }
      return node;
    }
    toMarkup() {
      if (this.alternate) {
        return '<path d="' + escape3(this.alternate) + '"/>';
      } else {
        return '<path d="' + escape3(path[this.pathName]) + '"/>';
      }
    }
  };
  var LineNode = class {
    static {
      __name(this, "LineNode");
    }
    constructor(attributes) {
      this.attributes = void 0;
      this.attributes = attributes || {};
    }
    toNode() {
      var svgNS = "http://www.w3.org/2000/svg";
      var node = document.createElementNS(svgNS, "line");
      for (var attr of Object.keys(this.attributes)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
      return node;
    }
    toMarkup() {
      var markup = "<line";
      for (var attr of Object.keys(this.attributes)) {
        markup += " " + attr + '="' + escape3(this.attributes[attr]) + '"';
      }
      markup += "/>";
      return markup;
    }
  };
  function assertSymbolDomNode(group) {
    if (group instanceof SymbolNode) {
      return group;
    } else {
      throw new Error("Expected symbolNode but got " + String(group) + ".");
    }
  }
  __name(assertSymbolDomNode, "assertSymbolDomNode");
  function assertSpan(group) {
    if (group instanceof Span) {
      return group;
    } else {
      throw new Error("Expected span<HtmlDomNode> but got " + String(group) + ".");
    }
  }
  __name(assertSpan, "assertSpan");
  var hasHtmlDomChildren = /* @__PURE__ */ __name((node) => node instanceof Span || node instanceof Anchor || node instanceof DocumentFragment, "hasHtmlDomChildren");
  var fontMetricsData = {
    "AMS-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "65": [0, 0.68889, 0, 0, 0.72222],
      "66": [0, 0.68889, 0, 0, 0.66667],
      "67": [0, 0.68889, 0, 0, 0.72222],
      "68": [0, 0.68889, 0, 0, 0.72222],
      "69": [0, 0.68889, 0, 0, 0.66667],
      "70": [0, 0.68889, 0, 0, 0.61111],
      "71": [0, 0.68889, 0, 0, 0.77778],
      "72": [0, 0.68889, 0, 0, 0.77778],
      "73": [0, 0.68889, 0, 0, 0.38889],
      "74": [0.16667, 0.68889, 0, 0, 0.5],
      "75": [0, 0.68889, 0, 0, 0.77778],
      "76": [0, 0.68889, 0, 0, 0.66667],
      "77": [0, 0.68889, 0, 0, 0.94445],
      "78": [0, 0.68889, 0, 0, 0.72222],
      "79": [0.16667, 0.68889, 0, 0, 0.77778],
      "80": [0, 0.68889, 0, 0, 0.61111],
      "81": [0.16667, 0.68889, 0, 0, 0.77778],
      "82": [0, 0.68889, 0, 0, 0.72222],
      "83": [0, 0.68889, 0, 0, 0.55556],
      "84": [0, 0.68889, 0, 0, 0.66667],
      "85": [0, 0.68889, 0, 0, 0.72222],
      "86": [0, 0.68889, 0, 0, 0.72222],
      "87": [0, 0.68889, 0, 0, 1],
      "88": [0, 0.68889, 0, 0, 0.72222],
      "89": [0, 0.68889, 0, 0, 0.72222],
      "90": [0, 0.68889, 0, 0, 0.66667],
      "107": [0, 0.68889, 0, 0, 0.55556],
      "160": [0, 0, 0, 0, 0.25],
      "165": [0, 0.675, 0.025, 0, 0.75],
      "174": [0.15559, 0.69224, 0, 0, 0.94666],
      "240": [0, 0.68889, 0, 0, 0.55556],
      "295": [0, 0.68889, 0, 0, 0.54028],
      "710": [0, 0.825, 0, 0, 2.33334],
      "732": [0, 0.9, 0, 0, 2.33334],
      "770": [0, 0.825, 0, 0, 2.33334],
      "771": [0, 0.9, 0, 0, 2.33334],
      "989": [0.08167, 0.58167, 0, 0, 0.77778],
      "1008": [0, 0.43056, 0.04028, 0, 0.66667],
      "8245": [0, 0.54986, 0, 0, 0.275],
      "8463": [0, 0.68889, 0, 0, 0.54028],
      "8487": [0, 0.68889, 0, 0, 0.72222],
      "8498": [0, 0.68889, 0, 0, 0.55556],
      "8502": [0, 0.68889, 0, 0, 0.66667],
      "8503": [0, 0.68889, 0, 0, 0.44445],
      "8504": [0, 0.68889, 0, 0, 0.66667],
      "8513": [0, 0.68889, 0, 0, 0.63889],
      "8592": [-0.03598, 0.46402, 0, 0, 0.5],
      "8594": [-0.03598, 0.46402, 0, 0, 0.5],
      "8602": [-0.13313, 0.36687, 0, 0, 1],
      "8603": [-0.13313, 0.36687, 0, 0, 1],
      "8606": [0.01354, 0.52239, 0, 0, 1],
      "8608": [0.01354, 0.52239, 0, 0, 1],
      "8610": [0.01354, 0.52239, 0, 0, 1.11111],
      "8611": [0.01354, 0.52239, 0, 0, 1.11111],
      "8619": [0, 0.54986, 0, 0, 1],
      "8620": [0, 0.54986, 0, 0, 1],
      "8621": [-0.13313, 0.37788, 0, 0, 1.38889],
      "8622": [-0.13313, 0.36687, 0, 0, 1],
      "8624": [0, 0.69224, 0, 0, 0.5],
      "8625": [0, 0.69224, 0, 0, 0.5],
      "8630": [0, 0.43056, 0, 0, 1],
      "8631": [0, 0.43056, 0, 0, 1],
      "8634": [0.08198, 0.58198, 0, 0, 0.77778],
      "8635": [0.08198, 0.58198, 0, 0, 0.77778],
      "8638": [0.19444, 0.69224, 0, 0, 0.41667],
      "8639": [0.19444, 0.69224, 0, 0, 0.41667],
      "8642": [0.19444, 0.69224, 0, 0, 0.41667],
      "8643": [0.19444, 0.69224, 0, 0, 0.41667],
      "8644": [0.1808, 0.675, 0, 0, 1],
      "8646": [0.1808, 0.675, 0, 0, 1],
      "8647": [0.1808, 0.675, 0, 0, 1],
      "8648": [0.19444, 0.69224, 0, 0, 0.83334],
      "8649": [0.1808, 0.675, 0, 0, 1],
      "8650": [0.19444, 0.69224, 0, 0, 0.83334],
      "8651": [0.01354, 0.52239, 0, 0, 1],
      "8652": [0.01354, 0.52239, 0, 0, 1],
      "8653": [-0.13313, 0.36687, 0, 0, 1],
      "8654": [-0.13313, 0.36687, 0, 0, 1],
      "8655": [-0.13313, 0.36687, 0, 0, 1],
      "8666": [0.13667, 0.63667, 0, 0, 1],
      "8667": [0.13667, 0.63667, 0, 0, 1],
      "8669": [-0.13313, 0.37788, 0, 0, 1],
      "8672": [-0.064, 0.437, 0, 0, 1.334],
      "8674": [-0.064, 0.437, 0, 0, 1.334],
      "8705": [0, 0.825, 0, 0, 0.5],
      "8708": [0, 0.68889, 0, 0, 0.55556],
      "8709": [0.08167, 0.58167, 0, 0, 0.77778],
      "8717": [0, 0.43056, 0, 0, 0.42917],
      "8722": [-0.03598, 0.46402, 0, 0, 0.5],
      "8724": [0.08198, 0.69224, 0, 0, 0.77778],
      "8726": [0.08167, 0.58167, 0, 0, 0.77778],
      "8733": [0, 0.69224, 0, 0, 0.77778],
      "8736": [0, 0.69224, 0, 0, 0.72222],
      "8737": [0, 0.69224, 0, 0, 0.72222],
      "8738": [0.03517, 0.52239, 0, 0, 0.72222],
      "8739": [0.08167, 0.58167, 0, 0, 0.22222],
      "8740": [0.25142, 0.74111, 0, 0, 0.27778],
      "8741": [0.08167, 0.58167, 0, 0, 0.38889],
      "8742": [0.25142, 0.74111, 0, 0, 0.5],
      "8756": [0, 0.69224, 0, 0, 0.66667],
      "8757": [0, 0.69224, 0, 0, 0.66667],
      "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
      "8765": [-0.13313, 0.37788, 0, 0, 0.77778],
      "8769": [-0.13313, 0.36687, 0, 0, 0.77778],
      "8770": [-0.03625, 0.46375, 0, 0, 0.77778],
      "8774": [0.30274, 0.79383, 0, 0, 0.77778],
      "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
      "8778": [0.08167, 0.58167, 0, 0, 0.77778],
      "8782": [0.06062, 0.54986, 0, 0, 0.77778],
      "8783": [0.06062, 0.54986, 0, 0, 0.77778],
      "8785": [0.08198, 0.58198, 0, 0, 0.77778],
      "8786": [0.08198, 0.58198, 0, 0, 0.77778],
      "8787": [0.08198, 0.58198, 0, 0, 0.77778],
      "8790": [0, 0.69224, 0, 0, 0.77778],
      "8791": [0.22958, 0.72958, 0, 0, 0.77778],
      "8796": [0.08198, 0.91667, 0, 0, 0.77778],
      "8806": [0.25583, 0.75583, 0, 0, 0.77778],
      "8807": [0.25583, 0.75583, 0, 0, 0.77778],
      "8808": [0.25142, 0.75726, 0, 0, 0.77778],
      "8809": [0.25142, 0.75726, 0, 0, 0.77778],
      "8812": [0.25583, 0.75583, 0, 0, 0.5],
      "8814": [0.20576, 0.70576, 0, 0, 0.77778],
      "8815": [0.20576, 0.70576, 0, 0, 0.77778],
      "8816": [0.30274, 0.79383, 0, 0, 0.77778],
      "8817": [0.30274, 0.79383, 0, 0, 0.77778],
      "8818": [0.22958, 0.72958, 0, 0, 0.77778],
      "8819": [0.22958, 0.72958, 0, 0, 0.77778],
      "8822": [0.1808, 0.675, 0, 0, 0.77778],
      "8823": [0.1808, 0.675, 0, 0, 0.77778],
      "8828": [0.13667, 0.63667, 0, 0, 0.77778],
      "8829": [0.13667, 0.63667, 0, 0, 0.77778],
      "8830": [0.22958, 0.72958, 0, 0, 0.77778],
      "8831": [0.22958, 0.72958, 0, 0, 0.77778],
      "8832": [0.20576, 0.70576, 0, 0, 0.77778],
      "8833": [0.20576, 0.70576, 0, 0, 0.77778],
      "8840": [0.30274, 0.79383, 0, 0, 0.77778],
      "8841": [0.30274, 0.79383, 0, 0, 0.77778],
      "8842": [0.13597, 0.63597, 0, 0, 0.77778],
      "8843": [0.13597, 0.63597, 0, 0, 0.77778],
      "8847": [0.03517, 0.54986, 0, 0, 0.77778],
      "8848": [0.03517, 0.54986, 0, 0, 0.77778],
      "8858": [0.08198, 0.58198, 0, 0, 0.77778],
      "8859": [0.08198, 0.58198, 0, 0, 0.77778],
      "8861": [0.08198, 0.58198, 0, 0, 0.77778],
      "8862": [0, 0.675, 0, 0, 0.77778],
      "8863": [0, 0.675, 0, 0, 0.77778],
      "8864": [0, 0.675, 0, 0, 0.77778],
      "8865": [0, 0.675, 0, 0, 0.77778],
      "8872": [0, 0.69224, 0, 0, 0.61111],
      "8873": [0, 0.69224, 0, 0, 0.72222],
      "8874": [0, 0.69224, 0, 0, 0.88889],
      "8876": [0, 0.68889, 0, 0, 0.61111],
      "8877": [0, 0.68889, 0, 0, 0.61111],
      "8878": [0, 0.68889, 0, 0, 0.72222],
      "8879": [0, 0.68889, 0, 0, 0.72222],
      "8882": [0.03517, 0.54986, 0, 0, 0.77778],
      "8883": [0.03517, 0.54986, 0, 0, 0.77778],
      "8884": [0.13667, 0.63667, 0, 0, 0.77778],
      "8885": [0.13667, 0.63667, 0, 0, 0.77778],
      "8888": [0, 0.54986, 0, 0, 1.11111],
      "8890": [0.19444, 0.43056, 0, 0, 0.55556],
      "8891": [0.19444, 0.69224, 0, 0, 0.61111],
      "8892": [0.19444, 0.69224, 0, 0, 0.61111],
      "8901": [0, 0.54986, 0, 0, 0.27778],
      "8903": [0.08167, 0.58167, 0, 0, 0.77778],
      "8905": [0.08167, 0.58167, 0, 0, 0.77778],
      "8906": [0.08167, 0.58167, 0, 0, 0.77778],
      "8907": [0, 0.69224, 0, 0, 0.77778],
      "8908": [0, 0.69224, 0, 0, 0.77778],
      "8909": [-0.03598, 0.46402, 0, 0, 0.77778],
      "8910": [0, 0.54986, 0, 0, 0.76042],
      "8911": [0, 0.54986, 0, 0, 0.76042],
      "8912": [0.03517, 0.54986, 0, 0, 0.77778],
      "8913": [0.03517, 0.54986, 0, 0, 0.77778],
      "8914": [0, 0.54986, 0, 0, 0.66667],
      "8915": [0, 0.54986, 0, 0, 0.66667],
      "8916": [0, 0.69224, 0, 0, 0.66667],
      "8918": [0.0391, 0.5391, 0, 0, 0.77778],
      "8919": [0.0391, 0.5391, 0, 0, 0.77778],
      "8920": [0.03517, 0.54986, 0, 0, 1.33334],
      "8921": [0.03517, 0.54986, 0, 0, 1.33334],
      "8922": [0.38569, 0.88569, 0, 0, 0.77778],
      "8923": [0.38569, 0.88569, 0, 0, 0.77778],
      "8926": [0.13667, 0.63667, 0, 0, 0.77778],
      "8927": [0.13667, 0.63667, 0, 0, 0.77778],
      "8928": [0.30274, 0.79383, 0, 0, 0.77778],
      "8929": [0.30274, 0.79383, 0, 0, 0.77778],
      "8934": [0.23222, 0.74111, 0, 0, 0.77778],
      "8935": [0.23222, 0.74111, 0, 0, 0.77778],
      "8936": [0.23222, 0.74111, 0, 0, 0.77778],
      "8937": [0.23222, 0.74111, 0, 0, 0.77778],
      "8938": [0.20576, 0.70576, 0, 0, 0.77778],
      "8939": [0.20576, 0.70576, 0, 0, 0.77778],
      "8940": [0.30274, 0.79383, 0, 0, 0.77778],
      "8941": [0.30274, 0.79383, 0, 0, 0.77778],
      "8994": [0.19444, 0.69224, 0, 0, 0.77778],
      "8995": [0.19444, 0.69224, 0, 0, 0.77778],
      "9416": [0.15559, 0.69224, 0, 0, 0.90222],
      "9484": [0, 0.69224, 0, 0, 0.5],
      "9488": [0, 0.69224, 0, 0, 0.5],
      "9492": [0, 0.37788, 0, 0, 0.5],
      "9496": [0, 0.37788, 0, 0, 0.5],
      "9585": [0.19444, 0.68889, 0, 0, 0.88889],
      "9586": [0.19444, 0.74111, 0, 0, 0.88889],
      "9632": [0, 0.675, 0, 0, 0.77778],
      "9633": [0, 0.675, 0, 0, 0.77778],
      "9650": [0, 0.54986, 0, 0, 0.72222],
      "9651": [0, 0.54986, 0, 0, 0.72222],
      "9654": [0.03517, 0.54986, 0, 0, 0.77778],
      "9660": [0, 0.54986, 0, 0, 0.72222],
      "9661": [0, 0.54986, 0, 0, 0.72222],
      "9664": [0.03517, 0.54986, 0, 0, 0.77778],
      "9674": [0.11111, 0.69224, 0, 0, 0.66667],
      "9733": [0.19444, 0.69224, 0, 0, 0.94445],
      "10003": [0, 0.69224, 0, 0, 0.83334],
      "10016": [0, 0.69224, 0, 0, 0.83334],
      "10731": [0.11111, 0.69224, 0, 0, 0.66667],
      "10846": [0.19444, 0.75583, 0, 0, 0.61111],
      "10877": [0.13667, 0.63667, 0, 0, 0.77778],
      "10878": [0.13667, 0.63667, 0, 0, 0.77778],
      "10885": [0.25583, 0.75583, 0, 0, 0.77778],
      "10886": [0.25583, 0.75583, 0, 0, 0.77778],
      "10887": [0.13597, 0.63597, 0, 0, 0.77778],
      "10888": [0.13597, 0.63597, 0, 0, 0.77778],
      "10889": [0.26167, 0.75726, 0, 0, 0.77778],
      "10890": [0.26167, 0.75726, 0, 0, 0.77778],
      "10891": [0.48256, 0.98256, 0, 0, 0.77778],
      "10892": [0.48256, 0.98256, 0, 0, 0.77778],
      "10901": [0.13667, 0.63667, 0, 0, 0.77778],
      "10902": [0.13667, 0.63667, 0, 0, 0.77778],
      "10933": [0.25142, 0.75726, 0, 0, 0.77778],
      "10934": [0.25142, 0.75726, 0, 0, 0.77778],
      "10935": [0.26167, 0.75726, 0, 0, 0.77778],
      "10936": [0.26167, 0.75726, 0, 0, 0.77778],
      "10937": [0.26167, 0.75726, 0, 0, 0.77778],
      "10938": [0.26167, 0.75726, 0, 0, 0.77778],
      "10949": [0.25583, 0.75583, 0, 0, 0.77778],
      "10950": [0.25583, 0.75583, 0, 0, 0.77778],
      "10955": [0.28481, 0.79383, 0, 0, 0.77778],
      "10956": [0.28481, 0.79383, 0, 0, 0.77778],
      "57350": [0.08167, 0.58167, 0, 0, 0.22222],
      "57351": [0.08167, 0.58167, 0, 0, 0.38889],
      "57352": [0.08167, 0.58167, 0, 0, 0.77778],
      "57353": [0, 0.43056, 0.04028, 0, 0.66667],
      "57356": [0.25142, 0.75726, 0, 0, 0.77778],
      "57357": [0.25142, 0.75726, 0, 0, 0.77778],
      "57358": [0.41951, 0.91951, 0, 0, 0.77778],
      "57359": [0.30274, 0.79383, 0, 0, 0.77778],
      "57360": [0.30274, 0.79383, 0, 0, 0.77778],
      "57361": [0.41951, 0.91951, 0, 0, 0.77778],
      "57366": [0.25142, 0.75726, 0, 0, 0.77778],
      "57367": [0.25142, 0.75726, 0, 0, 0.77778],
      "57368": [0.25142, 0.75726, 0, 0, 0.77778],
      "57369": [0.25142, 0.75726, 0, 0, 0.77778],
      "57370": [0.13597, 0.63597, 0, 0, 0.77778],
      "57371": [0.13597, 0.63597, 0, 0, 0.77778]
    },
    "Caligraphic-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "65": [0, 0.68333, 0, 0.19445, 0.79847],
      "66": [0, 0.68333, 0.03041, 0.13889, 0.65681],
      "67": [0, 0.68333, 0.05834, 0.13889, 0.52653],
      "68": [0, 0.68333, 0.02778, 0.08334, 0.77139],
      "69": [0, 0.68333, 0.08944, 0.11111, 0.52778],
      "70": [0, 0.68333, 0.09931, 0.11111, 0.71875],
      "71": [0.09722, 0.68333, 0.0593, 0.11111, 0.59487],
      "72": [0, 0.68333, 965e-5, 0.11111, 0.84452],
      "73": [0, 0.68333, 0.07382, 0, 0.54452],
      "74": [0.09722, 0.68333, 0.18472, 0.16667, 0.67778],
      "75": [0, 0.68333, 0.01445, 0.05556, 0.76195],
      "76": [0, 0.68333, 0, 0.13889, 0.68972],
      "77": [0, 0.68333, 0, 0.13889, 1.2009],
      "78": [0, 0.68333, 0.14736, 0.08334, 0.82049],
      "79": [0, 0.68333, 0.02778, 0.11111, 0.79611],
      "80": [0, 0.68333, 0.08222, 0.08334, 0.69556],
      "81": [0.09722, 0.68333, 0, 0.11111, 0.81667],
      "82": [0, 0.68333, 0, 0.08334, 0.8475],
      "83": [0, 0.68333, 0.075, 0.13889, 0.60556],
      "84": [0, 0.68333, 0.25417, 0, 0.54464],
      "85": [0, 0.68333, 0.09931, 0.08334, 0.62583],
      "86": [0, 0.68333, 0.08222, 0, 0.61278],
      "87": [0, 0.68333, 0.08222, 0.08334, 0.98778],
      "88": [0, 0.68333, 0.14643, 0.13889, 0.7133],
      "89": [0.09722, 0.68333, 0.08222, 0.08334, 0.66834],
      "90": [0, 0.68333, 0.07944, 0.13889, 0.72473],
      "160": [0, 0, 0, 0, 0.25]
    },
    "Fraktur-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69141, 0, 0, 0.29574],
      "34": [0, 0.69141, 0, 0, 0.21471],
      "38": [0, 0.69141, 0, 0, 0.73786],
      "39": [0, 0.69141, 0, 0, 0.21201],
      "40": [0.24982, 0.74947, 0, 0, 0.38865],
      "41": [0.24982, 0.74947, 0, 0, 0.38865],
      "42": [0, 0.62119, 0, 0, 0.27764],
      "43": [0.08319, 0.58283, 0, 0, 0.75623],
      "44": [0, 0.10803, 0, 0, 0.27764],
      "45": [0.08319, 0.58283, 0, 0, 0.75623],
      "46": [0, 0.10803, 0, 0, 0.27764],
      "47": [0.24982, 0.74947, 0, 0, 0.50181],
      "48": [0, 0.47534, 0, 0, 0.50181],
      "49": [0, 0.47534, 0, 0, 0.50181],
      "50": [0, 0.47534, 0, 0, 0.50181],
      "51": [0.18906, 0.47534, 0, 0, 0.50181],
      "52": [0.18906, 0.47534, 0, 0, 0.50181],
      "53": [0.18906, 0.47534, 0, 0, 0.50181],
      "54": [0, 0.69141, 0, 0, 0.50181],
      "55": [0.18906, 0.47534, 0, 0, 0.50181],
      "56": [0, 0.69141, 0, 0, 0.50181],
      "57": [0.18906, 0.47534, 0, 0, 0.50181],
      "58": [0, 0.47534, 0, 0, 0.21606],
      "59": [0.12604, 0.47534, 0, 0, 0.21606],
      "61": [-0.13099, 0.36866, 0, 0, 0.75623],
      "63": [0, 0.69141, 0, 0, 0.36245],
      "65": [0, 0.69141, 0, 0, 0.7176],
      "66": [0, 0.69141, 0, 0, 0.88397],
      "67": [0, 0.69141, 0, 0, 0.61254],
      "68": [0, 0.69141, 0, 0, 0.83158],
      "69": [0, 0.69141, 0, 0, 0.66278],
      "70": [0.12604, 0.69141, 0, 0, 0.61119],
      "71": [0, 0.69141, 0, 0, 0.78539],
      "72": [0.06302, 0.69141, 0, 0, 0.7203],
      "73": [0, 0.69141, 0, 0, 0.55448],
      "74": [0.12604, 0.69141, 0, 0, 0.55231],
      "75": [0, 0.69141, 0, 0, 0.66845],
      "76": [0, 0.69141, 0, 0, 0.66602],
      "77": [0, 0.69141, 0, 0, 1.04953],
      "78": [0, 0.69141, 0, 0, 0.83212],
      "79": [0, 0.69141, 0, 0, 0.82699],
      "80": [0.18906, 0.69141, 0, 0, 0.82753],
      "81": [0.03781, 0.69141, 0, 0, 0.82699],
      "82": [0, 0.69141, 0, 0, 0.82807],
      "83": [0, 0.69141, 0, 0, 0.82861],
      "84": [0, 0.69141, 0, 0, 0.66899],
      "85": [0, 0.69141, 0, 0, 0.64576],
      "86": [0, 0.69141, 0, 0, 0.83131],
      "87": [0, 0.69141, 0, 0, 1.04602],
      "88": [0, 0.69141, 0, 0, 0.71922],
      "89": [0.18906, 0.69141, 0, 0, 0.83293],
      "90": [0.12604, 0.69141, 0, 0, 0.60201],
      "91": [0.24982, 0.74947, 0, 0, 0.27764],
      "93": [0.24982, 0.74947, 0, 0, 0.27764],
      "94": [0, 0.69141, 0, 0, 0.49965],
      "97": [0, 0.47534, 0, 0, 0.50046],
      "98": [0, 0.69141, 0, 0, 0.51315],
      "99": [0, 0.47534, 0, 0, 0.38946],
      "100": [0, 0.62119, 0, 0, 0.49857],
      "101": [0, 0.47534, 0, 0, 0.40053],
      "102": [0.18906, 0.69141, 0, 0, 0.32626],
      "103": [0.18906, 0.47534, 0, 0, 0.5037],
      "104": [0.18906, 0.69141, 0, 0, 0.52126],
      "105": [0, 0.69141, 0, 0, 0.27899],
      "106": [0, 0.69141, 0, 0, 0.28088],
      "107": [0, 0.69141, 0, 0, 0.38946],
      "108": [0, 0.69141, 0, 0, 0.27953],
      "109": [0, 0.47534, 0, 0, 0.76676],
      "110": [0, 0.47534, 0, 0, 0.52666],
      "111": [0, 0.47534, 0, 0, 0.48885],
      "112": [0.18906, 0.52396, 0, 0, 0.50046],
      "113": [0.18906, 0.47534, 0, 0, 0.48912],
      "114": [0, 0.47534, 0, 0, 0.38919],
      "115": [0, 0.47534, 0, 0, 0.44266],
      "116": [0, 0.62119, 0, 0, 0.33301],
      "117": [0, 0.47534, 0, 0, 0.5172],
      "118": [0, 0.52396, 0, 0, 0.5118],
      "119": [0, 0.52396, 0, 0, 0.77351],
      "120": [0.18906, 0.47534, 0, 0, 0.38865],
      "121": [0.18906, 0.47534, 0, 0, 0.49884],
      "122": [0.18906, 0.47534, 0, 0, 0.39054],
      "160": [0, 0, 0, 0, 0.25],
      "8216": [0, 0.69141, 0, 0, 0.21471],
      "8217": [0, 0.69141, 0, 0, 0.21471],
      "58112": [0, 0.62119, 0, 0, 0.49749],
      "58113": [0, 0.62119, 0, 0, 0.4983],
      "58114": [0.18906, 0.69141, 0, 0, 0.33328],
      "58115": [0.18906, 0.69141, 0, 0, 0.32923],
      "58116": [0.18906, 0.47534, 0, 0, 0.50343],
      "58117": [0, 0.69141, 0, 0, 0.33301],
      "58118": [0, 0.62119, 0, 0, 0.33409],
      "58119": [0, 0.47534, 0, 0, 0.50073]
    },
    "Main-Bold": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0, 0, 0.35],
      "34": [0, 0.69444, 0, 0, 0.60278],
      "35": [0.19444, 0.69444, 0, 0, 0.95833],
      "36": [0.05556, 0.75, 0, 0, 0.575],
      "37": [0.05556, 0.75, 0, 0, 0.95833],
      "38": [0, 0.69444, 0, 0, 0.89444],
      "39": [0, 0.69444, 0, 0, 0.31944],
      "40": [0.25, 0.75, 0, 0, 0.44722],
      "41": [0.25, 0.75, 0, 0, 0.44722],
      "42": [0, 0.75, 0, 0, 0.575],
      "43": [0.13333, 0.63333, 0, 0, 0.89444],
      "44": [0.19444, 0.15556, 0, 0, 0.31944],
      "45": [0, 0.44444, 0, 0, 0.38333],
      "46": [0, 0.15556, 0, 0, 0.31944],
      "47": [0.25, 0.75, 0, 0, 0.575],
      "48": [0, 0.64444, 0, 0, 0.575],
      "49": [0, 0.64444, 0, 0, 0.575],
      "50": [0, 0.64444, 0, 0, 0.575],
      "51": [0, 0.64444, 0, 0, 0.575],
      "52": [0, 0.64444, 0, 0, 0.575],
      "53": [0, 0.64444, 0, 0, 0.575],
      "54": [0, 0.64444, 0, 0, 0.575],
      "55": [0, 0.64444, 0, 0, 0.575],
      "56": [0, 0.64444, 0, 0, 0.575],
      "57": [0, 0.64444, 0, 0, 0.575],
      "58": [0, 0.44444, 0, 0, 0.31944],
      "59": [0.19444, 0.44444, 0, 0, 0.31944],
      "60": [0.08556, 0.58556, 0, 0, 0.89444],
      "61": [-0.10889, 0.39111, 0, 0, 0.89444],
      "62": [0.08556, 0.58556, 0, 0, 0.89444],
      "63": [0, 0.69444, 0, 0, 0.54305],
      "64": [0, 0.69444, 0, 0, 0.89444],
      "65": [0, 0.68611, 0, 0, 0.86944],
      "66": [0, 0.68611, 0, 0, 0.81805],
      "67": [0, 0.68611, 0, 0, 0.83055],
      "68": [0, 0.68611, 0, 0, 0.88194],
      "69": [0, 0.68611, 0, 0, 0.75555],
      "70": [0, 0.68611, 0, 0, 0.72361],
      "71": [0, 0.68611, 0, 0, 0.90416],
      "72": [0, 0.68611, 0, 0, 0.9],
      "73": [0, 0.68611, 0, 0, 0.43611],
      "74": [0, 0.68611, 0, 0, 0.59444],
      "75": [0, 0.68611, 0, 0, 0.90138],
      "76": [0, 0.68611, 0, 0, 0.69166],
      "77": [0, 0.68611, 0, 0, 1.09166],
      "78": [0, 0.68611, 0, 0, 0.9],
      "79": [0, 0.68611, 0, 0, 0.86388],
      "80": [0, 0.68611, 0, 0, 0.78611],
      "81": [0.19444, 0.68611, 0, 0, 0.86388],
      "82": [0, 0.68611, 0, 0, 0.8625],
      "83": [0, 0.68611, 0, 0, 0.63889],
      "84": [0, 0.68611, 0, 0, 0.8],
      "85": [0, 0.68611, 0, 0, 0.88472],
      "86": [0, 0.68611, 0.01597, 0, 0.86944],
      "87": [0, 0.68611, 0.01597, 0, 1.18888],
      "88": [0, 0.68611, 0, 0, 0.86944],
      "89": [0, 0.68611, 0.02875, 0, 0.86944],
      "90": [0, 0.68611, 0, 0, 0.70277],
      "91": [0.25, 0.75, 0, 0, 0.31944],
      "92": [0.25, 0.75, 0, 0, 0.575],
      "93": [0.25, 0.75, 0, 0, 0.31944],
      "94": [0, 0.69444, 0, 0, 0.575],
      "95": [0.31, 0.13444, 0.03194, 0, 0.575],
      "97": [0, 0.44444, 0, 0, 0.55902],
      "98": [0, 0.69444, 0, 0, 0.63889],
      "99": [0, 0.44444, 0, 0, 0.51111],
      "100": [0, 0.69444, 0, 0, 0.63889],
      "101": [0, 0.44444, 0, 0, 0.52708],
      "102": [0, 0.69444, 0.10903, 0, 0.35139],
      "103": [0.19444, 0.44444, 0.01597, 0, 0.575],
      "104": [0, 0.69444, 0, 0, 0.63889],
      "105": [0, 0.69444, 0, 0, 0.31944],
      "106": [0.19444, 0.69444, 0, 0, 0.35139],
      "107": [0, 0.69444, 0, 0, 0.60694],
      "108": [0, 0.69444, 0, 0, 0.31944],
      "109": [0, 0.44444, 0, 0, 0.95833],
      "110": [0, 0.44444, 0, 0, 0.63889],
      "111": [0, 0.44444, 0, 0, 0.575],
      "112": [0.19444, 0.44444, 0, 0, 0.63889],
      "113": [0.19444, 0.44444, 0, 0, 0.60694],
      "114": [0, 0.44444, 0, 0, 0.47361],
      "115": [0, 0.44444, 0, 0, 0.45361],
      "116": [0, 0.63492, 0, 0, 0.44722],
      "117": [0, 0.44444, 0, 0, 0.63889],
      "118": [0, 0.44444, 0.01597, 0, 0.60694],
      "119": [0, 0.44444, 0.01597, 0, 0.83055],
      "120": [0, 0.44444, 0, 0, 0.60694],
      "121": [0.19444, 0.44444, 0.01597, 0, 0.60694],
      "122": [0, 0.44444, 0, 0, 0.51111],
      "123": [0.25, 0.75, 0, 0, 0.575],
      "124": [0.25, 0.75, 0, 0, 0.31944],
      "125": [0.25, 0.75, 0, 0, 0.575],
      "126": [0.35, 0.34444, 0, 0, 0.575],
      "160": [0, 0, 0, 0, 0.25],
      "163": [0, 0.69444, 0, 0, 0.86853],
      "168": [0, 0.69444, 0, 0, 0.575],
      "172": [0, 0.44444, 0, 0, 0.76666],
      "176": [0, 0.69444, 0, 0, 0.86944],
      "177": [0.13333, 0.63333, 0, 0, 0.89444],
      "184": [0.17014, 0, 0, 0, 0.51111],
      "198": [0, 0.68611, 0, 0, 1.04166],
      "215": [0.13333, 0.63333, 0, 0, 0.89444],
      "216": [0.04861, 0.73472, 0, 0, 0.89444],
      "223": [0, 0.69444, 0, 0, 0.59722],
      "230": [0, 0.44444, 0, 0, 0.83055],
      "247": [0.13333, 0.63333, 0, 0, 0.89444],
      "248": [0.09722, 0.54167, 0, 0, 0.575],
      "305": [0, 0.44444, 0, 0, 0.31944],
      "338": [0, 0.68611, 0, 0, 1.16944],
      "339": [0, 0.44444, 0, 0, 0.89444],
      "567": [0.19444, 0.44444, 0, 0, 0.35139],
      "710": [0, 0.69444, 0, 0, 0.575],
      "711": [0, 0.63194, 0, 0, 0.575],
      "713": [0, 0.59611, 0, 0, 0.575],
      "714": [0, 0.69444, 0, 0, 0.575],
      "715": [0, 0.69444, 0, 0, 0.575],
      "728": [0, 0.69444, 0, 0, 0.575],
      "729": [0, 0.69444, 0, 0, 0.31944],
      "730": [0, 0.69444, 0, 0, 0.86944],
      "732": [0, 0.69444, 0, 0, 0.575],
      "733": [0, 0.69444, 0, 0, 0.575],
      "915": [0, 0.68611, 0, 0, 0.69166],
      "916": [0, 0.68611, 0, 0, 0.95833],
      "920": [0, 0.68611, 0, 0, 0.89444],
      "923": [0, 0.68611, 0, 0, 0.80555],
      "926": [0, 0.68611, 0, 0, 0.76666],
      "928": [0, 0.68611, 0, 0, 0.9],
      "931": [0, 0.68611, 0, 0, 0.83055],
      "933": [0, 0.68611, 0, 0, 0.89444],
      "934": [0, 0.68611, 0, 0, 0.83055],
      "936": [0, 0.68611, 0, 0, 0.89444],
      "937": [0, 0.68611, 0, 0, 0.83055],
      "8211": [0, 0.44444, 0.03194, 0, 0.575],
      "8212": [0, 0.44444, 0.03194, 0, 1.14999],
      "8216": [0, 0.69444, 0, 0, 0.31944],
      "8217": [0, 0.69444, 0, 0, 0.31944],
      "8220": [0, 0.69444, 0, 0, 0.60278],
      "8221": [0, 0.69444, 0, 0, 0.60278],
      "8224": [0.19444, 0.69444, 0, 0, 0.51111],
      "8225": [0.19444, 0.69444, 0, 0, 0.51111],
      "8242": [0, 0.55556, 0, 0, 0.34444],
      "8407": [0, 0.72444, 0.15486, 0, 0.575],
      "8463": [0, 0.69444, 0, 0, 0.66759],
      "8465": [0, 0.69444, 0, 0, 0.83055],
      "8467": [0, 0.69444, 0, 0, 0.47361],
      "8472": [0.19444, 0.44444, 0, 0, 0.74027],
      "8476": [0, 0.69444, 0, 0, 0.83055],
      "8501": [0, 0.69444, 0, 0, 0.70277],
      "8592": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8593": [0.19444, 0.69444, 0, 0, 0.575],
      "8594": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8595": [0.19444, 0.69444, 0, 0, 0.575],
      "8596": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8597": [0.25, 0.75, 0, 0, 0.575],
      "8598": [0.19444, 0.69444, 0, 0, 1.14999],
      "8599": [0.19444, 0.69444, 0, 0, 1.14999],
      "8600": [0.19444, 0.69444, 0, 0, 1.14999],
      "8601": [0.19444, 0.69444, 0, 0, 1.14999],
      "8636": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8637": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8640": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8641": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8656": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8657": [0.19444, 0.69444, 0, 0, 0.70277],
      "8658": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8659": [0.19444, 0.69444, 0, 0, 0.70277],
      "8660": [-0.10889, 0.39111, 0, 0, 1.14999],
      "8661": [0.25, 0.75, 0, 0, 0.70277],
      "8704": [0, 0.69444, 0, 0, 0.63889],
      "8706": [0, 0.69444, 0.06389, 0, 0.62847],
      "8707": [0, 0.69444, 0, 0, 0.63889],
      "8709": [0.05556, 0.75, 0, 0, 0.575],
      "8711": [0, 0.68611, 0, 0, 0.95833],
      "8712": [0.08556, 0.58556, 0, 0, 0.76666],
      "8715": [0.08556, 0.58556, 0, 0, 0.76666],
      "8722": [0.13333, 0.63333, 0, 0, 0.89444],
      "8723": [0.13333, 0.63333, 0, 0, 0.89444],
      "8725": [0.25, 0.75, 0, 0, 0.575],
      "8726": [0.25, 0.75, 0, 0, 0.575],
      "8727": [-0.02778, 0.47222, 0, 0, 0.575],
      "8728": [-0.02639, 0.47361, 0, 0, 0.575],
      "8729": [-0.02639, 0.47361, 0, 0, 0.575],
      "8730": [0.18, 0.82, 0, 0, 0.95833],
      "8733": [0, 0.44444, 0, 0, 0.89444],
      "8734": [0, 0.44444, 0, 0, 1.14999],
      "8736": [0, 0.69224, 0, 0, 0.72222],
      "8739": [0.25, 0.75, 0, 0, 0.31944],
      "8741": [0.25, 0.75, 0, 0, 0.575],
      "8743": [0, 0.55556, 0, 0, 0.76666],
      "8744": [0, 0.55556, 0, 0, 0.76666],
      "8745": [0, 0.55556, 0, 0, 0.76666],
      "8746": [0, 0.55556, 0, 0, 0.76666],
      "8747": [0.19444, 0.69444, 0.12778, 0, 0.56875],
      "8764": [-0.10889, 0.39111, 0, 0, 0.89444],
      "8768": [0.19444, 0.69444, 0, 0, 0.31944],
      "8771": [222e-5, 0.50222, 0, 0, 0.89444],
      "8773": [0.027, 0.638, 0, 0, 0.894],
      "8776": [0.02444, 0.52444, 0, 0, 0.89444],
      "8781": [222e-5, 0.50222, 0, 0, 0.89444],
      "8801": [222e-5, 0.50222, 0, 0, 0.89444],
      "8804": [0.19667, 0.69667, 0, 0, 0.89444],
      "8805": [0.19667, 0.69667, 0, 0, 0.89444],
      "8810": [0.08556, 0.58556, 0, 0, 1.14999],
      "8811": [0.08556, 0.58556, 0, 0, 1.14999],
      "8826": [0.08556, 0.58556, 0, 0, 0.89444],
      "8827": [0.08556, 0.58556, 0, 0, 0.89444],
      "8834": [0.08556, 0.58556, 0, 0, 0.89444],
      "8835": [0.08556, 0.58556, 0, 0, 0.89444],
      "8838": [0.19667, 0.69667, 0, 0, 0.89444],
      "8839": [0.19667, 0.69667, 0, 0, 0.89444],
      "8846": [0, 0.55556, 0, 0, 0.76666],
      "8849": [0.19667, 0.69667, 0, 0, 0.89444],
      "8850": [0.19667, 0.69667, 0, 0, 0.89444],
      "8851": [0, 0.55556, 0, 0, 0.76666],
      "8852": [0, 0.55556, 0, 0, 0.76666],
      "8853": [0.13333, 0.63333, 0, 0, 0.89444],
      "8854": [0.13333, 0.63333, 0, 0, 0.89444],
      "8855": [0.13333, 0.63333, 0, 0, 0.89444],
      "8856": [0.13333, 0.63333, 0, 0, 0.89444],
      "8857": [0.13333, 0.63333, 0, 0, 0.89444],
      "8866": [0, 0.69444, 0, 0, 0.70277],
      "8867": [0, 0.69444, 0, 0, 0.70277],
      "8868": [0, 0.69444, 0, 0, 0.89444],
      "8869": [0, 0.69444, 0, 0, 0.89444],
      "8900": [-0.02639, 0.47361, 0, 0, 0.575],
      "8901": [-0.02639, 0.47361, 0, 0, 0.31944],
      "8902": [-0.02778, 0.47222, 0, 0, 0.575],
      "8968": [0.25, 0.75, 0, 0, 0.51111],
      "8969": [0.25, 0.75, 0, 0, 0.51111],
      "8970": [0.25, 0.75, 0, 0, 0.51111],
      "8971": [0.25, 0.75, 0, 0, 0.51111],
      "8994": [-0.13889, 0.36111, 0, 0, 1.14999],
      "8995": [-0.13889, 0.36111, 0, 0, 1.14999],
      "9651": [0.19444, 0.69444, 0, 0, 1.02222],
      "9657": [-0.02778, 0.47222, 0, 0, 0.575],
      "9661": [0.19444, 0.69444, 0, 0, 1.02222],
      "9667": [-0.02778, 0.47222, 0, 0, 0.575],
      "9711": [0.19444, 0.69444, 0, 0, 1.14999],
      "9824": [0.12963, 0.69444, 0, 0, 0.89444],
      "9825": [0.12963, 0.69444, 0, 0, 0.89444],
      "9826": [0.12963, 0.69444, 0, 0, 0.89444],
      "9827": [0.12963, 0.69444, 0, 0, 0.89444],
      "9837": [0, 0.75, 0, 0, 0.44722],
      "9838": [0.19444, 0.69444, 0, 0, 0.44722],
      "9839": [0.19444, 0.69444, 0, 0, 0.44722],
      "10216": [0.25, 0.75, 0, 0, 0.44722],
      "10217": [0.25, 0.75, 0, 0, 0.44722],
      "10815": [0, 0.68611, 0, 0, 0.9],
      "10927": [0.19667, 0.69667, 0, 0, 0.89444],
      "10928": [0.19667, 0.69667, 0, 0, 0.89444],
      "57376": [0.19444, 0.69444, 0, 0, 0]
    },
    "Main-BoldItalic": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0.11417, 0, 0.38611],
      "34": [0, 0.69444, 0.07939, 0, 0.62055],
      "35": [0.19444, 0.69444, 0.06833, 0, 0.94444],
      "37": [0.05556, 0.75, 0.12861, 0, 0.94444],
      "38": [0, 0.69444, 0.08528, 0, 0.88555],
      "39": [0, 0.69444, 0.12945, 0, 0.35555],
      "40": [0.25, 0.75, 0.15806, 0, 0.47333],
      "41": [0.25, 0.75, 0.03306, 0, 0.47333],
      "42": [0, 0.75, 0.14333, 0, 0.59111],
      "43": [0.10333, 0.60333, 0.03306, 0, 0.88555],
      "44": [0.19444, 0.14722, 0, 0, 0.35555],
      "45": [0, 0.44444, 0.02611, 0, 0.41444],
      "46": [0, 0.14722, 0, 0, 0.35555],
      "47": [0.25, 0.75, 0.15806, 0, 0.59111],
      "48": [0, 0.64444, 0.13167, 0, 0.59111],
      "49": [0, 0.64444, 0.13167, 0, 0.59111],
      "50": [0, 0.64444, 0.13167, 0, 0.59111],
      "51": [0, 0.64444, 0.13167, 0, 0.59111],
      "52": [0.19444, 0.64444, 0.13167, 0, 0.59111],
      "53": [0, 0.64444, 0.13167, 0, 0.59111],
      "54": [0, 0.64444, 0.13167, 0, 0.59111],
      "55": [0.19444, 0.64444, 0.13167, 0, 0.59111],
      "56": [0, 0.64444, 0.13167, 0, 0.59111],
      "57": [0, 0.64444, 0.13167, 0, 0.59111],
      "58": [0, 0.44444, 0.06695, 0, 0.35555],
      "59": [0.19444, 0.44444, 0.06695, 0, 0.35555],
      "61": [-0.10889, 0.39111, 0.06833, 0, 0.88555],
      "63": [0, 0.69444, 0.11472, 0, 0.59111],
      "64": [0, 0.69444, 0.09208, 0, 0.88555],
      "65": [0, 0.68611, 0, 0, 0.86555],
      "66": [0, 0.68611, 0.0992, 0, 0.81666],
      "67": [0, 0.68611, 0.14208, 0, 0.82666],
      "68": [0, 0.68611, 0.09062, 0, 0.87555],
      "69": [0, 0.68611, 0.11431, 0, 0.75666],
      "70": [0, 0.68611, 0.12903, 0, 0.72722],
      "71": [0, 0.68611, 0.07347, 0, 0.89527],
      "72": [0, 0.68611, 0.17208, 0, 0.8961],
      "73": [0, 0.68611, 0.15681, 0, 0.47166],
      "74": [0, 0.68611, 0.145, 0, 0.61055],
      "75": [0, 0.68611, 0.14208, 0, 0.89499],
      "76": [0, 0.68611, 0, 0, 0.69777],
      "77": [0, 0.68611, 0.17208, 0, 1.07277],
      "78": [0, 0.68611, 0.17208, 0, 0.8961],
      "79": [0, 0.68611, 0.09062, 0, 0.85499],
      "80": [0, 0.68611, 0.0992, 0, 0.78721],
      "81": [0.19444, 0.68611, 0.09062, 0, 0.85499],
      "82": [0, 0.68611, 0.02559, 0, 0.85944],
      "83": [0, 0.68611, 0.11264, 0, 0.64999],
      "84": [0, 0.68611, 0.12903, 0, 0.7961],
      "85": [0, 0.68611, 0.17208, 0, 0.88083],
      "86": [0, 0.68611, 0.18625, 0, 0.86555],
      "87": [0, 0.68611, 0.18625, 0, 1.15999],
      "88": [0, 0.68611, 0.15681, 0, 0.86555],
      "89": [0, 0.68611, 0.19803, 0, 0.86555],
      "90": [0, 0.68611, 0.14208, 0, 0.70888],
      "91": [0.25, 0.75, 0.1875, 0, 0.35611],
      "93": [0.25, 0.75, 0.09972, 0, 0.35611],
      "94": [0, 0.69444, 0.06709, 0, 0.59111],
      "95": [0.31, 0.13444, 0.09811, 0, 0.59111],
      "97": [0, 0.44444, 0.09426, 0, 0.59111],
      "98": [0, 0.69444, 0.07861, 0, 0.53222],
      "99": [0, 0.44444, 0.05222, 0, 0.53222],
      "100": [0, 0.69444, 0.10861, 0, 0.59111],
      "101": [0, 0.44444, 0.085, 0, 0.53222],
      "102": [0.19444, 0.69444, 0.21778, 0, 0.4],
      "103": [0.19444, 0.44444, 0.105, 0, 0.53222],
      "104": [0, 0.69444, 0.09426, 0, 0.59111],
      "105": [0, 0.69326, 0.11387, 0, 0.35555],
      "106": [0.19444, 0.69326, 0.1672, 0, 0.35555],
      "107": [0, 0.69444, 0.11111, 0, 0.53222],
      "108": [0, 0.69444, 0.10861, 0, 0.29666],
      "109": [0, 0.44444, 0.09426, 0, 0.94444],
      "110": [0, 0.44444, 0.09426, 0, 0.64999],
      "111": [0, 0.44444, 0.07861, 0, 0.59111],
      "112": [0.19444, 0.44444, 0.07861, 0, 0.59111],
      "113": [0.19444, 0.44444, 0.105, 0, 0.53222],
      "114": [0, 0.44444, 0.11111, 0, 0.50167],
      "115": [0, 0.44444, 0.08167, 0, 0.48694],
      "116": [0, 0.63492, 0.09639, 0, 0.385],
      "117": [0, 0.44444, 0.09426, 0, 0.62055],
      "118": [0, 0.44444, 0.11111, 0, 0.53222],
      "119": [0, 0.44444, 0.11111, 0, 0.76777],
      "120": [0, 0.44444, 0.12583, 0, 0.56055],
      "121": [0.19444, 0.44444, 0.105, 0, 0.56166],
      "122": [0, 0.44444, 0.13889, 0, 0.49055],
      "126": [0.35, 0.34444, 0.11472, 0, 0.59111],
      "160": [0, 0, 0, 0, 0.25],
      "168": [0, 0.69444, 0.11473, 0, 0.59111],
      "176": [0, 0.69444, 0, 0, 0.94888],
      "184": [0.17014, 0, 0, 0, 0.53222],
      "198": [0, 0.68611, 0.11431, 0, 1.02277],
      "216": [0.04861, 0.73472, 0.09062, 0, 0.88555],
      "223": [0.19444, 0.69444, 0.09736, 0, 0.665],
      "230": [0, 0.44444, 0.085, 0, 0.82666],
      "248": [0.09722, 0.54167, 0.09458, 0, 0.59111],
      "305": [0, 0.44444, 0.09426, 0, 0.35555],
      "338": [0, 0.68611, 0.11431, 0, 1.14054],
      "339": [0, 0.44444, 0.085, 0, 0.82666],
      "567": [0.19444, 0.44444, 0.04611, 0, 0.385],
      "710": [0, 0.69444, 0.06709, 0, 0.59111],
      "711": [0, 0.63194, 0.08271, 0, 0.59111],
      "713": [0, 0.59444, 0.10444, 0, 0.59111],
      "714": [0, 0.69444, 0.08528, 0, 0.59111],
      "715": [0, 0.69444, 0, 0, 0.59111],
      "728": [0, 0.69444, 0.10333, 0, 0.59111],
      "729": [0, 0.69444, 0.12945, 0, 0.35555],
      "730": [0, 0.69444, 0, 0, 0.94888],
      "732": [0, 0.69444, 0.11472, 0, 0.59111],
      "733": [0, 0.69444, 0.11472, 0, 0.59111],
      "915": [0, 0.68611, 0.12903, 0, 0.69777],
      "916": [0, 0.68611, 0, 0, 0.94444],
      "920": [0, 0.68611, 0.09062, 0, 0.88555],
      "923": [0, 0.68611, 0, 0, 0.80666],
      "926": [0, 0.68611, 0.15092, 0, 0.76777],
      "928": [0, 0.68611, 0.17208, 0, 0.8961],
      "931": [0, 0.68611, 0.11431, 0, 0.82666],
      "933": [0, 0.68611, 0.10778, 0, 0.88555],
      "934": [0, 0.68611, 0.05632, 0, 0.82666],
      "936": [0, 0.68611, 0.10778, 0, 0.88555],
      "937": [0, 0.68611, 0.0992, 0, 0.82666],
      "8211": [0, 0.44444, 0.09811, 0, 0.59111],
      "8212": [0, 0.44444, 0.09811, 0, 1.18221],
      "8216": [0, 0.69444, 0.12945, 0, 0.35555],
      "8217": [0, 0.69444, 0.12945, 0, 0.35555],
      "8220": [0, 0.69444, 0.16772, 0, 0.62055],
      "8221": [0, 0.69444, 0.07939, 0, 0.62055]
    },
    "Main-Italic": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0.12417, 0, 0.30667],
      "34": [0, 0.69444, 0.06961, 0, 0.51444],
      "35": [0.19444, 0.69444, 0.06616, 0, 0.81777],
      "37": [0.05556, 0.75, 0.13639, 0, 0.81777],
      "38": [0, 0.69444, 0.09694, 0, 0.76666],
      "39": [0, 0.69444, 0.12417, 0, 0.30667],
      "40": [0.25, 0.75, 0.16194, 0, 0.40889],
      "41": [0.25, 0.75, 0.03694, 0, 0.40889],
      "42": [0, 0.75, 0.14917, 0, 0.51111],
      "43": [0.05667, 0.56167, 0.03694, 0, 0.76666],
      "44": [0.19444, 0.10556, 0, 0, 0.30667],
      "45": [0, 0.43056, 0.02826, 0, 0.35778],
      "46": [0, 0.10556, 0, 0, 0.30667],
      "47": [0.25, 0.75, 0.16194, 0, 0.51111],
      "48": [0, 0.64444, 0.13556, 0, 0.51111],
      "49": [0, 0.64444, 0.13556, 0, 0.51111],
      "50": [0, 0.64444, 0.13556, 0, 0.51111],
      "51": [0, 0.64444, 0.13556, 0, 0.51111],
      "52": [0.19444, 0.64444, 0.13556, 0, 0.51111],
      "53": [0, 0.64444, 0.13556, 0, 0.51111],
      "54": [0, 0.64444, 0.13556, 0, 0.51111],
      "55": [0.19444, 0.64444, 0.13556, 0, 0.51111],
      "56": [0, 0.64444, 0.13556, 0, 0.51111],
      "57": [0, 0.64444, 0.13556, 0, 0.51111],
      "58": [0, 0.43056, 0.0582, 0, 0.30667],
      "59": [0.19444, 0.43056, 0.0582, 0, 0.30667],
      "61": [-0.13313, 0.36687, 0.06616, 0, 0.76666],
      "63": [0, 0.69444, 0.1225, 0, 0.51111],
      "64": [0, 0.69444, 0.09597, 0, 0.76666],
      "65": [0, 0.68333, 0, 0, 0.74333],
      "66": [0, 0.68333, 0.10257, 0, 0.70389],
      "67": [0, 0.68333, 0.14528, 0, 0.71555],
      "68": [0, 0.68333, 0.09403, 0, 0.755],
      "69": [0, 0.68333, 0.12028, 0, 0.67833],
      "70": [0, 0.68333, 0.13305, 0, 0.65277],
      "71": [0, 0.68333, 0.08722, 0, 0.77361],
      "72": [0, 0.68333, 0.16389, 0, 0.74333],
      "73": [0, 0.68333, 0.15806, 0, 0.38555],
      "74": [0, 0.68333, 0.14028, 0, 0.525],
      "75": [0, 0.68333, 0.14528, 0, 0.76888],
      "76": [0, 0.68333, 0, 0, 0.62722],
      "77": [0, 0.68333, 0.16389, 0, 0.89666],
      "78": [0, 0.68333, 0.16389, 0, 0.74333],
      "79": [0, 0.68333, 0.09403, 0, 0.76666],
      "80": [0, 0.68333, 0.10257, 0, 0.67833],
      "81": [0.19444, 0.68333, 0.09403, 0, 0.76666],
      "82": [0, 0.68333, 0.03868, 0, 0.72944],
      "83": [0, 0.68333, 0.11972, 0, 0.56222],
      "84": [0, 0.68333, 0.13305, 0, 0.71555],
      "85": [0, 0.68333, 0.16389, 0, 0.74333],
      "86": [0, 0.68333, 0.18361, 0, 0.74333],
      "87": [0, 0.68333, 0.18361, 0, 0.99888],
      "88": [0, 0.68333, 0.15806, 0, 0.74333],
      "89": [0, 0.68333, 0.19383, 0, 0.74333],
      "90": [0, 0.68333, 0.14528, 0, 0.61333],
      "91": [0.25, 0.75, 0.1875, 0, 0.30667],
      "93": [0.25, 0.75, 0.10528, 0, 0.30667],
      "94": [0, 0.69444, 0.06646, 0, 0.51111],
      "95": [0.31, 0.12056, 0.09208, 0, 0.51111],
      "97": [0, 0.43056, 0.07671, 0, 0.51111],
      "98": [0, 0.69444, 0.06312, 0, 0.46],
      "99": [0, 0.43056, 0.05653, 0, 0.46],
      "100": [0, 0.69444, 0.10333, 0, 0.51111],
      "101": [0, 0.43056, 0.07514, 0, 0.46],
      "102": [0.19444, 0.69444, 0.21194, 0, 0.30667],
      "103": [0.19444, 0.43056, 0.08847, 0, 0.46],
      "104": [0, 0.69444, 0.07671, 0, 0.51111],
      "105": [0, 0.65536, 0.1019, 0, 0.30667],
      "106": [0.19444, 0.65536, 0.14467, 0, 0.30667],
      "107": [0, 0.69444, 0.10764, 0, 0.46],
      "108": [0, 0.69444, 0.10333, 0, 0.25555],
      "109": [0, 0.43056, 0.07671, 0, 0.81777],
      "110": [0, 0.43056, 0.07671, 0, 0.56222],
      "111": [0, 0.43056, 0.06312, 0, 0.51111],
      "112": [0.19444, 0.43056, 0.06312, 0, 0.51111],
      "113": [0.19444, 0.43056, 0.08847, 0, 0.46],
      "114": [0, 0.43056, 0.10764, 0, 0.42166],
      "115": [0, 0.43056, 0.08208, 0, 0.40889],
      "116": [0, 0.61508, 0.09486, 0, 0.33222],
      "117": [0, 0.43056, 0.07671, 0, 0.53666],
      "118": [0, 0.43056, 0.10764, 0, 0.46],
      "119": [0, 0.43056, 0.10764, 0, 0.66444],
      "120": [0, 0.43056, 0.12042, 0, 0.46389],
      "121": [0.19444, 0.43056, 0.08847, 0, 0.48555],
      "122": [0, 0.43056, 0.12292, 0, 0.40889],
      "126": [0.35, 0.31786, 0.11585, 0, 0.51111],
      "160": [0, 0, 0, 0, 0.25],
      "168": [0, 0.66786, 0.10474, 0, 0.51111],
      "176": [0, 0.69444, 0, 0, 0.83129],
      "184": [0.17014, 0, 0, 0, 0.46],
      "198": [0, 0.68333, 0.12028, 0, 0.88277],
      "216": [0.04861, 0.73194, 0.09403, 0, 0.76666],
      "223": [0.19444, 0.69444, 0.10514, 0, 0.53666],
      "230": [0, 0.43056, 0.07514, 0, 0.71555],
      "248": [0.09722, 0.52778, 0.09194, 0, 0.51111],
      "338": [0, 0.68333, 0.12028, 0, 0.98499],
      "339": [0, 0.43056, 0.07514, 0, 0.71555],
      "710": [0, 0.69444, 0.06646, 0, 0.51111],
      "711": [0, 0.62847, 0.08295, 0, 0.51111],
      "713": [0, 0.56167, 0.10333, 0, 0.51111],
      "714": [0, 0.69444, 0.09694, 0, 0.51111],
      "715": [0, 0.69444, 0, 0, 0.51111],
      "728": [0, 0.69444, 0.10806, 0, 0.51111],
      "729": [0, 0.66786, 0.11752, 0, 0.30667],
      "730": [0, 0.69444, 0, 0, 0.83129],
      "732": [0, 0.66786, 0.11585, 0, 0.51111],
      "733": [0, 0.69444, 0.1225, 0, 0.51111],
      "915": [0, 0.68333, 0.13305, 0, 0.62722],
      "916": [0, 0.68333, 0, 0, 0.81777],
      "920": [0, 0.68333, 0.09403, 0, 0.76666],
      "923": [0, 0.68333, 0, 0, 0.69222],
      "926": [0, 0.68333, 0.15294, 0, 0.66444],
      "928": [0, 0.68333, 0.16389, 0, 0.74333],
      "931": [0, 0.68333, 0.12028, 0, 0.71555],
      "933": [0, 0.68333, 0.11111, 0, 0.76666],
      "934": [0, 0.68333, 0.05986, 0, 0.71555],
      "936": [0, 0.68333, 0.11111, 0, 0.76666],
      "937": [0, 0.68333, 0.10257, 0, 0.71555],
      "8211": [0, 0.43056, 0.09208, 0, 0.51111],
      "8212": [0, 0.43056, 0.09208, 0, 1.02222],
      "8216": [0, 0.69444, 0.12417, 0, 0.30667],
      "8217": [0, 0.69444, 0.12417, 0, 0.30667],
      "8220": [0, 0.69444, 0.1685, 0, 0.51444],
      "8221": [0, 0.69444, 0.06961, 0, 0.51444],
      "8463": [0, 0.68889, 0, 0, 0.54028]
    },
    "Main-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0, 0, 0.27778],
      "34": [0, 0.69444, 0, 0, 0.5],
      "35": [0.19444, 0.69444, 0, 0, 0.83334],
      "36": [0.05556, 0.75, 0, 0, 0.5],
      "37": [0.05556, 0.75, 0, 0, 0.83334],
      "38": [0, 0.69444, 0, 0, 0.77778],
      "39": [0, 0.69444, 0, 0, 0.27778],
      "40": [0.25, 0.75, 0, 0, 0.38889],
      "41": [0.25, 0.75, 0, 0, 0.38889],
      "42": [0, 0.75, 0, 0, 0.5],
      "43": [0.08333, 0.58333, 0, 0, 0.77778],
      "44": [0.19444, 0.10556, 0, 0, 0.27778],
      "45": [0, 0.43056, 0, 0, 0.33333],
      "46": [0, 0.10556, 0, 0, 0.27778],
      "47": [0.25, 0.75, 0, 0, 0.5],
      "48": [0, 0.64444, 0, 0, 0.5],
      "49": [0, 0.64444, 0, 0, 0.5],
      "50": [0, 0.64444, 0, 0, 0.5],
      "51": [0, 0.64444, 0, 0, 0.5],
      "52": [0, 0.64444, 0, 0, 0.5],
      "53": [0, 0.64444, 0, 0, 0.5],
      "54": [0, 0.64444, 0, 0, 0.5],
      "55": [0, 0.64444, 0, 0, 0.5],
      "56": [0, 0.64444, 0, 0, 0.5],
      "57": [0, 0.64444, 0, 0, 0.5],
      "58": [0, 0.43056, 0, 0, 0.27778],
      "59": [0.19444, 0.43056, 0, 0, 0.27778],
      "60": [0.0391, 0.5391, 0, 0, 0.77778],
      "61": [-0.13313, 0.36687, 0, 0, 0.77778],
      "62": [0.0391, 0.5391, 0, 0, 0.77778],
      "63": [0, 0.69444, 0, 0, 0.47222],
      "64": [0, 0.69444, 0, 0, 0.77778],
      "65": [0, 0.68333, 0, 0, 0.75],
      "66": [0, 0.68333, 0, 0, 0.70834],
      "67": [0, 0.68333, 0, 0, 0.72222],
      "68": [0, 0.68333, 0, 0, 0.76389],
      "69": [0, 0.68333, 0, 0, 0.68056],
      "70": [0, 0.68333, 0, 0, 0.65278],
      "71": [0, 0.68333, 0, 0, 0.78472],
      "72": [0, 0.68333, 0, 0, 0.75],
      "73": [0, 0.68333, 0, 0, 0.36111],
      "74": [0, 0.68333, 0, 0, 0.51389],
      "75": [0, 0.68333, 0, 0, 0.77778],
      "76": [0, 0.68333, 0, 0, 0.625],
      "77": [0, 0.68333, 0, 0, 0.91667],
      "78": [0, 0.68333, 0, 0, 0.75],
      "79": [0, 0.68333, 0, 0, 0.77778],
      "80": [0, 0.68333, 0, 0, 0.68056],
      "81": [0.19444, 0.68333, 0, 0, 0.77778],
      "82": [0, 0.68333, 0, 0, 0.73611],
      "83": [0, 0.68333, 0, 0, 0.55556],
      "84": [0, 0.68333, 0, 0, 0.72222],
      "85": [0, 0.68333, 0, 0, 0.75],
      "86": [0, 0.68333, 0.01389, 0, 0.75],
      "87": [0, 0.68333, 0.01389, 0, 1.02778],
      "88": [0, 0.68333, 0, 0, 0.75],
      "89": [0, 0.68333, 0.025, 0, 0.75],
      "90": [0, 0.68333, 0, 0, 0.61111],
      "91": [0.25, 0.75, 0, 0, 0.27778],
      "92": [0.25, 0.75, 0, 0, 0.5],
      "93": [0.25, 0.75, 0, 0, 0.27778],
      "94": [0, 0.69444, 0, 0, 0.5],
      "95": [0.31, 0.12056, 0.02778, 0, 0.5],
      "97": [0, 0.43056, 0, 0, 0.5],
      "98": [0, 0.69444, 0, 0, 0.55556],
      "99": [0, 0.43056, 0, 0, 0.44445],
      "100": [0, 0.69444, 0, 0, 0.55556],
      "101": [0, 0.43056, 0, 0, 0.44445],
      "102": [0, 0.69444, 0.07778, 0, 0.30556],
      "103": [0.19444, 0.43056, 0.01389, 0, 0.5],
      "104": [0, 0.69444, 0, 0, 0.55556],
      "105": [0, 0.66786, 0, 0, 0.27778],
      "106": [0.19444, 0.66786, 0, 0, 0.30556],
      "107": [0, 0.69444, 0, 0, 0.52778],
      "108": [0, 0.69444, 0, 0, 0.27778],
      "109": [0, 0.43056, 0, 0, 0.83334],
      "110": [0, 0.43056, 0, 0, 0.55556],
      "111": [0, 0.43056, 0, 0, 0.5],
      "112": [0.19444, 0.43056, 0, 0, 0.55556],
      "113": [0.19444, 0.43056, 0, 0, 0.52778],
      "114": [0, 0.43056, 0, 0, 0.39167],
      "115": [0, 0.43056, 0, 0, 0.39445],
      "116": [0, 0.61508, 0, 0, 0.38889],
      "117": [0, 0.43056, 0, 0, 0.55556],
      "118": [0, 0.43056, 0.01389, 0, 0.52778],
      "119": [0, 0.43056, 0.01389, 0, 0.72222],
      "120": [0, 0.43056, 0, 0, 0.52778],
      "121": [0.19444, 0.43056, 0.01389, 0, 0.52778],
      "122": [0, 0.43056, 0, 0, 0.44445],
      "123": [0.25, 0.75, 0, 0, 0.5],
      "124": [0.25, 0.75, 0, 0, 0.27778],
      "125": [0.25, 0.75, 0, 0, 0.5],
      "126": [0.35, 0.31786, 0, 0, 0.5],
      "160": [0, 0, 0, 0, 0.25],
      "163": [0, 0.69444, 0, 0, 0.76909],
      "167": [0.19444, 0.69444, 0, 0, 0.44445],
      "168": [0, 0.66786, 0, 0, 0.5],
      "172": [0, 0.43056, 0, 0, 0.66667],
      "176": [0, 0.69444, 0, 0, 0.75],
      "177": [0.08333, 0.58333, 0, 0, 0.77778],
      "182": [0.19444, 0.69444, 0, 0, 0.61111],
      "184": [0.17014, 0, 0, 0, 0.44445],
      "198": [0, 0.68333, 0, 0, 0.90278],
      "215": [0.08333, 0.58333, 0, 0, 0.77778],
      "216": [0.04861, 0.73194, 0, 0, 0.77778],
      "223": [0, 0.69444, 0, 0, 0.5],
      "230": [0, 0.43056, 0, 0, 0.72222],
      "247": [0.08333, 0.58333, 0, 0, 0.77778],
      "248": [0.09722, 0.52778, 0, 0, 0.5],
      "305": [0, 0.43056, 0, 0, 0.27778],
      "338": [0, 0.68333, 0, 0, 1.01389],
      "339": [0, 0.43056, 0, 0, 0.77778],
      "567": [0.19444, 0.43056, 0, 0, 0.30556],
      "710": [0, 0.69444, 0, 0, 0.5],
      "711": [0, 0.62847, 0, 0, 0.5],
      "713": [0, 0.56778, 0, 0, 0.5],
      "714": [0, 0.69444, 0, 0, 0.5],
      "715": [0, 0.69444, 0, 0, 0.5],
      "728": [0, 0.69444, 0, 0, 0.5],
      "729": [0, 0.66786, 0, 0, 0.27778],
      "730": [0, 0.69444, 0, 0, 0.75],
      "732": [0, 0.66786, 0, 0, 0.5],
      "733": [0, 0.69444, 0, 0, 0.5],
      "915": [0, 0.68333, 0, 0, 0.625],
      "916": [0, 0.68333, 0, 0, 0.83334],
      "920": [0, 0.68333, 0, 0, 0.77778],
      "923": [0, 0.68333, 0, 0, 0.69445],
      "926": [0, 0.68333, 0, 0, 0.66667],
      "928": [0, 0.68333, 0, 0, 0.75],
      "931": [0, 0.68333, 0, 0, 0.72222],
      "933": [0, 0.68333, 0, 0, 0.77778],
      "934": [0, 0.68333, 0, 0, 0.72222],
      "936": [0, 0.68333, 0, 0, 0.77778],
      "937": [0, 0.68333, 0, 0, 0.72222],
      "8211": [0, 0.43056, 0.02778, 0, 0.5],
      "8212": [0, 0.43056, 0.02778, 0, 1],
      "8216": [0, 0.69444, 0, 0, 0.27778],
      "8217": [0, 0.69444, 0, 0, 0.27778],
      "8220": [0, 0.69444, 0, 0, 0.5],
      "8221": [0, 0.69444, 0, 0, 0.5],
      "8224": [0.19444, 0.69444, 0, 0, 0.44445],
      "8225": [0.19444, 0.69444, 0, 0, 0.44445],
      "8230": [0, 0.123, 0, 0, 1.172],
      "8242": [0, 0.55556, 0, 0, 0.275],
      "8407": [0, 0.71444, 0.15382, 0, 0.5],
      "8463": [0, 0.68889, 0, 0, 0.54028],
      "8465": [0, 0.69444, 0, 0, 0.72222],
      "8467": [0, 0.69444, 0, 0.11111, 0.41667],
      "8472": [0.19444, 0.43056, 0, 0.11111, 0.63646],
      "8476": [0, 0.69444, 0, 0, 0.72222],
      "8501": [0, 0.69444, 0, 0, 0.61111],
      "8592": [-0.13313, 0.36687, 0, 0, 1],
      "8593": [0.19444, 0.69444, 0, 0, 0.5],
      "8594": [-0.13313, 0.36687, 0, 0, 1],
      "8595": [0.19444, 0.69444, 0, 0, 0.5],
      "8596": [-0.13313, 0.36687, 0, 0, 1],
      "8597": [0.25, 0.75, 0, 0, 0.5],
      "8598": [0.19444, 0.69444, 0, 0, 1],
      "8599": [0.19444, 0.69444, 0, 0, 1],
      "8600": [0.19444, 0.69444, 0, 0, 1],
      "8601": [0.19444, 0.69444, 0, 0, 1],
      "8614": [0.011, 0.511, 0, 0, 1],
      "8617": [0.011, 0.511, 0, 0, 1.126],
      "8618": [0.011, 0.511, 0, 0, 1.126],
      "8636": [-0.13313, 0.36687, 0, 0, 1],
      "8637": [-0.13313, 0.36687, 0, 0, 1],
      "8640": [-0.13313, 0.36687, 0, 0, 1],
      "8641": [-0.13313, 0.36687, 0, 0, 1],
      "8652": [0.011, 0.671, 0, 0, 1],
      "8656": [-0.13313, 0.36687, 0, 0, 1],
      "8657": [0.19444, 0.69444, 0, 0, 0.61111],
      "8658": [-0.13313, 0.36687, 0, 0, 1],
      "8659": [0.19444, 0.69444, 0, 0, 0.61111],
      "8660": [-0.13313, 0.36687, 0, 0, 1],
      "8661": [0.25, 0.75, 0, 0, 0.61111],
      "8704": [0, 0.69444, 0, 0, 0.55556],
      "8706": [0, 0.69444, 0.05556, 0.08334, 0.5309],
      "8707": [0, 0.69444, 0, 0, 0.55556],
      "8709": [0.05556, 0.75, 0, 0, 0.5],
      "8711": [0, 0.68333, 0, 0, 0.83334],
      "8712": [0.0391, 0.5391, 0, 0, 0.66667],
      "8715": [0.0391, 0.5391, 0, 0, 0.66667],
      "8722": [0.08333, 0.58333, 0, 0, 0.77778],
      "8723": [0.08333, 0.58333, 0, 0, 0.77778],
      "8725": [0.25, 0.75, 0, 0, 0.5],
      "8726": [0.25, 0.75, 0, 0, 0.5],
      "8727": [-0.03472, 0.46528, 0, 0, 0.5],
      "8728": [-0.05555, 0.44445, 0, 0, 0.5],
      "8729": [-0.05555, 0.44445, 0, 0, 0.5],
      "8730": [0.2, 0.8, 0, 0, 0.83334],
      "8733": [0, 0.43056, 0, 0, 0.77778],
      "8734": [0, 0.43056, 0, 0, 1],
      "8736": [0, 0.69224, 0, 0, 0.72222],
      "8739": [0.25, 0.75, 0, 0, 0.27778],
      "8741": [0.25, 0.75, 0, 0, 0.5],
      "8743": [0, 0.55556, 0, 0, 0.66667],
      "8744": [0, 0.55556, 0, 0, 0.66667],
      "8745": [0, 0.55556, 0, 0, 0.66667],
      "8746": [0, 0.55556, 0, 0, 0.66667],
      "8747": [0.19444, 0.69444, 0.11111, 0, 0.41667],
      "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
      "8768": [0.19444, 0.69444, 0, 0, 0.27778],
      "8771": [-0.03625, 0.46375, 0, 0, 0.77778],
      "8773": [-0.022, 0.589, 0, 0, 0.778],
      "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
      "8781": [-0.03625, 0.46375, 0, 0, 0.77778],
      "8784": [-0.133, 0.673, 0, 0, 0.778],
      "8801": [-0.03625, 0.46375, 0, 0, 0.77778],
      "8804": [0.13597, 0.63597, 0, 0, 0.77778],
      "8805": [0.13597, 0.63597, 0, 0, 0.77778],
      "8810": [0.0391, 0.5391, 0, 0, 1],
      "8811": [0.0391, 0.5391, 0, 0, 1],
      "8826": [0.0391, 0.5391, 0, 0, 0.77778],
      "8827": [0.0391, 0.5391, 0, 0, 0.77778],
      "8834": [0.0391, 0.5391, 0, 0, 0.77778],
      "8835": [0.0391, 0.5391, 0, 0, 0.77778],
      "8838": [0.13597, 0.63597, 0, 0, 0.77778],
      "8839": [0.13597, 0.63597, 0, 0, 0.77778],
      "8846": [0, 0.55556, 0, 0, 0.66667],
      "8849": [0.13597, 0.63597, 0, 0, 0.77778],
      "8850": [0.13597, 0.63597, 0, 0, 0.77778],
      "8851": [0, 0.55556, 0, 0, 0.66667],
      "8852": [0, 0.55556, 0, 0, 0.66667],
      "8853": [0.08333, 0.58333, 0, 0, 0.77778],
      "8854": [0.08333, 0.58333, 0, 0, 0.77778],
      "8855": [0.08333, 0.58333, 0, 0, 0.77778],
      "8856": [0.08333, 0.58333, 0, 0, 0.77778],
      "8857": [0.08333, 0.58333, 0, 0, 0.77778],
      "8866": [0, 0.69444, 0, 0, 0.61111],
      "8867": [0, 0.69444, 0, 0, 0.61111],
      "8868": [0, 0.69444, 0, 0, 0.77778],
      "8869": [0, 0.69444, 0, 0, 0.77778],
      "8872": [0.249, 0.75, 0, 0, 0.867],
      "8900": [-0.05555, 0.44445, 0, 0, 0.5],
      "8901": [-0.05555, 0.44445, 0, 0, 0.27778],
      "8902": [-0.03472, 0.46528, 0, 0, 0.5],
      "8904": [5e-3, 0.505, 0, 0, 0.9],
      "8942": [0.03, 0.903, 0, 0, 0.278],
      "8943": [-0.19, 0.313, 0, 0, 1.172],
      "8945": [-0.1, 0.823, 0, 0, 1.282],
      "8968": [0.25, 0.75, 0, 0, 0.44445],
      "8969": [0.25, 0.75, 0, 0, 0.44445],
      "8970": [0.25, 0.75, 0, 0, 0.44445],
      "8971": [0.25, 0.75, 0, 0, 0.44445],
      "8994": [-0.14236, 0.35764, 0, 0, 1],
      "8995": [-0.14236, 0.35764, 0, 0, 1],
      "9136": [0.244, 0.744, 0, 0, 0.412],
      "9137": [0.244, 0.745, 0, 0, 0.412],
      "9651": [0.19444, 0.69444, 0, 0, 0.88889],
      "9657": [-0.03472, 0.46528, 0, 0, 0.5],
      "9661": [0.19444, 0.69444, 0, 0, 0.88889],
      "9667": [-0.03472, 0.46528, 0, 0, 0.5],
      "9711": [0.19444, 0.69444, 0, 0, 1],
      "9824": [0.12963, 0.69444, 0, 0, 0.77778],
      "9825": [0.12963, 0.69444, 0, 0, 0.77778],
      "9826": [0.12963, 0.69444, 0, 0, 0.77778],
      "9827": [0.12963, 0.69444, 0, 0, 0.77778],
      "9837": [0, 0.75, 0, 0, 0.38889],
      "9838": [0.19444, 0.69444, 0, 0, 0.38889],
      "9839": [0.19444, 0.69444, 0, 0, 0.38889],
      "10216": [0.25, 0.75, 0, 0, 0.38889],
      "10217": [0.25, 0.75, 0, 0, 0.38889],
      "10222": [0.244, 0.744, 0, 0, 0.412],
      "10223": [0.244, 0.745, 0, 0, 0.412],
      "10229": [0.011, 0.511, 0, 0, 1.609],
      "10230": [0.011, 0.511, 0, 0, 1.638],
      "10231": [0.011, 0.511, 0, 0, 1.859],
      "10232": [0.024, 0.525, 0, 0, 1.609],
      "10233": [0.024, 0.525, 0, 0, 1.638],
      "10234": [0.024, 0.525, 0, 0, 1.858],
      "10236": [0.011, 0.511, 0, 0, 1.638],
      "10815": [0, 0.68333, 0, 0, 0.75],
      "10927": [0.13597, 0.63597, 0, 0, 0.77778],
      "10928": [0.13597, 0.63597, 0, 0, 0.77778],
      "57376": [0.19444, 0.69444, 0, 0, 0]
    },
    "Math-BoldItalic": {
      "32": [0, 0, 0, 0, 0.25],
      "48": [0, 0.44444, 0, 0, 0.575],
      "49": [0, 0.44444, 0, 0, 0.575],
      "50": [0, 0.44444, 0, 0, 0.575],
      "51": [0.19444, 0.44444, 0, 0, 0.575],
      "52": [0.19444, 0.44444, 0, 0, 0.575],
      "53": [0.19444, 0.44444, 0, 0, 0.575],
      "54": [0, 0.64444, 0, 0, 0.575],
      "55": [0.19444, 0.44444, 0, 0, 0.575],
      "56": [0, 0.64444, 0, 0, 0.575],
      "57": [0.19444, 0.44444, 0, 0, 0.575],
      "65": [0, 0.68611, 0, 0, 0.86944],
      "66": [0, 0.68611, 0.04835, 0, 0.8664],
      "67": [0, 0.68611, 0.06979, 0, 0.81694],
      "68": [0, 0.68611, 0.03194, 0, 0.93812],
      "69": [0, 0.68611, 0.05451, 0, 0.81007],
      "70": [0, 0.68611, 0.15972, 0, 0.68889],
      "71": [0, 0.68611, 0, 0, 0.88673],
      "72": [0, 0.68611, 0.08229, 0, 0.98229],
      "73": [0, 0.68611, 0.07778, 0, 0.51111],
      "74": [0, 0.68611, 0.10069, 0, 0.63125],
      "75": [0, 0.68611, 0.06979, 0, 0.97118],
      "76": [0, 0.68611, 0, 0, 0.75555],
      "77": [0, 0.68611, 0.11424, 0, 1.14201],
      "78": [0, 0.68611, 0.11424, 0, 0.95034],
      "79": [0, 0.68611, 0.03194, 0, 0.83666],
      "80": [0, 0.68611, 0.15972, 0, 0.72309],
      "81": [0.19444, 0.68611, 0, 0, 0.86861],
      "82": [0, 0.68611, 421e-5, 0, 0.87235],
      "83": [0, 0.68611, 0.05382, 0, 0.69271],
      "84": [0, 0.68611, 0.15972, 0, 0.63663],
      "85": [0, 0.68611, 0.11424, 0, 0.80027],
      "86": [0, 0.68611, 0.25555, 0, 0.67778],
      "87": [0, 0.68611, 0.15972, 0, 1.09305],
      "88": [0, 0.68611, 0.07778, 0, 0.94722],
      "89": [0, 0.68611, 0.25555, 0, 0.67458],
      "90": [0, 0.68611, 0.06979, 0, 0.77257],
      "97": [0, 0.44444, 0, 0, 0.63287],
      "98": [0, 0.69444, 0, 0, 0.52083],
      "99": [0, 0.44444, 0, 0, 0.51342],
      "100": [0, 0.69444, 0, 0, 0.60972],
      "101": [0, 0.44444, 0, 0, 0.55361],
      "102": [0.19444, 0.69444, 0.11042, 0, 0.56806],
      "103": [0.19444, 0.44444, 0.03704, 0, 0.5449],
      "104": [0, 0.69444, 0, 0, 0.66759],
      "105": [0, 0.69326, 0, 0, 0.4048],
      "106": [0.19444, 0.69326, 0.0622, 0, 0.47083],
      "107": [0, 0.69444, 0.01852, 0, 0.6037],
      "108": [0, 0.69444, 88e-4, 0, 0.34815],
      "109": [0, 0.44444, 0, 0, 1.0324],
      "110": [0, 0.44444, 0, 0, 0.71296],
      "111": [0, 0.44444, 0, 0, 0.58472],
      "112": [0.19444, 0.44444, 0, 0, 0.60092],
      "113": [0.19444, 0.44444, 0.03704, 0, 0.54213],
      "114": [0, 0.44444, 0.03194, 0, 0.5287],
      "115": [0, 0.44444, 0, 0, 0.53125],
      "116": [0, 0.63492, 0, 0, 0.41528],
      "117": [0, 0.44444, 0, 0, 0.68102],
      "118": [0, 0.44444, 0.03704, 0, 0.56666],
      "119": [0, 0.44444, 0.02778, 0, 0.83148],
      "120": [0, 0.44444, 0, 0, 0.65903],
      "121": [0.19444, 0.44444, 0.03704, 0, 0.59028],
      "122": [0, 0.44444, 0.04213, 0, 0.55509],
      "160": [0, 0, 0, 0, 0.25],
      "915": [0, 0.68611, 0.15972, 0, 0.65694],
      "916": [0, 0.68611, 0, 0, 0.95833],
      "920": [0, 0.68611, 0.03194, 0, 0.86722],
      "923": [0, 0.68611, 0, 0, 0.80555],
      "926": [0, 0.68611, 0.07458, 0, 0.84125],
      "928": [0, 0.68611, 0.08229, 0, 0.98229],
      "931": [0, 0.68611, 0.05451, 0, 0.88507],
      "933": [0, 0.68611, 0.15972, 0, 0.67083],
      "934": [0, 0.68611, 0, 0, 0.76666],
      "936": [0, 0.68611, 0.11653, 0, 0.71402],
      "937": [0, 0.68611, 0.04835, 0, 0.8789],
      "945": [0, 0.44444, 0, 0, 0.76064],
      "946": [0.19444, 0.69444, 0.03403, 0, 0.65972],
      "947": [0.19444, 0.44444, 0.06389, 0, 0.59003],
      "948": [0, 0.69444, 0.03819, 0, 0.52222],
      "949": [0, 0.44444, 0, 0, 0.52882],
      "950": [0.19444, 0.69444, 0.06215, 0, 0.50833],
      "951": [0.19444, 0.44444, 0.03704, 0, 0.6],
      "952": [0, 0.69444, 0.03194, 0, 0.5618],
      "953": [0, 0.44444, 0, 0, 0.41204],
      "954": [0, 0.44444, 0, 0, 0.66759],
      "955": [0, 0.69444, 0, 0, 0.67083],
      "956": [0.19444, 0.44444, 0, 0, 0.70787],
      "957": [0, 0.44444, 0.06898, 0, 0.57685],
      "958": [0.19444, 0.69444, 0.03021, 0, 0.50833],
      "959": [0, 0.44444, 0, 0, 0.58472],
      "960": [0, 0.44444, 0.03704, 0, 0.68241],
      "961": [0.19444, 0.44444, 0, 0, 0.6118],
      "962": [0.09722, 0.44444, 0.07917, 0, 0.42361],
      "963": [0, 0.44444, 0.03704, 0, 0.68588],
      "964": [0, 0.44444, 0.13472, 0, 0.52083],
      "965": [0, 0.44444, 0.03704, 0, 0.63055],
      "966": [0.19444, 0.44444, 0, 0, 0.74722],
      "967": [0.19444, 0.44444, 0, 0, 0.71805],
      "968": [0.19444, 0.69444, 0.03704, 0, 0.75833],
      "969": [0, 0.44444, 0.03704, 0, 0.71782],
      "977": [0, 0.69444, 0, 0, 0.69155],
      "981": [0.19444, 0.69444, 0, 0, 0.7125],
      "982": [0, 0.44444, 0.03194, 0, 0.975],
      "1009": [0.19444, 0.44444, 0, 0, 0.6118],
      "1013": [0, 0.44444, 0, 0, 0.48333],
      "57649": [0, 0.44444, 0, 0, 0.39352],
      "57911": [0.19444, 0.44444, 0, 0, 0.43889]
    },
    "Math-Italic": {
      "32": [0, 0, 0, 0, 0.25],
      "48": [0, 0.43056, 0, 0, 0.5],
      "49": [0, 0.43056, 0, 0, 0.5],
      "50": [0, 0.43056, 0, 0, 0.5],
      "51": [0.19444, 0.43056, 0, 0, 0.5],
      "52": [0.19444, 0.43056, 0, 0, 0.5],
      "53": [0.19444, 0.43056, 0, 0, 0.5],
      "54": [0, 0.64444, 0, 0, 0.5],
      "55": [0.19444, 0.43056, 0, 0, 0.5],
      "56": [0, 0.64444, 0, 0, 0.5],
      "57": [0.19444, 0.43056, 0, 0, 0.5],
      "65": [0, 0.68333, 0, 0.13889, 0.75],
      "66": [0, 0.68333, 0.05017, 0.08334, 0.75851],
      "67": [0, 0.68333, 0.07153, 0.08334, 0.71472],
      "68": [0, 0.68333, 0.02778, 0.05556, 0.82792],
      "69": [0, 0.68333, 0.05764, 0.08334, 0.7382],
      "70": [0, 0.68333, 0.13889, 0.08334, 0.64306],
      "71": [0, 0.68333, 0, 0.08334, 0.78625],
      "72": [0, 0.68333, 0.08125, 0.05556, 0.83125],
      "73": [0, 0.68333, 0.07847, 0.11111, 0.43958],
      "74": [0, 0.68333, 0.09618, 0.16667, 0.55451],
      "75": [0, 0.68333, 0.07153, 0.05556, 0.84931],
      "76": [0, 0.68333, 0, 0.02778, 0.68056],
      "77": [0, 0.68333, 0.10903, 0.08334, 0.97014],
      "78": [0, 0.68333, 0.10903, 0.08334, 0.80347],
      "79": [0, 0.68333, 0.02778, 0.08334, 0.76278],
      "80": [0, 0.68333, 0.13889, 0.08334, 0.64201],
      "81": [0.19444, 0.68333, 0, 0.08334, 0.79056],
      "82": [0, 0.68333, 773e-5, 0.08334, 0.75929],
      "83": [0, 0.68333, 0.05764, 0.08334, 0.6132],
      "84": [0, 0.68333, 0.13889, 0.08334, 0.58438],
      "85": [0, 0.68333, 0.10903, 0.02778, 0.68278],
      "86": [0, 0.68333, 0.22222, 0, 0.58333],
      "87": [0, 0.68333, 0.13889, 0, 0.94445],
      "88": [0, 0.68333, 0.07847, 0.08334, 0.82847],
      "89": [0, 0.68333, 0.22222, 0, 0.58056],
      "90": [0, 0.68333, 0.07153, 0.08334, 0.68264],
      "97": [0, 0.43056, 0, 0, 0.52859],
      "98": [0, 0.69444, 0, 0, 0.42917],
      "99": [0, 0.43056, 0, 0.05556, 0.43276],
      "100": [0, 0.69444, 0, 0.16667, 0.52049],
      "101": [0, 0.43056, 0, 0.05556, 0.46563],
      "102": [0.19444, 0.69444, 0.10764, 0.16667, 0.48959],
      "103": [0.19444, 0.43056, 0.03588, 0.02778, 0.47697],
      "104": [0, 0.69444, 0, 0, 0.57616],
      "105": [0, 0.65952, 0, 0, 0.34451],
      "106": [0.19444, 0.65952, 0.05724, 0, 0.41181],
      "107": [0, 0.69444, 0.03148, 0, 0.5206],
      "108": [0, 0.69444, 0.01968, 0.08334, 0.29838],
      "109": [0, 0.43056, 0, 0, 0.87801],
      "110": [0, 0.43056, 0, 0, 0.60023],
      "111": [0, 0.43056, 0, 0.05556, 0.48472],
      "112": [0.19444, 0.43056, 0, 0.08334, 0.50313],
      "113": [0.19444, 0.43056, 0.03588, 0.08334, 0.44641],
      "114": [0, 0.43056, 0.02778, 0.05556, 0.45116],
      "115": [0, 0.43056, 0, 0.05556, 0.46875],
      "116": [0, 0.61508, 0, 0.08334, 0.36111],
      "117": [0, 0.43056, 0, 0.02778, 0.57246],
      "118": [0, 0.43056, 0.03588, 0.02778, 0.48472],
      "119": [0, 0.43056, 0.02691, 0.08334, 0.71592],
      "120": [0, 0.43056, 0, 0.02778, 0.57153],
      "121": [0.19444, 0.43056, 0.03588, 0.05556, 0.49028],
      "122": [0, 0.43056, 0.04398, 0.05556, 0.46505],
      "160": [0, 0, 0, 0, 0.25],
      "915": [0, 0.68333, 0.13889, 0.08334, 0.61528],
      "916": [0, 0.68333, 0, 0.16667, 0.83334],
      "920": [0, 0.68333, 0.02778, 0.08334, 0.76278],
      "923": [0, 0.68333, 0, 0.16667, 0.69445],
      "926": [0, 0.68333, 0.07569, 0.08334, 0.74236],
      "928": [0, 0.68333, 0.08125, 0.05556, 0.83125],
      "931": [0, 0.68333, 0.05764, 0.08334, 0.77986],
      "933": [0, 0.68333, 0.13889, 0.05556, 0.58333],
      "934": [0, 0.68333, 0, 0.08334, 0.66667],
      "936": [0, 0.68333, 0.11, 0.05556, 0.61222],
      "937": [0, 0.68333, 0.05017, 0.08334, 0.7724],
      "945": [0, 0.43056, 37e-4, 0.02778, 0.6397],
      "946": [0.19444, 0.69444, 0.05278, 0.08334, 0.56563],
      "947": [0.19444, 0.43056, 0.05556, 0, 0.51773],
      "948": [0, 0.69444, 0.03785, 0.05556, 0.44444],
      "949": [0, 0.43056, 0, 0.08334, 0.46632],
      "950": [0.19444, 0.69444, 0.07378, 0.08334, 0.4375],
      "951": [0.19444, 0.43056, 0.03588, 0.05556, 0.49653],
      "952": [0, 0.69444, 0.02778, 0.08334, 0.46944],
      "953": [0, 0.43056, 0, 0.05556, 0.35394],
      "954": [0, 0.43056, 0, 0, 0.57616],
      "955": [0, 0.69444, 0, 0, 0.58334],
      "956": [0.19444, 0.43056, 0, 0.02778, 0.60255],
      "957": [0, 0.43056, 0.06366, 0.02778, 0.49398],
      "958": [0.19444, 0.69444, 0.04601, 0.11111, 0.4375],
      "959": [0, 0.43056, 0, 0.05556, 0.48472],
      "960": [0, 0.43056, 0.03588, 0, 0.57003],
      "961": [0.19444, 0.43056, 0, 0.08334, 0.51702],
      "962": [0.09722, 0.43056, 0.07986, 0.08334, 0.36285],
      "963": [0, 0.43056, 0.03588, 0, 0.57141],
      "964": [0, 0.43056, 0.1132, 0.02778, 0.43715],
      "965": [0, 0.43056, 0.03588, 0.02778, 0.54028],
      "966": [0.19444, 0.43056, 0, 0.08334, 0.65417],
      "967": [0.19444, 0.43056, 0, 0.05556, 0.62569],
      "968": [0.19444, 0.69444, 0.03588, 0.11111, 0.65139],
      "969": [0, 0.43056, 0.03588, 0, 0.62245],
      "977": [0, 0.69444, 0, 0.08334, 0.59144],
      "981": [0.19444, 0.69444, 0, 0.08334, 0.59583],
      "982": [0, 0.43056, 0.02778, 0, 0.82813],
      "1009": [0.19444, 0.43056, 0, 0.08334, 0.51702],
      "1013": [0, 0.43056, 0, 0.05556, 0.4059],
      "57649": [0, 0.43056, 0, 0.02778, 0.32246],
      "57911": [0.19444, 0.43056, 0, 0.08334, 0.38403]
    },
    "SansSerif-Bold": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0, 0, 0.36667],
      "34": [0, 0.69444, 0, 0, 0.55834],
      "35": [0.19444, 0.69444, 0, 0, 0.91667],
      "36": [0.05556, 0.75, 0, 0, 0.55],
      "37": [0.05556, 0.75, 0, 0, 1.02912],
      "38": [0, 0.69444, 0, 0, 0.83056],
      "39": [0, 0.69444, 0, 0, 0.30556],
      "40": [0.25, 0.75, 0, 0, 0.42778],
      "41": [0.25, 0.75, 0, 0, 0.42778],
      "42": [0, 0.75, 0, 0, 0.55],
      "43": [0.11667, 0.61667, 0, 0, 0.85556],
      "44": [0.10556, 0.13056, 0, 0, 0.30556],
      "45": [0, 0.45833, 0, 0, 0.36667],
      "46": [0, 0.13056, 0, 0, 0.30556],
      "47": [0.25, 0.75, 0, 0, 0.55],
      "48": [0, 0.69444, 0, 0, 0.55],
      "49": [0, 0.69444, 0, 0, 0.55],
      "50": [0, 0.69444, 0, 0, 0.55],
      "51": [0, 0.69444, 0, 0, 0.55],
      "52": [0, 0.69444, 0, 0, 0.55],
      "53": [0, 0.69444, 0, 0, 0.55],
      "54": [0, 0.69444, 0, 0, 0.55],
      "55": [0, 0.69444, 0, 0, 0.55],
      "56": [0, 0.69444, 0, 0, 0.55],
      "57": [0, 0.69444, 0, 0, 0.55],
      "58": [0, 0.45833, 0, 0, 0.30556],
      "59": [0.10556, 0.45833, 0, 0, 0.30556],
      "61": [-0.09375, 0.40625, 0, 0, 0.85556],
      "63": [0, 0.69444, 0, 0, 0.51945],
      "64": [0, 0.69444, 0, 0, 0.73334],
      "65": [0, 0.69444, 0, 0, 0.73334],
      "66": [0, 0.69444, 0, 0, 0.73334],
      "67": [0, 0.69444, 0, 0, 0.70278],
      "68": [0, 0.69444, 0, 0, 0.79445],
      "69": [0, 0.69444, 0, 0, 0.64167],
      "70": [0, 0.69444, 0, 0, 0.61111],
      "71": [0, 0.69444, 0, 0, 0.73334],
      "72": [0, 0.69444, 0, 0, 0.79445],
      "73": [0, 0.69444, 0, 0, 0.33056],
      "74": [0, 0.69444, 0, 0, 0.51945],
      "75": [0, 0.69444, 0, 0, 0.76389],
      "76": [0, 0.69444, 0, 0, 0.58056],
      "77": [0, 0.69444, 0, 0, 0.97778],
      "78": [0, 0.69444, 0, 0, 0.79445],
      "79": [0, 0.69444, 0, 0, 0.79445],
      "80": [0, 0.69444, 0, 0, 0.70278],
      "81": [0.10556, 0.69444, 0, 0, 0.79445],
      "82": [0, 0.69444, 0, 0, 0.70278],
      "83": [0, 0.69444, 0, 0, 0.61111],
      "84": [0, 0.69444, 0, 0, 0.73334],
      "85": [0, 0.69444, 0, 0, 0.76389],
      "86": [0, 0.69444, 0.01528, 0, 0.73334],
      "87": [0, 0.69444, 0.01528, 0, 1.03889],
      "88": [0, 0.69444, 0, 0, 0.73334],
      "89": [0, 0.69444, 0.0275, 0, 0.73334],
      "90": [0, 0.69444, 0, 0, 0.67223],
      "91": [0.25, 0.75, 0, 0, 0.34306],
      "93": [0.25, 0.75, 0, 0, 0.34306],
      "94": [0, 0.69444, 0, 0, 0.55],
      "95": [0.35, 0.10833, 0.03056, 0, 0.55],
      "97": [0, 0.45833, 0, 0, 0.525],
      "98": [0, 0.69444, 0, 0, 0.56111],
      "99": [0, 0.45833, 0, 0, 0.48889],
      "100": [0, 0.69444, 0, 0, 0.56111],
      "101": [0, 0.45833, 0, 0, 0.51111],
      "102": [0, 0.69444, 0.07639, 0, 0.33611],
      "103": [0.19444, 0.45833, 0.01528, 0, 0.55],
      "104": [0, 0.69444, 0, 0, 0.56111],
      "105": [0, 0.69444, 0, 0, 0.25556],
      "106": [0.19444, 0.69444, 0, 0, 0.28611],
      "107": [0, 0.69444, 0, 0, 0.53056],
      "108": [0, 0.69444, 0, 0, 0.25556],
      "109": [0, 0.45833, 0, 0, 0.86667],
      "110": [0, 0.45833, 0, 0, 0.56111],
      "111": [0, 0.45833, 0, 0, 0.55],
      "112": [0.19444, 0.45833, 0, 0, 0.56111],
      "113": [0.19444, 0.45833, 0, 0, 0.56111],
      "114": [0, 0.45833, 0.01528, 0, 0.37222],
      "115": [0, 0.45833, 0, 0, 0.42167],
      "116": [0, 0.58929, 0, 0, 0.40417],
      "117": [0, 0.45833, 0, 0, 0.56111],
      "118": [0, 0.45833, 0.01528, 0, 0.5],
      "119": [0, 0.45833, 0.01528, 0, 0.74445],
      "120": [0, 0.45833, 0, 0, 0.5],
      "121": [0.19444, 0.45833, 0.01528, 0, 0.5],
      "122": [0, 0.45833, 0, 0, 0.47639],
      "126": [0.35, 0.34444, 0, 0, 0.55],
      "160": [0, 0, 0, 0, 0.25],
      "168": [0, 0.69444, 0, 0, 0.55],
      "176": [0, 0.69444, 0, 0, 0.73334],
      "180": [0, 0.69444, 0, 0, 0.55],
      "184": [0.17014, 0, 0, 0, 0.48889],
      "305": [0, 0.45833, 0, 0, 0.25556],
      "567": [0.19444, 0.45833, 0, 0, 0.28611],
      "710": [0, 0.69444, 0, 0, 0.55],
      "711": [0, 0.63542, 0, 0, 0.55],
      "713": [0, 0.63778, 0, 0, 0.55],
      "728": [0, 0.69444, 0, 0, 0.55],
      "729": [0, 0.69444, 0, 0, 0.30556],
      "730": [0, 0.69444, 0, 0, 0.73334],
      "732": [0, 0.69444, 0, 0, 0.55],
      "733": [0, 0.69444, 0, 0, 0.55],
      "915": [0, 0.69444, 0, 0, 0.58056],
      "916": [0, 0.69444, 0, 0, 0.91667],
      "920": [0, 0.69444, 0, 0, 0.85556],
      "923": [0, 0.69444, 0, 0, 0.67223],
      "926": [0, 0.69444, 0, 0, 0.73334],
      "928": [0, 0.69444, 0, 0, 0.79445],
      "931": [0, 0.69444, 0, 0, 0.79445],
      "933": [0, 0.69444, 0, 0, 0.85556],
      "934": [0, 0.69444, 0, 0, 0.79445],
      "936": [0, 0.69444, 0, 0, 0.85556],
      "937": [0, 0.69444, 0, 0, 0.79445],
      "8211": [0, 0.45833, 0.03056, 0, 0.55],
      "8212": [0, 0.45833, 0.03056, 0, 1.10001],
      "8216": [0, 0.69444, 0, 0, 0.30556],
      "8217": [0, 0.69444, 0, 0, 0.30556],
      "8220": [0, 0.69444, 0, 0, 0.55834],
      "8221": [0, 0.69444, 0, 0, 0.55834]
    },
    "SansSerif-Italic": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0.05733, 0, 0.31945],
      "34": [0, 0.69444, 316e-5, 0, 0.5],
      "35": [0.19444, 0.69444, 0.05087, 0, 0.83334],
      "36": [0.05556, 0.75, 0.11156, 0, 0.5],
      "37": [0.05556, 0.75, 0.03126, 0, 0.83334],
      "38": [0, 0.69444, 0.03058, 0, 0.75834],
      "39": [0, 0.69444, 0.07816, 0, 0.27778],
      "40": [0.25, 0.75, 0.13164, 0, 0.38889],
      "41": [0.25, 0.75, 0.02536, 0, 0.38889],
      "42": [0, 0.75, 0.11775, 0, 0.5],
      "43": [0.08333, 0.58333, 0.02536, 0, 0.77778],
      "44": [0.125, 0.08333, 0, 0, 0.27778],
      "45": [0, 0.44444, 0.01946, 0, 0.33333],
      "46": [0, 0.08333, 0, 0, 0.27778],
      "47": [0.25, 0.75, 0.13164, 0, 0.5],
      "48": [0, 0.65556, 0.11156, 0, 0.5],
      "49": [0, 0.65556, 0.11156, 0, 0.5],
      "50": [0, 0.65556, 0.11156, 0, 0.5],
      "51": [0, 0.65556, 0.11156, 0, 0.5],
      "52": [0, 0.65556, 0.11156, 0, 0.5],
      "53": [0, 0.65556, 0.11156, 0, 0.5],
      "54": [0, 0.65556, 0.11156, 0, 0.5],
      "55": [0, 0.65556, 0.11156, 0, 0.5],
      "56": [0, 0.65556, 0.11156, 0, 0.5],
      "57": [0, 0.65556, 0.11156, 0, 0.5],
      "58": [0, 0.44444, 0.02502, 0, 0.27778],
      "59": [0.125, 0.44444, 0.02502, 0, 0.27778],
      "61": [-0.13, 0.37, 0.05087, 0, 0.77778],
      "63": [0, 0.69444, 0.11809, 0, 0.47222],
      "64": [0, 0.69444, 0.07555, 0, 0.66667],
      "65": [0, 0.69444, 0, 0, 0.66667],
      "66": [0, 0.69444, 0.08293, 0, 0.66667],
      "67": [0, 0.69444, 0.11983, 0, 0.63889],
      "68": [0, 0.69444, 0.07555, 0, 0.72223],
      "69": [0, 0.69444, 0.11983, 0, 0.59722],
      "70": [0, 0.69444, 0.13372, 0, 0.56945],
      "71": [0, 0.69444, 0.11983, 0, 0.66667],
      "72": [0, 0.69444, 0.08094, 0, 0.70834],
      "73": [0, 0.69444, 0.13372, 0, 0.27778],
      "74": [0, 0.69444, 0.08094, 0, 0.47222],
      "75": [0, 0.69444, 0.11983, 0, 0.69445],
      "76": [0, 0.69444, 0, 0, 0.54167],
      "77": [0, 0.69444, 0.08094, 0, 0.875],
      "78": [0, 0.69444, 0.08094, 0, 0.70834],
      "79": [0, 0.69444, 0.07555, 0, 0.73611],
      "80": [0, 0.69444, 0.08293, 0, 0.63889],
      "81": [0.125, 0.69444, 0.07555, 0, 0.73611],
      "82": [0, 0.69444, 0.08293, 0, 0.64584],
      "83": [0, 0.69444, 0.09205, 0, 0.55556],
      "84": [0, 0.69444, 0.13372, 0, 0.68056],
      "85": [0, 0.69444, 0.08094, 0, 0.6875],
      "86": [0, 0.69444, 0.1615, 0, 0.66667],
      "87": [0, 0.69444, 0.1615, 0, 0.94445],
      "88": [0, 0.69444, 0.13372, 0, 0.66667],
      "89": [0, 0.69444, 0.17261, 0, 0.66667],
      "90": [0, 0.69444, 0.11983, 0, 0.61111],
      "91": [0.25, 0.75, 0.15942, 0, 0.28889],
      "93": [0.25, 0.75, 0.08719, 0, 0.28889],
      "94": [0, 0.69444, 0.0799, 0, 0.5],
      "95": [0.35, 0.09444, 0.08616, 0, 0.5],
      "97": [0, 0.44444, 981e-5, 0, 0.48056],
      "98": [0, 0.69444, 0.03057, 0, 0.51667],
      "99": [0, 0.44444, 0.08336, 0, 0.44445],
      "100": [0, 0.69444, 0.09483, 0, 0.51667],
      "101": [0, 0.44444, 0.06778, 0, 0.44445],
      "102": [0, 0.69444, 0.21705, 0, 0.30556],
      "103": [0.19444, 0.44444, 0.10836, 0, 0.5],
      "104": [0, 0.69444, 0.01778, 0, 0.51667],
      "105": [0, 0.67937, 0.09718, 0, 0.23889],
      "106": [0.19444, 0.67937, 0.09162, 0, 0.26667],
      "107": [0, 0.69444, 0.08336, 0, 0.48889],
      "108": [0, 0.69444, 0.09483, 0, 0.23889],
      "109": [0, 0.44444, 0.01778, 0, 0.79445],
      "110": [0, 0.44444, 0.01778, 0, 0.51667],
      "111": [0, 0.44444, 0.06613, 0, 0.5],
      "112": [0.19444, 0.44444, 0.0389, 0, 0.51667],
      "113": [0.19444, 0.44444, 0.04169, 0, 0.51667],
      "114": [0, 0.44444, 0.10836, 0, 0.34167],
      "115": [0, 0.44444, 0.0778, 0, 0.38333],
      "116": [0, 0.57143, 0.07225, 0, 0.36111],
      "117": [0, 0.44444, 0.04169, 0, 0.51667],
      "118": [0, 0.44444, 0.10836, 0, 0.46111],
      "119": [0, 0.44444, 0.10836, 0, 0.68334],
      "120": [0, 0.44444, 0.09169, 0, 0.46111],
      "121": [0.19444, 0.44444, 0.10836, 0, 0.46111],
      "122": [0, 0.44444, 0.08752, 0, 0.43472],
      "126": [0.35, 0.32659, 0.08826, 0, 0.5],
      "160": [0, 0, 0, 0, 0.25],
      "168": [0, 0.67937, 0.06385, 0, 0.5],
      "176": [0, 0.69444, 0, 0, 0.73752],
      "184": [0.17014, 0, 0, 0, 0.44445],
      "305": [0, 0.44444, 0.04169, 0, 0.23889],
      "567": [0.19444, 0.44444, 0.04169, 0, 0.26667],
      "710": [0, 0.69444, 0.0799, 0, 0.5],
      "711": [0, 0.63194, 0.08432, 0, 0.5],
      "713": [0, 0.60889, 0.08776, 0, 0.5],
      "714": [0, 0.69444, 0.09205, 0, 0.5],
      "715": [0, 0.69444, 0, 0, 0.5],
      "728": [0, 0.69444, 0.09483, 0, 0.5],
      "729": [0, 0.67937, 0.07774, 0, 0.27778],
      "730": [0, 0.69444, 0, 0, 0.73752],
      "732": [0, 0.67659, 0.08826, 0, 0.5],
      "733": [0, 0.69444, 0.09205, 0, 0.5],
      "915": [0, 0.69444, 0.13372, 0, 0.54167],
      "916": [0, 0.69444, 0, 0, 0.83334],
      "920": [0, 0.69444, 0.07555, 0, 0.77778],
      "923": [0, 0.69444, 0, 0, 0.61111],
      "926": [0, 0.69444, 0.12816, 0, 0.66667],
      "928": [0, 0.69444, 0.08094, 0, 0.70834],
      "931": [0, 0.69444, 0.11983, 0, 0.72222],
      "933": [0, 0.69444, 0.09031, 0, 0.77778],
      "934": [0, 0.69444, 0.04603, 0, 0.72222],
      "936": [0, 0.69444, 0.09031, 0, 0.77778],
      "937": [0, 0.69444, 0.08293, 0, 0.72222],
      "8211": [0, 0.44444, 0.08616, 0, 0.5],
      "8212": [0, 0.44444, 0.08616, 0, 1],
      "8216": [0, 0.69444, 0.07816, 0, 0.27778],
      "8217": [0, 0.69444, 0.07816, 0, 0.27778],
      "8220": [0, 0.69444, 0.14205, 0, 0.5],
      "8221": [0, 0.69444, 316e-5, 0, 0.5]
    },
    "SansSerif-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "33": [0, 0.69444, 0, 0, 0.31945],
      "34": [0, 0.69444, 0, 0, 0.5],
      "35": [0.19444, 0.69444, 0, 0, 0.83334],
      "36": [0.05556, 0.75, 0, 0, 0.5],
      "37": [0.05556, 0.75, 0, 0, 0.83334],
      "38": [0, 0.69444, 0, 0, 0.75834],
      "39": [0, 0.69444, 0, 0, 0.27778],
      "40": [0.25, 0.75, 0, 0, 0.38889],
      "41": [0.25, 0.75, 0, 0, 0.38889],
      "42": [0, 0.75, 0, 0, 0.5],
      "43": [0.08333, 0.58333, 0, 0, 0.77778],
      "44": [0.125, 0.08333, 0, 0, 0.27778],
      "45": [0, 0.44444, 0, 0, 0.33333],
      "46": [0, 0.08333, 0, 0, 0.27778],
      "47": [0.25, 0.75, 0, 0, 0.5],
      "48": [0, 0.65556, 0, 0, 0.5],
      "49": [0, 0.65556, 0, 0, 0.5],
      "50": [0, 0.65556, 0, 0, 0.5],
      "51": [0, 0.65556, 0, 0, 0.5],
      "52": [0, 0.65556, 0, 0, 0.5],
      "53": [0, 0.65556, 0, 0, 0.5],
      "54": [0, 0.65556, 0, 0, 0.5],
      "55": [0, 0.65556, 0, 0, 0.5],
      "56": [0, 0.65556, 0, 0, 0.5],
      "57": [0, 0.65556, 0, 0, 0.5],
      "58": [0, 0.44444, 0, 0, 0.27778],
      "59": [0.125, 0.44444, 0, 0, 0.27778],
      "61": [-0.13, 0.37, 0, 0, 0.77778],
      "63": [0, 0.69444, 0, 0, 0.47222],
      "64": [0, 0.69444, 0, 0, 0.66667],
      "65": [0, 0.69444, 0, 0, 0.66667],
      "66": [0, 0.69444, 0, 0, 0.66667],
      "67": [0, 0.69444, 0, 0, 0.63889],
      "68": [0, 0.69444, 0, 0, 0.72223],
      "69": [0, 0.69444, 0, 0, 0.59722],
      "70": [0, 0.69444, 0, 0, 0.56945],
      "71": [0, 0.69444, 0, 0, 0.66667],
      "72": [0, 0.69444, 0, 0, 0.70834],
      "73": [0, 0.69444, 0, 0, 0.27778],
      "74": [0, 0.69444, 0, 0, 0.47222],
      "75": [0, 0.69444, 0, 0, 0.69445],
      "76": [0, 0.69444, 0, 0, 0.54167],
      "77": [0, 0.69444, 0, 0, 0.875],
      "78": [0, 0.69444, 0, 0, 0.70834],
      "79": [0, 0.69444, 0, 0, 0.73611],
      "80": [0, 0.69444, 0, 0, 0.63889],
      "81": [0.125, 0.69444, 0, 0, 0.73611],
      "82": [0, 0.69444, 0, 0, 0.64584],
      "83": [0, 0.69444, 0, 0, 0.55556],
      "84": [0, 0.69444, 0, 0, 0.68056],
      "85": [0, 0.69444, 0, 0, 0.6875],
      "86": [0, 0.69444, 0.01389, 0, 0.66667],
      "87": [0, 0.69444, 0.01389, 0, 0.94445],
      "88": [0, 0.69444, 0, 0, 0.66667],
      "89": [0, 0.69444, 0.025, 0, 0.66667],
      "90": [0, 0.69444, 0, 0, 0.61111],
      "91": [0.25, 0.75, 0, 0, 0.28889],
      "93": [0.25, 0.75, 0, 0, 0.28889],
      "94": [0, 0.69444, 0, 0, 0.5],
      "95": [0.35, 0.09444, 0.02778, 0, 0.5],
      "97": [0, 0.44444, 0, 0, 0.48056],
      "98": [0, 0.69444, 0, 0, 0.51667],
      "99": [0, 0.44444, 0, 0, 0.44445],
      "100": [0, 0.69444, 0, 0, 0.51667],
      "101": [0, 0.44444, 0, 0, 0.44445],
      "102": [0, 0.69444, 0.06944, 0, 0.30556],
      "103": [0.19444, 0.44444, 0.01389, 0, 0.5],
      "104": [0, 0.69444, 0, 0, 0.51667],
      "105": [0, 0.67937, 0, 0, 0.23889],
      "106": [0.19444, 0.67937, 0, 0, 0.26667],
      "107": [0, 0.69444, 0, 0, 0.48889],
      "108": [0, 0.69444, 0, 0, 0.23889],
      "109": [0, 0.44444, 0, 0, 0.79445],
      "110": [0, 0.44444, 0, 0, 0.51667],
      "111": [0, 0.44444, 0, 0, 0.5],
      "112": [0.19444, 0.44444, 0, 0, 0.51667],
      "113": [0.19444, 0.44444, 0, 0, 0.51667],
      "114": [0, 0.44444, 0.01389, 0, 0.34167],
      "115": [0, 0.44444, 0, 0, 0.38333],
      "116": [0, 0.57143, 0, 0, 0.36111],
      "117": [0, 0.44444, 0, 0, 0.51667],
      "118": [0, 0.44444, 0.01389, 0, 0.46111],
      "119": [0, 0.44444, 0.01389, 0, 0.68334],
      "120": [0, 0.44444, 0, 0, 0.46111],
      "121": [0.19444, 0.44444, 0.01389, 0, 0.46111],
      "122": [0, 0.44444, 0, 0, 0.43472],
      "126": [0.35, 0.32659, 0, 0, 0.5],
      "160": [0, 0, 0, 0, 0.25],
      "168": [0, 0.67937, 0, 0, 0.5],
      "176": [0, 0.69444, 0, 0, 0.66667],
      "184": [0.17014, 0, 0, 0, 0.44445],
      "305": [0, 0.44444, 0, 0, 0.23889],
      "567": [0.19444, 0.44444, 0, 0, 0.26667],
      "710": [0, 0.69444, 0, 0, 0.5],
      "711": [0, 0.63194, 0, 0, 0.5],
      "713": [0, 0.60889, 0, 0, 0.5],
      "714": [0, 0.69444, 0, 0, 0.5],
      "715": [0, 0.69444, 0, 0, 0.5],
      "728": [0, 0.69444, 0, 0, 0.5],
      "729": [0, 0.67937, 0, 0, 0.27778],
      "730": [0, 0.69444, 0, 0, 0.66667],
      "732": [0, 0.67659, 0, 0, 0.5],
      "733": [0, 0.69444, 0, 0, 0.5],
      "915": [0, 0.69444, 0, 0, 0.54167],
      "916": [0, 0.69444, 0, 0, 0.83334],
      "920": [0, 0.69444, 0, 0, 0.77778],
      "923": [0, 0.69444, 0, 0, 0.61111],
      "926": [0, 0.69444, 0, 0, 0.66667],
      "928": [0, 0.69444, 0, 0, 0.70834],
      "931": [0, 0.69444, 0, 0, 0.72222],
      "933": [0, 0.69444, 0, 0, 0.77778],
      "934": [0, 0.69444, 0, 0, 0.72222],
      "936": [0, 0.69444, 0, 0, 0.77778],
      "937": [0, 0.69444, 0, 0, 0.72222],
      "8211": [0, 0.44444, 0.02778, 0, 0.5],
      "8212": [0, 0.44444, 0.02778, 0, 1],
      "8216": [0, 0.69444, 0, 0, 0.27778],
      "8217": [0, 0.69444, 0, 0, 0.27778],
      "8220": [0, 0.69444, 0, 0, 0.5],
      "8221": [0, 0.69444, 0, 0, 0.5]
    },
    "Script-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "65": [0, 0.7, 0.22925, 0, 0.80253],
      "66": [0, 0.7, 0.04087, 0, 0.90757],
      "67": [0, 0.7, 0.1689, 0, 0.66619],
      "68": [0, 0.7, 0.09371, 0, 0.77443],
      "69": [0, 0.7, 0.18583, 0, 0.56162],
      "70": [0, 0.7, 0.13634, 0, 0.89544],
      "71": [0, 0.7, 0.17322, 0, 0.60961],
      "72": [0, 0.7, 0.29694, 0, 0.96919],
      "73": [0, 0.7, 0.19189, 0, 0.80907],
      "74": [0.27778, 0.7, 0.19189, 0, 1.05159],
      "75": [0, 0.7, 0.31259, 0, 0.91364],
      "76": [0, 0.7, 0.19189, 0, 0.87373],
      "77": [0, 0.7, 0.15981, 0, 1.08031],
      "78": [0, 0.7, 0.3525, 0, 0.9015],
      "79": [0, 0.7, 0.08078, 0, 0.73787],
      "80": [0, 0.7, 0.08078, 0, 1.01262],
      "81": [0, 0.7, 0.03305, 0, 0.88282],
      "82": [0, 0.7, 0.06259, 0, 0.85],
      "83": [0, 0.7, 0.19189, 0, 0.86767],
      "84": [0, 0.7, 0.29087, 0, 0.74697],
      "85": [0, 0.7, 0.25815, 0, 0.79996],
      "86": [0, 0.7, 0.27523, 0, 0.62204],
      "87": [0, 0.7, 0.27523, 0, 0.80532],
      "88": [0, 0.7, 0.26006, 0, 0.94445],
      "89": [0, 0.7, 0.2939, 0, 0.70961],
      "90": [0, 0.7, 0.24037, 0, 0.8212],
      "160": [0, 0, 0, 0, 0.25]
    },
    "Size1-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "40": [0.35001, 0.85, 0, 0, 0.45834],
      "41": [0.35001, 0.85, 0, 0, 0.45834],
      "47": [0.35001, 0.85, 0, 0, 0.57778],
      "91": [0.35001, 0.85, 0, 0, 0.41667],
      "92": [0.35001, 0.85, 0, 0, 0.57778],
      "93": [0.35001, 0.85, 0, 0, 0.41667],
      "123": [0.35001, 0.85, 0, 0, 0.58334],
      "125": [0.35001, 0.85, 0, 0, 0.58334],
      "160": [0, 0, 0, 0, 0.25],
      "710": [0, 0.72222, 0, 0, 0.55556],
      "732": [0, 0.72222, 0, 0, 0.55556],
      "770": [0, 0.72222, 0, 0, 0.55556],
      "771": [0, 0.72222, 0, 0, 0.55556],
      "8214": [-99e-5, 0.601, 0, 0, 0.77778],
      "8593": [1e-5, 0.6, 0, 0, 0.66667],
      "8595": [1e-5, 0.6, 0, 0, 0.66667],
      "8657": [1e-5, 0.6, 0, 0, 0.77778],
      "8659": [1e-5, 0.6, 0, 0, 0.77778],
      "8719": [0.25001, 0.75, 0, 0, 0.94445],
      "8720": [0.25001, 0.75, 0, 0, 0.94445],
      "8721": [0.25001, 0.75, 0, 0, 1.05556],
      "8730": [0.35001, 0.85, 0, 0, 1],
      "8739": [-599e-5, 0.606, 0, 0, 0.33333],
      "8741": [-599e-5, 0.606, 0, 0, 0.55556],
      "8747": [0.30612, 0.805, 0.19445, 0, 0.47222],
      "8748": [0.306, 0.805, 0.19445, 0, 0.47222],
      "8749": [0.306, 0.805, 0.19445, 0, 0.47222],
      "8750": [0.30612, 0.805, 0.19445, 0, 0.47222],
      "8896": [0.25001, 0.75, 0, 0, 0.83334],
      "8897": [0.25001, 0.75, 0, 0, 0.83334],
      "8898": [0.25001, 0.75, 0, 0, 0.83334],
      "8899": [0.25001, 0.75, 0, 0, 0.83334],
      "8968": [0.35001, 0.85, 0, 0, 0.47222],
      "8969": [0.35001, 0.85, 0, 0, 0.47222],
      "8970": [0.35001, 0.85, 0, 0, 0.47222],
      "8971": [0.35001, 0.85, 0, 0, 0.47222],
      "9168": [-99e-5, 0.601, 0, 0, 0.66667],
      "10216": [0.35001, 0.85, 0, 0, 0.47222],
      "10217": [0.35001, 0.85, 0, 0, 0.47222],
      "10752": [0.25001, 0.75, 0, 0, 1.11111],
      "10753": [0.25001, 0.75, 0, 0, 1.11111],
      "10754": [0.25001, 0.75, 0, 0, 1.11111],
      "10756": [0.25001, 0.75, 0, 0, 0.83334],
      "10758": [0.25001, 0.75, 0, 0, 0.83334]
    },
    "Size2-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "40": [0.65002, 1.15, 0, 0, 0.59722],
      "41": [0.65002, 1.15, 0, 0, 0.59722],
      "47": [0.65002, 1.15, 0, 0, 0.81111],
      "91": [0.65002, 1.15, 0, 0, 0.47222],
      "92": [0.65002, 1.15, 0, 0, 0.81111],
      "93": [0.65002, 1.15, 0, 0, 0.47222],
      "123": [0.65002, 1.15, 0, 0, 0.66667],
      "125": [0.65002, 1.15, 0, 0, 0.66667],
      "160": [0, 0, 0, 0, 0.25],
      "710": [0, 0.75, 0, 0, 1],
      "732": [0, 0.75, 0, 0, 1],
      "770": [0, 0.75, 0, 0, 1],
      "771": [0, 0.75, 0, 0, 1],
      "8719": [0.55001, 1.05, 0, 0, 1.27778],
      "8720": [0.55001, 1.05, 0, 0, 1.27778],
      "8721": [0.55001, 1.05, 0, 0, 1.44445],
      "8730": [0.65002, 1.15, 0, 0, 1],
      "8747": [0.86225, 1.36, 0.44445, 0, 0.55556],
      "8748": [0.862, 1.36, 0.44445, 0, 0.55556],
      "8749": [0.862, 1.36, 0.44445, 0, 0.55556],
      "8750": [0.86225, 1.36, 0.44445, 0, 0.55556],
      "8896": [0.55001, 1.05, 0, 0, 1.11111],
      "8897": [0.55001, 1.05, 0, 0, 1.11111],
      "8898": [0.55001, 1.05, 0, 0, 1.11111],
      "8899": [0.55001, 1.05, 0, 0, 1.11111],
      "8968": [0.65002, 1.15, 0, 0, 0.52778],
      "8969": [0.65002, 1.15, 0, 0, 0.52778],
      "8970": [0.65002, 1.15, 0, 0, 0.52778],
      "8971": [0.65002, 1.15, 0, 0, 0.52778],
      "10216": [0.65002, 1.15, 0, 0, 0.61111],
      "10217": [0.65002, 1.15, 0, 0, 0.61111],
      "10752": [0.55001, 1.05, 0, 0, 1.51112],
      "10753": [0.55001, 1.05, 0, 0, 1.51112],
      "10754": [0.55001, 1.05, 0, 0, 1.51112],
      "10756": [0.55001, 1.05, 0, 0, 1.11111],
      "10758": [0.55001, 1.05, 0, 0, 1.11111]
    },
    "Size3-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "40": [0.95003, 1.45, 0, 0, 0.73611],
      "41": [0.95003, 1.45, 0, 0, 0.73611],
      "47": [0.95003, 1.45, 0, 0, 1.04445],
      "91": [0.95003, 1.45, 0, 0, 0.52778],
      "92": [0.95003, 1.45, 0, 0, 1.04445],
      "93": [0.95003, 1.45, 0, 0, 0.52778],
      "123": [0.95003, 1.45, 0, 0, 0.75],
      "125": [0.95003, 1.45, 0, 0, 0.75],
      "160": [0, 0, 0, 0, 0.25],
      "710": [0, 0.75, 0, 0, 1.44445],
      "732": [0, 0.75, 0, 0, 1.44445],
      "770": [0, 0.75, 0, 0, 1.44445],
      "771": [0, 0.75, 0, 0, 1.44445],
      "8730": [0.95003, 1.45, 0, 0, 1],
      "8968": [0.95003, 1.45, 0, 0, 0.58334],
      "8969": [0.95003, 1.45, 0, 0, 0.58334],
      "8970": [0.95003, 1.45, 0, 0, 0.58334],
      "8971": [0.95003, 1.45, 0, 0, 0.58334],
      "10216": [0.95003, 1.45, 0, 0, 0.75],
      "10217": [0.95003, 1.45, 0, 0, 0.75]
    },
    "Size4-Regular": {
      "32": [0, 0, 0, 0, 0.25],
      "40": [1.25003, 1.75, 0, 0, 0.79167],
      "41": [1.25003, 1.75, 0, 0, 0.79167],
      "47": [1.25003, 1.75, 0, 0, 1.27778],
      "91": [1.25003, 1.75, 0, 0, 0.58334],
      "92": [1.25003, 1.75, 0, 0, 1.27778],
      "93": [1.25003, 1.75, 0, 0, 0.58334],
      "123": [1.25003, 1.75, 0, 0, 0.80556],
      "125": [1.25003, 1.75, 0, 0, 0.80556],
      "160": [0, 0, 0, 0, 0.25],
      "710": [0, 0.825, 0, 0, 1.8889],
      "732": [0, 0.825, 0, 0, 1.8889],
      "770": [0, 0.825, 0, 0, 1.8889],
      "771": [0, 0.825, 0, 0, 1.8889],
      "8730": [1.25003, 1.75, 0, 0, 1],
      "8968": [1.25003, 1.75, 0, 0, 0.63889],
      "8969": [1.25003, 1.75, 0, 0, 0.63889],
      "8970": [1.25003, 1.75, 0, 0, 0.63889],
      "8971": [1.25003, 1.75, 0, 0, 0.63889],
      "9115": [0.64502, 1.155, 0, 0, 0.875],
      "9116": [1e-5, 0.6, 0, 0, 0.875],
      "9117": [0.64502, 1.155, 0, 0, 0.875],
      "9118": [0.64502, 1.155, 0, 0, 0.875],
      "9119": [1e-5, 0.6, 0, 0, 0.875],
      "9120": [0.64502, 1.155, 0, 0, 0.875],
      "9121": [0.64502, 1.155, 0, 0, 0.66667],
      "9122": [-99e-5, 0.601, 0, 0, 0.66667],
      "9123": [0.64502, 1.155, 0, 0, 0.66667],
      "9124": [0.64502, 1.155, 0, 0, 0.66667],
      "9125": [-99e-5, 0.601, 0, 0, 0.66667],
      "9126": [0.64502, 1.155, 0, 0, 0.66667],
      "9127": [1e-5, 0.9, 0, 0, 0.88889],
      "9128": [0.65002, 1.15, 0, 0, 0.88889],
      "9129": [0.90001, 0, 0, 0, 0.88889],
      "9130": [0, 0.3, 0, 0, 0.88889],
      "9131": [1e-5, 0.9, 0, 0, 0.88889],
      "9132": [0.65002, 1.15, 0, 0, 0.88889],
      "9133": [0.90001, 0, 0, 0, 0.88889],
      "9143": [0.88502, 0.915, 0, 0, 1.05556],
      "10216": [1.25003, 1.75, 0, 0, 0.80556],
      "10217": [1.25003, 1.75, 0, 0, 0.80556],
      "57344": [-499e-5, 0.605, 0, 0, 1.05556],
      "57345": [-499e-5, 0.605, 0, 0, 1.05556],
      "57680": [0, 0.12, 0, 0, 0.45],
      "57681": [0, 0.12, 0, 0, 0.45],
      "57682": [0, 0.12, 0, 0, 0.45],
      "57683": [0, 0.12, 0, 0, 0.45]
    },
    "Typewriter-Regular": {
      "32": [0, 0, 0, 0, 0.525],
      "33": [0, 0.61111, 0, 0, 0.525],
      "34": [0, 0.61111, 0, 0, 0.525],
      "35": [0, 0.61111, 0, 0, 0.525],
      "36": [0.08333, 0.69444, 0, 0, 0.525],
      "37": [0.08333, 0.69444, 0, 0, 0.525],
      "38": [0, 0.61111, 0, 0, 0.525],
      "39": [0, 0.61111, 0, 0, 0.525],
      "40": [0.08333, 0.69444, 0, 0, 0.525],
      "41": [0.08333, 0.69444, 0, 0, 0.525],
      "42": [0, 0.52083, 0, 0, 0.525],
      "43": [-0.08056, 0.53055, 0, 0, 0.525],
      "44": [0.13889, 0.125, 0, 0, 0.525],
      "45": [-0.08056, 0.53055, 0, 0, 0.525],
      "46": [0, 0.125, 0, 0, 0.525],
      "47": [0.08333, 0.69444, 0, 0, 0.525],
      "48": [0, 0.61111, 0, 0, 0.525],
      "49": [0, 0.61111, 0, 0, 0.525],
      "50": [0, 0.61111, 0, 0, 0.525],
      "51": [0, 0.61111, 0, 0, 0.525],
      "52": [0, 0.61111, 0, 0, 0.525],
      "53": [0, 0.61111, 0, 0, 0.525],
      "54": [0, 0.61111, 0, 0, 0.525],
      "55": [0, 0.61111, 0, 0, 0.525],
      "56": [0, 0.61111, 0, 0, 0.525],
      "57": [0, 0.61111, 0, 0, 0.525],
      "58": [0, 0.43056, 0, 0, 0.525],
      "59": [0.13889, 0.43056, 0, 0, 0.525],
      "60": [-0.05556, 0.55556, 0, 0, 0.525],
      "61": [-0.19549, 0.41562, 0, 0, 0.525],
      "62": [-0.05556, 0.55556, 0, 0, 0.525],
      "63": [0, 0.61111, 0, 0, 0.525],
      "64": [0, 0.61111, 0, 0, 0.525],
      "65": [0, 0.61111, 0, 0, 0.525],
      "66": [0, 0.61111, 0, 0, 0.525],
      "67": [0, 0.61111, 0, 0, 0.525],
      "68": [0, 0.61111, 0, 0, 0.525],
      "69": [0, 0.61111, 0, 0, 0.525],
      "70": [0, 0.61111, 0, 0, 0.525],
      "71": [0, 0.61111, 0, 0, 0.525],
      "72": [0, 0.61111, 0, 0, 0.525],
      "73": [0, 0.61111, 0, 0, 0.525],
      "74": [0, 0.61111, 0, 0, 0.525],
      "75": [0, 0.61111, 0, 0, 0.525],
      "76": [0, 0.61111, 0, 0, 0.525],
      "77": [0, 0.61111, 0, 0, 0.525],
      "78": [0, 0.61111, 0, 0, 0.525],
      "79": [0, 0.61111, 0, 0, 0.525],
      "80": [0, 0.61111, 0, 0, 0.525],
      "81": [0.13889, 0.61111, 0, 0, 0.525],
      "82": [0, 0.61111, 0, 0, 0.525],
      "83": [0, 0.61111, 0, 0, 0.525],
      "84": [0, 0.61111, 0, 0, 0.525],
      "85": [0, 0.61111, 0, 0, 0.525],
      "86": [0, 0.61111, 0, 0, 0.525],
      "87": [0, 0.61111, 0, 0, 0.525],
      "88": [0, 0.61111, 0, 0, 0.525],
      "89": [0, 0.61111, 0, 0, 0.525],
      "90": [0, 0.61111, 0, 0, 0.525],
      "91": [0.08333, 0.69444, 0, 0, 0.525],
      "92": [0.08333, 0.69444, 0, 0, 0.525],
      "93": [0.08333, 0.69444, 0, 0, 0.525],
      "94": [0, 0.61111, 0, 0, 0.525],
      "95": [0.09514, 0, 0, 0, 0.525],
      "96": [0, 0.61111, 0, 0, 0.525],
      "97": [0, 0.43056, 0, 0, 0.525],
      "98": [0, 0.61111, 0, 0, 0.525],
      "99": [0, 0.43056, 0, 0, 0.525],
      "100": [0, 0.61111, 0, 0, 0.525],
      "101": [0, 0.43056, 0, 0, 0.525],
      "102": [0, 0.61111, 0, 0, 0.525],
      "103": [0.22222, 0.43056, 0, 0, 0.525],
      "104": [0, 0.61111, 0, 0, 0.525],
      "105": [0, 0.61111, 0, 0, 0.525],
      "106": [0.22222, 0.61111, 0, 0, 0.525],
      "107": [0, 0.61111, 0, 0, 0.525],
      "108": [0, 0.61111, 0, 0, 0.525],
      "109": [0, 0.43056, 0, 0, 0.525],
      "110": [0, 0.43056, 0, 0, 0.525],
      "111": [0, 0.43056, 0, 0, 0.525],
      "112": [0.22222, 0.43056, 0, 0, 0.525],
      "113": [0.22222, 0.43056, 0, 0, 0.525],
      "114": [0, 0.43056, 0, 0, 0.525],
      "115": [0, 0.43056, 0, 0, 0.525],
      "116": [0, 0.55358, 0, 0, 0.525],
      "117": [0, 0.43056, 0, 0, 0.525],
      "118": [0, 0.43056, 0, 0, 0.525],
      "119": [0, 0.43056, 0, 0, 0.525],
      "120": [0, 0.43056, 0, 0, 0.525],
      "121": [0.22222, 0.43056, 0, 0, 0.525],
      "122": [0, 0.43056, 0, 0, 0.525],
      "123": [0.08333, 0.69444, 0, 0, 0.525],
      "124": [0.08333, 0.69444, 0, 0, 0.525],
      "125": [0.08333, 0.69444, 0, 0, 0.525],
      "126": [0, 0.61111, 0, 0, 0.525],
      "127": [0, 0.61111, 0, 0, 0.525],
      "160": [0, 0, 0, 0, 0.525],
      "176": [0, 0.61111, 0, 0, 0.525],
      "184": [0.19445, 0, 0, 0, 0.525],
      "305": [0, 0.43056, 0, 0, 0.525],
      "567": [0.22222, 0.43056, 0, 0, 0.525],
      "711": [0, 0.56597, 0, 0, 0.525],
      "713": [0, 0.56555, 0, 0, 0.525],
      "714": [0, 0.61111, 0, 0, 0.525],
      "715": [0, 0.61111, 0, 0, 0.525],
      "728": [0, 0.61111, 0, 0, 0.525],
      "730": [0, 0.61111, 0, 0, 0.525],
      "770": [0, 0.61111, 0, 0, 0.525],
      "771": [0, 0.61111, 0, 0, 0.525],
      "776": [0, 0.61111, 0, 0, 0.525],
      "915": [0, 0.61111, 0, 0, 0.525],
      "916": [0, 0.61111, 0, 0, 0.525],
      "920": [0, 0.61111, 0, 0, 0.525],
      "923": [0, 0.61111, 0, 0, 0.525],
      "926": [0, 0.61111, 0, 0, 0.525],
      "928": [0, 0.61111, 0, 0, 0.525],
      "931": [0, 0.61111, 0, 0, 0.525],
      "933": [0, 0.61111, 0, 0, 0.525],
      "934": [0, 0.61111, 0, 0, 0.525],
      "936": [0, 0.61111, 0, 0, 0.525],
      "937": [0, 0.61111, 0, 0, 0.525],
      "8216": [0, 0.61111, 0, 0, 0.525],
      "8217": [0, 0.61111, 0, 0, 0.525],
      "8242": [0, 0.61111, 0, 0, 0.525],
      "9251": [0.11111, 0.21944, 0, 0, 0.525]
    }
  };
  var sigmasAndXis = {
    slant: [0.25, 0.25, 0.25],
    // sigma1
    space: [0, 0, 0],
    // sigma2
    stretch: [0, 0, 0],
    // sigma3
    shrink: [0, 0, 0],
    // sigma4
    xHeight: [0.431, 0.431, 0.431],
    // sigma5
    quad: [1, 1.171, 1.472],
    // sigma6
    extraSpace: [0, 0, 0],
    // sigma7
    num1: [0.677, 0.732, 0.925],
    // sigma8
    num2: [0.394, 0.384, 0.387],
    // sigma9
    num3: [0.444, 0.471, 0.504],
    // sigma10
    denom1: [0.686, 0.752, 1.025],
    // sigma11
    denom2: [0.345, 0.344, 0.532],
    // sigma12
    sup1: [0.413, 0.503, 0.504],
    // sigma13
    sup2: [0.363, 0.431, 0.404],
    // sigma14
    sup3: [0.289, 0.286, 0.294],
    // sigma15
    sub1: [0.15, 0.143, 0.2],
    // sigma16
    sub2: [0.247, 0.286, 0.4],
    // sigma17
    supDrop: [0.386, 0.353, 0.494],
    // sigma18
    subDrop: [0.05, 0.071, 0.1],
    // sigma19
    delim1: [2.39, 1.7, 1.98],
    // sigma20
    delim2: [1.01, 1.157, 1.42],
    // sigma21
    axisHeight: [0.25, 0.25, 0.25],
    // sigma22
    // These font metrics are extracted from TeX by using tftopl on cmex10.tfm;
    // they correspond to the font parameters of the extension fonts (family 3).
    // See the TeXbook, page 441. In AMSTeX, the extension fonts scale; to
    // match cmex7, we'd use cmex7.tfm values for script and scriptscript
    // values.
    defaultRuleThickness: [0.04, 0.049, 0.049],
    // xi8; cmex7: 0.049
    bigOpSpacing1: [0.111, 0.111, 0.111],
    // xi9
    bigOpSpacing2: [0.166, 0.166, 0.166],
    // xi10
    bigOpSpacing3: [0.2, 0.2, 0.2],
    // xi11
    bigOpSpacing4: [0.6, 0.611, 0.611],
    // xi12; cmex7: 0.611
    bigOpSpacing5: [0.1, 0.143, 0.143],
    // xi13; cmex7: 0.143
    // The \sqrt rule width is taken from the height of the surd character.
    // Since we use the same font at all sizes, this thickness doesn't scale.
    sqrtRuleThickness: [0.04, 0.04, 0.04],
    // This value determines how large a pt is, for metrics which are defined
    // in terms of pts.
    // This value is also used in katex.scss; if you change it make sure the
    // values match.
    ptPerEm: [10, 10, 10],
    // The space between adjacent `|` columns in an array definition. From
    // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
    doubleRuleSep: [0.2, 0.2, 0.2],
    // The width of separator lines in {array} environments. From
    // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
    arrayRuleWidth: [0.04, 0.04, 0.04],
    // Two values from LaTeX source2e:
    fboxsep: [0.3, 0.3, 0.3],
    //        3 pt / ptPerEm
    fboxrule: [0.04, 0.04, 0.04]
    // 0.4 pt / ptPerEm
  };
  var extraCharacterMap = {
    // Latin-1
    "\xC5": "A",
    "\xD0": "D",
    "\xDE": "o",
    "\xE5": "a",
    "\xF0": "d",
    "\xFE": "o",
    // Cyrillic
    "\u0410": "A",
    "\u0411": "B",
    "\u0412": "B",
    "\u0413": "F",
    "\u0414": "A",
    "\u0415": "E",
    "\u0416": "K",
    "\u0417": "3",
    "\u0418": "N",
    "\u0419": "N",
    "\u041A": "K",
    "\u041B": "N",
    "\u041C": "M",
    "\u041D": "H",
    "\u041E": "O",
    "\u041F": "N",
    "\u0420": "P",
    "\u0421": "C",
    "\u0422": "T",
    "\u0423": "y",
    "\u0424": "O",
    "\u0425": "X",
    "\u0426": "U",
    "\u0427": "h",
    "\u0428": "W",
    "\u0429": "W",
    "\u042A": "B",
    "\u042B": "X",
    "\u042C": "B",
    "\u042D": "3",
    "\u042E": "X",
    "\u042F": "R",
    "\u0430": "a",
    "\u0431": "b",
    "\u0432": "a",
    "\u0433": "r",
    "\u0434": "y",
    "\u0435": "e",
    "\u0436": "m",
    "\u0437": "e",
    "\u0438": "n",
    "\u0439": "n",
    "\u043A": "n",
    "\u043B": "n",
    "\u043C": "m",
    "\u043D": "n",
    "\u043E": "o",
    "\u043F": "n",
    "\u0440": "p",
    "\u0441": "c",
    "\u0442": "o",
    "\u0443": "y",
    "\u0444": "b",
    "\u0445": "x",
    "\u0446": "n",
    "\u0447": "n",
    "\u0448": "w",
    "\u0449": "w",
    "\u044A": "a",
    "\u044B": "m",
    "\u044C": "a",
    "\u044D": "e",
    "\u044E": "m",
    "\u044F": "r"
  };
  function setFontMetrics(fontName, metrics) {
    fontMetricsData[fontName] = metrics;
  }
  __name(setFontMetrics, "setFontMetrics");
  function getCharacterMetrics(character, font, mode) {
    if (!fontMetricsData[font]) {
      throw new Error("Font metrics not found for font: " + font + ".");
    }
    var ch = character.charCodeAt(0);
    var metrics = fontMetricsData[font][ch];
    if (!metrics && character[0] in extraCharacterMap) {
      ch = extraCharacterMap[character[0]].charCodeAt(0);
      metrics = fontMetricsData[font][ch];
    }
    if (!metrics && mode === "text") {
      if (supportedCodepoint(ch)) {
        metrics = fontMetricsData[font][77];
      }
    }
    if (metrics) {
      return {
        depth: metrics[0],
        height: metrics[1],
        italic: metrics[2],
        skew: metrics[3],
        width: metrics[4]
      };
    }
  }
  __name(getCharacterMetrics, "getCharacterMetrics");
  var fontMetricsBySizeIndex = {};
  function getGlobalMetrics(size) {
    var sizeIndex;
    if (size >= 5) {
      sizeIndex = 0;
    } else if (size >= 3) {
      sizeIndex = 1;
    } else {
      sizeIndex = 2;
    }
    if (!fontMetricsBySizeIndex[sizeIndex]) {
      var metrics = fontMetricsBySizeIndex[sizeIndex] = {
        cssEmPerMu: sigmasAndXis.quad[sizeIndex] / 18
      };
      for (var key in sigmasAndXis) {
        if (sigmasAndXis.hasOwnProperty(key)) {
          metrics[key] = sigmasAndXis[key][sizeIndex];
        }
      }
    }
    return fontMetricsBySizeIndex[sizeIndex];
  }
  __name(getGlobalMetrics, "getGlobalMetrics");
  var symbols = {
    "math": {},
    "text": {}
  };
  function defineSymbol(mode, font, group, replace2, name, acceptUnicodeChar) {
    symbols[mode][name] = {
      font,
      group,
      replace: replace2
    };
    if (acceptUnicodeChar && replace2) {
      symbols[mode][replace2] = symbols[mode][name];
    }
  }
  __name(defineSymbol, "defineSymbol");
  var math = "math";
  var text2 = "text";
  var main = "main";
  var ams = "ams";
  var accent = "accent-token";
  var bin = "bin";
  var close = "close";
  var inner = "inner";
  var mathord = "mathord";
  var op = "op-token";
  var open = "open";
  var punct = "punct";
  var rel = "rel";
  var spacing = "spacing";
  var textord = "textord";
  defineSymbol(math, main, rel, "\u2261", "\\equiv", true);
  defineSymbol(math, main, rel, "\u227A", "\\prec", true);
  defineSymbol(math, main, rel, "\u227B", "\\succ", true);
  defineSymbol(math, main, rel, "\u223C", "\\sim", true);
  defineSymbol(math, main, rel, "\u22A5", "\\perp");
  defineSymbol(math, main, rel, "\u2AAF", "\\preceq", true);
  defineSymbol(math, main, rel, "\u2AB0", "\\succeq", true);
  defineSymbol(math, main, rel, "\u2243", "\\simeq", true);
  defineSymbol(math, main, rel, "\u2223", "\\mid", true);
  defineSymbol(math, main, rel, "\u226A", "\\ll", true);
  defineSymbol(math, main, rel, "\u226B", "\\gg", true);
  defineSymbol(math, main, rel, "\u224D", "\\asymp", true);
  defineSymbol(math, main, rel, "\u2225", "\\parallel");
  defineSymbol(math, main, rel, "\u22C8", "\\bowtie", true);
  defineSymbol(math, main, rel, "\u2323", "\\smile", true);
  defineSymbol(math, main, rel, "\u2291", "\\sqsubseteq", true);
  defineSymbol(math, main, rel, "\u2292", "\\sqsupseteq", true);
  defineSymbol(math, main, rel, "\u2250", "\\doteq", true);
  defineSymbol(math, main, rel, "\u2322", "\\frown", true);
  defineSymbol(math, main, rel, "\u220B", "\\ni", true);
  defineSymbol(math, main, rel, "\u221D", "\\propto", true);
  defineSymbol(math, main, rel, "\u22A2", "\\vdash", true);
  defineSymbol(math, main, rel, "\u22A3", "\\dashv", true);
  defineSymbol(math, main, rel, "\u220B", "\\owns");
  defineSymbol(math, main, punct, ".", "\\ldotp");
  defineSymbol(math, main, punct, "\u22C5", "\\cdotp");
  defineSymbol(math, main, punct, "\u22C5", "\xB7");
  defineSymbol(text2, main, textord, "\u22C5", "\xB7");
  defineSymbol(math, main, textord, "#", "\\#");
  defineSymbol(text2, main, textord, "#", "\\#");
  defineSymbol(math, main, textord, "&", "\\&");
  defineSymbol(text2, main, textord, "&", "\\&");
  defineSymbol(math, main, textord, "\u2135", "\\aleph", true);
  defineSymbol(math, main, textord, "\u2200", "\\forall", true);
  defineSymbol(math, main, textord, "\u210F", "\\hbar", true);
  defineSymbol(math, main, textord, "\u2203", "\\exists", true);
  defineSymbol(math, main, textord, "\u2207", "\\nabla", true);
  defineSymbol(math, main, textord, "\u266D", "\\flat", true);
  defineSymbol(math, main, textord, "\u2113", "\\ell", true);
  defineSymbol(math, main, textord, "\u266E", "\\natural", true);
  defineSymbol(math, main, textord, "\u2663", "\\clubsuit", true);
  defineSymbol(math, main, textord, "\u2118", "\\wp", true);
  defineSymbol(math, main, textord, "\u266F", "\\sharp", true);
  defineSymbol(math, main, textord, "\u2662", "\\diamondsuit", true);
  defineSymbol(math, main, textord, "\u211C", "\\Re", true);
  defineSymbol(math, main, textord, "\u2661", "\\heartsuit", true);
  defineSymbol(math, main, textord, "\u2111", "\\Im", true);
  defineSymbol(math, main, textord, "\u2660", "\\spadesuit", true);
  defineSymbol(math, main, textord, "\xA7", "\\S", true);
  defineSymbol(text2, main, textord, "\xA7", "\\S");
  defineSymbol(math, main, textord, "\xB6", "\\P", true);
  defineSymbol(text2, main, textord, "\xB6", "\\P");
  defineSymbol(math, main, textord, "\u2020", "\\dag");
  defineSymbol(text2, main, textord, "\u2020", "\\dag");
  defineSymbol(text2, main, textord, "\u2020", "\\textdagger");
  defineSymbol(math, main, textord, "\u2021", "\\ddag");
  defineSymbol(text2, main, textord, "\u2021", "\\ddag");
  defineSymbol(text2, main, textord, "\u2021", "\\textdaggerdbl");
  defineSymbol(math, main, close, "\u23B1", "\\rmoustache", true);
  defineSymbol(math, main, open, "\u23B0", "\\lmoustache", true);
  defineSymbol(math, main, close, "\u27EF", "\\rgroup", true);
  defineSymbol(math, main, open, "\u27EE", "\\lgroup", true);
  defineSymbol(math, main, bin, "\u2213", "\\mp", true);
  defineSymbol(math, main, bin, "\u2296", "\\ominus", true);
  defineSymbol(math, main, bin, "\u228E", "\\uplus", true);
  defineSymbol(math, main, bin, "\u2293", "\\sqcap", true);
  defineSymbol(math, main, bin, "\u2217", "\\ast");
  defineSymbol(math, main, bin, "\u2294", "\\sqcup", true);
  defineSymbol(math, main, bin, "\u25EF", "\\bigcirc", true);
  defineSymbol(math, main, bin, "\u2219", "\\bullet", true);
  defineSymbol(math, main, bin, "\u2021", "\\ddagger");
  defineSymbol(math, main, bin, "\u2240", "\\wr", true);
  defineSymbol(math, main, bin, "\u2A3F", "\\amalg");
  defineSymbol(math, main, bin, "&", "\\And");
  defineSymbol(math, main, rel, "\u27F5", "\\longleftarrow", true);
  defineSymbol(math, main, rel, "\u21D0", "\\Leftarrow", true);
  defineSymbol(math, main, rel, "\u27F8", "\\Longleftarrow", true);
  defineSymbol(math, main, rel, "\u27F6", "\\longrightarrow", true);
  defineSymbol(math, main, rel, "\u21D2", "\\Rightarrow", true);
  defineSymbol(math, main, rel, "\u27F9", "\\Longrightarrow", true);
  defineSymbol(math, main, rel, "\u2194", "\\leftrightarrow", true);
  defineSymbol(math, main, rel, "\u27F7", "\\longleftrightarrow", true);
  defineSymbol(math, main, rel, "\u21D4", "\\Leftrightarrow", true);
  defineSymbol(math, main, rel, "\u27FA", "\\Longleftrightarrow", true);
  defineSymbol(math, main, rel, "\u21A6", "\\mapsto", true);
  defineSymbol(math, main, rel, "\u27FC", "\\longmapsto", true);
  defineSymbol(math, main, rel, "\u2197", "\\nearrow", true);
  defineSymbol(math, main, rel, "\u21A9", "\\hookleftarrow", true);
  defineSymbol(math, main, rel, "\u21AA", "\\hookrightarrow", true);
  defineSymbol(math, main, rel, "\u2198", "\\searrow", true);
  defineSymbol(math, main, rel, "\u21BC", "\\leftharpoonup", true);
  defineSymbol(math, main, rel, "\u21C0", "\\rightharpoonup", true);
  defineSymbol(math, main, rel, "\u2199", "\\swarrow", true);
  defineSymbol(math, main, rel, "\u21BD", "\\leftharpoondown", true);
  defineSymbol(math, main, rel, "\u21C1", "\\rightharpoondown", true);
  defineSymbol(math, main, rel, "\u2196", "\\nwarrow", true);
  defineSymbol(math, main, rel, "\u21CC", "\\rightleftharpoons", true);
  defineSymbol(math, ams, rel, "\u226E", "\\nless", true);
  defineSymbol(math, ams, rel, "\uE010", "\\@nleqslant");
  defineSymbol(math, ams, rel, "\uE011", "\\@nleqq");
  defineSymbol(math, ams, rel, "\u2A87", "\\lneq", true);
  defineSymbol(math, ams, rel, "\u2268", "\\lneqq", true);
  defineSymbol(math, ams, rel, "\uE00C", "\\@lvertneqq");
  defineSymbol(math, ams, rel, "\u22E6", "\\lnsim", true);
  defineSymbol(math, ams, rel, "\u2A89", "\\lnapprox", true);
  defineSymbol(math, ams, rel, "\u2280", "\\nprec", true);
  defineSymbol(math, ams, rel, "\u22E0", "\\npreceq", true);
  defineSymbol(math, ams, rel, "\u22E8", "\\precnsim", true);
  defineSymbol(math, ams, rel, "\u2AB9", "\\precnapprox", true);
  defineSymbol(math, ams, rel, "\u2241", "\\nsim", true);
  defineSymbol(math, ams, rel, "\uE006", "\\@nshortmid");
  defineSymbol(math, ams, rel, "\u2224", "\\nmid", true);
  defineSymbol(math, ams, rel, "\u22AC", "\\nvdash", true);
  defineSymbol(math, ams, rel, "\u22AD", "\\nvDash", true);
  defineSymbol(math, ams, rel, "\u22EA", "\\ntriangleleft");
  defineSymbol(math, ams, rel, "\u22EC", "\\ntrianglelefteq", true);
  defineSymbol(math, ams, rel, "\u228A", "\\subsetneq", true);
  defineSymbol(math, ams, rel, "\uE01A", "\\@varsubsetneq");
  defineSymbol(math, ams, rel, "\u2ACB", "\\subsetneqq", true);
  defineSymbol(math, ams, rel, "\uE017", "\\@varsubsetneqq");
  defineSymbol(math, ams, rel, "\u226F", "\\ngtr", true);
  defineSymbol(math, ams, rel, "\uE00F", "\\@ngeqslant");
  defineSymbol(math, ams, rel, "\uE00E", "\\@ngeqq");
  defineSymbol(math, ams, rel, "\u2A88", "\\gneq", true);
  defineSymbol(math, ams, rel, "\u2269", "\\gneqq", true);
  defineSymbol(math, ams, rel, "\uE00D", "\\@gvertneqq");
  defineSymbol(math, ams, rel, "\u22E7", "\\gnsim", true);
  defineSymbol(math, ams, rel, "\u2A8A", "\\gnapprox", true);
  defineSymbol(math, ams, rel, "\u2281", "\\nsucc", true);
  defineSymbol(math, ams, rel, "\u22E1", "\\nsucceq", true);
  defineSymbol(math, ams, rel, "\u22E9", "\\succnsim", true);
  defineSymbol(math, ams, rel, "\u2ABA", "\\succnapprox", true);
  defineSymbol(math, ams, rel, "\u2246", "\\ncong", true);
  defineSymbol(math, ams, rel, "\uE007", "\\@nshortparallel");
  defineSymbol(math, ams, rel, "\u2226", "\\nparallel", true);
  defineSymbol(math, ams, rel, "\u22AF", "\\nVDash", true);
  defineSymbol(math, ams, rel, "\u22EB", "\\ntriangleright");
  defineSymbol(math, ams, rel, "\u22ED", "\\ntrianglerighteq", true);
  defineSymbol(math, ams, rel, "\uE018", "\\@nsupseteqq");
  defineSymbol(math, ams, rel, "\u228B", "\\supsetneq", true);
  defineSymbol(math, ams, rel, "\uE01B", "\\@varsupsetneq");
  defineSymbol(math, ams, rel, "\u2ACC", "\\supsetneqq", true);
  defineSymbol(math, ams, rel, "\uE019", "\\@varsupsetneqq");
  defineSymbol(math, ams, rel, "\u22AE", "\\nVdash", true);
  defineSymbol(math, ams, rel, "\u2AB5", "\\precneqq", true);
  defineSymbol(math, ams, rel, "\u2AB6", "\\succneqq", true);
  defineSymbol(math, ams, rel, "\uE016", "\\@nsubseteqq");
  defineSymbol(math, ams, bin, "\u22B4", "\\unlhd");
  defineSymbol(math, ams, bin, "\u22B5", "\\unrhd");
  defineSymbol(math, ams, rel, "\u219A", "\\nleftarrow", true);
  defineSymbol(math, ams, rel, "\u219B", "\\nrightarrow", true);
  defineSymbol(math, ams, rel, "\u21CD", "\\nLeftarrow", true);
  defineSymbol(math, ams, rel, "\u21CF", "\\nRightarrow", true);
  defineSymbol(math, ams, rel, "\u21AE", "\\nleftrightarrow", true);
  defineSymbol(math, ams, rel, "\u21CE", "\\nLeftrightarrow", true);
  defineSymbol(math, ams, rel, "\u25B3", "\\vartriangle");
  defineSymbol(math, ams, textord, "\u210F", "\\hslash");
  defineSymbol(math, ams, textord, "\u25BD", "\\triangledown");
  defineSymbol(math, ams, textord, "\u25CA", "\\lozenge");
  defineSymbol(math, ams, textord, "\u24C8", "\\circledS");
  defineSymbol(math, ams, textord, "\xAE", "\\circledR");
  defineSymbol(text2, ams, textord, "\xAE", "\\circledR");
  defineSymbol(math, ams, textord, "\u2221", "\\measuredangle", true);
  defineSymbol(math, ams, textord, "\u2204", "\\nexists");
  defineSymbol(math, ams, textord, "\u2127", "\\mho");
  defineSymbol(math, ams, textord, "\u2132", "\\Finv", true);
  defineSymbol(math, ams, textord, "\u2141", "\\Game", true);
  defineSymbol(math, ams, textord, "\u2035", "\\backprime");
  defineSymbol(math, ams, textord, "\u25B2", "\\blacktriangle");
  defineSymbol(math, ams, textord, "\u25BC", "\\blacktriangledown");
  defineSymbol(math, ams, textord, "\u25A0", "\\blacksquare");
  defineSymbol(math, ams, textord, "\u29EB", "\\blacklozenge");
  defineSymbol(math, ams, textord, "\u2605", "\\bigstar");
  defineSymbol(math, ams, textord, "\u2222", "\\sphericalangle", true);
  defineSymbol(math, ams, textord, "\u2201", "\\complement", true);
  defineSymbol(math, ams, textord, "\xF0", "\\eth", true);
  defineSymbol(text2, main, textord, "\xF0", "\xF0");
  defineSymbol(math, ams, textord, "\u2571", "\\diagup");
  defineSymbol(math, ams, textord, "\u2572", "\\diagdown");
  defineSymbol(math, ams, textord, "\u25A1", "\\square");
  defineSymbol(math, ams, textord, "\u25A1", "\\Box");
  defineSymbol(math, ams, textord, "\u25CA", "\\Diamond");
  defineSymbol(math, ams, textord, "\xA5", "\\yen", true);
  defineSymbol(text2, ams, textord, "\xA5", "\\yen", true);
  defineSymbol(math, ams, textord, "\u2713", "\\checkmark", true);
  defineSymbol(text2, ams, textord, "\u2713", "\\checkmark");
  defineSymbol(math, ams, textord, "\u2136", "\\beth", true);
  defineSymbol(math, ams, textord, "\u2138", "\\daleth", true);
  defineSymbol(math, ams, textord, "\u2137", "\\gimel", true);
  defineSymbol(math, ams, textord, "\u03DD", "\\digamma", true);
  defineSymbol(math, ams, textord, "\u03F0", "\\varkappa");
  defineSymbol(math, ams, open, "\u250C", "\\@ulcorner", true);
  defineSymbol(math, ams, close, "\u2510", "\\@urcorner", true);
  defineSymbol(math, ams, open, "\u2514", "\\@llcorner", true);
  defineSymbol(math, ams, close, "\u2518", "\\@lrcorner", true);
  defineSymbol(math, ams, rel, "\u2266", "\\leqq", true);
  defineSymbol(math, ams, rel, "\u2A7D", "\\leqslant", true);
  defineSymbol(math, ams, rel, "\u2A95", "\\eqslantless", true);
  defineSymbol(math, ams, rel, "\u2272", "\\lesssim", true);
  defineSymbol(math, ams, rel, "\u2A85", "\\lessapprox", true);
  defineSymbol(math, ams, rel, "\u224A", "\\approxeq", true);
  defineSymbol(math, ams, bin, "\u22D6", "\\lessdot");
  defineSymbol(math, ams, rel, "\u22D8", "\\lll", true);
  defineSymbol(math, ams, rel, "\u2276", "\\lessgtr", true);
  defineSymbol(math, ams, rel, "\u22DA", "\\lesseqgtr", true);
  defineSymbol(math, ams, rel, "\u2A8B", "\\lesseqqgtr", true);
  defineSymbol(math, ams, rel, "\u2251", "\\doteqdot");
  defineSymbol(math, ams, rel, "\u2253", "\\risingdotseq", true);
  defineSymbol(math, ams, rel, "\u2252", "\\fallingdotseq", true);
  defineSymbol(math, ams, rel, "\u223D", "\\backsim", true);
  defineSymbol(math, ams, rel, "\u22CD", "\\backsimeq", true);
  defineSymbol(math, ams, rel, "\u2AC5", "\\subseteqq", true);
  defineSymbol(math, ams, rel, "\u22D0", "\\Subset", true);
  defineSymbol(math, ams, rel, "\u228F", "\\sqsubset", true);
  defineSymbol(math, ams, rel, "\u227C", "\\preccurlyeq", true);
  defineSymbol(math, ams, rel, "\u22DE", "\\curlyeqprec", true);
  defineSymbol(math, ams, rel, "\u227E", "\\precsim", true);
  defineSymbol(math, ams, rel, "\u2AB7", "\\precapprox", true);
  defineSymbol(math, ams, rel, "\u22B2", "\\vartriangleleft");
  defineSymbol(math, ams, rel, "\u22B4", "\\trianglelefteq");
  defineSymbol(math, ams, rel, "\u22A8", "\\vDash", true);
  defineSymbol(math, ams, rel, "\u22AA", "\\Vvdash", true);
  defineSymbol(math, ams, rel, "\u2323", "\\smallsmile");
  defineSymbol(math, ams, rel, "\u2322", "\\smallfrown");
  defineSymbol(math, ams, rel, "\u224F", "\\bumpeq", true);
  defineSymbol(math, ams, rel, "\u224E", "\\Bumpeq", true);
  defineSymbol(math, ams, rel, "\u2267", "\\geqq", true);
  defineSymbol(math, ams, rel, "\u2A7E", "\\geqslant", true);
  defineSymbol(math, ams, rel, "\u2A96", "\\eqslantgtr", true);
  defineSymbol(math, ams, rel, "\u2273", "\\gtrsim", true);
  defineSymbol(math, ams, rel, "\u2A86", "\\gtrapprox", true);
  defineSymbol(math, ams, bin, "\u22D7", "\\gtrdot");
  defineSymbol(math, ams, rel, "\u22D9", "\\ggg", true);
  defineSymbol(math, ams, rel, "\u2277", "\\gtrless", true);
  defineSymbol(math, ams, rel, "\u22DB", "\\gtreqless", true);
  defineSymbol(math, ams, rel, "\u2A8C", "\\gtreqqless", true);
  defineSymbol(math, ams, rel, "\u2256", "\\eqcirc", true);
  defineSymbol(math, ams, rel, "\u2257", "\\circeq", true);
  defineSymbol(math, ams, rel, "\u225C", "\\triangleq", true);
  defineSymbol(math, ams, rel, "\u223C", "\\thicksim");
  defineSymbol(math, ams, rel, "\u2248", "\\thickapprox");
  defineSymbol(math, ams, rel, "\u2AC6", "\\supseteqq", true);
  defineSymbol(math, ams, rel, "\u22D1", "\\Supset", true);
  defineSymbol(math, ams, rel, "\u2290", "\\sqsupset", true);
  defineSymbol(math, ams, rel, "\u227D", "\\succcurlyeq", true);
  defineSymbol(math, ams, rel, "\u22DF", "\\curlyeqsucc", true);
  defineSymbol(math, ams, rel, "\u227F", "\\succsim", true);
  defineSymbol(math, ams, rel, "\u2AB8", "\\succapprox", true);
  defineSymbol(math, ams, rel, "\u22B3", "\\vartriangleright");
  defineSymbol(math, ams, rel, "\u22B5", "\\trianglerighteq");
  defineSymbol(math, ams, rel, "\u22A9", "\\Vdash", true);
  defineSymbol(math, ams, rel, "\u2223", "\\shortmid");
  defineSymbol(math, ams, rel, "\u2225", "\\shortparallel");
  defineSymbol(math, ams, rel, "\u226C", "\\between", true);
  defineSymbol(math, ams, rel, "\u22D4", "\\pitchfork", true);
  defineSymbol(math, ams, rel, "\u221D", "\\varpropto");
  defineSymbol(math, ams, rel, "\u25C0", "\\blacktriangleleft");
  defineSymbol(math, ams, rel, "\u2234", "\\therefore", true);
  defineSymbol(math, ams, rel, "\u220D", "\\backepsilon");
  defineSymbol(math, ams, rel, "\u25B6", "\\blacktriangleright");
  defineSymbol(math, ams, rel, "\u2235", "\\because", true);
  defineSymbol(math, ams, rel, "\u22D8", "\\llless");
  defineSymbol(math, ams, rel, "\u22D9", "\\gggtr");
  defineSymbol(math, ams, bin, "\u22B2", "\\lhd");
  defineSymbol(math, ams, bin, "\u22B3", "\\rhd");
  defineSymbol(math, ams, rel, "\u2242", "\\eqsim", true);
  defineSymbol(math, main, rel, "\u22C8", "\\Join");
  defineSymbol(math, ams, rel, "\u2251", "\\Doteq", true);
  defineSymbol(math, ams, bin, "\u2214", "\\dotplus", true);
  defineSymbol(math, ams, bin, "\u2216", "\\smallsetminus");
  defineSymbol(math, ams, bin, "\u22D2", "\\Cap", true);
  defineSymbol(math, ams, bin, "\u22D3", "\\Cup", true);
  defineSymbol(math, ams, bin, "\u2A5E", "\\doublebarwedge", true);
  defineSymbol(math, ams, bin, "\u229F", "\\boxminus", true);
  defineSymbol(math, ams, bin, "\u229E", "\\boxplus", true);
  defineSymbol(math, ams, bin, "\u22C7", "\\divideontimes", true);
  defineSymbol(math, ams, bin, "\u22C9", "\\ltimes", true);
  defineSymbol(math, ams, bin, "\u22CA", "\\rtimes", true);
  defineSymbol(math, ams, bin, "\u22CB", "\\leftthreetimes", true);
  defineSymbol(math, ams, bin, "\u22CC", "\\rightthreetimes", true);
  defineSymbol(math, ams, bin, "\u22CF", "\\curlywedge", true);
  defineSymbol(math, ams, bin, "\u22CE", "\\curlyvee", true);
  defineSymbol(math, ams, bin, "\u229D", "\\circleddash", true);
  defineSymbol(math, ams, bin, "\u229B", "\\circledast", true);
  defineSymbol(math, ams, bin, "\u22C5", "\\centerdot");
  defineSymbol(math, ams, bin, "\u22BA", "\\intercal", true);
  defineSymbol(math, ams, bin, "\u22D2", "\\doublecap");
  defineSymbol(math, ams, bin, "\u22D3", "\\doublecup");
  defineSymbol(math, ams, bin, "\u22A0", "\\boxtimes", true);
  defineSymbol(math, ams, rel, "\u21E2", "\\dashrightarrow", true);
  defineSymbol(math, ams, rel, "\u21E0", "\\dashleftarrow", true);
  defineSymbol(math, ams, rel, "\u21C7", "\\leftleftarrows", true);
  defineSymbol(math, ams, rel, "\u21C6", "\\leftrightarrows", true);
  defineSymbol(math, ams, rel, "\u21DA", "\\Lleftarrow", true);
  defineSymbol(math, ams, rel, "\u219E", "\\twoheadleftarrow", true);
  defineSymbol(math, ams, rel, "\u21A2", "\\leftarrowtail", true);
  defineSymbol(math, ams, rel, "\u21AB", "\\looparrowleft", true);
  defineSymbol(math, ams, rel, "\u21CB", "\\leftrightharpoons", true);
  defineSymbol(math, ams, rel, "\u21B6", "\\curvearrowleft", true);
  defineSymbol(math, ams, rel, "\u21BA", "\\circlearrowleft", true);
  defineSymbol(math, ams, rel, "\u21B0", "\\Lsh", true);
  defineSymbol(math, ams, rel, "\u21C8", "\\upuparrows", true);
  defineSymbol(math, ams, rel, "\u21BF", "\\upharpoonleft", true);
  defineSymbol(math, ams, rel, "\u21C3", "\\downharpoonleft", true);
  defineSymbol(math, main, rel, "\u22B6", "\\origof", true);
  defineSymbol(math, main, rel, "\u22B7", "\\imageof", true);
  defineSymbol(math, ams, rel, "\u22B8", "\\multimap", true);
  defineSymbol(math, ams, rel, "\u21AD", "\\leftrightsquigarrow", true);
  defineSymbol(math, ams, rel, "\u21C9", "\\rightrightarrows", true);
  defineSymbol(math, ams, rel, "\u21C4", "\\rightleftarrows", true);
  defineSymbol(math, ams, rel, "\u21A0", "\\twoheadrightarrow", true);
  defineSymbol(math, ams, rel, "\u21A3", "\\rightarrowtail", true);
  defineSymbol(math, ams, rel, "\u21AC", "\\looparrowright", true);
  defineSymbol(math, ams, rel, "\u21B7", "\\curvearrowright", true);
  defineSymbol(math, ams, rel, "\u21BB", "\\circlearrowright", true);
  defineSymbol(math, ams, rel, "\u21B1", "\\Rsh", true);
  defineSymbol(math, ams, rel, "\u21CA", "\\downdownarrows", true);
  defineSymbol(math, ams, rel, "\u21BE", "\\upharpoonright", true);
  defineSymbol(math, ams, rel, "\u21C2", "\\downharpoonright", true);
  defineSymbol(math, ams, rel, "\u21DD", "\\rightsquigarrow", true);
  defineSymbol(math, ams, rel, "\u21DD", "\\leadsto");
  defineSymbol(math, ams, rel, "\u21DB", "\\Rrightarrow", true);
  defineSymbol(math, ams, rel, "\u21BE", "\\restriction");
  defineSymbol(math, main, textord, "\u2018", "`");
  defineSymbol(math, main, textord, "$", "\\$");
  defineSymbol(text2, main, textord, "$", "\\$");
  defineSymbol(text2, main, textord, "$", "\\textdollar");
  defineSymbol(math, main, textord, "%", "\\%");
  defineSymbol(text2, main, textord, "%", "\\%");
  defineSymbol(math, main, textord, "_", "\\_");
  defineSymbol(text2, main, textord, "_", "\\_");
  defineSymbol(text2, main, textord, "_", "\\textunderscore");
  defineSymbol(math, main, textord, "\u2220", "\\angle", true);
  defineSymbol(math, main, textord, "\u221E", "\\infty", true);
  defineSymbol(math, main, textord, "\u2032", "\\prime");
  defineSymbol(math, main, textord, "\u25B3", "\\triangle");
  defineSymbol(math, main, textord, "\u0393", "\\Gamma", true);
  defineSymbol(math, main, textord, "\u0394", "\\Delta", true);
  defineSymbol(math, main, textord, "\u0398", "\\Theta", true);
  defineSymbol(math, main, textord, "\u039B", "\\Lambda", true);
  defineSymbol(math, main, textord, "\u039E", "\\Xi", true);
  defineSymbol(math, main, textord, "\u03A0", "\\Pi", true);
  defineSymbol(math, main, textord, "\u03A3", "\\Sigma", true);
  defineSymbol(math, main, textord, "\u03A5", "\\Upsilon", true);
  defineSymbol(math, main, textord, "\u03A6", "\\Phi", true);
  defineSymbol(math, main, textord, "\u03A8", "\\Psi", true);
  defineSymbol(math, main, textord, "\u03A9", "\\Omega", true);
  defineSymbol(math, main, textord, "A", "\u0391");
  defineSymbol(math, main, textord, "B", "\u0392");
  defineSymbol(math, main, textord, "E", "\u0395");
  defineSymbol(math, main, textord, "Z", "\u0396");
  defineSymbol(math, main, textord, "H", "\u0397");
  defineSymbol(math, main, textord, "I", "\u0399");
  defineSymbol(math, main, textord, "K", "\u039A");
  defineSymbol(math, main, textord, "M", "\u039C");
  defineSymbol(math, main, textord, "N", "\u039D");
  defineSymbol(math, main, textord, "O", "\u039F");
  defineSymbol(math, main, textord, "P", "\u03A1");
  defineSymbol(math, main, textord, "T", "\u03A4");
  defineSymbol(math, main, textord, "X", "\u03A7");
  defineSymbol(math, main, textord, "\xAC", "\\neg", true);
  defineSymbol(math, main, textord, "\xAC", "\\lnot");
  defineSymbol(math, main, textord, "\u22A4", "\\top");
  defineSymbol(math, main, textord, "\u22A5", "\\bot");
  defineSymbol(math, main, textord, "\u2205", "\\emptyset");
  defineSymbol(math, ams, textord, "\u2205", "\\varnothing");
  defineSymbol(math, main, mathord, "\u03B1", "\\alpha", true);
  defineSymbol(math, main, mathord, "\u03B2", "\\beta", true);
  defineSymbol(math, main, mathord, "\u03B3", "\\gamma", true);
  defineSymbol(math, main, mathord, "\u03B4", "\\delta", true);
  defineSymbol(math, main, mathord, "\u03F5", "\\epsilon", true);
  defineSymbol(math, main, mathord, "\u03B6", "\\zeta", true);
  defineSymbol(math, main, mathord, "\u03B7", "\\eta", true);
  defineSymbol(math, main, mathord, "\u03B8", "\\theta", true);
  defineSymbol(math, main, mathord, "\u03B9", "\\iota", true);
  defineSymbol(math, main, mathord, "\u03BA", "\\kappa", true);
  defineSymbol(math, main, mathord, "\u03BB", "\\lambda", true);
  defineSymbol(math, main, mathord, "\u03BC", "\\mu", true);
  defineSymbol(math, main, mathord, "\u03BD", "\\nu", true);
  defineSymbol(math, main, mathord, "\u03BE", "\\xi", true);
  defineSymbol(math, main, mathord, "\u03BF", "\\omicron", true);
  defineSymbol(math, main, mathord, "\u03C0", "\\pi", true);
  defineSymbol(math, main, mathord, "\u03C1", "\\rho", true);
  defineSymbol(math, main, mathord, "\u03C3", "\\sigma", true);
  defineSymbol(math, main, mathord, "\u03C4", "\\tau", true);
  defineSymbol(math, main, mathord, "\u03C5", "\\upsilon", true);
  defineSymbol(math, main, mathord, "\u03D5", "\\phi", true);
  defineSymbol(math, main, mathord, "\u03C7", "\\chi", true);
  defineSymbol(math, main, mathord, "\u03C8", "\\psi", true);
  defineSymbol(math, main, mathord, "\u03C9", "\\omega", true);
  defineSymbol(math, main, mathord, "\u03B5", "\\varepsilon", true);
  defineSymbol(math, main, mathord, "\u03D1", "\\vartheta", true);
  defineSymbol(math, main, mathord, "\u03D6", "\\varpi", true);
  defineSymbol(math, main, mathord, "\u03F1", "\\varrho", true);
  defineSymbol(math, main, mathord, "\u03C2", "\\varsigma", true);
  defineSymbol(math, main, mathord, "\u03C6", "\\varphi", true);
  defineSymbol(math, main, bin, "\u2217", "*", true);
  defineSymbol(math, main, bin, "+", "+");
  defineSymbol(math, main, bin, "\u2212", "-", true);
  defineSymbol(math, main, bin, "\u22C5", "\\cdot", true);
  defineSymbol(math, main, bin, "\u2218", "\\circ", true);
  defineSymbol(math, main, bin, "\xF7", "\\div", true);
  defineSymbol(math, main, bin, "\xB1", "\\pm", true);
  defineSymbol(math, main, bin, "\xD7", "\\times", true);
  defineSymbol(math, main, bin, "\u2229", "\\cap", true);
  defineSymbol(math, main, bin, "\u222A", "\\cup", true);
  defineSymbol(math, main, bin, "\u2216", "\\setminus", true);
  defineSymbol(math, main, bin, "\u2227", "\\land");
  defineSymbol(math, main, bin, "\u2228", "\\lor");
  defineSymbol(math, main, bin, "\u2227", "\\wedge", true);
  defineSymbol(math, main, bin, "\u2228", "\\vee", true);
  defineSymbol(math, main, textord, "\u221A", "\\surd");
  defineSymbol(math, main, open, "\u27E8", "\\langle", true);
  defineSymbol(math, main, open, "\u2223", "\\lvert");
  defineSymbol(math, main, open, "\u2225", "\\lVert");
  defineSymbol(math, main, close, "?", "?");
  defineSymbol(math, main, close, "!", "!");
  defineSymbol(math, main, close, "\u27E9", "\\rangle", true);
  defineSymbol(math, main, close, "\u2223", "\\rvert");
  defineSymbol(math, main, close, "\u2225", "\\rVert");
  defineSymbol(math, main, rel, "=", "=");
  defineSymbol(math, main, rel, ":", ":");
  defineSymbol(math, main, rel, "\u2248", "\\approx", true);
  defineSymbol(math, main, rel, "\u2245", "\\cong", true);
  defineSymbol(math, main, rel, "\u2265", "\\ge");
  defineSymbol(math, main, rel, "\u2265", "\\geq", true);
  defineSymbol(math, main, rel, "\u2190", "\\gets");
  defineSymbol(math, main, rel, ">", "\\gt", true);
  defineSymbol(math, main, rel, "\u2208", "\\in", true);
  defineSymbol(math, main, rel, "\uE020", "\\@not");
  defineSymbol(math, main, rel, "\u2282", "\\subset", true);
  defineSymbol(math, main, rel, "\u2283", "\\supset", true);
  defineSymbol(math, main, rel, "\u2286", "\\subseteq", true);
  defineSymbol(math, main, rel, "\u2287", "\\supseteq", true);
  defineSymbol(math, ams, rel, "\u2288", "\\nsubseteq", true);
  defineSymbol(math, ams, rel, "\u2289", "\\nsupseteq", true);
  defineSymbol(math, main, rel, "\u22A8", "\\models");
  defineSymbol(math, main, rel, "\u2190", "\\leftarrow", true);
  defineSymbol(math, main, rel, "\u2264", "\\le");
  defineSymbol(math, main, rel, "\u2264", "\\leq", true);
  defineSymbol(math, main, rel, "<", "\\lt", true);
  defineSymbol(math, main, rel, "\u2192", "\\rightarrow", true);
  defineSymbol(math, main, rel, "\u2192", "\\to");
  defineSymbol(math, ams, rel, "\u2271", "\\ngeq", true);
  defineSymbol(math, ams, rel, "\u2270", "\\nleq", true);
  defineSymbol(math, main, spacing, "\xA0", "\\ ");
  defineSymbol(math, main, spacing, "\xA0", "\\space");
  defineSymbol(math, main, spacing, "\xA0", "\\nobreakspace");
  defineSymbol(text2, main, spacing, "\xA0", "\\ ");
  defineSymbol(text2, main, spacing, "\xA0", " ");
  defineSymbol(text2, main, spacing, "\xA0", "\\space");
  defineSymbol(text2, main, spacing, "\xA0", "\\nobreakspace");
  defineSymbol(math, main, spacing, "", "\\nobreak");
  defineSymbol(math, main, spacing, "", "\\allowbreak");
  defineSymbol(math, main, punct, ",", ",");
  defineSymbol(math, main, punct, ";", ";");
  defineSymbol(math, ams, bin, "\u22BC", "\\barwedge", true);
  defineSymbol(math, ams, bin, "\u22BB", "\\veebar", true);
  defineSymbol(math, main, bin, "\u2299", "\\odot", true);
  defineSymbol(math, main, bin, "\u2295", "\\oplus", true);
  defineSymbol(math, main, bin, "\u2297", "\\otimes", true);
  defineSymbol(math, main, textord, "\u2202", "\\partial", true);
  defineSymbol(math, main, bin, "\u2298", "\\oslash", true);
  defineSymbol(math, ams, bin, "\u229A", "\\circledcirc", true);
  defineSymbol(math, ams, bin, "\u22A1", "\\boxdot", true);
  defineSymbol(math, main, bin, "\u25B3", "\\bigtriangleup");
  defineSymbol(math, main, bin, "\u25BD", "\\bigtriangledown");
  defineSymbol(math, main, bin, "\u2020", "\\dagger");
  defineSymbol(math, main, bin, "\u22C4", "\\diamond");
  defineSymbol(math, main, bin, "\u22C6", "\\star");
  defineSymbol(math, main, bin, "\u25C3", "\\triangleleft");
  defineSymbol(math, main, bin, "\u25B9", "\\triangleright");
  defineSymbol(math, main, open, "{", "\\{");
  defineSymbol(text2, main, textord, "{", "\\{");
  defineSymbol(text2, main, textord, "{", "\\textbraceleft");
  defineSymbol(math, main, close, "}", "\\}");
  defineSymbol(text2, main, textord, "}", "\\}");
  defineSymbol(text2, main, textord, "}", "\\textbraceright");
  defineSymbol(math, main, open, "{", "\\lbrace");
  defineSymbol(math, main, close, "}", "\\rbrace");
  defineSymbol(math, main, open, "[", "\\lbrack", true);
  defineSymbol(text2, main, textord, "[", "\\lbrack", true);
  defineSymbol(math, main, close, "]", "\\rbrack", true);
  defineSymbol(text2, main, textord, "]", "\\rbrack", true);
  defineSymbol(math, main, open, "(", "\\lparen", true);
  defineSymbol(math, main, close, ")", "\\rparen", true);
  defineSymbol(text2, main, textord, "<", "\\textless", true);
  defineSymbol(text2, main, textord, ">", "\\textgreater", true);
  defineSymbol(math, main, open, "\u230A", "\\lfloor", true);
  defineSymbol(math, main, close, "\u230B", "\\rfloor", true);
  defineSymbol(math, main, open, "\u2308", "\\lceil", true);
  defineSymbol(math, main, close, "\u2309", "\\rceil", true);
  defineSymbol(math, main, textord, "\\", "\\backslash");
  defineSymbol(math, main, textord, "\u2223", "|");
  defineSymbol(math, main, textord, "\u2223", "\\vert");
  defineSymbol(text2, main, textord, "|", "\\textbar", true);
  defineSymbol(math, main, textord, "\u2225", "\\|");
  defineSymbol(math, main, textord, "\u2225", "\\Vert");
  defineSymbol(text2, main, textord, "\u2225", "\\textbardbl");
  defineSymbol(text2, main, textord, "~", "\\textasciitilde");
  defineSymbol(text2, main, textord, "\\", "\\textbackslash");
  defineSymbol(text2, main, textord, "^", "\\textasciicircum");
  defineSymbol(math, main, rel, "\u2191", "\\uparrow", true);
  defineSymbol(math, main, rel, "\u21D1", "\\Uparrow", true);
  defineSymbol(math, main, rel, "\u2193", "\\downarrow", true);
  defineSymbol(math, main, rel, "\u21D3", "\\Downarrow", true);
  defineSymbol(math, main, rel, "\u2195", "\\updownarrow", true);
  defineSymbol(math, main, rel, "\u21D5", "\\Updownarrow", true);
  defineSymbol(math, main, op, "\u2210", "\\coprod");
  defineSymbol(math, main, op, "\u22C1", "\\bigvee");
  defineSymbol(math, main, op, "\u22C0", "\\bigwedge");
  defineSymbol(math, main, op, "\u2A04", "\\biguplus");
  defineSymbol(math, main, op, "\u22C2", "\\bigcap");
  defineSymbol(math, main, op, "\u22C3", "\\bigcup");
  defineSymbol(math, main, op, "\u222B", "\\int");
  defineSymbol(math, main, op, "\u222B", "\\intop");
  defineSymbol(math, main, op, "\u222C", "\\iint");
  defineSymbol(math, main, op, "\u222D", "\\iiint");
  defineSymbol(math, main, op, "\u220F", "\\prod");
  defineSymbol(math, main, op, "\u2211", "\\sum");
  defineSymbol(math, main, op, "\u2A02", "\\bigotimes");
  defineSymbol(math, main, op, "\u2A01", "\\bigoplus");
  defineSymbol(math, main, op, "\u2A00", "\\bigodot");
  defineSymbol(math, main, op, "\u222E", "\\oint");
  defineSymbol(math, main, op, "\u222F", "\\oiint");
  defineSymbol(math, main, op, "\u2230", "\\oiiint");
  defineSymbol(math, main, op, "\u2A06", "\\bigsqcup");
  defineSymbol(math, main, op, "\u222B", "\\smallint");
  defineSymbol(text2, main, inner, "\u2026", "\\textellipsis");
  defineSymbol(math, main, inner, "\u2026", "\\mathellipsis");
  defineSymbol(text2, main, inner, "\u2026", "\\ldots", true);
  defineSymbol(math, main, inner, "\u2026", "\\ldots", true);
  defineSymbol(math, main, inner, "\u22EF", "\\@cdots", true);
  defineSymbol(math, main, inner, "\u22F1", "\\ddots", true);
  defineSymbol(math, main, textord, "\u22EE", "\\varvdots");
  defineSymbol(text2, main, textord, "\u22EE", "\\varvdots");
  defineSymbol(math, main, accent, "\u02CA", "\\acute");
  defineSymbol(math, main, accent, "\u02CB", "\\grave");
  defineSymbol(math, main, accent, "\xA8", "\\ddot");
  defineSymbol(math, main, accent, "~", "\\tilde");
  defineSymbol(math, main, accent, "\u02C9", "\\bar");
  defineSymbol(math, main, accent, "\u02D8", "\\breve");
  defineSymbol(math, main, accent, "\u02C7", "\\check");
  defineSymbol(math, main, accent, "^", "\\hat");
  defineSymbol(math, main, accent, "\u20D7", "\\vec");
  defineSymbol(math, main, accent, "\u02D9", "\\dot");
  defineSymbol(math, main, accent, "\u02DA", "\\mathring");
  defineSymbol(math, main, mathord, "\uE131", "\\@imath");
  defineSymbol(math, main, mathord, "\uE237", "\\@jmath");
  defineSymbol(math, main, textord, "\u0131", "\u0131");
  defineSymbol(math, main, textord, "\u0237", "\u0237");
  defineSymbol(text2, main, textord, "\u0131", "\\i", true);
  defineSymbol(text2, main, textord, "\u0237", "\\j", true);
  defineSymbol(text2, main, textord, "\xDF", "\\ss", true);
  defineSymbol(text2, main, textord, "\xE6", "\\ae", true);
  defineSymbol(text2, main, textord, "\u0153", "\\oe", true);
  defineSymbol(text2, main, textord, "\xF8", "\\o", true);
  defineSymbol(text2, main, textord, "\xC6", "\\AE", true);
  defineSymbol(text2, main, textord, "\u0152", "\\OE", true);
  defineSymbol(text2, main, textord, "\xD8", "\\O", true);
  defineSymbol(text2, main, accent, "\u02CA", "\\'");
  defineSymbol(text2, main, accent, "\u02CB", "\\`");
  defineSymbol(text2, main, accent, "\u02C6", "\\^");
  defineSymbol(text2, main, accent, "\u02DC", "\\~");
  defineSymbol(text2, main, accent, "\u02C9", "\\=");
  defineSymbol(text2, main, accent, "\u02D8", "\\u");
  defineSymbol(text2, main, accent, "\u02D9", "\\.");
  defineSymbol(text2, main, accent, "\xB8", "\\c");
  defineSymbol(text2, main, accent, "\u02DA", "\\r");
  defineSymbol(text2, main, accent, "\u02C7", "\\v");
  defineSymbol(text2, main, accent, "\xA8", '\\"');
  defineSymbol(text2, main, accent, "\u02DD", "\\H");
  defineSymbol(text2, main, accent, "\u25EF", "\\textcircled");
  var ligatures = {
    "--": true,
    "---": true,
    "``": true,
    "''": true
  };
  defineSymbol(text2, main, textord, "\u2013", "--", true);
  defineSymbol(text2, main, textord, "\u2013", "\\textendash");
  defineSymbol(text2, main, textord, "\u2014", "---", true);
  defineSymbol(text2, main, textord, "\u2014", "\\textemdash");
  defineSymbol(text2, main, textord, "\u2018", "`", true);
  defineSymbol(text2, main, textord, "\u2018", "\\textquoteleft");
  defineSymbol(text2, main, textord, "\u2019", "'", true);
  defineSymbol(text2, main, textord, "\u2019", "\\textquoteright");
  defineSymbol(text2, main, textord, "\u201C", "``", true);
  defineSymbol(text2, main, textord, "\u201C", "\\textquotedblleft");
  defineSymbol(text2, main, textord, "\u201D", "''", true);
  defineSymbol(text2, main, textord, "\u201D", "\\textquotedblright");
  defineSymbol(math, main, textord, "\xB0", "\\degree", true);
  defineSymbol(text2, main, textord, "\xB0", "\\degree");
  defineSymbol(text2, main, textord, "\xB0", "\\textdegree", true);
  defineSymbol(math, main, textord, "\xA3", "\\pounds");
  defineSymbol(math, main, textord, "\xA3", "\\mathsterling", true);
  defineSymbol(text2, main, textord, "\xA3", "\\pounds");
  defineSymbol(text2, main, textord, "\xA3", "\\textsterling", true);
  defineSymbol(math, ams, textord, "\u2720", "\\maltese");
  defineSymbol(text2, ams, textord, "\u2720", "\\maltese");
  var mathTextSymbols = '0123456789/@."';
  for (i = 0; i < mathTextSymbols.length; i++) {
    ch = mathTextSymbols.charAt(i);
    defineSymbol(math, main, textord, ch, ch);
  }
  var ch;
  var i;
  var textSymbols = '0123456789!@*()-=+";:?/.,';
  for (_i = 0; _i < textSymbols.length; _i++) {
    _ch = textSymbols.charAt(_i);
    defineSymbol(text2, main, textord, _ch, _ch);
  }
  var _ch;
  var _i;
  var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (_i2 = 0; _i2 < letters.length; _i2++) {
    _ch2 = letters.charAt(_i2);
    defineSymbol(math, main, mathord, _ch2, _ch2);
    defineSymbol(text2, main, textord, _ch2, _ch2);
  }
  var _ch2;
  var _i2;
  defineSymbol(math, ams, textord, "C", "\u2102");
  defineSymbol(text2, ams, textord, "C", "\u2102");
  defineSymbol(math, ams, textord, "H", "\u210D");
  defineSymbol(text2, ams, textord, "H", "\u210D");
  defineSymbol(math, ams, textord, "N", "\u2115");
  defineSymbol(text2, ams, textord, "N", "\u2115");
  defineSymbol(math, ams, textord, "P", "\u2119");
  defineSymbol(text2, ams, textord, "P", "\u2119");
  defineSymbol(math, ams, textord, "Q", "\u211A");
  defineSymbol(text2, ams, textord, "Q", "\u211A");
  defineSymbol(math, ams, textord, "R", "\u211D");
  defineSymbol(text2, ams, textord, "R", "\u211D");
  defineSymbol(math, ams, textord, "Z", "\u2124");
  defineSymbol(text2, ams, textord, "Z", "\u2124");
  defineSymbol(math, main, mathord, "h", "\u210E");
  defineSymbol(text2, main, mathord, "h", "\u210E");
  var wideChar;
  for (_i3 = 0; _i3 < letters.length; _i3++) {
    _ch3 = letters.charAt(_i3);
    wideChar = String.fromCharCode(55349, 56320 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56372 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56424 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56580 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56684 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56736 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56788 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56840 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56944 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text2, main, textord, _ch3, wideChar);
    if (_i3 < 26) {
      wideChar = String.fromCharCode(55349, 56632 + _i3);
      defineSymbol(math, main, mathord, _ch3, wideChar);
      defineSymbol(text2, main, textord, _ch3, wideChar);
      wideChar = String.fromCharCode(55349, 56476 + _i3);
      defineSymbol(math, main, mathord, _ch3, wideChar);
      defineSymbol(text2, main, textord, _ch3, wideChar);
    }
  }
  var _ch3;
  var _i3;
  wideChar = String.fromCharCode(55349, 56668);
  defineSymbol(math, main, mathord, "k", wideChar);
  defineSymbol(text2, main, textord, "k", wideChar);
  for (_i4 = 0; _i4 < 10; _i4++) {
    _ch4 = _i4.toString();
    wideChar = String.fromCharCode(55349, 57294 + _i4);
    defineSymbol(math, main, mathord, _ch4, wideChar);
    defineSymbol(text2, main, textord, _ch4, wideChar);
    wideChar = String.fromCharCode(55349, 57314 + _i4);
    defineSymbol(math, main, mathord, _ch4, wideChar);
    defineSymbol(text2, main, textord, _ch4, wideChar);
    wideChar = String.fromCharCode(55349, 57324 + _i4);
    defineSymbol(math, main, mathord, _ch4, wideChar);
    defineSymbol(text2, main, textord, _ch4, wideChar);
    wideChar = String.fromCharCode(55349, 57334 + _i4);
    defineSymbol(math, main, mathord, _ch4, wideChar);
    defineSymbol(text2, main, textord, _ch4, wideChar);
  }
  var _ch4;
  var _i4;
  var extraLatin = "\xD0\xDE\xFE";
  for (_i5 = 0; _i5 < extraLatin.length; _i5++) {
    _ch5 = extraLatin.charAt(_i5);
    defineSymbol(math, main, mathord, _ch5, _ch5);
    defineSymbol(text2, main, textord, _ch5, _ch5);
  }
  var _ch5;
  var _i5;
  var boldUpright = {
    mathClass: "mathbf",
    textClass: "textbf",
    font: "Main-Bold"
  };
  var italic = {
    mathClass: "mathnormal",
    textClass: "textit",
    font: "Math-Italic"
  };
  var boldItalic = {
    mathClass: "boldsymbol",
    textClass: "boldsymbol",
    font: "Main-BoldItalic"
  };
  var script = {
    mathClass: "mathscr",
    textClass: "textscr",
    font: "Script-Regular"
  };
  var noFont = {
    mathClass: "",
    textClass: "",
    font: ""
  };
  var fraktur = {
    mathClass: "mathfrak",
    textClass: "textfrak",
    font: "Fraktur-Regular"
  };
  var doubleStruck = {
    mathClass: "mathbb",
    textClass: "textbb",
    font: "AMS-Regular"
  };
  var boldFraktur = {
    mathClass: "mathboldfrak",
    textClass: "textboldfrak",
    font: "Fraktur-Regular"
  };
  var sansSerif = {
    mathClass: "mathsf",
    textClass: "textsf",
    font: "SansSerif-Regular"
  };
  var boldSansSerif = {
    mathClass: "mathboldsf",
    textClass: "textboldsf",
    font: "SansSerif-Bold"
  };
  var italicSansSerif = {
    mathClass: "mathitsf",
    textClass: "textitsf",
    font: "SansSerif-Italic"
  };
  var monospace = {
    mathClass: "mathtt",
    textClass: "texttt",
    font: "Typewriter-Regular"
  };
  var wideLatinLetterData = [
    boldUpright,
    boldUpright,
    // A-Z, a-z
    italic,
    italic,
    // A-Z, a-z
    boldItalic,
    boldItalic,
    // A-Z, a-z
    // Map fancy A-Z letters to script, not calligraphic.
    // This aligns with unicode-math and math fonts (except Cambria Math).
    script,
    noFont,
    // A-Z script, a-z — no font
    noFont,
    noFont,
    // A-Z bold script, a-z bold script — no font
    fraktur,
    fraktur,
    // A-Z, a-z
    doubleStruck,
    doubleStruck,
    // A-Z double-struck, k double-struck
    // Note that we are using a bold font, but font metrics for regular Fraktur.
    boldFraktur,
    boldFraktur,
    // A-Z, a-z
    sansSerif,
    sansSerif,
    // A-Z, a-z
    boldSansSerif,
    boldSansSerif,
    // A-Z, a-z
    italicSansSerif,
    italicSansSerif,
    // A-Z, a-z
    noFont,
    noFont,
    // A-Z bold italic sans, a-z bold italic sans - no font
    monospace,
    monospace
    // A-Z, a-z
  ];
  var wideNumeralData = [
    boldUpright,
    // 0-9
    noFont,
    // 0-9 double-struck. No KaTeX font.
    sansSerif,
    // 0-9
    boldSansSerif,
    // 0-9
    monospace
    // 0-9
  ];
  var wideCharacterFont = /* @__PURE__ */ __name((wideChar2) => {
    var H = wideChar2.charCodeAt(0);
    var L = wideChar2.charCodeAt(1);
    var codePoint = (H - 55296) * 1024 + (L - 56320) + 65536;
    if (119808 <= codePoint && codePoint < 120484) {
      var i = Math.floor((codePoint - 119808) / 26);
      return wideLatinLetterData[i];
    } else if (120782 <= codePoint && codePoint <= 120831) {
      var _i = Math.floor((codePoint - 120782) / 10);
      return wideNumeralData[_i];
    } else if (codePoint === 120485 || codePoint === 120486) {
      return wideLatinLetterData[0];
    } else if (120486 < codePoint && codePoint < 120782) {
      return noFont;
    } else {
      throw new ParseError("Unsupported character: " + wideChar2);
    }
  }, "wideCharacterFont");
  var lookupSymbol = /* @__PURE__ */ __name(function lookupSymbol2(value, fontName, mode) {
    if (symbols[mode][value]) {
      var replacement = symbols[mode][value].replace;
      if (replacement) {
        value = replacement;
      }
    }
    return {
      value,
      metrics: getCharacterMetrics(value, fontName, mode)
    };
  }, "lookupSymbol");
  var makeSymbol = /* @__PURE__ */ __name(function makeSymbol2(value, fontName, mode, options, classes) {
    var lookup = lookupSymbol(value, fontName, mode);
    var metrics = lookup.metrics;
    value = lookup.value;
    var symbolNode;
    if (metrics) {
      var italic2 = metrics.italic;
      if (mode === "text" || options && options.font === "mathit") {
        italic2 = 0;
      }
      symbolNode = new SymbolNode(value, metrics.height, metrics.depth, italic2, metrics.skew, metrics.width, classes);
    } else {
      typeof console !== "undefined" && console.warn("No character metrics " + ("for '" + value + "' in style '" + fontName + "' and mode '" + mode + "'"));
      symbolNode = new SymbolNode(value, 0, 0, 0, 0, 0, classes);
    }
    if (options) {
      symbolNode.maxFontSize = options.sizeMultiplier;
      if (options.style.isTight()) {
        symbolNode.classes.push("mtight");
      }
      var color = options.getColor();
      if (color) {
        symbolNode.style.color = color;
      }
    }
    return symbolNode;
  }, "makeSymbol");
  var mathsym = /* @__PURE__ */ __name(function mathsym2(value, mode, options, classes) {
    if (classes === void 0) {
      classes = [];
    }
    if (options.font === "boldsymbol" && lookupSymbol(value, "Main-Bold", mode).metrics) {
      return makeSymbol(value, "Main-Bold", mode, options, classes.concat(["mathbf"]));
    } else if (value === "\\" || symbols[mode][value].font === "main") {
      return makeSymbol(value, "Main-Regular", mode, options, classes);
    } else {
      return makeSymbol(value, "AMS-Regular", mode, options, classes.concat(["amsrm"]));
    }
  }, "mathsym");
  var boldSymbol = /* @__PURE__ */ __name(function boldSymbol2(value, mode, type) {
    if (type !== "textord" && lookupSymbol(value, "Math-BoldItalic", mode).metrics) {
      return {
        fontName: "Math-BoldItalic",
        fontClass: "boldsymbol"
      };
    } else {
      return {
        fontName: "Main-Bold",
        fontClass: "mathbf"
      };
    }
  }, "boldSymbol");
  var makeOrd = /* @__PURE__ */ __name(function makeOrd2(group, options, type) {
    var mode = group.mode;
    var text3 = group.text;
    var classes = ["mord"];
    var {
      font,
      fontFamily,
      fontWeight,
      fontShape
    } = options;
    var useFont = mode === "math" || mode === "text" && !!font;
    var fontOrFamily = useFont ? font : fontFamily;
    var wideFontName = "";
    var wideFontClass = "";
    if (text3.charCodeAt(0) === 55349) {
      var wideCharData = wideCharacterFont(text3);
      wideFontName = wideCharData.font;
      wideFontClass = wideCharData[mode + "Class"];
    }
    if (wideFontName) {
      return makeSymbol(text3, wideFontName, mode, options, classes.concat(wideFontClass));
    } else if (fontOrFamily) {
      var fontName;
      var fontClasses;
      if (fontOrFamily === "boldsymbol") {
        var fontData = boldSymbol(text3, mode, type);
        fontName = fontData.fontName;
        fontClasses = [fontData.fontClass];
      } else if (useFont) {
        fontName = fontMap[font].fontName;
        fontClasses = [font];
      } else {
        fontName = retrieveTextFontName(fontFamily, fontWeight, fontShape);
        fontClasses = [fontFamily, fontWeight, fontShape];
      }
      if (lookupSymbol(text3, fontName, mode).metrics) {
        return makeSymbol(text3, fontName, mode, options, classes.concat(fontClasses));
      } else if (ligatures.hasOwnProperty(text3) && fontName.slice(0, 10) === "Typewriter") {
        var parts = [];
        for (var i = 0; i < text3.length; i++) {
          parts.push(makeSymbol(text3[i], fontName, mode, options, classes.concat(fontClasses)));
        }
        return makeFragment(parts);
      }
    }
    if (type === "mathord") {
      return makeSymbol(text3, "Math-Italic", mode, options, classes.concat(["mathnormal"]));
    } else if (type === "textord") {
      var _font = symbols[mode][text3] && symbols[mode][text3].font;
      if (_font === "ams") {
        var _fontName = retrieveTextFontName("amsrm", fontWeight, fontShape);
        return makeSymbol(text3, _fontName, mode, options, classes.concat("amsrm", fontWeight, fontShape));
      } else if (_font === "main" || !_font) {
        var _fontName2 = retrieveTextFontName("textrm", fontWeight, fontShape);
        return makeSymbol(text3, _fontName2, mode, options, classes.concat(fontWeight, fontShape));
      } else {
        var _fontName3 = retrieveTextFontName(_font, fontWeight, fontShape);
        return makeSymbol(text3, _fontName3, mode, options, classes.concat(_fontName3, fontWeight, fontShape));
      }
    } else {
      throw new Error("unexpected type: " + type + " in makeOrd");
    }
  }, "makeOrd");
  var canCombine = /* @__PURE__ */ __name((prev, next) => {
    if (createClass(prev.classes) !== createClass(next.classes) || prev.skew !== next.skew || prev.maxFontSize !== next.maxFontSize || prev.italic !== 0 && prev.hasClass("mathnormal")) {
      return false;
    }
    if (prev.classes.length === 1) {
      var cls = prev.classes[0];
      if (cls === "mbin" || cls === "mord") {
        return false;
      }
    }
    for (var key of Object.keys(prev.style)) {
      if (prev.style[key] !== next.style[key]) {
        return false;
      }
    }
    for (var _key of Object.keys(next.style)) {
      if (prev.style[_key] !== next.style[_key]) {
        return false;
      }
    }
    return true;
  }, "canCombine");
  var tryCombineChars = /* @__PURE__ */ __name((chars) => {
    for (var i = 0; i < chars.length - 1; i++) {
      var prev = chars[i];
      var next = chars[i + 1];
      if (prev instanceof SymbolNode && next instanceof SymbolNode && canCombine(prev, next)) {
        prev.text += next.text;
        prev.height = Math.max(prev.height, next.height);
        prev.depth = Math.max(prev.depth, next.depth);
        prev.italic = next.italic;
        chars.splice(i + 1, 1);
        i--;
      }
    }
    return chars;
  }, "tryCombineChars");
  var sizeElementFromChildren = /* @__PURE__ */ __name(function sizeElementFromChildren2(elem) {
    var height = 0;
    var depth = 0;
    var maxFontSize = 0;
    for (var i = 0; i < elem.children.length; i++) {
      var child = elem.children[i];
      if (child.height > height) {
        height = child.height;
      }
      if (child.depth > depth) {
        depth = child.depth;
      }
      if (child.maxFontSize > maxFontSize) {
        maxFontSize = child.maxFontSize;
      }
    }
    elem.height = height;
    elem.depth = depth;
    elem.maxFontSize = maxFontSize;
  }, "sizeElementFromChildren");
  var makeSpan = /* @__PURE__ */ __name(function makeSpan2(classes, children, options, style2) {
    var span = new Span(classes, children, options, style2);
    sizeElementFromChildren(span);
    return span;
  }, "makeSpan");
  var makeSvgSpan = /* @__PURE__ */ __name((classes, children, options, style2) => new Span(classes, children, options, style2), "makeSvgSpan");
  var makeLineSpan = /* @__PURE__ */ __name(function makeLineSpan2(className, options, thickness) {
    var line = makeSpan([className], [], options);
    line.height = Math.max(thickness || options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
    line.style.borderBottomWidth = makeEm(line.height);
    line.maxFontSize = 1;
    return line;
  }, "makeLineSpan");
  var makeAnchor = /* @__PURE__ */ __name(function makeAnchor2(href, classes, children, options) {
    var anchor = new Anchor(href, classes, children, options);
    sizeElementFromChildren(anchor);
    return anchor;
  }, "makeAnchor");
  var makeFragment = /* @__PURE__ */ __name(function makeFragment2(children) {
    var fragment = new DocumentFragment(children);
    sizeElementFromChildren(fragment);
    return fragment;
  }, "makeFragment");
  var wrapFragment = /* @__PURE__ */ __name(function wrapFragment2(group, options) {
    if (group instanceof DocumentFragment) {
      return makeSpan([], [group], options);
    }
    return group;
  }, "wrapFragment");
  var getVListChildrenAndDepth = /* @__PURE__ */ __name(function getVListChildrenAndDepth2(params) {
    if (params.positionType === "individualShift") {
      var oldChildren = params.children;
      var children = [oldChildren[0]];
      var _depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
      var currPos = _depth;
      for (var i = 1; i < oldChildren.length; i++) {
        var diff = -oldChildren[i].shift - currPos - oldChildren[i].elem.depth;
        var size = diff - (oldChildren[i - 1].elem.height + oldChildren[i - 1].elem.depth);
        currPos = currPos + diff;
        children.push({
          type: "kern",
          size
        });
        children.push(oldChildren[i]);
      }
      return {
        children,
        depth: _depth
      };
    }
    var depth;
    if (params.positionType === "top") {
      var bottom = params.positionData;
      for (var _i = 0; _i < params.children.length; _i++) {
        var child = params.children[_i];
        bottom -= child.type === "kern" ? child.size : child.elem.height + child.elem.depth;
      }
      depth = bottom;
    } else if (params.positionType === "bottom") {
      depth = -params.positionData;
    } else {
      var firstChild = params.children[0];
      if (firstChild.type !== "elem") {
        throw new Error('First child must have type "elem".');
      }
      if (params.positionType === "shift") {
        depth = -firstChild.elem.depth - params.positionData;
      } else if (params.positionType === "firstBaseline") {
        depth = -firstChild.elem.depth;
      } else {
        throw new Error("Invalid positionType " + params.positionType + ".");
      }
    }
    return {
      children: params.children,
      depth
    };
  }, "getVListChildrenAndDepth");
  var makeVList = /* @__PURE__ */ __name(function makeVList2(params, options) {
    var {
      children,
      depth
    } = getVListChildrenAndDepth(params);
    var pstrutSize = 0;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.type === "elem") {
        var elem = child.elem;
        pstrutSize = Math.max(pstrutSize, elem.maxFontSize, elem.height);
      }
    }
    pstrutSize += 2;
    var pstrut = makeSpan(["pstrut"], []);
    pstrut.style.height = makeEm(pstrutSize);
    var realChildren = [];
    var minPos = depth;
    var maxPos = depth;
    var currPos = depth;
    for (var _i2 = 0; _i2 < children.length; _i2++) {
      var _child = children[_i2];
      if (_child.type === "kern") {
        currPos += _child.size;
      } else {
        var _elem = _child.elem;
        var classes = _child.wrapperClasses || [];
        var style2 = _child.wrapperStyle || {};
        var childWrap = makeSpan(classes, [pstrut, _elem], void 0, style2);
        childWrap.style.top = makeEm(-pstrutSize - currPos - _elem.depth);
        if (_child.marginLeft) {
          childWrap.style.marginLeft = _child.marginLeft;
        }
        if (_child.marginRight) {
          childWrap.style.marginRight = _child.marginRight;
        }
        realChildren.push(childWrap);
        currPos += _elem.height + _elem.depth;
      }
      minPos = Math.min(minPos, currPos);
      maxPos = Math.max(maxPos, currPos);
    }
    var vlist = makeSpan(["vlist"], realChildren);
    vlist.style.height = makeEm(maxPos);
    var rows;
    if (minPos < 0) {
      var emptySpan = makeSpan([], []);
      var depthStrut = makeSpan(["vlist"], [emptySpan]);
      depthStrut.style.height = makeEm(-minPos);
      var topStrut = makeSpan(["vlist-s"], [new SymbolNode("\u200B")]);
      rows = [makeSpan(["vlist-r"], [vlist, topStrut]), makeSpan(["vlist-r"], [depthStrut])];
    } else {
      rows = [makeSpan(["vlist-r"], [vlist])];
    }
    var vtable = makeSpan(["vlist-t"], rows);
    if (rows.length === 2) {
      vtable.classes.push("vlist-t2");
    }
    vtable.height = maxPos;
    vtable.depth = -minPos;
    return vtable;
  }, "makeVList");
  var makeGlue = /* @__PURE__ */ __name((measurement, options) => {
    var rule = makeSpan(["mspace"], [], options);
    var size = calculateSize(measurement, options);
    rule.style.marginRight = makeEm(size);
    return rule;
  }, "makeGlue");
  var retrieveTextFontName = /* @__PURE__ */ __name((fontFamily, fontWeight, fontShape) => {
    var baseFontName;
    var fontStylesName;
    switch (fontFamily) {
      case "amsrm":
        baseFontName = "AMS";
        break;
      case "textrm":
        baseFontName = "Main";
        break;
      case "textsf":
        baseFontName = "SansSerif";
        break;
      case "texttt":
        baseFontName = "Typewriter";
        break;
      default:
        baseFontName = fontFamily;
    }
    if (fontWeight === "textbf" && fontShape === "textit") {
      fontStylesName = "BoldItalic";
    } else if (fontWeight === "textbf") {
      fontStylesName = "Bold";
    } else if (fontShape === "textit") {
      fontStylesName = "Italic";
    } else {
      fontStylesName = "Regular";
    }
    return baseFontName + "-" + fontStylesName;
  }, "retrieveTextFontName");
  var fontMap = {
    // styles
    "mathbf": {
      variant: "bold",
      fontName: "Main-Bold"
    },
    "mathrm": {
      variant: "normal",
      fontName: "Main-Regular"
    },
    "textit": {
      variant: "italic",
      fontName: "Main-Italic"
    },
    "mathit": {
      variant: "italic",
      fontName: "Main-Italic"
    },
    "mathnormal": {
      variant: "italic",
      fontName: "Math-Italic"
    },
    "mathsfit": {
      variant: "sans-serif-italic",
      fontName: "SansSerif-Italic"
    },
    // "boldsymbol" is missing because they require the use of multiple fonts:
    // Math-BoldItalic and Main-Bold.  This is handled by a special case in
    // makeOrd which ends up calling boldsymbol.
    // families
    "mathbb": {
      variant: "double-struck",
      fontName: "AMS-Regular"
    },
    "mathcal": {
      variant: "script",
      fontName: "Caligraphic-Regular"
    },
    "mathfrak": {
      variant: "fraktur",
      fontName: "Fraktur-Regular"
    },
    "mathscr": {
      variant: "script",
      fontName: "Script-Regular"
    },
    "mathsf": {
      variant: "sans-serif",
      fontName: "SansSerif-Regular"
    },
    "mathtt": {
      variant: "monospace",
      fontName: "Typewriter-Regular"
    }
  };
  var svgData = {
    //   path, width, height
    vec: ["vec", 0.471, 0.714],
    // values from the font glyph
    oiintSize1: ["oiintSize1", 0.957, 0.499],
    // oval to overlay the integrand
    oiintSize2: ["oiintSize2", 1.472, 0.659],
    oiiintSize1: ["oiiintSize1", 1.304, 0.499],
    oiiintSize2: ["oiiintSize2", 1.98, 0.659]
  };
  var staticSvg = /* @__PURE__ */ __name(function staticSvg2(value, options) {
    var [pathName, width, height] = svgData[value];
    var path2 = new PathNode(pathName);
    var svgNode = new SvgNode([path2], {
      "width": makeEm(width),
      "height": makeEm(height),
      // Override CSS rule `.katex svg { width: 100% }`
      "style": "width:" + makeEm(width),
      "viewBox": "0 0 " + 1e3 * width + " " + 1e3 * height,
      "preserveAspectRatio": "xMinYMin"
    });
    var span = makeSvgSpan(["overlay"], [svgNode], options);
    span.height = height;
    span.style.height = makeEm(height);
    span.style.width = makeEm(width);
    return span;
  }, "staticSvg");
  var thinspace = {
    number: 3,
    unit: "mu"
  };
  var mediumspace = {
    number: 4,
    unit: "mu"
  };
  var thickspace = {
    number: 5,
    unit: "mu"
  };
  var spacings = {
    mord: {
      mop: thinspace,
      mbin: mediumspace,
      mrel: thickspace,
      minner: thinspace
    },
    mop: {
      mord: thinspace,
      mop: thinspace,
      mrel: thickspace,
      minner: thinspace
    },
    mbin: {
      mord: mediumspace,
      mop: mediumspace,
      mopen: mediumspace,
      minner: mediumspace
    },
    mrel: {
      mord: thickspace,
      mop: thickspace,
      mopen: thickspace,
      minner: thickspace
    },
    mopen: {},
    mclose: {
      mop: thinspace,
      mbin: mediumspace,
      mrel: thickspace,
      minner: thinspace
    },
    mpunct: {
      mord: thinspace,
      mop: thinspace,
      mrel: thickspace,
      mopen: thinspace,
      mclose: thinspace,
      mpunct: thinspace,
      minner: thinspace
    },
    minner: {
      mord: thinspace,
      mop: thinspace,
      mbin: mediumspace,
      mrel: thickspace,
      mopen: thinspace,
      mpunct: thinspace,
      minner: thinspace
    }
  };
  var tightSpacings = {
    mord: {
      mop: thinspace
    },
    mop: {
      mord: thinspace,
      mop: thinspace
    },
    mbin: {},
    mrel: {},
    mopen: {},
    mclose: {
      mop: thinspace
    },
    mpunct: {},
    minner: {
      mop: thinspace
    }
  };
  var _functions = {};
  var _htmlGroupBuilders = {};
  var _mathmlGroupBuilders = {};
  function defineFunction(_ref) {
    var {
      type,
      names,
      props,
      handler,
      htmlBuilder: htmlBuilder3,
      mathmlBuilder: mathmlBuilder3
    } = _ref;
    var data = {
      type,
      numArgs: props.numArgs,
      argTypes: props.argTypes,
      allowedInArgument: !!props.allowedInArgument,
      allowedInText: !!props.allowedInText,
      allowedInMath: props.allowedInMath === void 0 ? true : props.allowedInMath,
      numOptionalArgs: props.numOptionalArgs || 0,
      infix: !!props.infix,
      primitive: !!props.primitive,
      handler
    };
    for (var i = 0; i < names.length; ++i) {
      _functions[names[i]] = data;
    }
    if (type) {
      if (htmlBuilder3) {
        _htmlGroupBuilders[type] = htmlBuilder3;
      }
      if (mathmlBuilder3) {
        _mathmlGroupBuilders[type] = mathmlBuilder3;
      }
    }
  }
  __name(defineFunction, "defineFunction");
  function defineFunctionBuilders(_ref2) {
    var {
      type,
      htmlBuilder: htmlBuilder3,
      mathmlBuilder: mathmlBuilder3
    } = _ref2;
    defineFunction({
      type,
      names: [],
      props: {
        numArgs: 0
      },
      handler() {
        throw new Error("Should never be called.");
      },
      htmlBuilder: htmlBuilder3,
      mathmlBuilder: mathmlBuilder3
    });
  }
  __name(defineFunctionBuilders, "defineFunctionBuilders");
  var normalizeArgument = /* @__PURE__ */ __name(function normalizeArgument2(arg) {
    return arg.type === "ordgroup" && arg.body.length === 1 ? arg.body[0] : arg;
  }, "normalizeArgument");
  var ordargument = /* @__PURE__ */ __name(function ordargument2(arg) {
    return arg.type === "ordgroup" ? arg.body : [arg];
  }, "ordargument");
  var binLeftCanceller = /* @__PURE__ */ new Set(["leftmost", "mbin", "mopen", "mrel", "mop", "mpunct"]);
  var binRightCanceller = /* @__PURE__ */ new Set(["rightmost", "mrel", "mclose", "mpunct"]);
  var styleMap$1 = {
    "display": Style$1.DISPLAY,
    "text": Style$1.TEXT,
    "script": Style$1.SCRIPT,
    "scriptscript": Style$1.SCRIPTSCRIPT
  };
  var DomEnum = {
    mord: "mord",
    mop: "mop",
    mbin: "mbin",
    mrel: "mrel",
    mopen: "mopen",
    mclose: "mclose",
    mpunct: "mpunct",
    minner: "minner"
  };
  var buildExpression$1 = /* @__PURE__ */ __name(function buildExpression(expression, options, isRealGroup, surrounding) {
    if (surrounding === void 0) {
      surrounding = [null, null];
    }
    var groups = [];
    for (var i = 0; i < expression.length; i++) {
      var output = buildGroup$1(expression[i], options);
      if (output instanceof DocumentFragment) {
        var children = output.children;
        groups.push(...children);
      } else {
        groups.push(output);
      }
    }
    tryCombineChars(groups);
    if (!isRealGroup) {
      return groups;
    }
    var glueOptions = options;
    if (expression.length === 1) {
      var node = expression[0];
      if (node.type === "sizing") {
        glueOptions = options.havingSize(node.size);
      } else if (node.type === "styling") {
        glueOptions = options.havingStyle(styleMap$1[node.style]);
      }
    }
    var dummyPrev = makeSpan([surrounding[0] || "leftmost"], [], options);
    var dummyNext = makeSpan([surrounding[1] || "rightmost"], [], options);
    var isRoot = isRealGroup === "root";
    _traverseNonSpaceNodes(groups, (node2, prev) => {
      var prevType = prev.classes[0];
      var type = node2.classes[0];
      if (prevType === "mbin" && binRightCanceller.has(type)) {
        prev.classes[0] = "mord";
      } else if (type === "mbin" && binLeftCanceller.has(prevType)) {
        node2.classes[0] = "mord";
      }
    }, {
      node: dummyPrev
    }, dummyNext, isRoot);
    _traverseNonSpaceNodes(groups, (node2, prev) => {
      var _tightSpacings$prevTy, _spacings$prevType;
      var prevType = getTypeOfDomTree(prev);
      var type = getTypeOfDomTree(node2);
      var space = prevType && type ? node2.hasClass("mtight") ? (_tightSpacings$prevTy = tightSpacings[prevType]) == null ? void 0 : _tightSpacings$prevTy[type] : (_spacings$prevType = spacings[prevType]) == null ? void 0 : _spacings$prevType[type] : null;
      if (space) {
        return makeGlue(space, glueOptions);
      }
    }, {
      node: dummyPrev
    }, dummyNext, isRoot);
    return groups;
  }, "buildExpression");
  var _traverseNonSpaceNodes = /* @__PURE__ */ __name(function traverseNonSpaceNodes(nodes, callback, prev, next, isRoot) {
    if (next) {
      nodes.push(next);
    }
    var i = 0;
    for (; i < nodes.length; i++) {
      var node = nodes[i];
      var partialGroup = checkPartialGroup(node);
      if (partialGroup) {
        _traverseNonSpaceNodes(partialGroup.children, callback, prev, null, isRoot);
        continue;
      }
      var nonspace = !node.hasClass("mspace");
      if (nonspace) {
        var result = callback(node, prev.node);
        if (result) {
          if (prev.insertAfter) {
            prev.insertAfter(result);
          } else {
            nodes.unshift(result);
            i++;
          }
        }
      }
      if (nonspace) {
        prev.node = node;
      } else if (isRoot && node.hasClass("newline")) {
        prev.node = makeSpan(["leftmost"]);
      }
      prev.insertAfter = /* @__PURE__ */ ((index) => (n) => {
        nodes.splice(index + 1, 0, n);
        i++;
      })(i);
    }
    if (next) {
      nodes.pop();
    }
  }, "traverseNonSpaceNodes");
  var checkPartialGroup = /* @__PURE__ */ __name(function checkPartialGroup2(node) {
    if (node instanceof DocumentFragment || node instanceof Anchor || node instanceof Span && node.hasClass("enclosing")) {
      return node;
    }
    return null;
  }, "checkPartialGroup");
  var _getOutermostNode = /* @__PURE__ */ __name(function getOutermostNode(node, side) {
    var partialGroup = checkPartialGroup(node);
    if (partialGroup) {
      var children = partialGroup.children;
      if (children.length) {
        if (side === "right") {
          return _getOutermostNode(children[children.length - 1], "right");
        } else if (side === "left") {
          return _getOutermostNode(children[0], "left");
        }
      }
    }
    return node;
  }, "getOutermostNode");
  var getTypeOfDomTree = /* @__PURE__ */ __name(function getTypeOfDomTree2(node, side) {
    if (!node) {
      return null;
    }
    if (side) {
      node = _getOutermostNode(node, side);
    }
    var className = node.classes[0];
    return DomEnum[className] || null;
  }, "getTypeOfDomTree");
  var makeNullDelimiter = /* @__PURE__ */ __name(function makeNullDelimiter2(options, classes) {
    var moreClasses = ["nulldelimiter"].concat(options.baseSizingClasses());
    return makeSpan(classes.concat(moreClasses));
  }, "makeNullDelimiter");
  var buildGroup$1 = /* @__PURE__ */ __name(function buildGroup(group, options, baseOptions) {
    if (!group) {
      return makeSpan();
    }
    if (_htmlGroupBuilders[group.type]) {
      var groupNode = _htmlGroupBuilders[group.type](group, options);
      if (baseOptions && options.size !== baseOptions.size) {
        groupNode = makeSpan(options.sizingClasses(baseOptions), [groupNode], options);
        var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
        groupNode.height *= multiplier;
        groupNode.depth *= multiplier;
      }
      return groupNode;
    } else {
      throw new ParseError("Got group of unknown type: '" + group.type + "'");
    }
  }, "buildGroup");
  function buildHTMLUnbreakable(children, options) {
    var body = makeSpan(["base"], children, options);
    var strut = makeSpan(["strut"]);
    strut.style.height = makeEm(body.height + body.depth);
    if (body.depth) {
      strut.style.verticalAlign = makeEm(-body.depth);
    }
    body.children.unshift(strut);
    return body;
  }
  __name(buildHTMLUnbreakable, "buildHTMLUnbreakable");
  function buildHTML(tree, options) {
    var tag = null;
    if (tree.length === 1 && tree[0].type === "tag") {
      tag = tree[0].tag;
      tree = tree[0].body;
    }
    var expression = buildExpression$1(tree, options, "root");
    var eqnNum;
    if (expression.length === 2 && expression[1].hasClass("tag")) {
      eqnNum = expression.pop();
    }
    var children = [];
    var parts = [];
    for (var i = 0; i < expression.length; i++) {
      parts.push(expression[i]);
      if (expression[i].hasClass("mbin") || expression[i].hasClass("mrel") || expression[i].hasClass("allowbreak")) {
        var nobreak = false;
        while (i < expression.length - 1 && expression[i + 1].hasClass("mspace") && !expression[i + 1].hasClass("newline")) {
          i++;
          parts.push(expression[i]);
          if (expression[i].hasClass("nobreak")) {
            nobreak = true;
          }
        }
        if (!nobreak) {
          children.push(buildHTMLUnbreakable(parts, options));
          parts = [];
        }
      } else if (expression[i].hasClass("newline")) {
        parts.pop();
        if (parts.length > 0) {
          children.push(buildHTMLUnbreakable(parts, options));
          parts = [];
        }
        children.push(expression[i]);
      }
    }
    if (parts.length > 0) {
      children.push(buildHTMLUnbreakable(parts, options));
    }
    var tagChild;
    if (tag) {
      tagChild = buildHTMLUnbreakable(buildExpression$1(tag, options, true), options);
      tagChild.classes = ["tag"];
      children.push(tagChild);
    } else if (eqnNum) {
      children.push(eqnNum);
    }
    var htmlNode = makeSpan(["katex-html"], children);
    htmlNode.setAttribute("aria-hidden", "true");
    if (tagChild) {
      var strut = tagChild.children[0];
      strut.style.height = makeEm(htmlNode.height + htmlNode.depth);
      if (htmlNode.depth) {
        strut.style.verticalAlign = makeEm(-htmlNode.depth);
      }
    }
    return htmlNode;
  }
  __name(buildHTML, "buildHTML");
  function newDocumentFragment(children) {
    return new DocumentFragment(children);
  }
  __name(newDocumentFragment, "newDocumentFragment");
  var MathNode = class {
    static {
      __name(this, "MathNode");
    }
    constructor(type, children, classes) {
      this.type = void 0;
      this.attributes = void 0;
      this.children = void 0;
      this.classes = void 0;
      this.type = type;
      this.attributes = {};
      this.children = children || [];
      this.classes = classes || [];
    }
    /**
     * Sets an attribute on a MathML node. MathML depends on attributes to convey a
     * semantic content, so this is used heavily.
     */
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    /**
     * Gets an attribute on a MathML node.
     */
    getAttribute(name) {
      return this.attributes[name];
    }
    /**
     * Converts the math node into a MathML-namespaced DOM element.
     */
    toNode() {
      var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
      for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
          node.setAttribute(attr, this.attributes[attr]);
        }
      }
      if (this.classes.length > 0) {
        node.className = createClass(this.classes);
      }
      for (var i = 0; i < this.children.length; i++) {
        if (this.children[i] instanceof TextNode && this.children[i + 1] instanceof TextNode) {
          var text3 = this.children[i].toText() + this.children[++i].toText();
          while (this.children[i + 1] instanceof TextNode) {
            text3 += this.children[++i].toText();
          }
          node.appendChild(new TextNode(text3).toNode());
        } else {
          node.appendChild(this.children[i].toNode());
        }
      }
      return node;
    }
    /**
     * Converts the math node into an HTML markup string.
     */
    toMarkup() {
      var markup = "<" + this.type;
      for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
          markup += " " + attr + '="';
          markup += escape3(this.attributes[attr]);
          markup += '"';
        }
      }
      if (this.classes.length > 0) {
        markup += ' class ="' + escape3(createClass(this.classes)) + '"';
      }
      markup += ">";
      for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
      }
      markup += "</" + this.type + ">";
      return markup;
    }
    /**
     * Converts the math node into a string, similar to innerText, but escaped.
     */
    toText() {
      return this.children.map((child) => child.toText()).join("");
    }
  };
  var TextNode = class {
    static {
      __name(this, "TextNode");
    }
    constructor(text3) {
      this.text = void 0;
      this.text = text3;
    }
    /**
     * Converts the text node into a DOM text node.
     */
    toNode() {
      return document.createTextNode(this.text);
    }
    /**
     * Converts the text node into escaped HTML markup
     * (representing the text itself).
     */
    toMarkup() {
      return escape3(this.toText());
    }
    /**
     * Converts the text node into a string
     * (representing the text itself).
     */
    toText() {
      return this.text;
    }
  };
  var SpaceNode = class {
    static {
      __name(this, "SpaceNode");
    }
    /**
     * Create a Space node with width given in CSS ems.
     */
    constructor(width) {
      this.width = void 0;
      this.character = void 0;
      this.width = width;
      if (width >= 0.05555 && width <= 0.05556) {
        this.character = "\u200A";
      } else if (width >= 0.1666 && width <= 0.1667) {
        this.character = "\u2009";
      } else if (width >= 0.2222 && width <= 0.2223) {
        this.character = "\u2005";
      } else if (width >= 0.2777 && width <= 0.2778) {
        this.character = "\u2005\u200A";
      } else if (width >= -0.05556 && width <= -0.05555) {
        this.character = "\u200A\u2063";
      } else if (width >= -0.1667 && width <= -0.1666) {
        this.character = "\u2009\u2063";
      } else if (width >= -0.2223 && width <= -0.2222) {
        this.character = "\u205F\u2063";
      } else if (width >= -0.2778 && width <= -0.2777) {
        this.character = "\u2005\u2063";
      } else {
        this.character = null;
      }
    }
    /**
     * Converts the math node into a MathML-namespaced DOM element.
     */
    toNode() {
      if (this.character) {
        return document.createTextNode(this.character);
      } else {
        var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
        node.setAttribute("width", makeEm(this.width));
        return node;
      }
    }
    /**
     * Converts the math node into an HTML markup string.
     */
    toMarkup() {
      if (this.character) {
        return "<mtext>" + this.character + "</mtext>";
      } else {
        return '<mspace width="' + makeEm(this.width) + '"/>';
      }
    }
    /**
     * Converts the math node into a string, similar to innerText.
     */
    toText() {
      if (this.character) {
        return this.character;
      } else {
        return " ";
      }
    }
  };
  var noVariantSymbols = /* @__PURE__ */ new Set(["\\imath", "\\jmath"]);
  var rowLikeTypes = /* @__PURE__ */ new Set(["mrow", "mtable"]);
  var makeText = /* @__PURE__ */ __name(function makeText2(text3, mode, options) {
    if (symbols[mode][text3] && symbols[mode][text3].replace && text3.charCodeAt(0) !== 55349 && !(ligatures.hasOwnProperty(text3) && options && (options.fontFamily && options.fontFamily.slice(4, 6) === "tt" || options.font && options.font.slice(4, 6) === "tt"))) {
      text3 = symbols[mode][text3].replace;
    }
    return new TextNode(text3);
  }, "makeText");
  var makeRow = /* @__PURE__ */ __name(function makeRow2(body) {
    if (body.length === 1) {
      return body[0];
    } else {
      return new MathNode("mrow", body);
    }
  }, "makeRow");
  var mathFontVariants = {
    mathit: "italic",
    boldsymbol: /* @__PURE__ */ __name((group) => group.type === "textord" ? "bold" : "bold-italic", "boldsymbol"),
    mathbf: "bold",
    mathbb: "double-struck",
    mathsfit: "sans-serif-italic",
    mathfrak: "fraktur",
    mathscr: "script",
    mathcal: "script",
    mathsf: "sans-serif",
    mathtt: "monospace"
  };
  var getVariant = /* @__PURE__ */ __name((group, options) => {
    if (group.mode === "text") {
      if (options.fontFamily === "texttt") {
        return "monospace";
      } else if (options.fontFamily === "textsf") {
        if (options.fontShape === "textit" && options.fontWeight === "textbf") {
          return "sans-serif-bold-italic";
        } else if (options.fontShape === "textit") {
          return "sans-serif-italic";
        } else if (options.fontWeight === "textbf") {
          return "bold-sans-serif";
        } else {
          return "sans-serif";
        }
      } else if (options.fontShape === "textit" && options.fontWeight === "textbf") {
        return "bold-italic";
      } else if (options.fontShape === "textit") {
        return "italic";
      } else if (options.fontWeight === "textbf") {
        return "bold";
      }
    }
    var font = options.font;
    if (!font || font === "mathnormal") {
      return null;
    }
    var mode = group.mode;
    var mathVariant = mathFontVariants[font];
    if (mathVariant) {
      return typeof mathVariant === "function" ? mathVariant(group) : mathVariant;
    }
    var text3 = group.text;
    if (noVariantSymbols.has(text3)) {
      return null;
    }
    if (symbols[mode][text3]) {
      var replacement = symbols[mode][text3].replace;
      if (replacement) {
        text3 = replacement;
      }
    }
    var fontName = fontMap[font].fontName;
    if (getCharacterMetrics(text3, fontName, mode)) {
      return fontMap[font].variant;
    }
    return null;
  }, "getVariant");
  function isNumberPunctuation(group) {
    if (!group) {
      return false;
    }
    if (group.type === "mi" && group.children.length === 1) {
      var child = group.children[0];
      return child instanceof TextNode && child.text === ".";
    } else if (group.type === "mo" && group.children.length === 1 && group.getAttribute("separator") === "true" && group.getAttribute("lspace") === "0em" && group.getAttribute("rspace") === "0em") {
      var _child = group.children[0];
      return _child instanceof TextNode && _child.text === ",";
    } else {
      return false;
    }
  }
  __name(isNumberPunctuation, "isNumberPunctuation");
  var buildExpression2 = /* @__PURE__ */ __name(function buildExpression3(expression, options, isOrdgroup) {
    if (expression.length === 1) {
      var group = buildGroup2(expression[0], options);
      if (isOrdgroup && group instanceof MathNode && group.type === "mo") {
        group.setAttribute("lspace", "0em");
        group.setAttribute("rspace", "0em");
      }
      return [group];
    }
    var groups = [];
    var lastGroup;
    for (var i = 0; i < expression.length; i++) {
      var _group = buildGroup2(expression[i], options);
      if (_group instanceof MathNode && lastGroup instanceof MathNode) {
        if (_group.type === "mtext" && lastGroup.type === "mtext" && _group.getAttribute("mathvariant") === lastGroup.getAttribute("mathvariant")) {
          lastGroup.children.push(..._group.children);
          continue;
        } else if (_group.type === "mn" && lastGroup.type === "mn") {
          lastGroup.children.push(..._group.children);
          continue;
        } else if (isNumberPunctuation(_group) && lastGroup.type === "mn") {
          lastGroup.children.push(..._group.children);
          continue;
        } else if (_group.type === "mn" && isNumberPunctuation(lastGroup)) {
          _group.children = [...lastGroup.children, ..._group.children];
          groups.pop();
        } else if ((_group.type === "msup" || _group.type === "msub") && _group.children.length >= 1 && (lastGroup.type === "mn" || isNumberPunctuation(lastGroup))) {
          var base2 = _group.children[0];
          if (base2 instanceof MathNode && base2.type === "mn") {
            base2.children = [...lastGroup.children, ...base2.children];
            groups.pop();
          }
        } else if (lastGroup.type === "mi" && lastGroup.children.length === 1) {
          var lastChild = lastGroup.children[0];
          if (lastChild instanceof TextNode && lastChild.text === "\u0338" && (_group.type === "mo" || _group.type === "mi" || _group.type === "mn")) {
            var child = _group.children[0];
            if (child instanceof TextNode && child.text.length > 0) {
              child.text = child.text.slice(0, 1) + "\u0338" + child.text.slice(1);
              groups.pop();
            }
          }
        }
      }
      groups.push(_group);
      lastGroup = _group;
    }
    return groups;
  }, "buildExpression");
  var buildExpressionRow = /* @__PURE__ */ __name(function buildExpressionRow2(expression, options, isOrdgroup) {
    return makeRow(buildExpression2(expression, options, isOrdgroup));
  }, "buildExpressionRow");
  var buildGroup2 = /* @__PURE__ */ __name(function buildGroup3(group, options) {
    if (!group) {
      return new MathNode("mrow");
    }
    if (_mathmlGroupBuilders[group.type]) {
      return _mathmlGroupBuilders[group.type](group, options);
    } else {
      throw new ParseError("Got group of unknown type: '" + group.type + "'");
    }
  }, "buildGroup");
  function buildMathML(tree, texExpression, options, isDisplayMode, forMathmlOnly) {
    var expression = buildExpression2(tree, options);
    var wrapper;
    if (expression.length === 1 && expression[0] instanceof MathNode && rowLikeTypes.has(expression[0].type)) {
      wrapper = expression[0];
    } else {
      wrapper = new MathNode("mrow", expression);
    }
    var annotation = new MathNode("annotation", [new TextNode(texExpression)]);
    annotation.setAttribute("encoding", "application/x-tex");
    var semantics = new MathNode("semantics", [wrapper, annotation]);
    var math2 = new MathNode("math", [semantics]);
    math2.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
    if (isDisplayMode) {
      math2.setAttribute("display", "block");
    }
    var wrapperClass = forMathmlOnly ? "katex" : "katex-mathml";
    return makeSpan([wrapperClass], [math2]);
  }
  __name(buildMathML, "buildMathML");
  var sizeStyleMap = [
    // Each element contains [textsize, scriptsize, scriptscriptsize].
    // The size mappings are taken from TeX with \normalsize=10pt.
    [1, 1, 1],
    // size1: [5, 5, 5]              \tiny
    [2, 1, 1],
    // size2: [6, 5, 5]
    [3, 1, 1],
    // size3: [7, 5, 5]              \scriptsize
    [4, 2, 1],
    // size4: [8, 6, 5]              \footnotesize
    [5, 2, 1],
    // size5: [9, 6, 5]              \small
    [6, 3, 1],
    // size6: [10, 7, 5]             \normalsize
    [7, 4, 2],
    // size7: [12, 8, 6]             \large
    [8, 6, 3],
    // size8: [14.4, 10, 7]          \Large
    [9, 7, 6],
    // size9: [17.28, 12, 10]        \LARGE
    [10, 8, 7],
    // size10: [20.74, 14.4, 12]     \huge
    [11, 10, 9]
    // size11: [24.88, 20.74, 17.28] \HUGE
  ];
  var sizeMultipliers = [
    // fontMetrics.js:getGlobalMetrics also uses size indexes, so if
    // you change size indexes, change that function.
    0.5,
    0.6,
    0.7,
    0.8,
    0.9,
    1,
    1.2,
    1.44,
    1.728,
    2.074,
    2.488
  ];
  var sizeAtStyle = /* @__PURE__ */ __name(function sizeAtStyle2(size, style2) {
    return style2.size < 2 ? size : sizeStyleMap[size - 1][style2.size - 1];
  }, "sizeAtStyle");
  var Options = class _Options {
    static {
      __name(this, "Options");
    }
    constructor(data) {
      this.style = void 0;
      this.color = void 0;
      this.size = void 0;
      this.textSize = void 0;
      this.phantom = void 0;
      this.font = void 0;
      this.fontFamily = void 0;
      this.fontWeight = void 0;
      this.fontShape = void 0;
      this.sizeMultiplier = void 0;
      this.maxSize = void 0;
      this.minRuleThickness = void 0;
      this._fontMetrics = void 0;
      this.style = data.style;
      this.color = data.color;
      this.size = data.size || _Options.BASESIZE;
      this.textSize = data.textSize || this.size;
      this.phantom = !!data.phantom;
      this.font = data.font || "";
      this.fontFamily = data.fontFamily || "";
      this.fontWeight = data.fontWeight || "";
      this.fontShape = data.fontShape || "";
      this.sizeMultiplier = sizeMultipliers[this.size - 1];
      this.maxSize = data.maxSize;
      this.minRuleThickness = data.minRuleThickness;
      this._fontMetrics = void 0;
    }
    /**
     * Returns a new options object with the same properties as "this".  Properties
     * from "extension" will be copied to the new options object.
     */
    extend(extension) {
      var data = {
        style: this.style,
        size: this.size,
        textSize: this.textSize,
        color: this.color,
        phantom: this.phantom,
        font: this.font,
        fontFamily: this.fontFamily,
        fontWeight: this.fontWeight,
        fontShape: this.fontShape,
        maxSize: this.maxSize,
        minRuleThickness: this.minRuleThickness
      };
      Object.assign(data, extension);
      return new _Options(data);
    }
    /**
     * Return an options object with the given style. If `this.style === style`,
     * returns `this`.
     */
    havingStyle(style2) {
      if (this.style === style2) {
        return this;
      } else {
        return this.extend({
          style: style2,
          size: sizeAtStyle(this.textSize, style2)
        });
      }
    }
    /**
     * Return an options object with a cramped version of the current style. If
     * the current style is cramped, returns `this`.
     */
    havingCrampedStyle() {
      return this.havingStyle(this.style.cramp());
    }
    /**
     * Return an options object with the given size and in at least `\textstyle`.
     * Returns `this` if appropriate.
     */
    havingSize(size) {
      if (this.size === size && this.textSize === size) {
        return this;
      } else {
        return this.extend({
          style: this.style.text(),
          size,
          textSize: size,
          sizeMultiplier: sizeMultipliers[size - 1]
        });
      }
    }
    /**
     * Like `this.havingSize(BASESIZE).havingStyle(style)`. If `style` is omitted,
     * changes to at least `\textstyle`.
     */
    havingBaseStyle(style2) {
      style2 = style2 || this.style.text();
      var wantSize = sizeAtStyle(_Options.BASESIZE, style2);
      if (this.size === wantSize && this.textSize === _Options.BASESIZE && this.style === style2) {
        return this;
      } else {
        return this.extend({
          style: style2,
          size: wantSize
        });
      }
    }
    /**
     * Remove the effect of sizing changes such as \Huge.
     * Keep the effect of the current style, such as \scriptstyle.
     */
    havingBaseSizing() {
      var size;
      switch (this.style.id) {
        case 4:
        case 5:
          size = 3;
          break;
        case 6:
        case 7:
          size = 1;
          break;
        default:
          size = 6;
      }
      return this.extend({
        style: this.style.text(),
        size
      });
    }
    /**
     * Create a new options object with the given color.
     */
    withColor(color) {
      return this.extend({
        color
      });
    }
    /**
     * Create a new options object with "phantom" set to true.
     */
    withPhantom() {
      return this.extend({
        phantom: true
      });
    }
    /**
     * Creates a new options object with the given math font or old text font.
     * @type {[type]}
     */
    withFont(font) {
      return this.extend({
        font
      });
    }
    /**
     * Create a new options objects with the given fontFamily.
     */
    withTextFontFamily(fontFamily) {
      return this.extend({
        fontFamily,
        font: ""
      });
    }
    /**
     * Creates a new options object with the given font weight
     */
    withTextFontWeight(fontWeight) {
      return this.extend({
        fontWeight,
        font: ""
      });
    }
    /**
     * Creates a new options object with the given font weight
     */
    withTextFontShape(fontShape) {
      return this.extend({
        fontShape,
        font: ""
      });
    }
    /**
     * Return the CSS sizing classes required to switch from enclosing options
     * `oldOptions` to `this`. Returns an array of classes.
     */
    sizingClasses(oldOptions) {
      if (oldOptions.size !== this.size) {
        return ["sizing", "reset-size" + oldOptions.size, "size" + this.size];
      } else {
        return [];
      }
    }
    /**
     * Return the CSS sizing classes required to switch to the base size. Like
     * `this.havingSize(BASESIZE).sizingClasses(this)`.
     */
    baseSizingClasses() {
      if (this.size !== _Options.BASESIZE) {
        return ["sizing", "reset-size" + this.size, "size" + _Options.BASESIZE];
      } else {
        return [];
      }
    }
    /**
     * Return the font metrics for this size.
     */
    fontMetrics() {
      if (!this._fontMetrics) {
        this._fontMetrics = getGlobalMetrics(this.size);
      }
      return this._fontMetrics;
    }
    /**
     * Gets the CSS color of the current options object
     */
    getColor() {
      if (this.phantom) {
        return "transparent";
      } else {
        return this.color;
      }
    }
  };
  Options.BASESIZE = 6;
  var optionsFromSettings = /* @__PURE__ */ __name(function optionsFromSettings2(settings) {
    return new Options({
      style: settings.displayMode ? Style$1.DISPLAY : Style$1.TEXT,
      maxSize: settings.maxSize,
      minRuleThickness: settings.minRuleThickness
    });
  }, "optionsFromSettings");
  var displayWrap = /* @__PURE__ */ __name(function displayWrap2(node, settings) {
    if (settings.displayMode) {
      var classes = ["katex-display"];
      if (settings.leqno) {
        classes.push("leqno");
      }
      if (settings.fleqn) {
        classes.push("fleqn");
      }
      node = makeSpan(classes, [node]);
    }
    return node;
  }, "displayWrap");
  var buildTree = /* @__PURE__ */ __name(function buildTree2(tree, expression, settings) {
    var options = optionsFromSettings(settings);
    var katexNode;
    if (settings.output === "mathml") {
      return buildMathML(tree, expression, options, settings.displayMode, true);
    } else if (settings.output === "html") {
      var htmlNode = buildHTML(tree, options);
      katexNode = makeSpan(["katex"], [htmlNode]);
    } else {
      var mathMLNode = buildMathML(tree, expression, options, settings.displayMode, false);
      var _htmlNode = buildHTML(tree, options);
      katexNode = makeSpan(["katex"], [mathMLNode, _htmlNode]);
    }
    return displayWrap(katexNode, settings);
  }, "buildTree");
  var buildHTMLTree = /* @__PURE__ */ __name(function buildHTMLTree2(tree, expression, settings) {
    var options = optionsFromSettings(settings);
    var htmlNode = buildHTML(tree, options);
    var katexNode = makeSpan(["katex"], [htmlNode]);
    return displayWrap(katexNode, settings);
  }, "buildHTMLTree");
  var stretchyCodePoint = {
    widehat: "^",
    widecheck: "\u02C7",
    widetilde: "~",
    utilde: "~",
    overleftarrow: "\u2190",
    underleftarrow: "\u2190",
    xleftarrow: "\u2190",
    overrightarrow: "\u2192",
    underrightarrow: "\u2192",
    xrightarrow: "\u2192",
    underbrace: "\u23DF",
    overbrace: "\u23DE",
    underbracket: "\u23B5",
    overbracket: "\u23B4",
    overgroup: "\u23E0",
    undergroup: "\u23E1",
    overleftrightarrow: "\u2194",
    underleftrightarrow: "\u2194",
    xleftrightarrow: "\u2194",
    Overrightarrow: "\u21D2",
    xRightarrow: "\u21D2",
    overleftharpoon: "\u21BC",
    xleftharpoonup: "\u21BC",
    overrightharpoon: "\u21C0",
    xrightharpoonup: "\u21C0",
    xLeftarrow: "\u21D0",
    xLeftrightarrow: "\u21D4",
    xhookleftarrow: "\u21A9",
    xhookrightarrow: "\u21AA",
    xmapsto: "\u21A6",
    xrightharpoondown: "\u21C1",
    xleftharpoondown: "\u21BD",
    xrightleftharpoons: "\u21CC",
    xleftrightharpoons: "\u21CB",
    xtwoheadleftarrow: "\u219E",
    xtwoheadrightarrow: "\u21A0",
    xlongequal: "=",
    xtofrom: "\u21C4",
    xrightleftarrows: "\u21C4",
    xrightequilibrium: "\u21CC",
    // Not a perfect match.
    xleftequilibrium: "\u21CB",
    // None better available.
    "\\cdrightarrow": "\u2192",
    "\\cdleftarrow": "\u2190",
    "\\cdlongequal": "="
  };
  var stretchyMathML = /* @__PURE__ */ __name(function stretchyMathML2(label) {
    var node = new MathNode("mo", [new TextNode(stretchyCodePoint[label.replace(/^\\/, "")])]);
    node.setAttribute("stretchy", "true");
    return node;
  }, "stretchyMathML");
  var katexImagesData = {
    //   path(s), minWidth, height, align
    overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
    overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
    underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
    underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
    xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"],
    "\\cdrightarrow": [["rightarrow"], 3, 522, "xMaxYMin"],
    // CD minwwidth2.5pc
    xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"],
    "\\cdleftarrow": [["leftarrow"], 3, 522, "xMinYMin"],
    Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"],
    xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"],
    xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"],
    overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"],
    xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"],
    xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"],
    overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
    xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
    xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"],
    xlongequal: [["longequal"], 0.888, 334, "xMinYMin"],
    "\\cdlongequal": [["longequal"], 3, 334, "xMinYMin"],
    xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"],
    xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"],
    overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
    overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548],
    underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548],
    underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
    xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522],
    xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560],
    xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716],
    xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716],
    xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522],
    xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522],
    overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
    underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
    overbracket: [["leftbracketover", "rightbracketover"], 1.6, 440],
    underbracket: [["leftbracketunder", "rightbracketunder"], 1.6, 410],
    overgroup: [["leftgroup", "rightgroup"], 0.888, 342],
    undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342],
    xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522],
    xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528],
    // The next three arrows are from the mhchem package.
    // In mhchem.sty, min-length is 2.0em. But these arrows might appear in the
    // document as \xrightarrow or \xrightleftharpoons. Those have
    // min-length = 1.75em, so we set min-length on these next three to match.
    xrightleftarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901],
    xrightequilibrium: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716],
    xleftequilibrium: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716]
  };
  var wideAccentLabels = /* @__PURE__ */ new Set(["widehat", "widecheck", "widetilde", "utilde"]);
  var stretchySvg = /* @__PURE__ */ __name(function stretchySvg2(group, options) {
    function buildSvgSpan_() {
      var viewBoxWidth = 4e5;
      var label = group.label.slice(1);
      if (wideAccentLabels.has(label) && "base" in group) {
        var numChars = group.base.type === "ordgroup" ? group.base.body.length : 1;
        var viewBoxHeight;
        var pathName;
        var _height;
        if (numChars > 5) {
          if (label === "widehat" || label === "widecheck") {
            viewBoxHeight = 420;
            viewBoxWidth = 2364;
            _height = 0.42;
            pathName = label + "4";
          } else {
            viewBoxHeight = 312;
            viewBoxWidth = 2340;
            _height = 0.34;
            pathName = "tilde4";
          }
        } else {
          var imgIndex = [1, 1, 2, 2, 3, 3][numChars];
          if (label === "widehat" || label === "widecheck") {
            viewBoxWidth = [0, 1062, 2364, 2364, 2364][imgIndex];
            viewBoxHeight = [0, 239, 300, 360, 420][imgIndex];
            _height = [0, 0.24, 0.3, 0.3, 0.36, 0.42][imgIndex];
            pathName = label + imgIndex;
          } else {
            viewBoxWidth = [0, 600, 1033, 2339, 2340][imgIndex];
            viewBoxHeight = [0, 260, 286, 306, 312][imgIndex];
            _height = [0, 0.26, 0.286, 0.3, 0.306, 0.34][imgIndex];
            pathName = "tilde" + imgIndex;
          }
        }
        var path2 = new PathNode(pathName);
        var svgNode = new SvgNode([path2], {
          "width": "100%",
          "height": makeEm(_height),
          "viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight,
          "preserveAspectRatio": "none"
        });
        return {
          span: makeSvgSpan([], [svgNode], options),
          minWidth: 0,
          height: _height
        };
      } else {
        var spans = [];
        var data = katexImagesData[label];
        if (!data) {
          throw new Error('No SVG data for "' + label + '".');
        }
        var [paths, _minWidth, _viewBoxHeight] = data;
        var _height2 = _viewBoxHeight / 1e3;
        var numSvgChildren = paths.length;
        var widthClasses;
        var aligns;
        if (numSvgChildren === 1) {
          if (data.length !== 4) {
            throw new Error('Expected 4-tuple for single-path SVG data "' + label + '".');
          }
          widthClasses = ["hide-tail"];
          aligns = [data[3]];
        } else if (numSvgChildren === 2) {
          widthClasses = ["halfarrow-left", "halfarrow-right"];
          aligns = ["xMinYMin", "xMaxYMin"];
        } else if (numSvgChildren === 3) {
          widthClasses = ["brace-left", "brace-center", "brace-right"];
          aligns = ["xMinYMin", "xMidYMin", "xMaxYMin"];
        } else {
          throw new Error("Correct katexImagesData or update code here to support\n                    " + numSvgChildren + " children.");
        }
        for (var i = 0; i < numSvgChildren; i++) {
          var _path = new PathNode(paths[i]);
          var _svgNode = new SvgNode([_path], {
            "width": "400em",
            "height": makeEm(_height2),
            "viewBox": "0 0 " + viewBoxWidth + " " + _viewBoxHeight,
            "preserveAspectRatio": aligns[i] + " slice"
          });
          var _span = makeSvgSpan([widthClasses[i]], [_svgNode], options);
          if (numSvgChildren === 1) {
            return {
              span: _span,
              minWidth: _minWidth,
              height: _height2
            };
          } else {
            _span.style.height = makeEm(_height2);
            spans.push(_span);
          }
        }
        return {
          span: makeSpan(["stretchy"], spans, options),
          minWidth: _minWidth,
          height: _height2
        };
      }
    }
    __name(buildSvgSpan_, "buildSvgSpan_");
    var {
      span,
      minWidth,
      height
    } = buildSvgSpan_();
    span.height = height;
    span.style.height = makeEm(height);
    if (minWidth > 0) {
      span.style.minWidth = makeEm(minWidth);
    }
    return span;
  }, "stretchySvg");
  var stretchyEnclose = /* @__PURE__ */ __name(function stretchyEnclose2(inner2, label, topPad, bottomPad, options) {
    var img;
    var totalHeight = inner2.height + inner2.depth + topPad + bottomPad;
    if (/fbox|color|angl/.test(label)) {
      img = makeSpan(["stretchy", label], [], options);
      if (label === "fbox") {
        var color = options.color && options.getColor();
        if (color) {
          img.style.borderColor = color;
        }
      }
    } else {
      var lines = [];
      if (/^[bx]cancel$/.test(label)) {
        lines.push(new LineNode({
          "x1": "0",
          "y1": "0",
          "x2": "100%",
          "y2": "100%",
          "stroke-width": "0.046em"
        }));
      }
      if (/^x?cancel$/.test(label)) {
        lines.push(new LineNode({
          "x1": "0",
          "y1": "100%",
          "x2": "100%",
          "y2": "0",
          "stroke-width": "0.046em"
        }));
      }
      var svgNode = new SvgNode(lines, {
        "width": "100%",
        "height": makeEm(totalHeight)
      });
      img = makeSvgSpan([], [svgNode], options);
    }
    img.height = totalHeight;
    img.style.height = makeEm(totalHeight);
    return img;
  }, "stretchyEnclose");
  var ATOMS = {
    "bin": 1,
    "close": 1,
    "inner": 1,
    "open": 1,
    "punct": 1,
    "rel": 1
  };
  var NON_ATOMS = {
    "accent-token": 1,
    "mathord": 1,
    "op-token": 1,
    "spacing": 1,
    "textord": 1
  };
  function isAtom(value) {
    return value in ATOMS;
  }
  __name(isAtom, "isAtom");
  function assertNodeType(node, type) {
    if (!node || node.type !== type) {
      throw new Error("Expected node of type " + type + ", but got " + (node ? "node of type " + node.type : String(node)));
    }
    return node;
  }
  __name(assertNodeType, "assertNodeType");
  function assertSymbolNodeType(node) {
    var typedNode = checkSymbolNodeType(node);
    if (!typedNode) {
      throw new Error("Expected node of symbol group type, but got " + (node ? "node of type " + node.type : String(node)));
    }
    return typedNode;
  }
  __name(assertSymbolNodeType, "assertSymbolNodeType");
  function checkSymbolNodeType(node) {
    if (node && (node.type === "atom" || NON_ATOMS.hasOwnProperty(node.type))) {
      return node;
    }
    return null;
  }
  __name(checkSymbolNodeType, "checkSymbolNodeType");
  var getBaseSymbol = /* @__PURE__ */ __name((group) => {
    if (group instanceof SymbolNode) {
      return group;
    }
    if (hasHtmlDomChildren(group) && group.children.length === 1) {
      return getBaseSymbol(group.children[0]);
    }
  }, "getBaseSymbol");
  var htmlBuilder$a = /* @__PURE__ */ __name((grp, options) => {
    var base2;
    var group;
    var supSubGroup;
    if (grp && grp.type === "supsub") {
      group = assertNodeType(grp.base, "accent");
      base2 = group.base;
      grp.base = base2;
      supSubGroup = assertSpan(buildGroup$1(grp, options));
      grp.base = group;
    } else {
      group = assertNodeType(grp, "accent");
      base2 = group.base;
    }
    var body = buildGroup$1(base2, options.havingCrampedStyle());
    var mustShift = group.isShifty && isCharacterBox(base2);
    var skew2 = 0;
    if (mustShift) {
      var _getBaseSymbol$skew, _getBaseSymbol;
      skew2 = (_getBaseSymbol$skew = (_getBaseSymbol = getBaseSymbol(body)) == null ? void 0 : _getBaseSymbol.skew) != null ? _getBaseSymbol$skew : 0;
    }
    var accentBelow = group.label === "\\c";
    var clearance = accentBelow ? body.height + body.depth : Math.min(body.height, options.fontMetrics().xHeight);
    var accentBody;
    if (!group.isStretchy) {
      var accent2;
      var width;
      if (group.label === "\\vec") {
        accent2 = staticSvg("vec", options);
        width = svgData.vec[1];
      } else {
        accent2 = makeOrd({
          type: "textord",
          mode: group.mode,
          text: group.label
        }, options, "textord");
        accent2 = assertSymbolDomNode(accent2);
        accent2.italic = 0;
        width = accent2.width;
        if (accentBelow) {
          clearance += accent2.depth;
        }
      }
      accentBody = makeSpan(["accent-body"], [accent2]);
      var accentFull = group.label === "\\textcircled";
      if (accentFull) {
        accentBody.classes.push("accent-full");
        clearance = body.height;
      }
      var left = skew2;
      if (!accentFull) {
        left -= width / 2;
      }
      accentBody.style.left = makeEm(left);
      if (group.label === "\\textcircled") {
        accentBody.style.top = ".2em";
      }
      accentBody = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: body
        }, {
          type: "kern",
          size: -clearance
        }, {
          type: "elem",
          elem: accentBody
        }]
      });
    } else {
      accentBody = stretchySvg(group, options);
      accentBody = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: body
        }, {
          type: "elem",
          elem: accentBody,
          wrapperClasses: ["svg-align"],
          wrapperStyle: skew2 > 0 ? {
            width: "calc(100% - " + makeEm(2 * skew2) + ")",
            marginLeft: makeEm(2 * skew2)
          } : void 0
        }]
      });
    }
    var accentWrap = makeSpan(["mord", "accent"], [accentBody], options);
    if (supSubGroup) {
      supSubGroup.children[0] = accentWrap;
      supSubGroup.height = Math.max(accentWrap.height, supSubGroup.height);
      supSubGroup.classes[0] = "mord";
      return supSubGroup;
    } else {
      return accentWrap;
    }
  }, "htmlBuilder$a");
  var mathmlBuilder$9 = /* @__PURE__ */ __name((group, options) => {
    var accentNode = group.isStretchy ? stretchyMathML(group.label) : new MathNode("mo", [makeText(group.label, group.mode)]);
    var node = new MathNode("mover", [buildGroup2(group.base, options), accentNode]);
    node.setAttribute("accent", "true");
    return node;
  }, "mathmlBuilder$9");
  var NON_STRETCHY_ACCENT_REGEX = new RegExp(["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring"].map((accent2) => "\\" + accent2).join("|"));
  defineFunction({
    type: "accent",
    names: ["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring", "\\widecheck", "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow", "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup", "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon"],
    props: {
      numArgs: 1
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var base2 = normalizeArgument(args[0]);
      var isStretchy = !NON_STRETCHY_ACCENT_REGEX.test(context.funcName);
      var isShifty = !isStretchy || context.funcName === "\\widehat" || context.funcName === "\\widetilde" || context.funcName === "\\widecheck";
      return {
        type: "accent",
        mode: context.parser.mode,
        label: context.funcName,
        isStretchy,
        isShifty,
        base: base2
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$a,
    mathmlBuilder: mathmlBuilder$9
  });
  defineFunction({
    type: "accent",
    names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"', "\\c", "\\r", "\\H", "\\v", "\\textcircled"],
    props: {
      numArgs: 1,
      allowedInText: true,
      allowedInMath: true,
      // unless in strict mode
      argTypes: ["primitive"]
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var base2 = args[0];
      var mode = context.parser.mode;
      if (mode === "math") {
        context.parser.settings.reportNonstrict("mathVsTextAccents", "LaTeX's accent " + context.funcName + " works only in text mode");
        mode = "text";
      }
      return {
        type: "accent",
        mode,
        label: context.funcName,
        isStretchy: false,
        isShifty: true,
        base: base2
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$a,
    mathmlBuilder: mathmlBuilder$9
  });
  defineFunction({
    type: "accentUnder",
    names: ["\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow", "\\undergroup", "\\underlinesegment", "\\utilde"],
    props: {
      numArgs: 1
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var base2 = args[0];
      return {
        type: "accentUnder",
        mode: parser.mode,
        label: funcName,
        base: base2
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var innerGroup = buildGroup$1(group.base, options);
      var accentBody = stretchySvg(group, options);
      var kern = group.label === "\\utilde" ? 0.12 : 0;
      var vlist = makeVList({
        positionType: "top",
        positionData: innerGroup.height,
        children: [{
          type: "elem",
          elem: accentBody,
          wrapperClasses: ["svg-align"]
        }, {
          type: "kern",
          size: kern
        }, {
          type: "elem",
          elem: innerGroup
        }]
      });
      return makeSpan(["mord", "accentunder"], [vlist], options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var accentNode = stretchyMathML(group.label);
      var node = new MathNode("munder", [buildGroup2(group.base, options), accentNode]);
      node.setAttribute("accentunder", "true");
      return node;
    }, "mathmlBuilder")
  });
  var paddedNode = /* @__PURE__ */ __name((group) => {
    var node = new MathNode("mpadded", group ? [group] : []);
    node.setAttribute("width", "+0.6em");
    node.setAttribute("lspace", "0.3em");
    return node;
  }, "paddedNode");
  defineFunction({
    type: "xArrow",
    names: [
      "\\xleftarrow",
      "\\xrightarrow",
      "\\xLeftarrow",
      "\\xRightarrow",
      "\\xleftrightarrow",
      "\\xLeftrightarrow",
      "\\xhookleftarrow",
      "\\xhookrightarrow",
      "\\xmapsto",
      "\\xrightharpoondown",
      "\\xrightharpoonup",
      "\\xleftharpoondown",
      "\\xleftharpoonup",
      "\\xrightleftharpoons",
      "\\xleftrightharpoons",
      "\\xlongequal",
      "\\xtwoheadrightarrow",
      "\\xtwoheadleftarrow",
      "\\xtofrom",
      // The next 3 functions are here to support the mhchem extension.
      // Direct use of these functions is discouraged and may break someday.
      "\\xrightleftarrows",
      "\\xrightequilibrium",
      "\\xleftequilibrium",
      // The next 3 functions are here only to support the {CD} environment.
      "\\\\cdrightarrow",
      "\\\\cdleftarrow",
      "\\\\cdlongequal"
    ],
    props: {
      numArgs: 1,
      numOptionalArgs: 1
    },
    handler(_ref, args, optArgs) {
      var {
        parser,
        funcName
      } = _ref;
      return {
        type: "xArrow",
        mode: parser.mode,
        label: funcName,
        body: args[0],
        below: optArgs[0]
      };
    },
    htmlBuilder(group, options) {
      var style2 = options.style;
      var newOptions = options.havingStyle(style2.sup());
      var upperGroup = wrapFragment(buildGroup$1(group.body, newOptions, options), options);
      var arrowPrefix = group.label.slice(0, 2) === "\\x" ? "x" : "cd";
      upperGroup.classes.push(arrowPrefix + "-arrow-pad");
      var lowerGroup;
      if (group.below) {
        newOptions = options.havingStyle(style2.sub());
        lowerGroup = wrapFragment(buildGroup$1(group.below, newOptions, options), options);
        lowerGroup.classes.push(arrowPrefix + "-arrow-pad");
      }
      var arrowBody = stretchySvg(group, options);
      var arrowShift = -options.fontMetrics().axisHeight + 0.5 * arrowBody.height;
      var upperShift = -options.fontMetrics().axisHeight - 0.5 * arrowBody.height - 0.111;
      if (upperGroup.depth > 0.25 || group.label === "\\xleftequilibrium") {
        upperShift -= upperGroup.depth;
      }
      var vlist;
      if (lowerGroup) {
        var lowerShift = -options.fontMetrics().axisHeight + lowerGroup.height + 0.5 * arrowBody.height + 0.111;
        vlist = makeVList({
          positionType: "individualShift",
          children: [{
            type: "elem",
            elem: upperGroup,
            shift: upperShift
          }, {
            type: "elem",
            elem: arrowBody,
            shift: arrowShift,
            wrapperClasses: ["svg-align"]
          }, {
            type: "elem",
            elem: lowerGroup,
            shift: lowerShift
          }]
        });
      } else {
        vlist = makeVList({
          positionType: "individualShift",
          children: [{
            type: "elem",
            elem: upperGroup,
            shift: upperShift
          }, {
            type: "elem",
            elem: arrowBody,
            shift: arrowShift,
            wrapperClasses: ["svg-align"]
          }]
        });
      }
      return makeSpan(["mrel", "x-arrow"], [vlist], options);
    },
    mathmlBuilder(group, options) {
      var arrowNode = stretchyMathML(group.label);
      arrowNode.setAttribute("minsize", group.label.charAt(0) === "x" ? "1.75em" : "3.0em");
      var node;
      if (group.body) {
        var upperNode = paddedNode(buildGroup2(group.body, options));
        if (group.below) {
          var lowerNode = paddedNode(buildGroup2(group.below, options));
          node = new MathNode("munderover", [arrowNode, lowerNode, upperNode]);
        } else {
          node = new MathNode("mover", [arrowNode, upperNode]);
        }
      } else if (group.below) {
        var _lowerNode = paddedNode(buildGroup2(group.below, options));
        node = new MathNode("munder", [arrowNode, _lowerNode]);
      } else {
        node = paddedNode();
        node = new MathNode("mover", [arrowNode, node]);
      }
      return node;
    }
  });
  function htmlBuilder$9(group, options) {
    var elements = buildExpression$1(group.body, options, true);
    return makeSpan([group.mclass], elements, options);
  }
  __name(htmlBuilder$9, "htmlBuilder$9");
  function mathmlBuilder$8(group, options) {
    var node;
    var inner2 = buildExpression2(group.body, options);
    if (group.mclass === "minner") {
      node = new MathNode("mpadded", inner2);
    } else if (group.mclass === "mord") {
      if (group.isCharacterBox) {
        node = inner2[0];
        node.type = "mi";
      } else {
        node = new MathNode("mi", inner2);
      }
    } else {
      if (group.isCharacterBox) {
        node = inner2[0];
        node.type = "mo";
      } else {
        node = new MathNode("mo", inner2);
      }
      if (group.mclass === "mbin") {
        node.attributes.lspace = "0.22em";
        node.attributes.rspace = "0.22em";
      } else if (group.mclass === "mpunct") {
        node.attributes.lspace = "0em";
        node.attributes.rspace = "0.17em";
      } else if (group.mclass === "mopen" || group.mclass === "mclose") {
        node.attributes.lspace = "0em";
        node.attributes.rspace = "0em";
      } else if (group.mclass === "minner") {
        node.attributes.lspace = "0.0556em";
        node.attributes.width = "+0.1111em";
      }
    }
    return node;
  }
  __name(mathmlBuilder$8, "mathmlBuilder$8");
  defineFunction({
    type: "mclass",
    names: ["\\mathord", "\\mathbin", "\\mathrel", "\\mathopen", "\\mathclose", "\\mathpunct", "\\mathinner"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      var body = args[0];
      return {
        type: "mclass",
        mode: parser.mode,
        mclass: "m" + funcName.slice(5),
        // TODO(kevinb): don't prefix with 'm'
        body: ordargument(body),
        isCharacterBox: isCharacterBox(body)
      };
    },
    htmlBuilder: htmlBuilder$9,
    mathmlBuilder: mathmlBuilder$8
  });
  var binrelClass = /* @__PURE__ */ __name((arg) => {
    var atom = arg.type === "ordgroup" && arg.body.length ? arg.body[0] : arg;
    if (atom.type === "atom" && (atom.family === "bin" || atom.family === "rel")) {
      return "m" + atom.family;
    } else {
      return "mord";
    }
  }, "binrelClass");
  defineFunction({
    type: "mclass",
    names: ["\\@binrel"],
    props: {
      numArgs: 2
    },
    handler(_ref2, args) {
      var {
        parser
      } = _ref2;
      return {
        type: "mclass",
        mode: parser.mode,
        mclass: binrelClass(args[0]),
        body: ordargument(args[1]),
        isCharacterBox: isCharacterBox(args[1])
      };
    }
  });
  defineFunction({
    type: "mclass",
    names: ["\\stackrel", "\\overset", "\\underset"],
    props: {
      numArgs: 2
    },
    handler(_ref3, args) {
      var {
        parser,
        funcName
      } = _ref3;
      var baseArg = args[1];
      var shiftedArg = args[0];
      var mclass;
      if (funcName !== "\\stackrel") {
        mclass = binrelClass(baseArg);
      } else {
        mclass = "mrel";
      }
      var baseOp = {
        type: "op",
        mode: baseArg.mode,
        limits: true,
        alwaysHandleSupSub: true,
        parentIsSupSub: false,
        symbol: false,
        suppressBaseShift: funcName !== "\\stackrel",
        body: ordargument(baseArg)
      };
      var supsub = {
        type: "supsub",
        mode: shiftedArg.mode,
        base: baseOp,
        sup: funcName === "\\underset" ? null : shiftedArg,
        sub: funcName === "\\underset" ? shiftedArg : null
      };
      return {
        type: "mclass",
        mode: parser.mode,
        mclass,
        body: [supsub],
        isCharacterBox: isCharacterBox(supsub)
      };
    },
    htmlBuilder: htmlBuilder$9,
    mathmlBuilder: mathmlBuilder$8
  });
  defineFunction({
    type: "pmb",
    names: ["\\pmb"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      return {
        type: "pmb",
        mode: parser.mode,
        mclass: binrelClass(args[0]),
        body: ordargument(args[0])
      };
    },
    htmlBuilder(group, options) {
      var elements = buildExpression$1(group.body, options, true);
      var node = makeSpan([group.mclass], elements, options);
      node.style.textShadow = "0.02em 0.01em 0.04px";
      return node;
    },
    mathmlBuilder(group, style2) {
      var inner2 = buildExpression2(group.body, style2);
      var node = new MathNode("mstyle", inner2);
      node.setAttribute("style", "text-shadow: 0.02em 0.01em 0.04px");
      return node;
    }
  });
  var cdArrowFunctionName = {
    ">": "\\\\cdrightarrow",
    "<": "\\\\cdleftarrow",
    "=": "\\\\cdlongequal",
    "A": "\\uparrow",
    "V": "\\downarrow",
    "|": "\\Vert",
    ".": "no arrow"
  };
  var newCell = /* @__PURE__ */ __name(() => {
    return {
      type: "styling",
      body: [],
      mode: "math",
      style: "display",
      resetFont: true
    };
  }, "newCell");
  var isStartOfArrow = /* @__PURE__ */ __name((node) => {
    return node.type === "textord" && node.text === "@";
  }, "isStartOfArrow");
  var isLabelEnd = /* @__PURE__ */ __name((node, endChar) => {
    return (node.type === "mathord" || node.type === "atom") && node.text === endChar;
  }, "isLabelEnd");
  function cdArrow(arrowChar, labels, parser) {
    var funcName = cdArrowFunctionName[arrowChar];
    switch (funcName) {
      case "\\\\cdrightarrow":
      case "\\\\cdleftarrow":
        return parser.callFunction(funcName, [labels[0]], [labels[1]]);
      case "\\uparrow":
      case "\\downarrow": {
        var leftLabel = parser.callFunction("\\\\cdleft", [labels[0]], []);
        var bareArrow = {
          type: "atom",
          text: funcName,
          mode: "math",
          family: "rel"
        };
        var sizedArrow = parser.callFunction("\\Big", [bareArrow], []);
        var rightLabel = parser.callFunction("\\\\cdright", [labels[1]], []);
        var arrowGroup = {
          type: "ordgroup",
          mode: "math",
          body: [leftLabel, sizedArrow, rightLabel]
        };
        return parser.callFunction("\\\\cdparent", [arrowGroup], []);
      }
      case "\\\\cdlongequal":
        return parser.callFunction("\\\\cdlongequal", [], []);
      case "\\Vert": {
        var arrow2 = {
          type: "textord",
          text: "\\Vert",
          mode: "math"
        };
        return parser.callFunction("\\Big", [arrow2], []);
      }
      default:
        return {
          type: "textord",
          text: " ",
          mode: "math"
        };
    }
  }
  __name(cdArrow, "cdArrow");
  function parseCD(parser) {
    var parsedRows = [];
    parser.gullet.beginGroup();
    parser.gullet.macros.set("\\cr", "\\\\\\relax");
    parser.gullet.beginGroup();
    while (true) {
      parsedRows.push(parser.parseExpression(false, "\\\\"));
      parser.gullet.endGroup();
      parser.gullet.beginGroup();
      var next = parser.fetch().text;
      if (next === "&" || next === "\\\\") {
        parser.consume();
      } else if (next === "\\end") {
        if (parsedRows[parsedRows.length - 1].length === 0) {
          parsedRows.pop();
        }
        break;
      } else {
        throw new ParseError("Expected \\\\ or \\cr or \\end", parser.nextToken);
      }
    }
    var row = [];
    var body = [row];
    for (var i = 0; i < parsedRows.length; i++) {
      var rowNodes = parsedRows[i];
      var cell = newCell();
      for (var j = 0; j < rowNodes.length; j++) {
        if (!isStartOfArrow(rowNodes[j])) {
          cell.body.push(rowNodes[j]);
        } else {
          row.push(cell);
          j += 1;
          var arrowChar = assertSymbolNodeType(rowNodes[j]).text;
          var labels = new Array(2);
          labels[0] = {
            type: "ordgroup",
            mode: "math",
            body: []
          };
          labels[1] = {
            type: "ordgroup",
            mode: "math",
            body: []
          };
          if ("=|.".includes(arrowChar)) ;
          else if ("<>AV".includes(arrowChar)) {
            for (var labelNum = 0; labelNum < 2; labelNum++) {
              var inLabel = true;
              for (var k = j + 1; k < rowNodes.length; k++) {
                if (isLabelEnd(rowNodes[k], arrowChar)) {
                  inLabel = false;
                  j = k;
                  break;
                }
                if (isStartOfArrow(rowNodes[k])) {
                  throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[k]);
                }
                labels[labelNum].body.push(rowNodes[k]);
              }
              if (inLabel) {
                throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[j]);
              }
            }
          } else {
            throw new ParseError('Expected one of "<>AV=|." after @', rowNodes[j]);
          }
          var arrow2 = cdArrow(arrowChar, labels, parser);
          var wrappedArrow = {
            type: "styling",
            body: [arrow2],
            mode: "math",
            style: "display",
            // CD is always displaystyle.
            resetFont: true
          };
          row.push(wrappedArrow);
          cell = newCell();
        }
      }
      if (i % 2 === 0) {
        row.push(cell);
      } else {
        row.shift();
      }
      row = [];
      body.push(row);
    }
    parser.gullet.endGroup();
    parser.gullet.endGroup();
    var cols = new Array(body[0].length).fill({
      type: "align",
      align: "c",
      pregap: 0.25,
      // CD package sets \enskip between columns.
      postgap: 0.25
      // So pre and post each get half an \enskip, i.e. 0.25em.
    });
    return {
      type: "array",
      mode: "math",
      body,
      arraystretch: 1,
      addJot: true,
      rowGaps: [null],
      cols,
      colSeparationType: "CD",
      hLinesBeforeRow: new Array(body.length + 1).fill([])
    };
  }
  __name(parseCD, "parseCD");
  defineFunction({
    type: "cdlabel",
    names: ["\\\\cdleft", "\\\\cdright"],
    props: {
      numArgs: 1
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      return {
        type: "cdlabel",
        mode: parser.mode,
        side: funcName.slice(4),
        label: args[0]
      };
    },
    htmlBuilder(group, options) {
      var newOptions = options.havingStyle(options.style.sup());
      var label = wrapFragment(buildGroup$1(group.label, newOptions, options), options);
      label.classes.push("cd-label-" + group.side);
      label.style.bottom = makeEm(0.8 - label.depth);
      label.height = 0;
      label.depth = 0;
      return label;
    },
    mathmlBuilder(group, options) {
      var label = new MathNode("mrow", [buildGroup2(group.label, options)]);
      label = new MathNode("mpadded", [label]);
      label.setAttribute("width", "0");
      if (group.side === "left") {
        label.setAttribute("lspace", "-1width");
      }
      label.setAttribute("voffset", "0.7em");
      label = new MathNode("mstyle", [label]);
      label.setAttribute("displaystyle", "false");
      label.setAttribute("scriptlevel", "1");
      return label;
    }
  });
  defineFunction({
    type: "cdlabelparent",
    names: ["\\\\cdparent"],
    props: {
      numArgs: 1
    },
    handler(_ref2, args) {
      var {
        parser
      } = _ref2;
      return {
        type: "cdlabelparent",
        mode: parser.mode,
        fragment: args[0]
      };
    },
    htmlBuilder(group, options) {
      var parent = wrapFragment(buildGroup$1(group.fragment, options), options);
      parent.classes.push("cd-vert-arrow");
      return parent;
    },
    mathmlBuilder(group, options) {
      return new MathNode("mrow", [buildGroup2(group.fragment, options)]);
    }
  });
  defineFunction({
    type: "textord",
    names: ["\\@char"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      var arg = assertNodeType(args[0], "ordgroup");
      var group = arg.body;
      var number = "";
      for (var i = 0; i < group.length; i++) {
        var node = assertNodeType(group[i], "textord");
        number += node.text;
      }
      var code2 = parseInt(number);
      var text3;
      if (isNaN(code2)) {
        throw new ParseError("\\@char has non-numeric argument " + number);
      } else if (code2 < 0 || code2 >= 1114111) {
        throw new ParseError("\\@char with invalid code point " + number);
      } else if (code2 <= 65535) {
        text3 = String.fromCharCode(code2);
      } else {
        code2 -= 65536;
        text3 = String.fromCharCode((code2 >> 10) + 55296, (code2 & 1023) + 56320);
      }
      return {
        type: "textord",
        mode: parser.mode,
        text: text3
      };
    }
  });
  var htmlBuilder$8 = /* @__PURE__ */ __name((group, options) => {
    var elements = buildExpression$1(group.body, options.withColor(group.color), false);
    return makeFragment(elements);
  }, "htmlBuilder$8");
  var mathmlBuilder$7 = /* @__PURE__ */ __name((group, options) => {
    var inner2 = buildExpression2(group.body, options.withColor(group.color));
    var node = new MathNode("mstyle", inner2);
    node.setAttribute("mathcolor", group.color);
    return node;
  }, "mathmlBuilder$7");
  defineFunction({
    type: "color",
    names: ["\\textcolor"],
    props: {
      numArgs: 2,
      allowedInText: true,
      argTypes: ["color", "original"]
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      var color = assertNodeType(args[0], "color-token").color;
      var body = args[1];
      return {
        type: "color",
        mode: parser.mode,
        color,
        body: ordargument(body)
      };
    },
    htmlBuilder: htmlBuilder$8,
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "color",
    names: ["\\color"],
    props: {
      numArgs: 1,
      allowedInText: true,
      argTypes: ["color"]
    },
    handler(_ref2, args) {
      var {
        parser,
        breakOnTokenText
      } = _ref2;
      var color = assertNodeType(args[0], "color-token").color;
      parser.gullet.macros.set("\\current@color", color);
      var body = parser.parseExpression(true, breakOnTokenText);
      return {
        type: "color",
        mode: parser.mode,
        color,
        body
      };
    },
    htmlBuilder: htmlBuilder$8,
    mathmlBuilder: mathmlBuilder$7
  });
  defineFunction({
    type: "cr",
    names: ["\\\\"],
    props: {
      numArgs: 0,
      numOptionalArgs: 0,
      allowedInText: true
    },
    handler(_ref, args, optArgs) {
      var {
        parser
      } = _ref;
      var size = parser.gullet.future().text === "[" ? parser.parseSizeGroup(true) : null;
      var newLine = !parser.settings.displayMode || !parser.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline does nothing in display mode");
      return {
        type: "cr",
        mode: parser.mode,
        newLine,
        size: size && assertNodeType(size, "size").value
      };
    },
    // The following builders are called only at the top level,
    // not within tabular/array environments.
    htmlBuilder(group, options) {
      var span = makeSpan(["mspace"], [], options);
      if (group.newLine) {
        span.classes.push("newline");
        if (group.size) {
          span.style.marginTop = makeEm(calculateSize(group.size, options));
        }
      }
      return span;
    },
    mathmlBuilder(group, options) {
      var node = new MathNode("mspace");
      if (group.newLine) {
        node.setAttribute("linebreak", "newline");
        if (group.size) {
          node.setAttribute("height", makeEm(calculateSize(group.size, options)));
        }
      }
      return node;
    }
  });
  var globalMap = {
    "\\global": "\\global",
    "\\long": "\\\\globallong",
    "\\\\globallong": "\\\\globallong",
    "\\def": "\\gdef",
    "\\gdef": "\\gdef",
    "\\edef": "\\xdef",
    "\\xdef": "\\xdef",
    "\\let": "\\\\globallet",
    "\\futurelet": "\\\\globalfuture"
  };
  var checkControlSequence = /* @__PURE__ */ __name((tok) => {
    var name = tok.text;
    if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
      throw new ParseError("Expected a control sequence", tok);
    }
    return name;
  }, "checkControlSequence");
  var getRHS = /* @__PURE__ */ __name((parser) => {
    var tok = parser.gullet.popToken();
    if (tok.text === "=") {
      tok = parser.gullet.popToken();
      if (tok.text === " ") {
        tok = parser.gullet.popToken();
      }
    }
    return tok;
  }, "getRHS");
  var letCommand = /* @__PURE__ */ __name((parser, name, tok, global) => {
    var macro = parser.gullet.macros.get(tok.text);
    if (macro == null) {
      tok.noexpand = true;
      macro = {
        tokens: [tok],
        numArgs: 0,
        // reproduce the same behavior in expansion
        unexpandable: !parser.gullet.isExpandable(tok.text)
      };
    }
    parser.gullet.macros.set(name, macro, global);
  }, "letCommand");
  defineFunction({
    type: "internal",
    names: [
      "\\global",
      "\\long",
      "\\\\globallong"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler(_ref) {
      var {
        parser,
        funcName
      } = _ref;
      parser.consumeSpaces();
      var token = parser.fetch();
      if (globalMap[token.text]) {
        if (funcName === "\\global" || funcName === "\\\\globallong") {
          token.text = globalMap[token.text];
        }
        return assertNodeType(parser.parseFunction(), "internal");
      }
      throw new ParseError("Invalid token after macro prefix", token);
    }
  });
  defineFunction({
    type: "internal",
    names: ["\\def", "\\gdef", "\\edef", "\\xdef"],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler(_ref2) {
      var {
        parser,
        funcName
      } = _ref2;
      var tok = parser.gullet.popToken();
      var name = tok.text;
      if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
        throw new ParseError("Expected a control sequence", tok);
      }
      var numArgs = 0;
      var insert;
      var delimiters2 = [[]];
      while (parser.gullet.future().text !== "{") {
        tok = parser.gullet.popToken();
        if (tok.text === "#") {
          if (parser.gullet.future().text === "{") {
            insert = parser.gullet.future();
            delimiters2[numArgs].push("{");
            break;
          }
          tok = parser.gullet.popToken();
          if (!/^[1-9]$/.test(tok.text)) {
            throw new ParseError('Invalid argument number "' + tok.text + '"');
          }
          if (parseInt(tok.text) !== numArgs + 1) {
            throw new ParseError('Argument number "' + tok.text + '" out of order');
          }
          numArgs++;
          delimiters2.push([]);
        } else if (tok.text === "EOF") {
          throw new ParseError("Expected a macro definition");
        } else {
          delimiters2[numArgs].push(tok.text);
        }
      }
      var {
        tokens
      } = parser.gullet.consumeArg();
      if (insert) {
        tokens.unshift(insert);
      }
      if (funcName === "\\edef" || funcName === "\\xdef") {
        tokens = parser.gullet.expandTokens(tokens);
        tokens.reverse();
      }
      parser.gullet.macros.set(name, {
        tokens,
        numArgs,
        delimiters: delimiters2
      }, funcName === globalMap[funcName]);
      return {
        type: "internal",
        mode: parser.mode
      };
    }
  });
  defineFunction({
    type: "internal",
    names: [
      "\\let",
      "\\\\globallet"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler(_ref3) {
      var {
        parser,
        funcName
      } = _ref3;
      var name = checkControlSequence(parser.gullet.popToken());
      parser.gullet.consumeSpaces();
      var tok = getRHS(parser);
      letCommand(parser, name, tok, funcName === "\\\\globallet");
      return {
        type: "internal",
        mode: parser.mode
      };
    }
  });
  defineFunction({
    type: "internal",
    names: [
      "\\futurelet",
      "\\\\globalfuture"
      // can’t be entered directly
    ],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler(_ref4) {
      var {
        parser,
        funcName
      } = _ref4;
      var name = checkControlSequence(parser.gullet.popToken());
      var middle = parser.gullet.popToken();
      var tok = parser.gullet.popToken();
      letCommand(parser, name, tok, funcName === "\\\\globalfuture");
      parser.gullet.pushToken(tok);
      parser.gullet.pushToken(middle);
      return {
        type: "internal",
        mode: parser.mode
      };
    }
  });
  var getMetrics = /* @__PURE__ */ __name(function getMetrics2(symbol, font, mode) {
    var replace2 = symbols.math[symbol] && symbols.math[symbol].replace;
    var metrics = getCharacterMetrics(replace2 || symbol, font, mode);
    if (!metrics) {
      throw new Error("Unsupported symbol " + symbol + " and font size " + font + ".");
    }
    return metrics;
  }, "getMetrics");
  var styleWrap = /* @__PURE__ */ __name(function styleWrap2(delim, toStyle, options, classes) {
    var newOptions = options.havingBaseStyle(toStyle);
    var span = makeSpan(classes.concat(newOptions.sizingClasses(options)), [delim], options);
    var delimSizeMultiplier = newOptions.sizeMultiplier / options.sizeMultiplier;
    span.height *= delimSizeMultiplier;
    span.depth *= delimSizeMultiplier;
    span.maxFontSize = newOptions.sizeMultiplier;
    return span;
  }, "styleWrap");
  var centerSpan = /* @__PURE__ */ __name(function centerSpan2(span, options, style2) {
    var newOptions = options.havingBaseStyle(style2);
    var shift = (1 - options.sizeMultiplier / newOptions.sizeMultiplier) * options.fontMetrics().axisHeight;
    span.classes.push("delimcenter");
    span.style.top = makeEm(shift);
    span.height -= shift;
    span.depth += shift;
  }, "centerSpan");
  var makeSmallDelim = /* @__PURE__ */ __name(function makeSmallDelim2(delim, style2, center, options, mode, classes) {
    var text3 = makeSymbol(delim, "Main-Regular", mode, options);
    var span = styleWrap(text3, style2, options, classes);
    if (center) {
      centerSpan(span, options, style2);
    }
    return span;
  }, "makeSmallDelim");
  var mathrmSize = /* @__PURE__ */ __name(function mathrmSize2(value, size, mode, options) {
    return makeSymbol(value, "Size" + size + "-Regular", mode, options);
  }, "mathrmSize");
  var makeLargeDelim = /* @__PURE__ */ __name(function makeLargeDelim2(delim, size, center, options, mode, classes) {
    var inner2 = mathrmSize(delim, size, mode, options);
    var span = styleWrap(makeSpan(["delimsizing", "size" + size], [inner2], options), Style$1.TEXT, options, classes);
    if (center) {
      centerSpan(span, options, Style$1.TEXT);
    }
    return span;
  }, "makeLargeDelim");
  var makeGlyphSpan = /* @__PURE__ */ __name(function makeGlyphSpan2(symbol, font, mode) {
    var sizeClass;
    if (font === "Size1-Regular") {
      sizeClass = "delim-size1";
    } else {
      sizeClass = "delim-size4";
    }
    var corner = makeSpan(["delimsizinginner", sizeClass], [makeSpan([], [makeSymbol(symbol, font, mode)])]);
    return {
      type: "elem",
      elem: corner
    };
  }, "makeGlyphSpan");
  var makeInner = /* @__PURE__ */ __name(function makeInner2(ch, height, options) {
    var width = fontMetricsData["Size4-Regular"][ch.charCodeAt(0)] ? fontMetricsData["Size4-Regular"][ch.charCodeAt(0)][4] : fontMetricsData["Size1-Regular"][ch.charCodeAt(0)][4];
    var path2 = new PathNode("inner", innerPath(ch, Math.round(1e3 * height)));
    var svgNode = new SvgNode([path2], {
      "width": makeEm(width),
      "height": makeEm(height),
      // Override CSS rule `.katex svg { width: 100% }`
      "style": "width:" + makeEm(width),
      "viewBox": "0 0 " + 1e3 * width + " " + Math.round(1e3 * height),
      "preserveAspectRatio": "xMinYMin"
    });
    var span = makeSvgSpan([], [svgNode], options);
    span.height = height;
    span.style.height = makeEm(height);
    span.style.width = makeEm(width);
    return {
      type: "elem",
      elem: span
    };
  }, "makeInner");
  var lapInEms = 8e-3;
  var lap = {
    type: "kern",
    size: -1 * lapInEms
  };
  var verts = /* @__PURE__ */ new Set(["|", "\\lvert", "\\rvert", "\\vert"]);
  var doubleVerts = /* @__PURE__ */ new Set(["\\|", "\\lVert", "\\rVert", "\\Vert"]);
  var makeStackedDelim = /* @__PURE__ */ __name(function makeStackedDelim2(delim, heightTotal, center, options, mode, classes) {
    var top;
    var middle;
    var repeat;
    var bottom;
    var svgLabel = "";
    var viewBoxWidth = 0;
    top = repeat = bottom = delim;
    middle = null;
    var font = "Size1-Regular";
    if (delim === "\\uparrow") {
      repeat = bottom = "\u23D0";
    } else if (delim === "\\Uparrow") {
      repeat = bottom = "\u2016";
    } else if (delim === "\\downarrow") {
      top = repeat = "\u23D0";
    } else if (delim === "\\Downarrow") {
      top = repeat = "\u2016";
    } else if (delim === "\\updownarrow") {
      top = "\\uparrow";
      repeat = "\u23D0";
      bottom = "\\downarrow";
    } else if (delim === "\\Updownarrow") {
      top = "\\Uparrow";
      repeat = "\u2016";
      bottom = "\\Downarrow";
    } else if (verts.has(delim)) {
      repeat = "\u2223";
      svgLabel = "vert";
      viewBoxWidth = 333;
    } else if (doubleVerts.has(delim)) {
      repeat = "\u2225";
      svgLabel = "doublevert";
      viewBoxWidth = 556;
    } else if (delim === "[" || delim === "\\lbrack") {
      top = "\u23A1";
      repeat = "\u23A2";
      bottom = "\u23A3";
      font = "Size4-Regular";
      svgLabel = "lbrack";
      viewBoxWidth = 667;
    } else if (delim === "]" || delim === "\\rbrack") {
      top = "\u23A4";
      repeat = "\u23A5";
      bottom = "\u23A6";
      font = "Size4-Regular";
      svgLabel = "rbrack";
      viewBoxWidth = 667;
    } else if (delim === "\\lfloor" || delim === "\u230A") {
      repeat = top = "\u23A2";
      bottom = "\u23A3";
      font = "Size4-Regular";
      svgLabel = "lfloor";
      viewBoxWidth = 667;
    } else if (delim === "\\lceil" || delim === "\u2308") {
      top = "\u23A1";
      repeat = bottom = "\u23A2";
      font = "Size4-Regular";
      svgLabel = "lceil";
      viewBoxWidth = 667;
    } else if (delim === "\\rfloor" || delim === "\u230B") {
      repeat = top = "\u23A5";
      bottom = "\u23A6";
      font = "Size4-Regular";
      svgLabel = "rfloor";
      viewBoxWidth = 667;
    } else if (delim === "\\rceil" || delim === "\u2309") {
      top = "\u23A4";
      repeat = bottom = "\u23A5";
      font = "Size4-Regular";
      svgLabel = "rceil";
      viewBoxWidth = 667;
    } else if (delim === "(" || delim === "\\lparen") {
      top = "\u239B";
      repeat = "\u239C";
      bottom = "\u239D";
      font = "Size4-Regular";
      svgLabel = "lparen";
      viewBoxWidth = 875;
    } else if (delim === ")" || delim === "\\rparen") {
      top = "\u239E";
      repeat = "\u239F";
      bottom = "\u23A0";
      font = "Size4-Regular";
      svgLabel = "rparen";
      viewBoxWidth = 875;
    } else if (delim === "\\{" || delim === "\\lbrace") {
      top = "\u23A7";
      middle = "\u23A8";
      bottom = "\u23A9";
      repeat = "\u23AA";
      font = "Size4-Regular";
    } else if (delim === "\\}" || delim === "\\rbrace") {
      top = "\u23AB";
      middle = "\u23AC";
      bottom = "\u23AD";
      repeat = "\u23AA";
      font = "Size4-Regular";
    } else if (delim === "\\lgroup" || delim === "\u27EE") {
      top = "\u23A7";
      bottom = "\u23A9";
      repeat = "\u23AA";
      font = "Size4-Regular";
    } else if (delim === "\\rgroup" || delim === "\u27EF") {
      top = "\u23AB";
      bottom = "\u23AD";
      repeat = "\u23AA";
      font = "Size4-Regular";
    } else if (delim === "\\lmoustache" || delim === "\u23B0") {
      top = "\u23A7";
      bottom = "\u23AD";
      repeat = "\u23AA";
      font = "Size4-Regular";
    } else if (delim === "\\rmoustache" || delim === "\u23B1") {
      top = "\u23AB";
      bottom = "\u23A9";
      repeat = "\u23AA";
      font = "Size4-Regular";
    }
    var topMetrics = getMetrics(top, font, mode);
    var topHeightTotal = topMetrics.height + topMetrics.depth;
    var repeatMetrics = getMetrics(repeat, font, mode);
    var repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
    var bottomMetrics = getMetrics(bottom, font, mode);
    var bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
    var middleHeightTotal = 0;
    var middleFactor = 1;
    if (middle !== null) {
      var middleMetrics = getMetrics(middle, font, mode);
      middleHeightTotal = middleMetrics.height + middleMetrics.depth;
      middleFactor = 2;
    }
    var minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;
    var repeatCount = Math.max(0, Math.ceil((heightTotal - minHeight) / (middleFactor * repeatHeightTotal)));
    var realHeightTotal = minHeight + repeatCount * middleFactor * repeatHeightTotal;
    var axisHeight = options.fontMetrics().axisHeight;
    if (center) {
      axisHeight *= options.sizeMultiplier;
    }
    var depth = realHeightTotal / 2 - axisHeight;
    var stack = [];
    if (svgLabel.length > 0) {
      var midHeight = realHeightTotal - topHeightTotal - bottomHeightTotal;
      var viewBoxHeight = Math.round(realHeightTotal * 1e3);
      var pathStr = tallDelim(svgLabel, Math.round(midHeight * 1e3));
      var path2 = new PathNode(svgLabel, pathStr);
      var width = makeEm(viewBoxWidth / 1e3);
      var height = makeEm(viewBoxHeight / 1e3);
      var svg = new SvgNode([path2], {
        "width": width,
        "height": height,
        "viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight
      });
      var wrapper = makeSvgSpan([], [svg], options);
      wrapper.height = viewBoxHeight / 1e3;
      wrapper.style.width = width;
      wrapper.style.height = height;
      stack.push({
        type: "elem",
        elem: wrapper
      });
    } else {
      stack.push(makeGlyphSpan(bottom, font, mode));
      stack.push(lap);
      if (middle === null) {
        var innerHeight = realHeightTotal - topHeightTotal - bottomHeightTotal + 2 * lapInEms;
        stack.push(makeInner(repeat, innerHeight, options));
      } else {
        var _innerHeight = (realHeightTotal - topHeightTotal - bottomHeightTotal - middleHeightTotal) / 2 + 2 * lapInEms;
        stack.push(makeInner(repeat, _innerHeight, options));
        stack.push(lap);
        stack.push(makeGlyphSpan(middle, font, mode));
        stack.push(lap);
        stack.push(makeInner(repeat, _innerHeight, options));
      }
      stack.push(lap);
      stack.push(makeGlyphSpan(top, font, mode));
    }
    var newOptions = options.havingBaseStyle(Style$1.TEXT);
    var inner2 = makeVList({
      positionType: "bottom",
      positionData: depth,
      children: stack
    });
    return styleWrap(makeSpan(["delimsizing", "mult"], [inner2], newOptions), Style$1.TEXT, options, classes);
  }, "makeStackedDelim");
  var vbPad = 80;
  var emPad = 0.08;
  var sqrtSvg = /* @__PURE__ */ __name(function sqrtSvg2(sqrtName, height, viewBoxHeight, extraVinculum, options) {
    var path2 = sqrtPath(sqrtName, extraVinculum, viewBoxHeight);
    var pathNode = new PathNode(sqrtName, path2);
    var svg = new SvgNode([pathNode], {
      // Note: 1000:1 ratio of viewBox to document em width.
      "width": "400em",
      "height": makeEm(height),
      "viewBox": "0 0 400000 " + viewBoxHeight,
      "preserveAspectRatio": "xMinYMin slice"
    });
    return makeSvgSpan(["hide-tail"], [svg], options);
  }, "sqrtSvg");
  var makeSqrtImage = /* @__PURE__ */ __name(function makeSqrtImage2(height, options) {
    var newOptions = options.havingBaseSizing();
    var delim = traverseSequence("\\surd", height * newOptions.sizeMultiplier, stackLargeDelimiterSequence, newOptions);
    var sizeMultiplier = newOptions.sizeMultiplier;
    var extraVinculum = Math.max(0, options.minRuleThickness - options.fontMetrics().sqrtRuleThickness);
    var span;
    var spanHeight;
    var texHeight;
    var viewBoxHeight;
    var advanceWidth;
    if (delim.type === "small") {
      viewBoxHeight = 1e3 + 1e3 * extraVinculum + vbPad;
      if (height < 1) {
        sizeMultiplier = 1;
      } else if (height < 1.4) {
        sizeMultiplier = 0.7;
      }
      spanHeight = (1 + extraVinculum + emPad) / sizeMultiplier;
      texHeight = (1 + extraVinculum) / sizeMultiplier;
      span = sqrtSvg("sqrtMain", spanHeight, viewBoxHeight, extraVinculum, options);
      span.style.minWidth = "0.853em";
      advanceWidth = 0.833 / sizeMultiplier;
    } else if (delim.type === "large") {
      viewBoxHeight = (1e3 + vbPad) * sizeToMaxHeight[delim.size];
      texHeight = (sizeToMaxHeight[delim.size] + extraVinculum) / sizeMultiplier;
      spanHeight = (sizeToMaxHeight[delim.size] + extraVinculum + emPad) / sizeMultiplier;
      span = sqrtSvg("sqrtSize" + delim.size, spanHeight, viewBoxHeight, extraVinculum, options);
      span.style.minWidth = "1.02em";
      advanceWidth = 1 / sizeMultiplier;
    } else {
      spanHeight = height + extraVinculum + emPad;
      texHeight = height + extraVinculum;
      viewBoxHeight = Math.floor(1e3 * height + extraVinculum) + vbPad;
      span = sqrtSvg("sqrtTall", spanHeight, viewBoxHeight, extraVinculum, options);
      span.style.minWidth = "0.742em";
      advanceWidth = 1.056;
    }
    span.height = texHeight;
    span.style.height = makeEm(spanHeight);
    return {
      span,
      advanceWidth,
      // Calculate the actual line width.
      // This actually should depend on the chosen font -- e.g. \boldmath
      // should use the thicker surd symbols from e.g. KaTeX_Main-Bold, and
      // have thicker rules.
      ruleWidth: (options.fontMetrics().sqrtRuleThickness + extraVinculum) * sizeMultiplier
    };
  }, "makeSqrtImage");
  var stackLargeDelimiters = /* @__PURE__ */ new Set(["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "\\surd"]);
  var stackAlwaysDelimiters = /* @__PURE__ */ new Set(["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1"]);
  var stackNeverDelimiters = /* @__PURE__ */ new Set(["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"]);
  var sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3];
  var makeSizedDelim = /* @__PURE__ */ __name(function makeSizedDelim2(delim, size, options, mode, classes) {
    if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
      delim = "\\langle";
    } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
      delim = "\\rangle";
    }
    if (stackLargeDelimiters.has(delim) || stackNeverDelimiters.has(delim)) {
      return makeLargeDelim(delim, size, false, options, mode, classes);
    } else if (stackAlwaysDelimiters.has(delim)) {
      return makeStackedDelim(delim, sizeToMaxHeight[size], false, options, mode, classes);
    } else {
      throw new ParseError("Illegal delimiter: '" + delim + "'");
    }
  }, "makeSizedDelim");
  var stackNeverDelimiterSequence = [{
    type: "small",
    style: Style$1.SCRIPTSCRIPT
  }, {
    type: "small",
    style: Style$1.SCRIPT
  }, {
    type: "small",
    style: Style$1.TEXT
  }, {
    type: "large",
    size: 1
  }, {
    type: "large",
    size: 2
  }, {
    type: "large",
    size: 3
  }, {
    type: "large",
    size: 4
  }];
  var stackAlwaysDelimiterSequence = [{
    type: "small",
    style: Style$1.SCRIPTSCRIPT
  }, {
    type: "small",
    style: Style$1.SCRIPT
  }, {
    type: "small",
    style: Style$1.TEXT
  }, {
    type: "stack"
  }];
  var stackLargeDelimiterSequence = [{
    type: "small",
    style: Style$1.SCRIPTSCRIPT
  }, {
    type: "small",
    style: Style$1.SCRIPT
  }, {
    type: "small",
    style: Style$1.TEXT
  }, {
    type: "large",
    size: 1
  }, {
    type: "large",
    size: 2
  }, {
    type: "large",
    size: 3
  }, {
    type: "large",
    size: 4
  }, {
    type: "stack"
  }];
  var delimTypeToFont = /* @__PURE__ */ __name(function delimTypeToFont2(type) {
    if (type.type === "small") {
      return "Main-Regular";
    } else if (type.type === "large") {
      return "Size" + type.size + "-Regular";
    } else if (type.type === "stack") {
      return "Size4-Regular";
    } else {
      var delimKind = type.type;
      throw new Error("Add support for delim type '" + delimKind + "' here.");
    }
  }, "delimTypeToFont");
  var traverseSequence = /* @__PURE__ */ __name(function traverseSequence2(delim, height, sequence, options) {
    var start = Math.min(2, 3 - options.style.size);
    for (var i = start; i < sequence.length; i++) {
      var delimType = sequence[i];
      if (delimType.type === "stack") {
        break;
      }
      var metrics = getMetrics(delim, delimTypeToFont(delimType), "math");
      var heightDepth = metrics.height + metrics.depth;
      if (delimType.type === "small") {
        var newOptions = options.havingBaseStyle(delimType.style);
        heightDepth *= newOptions.sizeMultiplier;
      }
      if (heightDepth > height) {
        return delimType;
      }
    }
    return sequence[sequence.length - 1];
  }, "traverseSequence");
  var makeCustomSizedDelim = /* @__PURE__ */ __name(function makeCustomSizedDelim2(delim, height, center, options, mode, classes) {
    if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
      delim = "\\langle";
    } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
      delim = "\\rangle";
    }
    var sequence;
    if (stackNeverDelimiters.has(delim)) {
      sequence = stackNeverDelimiterSequence;
    } else if (stackLargeDelimiters.has(delim)) {
      sequence = stackLargeDelimiterSequence;
    } else {
      sequence = stackAlwaysDelimiterSequence;
    }
    var delimType = traverseSequence(delim, height, sequence, options);
    if (delimType.type === "small") {
      return makeSmallDelim(delim, delimType.style, center, options, mode, classes);
    } else if (delimType.type === "large") {
      return makeLargeDelim(delim, delimType.size, center, options, mode, classes);
    } else {
      return makeStackedDelim(delim, height, center, options, mode, classes);
    }
  }, "makeCustomSizedDelim");
  var makeLeftRightDelim = /* @__PURE__ */ __name(function makeLeftRightDelim2(delim, height, depth, options, mode, classes) {
    var axisHeight = options.fontMetrics().axisHeight * options.sizeMultiplier;
    var delimiterFactor = 901;
    var delimiterExtend = 5 / options.fontMetrics().ptPerEm;
    var maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
    var totalHeight = Math.max(
      // In real TeX, calculations are done using integral values which are
      // 65536 per pt, or 655360 per em. So, the division here truncates in
      // TeX but doesn't here, producing different results. If we wanted to
      // exactly match TeX's calculation, we could do
      //   Math.floor(655360 * maxDistFromAxis / 500) *
      //    delimiterFactor / 655360
      // (To see the difference, compare
      //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
      // in TeX and KaTeX)
      maxDistFromAxis / 500 * delimiterFactor,
      2 * maxDistFromAxis - delimiterExtend
    );
    return makeCustomSizedDelim(delim, totalHeight, true, options, mode, classes);
  }, "makeLeftRightDelim");
  var delimiterSizes = {
    "\\bigl": {
      mclass: "mopen",
      size: 1
    },
    "\\Bigl": {
      mclass: "mopen",
      size: 2
    },
    "\\biggl": {
      mclass: "mopen",
      size: 3
    },
    "\\Biggl": {
      mclass: "mopen",
      size: 4
    },
    "\\bigr": {
      mclass: "mclose",
      size: 1
    },
    "\\Bigr": {
      mclass: "mclose",
      size: 2
    },
    "\\biggr": {
      mclass: "mclose",
      size: 3
    },
    "\\Biggr": {
      mclass: "mclose",
      size: 4
    },
    "\\bigm": {
      mclass: "mrel",
      size: 1
    },
    "\\Bigm": {
      mclass: "mrel",
      size: 2
    },
    "\\biggm": {
      mclass: "mrel",
      size: 3
    },
    "\\Biggm": {
      mclass: "mrel",
      size: 4
    },
    "\\big": {
      mclass: "mord",
      size: 1
    },
    "\\Big": {
      mclass: "mord",
      size: 2
    },
    "\\bigg": {
      mclass: "mord",
      size: 3
    },
    "\\Bigg": {
      mclass: "mord",
      size: 4
    }
  };
  var delimiters = /* @__PURE__ */ new Set(["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "<", ">", "\\langle", "\u27E8", "\\rangle", "\u27E9", "\\lt", "\\gt", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1", "/", "\\backslash", "|", "\\vert", "\\|", "\\Vert", "\\uparrow", "\\Uparrow", "\\downarrow", "\\Downarrow", "\\updownarrow", "\\Updownarrow", "."]);
  function isMiddleDelimNode(node) {
    return "isMiddle" in node;
  }
  __name(isMiddleDelimNode, "isMiddleDelimNode");
  function checkDelimiter(delim, context) {
    var symDelim = checkSymbolNodeType(delim);
    if (symDelim && delimiters.has(symDelim.text)) {
      return symDelim;
    } else if (symDelim) {
      throw new ParseError("Invalid delimiter '" + symDelim.text + "' after '" + context.funcName + "'", delim);
    } else {
      throw new ParseError("Invalid delimiter type '" + delim.type + "'", delim);
    }
  }
  __name(checkDelimiter, "checkDelimiter");
  defineFunction({
    type: "delimsizing",
    names: ["\\bigl", "\\Bigl", "\\biggl", "\\Biggl", "\\bigr", "\\Bigr", "\\biggr", "\\Biggr", "\\bigm", "\\Bigm", "\\biggm", "\\Biggm", "\\big", "\\Big", "\\bigg", "\\Bigg"],
    props: {
      numArgs: 1,
      argTypes: ["primitive"]
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var delim = checkDelimiter(args[0], context);
      return {
        type: "delimsizing",
        mode: context.parser.mode,
        size: delimiterSizes[context.funcName].size,
        mclass: delimiterSizes[context.funcName].mclass,
        delim: delim.text
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      if (group.delim === ".") {
        return makeSpan([group.mclass]);
      }
      return makeSizedDelim(group.delim, group.size, options, group.mode, [group.mclass]);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group) => {
      var children = [];
      if (group.delim !== ".") {
        children.push(makeText(group.delim, group.mode));
      }
      var node = new MathNode("mo", children);
      if (group.mclass === "mopen" || group.mclass === "mclose") {
        node.setAttribute("fence", "true");
      } else {
        node.setAttribute("fence", "false");
      }
      node.setAttribute("stretchy", "true");
      var size = makeEm(sizeToMaxHeight[group.size]);
      node.setAttribute("minsize", size);
      node.setAttribute("maxsize", size);
      return node;
    }, "mathmlBuilder")
  });
  function assertParsed(group) {
    if (!group.body) {
      throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
    }
  }
  __name(assertParsed, "assertParsed");
  defineFunction({
    type: "leftright-right",
    names: ["\\right"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var color = context.parser.gullet.macros.get("\\current@color");
      if (color && typeof color !== "string") {
        throw new ParseError("\\current@color set to non-string in \\right");
      }
      return {
        type: "leftright-right",
        mode: context.parser.mode,
        delim: checkDelimiter(args[0], context).text,
        color
        // undefined if not set via \color
      };
    }, "handler")
  });
  defineFunction({
    type: "leftright",
    names: ["\\left"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var delim = checkDelimiter(args[0], context);
      var parser = context.parser;
      ++parser.leftrightDepth;
      var body = parser.parseExpression(false);
      --parser.leftrightDepth;
      parser.expect("\\right", false);
      var right = assertNodeType(parser.parseFunction(), "leftright-right");
      return {
        type: "leftright",
        mode: parser.mode,
        body,
        left: delim.text,
        right: right.delim,
        rightColor: right.color
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      assertParsed(group);
      var inner2 = buildExpression$1(group.body, options, true, ["mopen", "mclose"]);
      var innerHeight = 0;
      var innerDepth = 0;
      var hadMiddle = false;
      for (var i = 0; i < inner2.length; i++) {
        var node = inner2[i];
        if (isMiddleDelimNode(node)) {
          hadMiddle = true;
        } else {
          innerHeight = Math.max(inner2[i].height, innerHeight);
          innerDepth = Math.max(inner2[i].depth, innerDepth);
        }
      }
      innerHeight *= options.sizeMultiplier;
      innerDepth *= options.sizeMultiplier;
      var leftDelim;
      if (group.left === ".") {
        leftDelim = makeNullDelimiter(options, ["mopen"]);
      } else {
        leftDelim = makeLeftRightDelim(group.left, innerHeight, innerDepth, options, group.mode, ["mopen"]);
      }
      inner2.unshift(leftDelim);
      if (hadMiddle) {
        for (var _i = 1; _i < inner2.length; _i++) {
          var middleDelim = inner2[_i];
          if (isMiddleDelimNode(middleDelim)) {
            var isMiddle = middleDelim.isMiddle;
            inner2[_i] = makeLeftRightDelim(isMiddle.delim, innerHeight, innerDepth, isMiddle.options, group.mode, []);
          }
        }
      }
      var rightDelim;
      if (group.right === ".") {
        rightDelim = makeNullDelimiter(options, ["mclose"]);
      } else {
        var colorOptions = group.rightColor ? options.withColor(group.rightColor) : options;
        rightDelim = makeLeftRightDelim(group.right, innerHeight, innerDepth, colorOptions, group.mode, ["mclose"]);
      }
      inner2.push(rightDelim);
      return makeSpan(["minner"], inner2, options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      assertParsed(group);
      var inner2 = buildExpression2(group.body, options);
      if (group.left !== ".") {
        var leftNode = new MathNode("mo", [makeText(group.left, group.mode)]);
        leftNode.setAttribute("fence", "true");
        inner2.unshift(leftNode);
      }
      if (group.right !== ".") {
        var rightNode = new MathNode("mo", [makeText(group.right, group.mode)]);
        rightNode.setAttribute("fence", "true");
        if (group.rightColor) {
          rightNode.setAttribute("mathcolor", group.rightColor);
        }
        inner2.push(rightNode);
      }
      return makeRow(inner2);
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "middle",
    names: ["\\middle"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler: /* @__PURE__ */ __name((context, args) => {
      var delim = checkDelimiter(args[0], context);
      if (!context.parser.leftrightDepth) {
        throw new ParseError("\\middle without preceding \\left", delim);
      }
      return {
        type: "middle",
        mode: context.parser.mode,
        delim: delim.text
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var middleDelim;
      if (group.delim === ".") {
        middleDelim = makeNullDelimiter(options, []);
      } else {
        middleDelim = makeSizedDelim(group.delim, 1, options, group.mode, []);
        middleDelim.isMiddle = {
          delim: group.delim,
          options
        };
      }
      return middleDelim;
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var textNode = group.delim === "\\vert" || group.delim === "|" ? makeText("|", "text") : makeText(group.delim, group.mode);
      var middleNode = new MathNode("mo", [textNode]);
      middleNode.setAttribute("fence", "true");
      middleNode.setAttribute("lspace", "0.05em");
      middleNode.setAttribute("rspace", "0.05em");
      return middleNode;
    }, "mathmlBuilder")
  });
  var htmlBuilder$7 = /* @__PURE__ */ __name((group, options) => {
    var inner2 = wrapFragment(buildGroup$1(group.body, options), options);
    var label = group.label.slice(1);
    var scale = options.sizeMultiplier;
    var img;
    var imgShift;
    var isSingleChar = isCharacterBox(group.body);
    if (label === "sout") {
      img = makeSpan(["stretchy", "sout"]);
      img.height = options.fontMetrics().defaultRuleThickness / scale;
      imgShift = -0.5 * options.fontMetrics().xHeight;
    } else if (label === "phase") {
      var lineWeight = calculateSize({
        number: 0.6,
        unit: "pt"
      }, options);
      var clearance = calculateSize({
        number: 0.35,
        unit: "ex"
      }, options);
      var newOptions = options.havingBaseSizing();
      scale = scale / newOptions.sizeMultiplier;
      var angleHeight = inner2.height + inner2.depth + lineWeight + clearance;
      inner2.style.paddingLeft = makeEm(angleHeight / 2 + lineWeight);
      var viewBoxHeight = Math.floor(1e3 * angleHeight * scale);
      var path2 = phasePath(viewBoxHeight);
      var svgNode = new SvgNode([new PathNode("phase", path2)], {
        "width": "400em",
        "height": makeEm(viewBoxHeight / 1e3),
        "viewBox": "0 0 400000 " + viewBoxHeight,
        "preserveAspectRatio": "xMinYMin slice"
      });
      img = makeSvgSpan(["hide-tail"], [svgNode], options);
      img.style.height = makeEm(angleHeight);
      imgShift = inner2.depth + lineWeight + clearance;
    } else {
      if (/cancel/.test(label)) {
        if (!isSingleChar) {
          inner2.classes.push("cancel-pad");
        }
      } else if (label === "angl") {
        inner2.classes.push("anglpad");
      } else {
        inner2.classes.push("boxpad");
      }
      var topPad;
      var bottomPad;
      var ruleThickness = 0;
      if (/box/.test(label)) {
        ruleThickness = Math.max(
          options.fontMetrics().fboxrule,
          // default
          options.minRuleThickness
        );
        topPad = options.fontMetrics().fboxsep + (label === "colorbox" ? 0 : ruleThickness);
        bottomPad = topPad;
      } else if (label === "angl") {
        ruleThickness = Math.max(options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
        topPad = 4 * ruleThickness;
        bottomPad = Math.max(0, 0.25 - inner2.depth);
      } else {
        topPad = isSingleChar ? 0.2 : 0;
        bottomPad = topPad;
      }
      img = stretchyEnclose(inner2, label, topPad, bottomPad, options);
      if (/fbox|boxed|fcolorbox/.test(label)) {
        img.style.borderStyle = "solid";
        img.style.borderWidth = makeEm(ruleThickness);
      } else if (label === "angl" && ruleThickness !== 0.049) {
        img.style.borderTopWidth = makeEm(ruleThickness);
        img.style.borderRightWidth = makeEm(ruleThickness);
      }
      imgShift = inner2.depth + bottomPad;
      if (group.backgroundColor) {
        img.style.backgroundColor = group.backgroundColor;
        if (group.borderColor) {
          img.style.borderColor = group.borderColor;
        }
      }
    }
    var vlist;
    if (group.backgroundColor) {
      vlist = makeVList({
        positionType: "individualShift",
        children: [
          // Put the color background behind inner;
          {
            type: "elem",
            elem: img,
            shift: imgShift
          },
          {
            type: "elem",
            elem: inner2,
            shift: 0
          }
        ]
      });
    } else {
      var classes = /cancel|phase/.test(label) ? ["svg-align"] : [];
      vlist = makeVList({
        positionType: "individualShift",
        children: [
          // Write the \cancel stroke on top of inner.
          {
            type: "elem",
            elem: inner2,
            shift: 0
          },
          {
            type: "elem",
            elem: img,
            shift: imgShift,
            wrapperClasses: classes
          }
        ]
      });
    }
    if (/cancel/.test(label)) {
      vlist.height = inner2.height;
      vlist.depth = inner2.depth;
    }
    if (/cancel/.test(label) && !isSingleChar) {
      return makeSpan(["mord", "cancel-lap"], [vlist], options);
    } else {
      return makeSpan(["mord"], [vlist], options);
    }
  }, "htmlBuilder$7");
  var mathmlBuilder$6 = /* @__PURE__ */ __name((group, options) => {
    var fboxsep;
    var node = new MathNode(group.label.includes("colorbox") ? "mpadded" : "menclose", [buildGroup2(group.body, options)]);
    switch (group.label) {
      case "\\cancel":
        node.setAttribute("notation", "updiagonalstrike");
        break;
      case "\\bcancel":
        node.setAttribute("notation", "downdiagonalstrike");
        break;
      case "\\phase":
        node.setAttribute("notation", "phasorangle");
        break;
      case "\\sout":
        node.setAttribute("notation", "horizontalstrike");
        break;
      case "\\fbox":
        node.setAttribute("notation", "box");
        break;
      case "\\angl":
        node.setAttribute("notation", "actuarial");
        break;
      case "\\fcolorbox":
      case "\\colorbox":
        fboxsep = options.fontMetrics().fboxsep * options.fontMetrics().ptPerEm;
        node.setAttribute("width", "+" + 2 * fboxsep + "pt");
        node.setAttribute("height", "+" + 2 * fboxsep + "pt");
        node.setAttribute("lspace", fboxsep + "pt");
        node.setAttribute("voffset", fboxsep + "pt");
        if (group.label === "\\fcolorbox") {
          var thk = Math.max(
            options.fontMetrics().fboxrule,
            // default
            options.minRuleThickness
          );
          node.setAttribute("style", "border: " + makeEm(thk) + " solid " + group.borderColor);
        }
        break;
      case "\\xcancel":
        node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
        break;
    }
    if (group.backgroundColor) {
      node.setAttribute("mathbackground", group.backgroundColor);
    }
    return node;
  }, "mathmlBuilder$6");
  defineFunction({
    type: "enclose",
    names: ["\\colorbox"],
    props: {
      numArgs: 2,
      allowedInText: true,
      argTypes: ["color", "hbox"]
    },
    handler(_ref, args, optArgs) {
      var {
        parser,
        funcName
      } = _ref;
      var color = assertNodeType(args[0], "color-token").color;
      var body = args[1];
      return {
        type: "enclose",
        mode: parser.mode,
        label: funcName,
        backgroundColor: color,
        body
      };
    },
    htmlBuilder: htmlBuilder$7,
    mathmlBuilder: mathmlBuilder$6
  });
  defineFunction({
    type: "enclose",
    names: ["\\fcolorbox"],
    props: {
      numArgs: 3,
      allowedInText: true,
      argTypes: ["color", "color", "hbox"]
    },
    handler(_ref2, args, optArgs) {
      var {
        parser,
        funcName
      } = _ref2;
      var borderColor = assertNodeType(args[0], "color-token").color;
      var backgroundColor = assertNodeType(args[1], "color-token").color;
      var body = args[2];
      return {
        type: "enclose",
        mode: parser.mode,
        label: funcName,
        backgroundColor,
        borderColor,
        body
      };
    },
    htmlBuilder: htmlBuilder$7,
    mathmlBuilder: mathmlBuilder$6
  });
  defineFunction({
    type: "enclose",
    names: ["\\fbox"],
    props: {
      numArgs: 1,
      argTypes: ["hbox"],
      allowedInText: true
    },
    handler(_ref3, args) {
      var {
        parser
      } = _ref3;
      return {
        type: "enclose",
        mode: parser.mode,
        label: "\\fbox",
        body: args[0]
      };
    }
  });
  defineFunction({
    type: "enclose",
    names: ["\\cancel", "\\bcancel", "\\xcancel", "\\phase"],
    props: {
      numArgs: 1
    },
    handler(_ref4, args) {
      var {
        parser,
        funcName
      } = _ref4;
      var body = args[0];
      return {
        type: "enclose",
        mode: parser.mode,
        label: funcName,
        body
      };
    },
    htmlBuilder: htmlBuilder$7,
    mathmlBuilder: mathmlBuilder$6
  });
  defineFunction({
    type: "enclose",
    names: ["\\sout"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler(_ref5, args) {
      var {
        parser,
        funcName
      } = _ref5;
      if (parser.mode === "math") {
        parser.settings.reportNonstrict("mathVsSout", "LaTeX's \\sout works only in text mode");
      }
      var body = args[0];
      return {
        type: "enclose",
        mode: parser.mode,
        label: funcName,
        body
      };
    },
    htmlBuilder: htmlBuilder$7,
    mathmlBuilder: mathmlBuilder$6
  });
  defineFunction({
    type: "enclose",
    names: ["\\angl"],
    props: {
      numArgs: 1,
      argTypes: ["hbox"],
      allowedInText: false
    },
    handler(_ref6, args) {
      var {
        parser
      } = _ref6;
      return {
        type: "enclose",
        mode: parser.mode,
        label: "\\angl",
        body: args[0]
      };
    }
  });
  var _environments = {};
  function defineEnvironment(_ref) {
    var {
      type,
      names,
      props,
      handler,
      htmlBuilder: htmlBuilder3,
      mathmlBuilder: mathmlBuilder3
    } = _ref;
    var data = {
      type,
      numArgs: props.numArgs || 0,
      allowedInText: false,
      numOptionalArgs: 0,
      handler
    };
    for (var i = 0; i < names.length; ++i) {
      _environments[names[i]] = data;
    }
    if (htmlBuilder3) {
      _htmlGroupBuilders[type] = htmlBuilder3;
    }
    if (mathmlBuilder3) {
      _mathmlGroupBuilders[type] = mathmlBuilder3;
    }
  }
  __name(defineEnvironment, "defineEnvironment");
  var _macros = {};
  function defineMacro(name, body) {
    _macros[name] = body;
  }
  __name(defineMacro, "defineMacro");
  var SourceLocation = class _SourceLocation {
    static {
      __name(this, "SourceLocation");
    }
    // End offset, zero-based exclusive.
    constructor(lexer, start, end) {
      this.lexer = void 0;
      this.start = void 0;
      this.end = void 0;
      this.lexer = lexer;
      this.start = start;
      this.end = end;
    }
    /**
     * Merges two `SourceLocation`s from location providers, given they are
     * provided in order of appearance.
     * - Returns the first one's location if only the first is provided.
     * - Returns a merged range of the first and the last if both are provided
     *   and their lexers match.
     * - Otherwise, returns null.
     */
    static range(first, second) {
      if (!second) {
        return first && first.loc;
      } else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) {
        return null;
      } else {
        return new _SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
      }
    }
  };
  var Token2 = class _Token {
    static {
      __name(this, "Token");
    }
    // used in \noexpand
    constructor(text3, loc) {
      this.text = void 0;
      this.loc = void 0;
      this.noexpand = void 0;
      this.treatAsRelax = void 0;
      this.text = text3;
      this.loc = loc;
    }
    /**
     * Given a pair of tokens (this and endToken), compute a `Token` encompassing
     * the whole input range enclosed by these two.
     */
    range(endToken, text3) {
      return new _Token(text3, SourceLocation.range(this, endToken));
    }
  };
  function getHLines(parser) {
    var hlineInfo = [];
    parser.consumeSpaces();
    var nxt = parser.fetch().text;
    if (nxt === "\\relax") {
      parser.consume();
      parser.consumeSpaces();
      nxt = parser.fetch().text;
    }
    while (nxt === "\\hline" || nxt === "\\hdashline") {
      parser.consume();
      hlineInfo.push(nxt === "\\hdashline");
      parser.consumeSpaces();
      nxt = parser.fetch().text;
    }
    return hlineInfo;
  }
  __name(getHLines, "getHLines");
  var validateAmsEnvironmentContext = /* @__PURE__ */ __name((context) => {
    var settings = context.parser.settings;
    if (!settings.displayMode) {
      throw new ParseError("{" + context.envName + "} can be used only in display mode.");
    }
  }, "validateAmsEnvironmentContext");
  var gatherEnvironments = /* @__PURE__ */ new Set(["gather", "gather*"]);
  function getAutoTag(name) {
    if (!name.includes("ed")) {
      return !name.includes("*");
    }
  }
  __name(getAutoTag, "getAutoTag");
  function parseArray(parser, _ref, style2) {
    var {
      hskipBeforeAndAfter,
      addJot,
      cols,
      arraystretch,
      colSeparationType,
      autoTag,
      singleRow,
      emptySingleRow,
      maxNumCols,
      leqno
    } = _ref;
    parser.gullet.beginGroup();
    if (!singleRow) {
      parser.gullet.macros.set("\\cr", "\\\\\\relax");
    }
    if (!arraystretch) {
      var stretch = parser.gullet.expandMacroAsText("\\arraystretch");
      if (stretch == null) {
        arraystretch = 1;
      } else {
        arraystretch = parseFloat(stretch);
        if (!arraystretch || arraystretch < 0) {
          throw new ParseError("Invalid \\arraystretch: " + stretch);
        }
      }
    }
    parser.gullet.beginGroup();
    var row = [];
    var body = [row];
    var rowGaps = [];
    var hLinesBeforeRow = [];
    var tags = autoTag != null ? [] : void 0;
    function beginRow() {
      if (autoTag) {
        parser.gullet.macros.set("\\@eqnsw", "1", true);
      }
    }
    __name(beginRow, "beginRow");
    function endRow() {
      if (tags) {
        if (parser.gullet.macros.get("\\df@tag")) {
          tags.push(parser.subparse([new Token2("\\df@tag")]));
          parser.gullet.macros.set("\\df@tag", void 0, true);
        } else {
          tags.push(Boolean(autoTag) && parser.gullet.macros.get("\\@eqnsw") === "1");
        }
      }
    }
    __name(endRow, "endRow");
    beginRow();
    hLinesBeforeRow.push(getHLines(parser));
    while (true) {
      var cellBody = parser.parseExpression(false, singleRow ? "\\end" : "\\\\");
      parser.gullet.endGroup();
      parser.gullet.beginGroup();
      var cell = {
        type: "ordgroup",
        mode: parser.mode,
        body: cellBody
      };
      if (style2) {
        cell = {
          type: "styling",
          mode: parser.mode,
          style: style2,
          resetFont: true,
          body: [cell]
        };
      }
      row.push(cell);
      var next = parser.fetch().text;
      if (next === "&") {
        if (maxNumCols && row.length === maxNumCols) {
          if (singleRow || colSeparationType) {
            throw new ParseError("Too many tab characters: &", parser.nextToken);
          } else {
            parser.settings.reportNonstrict("textEnv", "Too few columns specified in the {array} column argument.");
          }
        }
        parser.consume();
      } else if (next === "\\end") {
        endRow();
        if (row.length === 1 && cell.type === "styling" && cell.body.length === 1 && cell.body[0].type === "ordgroup" && cell.body[0].body.length === 0 && (body.length > 1 || !emptySingleRow)) {
          body.pop();
        }
        if (hLinesBeforeRow.length < body.length + 1) {
          hLinesBeforeRow.push([]);
        }
        break;
      } else if (next === "\\\\") {
        parser.consume();
        var size = void 0;
        if (parser.gullet.future().text !== " ") {
          size = parser.parseSizeGroup(true);
        }
        rowGaps.push(size ? size.value : null);
        endRow();
        hLinesBeforeRow.push(getHLines(parser));
        row = [];
        body.push(row);
        beginRow();
      } else {
        throw new ParseError("Expected & or \\\\ or \\cr or \\end", parser.nextToken);
      }
    }
    parser.gullet.endGroup();
    parser.gullet.endGroup();
    return {
      type: "array",
      mode: parser.mode,
      addJot,
      arraystretch,
      body,
      cols,
      rowGaps,
      hskipBeforeAndAfter,
      hLinesBeforeRow,
      colSeparationType,
      tags,
      leqno
    };
  }
  __name(parseArray, "parseArray");
  function dCellStyle(envName) {
    if (envName.slice(0, 1) === "d") {
      return "display";
    } else {
      return "text";
    }
  }
  __name(dCellStyle, "dCellStyle");
  var htmlBuilder$6 = /* @__PURE__ */ __name(function htmlBuilder(group, options) {
    var r;
    var c;
    var nr = group.body.length;
    var hLinesBeforeRow = group.hLinesBeforeRow;
    var nc = 0;
    var body = new Array(nr);
    var hlines = [];
    var ruleThickness = Math.max(
      // From LaTeX \showthe\arrayrulewidth. Equals 0.04 em.
      options.fontMetrics().arrayRuleWidth,
      options.minRuleThickness
    );
    var pt = 1 / options.fontMetrics().ptPerEm;
    var arraycolsep = 5 * pt;
    if (group.colSeparationType && group.colSeparationType === "small") {
      var localMultiplier = options.havingStyle(Style$1.SCRIPT).sizeMultiplier;
      arraycolsep = 0.2778 * (localMultiplier / options.sizeMultiplier);
    }
    var baselineskip = group.colSeparationType === "CD" ? calculateSize({
      number: 3,
      unit: "ex"
    }, options) : 12 * pt;
    var jot = 3 * pt;
    var arrayskip = group.arraystretch * baselineskip;
    var arstrutHeight = 0.7 * arrayskip;
    var arstrutDepth = 0.3 * arrayskip;
    var totalHeight = 0;
    function setHLinePos(hlinesInGap) {
      for (var i = 0; i < hlinesInGap.length; ++i) {
        if (i > 0) {
          totalHeight += 0.25;
        }
        hlines.push({
          pos: totalHeight,
          isDashed: hlinesInGap[i]
        });
      }
    }
    __name(setHLinePos, "setHLinePos");
    setHLinePos(hLinesBeforeRow[0]);
    for (r = 0; r < group.body.length; ++r) {
      var inrow = group.body[r];
      var height = arstrutHeight;
      var depth = arstrutDepth;
      if (nc < inrow.length) {
        nc = inrow.length;
      }
      var outrow = {
        cells: new Array(inrow.length),
        height: 0,
        depth: 0,
        pos: 0
      };
      for (c = 0; c < inrow.length; ++c) {
        var elt = buildGroup$1(inrow[c], options);
        if (depth < elt.depth) {
          depth = elt.depth;
        }
        if (height < elt.height) {
          height = elt.height;
        }
        outrow.cells[c] = elt;
      }
      var rowGap = group.rowGaps[r];
      var gap = 0;
      if (rowGap) {
        gap = calculateSize(rowGap, options);
        if (gap > 0) {
          gap += arstrutDepth;
          if (depth < gap) {
            depth = gap;
          }
          gap = 0;
        }
      }
      if (group.addJot && r < group.body.length - 1) {
        depth += jot;
      }
      outrow.height = height;
      outrow.depth = depth;
      totalHeight += height;
      outrow.pos = totalHeight;
      totalHeight += depth + gap;
      body[r] = outrow;
      setHLinePos(hLinesBeforeRow[r + 1]);
    }
    var offset = totalHeight / 2 + options.fontMetrics().axisHeight;
    var colDescriptions = group.cols || [];
    var cols = [];
    var colSep;
    var colDescrNum;
    var tagSpans = [];
    if (group.tags && group.tags.some((tag2) => tag2)) {
      for (r = 0; r < nr; ++r) {
        var rw = body[r];
        var shift = rw.pos - offset;
        var tag = group.tags[r];
        var tagSpan = void 0;
        if (tag === true) {
          tagSpan = makeSpan(["eqn-num"], [], options);
        } else if (tag === false) {
          tagSpan = makeSpan([], [], options);
        } else {
          tagSpan = makeSpan([], buildExpression$1(tag, options, true), options);
        }
        tagSpan.depth = rw.depth;
        tagSpan.height = rw.height;
        tagSpans.push({
          type: "elem",
          elem: tagSpan,
          shift
        });
      }
    }
    for (
      c = 0, colDescrNum = 0;
      // Continue while either there are more columns or more column
      // descriptions, so trailing separators don't get lost.
      c < nc || colDescrNum < colDescriptions.length;
      ++c, ++colDescrNum
    ) {
      var _colDescr3;
      var colDescr = colDescriptions[colDescrNum];
      var firstSeparator = true;
      while (((_colDescr = colDescr) == null ? void 0 : _colDescr.type) === "separator") {
        var _colDescr;
        if (!firstSeparator) {
          colSep = makeSpan(["arraycolsep"], []);
          colSep.style.width = makeEm(options.fontMetrics().doubleRuleSep);
          cols.push(colSep);
        }
        if (colDescr.separator === "|" || colDescr.separator === ":") {
          var lineType = colDescr.separator === "|" ? "solid" : "dashed";
          var separator = makeSpan(["vertical-separator"], [], options);
          separator.style.height = makeEm(totalHeight);
          separator.style.borderRightWidth = makeEm(ruleThickness);
          separator.style.borderRightStyle = lineType;
          separator.style.margin = "0 " + makeEm(-ruleThickness / 2);
          var _shift = totalHeight - offset;
          if (_shift) {
            separator.style.verticalAlign = makeEm(-_shift);
          }
          cols.push(separator);
        } else {
          throw new ParseError("Invalid separator type: " + colDescr.separator);
        }
        colDescrNum++;
        colDescr = colDescriptions[colDescrNum];
        firstSeparator = false;
      }
      if (c >= nc) {
        continue;
      }
      var sepwidth = void 0;
      if (c > 0 || group.hskipBeforeAndAfter) {
        var _colDescr$pregap, _colDescr2;
        sepwidth = (_colDescr$pregap = (_colDescr2 = colDescr) == null ? void 0 : _colDescr2.pregap) != null ? _colDescr$pregap : arraycolsep;
        if (sepwidth !== 0) {
          colSep = makeSpan(["arraycolsep"], []);
          colSep.style.width = makeEm(sepwidth);
          cols.push(colSep);
        }
      }
      var colElems = [];
      for (r = 0; r < nr; ++r) {
        var row = body[r];
        var elem = row.cells[c];
        if (!elem) {
          continue;
        }
        var _shift2 = row.pos - offset;
        elem.depth = row.depth;
        elem.height = row.height;
        colElems.push({
          type: "elem",
          elem,
          shift: _shift2
        });
      }
      var colVList = makeVList({
        positionType: "individualShift",
        children: colElems
      });
      var colSpan = makeSpan(["col-align-" + (((_colDescr3 = colDescr) == null ? void 0 : _colDescr3.align) || "c")], [colVList]);
      cols.push(colSpan);
      if (c < nc - 1 || group.hskipBeforeAndAfter) {
        var _colDescr$postgap, _colDescr4;
        sepwidth = (_colDescr$postgap = (_colDescr4 = colDescr) == null ? void 0 : _colDescr4.postgap) != null ? _colDescr$postgap : arraycolsep;
        if (sepwidth !== 0) {
          colSep = makeSpan(["arraycolsep"], []);
          colSep.style.width = makeEm(sepwidth);
          cols.push(colSep);
        }
      }
    }
    var tableBody = makeSpan(["mtable"], cols);
    if (hlines.length > 0) {
      var line = makeLineSpan("hline", options, ruleThickness);
      var dashes = makeLineSpan("hdashline", options, ruleThickness);
      var vListElems = [{
        type: "elem",
        elem: tableBody,
        shift: 0
      }];
      while (hlines.length > 0) {
        var hline = hlines.pop();
        var lineShift = hline.pos - offset;
        if (hline.isDashed) {
          vListElems.push({
            type: "elem",
            elem: dashes,
            shift: lineShift
          });
        } else {
          vListElems.push({
            type: "elem",
            elem: line,
            shift: lineShift
          });
        }
      }
      tableBody = makeVList({
        positionType: "individualShift",
        children: vListElems
      });
    }
    if (tagSpans.length === 0) {
      return makeSpan(["mord"], [tableBody], options);
    } else {
      var eqnNumCol = makeVList({
        positionType: "individualShift",
        children: tagSpans
      });
      var tagCol = makeSpan(["tag"], [eqnNumCol], options);
      return makeFragment([tableBody, tagCol]);
    }
  }, "htmlBuilder");
  var alignMap = {
    c: "center ",
    l: "left ",
    r: "right "
  };
  var mathmlBuilder$5 = /* @__PURE__ */ __name(function mathmlBuilder(group, options) {
    var tbl = [];
    var glue = new MathNode("mtd", [], ["mtr-glue"]);
    var tag = new MathNode("mtd", [], ["mml-eqn-num"]);
    for (var i = 0; i < group.body.length; i++) {
      var rw = group.body[i];
      var row = [];
      for (var j = 0; j < rw.length; j++) {
        row.push(new MathNode("mtd", [buildGroup2(rw[j], options)]));
      }
      if (group.tags && group.tags[i]) {
        row.unshift(glue);
        row.push(glue);
        if (group.leqno) {
          row.unshift(tag);
        } else {
          row.push(tag);
        }
      }
      tbl.push(new MathNode("mtr", row));
    }
    var table2 = new MathNode("mtable", tbl);
    var gap = group.arraystretch === 0.5 ? 0.1 : 0.16 + group.arraystretch - 1 + (group.addJot ? 0.09 : 0);
    table2.setAttribute("rowspacing", makeEm(gap));
    var menclose = "";
    var align = "";
    if (group.cols && group.cols.length > 0) {
      var cols = group.cols;
      var columnLines = "";
      var prevTypeWasAlign = false;
      var iStart = 0;
      var iEnd = cols.length;
      if (cols[0].type === "separator") {
        menclose += "top ";
        iStart = 1;
      }
      if (cols[cols.length - 1].type === "separator") {
        menclose += "bottom ";
        iEnd -= 1;
      }
      for (var _i = iStart; _i < iEnd; _i++) {
        var col = cols[_i];
        if (col.type === "align") {
          align += alignMap[col.align];
          if (prevTypeWasAlign) {
            columnLines += "none ";
          }
          prevTypeWasAlign = true;
        } else if (col.type === "separator") {
          if (prevTypeWasAlign) {
            columnLines += col.separator === "|" ? "solid " : "dashed ";
            prevTypeWasAlign = false;
          }
        }
      }
      table2.setAttribute("columnalign", align.trim());
      if (/[sd]/.test(columnLines)) {
        table2.setAttribute("columnlines", columnLines.trim());
      }
    }
    if (group.colSeparationType === "align") {
      var _cols = group.cols || [];
      var spacing2 = "";
      for (var _i2 = 1; _i2 < _cols.length; _i2++) {
        spacing2 += _i2 % 2 ? "0em " : "1em ";
      }
      table2.setAttribute("columnspacing", spacing2.trim());
    } else if (group.colSeparationType === "alignat" || group.colSeparationType === "gather") {
      table2.setAttribute("columnspacing", "0em");
    } else if (group.colSeparationType === "small") {
      table2.setAttribute("columnspacing", "0.2778em");
    } else if (group.colSeparationType === "CD") {
      table2.setAttribute("columnspacing", "0.5em");
    } else {
      table2.setAttribute("columnspacing", "1em");
    }
    var rowLines = "";
    var hlines = group.hLinesBeforeRow;
    menclose += hlines[0].length > 0 ? "left " : "";
    menclose += hlines[hlines.length - 1].length > 0 ? "right " : "";
    for (var _i3 = 1; _i3 < hlines.length - 1; _i3++) {
      rowLines += hlines[_i3].length === 0 ? "none " : hlines[_i3][0] ? "dashed " : "solid ";
    }
    if (/[sd]/.test(rowLines)) {
      table2.setAttribute("rowlines", rowLines.trim());
    }
    if (menclose !== "") {
      table2 = new MathNode("menclose", [table2]);
      table2.setAttribute("notation", menclose.trim());
    }
    if (group.arraystretch && group.arraystretch < 1) {
      table2 = new MathNode("mstyle", [table2]);
      table2.setAttribute("scriptlevel", "1");
    }
    return table2;
  }, "mathmlBuilder");
  var alignedHandler = /* @__PURE__ */ __name(function alignedHandler2(context, args) {
    if (!context.envName.includes("ed")) {
      validateAmsEnvironmentContext(context);
    }
    var cols = [];
    var separationType = context.envName.includes("at") ? "alignat" : "align";
    var isSplit = context.envName === "split";
    var res = parseArray(context.parser, {
      cols,
      addJot: true,
      autoTag: isSplit ? void 0 : getAutoTag(context.envName),
      emptySingleRow: true,
      colSeparationType: separationType,
      maxNumCols: isSplit ? 2 : void 0,
      leqno: context.parser.settings.leqno
    }, "display");
    var numMaths = 0;
    var numCols = 0;
    var emptyGroup = {
      type: "ordgroup",
      mode: context.mode,
      body: []
    };
    if (args[0] && args[0].type === "ordgroup") {
      var arg0 = "";
      for (var i = 0; i < args[0].body.length; i++) {
        var textord2 = assertNodeType(args[0].body[i], "textord");
        arg0 += textord2.text;
      }
      numMaths = Number(arg0);
      numCols = numMaths * 2;
    }
    var isAligned = !numCols;
    res.body.forEach(function(row) {
      for (var _i4 = 1; _i4 < row.length; _i4 += 2) {
        var styling = assertNodeType(row[_i4], "styling");
        var ordgroup = assertNodeType(styling.body[0], "ordgroup");
        ordgroup.body.unshift(emptyGroup);
      }
      if (!isAligned) {
        var curMaths = row.length / 2;
        if (numMaths < curMaths) {
          throw new ParseError("Too many math in a row: " + ("expected " + numMaths + ", but got " + curMaths), row[0]);
        }
      } else if (numCols < row.length) {
        numCols = row.length;
      }
    });
    for (var _i5 = 0; _i5 < numCols; ++_i5) {
      var align = "r";
      var pregap = 0;
      if (_i5 % 2 === 1) {
        align = "l";
      } else if (_i5 > 0 && isAligned) {
        pregap = 1;
      }
      cols[_i5] = {
        type: "align",
        align,
        pregap,
        postgap: 0
      };
    }
    res.colSeparationType = isAligned ? "align" : "alignat";
    return res;
  }, "alignedHandler");
  defineEnvironment({
    type: "array",
    names: ["array", "darray"],
    props: {
      numArgs: 1
    },
    handler(context, args) {
      var symNode = checkSymbolNodeType(args[0]);
      var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
      var cols = colalign.map(function(nde) {
        var node = assertSymbolNodeType(nde);
        var ca = node.text;
        if ("lcr".includes(ca)) {
          return {
            type: "align",
            align: ca
          };
        } else if (ca === "|") {
          return {
            type: "separator",
            separator: "|"
          };
        } else if (ca === ":") {
          return {
            type: "separator",
            separator: ":"
          };
        }
        throw new ParseError("Unknown column alignment: " + ca, nde);
      });
      var res = {
        cols,
        hskipBeforeAndAfter: true,
        // \@preamble in lttab.dtx
        maxNumCols: cols.length
      };
      return parseArray(context.parser, res, dCellStyle(context.envName));
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix*", "pmatrix*", "bmatrix*", "Bmatrix*", "vmatrix*", "Vmatrix*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      var delimiters2 = {
        "matrix": null,
        "pmatrix": ["(", ")"],
        "bmatrix": ["[", "]"],
        "Bmatrix": ["\\{", "\\}"],
        "vmatrix": ["|", "|"],
        "Vmatrix": ["\\Vert", "\\Vert"]
      }[context.envName.replace("*", "")];
      var colAlign = "c";
      var payload = {
        hskipBeforeAndAfter: false,
        cols: [{
          type: "align",
          align: colAlign
        }]
      };
      if (context.envName.charAt(context.envName.length - 1) === "*") {
        var parser = context.parser;
        parser.consumeSpaces();
        if (parser.fetch().text === "[") {
          parser.consume();
          parser.consumeSpaces();
          colAlign = parser.fetch().text;
          if (!"lcr".includes(colAlign)) {
            throw new ParseError("Expected l or c or r", parser.nextToken);
          }
          parser.consume();
          parser.consumeSpaces();
          parser.expect("]");
          parser.consume();
          payload.cols = [{
            type: "align",
            align: colAlign
          }];
        }
      }
      var res = parseArray(context.parser, payload, dCellStyle(context.envName));
      var numCols = Math.max(0, ...res.body.map((row) => row.length));
      res.cols = new Array(numCols).fill({
        type: "align",
        align: colAlign
      });
      return delimiters2 ? {
        type: "leftright",
        mode: context.mode,
        body: [res],
        left: delimiters2[0],
        right: delimiters2[1],
        rightColor: void 0
        // \right uninfluenced by \color in array
      } : res;
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["smallmatrix"],
    props: {
      numArgs: 0
    },
    handler(context) {
      var payload = {
        arraystretch: 0.5
      };
      var res = parseArray(context.parser, payload, "script");
      res.colSeparationType = "small";
      return res;
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["subarray"],
    props: {
      numArgs: 1
    },
    handler(context, args) {
      var symNode = checkSymbolNodeType(args[0]);
      var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
      var cols = colalign.map(function(nde) {
        var node = assertSymbolNodeType(nde);
        var ca = node.text;
        if ("lc".includes(ca)) {
          return {
            type: "align",
            align: ca
          };
        }
        throw new ParseError("Unknown column alignment: " + ca, nde);
      });
      if (cols.length > 1) {
        throw new ParseError("{subarray} can contain only one column");
      }
      var payload = {
        cols,
        hskipBeforeAndAfter: false,
        arraystretch: 0.5
      };
      var res = parseArray(context.parser, payload, "script");
      if (res.body.length > 0 && res.body[0].length > 1) {
        throw new ParseError("{subarray} can contain only one column");
      }
      return res;
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["cases", "dcases", "rcases", "drcases"],
    props: {
      numArgs: 0
    },
    handler(context) {
      var payload = {
        arraystretch: 1.2,
        cols: [{
          type: "align",
          align: "l",
          pregap: 0,
          // TODO(kevinb) get the current style.
          // For now we use the metrics for TEXT style which is what we were
          // doing before.  Before attempting to get the current style we
          // should look at TeX's behavior especially for \over and matrices.
          postgap: 1
          /* 1em quad */
        }, {
          type: "align",
          align: "l",
          pregap: 0,
          postgap: 0
        }]
      };
      var res = parseArray(context.parser, payload, dCellStyle(context.envName));
      return {
        type: "leftright",
        mode: context.mode,
        body: [res],
        left: context.envName.includes("r") ? "." : "\\{",
        right: context.envName.includes("r") ? "\\}" : ".",
        rightColor: void 0
      };
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["align", "align*", "aligned", "split"],
    props: {
      numArgs: 0
    },
    handler: alignedHandler,
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["gathered", "gather", "gather*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      if (gatherEnvironments.has(context.envName)) {
        validateAmsEnvironmentContext(context);
      }
      var res = {
        cols: [{
          type: "align",
          align: "c"
        }],
        addJot: true,
        colSeparationType: "gather",
        autoTag: getAutoTag(context.envName),
        emptySingleRow: true,
        leqno: context.parser.settings.leqno
      };
      return parseArray(context.parser, res, "display");
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["alignat", "alignat*", "alignedat"],
    props: {
      numArgs: 1
    },
    handler: alignedHandler,
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["equation", "equation*"],
    props: {
      numArgs: 0
    },
    handler(context) {
      validateAmsEnvironmentContext(context);
      var res = {
        autoTag: getAutoTag(context.envName),
        emptySingleRow: true,
        singleRow: true,
        maxNumCols: 1,
        leqno: context.parser.settings.leqno
      };
      return parseArray(context.parser, res, "display");
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineEnvironment({
    type: "array",
    names: ["CD"],
    props: {
      numArgs: 0
    },
    handler(context) {
      validateAmsEnvironmentContext(context);
      return parseCD(context.parser);
    },
    htmlBuilder: htmlBuilder$6,
    mathmlBuilder: mathmlBuilder$5
  });
  defineMacro("\\nonumber", "\\gdef\\@eqnsw{0}");
  defineMacro("\\notag", "\\nonumber");
  defineFunction({
    type: "text",
    // Doesn't matter what this is.
    names: ["\\hline", "\\hdashline"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: true
    },
    handler(context, args) {
      throw new ParseError(context.funcName + " valid only within array environment");
    }
  });
  var environments = _environments;
  defineFunction({
    type: "environment",
    names: ["\\begin", "\\end"],
    props: {
      numArgs: 1,
      argTypes: ["text"]
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      var nameGroup = args[0];
      if (nameGroup.type !== "ordgroup") {
        throw new ParseError("Invalid environment name", nameGroup);
      }
      var envName = "";
      for (var i = 0; i < nameGroup.body.length; ++i) {
        envName += assertNodeType(nameGroup.body[i], "textord").text;
      }
      if (funcName === "\\begin") {
        if (!environments.hasOwnProperty(envName)) {
          throw new ParseError("No such environment: " + envName, nameGroup);
        }
        var env = environments[envName];
        var {
          args: _args,
          optArgs
        } = parser.parseArguments("\\begin{" + envName + "}", env);
        var context = {
          mode: parser.mode,
          envName,
          parser
        };
        var result = env.handler(context, _args, optArgs);
        parser.expect("\\end", false);
        var endNameToken = parser.nextToken;
        var end = assertNodeType(parser.parseFunction(), "environment");
        if (end.name !== envName) {
          throw new ParseError("Mismatch: \\begin{" + envName + "} matched by \\end{" + end.name + "}", endNameToken);
        }
        return result;
      }
      return {
        type: "environment",
        mode: parser.mode,
        name: envName,
        nameGroup
      };
    }
  });
  var htmlBuilder$5 = /* @__PURE__ */ __name((group, options) => {
    var font = group.font;
    var newOptions = options.withFont(font);
    return buildGroup$1(group.body, newOptions);
  }, "htmlBuilder$5");
  var mathmlBuilder$4 = /* @__PURE__ */ __name((group, options) => {
    var font = group.font;
    var newOptions = options.withFont(font);
    return buildGroup2(group.body, newOptions);
  }, "mathmlBuilder$4");
  var fontAliases = {
    "\\Bbb": "\\mathbb",
    "\\bold": "\\mathbf",
    "\\frak": "\\mathfrak"
  };
  defineFunction({
    type: "font",
    names: [
      // styles, except \boldsymbol defined below
      "\\mathrm",
      "\\mathit",
      "\\mathbf",
      "\\mathnormal",
      "\\mathsfit",
      // families
      "\\mathbb",
      "\\mathcal",
      "\\mathfrak",
      "\\mathscr",
      "\\mathsf",
      "\\mathtt",
      // aliases, except \bm defined below
      "\\Bbb",
      "\\bold",
      "\\frak"
    ],
    props: {
      numArgs: 1,
      allowedInArgument: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var body = normalizeArgument(args[0]);
      var func = funcName;
      if (func in fontAliases) {
        func = fontAliases[func];
      }
      return {
        type: "font",
        mode: parser.mode,
        font: func.slice(1),
        body
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$5,
    mathmlBuilder: mathmlBuilder$4
  });
  defineFunction({
    type: "mclass",
    names: ["\\boldsymbol", "\\bm"],
    props: {
      numArgs: 1
    },
    handler: /* @__PURE__ */ __name((_ref2, args) => {
      var {
        parser
      } = _ref2;
      var body = args[0];
      return {
        type: "mclass",
        mode: parser.mode,
        mclass: binrelClass(body),
        body: [{
          type: "font",
          mode: parser.mode,
          font: "boldsymbol",
          body
        }],
        isCharacterBox: isCharacterBox(body)
      };
    }, "handler")
  });
  defineFunction({
    type: "font",
    names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref3, args) => {
      var {
        parser,
        funcName,
        breakOnTokenText
      } = _ref3;
      var {
        mode
      } = parser;
      var body = parser.parseExpression(true, breakOnTokenText);
      return {
        type: "font",
        mode,
        font: "math" + funcName.slice(1),
        body: {
          type: "ordgroup",
          mode: parser.mode,
          body
        }
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$5,
    mathmlBuilder: mathmlBuilder$4
  });
  var htmlBuilder$4 = /* @__PURE__ */ __name((group, options) => {
    var style2 = options.style;
    var nstyle = style2.fracNum();
    var dstyle = style2.fracDen();
    var newOptions;
    newOptions = options.havingStyle(nstyle);
    var numerm = buildGroup$1(group.numer, newOptions, options);
    if (group.continued) {
      var hStrut = 8.5 / options.fontMetrics().ptPerEm;
      var dStrut = 3.5 / options.fontMetrics().ptPerEm;
      numerm.height = numerm.height < hStrut ? hStrut : numerm.height;
      numerm.depth = numerm.depth < dStrut ? dStrut : numerm.depth;
    }
    newOptions = options.havingStyle(dstyle);
    var denomm = buildGroup$1(group.denom, newOptions, options);
    var rule;
    var ruleWidth;
    var ruleSpacing;
    if (group.hasBarLine) {
      if (group.barSize) {
        ruleWidth = calculateSize(group.barSize, options);
        rule = makeLineSpan("frac-line", options, ruleWidth);
      } else {
        rule = makeLineSpan("frac-line", options);
      }
      ruleWidth = rule.height;
      ruleSpacing = rule.height;
    } else {
      rule = null;
      ruleWidth = 0;
      ruleSpacing = options.fontMetrics().defaultRuleThickness;
    }
    var numShift;
    var clearance;
    var denomShift;
    if (style2.size === Style$1.DISPLAY.size) {
      numShift = options.fontMetrics().num1;
      if (ruleWidth > 0) {
        clearance = 3 * ruleSpacing;
      } else {
        clearance = 7 * ruleSpacing;
      }
      denomShift = options.fontMetrics().denom1;
    } else {
      if (ruleWidth > 0) {
        numShift = options.fontMetrics().num2;
        clearance = ruleSpacing;
      } else {
        numShift = options.fontMetrics().num3;
        clearance = 3 * ruleSpacing;
      }
      denomShift = options.fontMetrics().denom2;
    }
    var frac;
    if (!rule) {
      var candidateClearance = numShift - numerm.depth - (denomm.height - denomShift);
      if (candidateClearance < clearance) {
        numShift += 0.5 * (clearance - candidateClearance);
        denomShift += 0.5 * (clearance - candidateClearance);
      }
      frac = makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: denomm,
          shift: denomShift
        }, {
          type: "elem",
          elem: numerm,
          shift: -numShift
        }]
      });
    } else {
      var axisHeight = options.fontMetrics().axisHeight;
      if (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth) < clearance) {
        numShift += clearance - (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth));
      }
      if (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift) < clearance) {
        denomShift += clearance - (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift));
      }
      var midShift = -(axisHeight - 0.5 * ruleWidth);
      frac = makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: denomm,
          shift: denomShift
        }, {
          type: "elem",
          elem: rule,
          shift: midShift
        }, {
          type: "elem",
          elem: numerm,
          shift: -numShift
        }]
      });
    }
    newOptions = options.havingStyle(style2);
    frac.height *= newOptions.sizeMultiplier / options.sizeMultiplier;
    frac.depth *= newOptions.sizeMultiplier / options.sizeMultiplier;
    var delimSize;
    if (style2.size === Style$1.DISPLAY.size) {
      delimSize = options.fontMetrics().delim1;
    } else if (style2.size === Style$1.SCRIPTSCRIPT.size) {
      delimSize = options.havingStyle(Style$1.SCRIPT).fontMetrics().delim2;
    } else {
      delimSize = options.fontMetrics().delim2;
    }
    var leftDelim;
    var rightDelim;
    if (group.leftDelim == null) {
      leftDelim = makeNullDelimiter(options, ["mopen"]);
    } else {
      leftDelim = makeCustomSizedDelim(group.leftDelim, delimSize, true, options.havingStyle(style2), group.mode, ["mopen"]);
    }
    if (group.continued) {
      rightDelim = makeSpan([]);
    } else if (group.rightDelim == null) {
      rightDelim = makeNullDelimiter(options, ["mclose"]);
    } else {
      rightDelim = makeCustomSizedDelim(group.rightDelim, delimSize, true, options.havingStyle(style2), group.mode, ["mclose"]);
    }
    return makeSpan(["mord"].concat(newOptions.sizingClasses(options)), [leftDelim, makeSpan(["mfrac"], [frac]), rightDelim], options);
  }, "htmlBuilder$4");
  var mathmlBuilder$3 = /* @__PURE__ */ __name((group, options) => {
    var node = new MathNode("mfrac", [buildGroup2(group.numer, options), buildGroup2(group.denom, options)]);
    if (!group.hasBarLine) {
      node.setAttribute("linethickness", "0px");
    } else if (group.barSize) {
      var ruleWidth = calculateSize(group.barSize, options);
      node.setAttribute("linethickness", makeEm(ruleWidth));
    }
    if (group.leftDelim != null || group.rightDelim != null) {
      var withDelims = [];
      if (group.leftDelim != null) {
        var leftOp = new MathNode("mo", [new TextNode(group.leftDelim.replace("\\", ""))]);
        leftOp.setAttribute("fence", "true");
        withDelims.push(leftOp);
      }
      withDelims.push(node);
      if (group.rightDelim != null) {
        var rightOp = new MathNode("mo", [new TextNode(group.rightDelim.replace("\\", ""))]);
        rightOp.setAttribute("fence", "true");
        withDelims.push(rightOp);
      }
      return makeRow(withDelims);
    }
    return node;
  }, "mathmlBuilder$3");
  var wrapWithStyle = /* @__PURE__ */ __name((frac, style2) => {
    if (!style2) {
      return frac;
    }
    var wrapper = {
      type: "styling",
      mode: frac.mode,
      style: style2,
      body: [frac]
    };
    return wrapper;
  }, "wrapWithStyle");
  defineFunction({
    type: "genfrac",
    names: [
      "\\cfrac",
      "\\dfrac",
      "\\frac",
      "\\tfrac",
      "\\dbinom",
      "\\binom",
      "\\tbinom",
      "\\\\atopfrac",
      // can’t be entered directly
      "\\\\bracefrac",
      "\\\\brackfrac"
      // ditto
    ],
    props: {
      numArgs: 2,
      allowedInArgument: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var numer = args[0];
      var denom = args[1];
      var hasBarLine;
      var leftDelim = null;
      var rightDelim = null;
      switch (funcName) {
        case "\\cfrac":
        case "\\dfrac":
        case "\\frac":
        case "\\tfrac":
          hasBarLine = true;
          break;
        case "\\\\atopfrac":
          hasBarLine = false;
          break;
        case "\\dbinom":
        case "\\binom":
        case "\\tbinom":
          hasBarLine = false;
          leftDelim = "(";
          rightDelim = ")";
          break;
        case "\\\\bracefrac":
          hasBarLine = false;
          leftDelim = "\\{";
          rightDelim = "\\}";
          break;
        case "\\\\brackfrac":
          hasBarLine = false;
          leftDelim = "[";
          rightDelim = "]";
          break;
        default:
          throw new Error("Unrecognized genfrac command");
      }
      var continued = funcName === "\\cfrac";
      var style2 = null;
      if (continued || funcName.startsWith("\\d")) {
        style2 = "display";
      } else if (funcName.startsWith("\\t")) {
        style2 = "text";
      }
      return wrapWithStyle({
        type: "genfrac",
        mode: parser.mode,
        numer,
        denom,
        continued,
        hasBarLine,
        leftDelim,
        rightDelim,
        barSize: null
      }, style2);
    }, "handler"),
    htmlBuilder: htmlBuilder$4,
    mathmlBuilder: mathmlBuilder$3
  });
  defineFunction({
    type: "infix",
    names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
    props: {
      numArgs: 0,
      infix: true
    },
    handler(_ref2) {
      var {
        parser,
        funcName,
        token
      } = _ref2;
      var replaceWith;
      switch (funcName) {
        case "\\over":
          replaceWith = "\\frac";
          break;
        case "\\choose":
          replaceWith = "\\binom";
          break;
        case "\\atop":
          replaceWith = "\\\\atopfrac";
          break;
        case "\\brace":
          replaceWith = "\\\\bracefrac";
          break;
        case "\\brack":
          replaceWith = "\\\\brackfrac";
          break;
        default:
          throw new Error("Unrecognized infix genfrac command");
      }
      return {
        type: "infix",
        mode: parser.mode,
        replaceWith,
        token
      };
    }
  });
  var stylArray = ["display", "text", "script", "scriptscript"];
  var delimFromValue = /* @__PURE__ */ __name(function delimFromValue2(delimString) {
    var delim = null;
    if (delimString.length > 0) {
      delim = delimString;
      delim = delim === "." ? null : delim;
    }
    return delim;
  }, "delimFromValue");
  defineFunction({
    type: "genfrac",
    names: ["\\genfrac"],
    props: {
      numArgs: 6,
      allowedInArgument: true,
      argTypes: ["math", "math", "size", "text", "math", "math"]
    },
    handler(_ref3, args) {
      var {
        parser
      } = _ref3;
      var numer = args[4];
      var denom = args[5];
      var leftNode = normalizeArgument(args[0]);
      var leftDelim = leftNode.type === "atom" && leftNode.family === "open" ? delimFromValue(leftNode.text) : null;
      var rightNode = normalizeArgument(args[1]);
      var rightDelim = rightNode.type === "atom" && rightNode.family === "close" ? delimFromValue(rightNode.text) : null;
      var barNode = assertNodeType(args[2], "size");
      var hasBarLine;
      var barSize = null;
      if (barNode.isBlank) {
        hasBarLine = true;
      } else {
        barSize = barNode.value;
        hasBarLine = barSize.number > 0;
      }
      var size = null;
      var styl = args[3];
      if (styl.type === "ordgroup") {
        if (styl.body.length > 0) {
          var textOrd = assertNodeType(styl.body[0], "textord");
          size = stylArray[Number(textOrd.text)];
        }
      } else {
        styl = assertNodeType(styl, "textord");
        size = stylArray[Number(styl.text)];
      }
      return wrapWithStyle({
        type: "genfrac",
        mode: parser.mode,
        numer,
        denom,
        continued: false,
        hasBarLine,
        barSize,
        leftDelim,
        rightDelim
      }, size);
    }
  });
  defineFunction({
    type: "infix",
    names: ["\\above"],
    props: {
      numArgs: 1,
      argTypes: ["size"],
      infix: true
    },
    handler(_ref4, args) {
      var {
        parser,
        funcName,
        token
      } = _ref4;
      return {
        type: "infix",
        mode: parser.mode,
        replaceWith: "\\\\abovefrac",
        size: assertNodeType(args[0], "size").value,
        token
      };
    }
  });
  defineFunction({
    type: "genfrac",
    names: ["\\\\abovefrac"],
    props: {
      numArgs: 3,
      argTypes: ["math", "size", "math"]
    },
    handler: /* @__PURE__ */ __name((_ref5, args) => {
      var {
        parser,
        funcName
      } = _ref5;
      var numer = args[0];
      var barSize = assertNodeType(args[1], "infix").size;
      if (!barSize) {
        throw new Error("\\\\abovefrac expected size, but got " + String(barSize));
      }
      var denom = args[2];
      var hasBarLine = barSize.number > 0;
      return {
        type: "genfrac",
        mode: parser.mode,
        numer,
        denom,
        continued: false,
        hasBarLine,
        barSize,
        leftDelim: null,
        rightDelim: null
      };
    }, "handler")
  });
  var htmlBuilder$3 = /* @__PURE__ */ __name((grp, options) => {
    var style2 = options.style;
    var supSubGroup;
    var group;
    if (grp.type === "supsub") {
      supSubGroup = grp.sup ? buildGroup$1(grp.sup, options.havingStyle(style2.sup()), options) : buildGroup$1(grp.sub, options.havingStyle(style2.sub()), options);
      group = assertNodeType(grp.base, "horizBrace");
    } else {
      group = assertNodeType(grp, "horizBrace");
    }
    var body = buildGroup$1(group.base, options.havingBaseStyle(Style$1.DISPLAY));
    var braceBody = stretchySvg(group, options);
    var vlist;
    if (group.isOver) {
      vlist = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: body
        }, {
          type: "kern",
          size: 0.1
        }, {
          type: "elem",
          elem: braceBody,
          wrapperClasses: ["svg-align"]
        }]
      });
    } else {
      vlist = makeVList({
        positionType: "bottom",
        positionData: body.depth + 0.1 + braceBody.height,
        children: [{
          type: "elem",
          elem: braceBody,
          wrapperClasses: ["svg-align"]
        }, {
          type: "kern",
          size: 0.1
        }, {
          type: "elem",
          elem: body
        }]
      });
    }
    if (supSubGroup) {
      var vSpan = makeSpan(["minner", group.isOver ? "mover" : "munder"], [vlist], options);
      if (group.isOver) {
        vlist = makeVList({
          positionType: "firstBaseline",
          children: [{
            type: "elem",
            elem: vSpan
          }, {
            type: "kern",
            size: 0.2
          }, {
            type: "elem",
            elem: supSubGroup
          }]
        });
      } else {
        vlist = makeVList({
          positionType: "bottom",
          positionData: vSpan.depth + 0.2 + supSubGroup.height + supSubGroup.depth,
          children: [{
            type: "elem",
            elem: supSubGroup
          }, {
            type: "kern",
            size: 0.2
          }, {
            type: "elem",
            elem: vSpan
          }]
        });
      }
    }
    return makeSpan(["minner", group.isOver ? "mover" : "munder"], [vlist], options);
  }, "htmlBuilder$3");
  var mathmlBuilder$2 = /* @__PURE__ */ __name((group, options) => {
    var accentNode = stretchyMathML(group.label);
    return new MathNode(group.isOver ? "mover" : "munder", [buildGroup2(group.base, options), accentNode]);
  }, "mathmlBuilder$2");
  defineFunction({
    type: "horizBrace",
    names: ["\\overbrace", "\\underbrace", "\\overbracket", "\\underbracket"],
    props: {
      numArgs: 1
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      return {
        type: "horizBrace",
        mode: parser.mode,
        label: funcName,
        isOver: funcName.includes("\\over"),
        base: args[0]
      };
    },
    htmlBuilder: htmlBuilder$3,
    mathmlBuilder: mathmlBuilder$2
  });
  defineFunction({
    type: "href",
    names: ["\\href"],
    props: {
      numArgs: 2,
      argTypes: ["url", "original"],
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser
      } = _ref;
      var body = args[1];
      var href = assertNodeType(args[0], "url").url;
      if (!parser.settings.isTrusted({
        command: "\\href",
        url: href
      })) {
        return parser.formatUnsupportedCmd("\\href");
      }
      return {
        type: "href",
        mode: parser.mode,
        href,
        body: ordargument(body)
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var elements = buildExpression$1(group.body, options, false);
      return makeAnchor(group.href, [], elements, options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var math2 = buildExpressionRow(group.body, options);
      if (!(math2 instanceof MathNode)) {
        math2 = new MathNode("mrow", [math2]);
      }
      math2.setAttribute("href", group.href);
      return math2;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "href",
    names: ["\\url"],
    props: {
      numArgs: 1,
      argTypes: ["url"],
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref2, args) => {
      var {
        parser
      } = _ref2;
      var href = assertNodeType(args[0], "url").url;
      if (!parser.settings.isTrusted({
        command: "\\url",
        url: href
      })) {
        return parser.formatUnsupportedCmd("\\url");
      }
      var chars = [];
      for (var i = 0; i < href.length; i++) {
        var c = href[i];
        if (c === "~") {
          c = "\\textasciitilde";
        }
        chars.push({
          type: "textord",
          mode: "text",
          text: c
        });
      }
      var body = {
        type: "text",
        mode: parser.mode,
        font: "\\texttt",
        body: chars
      };
      return {
        type: "href",
        mode: parser.mode,
        href,
        body: ordargument(body)
      };
    }, "handler")
  });
  defineFunction({
    type: "hbox",
    names: ["\\hbox"],
    props: {
      numArgs: 1,
      argTypes: ["text"],
      allowedInText: true,
      primitive: true
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      return {
        type: "hbox",
        mode: parser.mode,
        body: ordargument(args[0])
      };
    },
    htmlBuilder(group, options) {
      var elements = buildExpression$1(group.body, options.withFont(""), false);
      return makeFragment(elements);
    },
    mathmlBuilder(group, options) {
      return new MathNode("mrow", buildExpression2(group.body, options.withFont("")));
    }
  });
  defineFunction({
    type: "html",
    names: ["\\htmlClass", "\\htmlId", "\\htmlStyle", "\\htmlData"],
    props: {
      numArgs: 2,
      argTypes: ["raw", "original"],
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName,
        token
      } = _ref;
      var value = assertNodeType(args[0], "raw").string;
      var body = args[1];
      if (parser.settings.strict) {
        parser.settings.reportNonstrict("htmlExtension", "HTML extension is disabled on strict mode");
      }
      var trustContext;
      var attributes = {};
      switch (funcName) {
        case "\\htmlClass":
          attributes.class = value;
          trustContext = {
            command: "\\htmlClass",
            class: value
          };
          break;
        case "\\htmlId":
          attributes.id = value;
          trustContext = {
            command: "\\htmlId",
            id: value
          };
          break;
        case "\\htmlStyle":
          attributes.style = value;
          trustContext = {
            command: "\\htmlStyle",
            style: value
          };
          break;
        case "\\htmlData": {
          var data = value.split(",");
          for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var firstEquals = item.indexOf("=");
            if (firstEquals < 0) {
              throw new ParseError("\\htmlData key/value '" + item + "' missing equals sign");
            }
            var key = item.slice(0, firstEquals);
            var _value = item.slice(firstEquals + 1);
            attributes["data-" + key.trim()] = _value;
          }
          trustContext = {
            command: "\\htmlData",
            attributes
          };
          break;
        }
        default:
          throw new Error("Unrecognized html command");
      }
      if (!parser.settings.isTrusted(trustContext)) {
        return parser.formatUnsupportedCmd(funcName);
      }
      return {
        type: "html",
        mode: parser.mode,
        attributes,
        body: ordargument(body)
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var elements = buildExpression$1(group.body, options, false);
      var classes = ["enclosing"];
      if (group.attributes.class) {
        classes.push(...group.attributes.class.trim().split(/\s+/));
      }
      var span = makeSpan(classes, elements, options);
      for (var attr in group.attributes) {
        if (attr !== "class" && group.attributes.hasOwnProperty(attr)) {
          span.setAttribute(attr, group.attributes[attr]);
        }
      }
      return span;
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      return buildExpressionRow(group.body, options);
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "htmlmathml",
    names: ["\\html@mathml"],
    props: {
      numArgs: 2,
      allowedInArgument: true,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser
      } = _ref;
      return {
        type: "htmlmathml",
        mode: parser.mode,
        html: ordargument(args[0]),
        mathml: ordargument(args[1])
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var elements = buildExpression$1(group.html, options, false);
      return makeFragment(elements);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      return buildExpressionRow(group.mathml, options);
    }, "mathmlBuilder")
  });
  var sizeData = /* @__PURE__ */ __name(function sizeData2(str) {
    if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) {
      return {
        number: +str,
        unit: "bp"
      };
    } else {
      var match2 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);
      if (!match2) {
        throw new ParseError("Invalid size: '" + str + "' in \\includegraphics");
      }
      var data = {
        number: +(match2[1] + match2[2]),
        // sign + magnitude, cast to number
        unit: match2[3]
      };
      if (!validUnit(data)) {
        throw new ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
      }
      return data;
    }
  }, "sizeData");
  defineFunction({
    type: "includegraphics",
    names: ["\\includegraphics"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1,
      argTypes: ["raw", "url"],
      allowedInText: false
    },
    handler: /* @__PURE__ */ __name((_ref, args, optArgs) => {
      var {
        parser
      } = _ref;
      var width = {
        number: 0,
        unit: "em"
      };
      var height = {
        number: 0.9,
        unit: "em"
      };
      var totalheight = {
        number: 0,
        unit: "em"
      };
      var alt = "";
      if (optArgs[0]) {
        var attributeStr = assertNodeType(optArgs[0], "raw").string;
        var attributes = attributeStr.split(",");
        for (var i = 0; i < attributes.length; i++) {
          var keyVal = attributes[i].split("=");
          if (keyVal.length === 2) {
            var str = keyVal[1].trim();
            switch (keyVal[0].trim()) {
              case "alt":
                alt = str;
                break;
              case "width":
                width = sizeData(str);
                break;
              case "height":
                height = sizeData(str);
                break;
              case "totalheight":
                totalheight = sizeData(str);
                break;
              default:
                throw new ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.");
            }
          }
        }
      }
      var src = assertNodeType(args[0], "url").url;
      if (alt === "") {
        alt = src;
        alt = alt.replace(/^.*[\\/]/, "");
        alt = alt.substring(0, alt.lastIndexOf("."));
      }
      if (!parser.settings.isTrusted({
        command: "\\includegraphics",
        url: src
      })) {
        return parser.formatUnsupportedCmd("\\includegraphics");
      }
      return {
        type: "includegraphics",
        mode: parser.mode,
        alt,
        width,
        height,
        totalheight,
        src
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var height = calculateSize(group.height, options);
      var depth = 0;
      if (group.totalheight.number > 0) {
        depth = calculateSize(group.totalheight, options) - height;
      }
      var width = 0;
      if (group.width.number > 0) {
        width = calculateSize(group.width, options);
      }
      var style2 = {
        height: makeEm(height + depth)
      };
      if (width > 0) {
        style2.width = makeEm(width);
      }
      if (depth > 0) {
        style2.verticalAlign = makeEm(-depth);
      }
      var node = new Img(group.src, group.alt, style2);
      node.height = height;
      node.depth = depth;
      return node;
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var node = new MathNode("mglyph", []);
      node.setAttribute("alt", group.alt);
      var height = calculateSize(group.height, options);
      var depth = 0;
      if (group.totalheight.number > 0) {
        depth = calculateSize(group.totalheight, options) - height;
        node.setAttribute("valign", makeEm(-depth));
      }
      node.setAttribute("height", makeEm(height + depth));
      if (group.width.number > 0) {
        var width = calculateSize(group.width, options);
        node.setAttribute("width", makeEm(width));
      }
      node.setAttribute("src", group.src);
      return node;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "kern",
    names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
    props: {
      numArgs: 1,
      argTypes: ["size"],
      primitive: true,
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      var size = assertNodeType(args[0], "size");
      if (parser.settings.strict) {
        var mathFunction = funcName[1] === "m";
        var muUnit = size.value.unit === "mu";
        if (mathFunction) {
          if (!muUnit) {
            parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " supports only mu units, " + ("not " + size.value.unit + " units"));
          }
          if (parser.mode !== "math") {
            parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " works only in math mode");
          }
        } else {
          if (muUnit) {
            parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " doesn't support mu units");
          }
        }
      }
      return {
        type: "kern",
        mode: parser.mode,
        dimension: size.value
      };
    },
    htmlBuilder(group, options) {
      return makeGlue(group.dimension, options);
    },
    mathmlBuilder(group, options) {
      var dimension = calculateSize(group.dimension, options);
      return new SpaceNode(dimension);
    }
  });
  defineFunction({
    type: "lap",
    names: ["\\mathllap", "\\mathrlap", "\\mathclap"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var body = args[0];
      return {
        type: "lap",
        mode: parser.mode,
        alignment: funcName.slice(5),
        body
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var inner2;
      if (group.alignment === "clap") {
        inner2 = makeSpan([], [buildGroup$1(group.body, options)]);
        inner2 = makeSpan(["inner"], [inner2], options);
      } else {
        inner2 = makeSpan(["inner"], [buildGroup$1(group.body, options)]);
      }
      var fix = makeSpan(["fix"], []);
      var node = makeSpan([group.alignment], [inner2, fix], options);
      var strut = makeSpan(["strut"]);
      strut.style.height = makeEm(node.height + node.depth);
      if (node.depth) {
        strut.style.verticalAlign = makeEm(-node.depth);
      }
      node.children.unshift(strut);
      node = makeSpan(["thinbox"], [node], options);
      return makeSpan(["mord", "vbox"], [node], options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var node = new MathNode("mpadded", [buildGroup2(group.body, options)]);
      if (group.alignment !== "rlap") {
        var offset = group.alignment === "llap" ? "-1" : "-0.5";
        node.setAttribute("lspace", offset + "width");
      }
      node.setAttribute("width", "0px");
      return node;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "styling",
    names: ["\\(", "$"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: false
    },
    handler(_ref, args) {
      var {
        funcName,
        parser
      } = _ref;
      var outerMode = parser.mode;
      parser.switchMode("math");
      var close2 = funcName === "\\(" ? "\\)" : "$";
      var body = parser.parseExpression(false, close2);
      parser.expect(close2);
      parser.switchMode(outerMode);
      return {
        type: "styling",
        mode: parser.mode,
        style: "text",
        resetFont: true,
        body
      };
    }
  });
  defineFunction({
    type: "text",
    // Doesn't matter what this is.
    names: ["\\)", "\\]"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInMath: false
    },
    handler(context, args) {
      throw new ParseError("Mismatched " + context.funcName);
    }
  });
  var chooseMathStyle = /* @__PURE__ */ __name((group, options) => {
    switch (options.style.size) {
      case Style$1.DISPLAY.size:
        return group.display;
      case Style$1.TEXT.size:
        return group.text;
      case Style$1.SCRIPT.size:
        return group.script;
      case Style$1.SCRIPTSCRIPT.size:
        return group.scriptscript;
      default:
        return group.text;
    }
  }, "chooseMathStyle");
  defineFunction({
    type: "mathchoice",
    names: ["\\mathchoice"],
    props: {
      numArgs: 4,
      primitive: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser
      } = _ref;
      return {
        type: "mathchoice",
        mode: parser.mode,
        display: ordargument(args[0]),
        text: ordargument(args[1]),
        script: ordargument(args[2]),
        scriptscript: ordargument(args[3])
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var body = chooseMathStyle(group, options);
      var elements = buildExpression$1(body, options, false);
      return makeFragment(elements);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var body = chooseMathStyle(group, options);
      return buildExpressionRow(body, options);
    }, "mathmlBuilder")
  });
  var assembleSupSub = /* @__PURE__ */ __name((base2, supGroup, subGroup, options, style2, slant, baseShift) => {
    base2 = makeSpan([], [base2]);
    var subIsSingleCharacter = subGroup && isCharacterBox(subGroup);
    var sub2;
    var sup3;
    if (supGroup) {
      var elem = buildGroup$1(supGroup, options.havingStyle(style2.sup()), options);
      sup3 = {
        elem,
        kern: Math.max(options.fontMetrics().bigOpSpacing1, options.fontMetrics().bigOpSpacing3 - elem.depth)
      };
    }
    if (subGroup) {
      var _elem = buildGroup$1(subGroup, options.havingStyle(style2.sub()), options);
      sub2 = {
        elem: _elem,
        kern: Math.max(options.fontMetrics().bigOpSpacing2, options.fontMetrics().bigOpSpacing4 - _elem.height)
      };
    }
    var finalGroup;
    if (sup3 && sub2) {
      var bottom = options.fontMetrics().bigOpSpacing5 + sub2.elem.height + sub2.elem.depth + sub2.kern + base2.depth + baseShift;
      finalGroup = makeVList({
        positionType: "bottom",
        positionData: bottom,
        children: [{
          type: "kern",
          size: options.fontMetrics().bigOpSpacing5
        }, {
          type: "elem",
          elem: sub2.elem,
          marginLeft: makeEm(-slant)
        }, {
          type: "kern",
          size: sub2.kern
        }, {
          type: "elem",
          elem: base2
        }, {
          type: "kern",
          size: sup3.kern
        }, {
          type: "elem",
          elem: sup3.elem,
          marginLeft: makeEm(slant)
        }, {
          type: "kern",
          size: options.fontMetrics().bigOpSpacing5
        }]
      });
    } else if (sub2) {
      var top = base2.height - baseShift;
      finalGroup = makeVList({
        positionType: "top",
        positionData: top,
        children: [{
          type: "kern",
          size: options.fontMetrics().bigOpSpacing5
        }, {
          type: "elem",
          elem: sub2.elem,
          marginLeft: makeEm(-slant)
        }, {
          type: "kern",
          size: sub2.kern
        }, {
          type: "elem",
          elem: base2
        }]
      });
    } else if (sup3) {
      var _bottom = base2.depth + baseShift;
      finalGroup = makeVList({
        positionType: "bottom",
        positionData: _bottom,
        children: [{
          type: "elem",
          elem: base2
        }, {
          type: "kern",
          size: sup3.kern
        }, {
          type: "elem",
          elem: sup3.elem,
          marginLeft: makeEm(slant)
        }, {
          type: "kern",
          size: options.fontMetrics().bigOpSpacing5
        }]
      });
    } else {
      return base2;
    }
    var parts = [finalGroup];
    if (sub2 && slant !== 0 && !subIsSingleCharacter) {
      var spacer = makeSpan(["mspace"], [], options);
      spacer.style.marginRight = makeEm(slant);
      parts.unshift(spacer);
    }
    return makeSpan(["mop", "op-limits"], parts, options);
  }, "assembleSupSub");
  var noSuccessor = /* @__PURE__ */ new Set(["\\smallint"]);
  var htmlBuilder$2 = /* @__PURE__ */ __name((grp, options) => {
    var supGroup;
    var subGroup;
    var hasLimits = false;
    var group;
    if (grp.type === "supsub") {
      supGroup = grp.sup;
      subGroup = grp.sub;
      group = assertNodeType(grp.base, "op");
      hasLimits = true;
    } else {
      group = assertNodeType(grp, "op");
    }
    var style2 = options.style;
    var large = false;
    if (style2.size === Style$1.DISPLAY.size && group.symbol && !noSuccessor.has(group.name)) {
      large = true;
    }
    var base2;
    var symbolItalic;
    if (group.symbol) {
      var fontName = large ? "Size2-Regular" : "Size1-Regular";
      var stash = "";
      if (group.name === "\\oiint" || group.name === "\\oiiint") {
        stash = group.name.slice(1);
        group.name = stash === "oiint" ? "\\iint" : "\\iiint";
      }
      base2 = makeSymbol(group.name, fontName, "math", options, ["mop", "op-symbol", large ? "large-op" : "small-op"]);
      symbolItalic = base2.italic;
      if (stash.length > 0) {
        var oval = staticSvg(stash + "Size" + (large ? "2" : "1"), options);
        base2 = makeVList({
          positionType: "individualShift",
          children: [{
            type: "elem",
            elem: base2,
            shift: 0
          }, {
            type: "elem",
            elem: oval,
            shift: large ? 0.08 : 0
          }]
        });
        group.name = "\\" + stash;
        base2.classes.unshift("mop");
        base2.italic = symbolItalic;
      }
    } else if (group.body) {
      var inner2 = buildExpression$1(group.body, options, true);
      if (inner2.length === 1 && inner2[0] instanceof SymbolNode) {
        base2 = inner2[0];
        base2.classes[0] = "mop";
      } else {
        base2 = makeSpan(["mop"], inner2, options);
      }
    } else {
      var output = [];
      for (var i = 1; i < group.name.length; i++) {
        output.push(mathsym(group.name[i], group.mode, options));
      }
      base2 = makeSpan(["mop"], output, options);
    }
    var baseShift = 0;
    var slant = 0;
    if ((base2 instanceof SymbolNode || group.name === "\\oiint" || group.name === "\\oiiint") && !group.suppressBaseShift) {
      var _base$italic;
      baseShift = (base2.height - base2.depth) / 2 - options.fontMetrics().axisHeight;
      slant = (_base$italic = base2.italic) != null ? _base$italic : 0;
    }
    if (hasLimits) {
      return assembleSupSub(base2, supGroup, subGroup, options, style2, slant, baseShift);
    } else {
      if (baseShift) {
        base2.style.position = "relative";
        base2.style.top = makeEm(baseShift);
      }
      return base2;
    }
  }, "htmlBuilder$2");
  var mathmlBuilder$1 = /* @__PURE__ */ __name((group, options) => {
    var node;
    if (group.symbol) {
      node = new MathNode("mo", [makeText(group.name, group.mode)]);
      if (noSuccessor.has(group.name)) {
        node.setAttribute("largeop", "false");
      }
    } else if (group.body) {
      node = new MathNode("mo", buildExpression2(group.body, options));
    } else {
      node = new MathNode("mi", [new TextNode(group.name.slice(1))]);
      var operator = new MathNode("mo", [makeText("\u2061", "text")]);
      if (group.parentIsSupSub) {
        node = new MathNode("mrow", [node, operator]);
      } else {
        node = newDocumentFragment([node, operator]);
      }
    }
    return node;
  }, "mathmlBuilder$1");
  var singleCharBigOps = {
    "\u220F": "\\prod",
    "\u2210": "\\coprod",
    "\u2211": "\\sum",
    "\u22C0": "\\bigwedge",
    "\u22C1": "\\bigvee",
    "\u22C2": "\\bigcap",
    "\u22C3": "\\bigcup",
    "\u2A00": "\\bigodot",
    "\u2A01": "\\bigoplus",
    "\u2A02": "\\bigotimes",
    "\u2A04": "\\biguplus",
    "\u2A06": "\\bigsqcup"
  };
  defineFunction({
    type: "op",
    names: ["\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap", "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes", "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint", "\u220F", "\u2210", "\u2211", "\u22C0", "\u22C1", "\u22C2", "\u22C3", "\u2A00", "\u2A01", "\u2A02", "\u2A04", "\u2A06"],
    props: {
      numArgs: 0
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var fName = funcName;
      if (fName.length === 1) {
        fName = singleCharBigOps[fName];
      }
      return {
        type: "op",
        mode: parser.mode,
        limits: true,
        parentIsSupSub: false,
        symbol: true,
        name: fName
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$2,
    mathmlBuilder: mathmlBuilder$1
  });
  defineFunction({
    type: "op",
    names: ["\\mathop"],
    props: {
      numArgs: 1,
      primitive: true
    },
    handler: /* @__PURE__ */ __name((_ref2, args) => {
      var {
        parser
      } = _ref2;
      var body = args[0];
      return {
        type: "op",
        mode: parser.mode,
        limits: false,
        parentIsSupSub: false,
        symbol: false,
        body: ordargument(body)
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$2,
    mathmlBuilder: mathmlBuilder$1
  });
  var singleCharIntegrals = {
    "\u222B": "\\int",
    "\u222C": "\\iint",
    "\u222D": "\\iiint",
    "\u222E": "\\oint",
    "\u222F": "\\oiint",
    "\u2230": "\\oiiint"
  };
  defineFunction({
    type: "op",
    names: ["\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg", "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp", "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th"],
    props: {
      numArgs: 0
    },
    handler(_ref3) {
      var {
        parser,
        funcName
      } = _ref3;
      return {
        type: "op",
        mode: parser.mode,
        limits: false,
        parentIsSupSub: false,
        symbol: false,
        name: funcName
      };
    },
    htmlBuilder: htmlBuilder$2,
    mathmlBuilder: mathmlBuilder$1
  });
  defineFunction({
    type: "op",
    names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
    props: {
      numArgs: 0
    },
    handler(_ref4) {
      var {
        parser,
        funcName
      } = _ref4;
      return {
        type: "op",
        mode: parser.mode,
        limits: true,
        parentIsSupSub: false,
        symbol: false,
        name: funcName
      };
    },
    htmlBuilder: htmlBuilder$2,
    mathmlBuilder: mathmlBuilder$1
  });
  defineFunction({
    type: "op",
    names: ["\\int", "\\iint", "\\iiint", "\\oint", "\\oiint", "\\oiiint", "\u222B", "\u222C", "\u222D", "\u222E", "\u222F", "\u2230"],
    props: {
      numArgs: 0,
      allowedInArgument: true
    },
    handler(_ref5) {
      var {
        parser,
        funcName
      } = _ref5;
      var fName = funcName;
      if (fName.length === 1) {
        fName = singleCharIntegrals[fName];
      }
      return {
        type: "op",
        mode: parser.mode,
        limits: false,
        parentIsSupSub: false,
        symbol: true,
        name: fName
      };
    },
    htmlBuilder: htmlBuilder$2,
    mathmlBuilder: mathmlBuilder$1
  });
  var htmlBuilder$1 = /* @__PURE__ */ __name((grp, options) => {
    var supGroup;
    var subGroup;
    var hasLimits = false;
    var group;
    if (grp.type === "supsub") {
      supGroup = grp.sup;
      subGroup = grp.sub;
      group = assertNodeType(grp.base, "operatorname");
      hasLimits = true;
    } else {
      group = assertNodeType(grp, "operatorname");
    }
    var base2;
    if (group.body.length > 0) {
      var body = group.body.map((child2) => {
        var childText = "text" in child2 ? child2.text : void 0;
        if (typeof childText === "string") {
          return {
            type: "textord",
            mode: child2.mode,
            text: childText
          };
        } else {
          return child2;
        }
      });
      var expression = buildExpression$1(body, options.withFont("mathrm"), true);
      for (var i = 0; i < expression.length; i++) {
        var child = expression[i];
        if (child instanceof SymbolNode) {
          child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
        }
      }
      base2 = makeSpan(["mop"], expression, options);
    } else {
      base2 = makeSpan(["mop"], [], options);
    }
    if (hasLimits) {
      return assembleSupSub(base2, supGroup, subGroup, options, options.style, 0, 0);
    } else {
      return base2;
    }
  }, "htmlBuilder$1");
  var mathmlBuilder2 = /* @__PURE__ */ __name((group, options) => {
    var expression = buildExpression2(group.body, options.withFont("mathrm"));
    var isAllString = true;
    for (var i = 0; i < expression.length; i++) {
      var node = expression[i];
      if (node instanceof SpaceNode) ;
      else if (node instanceof MathNode) {
        switch (node.type) {
          case "mi":
          case "mn":
          case "mspace":
          case "mtext":
            break;
          case "mo": {
            var child = node.children[0];
            if (node.children.length === 1 && child instanceof TextNode) {
              child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
            } else {
              isAllString = false;
            }
            break;
          }
          default:
            isAllString = false;
        }
      } else {
        isAllString = false;
      }
    }
    if (isAllString) {
      var word = expression.map((node2) => node2.toText()).join("");
      expression = [new TextNode(word)];
    }
    var identifier = new MathNode("mi", expression);
    identifier.setAttribute("mathvariant", "normal");
    var operator = new MathNode("mo", [makeText("\u2061", "text")]);
    if (group.parentIsSupSub) {
      return new MathNode("mrow", [identifier, operator]);
    } else {
      return newDocumentFragment([identifier, operator]);
    }
  }, "mathmlBuilder");
  defineFunction({
    type: "operatorname",
    names: ["\\operatorname@", "\\operatornamewithlimits"],
    props: {
      numArgs: 1
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser,
        funcName
      } = _ref;
      var body = args[0];
      return {
        type: "operatorname",
        mode: parser.mode,
        body: ordargument(body),
        alwaysHandleSupSub: funcName === "\\operatornamewithlimits",
        limits: false,
        parentIsSupSub: false
      };
    }, "handler"),
    htmlBuilder: htmlBuilder$1,
    mathmlBuilder: mathmlBuilder2
  });
  defineMacro("\\operatorname", "\\@ifstar\\operatornamewithlimits\\operatorname@");
  defineFunctionBuilders({
    type: "ordgroup",
    htmlBuilder(group, options) {
      if (group.semisimple) {
        return makeFragment(buildExpression$1(group.body, options, false));
      }
      return makeSpan(["mord"], buildExpression$1(group.body, options, true), options);
    },
    mathmlBuilder(group, options) {
      return buildExpressionRow(group.body, options, true);
    }
  });
  defineFunction({
    type: "overline",
    names: ["\\overline"],
    props: {
      numArgs: 1
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      var body = args[0];
      return {
        type: "overline",
        mode: parser.mode,
        body
      };
    },
    htmlBuilder(group, options) {
      var innerGroup = buildGroup$1(group.body, options.havingCrampedStyle());
      var line = makeLineSpan("overline-line", options);
      var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
      var vlist = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: innerGroup
        }, {
          type: "kern",
          size: 3 * defaultRuleThickness
        }, {
          type: "elem",
          elem: line
        }, {
          type: "kern",
          size: defaultRuleThickness
        }]
      });
      return makeSpan(["mord", "overline"], [vlist], options);
    },
    mathmlBuilder(group, options) {
      var operator = new MathNode("mo", [new TextNode("\u203E")]);
      operator.setAttribute("stretchy", "true");
      var node = new MathNode("mover", [buildGroup2(group.body, options), operator]);
      node.setAttribute("accent", "true");
      return node;
    }
  });
  defineFunction({
    type: "phantom",
    names: ["\\phantom"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        parser
      } = _ref;
      var body = args[0];
      return {
        type: "phantom",
        mode: parser.mode,
        body: ordargument(body)
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var elements = buildExpression$1(group.body, options.withPhantom(), false);
      return makeFragment(elements);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var inner2 = buildExpression2(group.body, options);
      return new MathNode("mphantom", inner2);
    }, "mathmlBuilder")
  });
  defineMacro("\\hphantom", "\\smash{\\phantom{#1}}");
  defineFunction({
    type: "vphantom",
    names: ["\\vphantom"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref2, args) => {
      var {
        parser
      } = _ref2;
      var body = args[0];
      return {
        type: "vphantom",
        mode: parser.mode,
        body
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var inner2 = makeSpan(["inner"], [buildGroup$1(group.body, options.withPhantom())]);
      var fix = makeSpan(["fix"], []);
      return makeSpan(["mord", "rlap"], [inner2, fix], options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var inner2 = buildExpression2(ordargument(group.body), options);
      var phantom = new MathNode("mphantom", inner2);
      var node = new MathNode("mpadded", [phantom]);
      node.setAttribute("width", "0px");
      return node;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "raisebox",
    names: ["\\raisebox"],
    props: {
      numArgs: 2,
      argTypes: ["size", "hbox"],
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      var amount = assertNodeType(args[0], "size").value;
      var body = args[1];
      return {
        type: "raisebox",
        mode: parser.mode,
        dy: amount,
        body
      };
    },
    htmlBuilder(group, options) {
      var body = buildGroup$1(group.body, options);
      var dy = calculateSize(group.dy, options);
      return makeVList({
        positionType: "shift",
        positionData: -dy,
        children: [{
          type: "elem",
          elem: body
        }]
      });
    },
    mathmlBuilder(group, options) {
      var node = new MathNode("mpadded", [buildGroup2(group.body, options)]);
      var dy = group.dy.number + group.dy.unit;
      node.setAttribute("voffset", dy);
      return node;
    }
  });
  defineFunction({
    type: "internal",
    names: ["\\relax"],
    props: {
      numArgs: 0,
      allowedInText: true,
      allowedInArgument: true
    },
    handler(_ref) {
      var {
        parser
      } = _ref;
      return {
        type: "internal",
        mode: parser.mode
      };
    }
  });
  defineFunction({
    type: "rule",
    names: ["\\rule"],
    props: {
      numArgs: 2,
      numOptionalArgs: 1,
      allowedInText: true,
      allowedInMath: true,
      argTypes: ["size", "size", "size"]
    },
    handler(_ref, args, optArgs) {
      var {
        parser
      } = _ref;
      var shift = optArgs[0];
      var width = assertNodeType(args[0], "size");
      var height = assertNodeType(args[1], "size");
      return {
        type: "rule",
        mode: parser.mode,
        shift: shift && assertNodeType(shift, "size").value,
        width: width.value,
        height: height.value
      };
    },
    htmlBuilder(group, options) {
      var rule = makeSpan(["mord", "rule"], [], options);
      var width = calculateSize(group.width, options);
      var height = calculateSize(group.height, options);
      var shift = group.shift ? calculateSize(group.shift, options) : 0;
      rule.style.borderRightWidth = makeEm(width);
      rule.style.borderTopWidth = makeEm(height);
      rule.style.bottom = makeEm(shift);
      rule.width = width;
      rule.height = height + shift;
      rule.depth = -shift;
      rule.maxFontSize = height * 1.125 * options.sizeMultiplier;
      return rule;
    },
    mathmlBuilder(group, options) {
      var width = calculateSize(group.width, options);
      var height = calculateSize(group.height, options);
      var shift = group.shift ? calculateSize(group.shift, options) : 0;
      var color = options.color && options.getColor() || "black";
      var rule = new MathNode("mspace");
      rule.setAttribute("mathbackground", color);
      rule.setAttribute("width", makeEm(width));
      rule.setAttribute("height", makeEm(height));
      var wrapper = new MathNode("mpadded", [rule]);
      if (shift >= 0) {
        wrapper.setAttribute("height", makeEm(shift));
      } else {
        wrapper.setAttribute("height", makeEm(shift));
        wrapper.setAttribute("depth", makeEm(-shift));
      }
      wrapper.setAttribute("voffset", makeEm(shift));
      return wrapper;
    }
  });
  function sizingGroup(value, options, baseOptions) {
    var inner2 = buildExpression$1(value, options, false);
    var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
    for (var i = 0; i < inner2.length; i++) {
      var pos = inner2[i].classes.indexOf("sizing");
      if (pos < 0) {
        Array.prototype.push.apply(inner2[i].classes, options.sizingClasses(baseOptions));
      } else if (inner2[i].classes[pos + 1] === "reset-size" + options.size) {
        inner2[i].classes[pos + 1] = "reset-size" + baseOptions.size;
      }
      inner2[i].height *= multiplier;
      inner2[i].depth *= multiplier;
    }
    return makeFragment(inner2);
  }
  __name(sizingGroup, "sizingGroup");
  var sizeFuncs = ["\\tiny", "\\sixptsize", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"];
  var htmlBuilder2 = /* @__PURE__ */ __name((group, options) => {
    var newOptions = options.havingSize(group.size);
    return sizingGroup(group.body, newOptions, options);
  }, "htmlBuilder");
  defineFunction({
    type: "sizing",
    names: sizeFuncs,
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args) => {
      var {
        breakOnTokenText,
        funcName,
        parser
      } = _ref;
      var body = parser.parseExpression(false, breakOnTokenText);
      return {
        type: "sizing",
        mode: parser.mode,
        // Figure out what size to use based on the list of functions above
        size: sizeFuncs.indexOf(funcName) + 1,
        body
      };
    }, "handler"),
    htmlBuilder: htmlBuilder2,
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var newOptions = options.havingSize(group.size);
      var inner2 = buildExpression2(group.body, newOptions);
      var node = new MathNode("mstyle", inner2);
      node.setAttribute("mathsize", makeEm(newOptions.sizeMultiplier));
      return node;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "smash",
    names: ["\\smash"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1,
      allowedInText: true
    },
    handler: /* @__PURE__ */ __name((_ref, args, optArgs) => {
      var {
        parser
      } = _ref;
      var smashHeight = false;
      var smashDepth = false;
      var tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");
      if (tbArg) {
        var letter;
        for (var i = 0; i < tbArg.body.length; ++i) {
          var node = tbArg.body[i];
          letter = assertSymbolNodeType(node).text;
          if (letter === "t") {
            smashHeight = true;
          } else if (letter === "b") {
            smashDepth = true;
          } else {
            smashHeight = false;
            smashDepth = false;
            break;
          }
        }
      } else {
        smashHeight = true;
        smashDepth = true;
      }
      var body = args[0];
      return {
        type: "smash",
        mode: parser.mode,
        body,
        smashHeight,
        smashDepth
      };
    }, "handler"),
    htmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var node = makeSpan([], [buildGroup$1(group.body, options)]);
      if (!group.smashHeight && !group.smashDepth) {
        return node;
      }
      if (group.smashHeight) {
        node.height = 0;
      }
      if (group.smashDepth) {
        node.depth = 0;
      }
      if (group.smashHeight && group.smashDepth) {
        return makeSpan(["mord", "smash"], [node], options);
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          if (group.smashHeight) {
            node.children[i].height = 0;
          }
          if (group.smashDepth) {
            node.children[i].depth = 0;
          }
        }
      }
      var smashedNode = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: node
        }]
      });
      return makeSpan(["mord"], [smashedNode], options);
    }, "htmlBuilder"),
    mathmlBuilder: /* @__PURE__ */ __name((group, options) => {
      var node = new MathNode("mpadded", [buildGroup2(group.body, options)]);
      if (group.smashHeight) {
        node.setAttribute("height", "0px");
      }
      if (group.smashDepth) {
        node.setAttribute("depth", "0px");
      }
      return node;
    }, "mathmlBuilder")
  });
  defineFunction({
    type: "sqrt",
    names: ["\\sqrt"],
    props: {
      numArgs: 1,
      numOptionalArgs: 1
    },
    handler(_ref, args, optArgs) {
      var {
        parser
      } = _ref;
      var index = optArgs[0];
      var body = args[0];
      return {
        type: "sqrt",
        mode: parser.mode,
        body,
        index
      };
    },
    htmlBuilder(group, options) {
      var inner2 = buildGroup$1(group.body, options.havingCrampedStyle());
      if (inner2.height === 0) {
        inner2.height = options.fontMetrics().xHeight;
      }
      inner2 = wrapFragment(inner2, options);
      var metrics = options.fontMetrics();
      var theta = metrics.defaultRuleThickness;
      var phi = theta;
      if (options.style.id < Style$1.TEXT.id) {
        phi = options.fontMetrics().xHeight;
      }
      var lineClearance = theta + phi / 4;
      var minDelimiterHeight = inner2.height + inner2.depth + lineClearance + theta;
      var {
        span: img,
        ruleWidth,
        advanceWidth
      } = makeSqrtImage(minDelimiterHeight, options);
      var delimDepth = img.height - ruleWidth;
      if (delimDepth > inner2.height + inner2.depth + lineClearance) {
        lineClearance = (lineClearance + delimDepth - inner2.height - inner2.depth) / 2;
      }
      var imgShift = img.height - inner2.height - lineClearance - ruleWidth;
      inner2.style.paddingLeft = makeEm(advanceWidth);
      var body = makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: inner2,
          wrapperClasses: ["svg-align"]
        }, {
          type: "kern",
          size: -(inner2.height + imgShift)
        }, {
          type: "elem",
          elem: img
        }, {
          type: "kern",
          size: ruleWidth
        }]
      });
      if (!group.index) {
        return makeSpan(["mord", "sqrt"], [body], options);
      } else {
        var newOptions = options.havingStyle(Style$1.SCRIPTSCRIPT);
        var rootm = buildGroup$1(group.index, newOptions, options);
        var toShift = 0.6 * (body.height - body.depth);
        var rootVList = makeVList({
          positionType: "shift",
          positionData: -toShift,
          children: [{
            type: "elem",
            elem: rootm
          }]
        });
        var rootVListWrap = makeSpan(["root"], [rootVList]);
        return makeSpan(["mord", "sqrt"], [rootVListWrap, body], options);
      }
    },
    mathmlBuilder(group, options) {
      var {
        body,
        index
      } = group;
      return index ? new MathNode("mroot", [buildGroup2(body, options), buildGroup2(index, options)]) : new MathNode("msqrt", [buildGroup2(body, options)]);
    }
  });
  var styleMap = {
    "display": Style$1.DISPLAY,
    "text": Style$1.TEXT,
    "script": Style$1.SCRIPT,
    "scriptscript": Style$1.SCRIPTSCRIPT
  };
  function isStyleStr(s) {
    return s in styleMap;
  }
  __name(isStyleStr, "isStyleStr");
  defineFunction({
    type: "styling",
    names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
    props: {
      numArgs: 0,
      allowedInText: true,
      primitive: true
    },
    handler(_ref, args) {
      var {
        breakOnTokenText,
        funcName,
        parser
      } = _ref;
      var body = parser.parseExpression(true, breakOnTokenText);
      var style2 = funcName.slice(1, funcName.length - 5);
      if (!isStyleStr(style2)) {
        throw new Error("Unknown style: " + style2);
      }
      return {
        type: "styling",
        mode: parser.mode,
        // Figure out what style to use by pulling out the style from
        // the function name
        style: style2,
        body
      };
    },
    htmlBuilder(group, options) {
      var newStyle = styleMap[group.style];
      var newOptions = options.havingStyle(newStyle);
      if (group.resetFont) {
        newOptions = newOptions.withFont("");
      }
      return sizingGroup(group.body, newOptions, options);
    },
    mathmlBuilder(group, options) {
      var newStyle = styleMap[group.style];
      var newOptions = options.havingStyle(newStyle);
      if (group.resetFont) {
        newOptions = newOptions.withFont("");
      }
      var inner2 = buildExpression2(group.body, newOptions);
      var node = new MathNode("mstyle", inner2);
      var styleAttributes = {
        "display": ["0", "true"],
        "text": ["0", "false"],
        "script": ["1", "false"],
        "scriptscript": ["2", "false"]
      };
      var attr = styleAttributes[group.style];
      node.setAttribute("scriptlevel", attr[0]);
      node.setAttribute("displaystyle", attr[1]);
      return node;
    }
  });
  var htmlBuilderDelegate = /* @__PURE__ */ __name(function htmlBuilderDelegate2(group, options) {
    var base2 = group.base;
    if (!base2) {
      return null;
    } else if (base2.type === "op") {
      var delegate = base2.limits && (options.style.size === Style$1.DISPLAY.size || base2.alwaysHandleSupSub);
      return delegate ? htmlBuilder$2 : null;
    } else if (base2.type === "operatorname") {
      var _delegate = base2.alwaysHandleSupSub && (options.style.size === Style$1.DISPLAY.size || base2.limits);
      return _delegate ? htmlBuilder$1 : null;
    } else if (base2.type === "accent") {
      return isCharacterBox(base2.base) ? htmlBuilder$a : null;
    } else if (base2.type === "horizBrace") {
      var isSup = !group.sub;
      return isSup === base2.isOver ? htmlBuilder$3 : null;
    } else {
      return null;
    }
  }, "htmlBuilderDelegate");
  defineFunctionBuilders({
    type: "supsub",
    htmlBuilder(group, options) {
      var builderDelegate = htmlBuilderDelegate(group, options);
      if (builderDelegate) {
        return builderDelegate(group, options);
      }
      var {
        base: valueBase,
        sup: valueSup,
        sub: valueSub
      } = group;
      var base2 = buildGroup$1(valueBase, options);
      var supm;
      var subm;
      var metrics = options.fontMetrics();
      var supShift = 0;
      var subShift = 0;
      var isCharBox = valueBase && isCharacterBox(valueBase);
      if (valueSup) {
        var newOptions = options.havingStyle(options.style.sup());
        supm = buildGroup$1(valueSup, newOptions, options);
        if (!isCharBox) {
          supShift = base2.height - newOptions.fontMetrics().supDrop * newOptions.sizeMultiplier / options.sizeMultiplier;
        }
      }
      if (valueSub) {
        var _newOptions = options.havingStyle(options.style.sub());
        subm = buildGroup$1(valueSub, _newOptions, options);
        if (!isCharBox) {
          subShift = base2.depth + _newOptions.fontMetrics().subDrop * _newOptions.sizeMultiplier / options.sizeMultiplier;
        }
      }
      var minSupShift;
      if (options.style === Style$1.DISPLAY) {
        minSupShift = metrics.sup1;
      } else if (options.style.cramped) {
        minSupShift = metrics.sup3;
      } else {
        minSupShift = metrics.sup2;
      }
      var multiplier = options.sizeMultiplier;
      var marginRight = makeEm(0.5 / metrics.ptPerEm / multiplier);
      var marginLeft = null;
      if (subm) {
        var isOiint = group.base && group.base.type === "op" && group.base.name && (group.base.name === "\\oiint" || group.base.name === "\\oiiint");
        if (base2 instanceof SymbolNode || isOiint) {
          var _base$italic;
          marginLeft = makeEm(-((_base$italic = base2.italic) != null ? _base$italic : 0));
        }
      }
      var supsub;
      if (supm && subm) {
        supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
        subShift = Math.max(subShift, metrics.sub2);
        var ruleWidth = metrics.defaultRuleThickness;
        var maxWidth = 4 * ruleWidth;
        if (supShift - supm.depth - (subm.height - subShift) < maxWidth) {
          subShift = maxWidth - (supShift - supm.depth) + subm.height;
          var psi = 0.8 * metrics.xHeight - (supShift - supm.depth);
          if (psi > 0) {
            supShift += psi;
            subShift -= psi;
          }
        }
        var vlistElem = [{
          type: "elem",
          elem: subm,
          shift: subShift,
          marginRight,
          marginLeft
        }, {
          type: "elem",
          elem: supm,
          shift: -supShift,
          marginRight
        }];
        supsub = makeVList({
          positionType: "individualShift",
          children: vlistElem
        });
      } else if (subm) {
        subShift = Math.max(subShift, metrics.sub1, subm.height - 0.8 * metrics.xHeight);
        var _vlistElem = [{
          type: "elem",
          elem: subm,
          marginLeft,
          marginRight
        }];
        supsub = makeVList({
          positionType: "shift",
          positionData: subShift,
          children: _vlistElem
        });
      } else if (supm) {
        supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
        supsub = makeVList({
          positionType: "shift",
          positionData: -supShift,
          children: [{
            type: "elem",
            elem: supm,
            marginRight
          }]
        });
      } else {
        throw new Error("supsub must have either sup or sub.");
      }
      var mclass = getTypeOfDomTree(base2, "right") || "mord";
      return makeSpan([mclass], [base2, makeSpan(["msupsub"], [supsub])], options);
    },
    mathmlBuilder(group, options) {
      var isBrace = false;
      var isOver;
      var isSup;
      if (group.base && group.base.type === "horizBrace") {
        isSup = !!group.sup;
        if (isSup === group.base.isOver) {
          isBrace = true;
          isOver = group.base.isOver;
        }
      }
      if (group.base && (group.base.type === "op" || group.base.type === "operatorname")) {
        group.base.parentIsSupSub = true;
      }
      var children = [buildGroup2(group.base, options)];
      if (group.sub) {
        children.push(buildGroup2(group.sub, options));
      }
      if (group.sup) {
        children.push(buildGroup2(group.sup, options));
      }
      var nodeType;
      if (isBrace) {
        nodeType = isOver ? "mover" : "munder";
      } else if (!group.sub) {
        var base2 = group.base;
        if (base2 && base2.type === "op" && base2.limits && (options.style === Style$1.DISPLAY || base2.alwaysHandleSupSub)) {
          nodeType = "mover";
        } else if (base2 && base2.type === "operatorname" && base2.alwaysHandleSupSub && (base2.limits || options.style === Style$1.DISPLAY)) {
          nodeType = "mover";
        } else {
          nodeType = "msup";
        }
      } else if (!group.sup) {
        var _base = group.base;
        if (_base && _base.type === "op" && _base.limits && (options.style === Style$1.DISPLAY || _base.alwaysHandleSupSub)) {
          nodeType = "munder";
        } else if (_base && _base.type === "operatorname" && _base.alwaysHandleSupSub && (_base.limits || options.style === Style$1.DISPLAY)) {
          nodeType = "munder";
        } else {
          nodeType = "msub";
        }
      } else {
        var _base2 = group.base;
        if (_base2 && _base2.type === "op" && _base2.limits && options.style === Style$1.DISPLAY) {
          nodeType = "munderover";
        } else if (_base2 && _base2.type === "operatorname" && _base2.alwaysHandleSupSub && (options.style === Style$1.DISPLAY || _base2.limits)) {
          nodeType = "munderover";
        } else {
          nodeType = "msubsup";
        }
      }
      return new MathNode(nodeType, children);
    }
  });
  defineFunctionBuilders({
    type: "atom",
    htmlBuilder(group, options) {
      return mathsym(group.text, group.mode, options, ["m" + group.family]);
    },
    mathmlBuilder(group, options) {
      var node = new MathNode("mo", [makeText(group.text, group.mode)]);
      if (group.family === "bin") {
        var variant = getVariant(group, options);
        if (variant === "bold-italic") {
          node.setAttribute("mathvariant", variant);
        }
      } else if (group.family === "punct") {
        node.setAttribute("separator", "true");
      } else if (group.family === "open" || group.family === "close") {
        node.setAttribute("stretchy", "false");
      }
      return node;
    }
  });
  var defaultVariant = {
    "mi": "italic",
    "mn": "normal",
    "mtext": "normal"
  };
  defineFunctionBuilders({
    type: "mathord",
    htmlBuilder(group, options) {
      return makeOrd(group, options, "mathord");
    },
    mathmlBuilder(group, options) {
      var node = new MathNode("mi", [makeText(group.text, group.mode, options)]);
      var variant = getVariant(group, options) || "italic";
      if (variant !== defaultVariant[node.type]) {
        node.setAttribute("mathvariant", variant);
      }
      return node;
    }
  });
  defineFunctionBuilders({
    type: "textord",
    htmlBuilder(group, options) {
      return makeOrd(group, options, "textord");
    },
    mathmlBuilder(group, options) {
      var text3 = makeText(group.text, group.mode, options);
      var variant = getVariant(group, options) || "normal";
      var node;
      if (group.mode === "text") {
        node = new MathNode("mtext", [text3]);
      } else if (/[0-9]/.test(group.text)) {
        node = new MathNode("mn", [text3]);
      } else if (group.text === "\\prime") {
        node = new MathNode("mo", [text3]);
      } else {
        node = new MathNode("mi", [text3]);
      }
      if (variant !== defaultVariant[node.type]) {
        node.setAttribute("mathvariant", variant);
      }
      return node;
    }
  });
  var cssSpace = {
    "\\nobreak": "nobreak",
    "\\allowbreak": "allowbreak"
  };
  var regularSpace = {
    " ": {},
    "\\ ": {},
    "~": {
      className: "nobreak"
    },
    "\\space": {},
    "\\nobreakspace": {
      className: "nobreak"
    }
  };
  defineFunctionBuilders({
    type: "spacing",
    htmlBuilder(group, options) {
      if (regularSpace.hasOwnProperty(group.text)) {
        var className = regularSpace[group.text].className || "";
        if (group.mode === "text") {
          var ord = makeOrd(group, options, "textord");
          ord.classes.push(className);
          return ord;
        } else {
          return makeSpan(["mspace", className], [mathsym(group.text, group.mode, options)], options);
        }
      } else if (cssSpace.hasOwnProperty(group.text)) {
        return makeSpan(["mspace", cssSpace[group.text]], [], options);
      } else {
        throw new ParseError('Unknown type of space "' + group.text + '"');
      }
    },
    mathmlBuilder(group, options) {
      var node;
      if (regularSpace.hasOwnProperty(group.text)) {
        node = new MathNode("mtext", [new TextNode("\xA0")]);
      } else if (cssSpace.hasOwnProperty(group.text)) {
        return new MathNode("mspace");
      } else {
        throw new ParseError('Unknown type of space "' + group.text + '"');
      }
      return node;
    }
  });
  var pad = /* @__PURE__ */ __name(() => {
    var padNode = new MathNode("mtd", []);
    padNode.setAttribute("width", "50%");
    return padNode;
  }, "pad");
  defineFunctionBuilders({
    type: "tag",
    mathmlBuilder(group, options) {
      var table2 = new MathNode("mtable", [new MathNode("mtr", [pad(), new MathNode("mtd", [buildExpressionRow(group.body, options)]), pad(), new MathNode("mtd", [buildExpressionRow(group.tag, options)])])]);
      table2.setAttribute("width", "100%");
      return table2;
    }
  });
  var textFontFamilies = {
    "\\text": void 0,
    "\\textrm": "textrm",
    "\\textsf": "textsf",
    "\\texttt": "texttt",
    "\\textnormal": "textrm"
  };
  var textFontWeights = {
    "\\textbf": "textbf",
    "\\textmd": "textmd"
  };
  var textFontShapes = {
    "\\textit": "textit",
    "\\textup": "textup"
  };
  var optionsWithFont = /* @__PURE__ */ __name((group, options) => {
    var font = group.font;
    if (!font) {
      return options;
    } else if (textFontFamilies[font]) {
      return options.withTextFontFamily(textFontFamilies[font]);
    } else if (textFontWeights[font]) {
      return options.withTextFontWeight(textFontWeights[font]);
    } else if (font === "\\emph") {
      return options.fontShape === "textit" ? options.withTextFontShape("textup") : options.withTextFontShape("textit");
    }
    return options.withTextFontShape(textFontShapes[font]);
  }, "optionsWithFont");
  defineFunction({
    type: "text",
    names: [
      // Font families
      "\\text",
      "\\textrm",
      "\\textsf",
      "\\texttt",
      "\\textnormal",
      // Font weights
      "\\textbf",
      "\\textmd",
      // Font Shapes
      "\\textit",
      "\\textup",
      "\\emph"
    ],
    props: {
      numArgs: 1,
      argTypes: ["text"],
      allowedInArgument: true,
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser,
        funcName
      } = _ref;
      var body = args[0];
      return {
        type: "text",
        mode: parser.mode,
        body: ordargument(body),
        font: funcName
      };
    },
    htmlBuilder(group, options) {
      var newOptions = optionsWithFont(group, options);
      var inner2 = buildExpression$1(group.body, newOptions, true);
      return makeSpan(["mord", "text"], inner2, newOptions);
    },
    mathmlBuilder(group, options) {
      var newOptions = optionsWithFont(group, options);
      return buildExpressionRow(group.body, newOptions);
    }
  });
  defineFunction({
    type: "underline",
    names: ["\\underline"],
    props: {
      numArgs: 1,
      allowedInText: true
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      return {
        type: "underline",
        mode: parser.mode,
        body: args[0]
      };
    },
    htmlBuilder(group, options) {
      var innerGroup = buildGroup$1(group.body, options);
      var line = makeLineSpan("underline-line", options);
      var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
      var vlist = makeVList({
        positionType: "top",
        positionData: innerGroup.height,
        children: [{
          type: "kern",
          size: defaultRuleThickness
        }, {
          type: "elem",
          elem: line
        }, {
          type: "kern",
          size: 3 * defaultRuleThickness
        }, {
          type: "elem",
          elem: innerGroup
        }]
      });
      return makeSpan(["mord", "underline"], [vlist], options);
    },
    mathmlBuilder(group, options) {
      var operator = new MathNode("mo", [new TextNode("\u203E")]);
      operator.setAttribute("stretchy", "true");
      var node = new MathNode("munder", [buildGroup2(group.body, options), operator]);
      node.setAttribute("accentunder", "true");
      return node;
    }
  });
  defineFunction({
    type: "vcenter",
    names: ["\\vcenter"],
    props: {
      numArgs: 1,
      argTypes: ["original"],
      // In LaTeX, \vcenter can act only on a box.
      allowedInText: false
    },
    handler(_ref, args) {
      var {
        parser
      } = _ref;
      return {
        type: "vcenter",
        mode: parser.mode,
        body: args[0]
      };
    },
    htmlBuilder(group, options) {
      var body = buildGroup$1(group.body, options);
      var axisHeight = options.fontMetrics().axisHeight;
      var dy = 0.5 * (body.height - axisHeight - (body.depth + axisHeight));
      return makeVList({
        positionType: "shift",
        positionData: dy,
        children: [{
          type: "elem",
          elem: body
        }]
      });
    },
    mathmlBuilder(group, options) {
      var mpadded = new MathNode("mpadded", [buildGroup2(group.body, options)], ["vcenter"]);
      return new MathNode("mrow", [mpadded]);
    }
  });
  defineFunction({
    type: "verb",
    names: ["\\verb"],
    props: {
      numArgs: 0,
      allowedInText: true
    },
    handler(context, args, optArgs) {
      throw new ParseError("\\verb ended by end of line instead of matching delimiter");
    },
    htmlBuilder(group, options) {
      var text3 = makeVerb(group);
      var body = [];
      var newOptions = options.havingStyle(options.style.text());
      for (var i = 0; i < text3.length; i++) {
        var c = text3[i];
        if (c === "~") {
          c = "\\textasciitilde";
        }
        body.push(makeSymbol(c, "Typewriter-Regular", group.mode, newOptions, ["mord", "texttt"]));
      }
      return makeSpan(["mord", "text"].concat(newOptions.sizingClasses(options)), tryCombineChars(body), newOptions);
    },
    mathmlBuilder(group, options) {
      var text3 = new TextNode(makeVerb(group));
      var node = new MathNode("mtext", [text3]);
      node.setAttribute("mathvariant", "monospace");
      return node;
    }
  });
  var makeVerb = /* @__PURE__ */ __name((group) => group.body.replace(/ /g, group.star ? "\u2423" : "\xA0"), "makeVerb");
  var functions = _functions;
  var spaceRegexString = "[ \r\n	]";
  var controlWordRegexString = "\\\\[a-zA-Z@]+";
  var controlSymbolRegexString = "\\\\[^\uD800-\uDFFF]";
  var controlWordWhitespaceRegexString = "(" + controlWordRegexString + ")" + spaceRegexString + "*";
  var controlSpaceRegexString = "\\\\(\n|[ \r	]+\n?)[ \r	]*";
  var combiningDiacriticalMarkString = "[\u0300-\u036F]";
  var combiningDiacriticalMarksEndRegex = new RegExp(combiningDiacriticalMarkString + "+$");
  var tokenRegexString = "(" + spaceRegexString + "+)|" + // whitespace
  (controlSpaceRegexString + "|") + // \whitespace
  "([!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]" + // single codepoint
  (combiningDiacriticalMarkString + "*") + // ...plus accents
  "|[\uD800-\uDBFF][\uDC00-\uDFFF]" + // surrogate pair
  (combiningDiacriticalMarkString + "*") + // ...plus accents
  "|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5" + // \verb unstarred
  ("|" + controlWordWhitespaceRegexString) + // \macroName + spaces
  ("|" + controlSymbolRegexString + ")");
  var Lexer = class {
    static {
      __name(this, "Lexer");
    }
    constructor(input, settings) {
      this.input = void 0;
      this.settings = void 0;
      this.tokenRegex = void 0;
      this.catcodes = void 0;
      this.input = input;
      this.settings = settings;
      this.tokenRegex = new RegExp(tokenRegexString, "g");
      this.catcodes = {
        "%": 14,
        // comment character
        "~": 13
        // active character
      };
    }
    setCatcode(char, code2) {
      this.catcodes[char] = code2;
    }
    /**
     * This function lexes a single token.
     */
    lex() {
      var input = this.input;
      var pos = this.tokenRegex.lastIndex;
      if (pos === input.length) {
        return new Token2("EOF", new SourceLocation(this, pos, pos));
      }
      var match2 = this.tokenRegex.exec(input);
      if (match2 === null || match2.index !== pos) {
        throw new ParseError("Unexpected character: '" + input[pos] + "'", new Token2(input[pos], new SourceLocation(this, pos, pos + 1)));
      }
      var text3 = match2[6] || match2[3] || (match2[2] ? "\\ " : " ");
      if (this.catcodes[text3] === 14) {
        var nlIndex = input.indexOf("\n", this.tokenRegex.lastIndex);
        if (nlIndex === -1) {
          this.tokenRegex.lastIndex = input.length;
          this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)");
        } else {
          this.tokenRegex.lastIndex = nlIndex + 1;
        }
        return this.lex();
      }
      return new Token2(text3, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
    }
  };
  var Namespace = class {
    static {
      __name(this, "Namespace");
    }
    /**
     * Both arguments are optional.  The first argument is an object of
     * built-in mappings which never change.  The second argument is an object
     * of initial (global-level) mappings, which will constantly change
     * according to any global/top-level `set`s done.
     */
    constructor(builtins, globalMacros) {
      if (builtins === void 0) {
        builtins = {};
      }
      if (globalMacros === void 0) {
        globalMacros = {};
      }
      this.current = void 0;
      this.builtins = void 0;
      this.undefStack = void 0;
      this.current = globalMacros;
      this.builtins = builtins;
      this.undefStack = [];
    }
    /**
     * Start a new nested group, affecting future local `set`s.
     */
    beginGroup() {
      this.undefStack.push({});
    }
    /**
     * End current nested group, restoring values before the group began.
     */
    endGroup() {
      if (this.undefStack.length === 0) {
        throw new ParseError("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");
      }
      var undefs = this.undefStack.pop();
      for (var undef in undefs) {
        if (undefs.hasOwnProperty(undef)) {
          if (undefs[undef] == null) {
            delete this.current[undef];
          } else {
            this.current[undef] = undefs[undef];
          }
        }
      }
    }
    /**
     * Ends all currently nested groups (if any), restoring values before the
     * groups began.  Useful in case of an error in the middle of parsing.
     */
    endGroups() {
      while (this.undefStack.length > 0) {
        this.endGroup();
      }
    }
    /**
     * Detect whether `name` has a definition.  Equivalent to
     * `get(name) != null`.
     */
    has(name) {
      return this.current.hasOwnProperty(name) || this.builtins.hasOwnProperty(name);
    }
    /**
     * Get the current value of a name, or `undefined` if there is no value.
     *
     * Note: Do not use `if (namespace.get(...))` to detect whether a macro
     * is defined, as the definition may be the empty string which evaluates
     * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
     * `if (namespace.has(...))`.
     */
    get(name) {
      if (this.current.hasOwnProperty(name)) {
        return this.current[name];
      } else {
        return this.builtins[name];
      }
    }
    /**
     * Set the current value of a name, and optionally set it globally too.
     * Local set() sets the current value and (when appropriate) adds an undo
     * operation to the undo stack.  Global set() may change the undo
     * operation at every level, so takes time linear in their number.
     * A value of undefined means to delete existing definitions.
     */
    set(name, value, global) {
      if (global === void 0) {
        global = false;
      }
      if (global) {
        for (var i = 0; i < this.undefStack.length; i++) {
          delete this.undefStack[i][name];
        }
        if (this.undefStack.length > 0) {
          this.undefStack[this.undefStack.length - 1][name] = value;
        }
      } else {
        var top = this.undefStack[this.undefStack.length - 1];
        if (top && !top.hasOwnProperty(name)) {
          top[name] = this.current[name];
        }
      }
      if (value == null) {
        delete this.current[name];
      } else {
        this.current[name] = value;
      }
    }
  };
  var macros = _macros;
  defineMacro("\\noexpand", function(context) {
    var t = context.popToken();
    if (context.isExpandable(t.text)) {
      t.noexpand = true;
      t.treatAsRelax = true;
    }
    return {
      tokens: [t],
      numArgs: 0
    };
  });
  defineMacro("\\expandafter", function(context) {
    var t = context.popToken();
    context.expandOnce(true);
    return {
      tokens: [t],
      numArgs: 0
    };
  });
  defineMacro("\\@firstoftwo", function(context) {
    var args = context.consumeArgs(2);
    return {
      tokens: args[0],
      numArgs: 0
    };
  });
  defineMacro("\\@secondoftwo", function(context) {
    var args = context.consumeArgs(2);
    return {
      tokens: args[1],
      numArgs: 0
    };
  });
  defineMacro("\\@ifnextchar", function(context) {
    var args = context.consumeArgs(3);
    context.consumeSpaces();
    var nextToken = context.future();
    if (args[0].length === 1 && args[0][0].text === nextToken.text) {
      return {
        tokens: args[1],
        numArgs: 0
      };
    } else {
      return {
        tokens: args[2],
        numArgs: 0
      };
    }
  });
  defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");
  defineMacro("\\TextOrMath", function(context) {
    var args = context.consumeArgs(2);
    if (context.mode === "text") {
      return {
        tokens: args[0],
        numArgs: 0
      };
    } else {
      return {
        tokens: args[1],
        numArgs: 0
      };
    }
  });
  var digitToNumber = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "a": 10,
    "A": 10,
    "b": 11,
    "B": 11,
    "c": 12,
    "C": 12,
    "d": 13,
    "D": 13,
    "e": 14,
    "E": 14,
    "f": 15,
    "F": 15
  };
  defineMacro("\\char", function(context) {
    var token = context.popToken();
    var base2;
    var number = 0;
    if (token.text === "'") {
      base2 = 8;
      token = context.popToken();
    } else if (token.text === '"') {
      base2 = 16;
      token = context.popToken();
    } else if (token.text === "`") {
      token = context.popToken();
      if (token.text[0] === "\\") {
        number = token.text.charCodeAt(1);
      } else if (token.text === "EOF") {
        throw new ParseError("\\char` missing argument");
      } else {
        number = token.text.charCodeAt(0);
      }
    } else {
      base2 = 10;
    }
    if (base2) {
      number = digitToNumber[token.text];
      if (number == null || number >= base2) {
        throw new ParseError("Invalid base-" + base2 + " digit " + token.text);
      }
      var digit;
      while ((digit = digitToNumber[context.future().text]) != null && digit < base2) {
        number *= base2;
        number += digit;
        context.popToken();
      }
    }
    return "\\@char{" + number + "}";
  });
  var newcommand = /* @__PURE__ */ __name((context, existsOK, nonexistsOK, skipIfExists) => {
    var arg = context.consumeArg().tokens;
    if (arg.length !== 1) {
      throw new ParseError("\\newcommand's first argument must be a macro name");
    }
    var name = arg[0].text;
    var exists = context.isDefined(name);
    if (exists && !existsOK) {
      throw new ParseError("\\newcommand{" + name + "} attempting to redefine " + (name + "; use \\renewcommand"));
    }
    if (!exists && !nonexistsOK) {
      throw new ParseError("\\renewcommand{" + name + "} when command " + name + " does not yet exist; use \\newcommand");
    }
    var numArgs = 0;
    arg = context.consumeArg().tokens;
    if (arg.length === 1 && arg[0].text === "[") {
      var argText = "";
      var token = context.expandNextToken();
      while (token.text !== "]" && token.text !== "EOF") {
        argText += token.text;
        token = context.expandNextToken();
      }
      if (!argText.match(/^\s*[0-9]+\s*$/)) {
        throw new ParseError("Invalid number of arguments: " + argText);
      }
      numArgs = parseInt(argText);
      arg = context.consumeArg().tokens;
    }
    if (!(exists && skipIfExists)) {
      context.macros.set(name, {
        tokens: arg,
        numArgs
      });
    }
    return "";
  }, "newcommand");
  defineMacro("\\newcommand", (context) => newcommand(context, false, true, false));
  defineMacro("\\renewcommand", (context) => newcommand(context, true, false, false));
  defineMacro("\\providecommand", (context) => newcommand(context, true, true, true));
  defineMacro("\\message", (context) => {
    var arg = context.consumeArgs(1)[0];
    console.log(arg.reverse().map((token) => token.text).join(""));
    return "";
  });
  defineMacro("\\errmessage", (context) => {
    var arg = context.consumeArgs(1)[0];
    console.error(arg.reverse().map((token) => token.text).join(""));
    return "";
  });
  defineMacro("\\show", (context) => {
    var tok = context.popToken();
    var name = tok.text;
    console.log(tok, context.macros.get(name), functions[name], symbols.math[name], symbols.text[name]);
    return "";
  });
  defineMacro("\\bgroup", "{");
  defineMacro("\\egroup", "}");
  defineMacro("~", "\\nobreakspace");
  defineMacro("\\lq", "`");
  defineMacro("\\rq", "'");
  defineMacro("\\aa", "\\r a");
  defineMacro("\\AA", "\\r A");
  defineMacro("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`\xA9}");
  defineMacro("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}");
  defineMacro("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`\xAE}");
  defineMacro("\u212C", "\\mathscr{B}");
  defineMacro("\u2130", "\\mathscr{E}");
  defineMacro("\u2131", "\\mathscr{F}");
  defineMacro("\u210B", "\\mathscr{H}");
  defineMacro("\u2110", "\\mathscr{I}");
  defineMacro("\u2112", "\\mathscr{L}");
  defineMacro("\u2133", "\\mathscr{M}");
  defineMacro("\u211B", "\\mathscr{R}");
  defineMacro("\u212D", "\\mathfrak{C}");
  defineMacro("\u210C", "\\mathfrak{H}");
  defineMacro("\u2128", "\\mathfrak{Z}");
  defineMacro("\\Bbbk", "\\Bbb{k}");
  defineMacro("\\llap", "\\mathllap{\\textrm{#1}}");
  defineMacro("\\rlap", "\\mathrlap{\\textrm{#1}}");
  defineMacro("\\clap", "\\mathclap{\\textrm{#1}}");
  defineMacro("\\mathstrut", "\\vphantom{(}");
  defineMacro("\\underbar", "\\underline{\\text{#1}}");
  defineMacro("\\not", '\\html@mathml{\\mathrel{\\mathrlap\\@not}\\nobreak}{\\char"338}');
  defineMacro("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`\u2260}}");
  defineMacro("\\ne", "\\neq");
  defineMacro("\u2260", "\\neq");
  defineMacro("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`\u2209}}");
  defineMacro("\u2209", "\\notin");
  defineMacro("\u2258", "\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`\u2258}}");
  defineMacro("\u2259", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`\u2258}}");
  defineMacro("\u225A", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`\u225A}}");
  defineMacro("\u225B", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`\u225B}}");
  defineMacro("\u225D", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`\u225D}}");
  defineMacro("\u225E", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`\u225E}}");
  defineMacro("\u225F", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`\u225F}}");
  defineMacro("\u27C2", "\\perp");
  defineMacro("\u203C", "\\mathclose{!\\mkern-0.8mu!}");
  defineMacro("\u220C", "\\notni");
  defineMacro("\u231C", "\\ulcorner");
  defineMacro("\u231D", "\\urcorner");
  defineMacro("\u231E", "\\llcorner");
  defineMacro("\u231F", "\\lrcorner");
  defineMacro("\xA9", "\\copyright");
  defineMacro("\xAE", "\\textregistered");
  defineMacro("\\ulcorner", '\\html@mathml{\\@ulcorner}{\\mathop{\\char"231c}}');
  defineMacro("\\urcorner", '\\html@mathml{\\@urcorner}{\\mathop{\\char"231d}}');
  defineMacro("\\llcorner", '\\html@mathml{\\@llcorner}{\\mathop{\\char"231e}}');
  defineMacro("\\lrcorner", '\\html@mathml{\\@lrcorner}{\\mathop{\\char"231f}}');
  defineMacro("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
  defineMacro("\u22EE", "\\vdots");
  defineMacro("\\varGamma", "\\mathit{\\Gamma}");
  defineMacro("\\varDelta", "\\mathit{\\Delta}");
  defineMacro("\\varTheta", "\\mathit{\\Theta}");
  defineMacro("\\varLambda", "\\mathit{\\Lambda}");
  defineMacro("\\varXi", "\\mathit{\\Xi}");
  defineMacro("\\varPi", "\\mathit{\\Pi}");
  defineMacro("\\varSigma", "\\mathit{\\Sigma}");
  defineMacro("\\varUpsilon", "\\mathit{\\Upsilon}");
  defineMacro("\\varPhi", "\\mathit{\\Phi}");
  defineMacro("\\varPsi", "\\mathit{\\Psi}");
  defineMacro("\\varOmega", "\\mathit{\\Omega}");
  defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");
  defineMacro("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu\\relax");
  defineMacro("\\boxed", "\\fbox{$\\displaystyle{#1}$}");
  defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
  defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
  defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
  defineMacro("\\dddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ...}}{#1}}");
  defineMacro("\\ddddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ....}}{#1}}");
  var dotsByToken = {
    ",": "\\dotsc",
    "\\not": "\\dotsb",
    // \keybin@ checks for the following:
    "+": "\\dotsb",
    "=": "\\dotsb",
    "<": "\\dotsb",
    ">": "\\dotsb",
    "-": "\\dotsb",
    "*": "\\dotsb",
    ":": "\\dotsb",
    // Symbols whose definition starts with \DOTSB:
    "\\DOTSB": "\\dotsb",
    "\\coprod": "\\dotsb",
    "\\bigvee": "\\dotsb",
    "\\bigwedge": "\\dotsb",
    "\\biguplus": "\\dotsb",
    "\\bigcap": "\\dotsb",
    "\\bigcup": "\\dotsb",
    "\\prod": "\\dotsb",
    "\\sum": "\\dotsb",
    "\\bigotimes": "\\dotsb",
    "\\bigoplus": "\\dotsb",
    "\\bigodot": "\\dotsb",
    "\\bigsqcup": "\\dotsb",
    "\\And": "\\dotsb",
    "\\longrightarrow": "\\dotsb",
    "\\Longrightarrow": "\\dotsb",
    "\\longleftarrow": "\\dotsb",
    "\\Longleftarrow": "\\dotsb",
    "\\longleftrightarrow": "\\dotsb",
    "\\Longleftrightarrow": "\\dotsb",
    "\\mapsto": "\\dotsb",
    "\\longmapsto": "\\dotsb",
    "\\hookrightarrow": "\\dotsb",
    "\\doteq": "\\dotsb",
    // Symbols whose definition starts with \mathbin:
    "\\mathbin": "\\dotsb",
    // Symbols whose definition starts with \mathrel:
    "\\mathrel": "\\dotsb",
    "\\relbar": "\\dotsb",
    "\\Relbar": "\\dotsb",
    "\\xrightarrow": "\\dotsb",
    "\\xleftarrow": "\\dotsb",
    // Symbols whose definition starts with \DOTSI:
    "\\DOTSI": "\\dotsi",
    "\\int": "\\dotsi",
    "\\oint": "\\dotsi",
    "\\iint": "\\dotsi",
    "\\iiint": "\\dotsi",
    "\\iiiint": "\\dotsi",
    "\\idotsint": "\\dotsi",
    // Symbols whose definition starts with \DOTSX:
    "\\DOTSX": "\\dotsx"
  };
  var dotsbGroups = /* @__PURE__ */ new Set(["bin", "rel"]);
  defineMacro("\\dots", function(context) {
    var thedots = "\\dotso";
    var next = context.expandAfterFuture().text;
    if (next in dotsByToken) {
      thedots = dotsByToken[next];
    } else if (next.slice(0, 4) === "\\not") {
      thedots = "\\dotsb";
    } else if (next in symbols.math) {
      if (dotsbGroups.has(symbols.math[next].group)) {
        thedots = "\\dotsb";
      }
    }
    return thedots;
  });
  var spaceAfterDots = {
    // \rightdelim@ checks for the following:
    ")": true,
    "]": true,
    "\\rbrack": true,
    "\\}": true,
    "\\rbrace": true,
    "\\rangle": true,
    "\\rceil": true,
    "\\rfloor": true,
    "\\rgroup": true,
    "\\rmoustache": true,
    "\\right": true,
    "\\bigr": true,
    "\\biggr": true,
    "\\Bigr": true,
    "\\Biggr": true,
    // \extra@ also tests for the following:
    "$": true,
    // \extrap@ checks for the following:
    ";": true,
    ".": true,
    ",": true
  };
  defineMacro("\\dotso", function(context) {
    var next = context.future().text;
    if (next in spaceAfterDots) {
      return "\\ldots\\,";
    } else {
      return "\\ldots";
    }
  });
  defineMacro("\\dotsc", function(context) {
    var next = context.future().text;
    if (next in spaceAfterDots && next !== ",") {
      return "\\ldots\\,";
    } else {
      return "\\ldots";
    }
  });
  defineMacro("\\cdots", function(context) {
    var next = context.future().text;
    if (next in spaceAfterDots) {
      return "\\@cdots\\,";
    } else {
      return "\\@cdots";
    }
  });
  defineMacro("\\dotsb", "\\cdots");
  defineMacro("\\dotsm", "\\cdots");
  defineMacro("\\dotsi", "\\!\\cdots");
  defineMacro("\\dotsx", "\\ldots\\,");
  defineMacro("\\DOTSI", "\\relax");
  defineMacro("\\DOTSB", "\\relax");
  defineMacro("\\DOTSX", "\\relax");
  defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
  defineMacro("\\,", "\\tmspace+{3mu}{.1667em}");
  defineMacro("\\thinspace", "\\,");
  defineMacro("\\>", "\\mskip{4mu}");
  defineMacro("\\:", "\\tmspace+{4mu}{.2222em}");
  defineMacro("\\medspace", "\\:");
  defineMacro("\\;", "\\tmspace+{5mu}{.2777em}");
  defineMacro("\\thickspace", "\\;");
  defineMacro("\\!", "\\tmspace-{3mu}{.1667em}");
  defineMacro("\\negthinspace", "\\!");
  defineMacro("\\negmedspace", "\\tmspace-{4mu}{.2222em}");
  defineMacro("\\negthickspace", "\\tmspace-{5mu}{.277em}");
  defineMacro("\\enspace", "\\kern.5em ");
  defineMacro("\\enskip", "\\hskip.5em\\relax");
  defineMacro("\\quad", "\\hskip1em\\relax");
  defineMacro("\\qquad", "\\hskip2em\\relax");
  defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
  defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
  defineMacro("\\tag@literal", (context) => {
    if (context.macros.get("\\df@tag")) {
      throw new ParseError("Multiple \\tag");
    }
    return "\\gdef\\df@tag{\\text{#1}}";
  });
  defineMacro("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}");
  defineMacro("\\pod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)");
  defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
  defineMacro("\\mod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1");
  defineMacro("\\newline", "\\\\\\relax");
  defineMacro("\\TeX", "\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");
  var latexRaiseA = makeEm(fontMetricsData["Main-Regular"]["T".charCodeAt(0)][1] - 0.7 * fontMetricsData["Main-Regular"]["A".charCodeAt(0)][1]);
  defineMacro("\\LaTeX", "\\textrm{\\html@mathml{" + ("L\\kern-.36em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{LaTeX}}");
  defineMacro("\\KaTeX", "\\textrm{\\html@mathml{" + ("K\\kern-.17em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{KaTeX}}");
  defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
  defineMacro("\\@hspace", "\\hskip #1\\relax");
  defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");
  defineMacro("\\ordinarycolon", ":");
  defineMacro("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}");
  defineMacro("\\dblcolon", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char"2237}}');
  defineMacro("\\coloneqq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2254}}');
  defineMacro("\\Coloneqq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2237\\char"3d}}');
  defineMacro("\\coloneq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"3a\\char"2212}}');
  defineMacro("\\Coloneq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"2237\\char"2212}}');
  defineMacro("\\eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2255}}');
  defineMacro("\\Eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"3d\\char"2237}}');
  defineMacro("\\eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2239}}');
  defineMacro("\\Eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"2212\\char"2237}}');
  defineMacro("\\colonapprox", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"3a\\char"2248}}');
  defineMacro("\\Colonapprox", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"2237\\char"2248}}');
  defineMacro("\\colonsim", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"3a\\char"223c}}');
  defineMacro("\\Colonsim", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"2237\\char"223c}}');
  defineMacro("\u2237", "\\dblcolon");
  defineMacro("\u2239", "\\eqcolon");
  defineMacro("\u2254", "\\coloneqq");
  defineMacro("\u2255", "\\eqqcolon");
  defineMacro("\u2A74", "\\Coloneqq");
  defineMacro("\\ratio", "\\vcentcolon");
  defineMacro("\\coloncolon", "\\dblcolon");
  defineMacro("\\colonequals", "\\coloneqq");
  defineMacro("\\coloncolonequals", "\\Coloneqq");
  defineMacro("\\equalscolon", "\\eqqcolon");
  defineMacro("\\equalscoloncolon", "\\Eqqcolon");
  defineMacro("\\colonminus", "\\coloneq");
  defineMacro("\\coloncolonminus", "\\Coloneq");
  defineMacro("\\minuscolon", "\\eqcolon");
  defineMacro("\\minuscoloncolon", "\\Eqcolon");
  defineMacro("\\coloncolonapprox", "\\Colonapprox");
  defineMacro("\\coloncolonsim", "\\Colonsim");
  defineMacro("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
  defineMacro("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}");
  defineMacro("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
  defineMacro("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}");
  defineMacro("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`\u220C}}");
  defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
  defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");
  defineMacro("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
  defineMacro("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
  defineMacro("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{lim}}");
  defineMacro("\\varliminf", "\\DOTSB\\operatorname*{\\underline{lim}}");
  defineMacro("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{lim}}");
  defineMacro("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{lim}}");
  defineMacro("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{\u2269}");
  defineMacro("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{\u2268}");
  defineMacro("\\ngeqq", "\\html@mathml{\\@ngeqq}{\u2271}");
  defineMacro("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{\u2271}");
  defineMacro("\\nleqq", "\\html@mathml{\\@nleqq}{\u2270}");
  defineMacro("\\nleqslant", "\\html@mathml{\\@nleqslant}{\u2270}");
  defineMacro("\\nshortmid", "\\html@mathml{\\@nshortmid}{\u2224}");
  defineMacro("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{\u2226}");
  defineMacro("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{\u2288}");
  defineMacro("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{\u2289}");
  defineMacro("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{\u228A}");
  defineMacro("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{\u2ACB}");
  defineMacro("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{\u228B}");
  defineMacro("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{\u2ACC}");
  defineMacro("\\imath", "\\html@mathml{\\@imath}{\u0131}");
  defineMacro("\\jmath", "\\html@mathml{\\@jmath}{\u0237}");
  defineMacro("\\llbracket", "\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`\u27E6}}");
  defineMacro("\\rrbracket", "\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`\u27E7}}");
  defineMacro("\u27E6", "\\llbracket");
  defineMacro("\u27E7", "\\rrbracket");
  defineMacro("\\lBrace", "\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`\u2983}}");
  defineMacro("\\rBrace", "\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`\u2984}}");
  defineMacro("\u2983", "\\lBrace");
  defineMacro("\u2984", "\\rBrace");
  defineMacro("\\minuso", "\\mathbin{\\html@mathml{{\\mathrlap{\\mathchoice{\\kern{0.145em}}{\\kern{0.145em}}{\\kern{0.1015em}}{\\kern{0.0725em}}\\circ}{-}}}{\\char`\u29B5}}");
  defineMacro("\u29B5", "\\minuso");
  defineMacro("\\darr", "\\downarrow");
  defineMacro("\\dArr", "\\Downarrow");
  defineMacro("\\Darr", "\\Downarrow");
  defineMacro("\\lang", "\\langle");
  defineMacro("\\rang", "\\rangle");
  defineMacro("\\uarr", "\\uparrow");
  defineMacro("\\uArr", "\\Uparrow");
  defineMacro("\\Uarr", "\\Uparrow");
  defineMacro("\\N", "\\mathbb{N}");
  defineMacro("\\R", "\\mathbb{R}");
  defineMacro("\\Z", "\\mathbb{Z}");
  defineMacro("\\alef", "\\aleph");
  defineMacro("\\alefsym", "\\aleph");
  defineMacro("\\Alpha", "\\mathrm{A}");
  defineMacro("\\Beta", "\\mathrm{B}");
  defineMacro("\\bull", "\\bullet");
  defineMacro("\\Chi", "\\mathrm{X}");
  defineMacro("\\clubs", "\\clubsuit");
  defineMacro("\\cnums", "\\mathbb{C}");
  defineMacro("\\Complex", "\\mathbb{C}");
  defineMacro("\\Dagger", "\\ddagger");
  defineMacro("\\diamonds", "\\diamondsuit");
  defineMacro("\\empty", "\\emptyset");
  defineMacro("\\Epsilon", "\\mathrm{E}");
  defineMacro("\\Eta", "\\mathrm{H}");
  defineMacro("\\exist", "\\exists");
  defineMacro("\\harr", "\\leftrightarrow");
  defineMacro("\\hArr", "\\Leftrightarrow");
  defineMacro("\\Harr", "\\Leftrightarrow");
  defineMacro("\\hearts", "\\heartsuit");
  defineMacro("\\image", "\\Im");
  defineMacro("\\infin", "\\infty");
  defineMacro("\\Iota", "\\mathrm{I}");
  defineMacro("\\isin", "\\in");
  defineMacro("\\Kappa", "\\mathrm{K}");
  defineMacro("\\larr", "\\leftarrow");
  defineMacro("\\lArr", "\\Leftarrow");
  defineMacro("\\Larr", "\\Leftarrow");
  defineMacro("\\lrarr", "\\leftrightarrow");
  defineMacro("\\lrArr", "\\Leftrightarrow");
  defineMacro("\\Lrarr", "\\Leftrightarrow");
  defineMacro("\\Mu", "\\mathrm{M}");
  defineMacro("\\natnums", "\\mathbb{N}");
  defineMacro("\\Nu", "\\mathrm{N}");
  defineMacro("\\Omicron", "\\mathrm{O}");
  defineMacro("\\plusmn", "\\pm");
  defineMacro("\\rarr", "\\rightarrow");
  defineMacro("\\rArr", "\\Rightarrow");
  defineMacro("\\Rarr", "\\Rightarrow");
  defineMacro("\\real", "\\Re");
  defineMacro("\\reals", "\\mathbb{R}");
  defineMacro("\\Reals", "\\mathbb{R}");
  defineMacro("\\Rho", "\\mathrm{P}");
  defineMacro("\\sdot", "\\cdot");
  defineMacro("\\sect", "\\S");
  defineMacro("\\spades", "\\spadesuit");
  defineMacro("\\sub", "\\subset");
  defineMacro("\\sube", "\\subseteq");
  defineMacro("\\supe", "\\supseteq");
  defineMacro("\\Tau", "\\mathrm{T}");
  defineMacro("\\thetasym", "\\vartheta");
  defineMacro("\\weierp", "\\wp");
  defineMacro("\\Zeta", "\\mathrm{Z}");
  defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
  defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
  defineMacro("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits");
  defineMacro("\\bra", "\\mathinner{\\langle{#1}|}");
  defineMacro("\\ket", "\\mathinner{|{#1}\\rangle}");
  defineMacro("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
  defineMacro("\\Bra", "\\left\\langle#1\\right|");
  defineMacro("\\Ket", "\\left|#1\\right\\rangle");
  var braketHelper = /* @__PURE__ */ __name((one) => (context) => {
    var left = context.consumeArg().tokens;
    var middle = context.consumeArg().tokens;
    var middleDouble = context.consumeArg().tokens;
    var right = context.consumeArg().tokens;
    var oldMiddle = context.macros.get("|");
    var oldMiddleDouble = context.macros.get("\\|");
    context.macros.beginGroup();
    var midMacro = /* @__PURE__ */ __name((double) => (context2) => {
      if (one) {
        context2.macros.set("|", oldMiddle);
        if (middleDouble.length) {
          context2.macros.set("\\|", oldMiddleDouble);
        }
      }
      var doubled = double;
      if (!double && middleDouble.length) {
        var nextToken = context2.future();
        if (nextToken.text === "|") {
          context2.popToken();
          doubled = true;
        }
      }
      return {
        tokens: doubled ? middleDouble : middle,
        numArgs: 0
      };
    }, "midMacro");
    context.macros.set("|", midMacro(false));
    if (middleDouble.length) {
      context.macros.set("\\|", midMacro(true));
    }
    var arg = context.consumeArg().tokens;
    var expanded = context.expandTokens([
      ...right,
      ...arg,
      ...left
      // reversed
    ]);
    context.macros.endGroup();
    return {
      tokens: expanded.reverse(),
      numArgs: 0
    };
  }, "braketHelper");
  defineMacro("\\bra@ket", braketHelper(false));
  defineMacro("\\bra@set", braketHelper(true));
  defineMacro("\\Braket", "\\bra@ket{\\left\\langle}{\\,\\middle\\vert\\,}{\\,\\middle\\vert\\,}{\\right\\rangle}");
  defineMacro("\\Set", "\\bra@set{\\left\\{\\:}{\\;\\middle\\vert\\;}{\\;\\middle\\Vert\\;}{\\:\\right\\}}");
  defineMacro("\\set", "\\bra@set{\\{\\,}{\\mid}{}{\\,\\}}");
  defineMacro("\\angln", "{\\angl n}");
  defineMacro("\\blue", "\\textcolor{##6495ed}{#1}");
  defineMacro("\\orange", "\\textcolor{##ffa500}{#1}");
  defineMacro("\\pink", "\\textcolor{##ff00af}{#1}");
  defineMacro("\\red", "\\textcolor{##df0030}{#1}");
  defineMacro("\\green", "\\textcolor{##28ae7b}{#1}");
  defineMacro("\\gray", "\\textcolor{gray}{#1}");
  defineMacro("\\purple", "\\textcolor{##9d38bd}{#1}");
  defineMacro("\\blueA", "\\textcolor{##ccfaff}{#1}");
  defineMacro("\\blueB", "\\textcolor{##80f6ff}{#1}");
  defineMacro("\\blueC", "\\textcolor{##63d9ea}{#1}");
  defineMacro("\\blueD", "\\textcolor{##11accd}{#1}");
  defineMacro("\\blueE", "\\textcolor{##0c7f99}{#1}");
  defineMacro("\\tealA", "\\textcolor{##94fff5}{#1}");
  defineMacro("\\tealB", "\\textcolor{##26edd5}{#1}");
  defineMacro("\\tealC", "\\textcolor{##01d1c1}{#1}");
  defineMacro("\\tealD", "\\textcolor{##01a995}{#1}");
  defineMacro("\\tealE", "\\textcolor{##208170}{#1}");
  defineMacro("\\greenA", "\\textcolor{##b6ffb0}{#1}");
  defineMacro("\\greenB", "\\textcolor{##8af281}{#1}");
  defineMacro("\\greenC", "\\textcolor{##74cf70}{#1}");
  defineMacro("\\greenD", "\\textcolor{##1fab54}{#1}");
  defineMacro("\\greenE", "\\textcolor{##0d923f}{#1}");
  defineMacro("\\goldA", "\\textcolor{##ffd0a9}{#1}");
  defineMacro("\\goldB", "\\textcolor{##ffbb71}{#1}");
  defineMacro("\\goldC", "\\textcolor{##ff9c39}{#1}");
  defineMacro("\\goldD", "\\textcolor{##e07d10}{#1}");
  defineMacro("\\goldE", "\\textcolor{##a75a05}{#1}");
  defineMacro("\\redA", "\\textcolor{##fca9a9}{#1}");
  defineMacro("\\redB", "\\textcolor{##ff8482}{#1}");
  defineMacro("\\redC", "\\textcolor{##f9685d}{#1}");
  defineMacro("\\redD", "\\textcolor{##e84d39}{#1}");
  defineMacro("\\redE", "\\textcolor{##bc2612}{#1}");
  defineMacro("\\maroonA", "\\textcolor{##ffbde0}{#1}");
  defineMacro("\\maroonB", "\\textcolor{##ff92c6}{#1}");
  defineMacro("\\maroonC", "\\textcolor{##ed5fa6}{#1}");
  defineMacro("\\maroonD", "\\textcolor{##ca337c}{#1}");
  defineMacro("\\maroonE", "\\textcolor{##9e034e}{#1}");
  defineMacro("\\purpleA", "\\textcolor{##ddd7ff}{#1}");
  defineMacro("\\purpleB", "\\textcolor{##c6b9fc}{#1}");
  defineMacro("\\purpleC", "\\textcolor{##aa87ff}{#1}");
  defineMacro("\\purpleD", "\\textcolor{##7854ab}{#1}");
  defineMacro("\\purpleE", "\\textcolor{##543b78}{#1}");
  defineMacro("\\mintA", "\\textcolor{##f5f9e8}{#1}");
  defineMacro("\\mintB", "\\textcolor{##edf2df}{#1}");
  defineMacro("\\mintC", "\\textcolor{##e0e5cc}{#1}");
  defineMacro("\\grayA", "\\textcolor{##f6f7f7}{#1}");
  defineMacro("\\grayB", "\\textcolor{##f0f1f2}{#1}");
  defineMacro("\\grayC", "\\textcolor{##e3e5e6}{#1}");
  defineMacro("\\grayD", "\\textcolor{##d6d8da}{#1}");
  defineMacro("\\grayE", "\\textcolor{##babec2}{#1}");
  defineMacro("\\grayF", "\\textcolor{##888d93}{#1}");
  defineMacro("\\grayG", "\\textcolor{##626569}{#1}");
  defineMacro("\\grayH", "\\textcolor{##3b3e40}{#1}");
  defineMacro("\\grayI", "\\textcolor{##21242c}{#1}");
  defineMacro("\\kaBlue", "\\textcolor{##314453}{#1}");
  defineMacro("\\kaGreen", "\\textcolor{##71B307}{#1}");
  var implicitCommands = {
    "^": true,
    // Parser.js
    "_": true,
    // Parser.js
    "\\limits": true,
    // Parser.js
    "\\nolimits": true
    // Parser.js
  };
  var MacroExpander = class {
    static {
      __name(this, "MacroExpander");
    }
    constructor(input, settings, mode) {
      this.settings = void 0;
      this.expansionCount = void 0;
      this.lexer = void 0;
      this.macros = void 0;
      this.stack = void 0;
      this.mode = void 0;
      this.settings = settings;
      this.expansionCount = 0;
      this.feed(input);
      this.macros = new Namespace(macros, settings.macros);
      this.mode = mode;
      this.stack = [];
    }
    /**
     * Feed a new input string to the same MacroExpander
     * (with existing macros etc.).
     */
    feed(input) {
      this.lexer = new Lexer(input, this.settings);
    }
    /**
     * Switches between "text" and "math" modes.
     */
    switchMode(newMode) {
      this.mode = newMode;
    }
    /**
     * Start a new group nesting within all namespaces.
     */
    beginGroup() {
      this.macros.beginGroup();
    }
    /**
     * End current group nesting within all namespaces.
     */
    endGroup() {
      this.macros.endGroup();
    }
    /**
     * Ends all currently nested groups (if any), restoring values before the
     * groups began.  Useful in case of an error in the middle of parsing.
     */
    endGroups() {
      this.macros.endGroups();
    }
    /**
     * Returns the topmost token on the stack, without expanding it.
     * Similar in behavior to TeX's `\futurelet`.
     */
    future() {
      if (this.stack.length === 0) {
        this.pushToken(this.lexer.lex());
      }
      return this.stack[this.stack.length - 1];
    }
    /**
     * Remove and return the next unexpanded token.
     */
    popToken() {
      this.future();
      return this.stack.pop();
    }
    /**
     * Add a given token to the token stack.  In particular, this get be used
     * to put back a token returned from one of the other methods.
     */
    pushToken(token) {
      this.stack.push(token);
    }
    /**
     * Append an array of tokens to the token stack.
     */
    pushTokens(tokens) {
      this.stack.push(...tokens);
    }
    /**
     * Find an macro argument without expanding tokens and append the array of
     * tokens to the token stack. Uses Token as a container for the result.
     */
    scanArgument(isOptional) {
      var start;
      var end;
      var tokens;
      if (isOptional) {
        this.consumeSpaces();
        if (this.future().text !== "[") {
          return null;
        }
        start = this.popToken();
        ({
          tokens,
          end
        } = this.consumeArg(["]"]));
      } else {
        ({
          tokens,
          start,
          end
        } = this.consumeArg());
      }
      this.pushToken(new Token2("EOF", end.loc));
      this.pushTokens(tokens);
      return new Token2("", SourceLocation.range(start, end));
    }
    /**
     * Consume all following space tokens, without expansion.
     */
    consumeSpaces() {
      for (; ; ) {
        var token = this.future();
        if (token.text === " ") {
          this.stack.pop();
        } else {
          break;
        }
      }
    }
    /**
     * Consume an argument from the token stream, and return the resulting array
     * of tokens and start/end token.
     */
    consumeArg(delims2) {
      var tokens = [];
      var isDelimited = delims2 && delims2.length > 0;
      if (!isDelimited) {
        this.consumeSpaces();
      }
      var start = this.future();
      var tok;
      var depth = 0;
      var match2 = 0;
      do {
        tok = this.popToken();
        tokens.push(tok);
        if (tok.text === "{") {
          ++depth;
        } else if (tok.text === "}") {
          --depth;
          if (depth === -1) {
            throw new ParseError("Extra }", tok);
          }
        } else if (tok.text === "EOF") {
          throw new ParseError("Unexpected end of input in a macro argument, expected '" + (delims2 && isDelimited ? delims2[match2] : "}") + "'", tok);
        }
        if (delims2 && isDelimited) {
          if ((depth === 0 || depth === 1 && delims2[match2] === "{") && tok.text === delims2[match2]) {
            ++match2;
            if (match2 === delims2.length) {
              tokens.splice(-match2, match2);
              break;
            }
          } else {
            match2 = 0;
          }
        }
      } while (depth !== 0 || isDelimited);
      if (start.text === "{" && tokens[tokens.length - 1].text === "}") {
        tokens.pop();
        tokens.shift();
      }
      tokens.reverse();
      return {
        tokens,
        start,
        end: tok
      };
    }
    /**
     * Consume the specified number of (delimited) arguments from the token
     * stream and return the resulting array of arguments.
     */
    consumeArgs(numArgs, delimiters2) {
      if (delimiters2) {
        if (delimiters2.length !== numArgs + 1) {
          throw new ParseError("The length of delimiters doesn't match the number of args!");
        }
        var delims2 = delimiters2[0];
        for (var i = 0; i < delims2.length; i++) {
          var tok = this.popToken();
          if (delims2[i] !== tok.text) {
            throw new ParseError("Use of the macro doesn't match its definition", tok);
          }
        }
      }
      var args = [];
      for (var _i = 0; _i < numArgs; _i++) {
        args.push(this.consumeArg(delimiters2 && delimiters2[_i + 1]).tokens);
      }
      return args;
    }
    /**
     * Increment `expansionCount` by the specified amount.
     * Throw an error if it exceeds `maxExpand`.
     */
    countExpansion(amount) {
      this.expansionCount += amount;
      if (this.expansionCount > this.settings.maxExpand) {
        throw new ParseError("Too many expansions: infinite loop or need to increase maxExpand setting");
      }
    }
    /**
     * Expand the next token only once if possible.
     *
     * If the token is expanded, the resulting tokens will be pushed onto
     * the stack in reverse order, and the number of such tokens will be
     * returned.  This number might be zero or positive.
     *
     * If not, the return value is `false`, and the next token remains at the
     * top of the stack.
     *
     * In either case, the next token will be on the top of the stack,
     * or the stack will be empty (in case of empty expansion
     * and no other tokens).
     *
     * Used to implement `expandAfterFuture` and `expandNextToken`.
     *
     * If expandableOnly, only expandable tokens are expanded and
     * an undefined control sequence results in an error.
     */
    expandOnce(expandableOnly) {
      var topToken = this.popToken();
      var name = topToken.text;
      var expansion = !topToken.noexpand ? this._getExpansion(name) : null;
      if (expansion == null || expandableOnly && expansion.unexpandable) {
        if (expandableOnly && expansion == null && name[0] === "\\" && !this.isDefined(name)) {
          throw new ParseError("Undefined control sequence: " + name);
        }
        this.pushToken(topToken);
        return false;
      }
      this.countExpansion(1);
      var tokens = expansion.tokens;
      var args = this.consumeArgs(expansion.numArgs, expansion.delimiters);
      if (expansion.numArgs) {
        tokens = tokens.slice();
        for (var i = tokens.length - 1; i >= 0; --i) {
          var tok = tokens[i];
          if (tok.text === "#") {
            if (i === 0) {
              throw new ParseError("Incomplete placeholder at end of macro body", tok);
            }
            tok = tokens[--i];
            if (tok.text === "#") {
              tokens.splice(i + 1, 1);
            } else if (/^[1-9]$/.test(tok.text)) {
              tokens.splice(i, 2, ...args[+tok.text - 1]);
            } else {
              throw new ParseError("Not a valid argument number", tok);
            }
          }
        }
      }
      this.pushTokens(tokens);
      return tokens.length;
    }
    /**
     * Expand the next token only once (if possible), and return the resulting
     * top token on the stack (without removing anything from the stack).
     * Similar in behavior to TeX's `\expandafter\futurelet`.
     * Equivalent to expandOnce() followed by future().
     */
    expandAfterFuture() {
      this.expandOnce();
      return this.future();
    }
    /**
     * Recursively expand first token, then return first non-expandable token.
     */
    expandNextToken() {
      for (; ; ) {
        if (this.expandOnce() === false) {
          var token = this.stack.pop();
          if (token.treatAsRelax) {
            token.text = "\\relax";
          }
          return token;
        }
      }
    }
    /**
     * Fully expand the given macro name and return the resulting list of
     * tokens, or return `undefined` if no such macro is defined.
     */
    expandMacro(name) {
      return this.macros.has(name) ? this.expandTokens([new Token2(name)]) : void 0;
    }
    /**
     * Fully expand the given token stream and return the resulting list of
     * tokens.  Note that the input tokens are in reverse order, but the
     * output tokens are in forward order.
     */
    expandTokens(tokens) {
      var output = [];
      var oldStackLength = this.stack.length;
      this.pushTokens(tokens);
      while (this.stack.length > oldStackLength) {
        if (this.expandOnce(true) === false) {
          var token = this.stack.pop();
          if (token.treatAsRelax) {
            token.noexpand = false;
            token.treatAsRelax = false;
          }
          output.push(token);
        }
      }
      this.countExpansion(output.length);
      return output;
    }
    /**
     * Fully expand the given macro name and return the result as a string,
     * or return `undefined` if no such macro is defined.
     */
    expandMacroAsText(name) {
      var tokens = this.expandMacro(name);
      if (tokens) {
        return tokens.map((token) => token.text).join("");
      } else {
        return tokens;
      }
    }
    /**
     * Returns the expanded macro as a reversed array of tokens and a macro
     * argument count.  Or returns `null` if no such macro.
     */
    _getExpansion(name) {
      var definition = this.macros.get(name);
      if (definition == null) {
        return definition;
      }
      if (name.length === 1) {
        var catcode = this.lexer.catcodes[name];
        if (catcode != null && catcode !== 13) {
          return;
        }
      }
      var expansion = typeof definition === "function" ? definition(this) : definition;
      if (typeof expansion === "string") {
        var numArgs = 0;
        if (expansion.includes("#")) {
          var stripped = expansion.replace(/##/g, "");
          while (stripped.includes("#" + (numArgs + 1))) {
            ++numArgs;
          }
        }
        var bodyLexer = new Lexer(expansion, this.settings);
        var tokens = [];
        var tok = bodyLexer.lex();
        while (tok.text !== "EOF") {
          tokens.push(tok);
          tok = bodyLexer.lex();
        }
        tokens.reverse();
        var expanded = {
          tokens,
          numArgs
        };
        return expanded;
      }
      return expansion;
    }
    /**
     * Determine whether a command is currently "defined" (has some
     * functionality), meaning that it's a macro (in the current group),
     * a function, a symbol, or one of the special commands listed in
     * `implicitCommands`.
     */
    isDefined(name) {
      return this.macros.has(name) || functions.hasOwnProperty(name) || symbols.math.hasOwnProperty(name) || symbols.text.hasOwnProperty(name) || implicitCommands.hasOwnProperty(name);
    }
    /**
     * Determine whether a command is expandable.
     */
    isExpandable(name) {
      var macro = this.macros.get(name);
      return macro != null ? typeof macro === "string" || typeof macro === "function" || !macro.unexpandable : functions.hasOwnProperty(name) && !functions[name].primitive;
    }
  };
  var unicodeSubRegEx = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/;
  var uSubsAndSups = Object.freeze({
    "\u208A": "+",
    "\u208B": "-",
    "\u208C": "=",
    "\u208D": "(",
    "\u208E": ")",
    "\u2080": "0",
    "\u2081": "1",
    "\u2082": "2",
    "\u2083": "3",
    "\u2084": "4",
    "\u2085": "5",
    "\u2086": "6",
    "\u2087": "7",
    "\u2088": "8",
    "\u2089": "9",
    "\u2090": "a",
    "\u2091": "e",
    "\u2095": "h",
    "\u1D62": "i",
    "\u2C7C": "j",
    "\u2096": "k",
    "\u2097": "l",
    "\u2098": "m",
    "\u2099": "n",
    "\u2092": "o",
    "\u209A": "p",
    "\u1D63": "r",
    "\u209B": "s",
    "\u209C": "t",
    "\u1D64": "u",
    "\u1D65": "v",
    "\u2093": "x",
    "\u1D66": "\u03B2",
    "\u1D67": "\u03B3",
    "\u1D68": "\u03C1",
    "\u1D69": "\u03D5",
    "\u1D6A": "\u03C7",
    "\u207A": "+",
    "\u207B": "-",
    "\u207C": "=",
    "\u207D": "(",
    "\u207E": ")",
    "\u2070": "0",
    "\xB9": "1",
    "\xB2": "2",
    "\xB3": "3",
    "\u2074": "4",
    "\u2075": "5",
    "\u2076": "6",
    "\u2077": "7",
    "\u2078": "8",
    "\u2079": "9",
    "\u1D2C": "A",
    "\u1D2E": "B",
    "\u1D30": "D",
    "\u1D31": "E",
    "\u1D33": "G",
    "\u1D34": "H",
    "\u1D35": "I",
    "\u1D36": "J",
    "\u1D37": "K",
    "\u1D38": "L",
    "\u1D39": "M",
    "\u1D3A": "N",
    "\u1D3C": "O",
    "\u1D3E": "P",
    "\u1D3F": "R",
    "\u1D40": "T",
    "\u1D41": "U",
    "\u2C7D": "V",
    "\u1D42": "W",
    "\u1D43": "a",
    "\u1D47": "b",
    "\u1D9C": "c",
    "\u1D48": "d",
    "\u1D49": "e",
    "\u1DA0": "f",
    "\u1D4D": "g",
    "\u02B0": "h",
    "\u2071": "i",
    "\u02B2": "j",
    "\u1D4F": "k",
    "\u02E1": "l",
    "\u1D50": "m",
    "\u207F": "n",
    "\u1D52": "o",
    "\u1D56": "p",
    "\u02B3": "r",
    "\u02E2": "s",
    "\u1D57": "t",
    "\u1D58": "u",
    "\u1D5B": "v",
    "\u02B7": "w",
    "\u02E3": "x",
    "\u02B8": "y",
    "\u1DBB": "z",
    "\u1D5D": "\u03B2",
    "\u1D5E": "\u03B3",
    "\u1D5F": "\u03B4",
    "\u1D60": "\u03D5",
    "\u1D61": "\u03C7",
    "\u1DBF": "\u03B8"
  });
  var unicodeAccents = {
    "\u0301": {
      "text": "\\'",
      "math": "\\acute"
    },
    "\u0300": {
      "text": "\\`",
      "math": "\\grave"
    },
    "\u0308": {
      "text": '\\"',
      "math": "\\ddot"
    },
    "\u0303": {
      "text": "\\~",
      "math": "\\tilde"
    },
    "\u0304": {
      "text": "\\=",
      "math": "\\bar"
    },
    "\u0306": {
      "text": "\\u",
      "math": "\\breve"
    },
    "\u030C": {
      "text": "\\v",
      "math": "\\check"
    },
    "\u0302": {
      "text": "\\^",
      "math": "\\hat"
    },
    "\u0307": {
      "text": "\\.",
      "math": "\\dot"
    },
    "\u030A": {
      "text": "\\r",
      "math": "\\mathring"
    },
    "\u030B": {
      "text": "\\H"
    },
    "\u0327": {
      "text": "\\c"
    }
  };
  var unicodeSymbols = {
    "\xE1": "a\u0301",
    "\xE0": "a\u0300",
    "\xE4": "a\u0308",
    "\u01DF": "a\u0308\u0304",
    "\xE3": "a\u0303",
    "\u0101": "a\u0304",
    "\u0103": "a\u0306",
    "\u1EAF": "a\u0306\u0301",
    "\u1EB1": "a\u0306\u0300",
    "\u1EB5": "a\u0306\u0303",
    "\u01CE": "a\u030C",
    "\xE2": "a\u0302",
    "\u1EA5": "a\u0302\u0301",
    "\u1EA7": "a\u0302\u0300",
    "\u1EAB": "a\u0302\u0303",
    "\u0227": "a\u0307",
    "\u01E1": "a\u0307\u0304",
    "\xE5": "a\u030A",
    "\u01FB": "a\u030A\u0301",
    "\u1E03": "b\u0307",
    "\u0107": "c\u0301",
    "\u1E09": "c\u0327\u0301",
    "\u010D": "c\u030C",
    "\u0109": "c\u0302",
    "\u010B": "c\u0307",
    "\xE7": "c\u0327",
    "\u010F": "d\u030C",
    "\u1E0B": "d\u0307",
    "\u1E11": "d\u0327",
    "\xE9": "e\u0301",
    "\xE8": "e\u0300",
    "\xEB": "e\u0308",
    "\u1EBD": "e\u0303",
    "\u0113": "e\u0304",
    "\u1E17": "e\u0304\u0301",
    "\u1E15": "e\u0304\u0300",
    "\u0115": "e\u0306",
    "\u1E1D": "e\u0327\u0306",
    "\u011B": "e\u030C",
    "\xEA": "e\u0302",
    "\u1EBF": "e\u0302\u0301",
    "\u1EC1": "e\u0302\u0300",
    "\u1EC5": "e\u0302\u0303",
    "\u0117": "e\u0307",
    "\u0229": "e\u0327",
    "\u1E1F": "f\u0307",
    "\u01F5": "g\u0301",
    "\u1E21": "g\u0304",
    "\u011F": "g\u0306",
    "\u01E7": "g\u030C",
    "\u011D": "g\u0302",
    "\u0121": "g\u0307",
    "\u0123": "g\u0327",
    "\u1E27": "h\u0308",
    "\u021F": "h\u030C",
    "\u0125": "h\u0302",
    "\u1E23": "h\u0307",
    "\u1E29": "h\u0327",
    "\xED": "i\u0301",
    "\xEC": "i\u0300",
    "\xEF": "i\u0308",
    "\u1E2F": "i\u0308\u0301",
    "\u0129": "i\u0303",
    "\u012B": "i\u0304",
    "\u012D": "i\u0306",
    "\u01D0": "i\u030C",
    "\xEE": "i\u0302",
    "\u01F0": "j\u030C",
    "\u0135": "j\u0302",
    "\u1E31": "k\u0301",
    "\u01E9": "k\u030C",
    "\u0137": "k\u0327",
    "\u013A": "l\u0301",
    "\u013E": "l\u030C",
    "\u013C": "l\u0327",
    "\u1E3F": "m\u0301",
    "\u1E41": "m\u0307",
    "\u0144": "n\u0301",
    "\u01F9": "n\u0300",
    "\xF1": "n\u0303",
    "\u0148": "n\u030C",
    "\u1E45": "n\u0307",
    "\u0146": "n\u0327",
    "\xF3": "o\u0301",
    "\xF2": "o\u0300",
    "\xF6": "o\u0308",
    "\u022B": "o\u0308\u0304",
    "\xF5": "o\u0303",
    "\u1E4D": "o\u0303\u0301",
    "\u1E4F": "o\u0303\u0308",
    "\u022D": "o\u0303\u0304",
    "\u014D": "o\u0304",
    "\u1E53": "o\u0304\u0301",
    "\u1E51": "o\u0304\u0300",
    "\u014F": "o\u0306",
    "\u01D2": "o\u030C",
    "\xF4": "o\u0302",
    "\u1ED1": "o\u0302\u0301",
    "\u1ED3": "o\u0302\u0300",
    "\u1ED7": "o\u0302\u0303",
    "\u022F": "o\u0307",
    "\u0231": "o\u0307\u0304",
    "\u0151": "o\u030B",
    "\u1E55": "p\u0301",
    "\u1E57": "p\u0307",
    "\u0155": "r\u0301",
    "\u0159": "r\u030C",
    "\u1E59": "r\u0307",
    "\u0157": "r\u0327",
    "\u015B": "s\u0301",
    "\u1E65": "s\u0301\u0307",
    "\u0161": "s\u030C",
    "\u1E67": "s\u030C\u0307",
    "\u015D": "s\u0302",
    "\u1E61": "s\u0307",
    "\u015F": "s\u0327",
    "\u1E97": "t\u0308",
    "\u0165": "t\u030C",
    "\u1E6B": "t\u0307",
    "\u0163": "t\u0327",
    "\xFA": "u\u0301",
    "\xF9": "u\u0300",
    "\xFC": "u\u0308",
    "\u01D8": "u\u0308\u0301",
    "\u01DC": "u\u0308\u0300",
    "\u01D6": "u\u0308\u0304",
    "\u01DA": "u\u0308\u030C",
    "\u0169": "u\u0303",
    "\u1E79": "u\u0303\u0301",
    "\u016B": "u\u0304",
    "\u1E7B": "u\u0304\u0308",
    "\u016D": "u\u0306",
    "\u01D4": "u\u030C",
    "\xFB": "u\u0302",
    "\u016F": "u\u030A",
    "\u0171": "u\u030B",
    "\u1E7D": "v\u0303",
    "\u1E83": "w\u0301",
    "\u1E81": "w\u0300",
    "\u1E85": "w\u0308",
    "\u0175": "w\u0302",
    "\u1E87": "w\u0307",
    "\u1E98": "w\u030A",
    "\u1E8D": "x\u0308",
    "\u1E8B": "x\u0307",
    "\xFD": "y\u0301",
    "\u1EF3": "y\u0300",
    "\xFF": "y\u0308",
    "\u1EF9": "y\u0303",
    "\u0233": "y\u0304",
    "\u0177": "y\u0302",
    "\u1E8F": "y\u0307",
    "\u1E99": "y\u030A",
    "\u017A": "z\u0301",
    "\u017E": "z\u030C",
    "\u1E91": "z\u0302",
    "\u017C": "z\u0307",
    "\xC1": "A\u0301",
    "\xC0": "A\u0300",
    "\xC4": "A\u0308",
    "\u01DE": "A\u0308\u0304",
    "\xC3": "A\u0303",
    "\u0100": "A\u0304",
    "\u0102": "A\u0306",
    "\u1EAE": "A\u0306\u0301",
    "\u1EB0": "A\u0306\u0300",
    "\u1EB4": "A\u0306\u0303",
    "\u01CD": "A\u030C",
    "\xC2": "A\u0302",
    "\u1EA4": "A\u0302\u0301",
    "\u1EA6": "A\u0302\u0300",
    "\u1EAA": "A\u0302\u0303",
    "\u0226": "A\u0307",
    "\u01E0": "A\u0307\u0304",
    "\xC5": "A\u030A",
    "\u01FA": "A\u030A\u0301",
    "\u1E02": "B\u0307",
    "\u0106": "C\u0301",
    "\u1E08": "C\u0327\u0301",
    "\u010C": "C\u030C",
    "\u0108": "C\u0302",
    "\u010A": "C\u0307",
    "\xC7": "C\u0327",
    "\u010E": "D\u030C",
    "\u1E0A": "D\u0307",
    "\u1E10": "D\u0327",
    "\xC9": "E\u0301",
    "\xC8": "E\u0300",
    "\xCB": "E\u0308",
    "\u1EBC": "E\u0303",
    "\u0112": "E\u0304",
    "\u1E16": "E\u0304\u0301",
    "\u1E14": "E\u0304\u0300",
    "\u0114": "E\u0306",
    "\u1E1C": "E\u0327\u0306",
    "\u011A": "E\u030C",
    "\xCA": "E\u0302",
    "\u1EBE": "E\u0302\u0301",
    "\u1EC0": "E\u0302\u0300",
    "\u1EC4": "E\u0302\u0303",
    "\u0116": "E\u0307",
    "\u0228": "E\u0327",
    "\u1E1E": "F\u0307",
    "\u01F4": "G\u0301",
    "\u1E20": "G\u0304",
    "\u011E": "G\u0306",
    "\u01E6": "G\u030C",
    "\u011C": "G\u0302",
    "\u0120": "G\u0307",
    "\u0122": "G\u0327",
    "\u1E26": "H\u0308",
    "\u021E": "H\u030C",
    "\u0124": "H\u0302",
    "\u1E22": "H\u0307",
    "\u1E28": "H\u0327",
    "\xCD": "I\u0301",
    "\xCC": "I\u0300",
    "\xCF": "I\u0308",
    "\u1E2E": "I\u0308\u0301",
    "\u0128": "I\u0303",
    "\u012A": "I\u0304",
    "\u012C": "I\u0306",
    "\u01CF": "I\u030C",
    "\xCE": "I\u0302",
    "\u0130": "I\u0307",
    "\u0134": "J\u0302",
    "\u1E30": "K\u0301",
    "\u01E8": "K\u030C",
    "\u0136": "K\u0327",
    "\u0139": "L\u0301",
    "\u013D": "L\u030C",
    "\u013B": "L\u0327",
    "\u1E3E": "M\u0301",
    "\u1E40": "M\u0307",
    "\u0143": "N\u0301",
    "\u01F8": "N\u0300",
    "\xD1": "N\u0303",
    "\u0147": "N\u030C",
    "\u1E44": "N\u0307",
    "\u0145": "N\u0327",
    "\xD3": "O\u0301",
    "\xD2": "O\u0300",
    "\xD6": "O\u0308",
    "\u022A": "O\u0308\u0304",
    "\xD5": "O\u0303",
    "\u1E4C": "O\u0303\u0301",
    "\u1E4E": "O\u0303\u0308",
    "\u022C": "O\u0303\u0304",
    "\u014C": "O\u0304",
    "\u1E52": "O\u0304\u0301",
    "\u1E50": "O\u0304\u0300",
    "\u014E": "O\u0306",
    "\u01D1": "O\u030C",
    "\xD4": "O\u0302",
    "\u1ED0": "O\u0302\u0301",
    "\u1ED2": "O\u0302\u0300",
    "\u1ED6": "O\u0302\u0303",
    "\u022E": "O\u0307",
    "\u0230": "O\u0307\u0304",
    "\u0150": "O\u030B",
    "\u1E54": "P\u0301",
    "\u1E56": "P\u0307",
    "\u0154": "R\u0301",
    "\u0158": "R\u030C",
    "\u1E58": "R\u0307",
    "\u0156": "R\u0327",
    "\u015A": "S\u0301",
    "\u1E64": "S\u0301\u0307",
    "\u0160": "S\u030C",
    "\u1E66": "S\u030C\u0307",
    "\u015C": "S\u0302",
    "\u1E60": "S\u0307",
    "\u015E": "S\u0327",
    "\u0164": "T\u030C",
    "\u1E6A": "T\u0307",
    "\u0162": "T\u0327",
    "\xDA": "U\u0301",
    "\xD9": "U\u0300",
    "\xDC": "U\u0308",
    "\u01D7": "U\u0308\u0301",
    "\u01DB": "U\u0308\u0300",
    "\u01D5": "U\u0308\u0304",
    "\u01D9": "U\u0308\u030C",
    "\u0168": "U\u0303",
    "\u1E78": "U\u0303\u0301",
    "\u016A": "U\u0304",
    "\u1E7A": "U\u0304\u0308",
    "\u016C": "U\u0306",
    "\u01D3": "U\u030C",
    "\xDB": "U\u0302",
    "\u016E": "U\u030A",
    "\u0170": "U\u030B",
    "\u1E7C": "V\u0303",
    "\u1E82": "W\u0301",
    "\u1E80": "W\u0300",
    "\u1E84": "W\u0308",
    "\u0174": "W\u0302",
    "\u1E86": "W\u0307",
    "\u1E8C": "X\u0308",
    "\u1E8A": "X\u0307",
    "\xDD": "Y\u0301",
    "\u1EF2": "Y\u0300",
    "\u0178": "Y\u0308",
    "\u1EF8": "Y\u0303",
    "\u0232": "Y\u0304",
    "\u0176": "Y\u0302",
    "\u1E8E": "Y\u0307",
    "\u0179": "Z\u0301",
    "\u017D": "Z\u030C",
    "\u1E90": "Z\u0302",
    "\u017B": "Z\u0307",
    "\u03AC": "\u03B1\u0301",
    "\u1F70": "\u03B1\u0300",
    "\u1FB1": "\u03B1\u0304",
    "\u1FB0": "\u03B1\u0306",
    "\u03AD": "\u03B5\u0301",
    "\u1F72": "\u03B5\u0300",
    "\u03AE": "\u03B7\u0301",
    "\u1F74": "\u03B7\u0300",
    "\u03AF": "\u03B9\u0301",
    "\u1F76": "\u03B9\u0300",
    "\u03CA": "\u03B9\u0308",
    "\u0390": "\u03B9\u0308\u0301",
    "\u1FD2": "\u03B9\u0308\u0300",
    "\u1FD1": "\u03B9\u0304",
    "\u1FD0": "\u03B9\u0306",
    "\u03CC": "\u03BF\u0301",
    "\u1F78": "\u03BF\u0300",
    "\u03CD": "\u03C5\u0301",
    "\u1F7A": "\u03C5\u0300",
    "\u03CB": "\u03C5\u0308",
    "\u03B0": "\u03C5\u0308\u0301",
    "\u1FE2": "\u03C5\u0308\u0300",
    "\u1FE1": "\u03C5\u0304",
    "\u1FE0": "\u03C5\u0306",
    "\u03CE": "\u03C9\u0301",
    "\u1F7C": "\u03C9\u0300",
    "\u038E": "\u03A5\u0301",
    "\u1FEA": "\u03A5\u0300",
    "\u03AB": "\u03A5\u0308",
    "\u1FE9": "\u03A5\u0304",
    "\u1FE8": "\u03A5\u0306",
    "\u038F": "\u03A9\u0301",
    "\u1FFA": "\u03A9\u0300"
  };
  var Parser = class _Parser {
    static {
      __name(this, "Parser");
    }
    constructor(input, settings) {
      this.mode = void 0;
      this.gullet = void 0;
      this.settings = void 0;
      this.leftrightDepth = void 0;
      this.nextToken = void 0;
      this.mode = "math";
      this.gullet = new MacroExpander(input, settings, this.mode);
      this.settings = settings;
      this.leftrightDepth = 0;
      this.nextToken = null;
    }
    /**
     * Checks a result to make sure it has the right type, and throws an
     * appropriate error otherwise.
     */
    expect(text3, consume) {
      if (consume === void 0) {
        consume = true;
      }
      if (this.fetch().text !== text3) {
        throw new ParseError("Expected '" + text3 + "', got '" + this.fetch().text + "'", this.fetch());
      }
      if (consume) {
        this.consume();
      }
    }
    /**
     * Discards the current lookahead token, considering it consumed.
     */
    consume() {
      this.nextToken = null;
    }
    /**
     * Return the current lookahead token, or if there isn't one (at the
     * beginning, or if the previous lookahead token was consume()d),
     * fetch the next token as the new lookahead token and return it.
     */
    fetch() {
      if (this.nextToken == null) {
        this.nextToken = this.gullet.expandNextToken();
      }
      return this.nextToken;
    }
    /**
     * Switches between "text" and "math" modes.
     */
    switchMode(newMode) {
      this.mode = newMode;
      this.gullet.switchMode(newMode);
    }
    /**
     * Main parsing function, which parses an entire input.
     */
    parse() {
      if (!this.settings.globalGroup) {
        this.gullet.beginGroup();
      }
      if (this.settings.colorIsTextColor) {
        this.gullet.macros.set("\\color", "\\textcolor");
      }
      try {
        var parse = this.parseExpression(false);
        this.expect("EOF");
        if (!this.settings.globalGroup) {
          this.gullet.endGroup();
        }
        return parse;
      } finally {
        this.gullet.endGroups();
      }
    }
    /**
     * Fully parse a separate sequence of tokens as a separate job.
     * Tokens should be specified in reverse order, as in a MacroDefinition.
     */
    subparse(tokens) {
      var oldToken = this.nextToken;
      this.consume();
      this.gullet.pushToken(new Token2("}"));
      this.gullet.pushTokens(tokens);
      var parse = this.parseExpression(false);
      this.expect("}");
      this.nextToken = oldToken;
      return parse;
    }
    /**
     * Parses an "expression", which is a list of atoms.
     *
     * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
     *                 happens when functions have higher precedence than infix
     *                 nodes in implicit parses.
     *
     * `breakOnTokenText`: The text of the token that the expression should end
     *                     with, or `null` if something else should end the
     *                     expression.
     */
    parseExpression(breakOnInfix, breakOnTokenText) {
      var body = [];
      while (true) {
        if (this.mode === "math") {
          this.consumeSpaces();
        }
        var lex = this.fetch();
        if (_Parser.endOfExpression.has(lex.text)) {
          break;
        }
        if (breakOnTokenText && lex.text === breakOnTokenText) {
          break;
        }
        if (breakOnInfix && functions[lex.text] && functions[lex.text].infix) {
          break;
        }
        var atom = this.parseAtom(breakOnTokenText);
        if (!atom) {
          break;
        } else if (atom.type === "internal") {
          continue;
        }
        body.push(atom);
      }
      if (this.mode === "text") {
        this.formLigatures(body);
      }
      return this.handleInfixNodes(body);
    }
    /**
     * Rewrites infix operators such as \over with corresponding commands such
     * as \frac.
     *
     * There can only be one infix operator per group.  If there's more than one
     * then the expression is ambiguous.  This can be resolved by adding {}.
     */
    handleInfixNodes(body) {
      var overIndex = -1;
      var funcName;
      for (var i = 0; i < body.length; i++) {
        var node = body[i];
        if (node.type === "infix") {
          if (overIndex !== -1) {
            throw new ParseError("only one infix operator per group", node.token);
          }
          overIndex = i;
          funcName = node.replaceWith;
        }
      }
      if (overIndex !== -1 && funcName) {
        var numerNode;
        var denomNode;
        var numerBody = body.slice(0, overIndex);
        var denomBody = body.slice(overIndex + 1);
        if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
          numerNode = numerBody[0];
        } else {
          numerNode = {
            type: "ordgroup",
            mode: this.mode,
            body: numerBody
          };
        }
        if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
          denomNode = denomBody[0];
        } else {
          denomNode = {
            type: "ordgroup",
            mode: this.mode,
            body: denomBody
          };
        }
        var _node;
        if (funcName === "\\\\abovefrac") {
          _node = this.callFunction(funcName, [numerNode, body[overIndex], denomNode], []);
        } else {
          _node = this.callFunction(funcName, [numerNode, denomNode], []);
        }
        return [_node];
      } else {
        return body;
      }
    }
    /**
     * Handle a subscript or superscript with nice errors.
     */
    handleSupSubscript(name) {
      var symbolToken = this.fetch();
      var symbol = symbolToken.text;
      this.consume();
      this.consumeSpaces();
      var group;
      do {
        var _group;
        group = this.parseGroup(name);
      } while (((_group = group) == null ? void 0 : _group.type) === "internal");
      if (!group) {
        throw new ParseError("Expected group after '" + symbol + "'", symbolToken);
      }
      return group;
    }
    /**
     * Converts the textual input of an unsupported command into a text node
     * contained within a color node whose color is determined by errorColor
     */
    formatUnsupportedCmd(text3) {
      var textordArray = [];
      for (var i = 0; i < text3.length; i++) {
        textordArray.push({
          type: "textord",
          mode: "text",
          text: text3[i]
        });
      }
      var textNode = {
        type: "text",
        mode: this.mode,
        body: textordArray
      };
      var colorNode = {
        type: "color",
        mode: this.mode,
        color: this.settings.errorColor,
        body: [textNode]
      };
      return colorNode;
    }
    /**
     * Parses a group with optional super/subscripts.
     */
    parseAtom(breakOnTokenText) {
      var base2 = this.parseGroup("atom", breakOnTokenText);
      if ((base2 == null ? void 0 : base2.type) === "internal") {
        return base2;
      }
      if (this.mode === "text") {
        return base2;
      }
      var superscript;
      var subscript;
      while (true) {
        this.consumeSpaces();
        var lex = this.fetch();
        if (lex.text === "\\limits" || lex.text === "\\nolimits") {
          if (base2 && base2.type === "op") {
            var limits = lex.text === "\\limits";
            base2.limits = limits;
            base2.alwaysHandleSupSub = true;
          } else if (base2 && base2.type === "operatorname") {
            if (base2.alwaysHandleSupSub) {
              base2.limits = lex.text === "\\limits";
            }
          } else {
            throw new ParseError("Limit controls must follow a math operator", lex);
          }
          this.consume();
        } else if (lex.text === "^") {
          if (superscript) {
            throw new ParseError("Double superscript", lex);
          }
          superscript = this.handleSupSubscript("superscript");
        } else if (lex.text === "_") {
          if (subscript) {
            throw new ParseError("Double subscript", lex);
          }
          subscript = this.handleSupSubscript("subscript");
        } else if (lex.text === "'") {
          if (superscript) {
            throw new ParseError("Double superscript", lex);
          }
          var prime = {
            type: "textord",
            mode: this.mode,
            text: "\\prime"
          };
          var primes = [prime];
          this.consume();
          while (this.fetch().text === "'") {
            primes.push(prime);
            this.consume();
          }
          if (this.fetch().text === "^") {
            primes.push(this.handleSupSubscript("superscript"));
          }
          superscript = {
            type: "ordgroup",
            mode: this.mode,
            body: primes
          };
        } else if (uSubsAndSups[lex.text]) {
          var isSub = unicodeSubRegEx.test(lex.text);
          var subsupTokens = [];
          subsupTokens.push(new Token2(uSubsAndSups[lex.text]));
          this.consume();
          while (true) {
            var token = this.fetch().text;
            if (!uSubsAndSups[token]) {
              break;
            }
            if (unicodeSubRegEx.test(token) !== isSub) {
              break;
            }
            subsupTokens.unshift(new Token2(uSubsAndSups[token]));
            this.consume();
          }
          var body = this.subparse(subsupTokens);
          if (isSub) {
            subscript = {
              type: "ordgroup",
              mode: "math",
              body
            };
          } else {
            superscript = {
              type: "ordgroup",
              mode: "math",
              body
            };
          }
        } else {
          break;
        }
      }
      if (superscript || subscript) {
        return {
          type: "supsub",
          mode: this.mode,
          base: base2,
          sup: superscript,
          sub: subscript
        };
      } else {
        return base2;
      }
    }
    /**
     * Parses an entire function, including its base and all of its arguments.
     */
    parseFunction(breakOnTokenText, name) {
      var token = this.fetch();
      var func = token.text;
      var funcData = functions[func];
      if (!funcData) {
        return null;
      }
      this.consume();
      if (name && name !== "atom" && !funcData.allowedInArgument) {
        throw new ParseError("Got function '" + func + "' with no arguments" + (name ? " as " + name : ""), token);
      } else if (this.mode === "text" && !funcData.allowedInText) {
        throw new ParseError("Can't use function '" + func + "' in text mode", token);
      } else if (this.mode === "math" && funcData.allowedInMath === false) {
        throw new ParseError("Can't use function '" + func + "' in math mode", token);
      }
      var {
        args,
        optArgs
      } = this.parseArguments(func, funcData);
      return this.callFunction(func, args, optArgs, token, breakOnTokenText);
    }
    /**
     * Call a function handler with a suitable context and arguments.
     */
    callFunction(name, args, optArgs, token, breakOnTokenText) {
      var context = {
        funcName: name,
        parser: this,
        token,
        breakOnTokenText
      };
      var func = functions[name];
      if (func && func.handler) {
        return func.handler(context, args, optArgs);
      } else {
        throw new ParseError("No function handler for " + name);
      }
    }
    /**
     * Parses the arguments of a function or environment
     */
    parseArguments(func, funcData) {
      var totalArgs = funcData.numArgs + funcData.numOptionalArgs;
      if (totalArgs === 0) {
        return {
          args: [],
          optArgs: []
        };
      }
      var args = [];
      var optArgs = [];
      for (var i = 0; i < totalArgs; i++) {
        var argType = funcData.argTypes && funcData.argTypes[i];
        var isOptional = i < funcData.numOptionalArgs;
        if ("primitive" in funcData && funcData.primitive && argType == null || // \sqrt expands into primitive if optional argument doesn't exist
        funcData.type === "sqrt" && i === 1 && optArgs[0] == null) {
          argType = "primitive";
        }
        var arg = this.parseGroupOfType("argument to '" + func + "'", argType, isOptional);
        if (isOptional) {
          optArgs.push(arg);
        } else if (arg != null) {
          args.push(arg);
        } else {
          throw new ParseError("Null argument, please report this as a bug");
        }
      }
      return {
        args,
        optArgs
      };
    }
    /**
     * Parses a group when the mode is changing.
     */
    parseGroupOfType(name, type, optional) {
      switch (type) {
        case "color":
          return this.parseColorGroup(optional);
        case "size":
          return this.parseSizeGroup(optional);
        case "url":
          return this.parseUrlGroup(optional);
        case "math":
        case "text":
          return this.parseArgumentGroup(optional, type);
        case "hbox": {
          var group = this.parseArgumentGroup(optional, "text");
          return group != null ? {
            type: "styling",
            mode: group.mode,
            body: [group],
            style: "text",
            // simulate \textstyle
            resetFont: true
          } : null;
        }
        case "raw": {
          var token = this.parseStringGroup("raw", optional);
          return token != null ? {
            type: "raw",
            mode: "text",
            string: token.text
          } : null;
        }
        case "primitive": {
          if (optional) {
            throw new ParseError("A primitive argument cannot be optional");
          }
          var _group2 = this.parseGroup(name);
          if (_group2 == null) {
            throw new ParseError("Expected group as " + name, this.fetch());
          }
          return _group2;
        }
        case "original":
        case null:
        case void 0:
          return this.parseArgumentGroup(optional);
        default:
          throw new ParseError("Unknown group type as " + name, this.fetch());
      }
    }
    /**
     * Discard any space tokens, fetching the next non-space token.
     */
    consumeSpaces() {
      while (this.fetch().text === " ") {
        this.consume();
      }
    }
    /**
     * Parses a group, essentially returning the string formed by the
     * brace-enclosed tokens plus some position information.
     */
    parseStringGroup(modeName, optional) {
      var argToken = this.gullet.scanArgument(optional);
      if (argToken == null) {
        return null;
      }
      var str = "";
      var nextToken;
      while ((nextToken = this.fetch()).text !== "EOF") {
        str += nextToken.text;
        this.consume();
      }
      this.consume();
      argToken.text = str;
      return argToken;
    }
    /**
     * Parses a regex-delimited group: the largest sequence of tokens
     * whose concatenated strings match `regex`. Returns the string
     * formed by the tokens plus some position information.
     */
    parseRegexGroup(regex, modeName) {
      var firstToken = this.fetch();
      var lastToken = firstToken;
      var str = "";
      var nextToken;
      while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
        lastToken = nextToken;
        str += lastToken.text;
        this.consume();
      }
      if (str === "") {
        throw new ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
      }
      return firstToken.range(lastToken, str);
    }
    /**
     * Parses a color description.
     */
    parseColorGroup(optional) {
      var res = this.parseStringGroup("color", optional);
      if (res == null) {
        return null;
      }
      var match2 = /^(#[a-f0-9]{3,4}|#[a-f0-9]{6}|#[a-f0-9]{8}|[a-f0-9]{6}|[a-z]+)$/i.exec(res.text);
      if (!match2) {
        throw new ParseError("Invalid color: '" + res.text + "'", res);
      }
      var color = match2[0];
      if (/^[0-9a-f]{6}$/i.test(color)) {
        color = "#" + color;
      }
      return {
        type: "color-token",
        mode: this.mode,
        color
      };
    }
    /**
     * Parses a size specification, consisting of magnitude and unit.
     */
    parseSizeGroup(optional) {
      var res;
      var isBlank = false;
      this.gullet.consumeSpaces();
      if (!optional && this.gullet.future().text !== "{") {
        res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
      } else {
        res = this.parseStringGroup("size", optional);
      }
      if (!res) {
        return null;
      }
      if (!optional && res.text.length === 0) {
        res.text = "0pt";
        isBlank = true;
      }
      var match2 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(res.text);
      if (!match2) {
        throw new ParseError("Invalid size: '" + res.text + "'", res);
      }
      var data = {
        number: +(match2[1] + match2[2]),
        // sign + magnitude, cast to number
        unit: match2[3]
      };
      if (!validUnit(data)) {
        throw new ParseError("Invalid unit: '" + data.unit + "'", res);
      }
      return {
        type: "size",
        mode: this.mode,
        value: data,
        isBlank
      };
    }
    /**
     * Parses an URL, checking escaped letters and allowed protocols,
     * and setting the catcode of % as an active character (as in \hyperref).
     */
    parseUrlGroup(optional) {
      this.gullet.lexer.setCatcode("%", 13);
      this.gullet.lexer.setCatcode("~", 12);
      var res = this.parseStringGroup("url", optional);
      this.gullet.lexer.setCatcode("%", 14);
      this.gullet.lexer.setCatcode("~", 13);
      if (res == null) {
        return null;
      }
      var url = res.text.replace(/\\([#$%&~_^{}])/g, "$1");
      return {
        type: "url",
        mode: this.mode,
        url
      };
    }
    /**
     * Parses an argument with the mode specified.
     */
    parseArgumentGroup(optional, mode) {
      var argToken = this.gullet.scanArgument(optional);
      if (argToken == null) {
        return null;
      }
      var outerMode = this.mode;
      if (mode) {
        this.switchMode(mode);
      }
      this.gullet.beginGroup();
      var expression = this.parseExpression(false, "EOF");
      this.expect("EOF");
      this.gullet.endGroup();
      var result = {
        type: "ordgroup",
        mode: this.mode,
        loc: argToken.loc,
        body: expression
      };
      if (mode) {
        this.switchMode(outerMode);
      }
      return result;
    }
    /**
     * Parses an ordinary group, which is either a single nucleus (like "x")
     * or an expression in braces (like "{x+y}") or an implicit group, a group
     * that starts at the current position, and ends right before a higher explicit
     * group ends, or at EOF.
     */
    parseGroup(name, breakOnTokenText) {
      var firstToken = this.fetch();
      var text3 = firstToken.text;
      var result;
      if (text3 === "{" || text3 === "\\begingroup") {
        this.consume();
        var groupEnd = text3 === "{" ? "}" : "\\endgroup";
        this.gullet.beginGroup();
        var expression = this.parseExpression(false, groupEnd);
        var lastToken = this.fetch();
        this.expect(groupEnd);
        this.gullet.endGroup();
        result = {
          type: "ordgroup",
          mode: this.mode,
          loc: SourceLocation.range(firstToken, lastToken),
          body: expression,
          // A group formed by \begingroup...\endgroup is a semi-simple group
          // which doesn't affect spacing in math mode, i.e., is transparent.
          // https://tex.stackexchange.com/questions/1930/when-should-one-
          // use-begingroup-instead-of-bgroup
          semisimple: text3 === "\\begingroup" || void 0
        };
      } else {
        result = this.parseFunction(breakOnTokenText, name) || this.parseSymbol();
        if (result == null && text3[0] === "\\" && !implicitCommands.hasOwnProperty(text3)) {
          if (this.settings.throwOnError) {
            throw new ParseError("Undefined control sequence: " + text3, firstToken);
          }
          result = this.formatUnsupportedCmd(text3);
          this.consume();
        }
      }
      return result;
    }
    /**
     * Form ligature-like combinations of characters for text mode.
     * This includes inputs like "--", "---", "``" and "''".
     * The result will simply replace multiple textord nodes with a single
     * character in each value by a single textord node having multiple
     * characters in its value.  The representation is still ASCII source.
     * The group will be modified in place.
     */
    formLigatures(group) {
      var n = group.length - 1;
      for (var i = 0; i < n; ++i) {
        var a = group[i];
        if (a.type !== "textord") {
          continue;
        }
        var v = a.text;
        var next = group[i + 1];
        if (!next || next.type !== "textord") {
          continue;
        }
        if (v === "-" && next.text === "-") {
          var afterNext = group[i + 2];
          if (i + 1 < n && afterNext && afterNext.type === "textord" && afterNext.text === "-") {
            group.splice(i, 3, {
              type: "textord",
              mode: "text",
              loc: SourceLocation.range(a, afterNext),
              text: "---"
            });
            n -= 2;
          } else {
            group.splice(i, 2, {
              type: "textord",
              mode: "text",
              loc: SourceLocation.range(a, next),
              text: "--"
            });
            n -= 1;
          }
        }
        if ((v === "'" || v === "`") && next.text === v) {
          group.splice(i, 2, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, next),
            text: v + v
          });
          n -= 1;
        }
      }
    }
    /**
     * Parse a single symbol out of the string. Here, we handle single character
     * symbols and special functions like \verb.
     */
    parseSymbol() {
      var nucleus = this.fetch();
      var text3 = nucleus.text;
      if (/^\\verb[^a-zA-Z]/.test(text3)) {
        this.consume();
        var arg = text3.slice(5);
        var star = arg.charAt(0) === "*";
        if (star) {
          arg = arg.slice(1);
        }
        if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) {
          throw new ParseError("\\verb assertion failed --\n                    please report what input caused this bug");
        }
        arg = arg.slice(1, -1);
        return {
          type: "verb",
          mode: "text",
          body: arg,
          star
        };
      }
      if (unicodeSymbols.hasOwnProperty(text3[0]) && !symbols[this.mode][text3[0]]) {
        if (this.settings.strict && this.mode === "math") {
          this.settings.reportNonstrict("unicodeTextInMathMode", 'Accented Unicode text character "' + text3[0] + '" used in math mode', nucleus);
        }
        text3 = unicodeSymbols[text3[0]] + text3.slice(1);
      }
      var match2 = combiningDiacriticalMarksEndRegex.exec(text3);
      if (match2) {
        text3 = text3.substring(0, match2.index);
        if (text3 === "i") {
          text3 = "\u0131";
        } else if (text3 === "j") {
          text3 = "\u0237";
        }
      }
      var symbol;
      if (symbols[this.mode][text3]) {
        if (this.settings.strict && this.mode === "math" && extraLatin.includes(text3)) {
          this.settings.reportNonstrict("unicodeTextInMathMode", 'Latin-1/Unicode text character "' + text3[0] + '" used in math mode', nucleus);
        }
        var group = symbols[this.mode][text3].group;
        var loc = SourceLocation.range(nucleus);
        var s;
        if (isAtom(group)) {
          s = {
            type: "atom",
            mode: this.mode,
            family: group,
            loc,
            text: text3
          };
        } else {
          s = {
            type: group,
            mode: this.mode,
            loc,
            text: text3
          };
        }
        symbol = s;
      } else if (text3.charCodeAt(0) >= 128) {
        if (this.settings.strict) {
          if (!supportedCodepoint(text3.charCodeAt(0))) {
            this.settings.reportNonstrict("unknownSymbol", 'Unrecognized Unicode character "' + text3[0] + '"' + (" (" + text3.charCodeAt(0) + ")"), nucleus);
          } else if (this.mode === "math") {
            this.settings.reportNonstrict("unicodeTextInMathMode", 'Unicode text character "' + text3[0] + '" used in math mode', nucleus);
          }
        }
        symbol = {
          type: "textord",
          mode: "text",
          loc: SourceLocation.range(nucleus),
          text: text3
        };
      } else {
        return null;
      }
      this.consume();
      if (match2) {
        for (var i = 0; i < match2[0].length; i++) {
          var accent2 = match2[0][i];
          if (!unicodeAccents[accent2]) {
            throw new ParseError("Unknown accent ' " + accent2 + "'", nucleus);
          }
          var command = unicodeAccents[accent2][this.mode] || unicodeAccents[accent2].text;
          if (!command) {
            throw new ParseError("Accent " + accent2 + " unsupported in " + this.mode + " mode", nucleus);
          }
          symbol = {
            type: "accent",
            mode: this.mode,
            loc: SourceLocation.range(nucleus),
            label: command,
            isStretchy: false,
            isShifty: true,
            base: symbol
          };
        }
      }
      return symbol;
    }
  };
  Parser.endOfExpression = /* @__PURE__ */ new Set(["}", "\\endgroup", "\\end", "\\right", "&"]);
  var parseTree = /* @__PURE__ */ __name(function parseTree2(toParse, settings) {
    if (!(typeof toParse === "string" || toParse instanceof String)) {
      throw new TypeError("KaTeX can only parse string typed expression");
    }
    var parser = new Parser(toParse, settings);
    delete parser.gullet.macros.current["\\df@tag"];
    var tree = parser.parse();
    delete parser.gullet.macros.current["\\current@color"];
    delete parser.gullet.macros.current["\\color"];
    if (parser.gullet.macros.get("\\df@tag")) {
      if (!settings.displayMode) {
        throw new ParseError("\\tag works only in display equations");
      }
      tree = [{
        type: "tag",
        mode: "text",
        body: tree,
        tag: parser.subparse([new Token2("\\df@tag")])
      }];
    }
    return tree;
  }, "parseTree");
  var render = /* @__PURE__ */ __name(function render2(expression, baseNode, options) {
    baseNode.textContent = "";
    var node = renderToDomTree(expression, options).toNode();
    baseNode.appendChild(node);
  }, "render");
  if (typeof document !== "undefined") {
    if (document.compatMode !== "CSS1Compat") {
      typeof console !== "undefined" && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype.");
      render = /* @__PURE__ */ __name(function render3() {
        throw new ParseError("KaTeX doesn't work in quirks mode.");
      }, "render");
    }
  }
  var renderToString = /* @__PURE__ */ __name(function renderToString2(expression, options) {
    var markup = renderToDomTree(expression, options).toMarkup();
    return markup;
  }, "renderToString");
  var generateParseTree = /* @__PURE__ */ __name(function generateParseTree2(expression, options) {
    var settings = new Settings(options);
    return parseTree(expression, settings);
  }, "generateParseTree");
  var renderError = /* @__PURE__ */ __name(function renderError2(error2, expression, options) {
    if (options.throwOnError || !(error2 instanceof ParseError)) {
      throw error2;
    }
    var node = makeSpan(["katex-error"], [new SymbolNode(expression)]);
    node.setAttribute("title", error2.toString());
    node.setAttribute("style", "color:" + options.errorColor);
    return node;
  }, "renderError");
  var renderToDomTree = /* @__PURE__ */ __name(function renderToDomTree2(expression, options) {
    var settings = new Settings(options);
    try {
      var tree = parseTree(expression, settings);
      return buildTree(tree, expression, settings);
    } catch (error2) {
      return renderError(error2, expression, settings);
    }
  }, "renderToDomTree");
  var renderToHTMLTree = /* @__PURE__ */ __name(function renderToHTMLTree2(expression, options) {
    var settings = new Settings(options);
    try {
      var tree = parseTree(expression, settings);
      return buildHTMLTree(tree, expression, settings);
    } catch (error2) {
      return renderError(error2, expression, settings);
    }
  }, "renderToHTMLTree");
  var version = "0.16.47";
  var __domTree = {
    Span,
    Anchor,
    SymbolNode,
    SvgNode,
    PathNode,
    LineNode
  };
  var katex = {
    /**
     * Current KaTeX version
     */
    version,
    /**
     * Renders the given LaTeX into an HTML+MathML combination, and adds
     * it as a child to the specified DOM node.
     */
    render,
    /**
     * Renders the given LaTeX into an HTML+MathML combination string,
     * for sending to the client.
     */
    renderToString,
    /**
     * KaTeX error, usually during parsing.
     */
    ParseError,
    /**
     * The schema of Settings
     */
    SETTINGS_SCHEMA,
    /**
     * Parses the given LaTeX into KaTeX's internal parse tree structure,
     * without rendering to HTML or MathML.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __parse: generateParseTree,
    /**
     * Renders the given LaTeX into an HTML+MathML internal DOM tree
     * representation, without flattening that representation to a string.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __renderToDomTree: renderToDomTree,
    /**
     * Renders the given LaTeX into an HTML internal DOM tree representation,
     * without MathML and without flattening that representation to a string.
     *
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __renderToHTMLTree: renderToHTMLTree,
    /**
     * extends internal font metrics object with a new object
     * each key in the new object represents a font name
    */
    __setFontMetrics: setFontMetrics,
    /**
     * adds a new symbol to builtin symbols table
     */
    __defineSymbol: defineSymbol,
    /**
     * adds a new function to builtin function list,
     * which directly produce parse tree elements
     * and have their own html/mathml builders
     */
    __defineFunction: defineFunction,
    /**
     * adds a new macro to builtin macro list
     */
    __defineMacro: defineMacro,
    /**
     * Expose the dom tree node types, which can be useful for type checking nodes.
     *
     * NOTE: These methods are not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __domTree
  };

  // client/anim/index.ts
  var registry = {};
  function mountAnimations(root) {
    root.querySelectorAll(".anim[data-anim]").forEach((host) => {
      const f = registry[host.dataset.anim];
      if (f) f(host);
      else host.textContent = `\uFF08\u672A\u5B9F\u88C5\u306E\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3: ${host.dataset.anim}\uFF09`;
    });
  }
  __name(mountAnimations, "mountAnimations");
  function canvasLoop(host, w, h, draw) {
    const c = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.aspectRatio = `${w}/${h}`;
    host.appendChild(c);
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    let visible = true, start = performance.now();
    const observer = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    observer.observe(c);
    const frame = /* @__PURE__ */ __name((now) => {
      if (!c.isConnected) {
        observer.disconnect();
        return;
      }
      if (visible) draw(ctx, (now - start) / 1e3);
      requestAnimationFrame(frame);
    }, "frame");
    requestAnimationFrame(frame);
    return { canvas: c, ctx };
  }
  __name(canvasLoop, "canvasLoop");

  // workspace-book-client.js
  var toc = { title: "本", parts: [] };
  var chapters = {};
  var chapterIdByPath = {};
  var chapterMetadata = {};
  var assets = globalThis.__gadgetAssets ?? {};
  var katexCss = '@font-face{font-display:block;font-family:KaTeX_Main;font-style:normal;font-weight:400;src:url(__GADGET_ASSET__/katex/fonts/KaTeX_Main-Regular.woff2) format("woff2")}@font-face{font-display:block;font-family:KaTeX_Math;font-style:italic;font-weight:400;src:url(__GADGET_ASSET__/katex/fonts/KaTeX_Math-Italic.woff2) format("woff2")}.katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;position:relative;text-indent:0;text-rendering:auto}.katex *{-ms-high-contrast-adjust:none!important;border-color:currentColor}.katex .katex-version:after{content:"0.16.47"}.katex .katex-mathml{border:0;-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;overflow:hidden;padding:0;position:absolute;width:1px}.katex .katex-html>.newline{display:block}.katex .base{position:relative;white-space:nowrap;width:-webkit-min-content;width:-moz-min-content;width:min-content}.katex .base,.katex .strut{display:inline-block}.katex .textbf{font-weight:700}.katex .textit{font-style:italic}.katex .textrm{font-family:KaTeX_Main}.katex .textsf{font-family:KaTeX_SansSerif}.katex .texttt{font-family:KaTeX_Typewriter}.katex .mathnormal{font-family:KaTeX_Math;font-style:italic}.katex .mathit{font-family:KaTeX_Main;font-style:italic}.katex .mathrm{font-style:normal}.katex .mathbf{font-family:KaTeX_Main;font-weight:700}.katex .boldsymbol{font-family:KaTeX_Math;font-style:italic;font-weight:700}.katex .amsrm,.katex .mathbb,.katex .textbb{font-family:KaTeX_AMS}.katex .mathcal{font-family:KaTeX_Caligraphic}.katex .mathfrak,.katex .textfrak{font-family:KaTeX_Fraktur}.katex .mathboldfrak,.katex .textboldfrak{font-family:KaTeX_Fraktur;font-weight:700}.katex .mathtt{font-family:KaTeX_Typewriter}.katex .mathscr,.katex .textscr{font-family:KaTeX_Script}.katex .mathsf,.katex .textsf{font-family:KaTeX_SansSerif}.katex .mathboldsf,.katex .textboldsf{font-family:KaTeX_SansSerif;font-weight:700}.katex .mathitsf,.katex .mathsfit,.katex .textitsf{font-family:KaTeX_SansSerif;font-style:italic}.katex .mainrm{font-family:KaTeX_Main;font-style:normal}.katex .vlist-t{border-collapse:collapse;display:inline-table;table-layout:fixed}.katex .vlist-r{display:table-row}.katex .vlist{display:table-cell;position:relative;vertical-align:bottom}.katex .vlist>span{display:block;height:0;position:relative}.katex .vlist>span>span{display:inline-block}.katex .vlist>span>.pstrut{overflow:hidden;width:0}.katex .vlist-t2{margin-right:-2px}.katex .vlist-s{display:table-cell;font-size:1px;min-width:2px;vertical-align:bottom;width:2px}.katex .vbox{align-items:baseline;display:inline-flex;flex-direction:column}.katex .hbox{width:100%}.katex .hbox,.katex .thinbox{display:inline-flex;flex-direction:row}.katex .thinbox{max-width:0;width:0}.katex .msupsub{text-align:left}.katex .mfrac>span>span{text-align:center}.katex .mfrac .frac-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline,.katex .hline,.katex .mfrac .frac-line,.katex .overline .overline-line,.katex .rule,.katex .underline .underline-line{min-height:1px}.katex .mspace{display:inline-block}.katex .smash{display:inline;line-height:0}.katex .clap,.katex .llap,.katex .rlap{position:relative;width:0}.katex .clap>.inner,.katex .llap>.inner,.katex .rlap>.inner{position:absolute}.katex .clap>.fix,.katex .llap>.fix,.katex .rlap>.fix{display:inline-block}.katex .llap>.inner{right:0}.katex .clap>.inner,.katex .rlap>.inner{left:0}.katex .clap>.inner>span{margin-left:-50%;margin-right:50%}.katex .rule{border:0 solid;display:inline-block;position:relative}.katex .hline,.katex .overline .overline-line,.katex .underline .underline-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline{border-bottom-style:dashed;display:inline-block;width:100%}.katex .sqrt>.root{margin-left:.2777777778em;margin-right:-.5555555556em}.katex .fontsize-ensurer.reset-size1.size1,.katex .sizing.reset-size1.size1{font-size:1em}.katex .fontsize-ensurer.reset-size1.size2,.katex .sizing.reset-size1.size2{font-size:1.2em}.katex .fontsize-ensurer.reset-size1.size3,.katex .sizing.reset-size1.size3{font-size:1.4em}.katex .fontsize-ensurer.reset-size1.size4,.katex .sizing.reset-size1.size4{font-size:1.6em}.katex .fontsize-ensurer.reset-size1.size5,.katex .sizing.reset-size1.size5{font-size:1.8em}.katex .fontsize-ensurer.reset-size1.size6,.katex .sizing.reset-size1.size6{font-size:2em}.katex .fontsize-ensurer.reset-size1.size7,.katex .sizing.reset-size1.size7{font-size:2.4em}.katex .fontsize-ensurer.reset-size1.size8,.katex .sizing.reset-size1.size8{font-size:2.88em}.katex .fontsize-ensurer.reset-size1.size9,.katex .sizing.reset-size1.size9{font-size:3.456em}.katex .fontsize-ensurer.reset-size1.size10,.katex .sizing.reset-size1.size10{font-size:4.148em}.katex .fontsize-ensurer.reset-size1.size11,.katex .sizing.reset-size1.size11{font-size:4.976em}.katex .fontsize-ensurer.reset-size2.size1,.katex .sizing.reset-size2.size1{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size2.size2,.katex .sizing.reset-size2.size2{font-size:1em}.katex .fontsize-ensurer.reset-size2.size3,.katex .sizing.reset-size2.size3{font-size:1.1666666667em}.katex .fontsize-ensurer.reset-size2.size4,.katex .sizing.reset-size2.size4{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size2.size5,.katex .sizing.reset-size2.size5{font-size:1.5em}.katex .fontsize-ensurer.reset-size2.size6,.katex .sizing.reset-size2.size6{font-size:1.6666666667em}.katex .fontsize-ensurer.reset-size2.size7,.katex .sizing.reset-size2.size7{font-size:2em}.katex .fontsize-ensurer.reset-size2.size8,.katex .sizing.reset-size2.size8{font-size:2.4em}.katex .fontsize-ensurer.reset-size2.size9,.katex .sizing.reset-size2.size9{font-size:2.88em}.katex .fontsize-ensurer.reset-size2.size10,.katex .sizing.reset-size2.size10{font-size:3.4566666667em}.katex .fontsize-ensurer.reset-size2.size11,.katex .sizing.reset-size2.size11{font-size:4.1466666667em}.katex .fontsize-ensurer.reset-size3.size1,.katex .sizing.reset-size3.size1{font-size:.7142857143em}.katex .fontsize-ensurer.reset-size3.size2,.katex .sizing.reset-size3.size2{font-size:.8571428571em}.katex .fontsize-ensurer.reset-size3.size3,.katex .sizing.reset-size3.size3{font-size:1em}.katex .fontsize-ensurer.reset-size3.size4,.katex .sizing.reset-size3.size4{font-size:1.1428571429em}.katex .fontsize-ensurer.reset-size3.size5,.katex .sizing.reset-size3.size5{font-size:1.2857142857em}.katex .fontsize-ensurer.reset-size3.size6,.katex .sizing.reset-size3.size6{font-size:1.4285714286em}.katex .fontsize-ensurer.reset-size3.size7,.katex .sizing.reset-size3.size7{font-size:1.7142857143em}.katex .fontsize-ensurer.reset-size3.size8,.katex .sizing.reset-size3.size8{font-size:2.0571428571em}.katex .fontsize-ensurer.reset-size3.size9,.katex .sizing.reset-size3.size9{font-size:2.4685714286em}.katex .fontsize-ensurer.reset-size3.size10,.katex .sizing.reset-size3.size10{font-size:2.9628571429em}.katex .fontsize-ensurer.reset-size3.size11,.katex .sizing.reset-size3.size11{font-size:3.5542857143em}.katex .fontsize-ensurer.reset-size4.size1,.katex .sizing.reset-size4.size1{font-size:.625em}.katex .fontsize-ensurer.reset-size4.size2,.katex .sizing.reset-size4.size2{font-size:.75em}.katex .fontsize-ensurer.reset-size4.size3,.katex .sizing.reset-size4.size3{font-size:.875em}.katex .fontsize-ensurer.reset-size4.size4,.katex .sizing.reset-size4.size4{font-size:1em}.katex .fontsize-ensurer.reset-size4.size5,.katex .sizing.reset-size4.size5{font-size:1.125em}.katex .fontsize-ensurer.reset-size4.size6,.katex .sizing.reset-size4.size6{font-size:1.25em}.katex .fontsize-ensurer.reset-size4.size7,.katex .sizing.reset-size4.size7{font-size:1.5em}.katex .fontsize-ensurer.reset-size4.size8,.katex .sizing.reset-size4.size8{font-size:1.8em}.katex .fontsize-ensurer.reset-size4.size9,.katex .sizing.reset-size4.size9{font-size:2.16em}.katex .fontsize-ensurer.reset-size4.size10,.katex .sizing.reset-size4.size10{font-size:2.5925em}.katex .fontsize-ensurer.reset-size4.size11,.katex .sizing.reset-size4.size11{font-size:3.11em}.katex .fontsize-ensurer.reset-size5.size1,.katex .sizing.reset-size5.size1{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size5.size2,.katex .sizing.reset-size5.size2{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size5.size3,.katex .sizing.reset-size5.size3{font-size:.7777777778em}.katex .fontsize-ensurer.reset-size5.size4,.katex .sizing.reset-size5.size4{font-size:.8888888889em}.katex .fontsize-ensurer.reset-size5.size5,.katex .sizing.reset-size5.size5{font-size:1em}.katex .fontsize-ensurer.reset-size5.size6,.katex .sizing.reset-size5.size6{font-size:1.1111111111em}.katex .fontsize-ensurer.reset-size5.size7,.katex .sizing.reset-size5.size7{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size5.size8,.katex .sizing.reset-size5.size8{font-size:1.6em}.katex .fontsize-ensurer.reset-size5.size9,.katex .sizing.reset-size5.size9{font-size:1.92em}.katex .fontsize-ensurer.reset-size5.size10,.katex .sizing.reset-size5.size10{font-size:2.3044444444em}.katex .fontsize-ensurer.reset-size5.size11,.katex .sizing.reset-size5.size11{font-size:2.7644444444em}.katex .fontsize-ensurer.reset-size6.size1,.katex .sizing.reset-size6.size1{font-size:.5em}.katex .fontsize-ensurer.reset-size6.size2,.katex .sizing.reset-size6.size2{font-size:.6em}.katex .fontsize-ensurer.reset-size6.size3,.katex .sizing.reset-size6.size3{font-size:.7em}.katex .fontsize-ensurer.reset-size6.size4,.katex .sizing.reset-size6.size4{font-size:.8em}.katex .fontsize-ensurer.reset-size6.size5,.katex .sizing.reset-size6.size5{font-size:.9em}.katex .fontsize-ensurer.reset-size6.size6,.katex .sizing.reset-size6.size6{font-size:1em}.katex .fontsize-ensurer.reset-size6.size7,.katex .sizing.reset-size6.size7{font-size:1.2em}.katex .fontsize-ensurer.reset-size6.size8,.katex .sizing.reset-size6.size8{font-size:1.44em}.katex .fontsize-ensurer.reset-size6.size9,.katex .sizing.reset-size6.size9{font-size:1.728em}.katex .fontsize-ensurer.reset-size6.size10,.katex .sizing.reset-size6.size10{font-size:2.074em}.katex .fontsize-ensurer.reset-size6.size11,.katex .sizing.reset-size6.size11{font-size:2.488em}.katex .fontsize-ensurer.reset-size7.size1,.katex .sizing.reset-size7.size1{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size7.size2,.katex .sizing.reset-size7.size2{font-size:.5em}.katex .fontsize-ensurer.reset-size7.size3,.katex .sizing.reset-size7.size3{font-size:.5833333333em}.katex .fontsize-ensurer.reset-size7.size4,.katex .sizing.reset-size7.size4{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size7.size5,.katex .sizing.reset-size7.size5{font-size:.75em}.katex .fontsize-ensurer.reset-size7.size6,.katex .sizing.reset-size7.size6{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size7.size7,.katex .sizing.reset-size7.size7{font-size:1em}.katex .fontsize-ensurer.reset-size7.size8,.katex .sizing.reset-size7.size8{font-size:1.2em}.katex .fontsize-ensurer.reset-size7.size9,.katex .sizing.reset-size7.size9{font-size:1.44em}.katex .fontsize-ensurer.reset-size7.size10,.katex .sizing.reset-size7.size10{font-size:1.7283333333em}.katex .fontsize-ensurer.reset-size7.size11,.katex .sizing.reset-size7.size11{font-size:2.0733333333em}.katex .fontsize-ensurer.reset-size8.size1,.katex .sizing.reset-size8.size1{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size8.size2,.katex .sizing.reset-size8.size2{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size8.size3,.katex .sizing.reset-size8.size3{font-size:.4861111111em}.katex .fontsize-ensurer.reset-size8.size4,.katex .sizing.reset-size8.size4{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size8.size5,.katex .sizing.reset-size8.size5{font-size:.625em}.katex .fontsize-ensurer.reset-size8.size6,.katex .sizing.reset-size8.size6{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size8.size7,.katex .sizing.reset-size8.size7{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size8.size8,.katex .sizing.reset-size8.size8{font-size:1em}.katex .fontsize-ensurer.reset-size8.size9,.katex .sizing.reset-size8.size9{font-size:1.2em}.katex .fontsize-ensurer.reset-size8.size10,.katex .sizing.reset-size8.size10{font-size:1.4402777778em}.katex .fontsize-ensurer.reset-size8.size11,.katex .sizing.reset-size8.size11{font-size:1.7277777778em}.katex .fontsize-ensurer.reset-size9.size1,.katex .sizing.reset-size9.size1{font-size:.2893518519em}.katex .fontsize-ensurer.reset-size9.size2,.katex .sizing.reset-size9.size2{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size9.size3,.katex .sizing.reset-size9.size3{font-size:.4050925926em}.katex .fontsize-ensurer.reset-size9.size4,.katex .sizing.reset-size9.size4{font-size:.462962963em}.katex .fontsize-ensurer.reset-size9.size5,.katex .sizing.reset-size9.size5{font-size:.5208333333em}.katex .fontsize-ensurer.reset-size9.size6,.katex .sizing.reset-size9.size6{font-size:.5787037037em}.katex .fontsize-ensurer.reset-size9.size7,.katex .sizing.reset-size9.size7{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size9.size8,.katex .sizing.reset-size9.size8{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size9.size9,.katex .sizing.reset-size9.size9{font-size:1em}.katex .fontsize-ensurer.reset-size9.size10,.katex .sizing.reset-size9.size10{font-size:1.2002314815em}.katex .fontsize-ensurer.reset-size9.size11,.katex .sizing.reset-size9.size11{font-size:1.4398148148em}.katex .fontsize-ensurer.reset-size10.size1,.katex .sizing.reset-size10.size1{font-size:.2410800386em}.katex .fontsize-ensurer.reset-size10.size2,.katex .sizing.reset-size10.size2{font-size:.2892960463em}.katex .fontsize-ensurer.reset-size10.size3,.katex .sizing.reset-size10.size3{font-size:.337512054em}.katex .fontsize-ensurer.reset-size10.size4,.katex .sizing.reset-size10.size4{font-size:.3857280617em}.katex .fontsize-ensurer.reset-size10.size5,.katex .sizing.reset-size10.size5{font-size:.4339440694em}.katex .fontsize-ensurer.reset-size10.size6,.katex .sizing.reset-size10.size6{font-size:.4821600771em}.katex .fontsize-ensurer.reset-size10.size7,.katex .sizing.reset-size10.size7{font-size:.5785920926em}.katex .fontsize-ensurer.reset-size10.size8,.katex .sizing.reset-size10.size8{font-size:.6943105111em}.katex .fontsize-ensurer.reset-size10.size9,.katex .sizing.reset-size10.size9{font-size:.8331726133em}.katex .fontsize-ensurer.reset-size10.size10,.katex .sizing.reset-size10.size10{font-size:1em}.katex .fontsize-ensurer.reset-size10.size11,.katex .sizing.reset-size10.size11{font-size:1.1996142719em}.katex .fontsize-ensurer.reset-size11.size1,.katex .sizing.reset-size11.size1{font-size:.2009646302em}.katex .fontsize-ensurer.reset-size11.size2,.katex .sizing.reset-size11.size2{font-size:.2411575563em}.katex .fontsize-ensurer.reset-size11.size3,.katex .sizing.reset-size11.size3{font-size:.2813504823em}.katex .fontsize-ensurer.reset-size11.size4,.katex .sizing.reset-size11.size4{font-size:.3215434084em}.katex .fontsize-ensurer.reset-size11.size5,.katex .sizing.reset-size11.size5{font-size:.3617363344em}.katex .fontsize-ensurer.reset-size11.size6,.katex .sizing.reset-size11.size6{font-size:.4019292605em}.katex .fontsize-ensurer.reset-size11.size7,.katex .sizing.reset-size11.size7{font-size:.4823151125em}.katex .fontsize-ensurer.reset-size11.size8,.katex .sizing.reset-size11.size8{font-size:.578778135em}.katex .fontsize-ensurer.reset-size11.size9,.katex .sizing.reset-size11.size9{font-size:.6945337621em}.katex .fontsize-ensurer.reset-size11.size10,.katex .sizing.reset-size11.size10{font-size:.8336012862em}.katex .fontsize-ensurer.reset-size11.size11,.katex .sizing.reset-size11.size11{font-size:1em}.katex .delimsizing.size1{font-family:KaTeX_Size1}.katex .delimsizing.size2{font-family:KaTeX_Size2}.katex .delimsizing.size3{font-family:KaTeX_Size3}.katex .delimsizing.size4{font-family:KaTeX_Size4}.katex .delimsizing.mult .delim-size1>span{font-family:KaTeX_Size1}.katex .delimsizing.mult .delim-size4>span{font-family:KaTeX_Size4}.katex .nulldelimiter{display:inline-block;width:.12em}.katex .delimcenter,.katex .op-symbol{position:relative}.katex .op-symbol.small-op{font-family:KaTeX_Size1}.katex .op-symbol.large-op{font-family:KaTeX_Size2}.katex .accent>.vlist-t,.katex .op-limits>.vlist-t{text-align:center}.katex .accent .accent-body{position:relative}.katex .accent .accent-body:not(.accent-full){width:0}.katex .overlay{display:block}.katex .mtable .vertical-separator{display:inline-block;min-width:1px}.katex .mtable .arraycolsep{display:inline-block}.katex .mtable .col-align-c>.vlist-t{text-align:center}.katex .mtable .col-align-l>.vlist-t{text-align:left}.katex .mtable .col-align-r>.vlist-t{text-align:right}.katex .svg-align{text-align:left}.katex svg{fill:currentColor;stroke:currentColor;display:block;height:inherit;position:absolute;width:100%}.katex svg path{stroke:none}.katex svg{fill-rule:nonzero;fill-opacity:1;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1}.katex img{border-style:none;max-height:none;max-width:none;min-height:0;min-width:0}.katex .stretchy{display:block;overflow:hidden;position:relative;width:100%}.katex .stretchy:after,.katex .stretchy:before{content:""}.katex .hide-tail{overflow:hidden;position:relative;width:100%}.katex .halfarrow-left{left:0;overflow:hidden;position:absolute;width:50.2%}.katex .halfarrow-right{overflow:hidden;position:absolute;right:0;width:50.2%}.katex .brace-left{left:0;overflow:hidden;position:absolute;width:25.1%}.katex .brace-center{left:25%;overflow:hidden;position:absolute;width:50%}.katex .brace-right{overflow:hidden;position:absolute;right:0;width:25.1%}.katex .x-arrow-pad{padding:0 .5em}.katex .cd-arrow-pad{padding:0 .55556em 0 .27778em}.katex .mover,.katex .munder,.katex .x-arrow{text-align:center}.katex .boxpad{padding:0 .3em}.katex .fbox,.katex .fcolorbox{border:.04em solid;box-sizing:border-box}.katex .cancel-pad{padding:0 .2em}.katex .cancel-lap{margin-left:-.2em;margin-right:-.2em}.katex .sout{border-bottom-style:solid;border-bottom-width:.08em}.katex .angl{border-right:.049em solid;border-top:.049em solid;box-sizing:border-box;margin-right:.03889em}.katex .anglpad{padding:0 .03889em}.katex .eqn-num:before{content:"(" counter(katexEqnNo) ")";counter-increment:katexEqnNo}.katex .mml-eqn-num:before{content:"(" counter(mmlEqnNo) ")";counter-increment:mmlEqnNo}.katex .mtr-glue{width:50%}.katex .cd-vert-arrow{display:inline-block;position:relative}.katex .cd-label-left{display:inline-block;position:absolute;right:calc(50% + .3em);text-align:left}.katex .cd-label-right{display:inline-block;left:calc(50% + .3em);position:absolute;text-align:right}.katex-display{display:block;margin:1em 0;text-align:center}.katex-display>.katex{display:block;text-align:center;white-space:nowrap}.katex-display>.katex>.katex-html{display:block;position:relative}.katex-display>.katex>.katex-html>.tag{position:absolute;right:0}.katex-display.leqno>.katex>.katex-html>.tag{left:0;right:auto}.katex-display.fleqn>.katex{padding-left:2em;text-align:left}body{counter-reset:katexEqnNo mmlEqnNo}\n';
  for (const [path2, value] of Object.entries(assets)) {
    katexCss = katexCss.replaceAll(`__GADGET_ASSET__${path2}`, value);
  }
  var chapterList = [];
  var currentChapter;
  var messages = [];
  var progress = {};
  var sending = false;
  var messagesLoadToken = 0;
  document.documentElement.lang = "ja";
  document.title = toc.title;
  document.head.innerHTML = '<meta name="viewport" content="width=device-width,initial-scale=1">';
  var style = document.createElement("style");
  style.textContent = katexCss + String.raw`
  :root { color-scheme: light; font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif; color: #172033; background: #f6f4ef; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; }
  button, textarea { font: inherit; }
  button { cursor: pointer; }
  .book { height: 100vh; display: grid; grid-template-columns: 230px minmax(0, 1fr) 340px; background: #fff; }
  .pane { min-width: 0; min-height: 0; overflow-y: auto; }
  .toc { background: #f1eee7; border-right: 1px solid #ded9cf; padding: 22px 14px; }
  .brand { display: flex; align-items: center; gap: 10px; margin: 0 8px 22px; font-weight: 800; line-height: 1.35; }
  .brand-mark { width: 34px; height: 34px; object-fit: cover; border-radius: 50%; }
  .part { margin: 18px 8px 8px; color: #766e61; font-size: 12px; font-weight: 700; }
  .chapter-link { width: 100%; border: 0; background: transparent; color: #403b34; text-align: left; padding: 9px 10px; border-radius: 8px; line-height: 1.4; }
  .chapter-link:hover { background: #e7e1d6; }
  .chapter-link.active { background: #2b5797; color: #fff; font-weight: 700; }
  .chapter-link .check { float: right; }
  .reader { padding: 38px clamp(24px, 5vw, 76px) 100px; scroll-behavior: smooth; }
  .chapter-kicker { color: #2b5797; font-weight: 800; font-size: 13px; letter-spacing: .04em; }
  article { max-width: 820px; margin: 0 auto; font-family: inherit; line-height: 1.9; font-size: 16px; }
  article h1 { font-size: 32px; line-height: 1.35; margin: 8px 0 30px; }
  article h2 { font-size: 23px; margin-top: 48px; border-bottom: 1px solid #d9d2c6; padding-bottom: 8px; }
  article h3 { font-size: 18px; margin-top: 32px; }
  article img { display: block; max-width: 100%; max-height: 520px; object-fit: contain; margin: 28px auto; border-radius: 8px; }
  article table { border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 14px; }
  article th, article td { border: 1px solid #d5d0c7; padding: 8px 10px; text-align: left; }
  article th { background: #f3f0e9; }
  article blockquote { margin: 24px 0; border-left: 4px solid #2b5797; padding: 4px 18px; color: #4a5568; background: #f6f8fb; }
  article code { font-family: ui-monospace, monospace; background: #f0eee9; padding: 2px 5px; border-radius: 4px; }
  .anim { margin: 30px 0; padding: 16px; border: 1px solid #d7deea; border-radius: 12px; background: #fbfcfe; overflow: hidden; font-family: Inter, "Noto Sans JP", sans-serif; }
  .anim .title { font-weight: 750; margin-bottom: 8px; }
  .anim canvas { display: block; width: 100%; height: auto; }
  .anim .bar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 12px; }
  .anim .ghost { border: 1px solid #b9c4d6; border-radius: 7px; background: #fff; padding: 6px 9px; color: #29466f; }
  .anim input[type=range] { max-width: 170px; }
  .reader-footer { max-width: 820px; margin: 42px auto 0; display: flex; justify-content: space-between; gap: 12px; }
  .reader-footer button { border: 1px solid #2b5797; border-radius: 8px; padding: 9px 14px; background: #fff; color: #2b5797; }
  .reader-footer button.primary { background: #2b5797; color: #fff; }
  .chat { border-left: 1px solid #d9dce2; background: #fafbfc; display: grid; grid-template-rows: auto minmax(0,1fr) auto; overflow: hidden; }
  .tutor { padding: 18px; border-bottom: 1px solid #d9dce2; display: flex; gap: 12px; align-items: center; background: #fff; }
  .tutor img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }
  .tutor strong { display: block; }
  .tutor span { color: #687386; font-size: 12px; }
  .messages { overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .empty-chat { color: #687386; font-size: 13px; line-height: 1.6; background: #eef3f9; border-radius: 10px; padding: 12px; }
  .message { max-width: 92%; padding: 10px 12px; border-radius: 12px; line-height: 1.55; font-size: 14px; white-space: pre-wrap; }
  .message.user { align-self: flex-end; background: #2b5797; color: #fff; border-bottom-right-radius: 3px; }
  .message.assistant { align-self: flex-start; background: #fff; border: 1px solid #d9dce2; border-bottom-left-radius: 3px; }
  .message.pending { color: #687386; }
  .composer { border-top: 1px solid #d9dce2; padding: 12px; background: #fff; }
  .composer textarea { display: block; width: 100%; resize: none; min-height: 70px; max-height: 150px; border: 1px solid #bcc5d3; border-radius: 9px; padding: 10px; line-height: 1.5; }
  .composer-row { margin-top: 8px; display: flex; justify-content: space-between; align-items: center; color: #7a8390; font-size: 11px; }
  .send { border: 0; border-radius: 8px; background: #2b5797; color: #fff; padding: 8px 15px; font-weight: 700; }
  .send:disabled { opacity: .5; cursor: default; }
  .mobile-tabs { display: none; }
  @media (max-width: 900px) {
    body { overflow: auto; }
    .book { height: 100dvh; grid-template-columns: 1fr; grid-template-rows: auto minmax(0,1fr); }
    .mobile-tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid #d9dce2; background: #fff; }
    .mobile-tabs button { border: 0; background: #fff; padding: 11px; }
    .mobile-tabs button.active { color: #2b5797; box-shadow: inset 0 -2px #2b5797; font-weight: 700; }
    .pane, .chat { display: none; }
    .book[data-mobile=contents] .toc, .book[data-mobile=reader] .reader, .book[data-mobile=chat] .chat { display: block; }
    .book[data-mobile=chat] .chat { display: grid; }
    .toc { border-right: 0; }
    .reader { padding: 24px 20px 80px; }
    article h1 { font-size: 27px; }
  }
  @media print {
    body { overflow: visible; }
    .book { display: block; height: auto; }
    .toc, .chat, .mobile-tabs, .reader-footer { display: none !important; }
    .reader { display: block !important; overflow: visible; padding: 0; }
    article { max-width: none; font-size: 11pt; }
    article h2, article h3, article img, article table, .anim { break-inside: avoid; }
  }
`;
  document.head.appendChild(style);
  var book = document.createElement("main");
  book.className = "book";
  book.dataset.mobile = "reader";
  book.innerHTML = `
  <nav class="mobile-tabs" aria-label="\u8868\u793A\u5207\u66FF">
    <button data-view="contents">\u76EE\u6B21</button><button class="active" data-view="reader">\u672C\u6587</button><button data-view="chat">\u6FAA\u306B\u805E\u304F</button>
  </nav>
  <aside class="pane toc" aria-label="\u76EE\u6B21"></aside>
  <section class="pane reader"><div class="chapter-kicker"></div><article></article><div class="reader-footer"></div></section>
  <aside class="chat" aria-label="\u6CE2\u591A\u91CE \u6FAA\u3068\u306E\u30C1\u30E3\u30C3\u30C8">
    <header class="tutor"><img src="${assets["/characters/mio.png"]}" alt="\u6CE2\u591A\u91CE \u6FAA"><div><strong>\u6CE2\u591A\u91CE \u6FAA</strong><span>\u3053\u306E\u7AE0\u306E\u5B66\u7FD2\u30C1\u30E5\u30FC\u30BF\u30FC</span></div></header>
    <div class="messages" aria-live="polite"></div>
    <div class="composer"><textarea aria-label="\u6FAA\u3078\u306E\u8CEA\u554F" placeholder="\u3053\u306E\u7AE0\u306B\u3064\u3044\u3066\u8CEA\u554F\u3057\u3066\u307F\u3088\u3046"></textarea><div class="composer-row"><span>Enter\u3067\u9001\u4FE1\uFF08\u8907\u6570\u884C\u306E\u3068\u304D\u306F\u2318Enter\uFF09\u30FBShift+Enter\u3067\u6539\u884C</span><button class="send" type="button">\u9001\u4FE1</button></div></div>
  </aside>`;
  document.body.appendChild(book);
  var md = new lib_default({ html: false, linkify: true, typographer: true, breaks: false }).use(footnote_plugin);
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx];
    const src = token.attrGet("src");
    if (src && assets[src]) token.attrSet("src", assets[src]);
    token.attrSet("loading", "lazy");
    return md.renderer.renderToken(tokens, idx, {});
  };
  md.inline.ruler.before("escape", "math_inline", (state, silent) => {
    if (state.src[state.pos] !== "$" || state.src[state.pos + 1] === "$" || state.pos > 0 && state.src[state.pos - 1] === "\\\\") return false;
    const end = state.src.indexOf("$", state.pos + 1);
    if (end < 0 || end === state.pos + 1) return false;
    if (!silent) {
      const token = state.push("math_inline", "math", 0);
      token.content = state.src.slice(state.pos + 1, end);
    }
    state.pos = end + 1;
    return true;
  });
  md.renderer.rules.math_inline = (tokens, idx) => katex.renderToString(tokens[idx].content, { throwOnError: false });
  function renderMarkdown(source) {
    const blockMath = [];
    const animations = [];
    let prepared = source.replace(/^::anim\{id="([^"]+)"\}\s*$/gm, (_, id) => {
      const key = animations.push(id) - 1;
      return `@@ANIM_${key}@@`;
    }).replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
      const key = blockMath.push(formula) - 1;
      return `@@MATH_${key}@@`;
    });
    let html = md.render(prepared);
    html = html.replace(/<p>@@ANIM_(\d+)@@<\/p>/g, (_, key) => `<div class="anim" data-anim="${escapeHtml2(animations[Number(key)])}"></div>`).replace(/<p>@@MATH_(\d+)@@<\/p>/g, (_, key) => katex.renderToString(blockMath[Number(key)], { displayMode: true, throwOnError: false }));
    return html;
  }
  __name(renderMarkdown, "renderMarkdown");
  function escapeHtml2(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  __name(escapeHtml2, "escapeHtml");
  function renderToc() {
    const nav = book.querySelector(".toc");
    nav.innerHTML = `<div class="brand"><img class="brand-mark" src="${assets["/characters/duo.png"]}" alt=""><span>${escapeHtml2(toc.title)}</span></div>`;
    for (const part of toc.parts) {
      const written = part.chapters.filter((chapter) => chapters[chapter.id]);
      if (!written.length) continue;
      nav.insertAdjacentHTML("beforeend", `<div class="part">${part.part == null ? "" : `第${part.part}部　`}${escapeHtml2(part.title)}</div>`);
      for (const chapter of written) {
        const button = document.createElement("button");
        button.className = "chapter-link";
        button.dataset.chapter = chapter.id;
        button.innerHTML = `${chapter.unnumbered || chapter.chapter == null ? "" : `第${chapter.chapter}章　`}${escapeHtml2(chapter.title)} <span class="check">${progress[chapter.id] ? "\u2713" : ""}</span>`;
        button.addEventListener("click", () => openChapter(chapter.id));
        nav.appendChild(button);
      }
    }
  }
  __name(renderToc, "renderToc");
  async function openChapter(id) {
    const chapter = chapterList.find((item) => item.id === id);
    if (!chapter) return;
    currentChapter = chapter;
    location.hash = id;
    const headingTitle = chapterMetadata[id]?.title ?? chapter.title;
    book.querySelector(".chapter-kicker").textContent = `${chapter.unnumbered || chapter.chapter == null ? "" : `第${chapter.chapter}章　`}${headingTitle}`;
    const article = book.querySelector("article");
    article.innerHTML = renderMarkdown(chapters[id]);
    mountAnimations(article);
    book.querySelectorAll(".chapter-link").forEach((button) => button.classList.toggle("active", button.dataset.chapter === id));
    book.querySelector(".reader").scrollTop = 0;
    setMobileView("reader");
    renderFooter();
    await loadMessages(id);
  }
  __name(openChapter, "openChapter");
  async function loadMessages(id) {
    const token = ++messagesLoadToken;
    messages = [];
    renderMessages();
    const state = await gadget.getState(id);
    if (token !== messagesLoadToken || currentChapter?.id !== id) return;
    messages = state.messages;
    renderMessages();
  }
  __name(loadMessages, "loadMessages");
  function renderFooter() {
    const index = chapterList.findIndex((item) => item.id === currentChapter.id);
    const footer = book.querySelector(".reader-footer");
    footer.innerHTML = "";
    const previous = document.createElement("button");
    previous.textContent = index > 0 ? `← ${chapterList[index - 1].title}` : "\u76EE\u6B21\u3078";
    previous.addEventListener("click", () => index > 0 ? openChapter(chapterList[index - 1].id) : setMobileView("contents"));
    const complete = document.createElement("button");
    complete.className = "primary";
    complete.textContent = progress[currentChapter.id] ? "\u8AAD\u4E86\u6E08\u307F \u2713" : "\u3053\u306E\u7AE0\u3092\u8AAD\u4E86\u306B\u3059\u308B";
    complete.addEventListener("click", async () => {
      progress = await gadget.setChapterComplete(currentChapter.id, !progress[currentChapter.id]);
      renderToc();
      renderFooter();
    });
    footer.append(previous, complete);
  }
  __name(renderFooter, "renderFooter");
  function renderMessages() {
    const host = book.querySelector(".messages");
    host.innerHTML = "";
    if (!messages.length) host.innerHTML = '<div class="empty-chat">\u8AAD\u3093\u3067\u3044\u3066\u5F15\u3063\u304B\u304B\u3063\u305F\u3068\u3053\u308D\u3092\u805E\u3044\u3066\u306D\u3002\u3044\u307E\u958B\u3044\u3066\u3044\u308B\u7AE0\u306E\u672C\u6587\u306B\u6CBF\u3063\u3066\u3001\u4E00\u7DD2\u306B\u6574\u7406\u3059\u308B\u3088\u3002</div>';
    for (const item of messages) {
      const element = document.createElement("div");
      element.className = `message ${item.role}`;
      element.textContent = item.content;
      host.appendChild(element);
    }
    if (sending) host.insertAdjacentHTML("beforeend", '<div class="message assistant pending">\u8003\u3048\u4E2D\u2026</div>');
    host.scrollTop = host.scrollHeight;
  }
  __name(renderMessages, "renderMessages");
  async function sendTutorMessage(message) {
    sending = true;
    const chapterId = currentChapter.id;
    messages.push({ role: "user", content: message });
    renderMessages();
    try {
      const state = await gadget.askTutor({ message, chapterId });
      if (currentChapter.id === chapterId) {
        messagesLoadToken++;
        messages = state.messages;
      }
    } catch (error2) {
      if (currentChapter.id === chapterId) messages.push({ role: "assistant", content: `\u8FD4\u7B54\u3092\u53D6\u5F97\u3067\u304D\u306A\u304B\u3063\u305F\u306E\u3002\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3066\u3001\u3082\u3046\u4E00\u5EA6\u9001\u3063\u3066\u307F\u3066\u306D\u3002\uFF08${error2?.message ?? error2}\uFF09` });
    } finally {
      sending = false;
      renderMessages();
    }
  }
  __name(sendTutorMessage, "sendTutorMessage");
  function setMobileView(view) {
    book.dataset.mobile = view;
    book.querySelectorAll(".mobile-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  }
  __name(setMobileView, "setMobileView");
  book.querySelectorAll(".mobile-tabs button").forEach((button) => button.addEventListener("click", () => setMobileView(button.dataset.view)));
  var composer = book.querySelector(".composer");
  var textarea = composer.querySelector("textarea");
  async function submitTutorMessage() {
    const message = textarea.value.trim();
    if (!message || sending) return;
    textarea.value = "";
    await sendTutorMessage(message);
  }
  __name(submitTutorMessage, "submitTutorMessage");
  composer.querySelector(".send").addEventListener("click", submitTutorMessage);
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) return;
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      submitTutorMessage();
      return;
    }
    if (event.shiftKey) return;
    if (textarea.value.includes("\n")) return;
    event.preventDefault();
    submitTutorMessage();
  });
  async function initialize() {
    const [initial, bookFiles] = await Promise.all([gadget.getState(), gadget.getBookFiles()]);
    if (bookFiles["content/toc.json"]) toc = JSON.parse(bookFiles["content/toc.json"]);
    document.title = toc.title;
    chapterIdByPath = Object.fromEntries(toc.parts.flatMap(part => part.chapters.map(chapter => [`content/${chapter.file}`, chapter.id])));
    chapters = Object.fromEntries(Object.entries(bookFiles).filter(([path2]) => path2.startsWith("content/") && path2.endsWith(".md") && chapterIdByPath[path2]).map(([path2, content]) => [chapterIdByPath[path2], content]));
    chapterList = toc.parts.flatMap((part) => part.chapters).filter((chapter) => chapters[chapter.id]);
    if (!chapterList.length) throw new Error("\u76EE\u6B21\u306B\u8AAD\u3081\u308B\u7AE0\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
    currentChapter = chapterList[0];
    progress = initial.progress;
    renderToc();
    renderMessages();
    await openChapter(location.hash.slice(1) || initial.lastChapter || chapterList[0].id);
  }
  __name(initialize, "initialize");
  initialize().catch((error2) => {
    document.body.textContent = `\u672C\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F: ${error2?.message ?? error2}`;
  });
})();
