const haruneko_domain = "localhost:5000";

browser.webRequest.onBeforeSendHeaders.addListener((details) => {
    if(!details.documentUrl?.includes(haruneko_domain)) return {};
    const fetchApiSupportedPrefix = 'X-FetchAPI-'.toLowerCase();
    const oldHeaders = details.requestHeaders || [];
    const newHeaders = [];
    const removeList = [];
    for (const header of oldHeaders) {
        // Avoid duplicated header entries
        if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
            removeList.push(header.name.toLowerCase().substring(fetchApiSupportedPrefix.length));
        }
        // Avoid haruneko_domain in referer/origin
        if (header.value.includes(haruneko_domain)) {
            removeList.push(header.name.toLowerCase());
        }
    }
    for (const header of oldHeaders) {
        if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
            const newName = header.name.substring(fetchApiSupportedPrefix.length);
            newHeaders.push({name: newName, value: header.value});
        }
        else {
            if (!removeList.includes(header.name.toLowerCase())) {
                newHeaders.push(header);
            }
        }
    }
    return { requestHeaders: newHeaders };
}, { urls: ["<all_urls>"] },  ["blocking", "requestHeaders"]);


function setHeader(headers, name, value) {
  const existing = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.value = value;
  } else {
    headers.push({ name, value });
  }
}

browser.webRequest.onHeadersReceived.addListener((details) => {
    if(!details.documentUrl?.includes(haruneko_domain)) return {};
    const headers = details.responseHeaders || [];
    setHeader(headers, "Access-Control-Allow-Origin", "*");
    setHeader(headers, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    setHeader(headers, "Access-Control-Allow-Headers", "*");
    setHeader(headers, "Access-Control-Max-Age", "7200");
    return { responseHeaders: headers };
}, { urls: ["<all_urls>"] }, [ "blocking", "responseHeaders" ]);
