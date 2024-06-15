// Base service path for sending data
const servicePath = "https://collectdatav1-8xpil.ondigitalocean.app/webPage";
let uuid;

// Function to send captured data to the server
function saveData(data) {
    console.log("Sending data:", data);
    const http = new XMLHttpRequest();
    http.open("POST", servicePath, true);
    http.setRequestHeader("Content-Type", "application/json");
    http.onload = function () {
        console.log("Data sent successfully", this.responseText);
    };
    http.onerror = function () {
        console.error("Error sending data", this.statusText);
    };
    http.send(JSON.stringify(data));
}

// Record window size
function recordWindowSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const data = {
        sessionId: initializeSession(),
        url: window.location.href,
        eventType: 'windowResize',
        pageStructure: 'null',
        tag: 'null',
        xpath: 'null',
        fullXpath: 'null',
        cssPath: 'null',
        width: width,
        height: height,
        timeStamp: Date.now()
    };
    saveData(data);
}

window.onload = recordWindowSize;
window.onresize = recordWindowSize;

// Event listener for page changes
window.onpopstate = function(event) {
    recordPageChange(event);
};

function recordPageChange(event) {
    const data = {
        sessionId: initializeSession(),
        url: window.location.href,
        eventType: 'pageChange',
        timeStamp: Date.now()
    };
    saveData(data);
}

// Event listener for clicks
document.addEventListener('click', function (event) {
    recordEvent(event, 'click');
}, true);

// Event listener for keydown
document.addEventListener('keydown', function (event) {
    // Ignore certain keys
    const ignoredKeys = ['Backspace', 'Shift', 'Enter', 'Tab', 'CapsLock', 'Control', 'Alt', 'ArrowUp',
        'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Delete'];
    if (!ignoredKeys.includes(event.key)) {
        recordEvent(event, 'keydown');
    }
}, true);

// Event listener for dragstart
document.addEventListener('dragstart', function (event) {
    recordEvent(event, 'dragstart');
}, true);

// Event listener for drop
document.addEventListener('drop', function (event) {
    recordEvent(event, 'drop');
}, true);

// Function to handle and record different events
function recordEvent(event, eventType) {
    const rect = event.target.getBoundingClientRect();
    const targetElement = event.target;
    let data = {
        sessionId: initializeSession(),
        url: window.location.href,
        pageStructure: 'null',
        eventType: eventType,
        timeStamp: event.timeStamp,
        tag: targetElement.tagName,
        targetId: targetElement.id,
        classes: targetElement.getAttribute("class"),
        xpath: getAbsoluteXPath(targetElement),
        fullXpath: getRelativeXPath(targetElement),
        cssPath: getCssSelectorPath(targetElement),
        textContent: targetElement.textContent.trim().substring(0, 100), // Truncate long text
    };

    // Include key value for keydown events
    if (eventType === 'keydown') {
        data.key = event.key;
    }

    // Send the captured data to the server
    saveData(data);
}

// Helper functions
function getClickOffset(rect, offset) {
    return {
        x: Math.abs(offset.x - rect.left),
        y: Math.abs(offset.y - rect.top),
    };
}

function getCssSelectorPath(element) {
    if (!element.parentElement) {
        return element.tagName.toLowerCase();
    }
    var index = Array.prototype.indexOf.call(element.parentElement.children, element) + 1;
    var parentSelector = getCssSelectorPath(element.parentElement);
    return parentSelector + " > " + element.tagName.toLowerCase() + ":nth-child(" + index + ")";
}

function getUrl() {
    return window.location.href;
}

function getWebPageStructure() {
    return document.documentElement.outerHTML;
}

function getAbsoluteXPath(element) {
    if (element.id !== '') {
        return `id("${element.id}")`;
    }
    if (element === document.body) {
        return element.tagName.toLowerCase();
    }

    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) {
            return `${getAbsoluteXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
        }
    }
}

function generateSelector(context) {
    let index, pathSelector;
    if (context == null) throw "not a dom reference";
    index = getIndex(context);
    while (context.tagName) {
        const className = context.className;
        const idName = context.id;
        pathSelector = context.localName +
            (className ? `.${className}` : "") +
            (idName ? `#${idName}` : "") +
            (pathSelector ? ">" + pathSelector : "");
        context = context.parentNode;
    }
    pathSelector = pathSelector + `:nth-of-type(${index})`;
    return pathSelector;
}

function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function initializeSession() {
    let sessionId = sessionStorage.getItem('uuid');
    if (!sessionId) {
        sessionId = generateUuid();
        sessionStorage.setItem('uuid', sessionId);
    }
    return sessionId;
}

function getFullXPath(element) {
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = element.id;
        if (id) {
            return '//' + element.tagName.toLowerCase() + '[@id="' + id + '"]' + xpath;
        } else {
            var elementIndex = 0;
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
                    continue;
                }
                if (sibling.nodeName == element.nodeName) {
                    elementIndex++;
                }
            }
            var tagName = element.nodeName.toLowerCase();
            var index = elementIndex ? '[' + (elementIndex + 1) + ']' : '';
            xpath = '/' + tagName + index + xpath;
        }
    }
    return xpath;
}

function getSelector(element) {
    const path = [];
    while (element.parentNode) {
        if (element.id) {
            path.unshift('#' + element.id);
            break;
        } else {
            if (element == element.ownerDocument.documentElement) path.unshift(element.tagName.toLowerCase());
            else {
                let siblingIndex = 1;
                let sibling = element;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.tagName == element.tagName) siblingIndex++;
                }
                const tagName = element.tagName.toLowerCase();
                path.unshift(tagName + ':nth-of-type(' + siblingIndex + ')');
            }
            element = element.parentNode;
        }
    }
    return path.join(' > ');
}

function getXPath(element) {
    const idx = (sib, name) => sib
        ? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
        : 1;
    return element && element.nodeType == 1
        ? (element.id && document.querySelector('#' + element.id) === element
            ? `id("${element.id}")`
            : `${getXPath(element.parentNode)}/${element.tagName}[${idx(element)}]`)
        : '';
}
// Escape attribute value to safely include it in XPath
function escapeAttributeValue(value) {
    return value.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

// Function to generate a relative XPath for an element
function getRelativeXPath(element) {
    const uniqueAttributes = ['id', 'name', 'class', 'type', 'value'];

    // Check for unique attributes and form XPath
    for (let attr of uniqueAttributes) {
        const value = element.getAttribute(attr);
        if (value) {
            const xpath = `//*[@${attr}='${escapeAttributeValue(value)}']`;
            const matchingElements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (matchingElements.snapshotLength === 1) {
                return xpath;
            }
        }
    }

    // Fallback: generate a relative XPath based on element's position within its siblings
    let path = '';
    for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
        let siblingIndex = 1;
        for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                siblingIndex++;
            }
        }
        const nodeName = element.nodeName.toLowerCase();
        path = '/' + nodeName + '[' + siblingIndex + ']' + path;
    }
    return '/' + path; // Modified to return relative XPath from the document's root
}
