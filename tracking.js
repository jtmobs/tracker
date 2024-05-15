// Base service path for sending data
const servicePath = "https://collectdataapp-583785287d33.herokuapp.com/webPage";
let uuid;
let path;

// Function to send captured data to the server
function saveData(data) {
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

// Helper functions (getUrl, getCssSelectorPath, generateSelector, getAbsoluteXPath) need to be defined here

// Event listener for clicks
document.addEventListener('click', function (event) {
    recordEvent(event, 'click');
}, true);

// Event listener for keydown
document.addEventListener('keydown', function (event) {
    recordEvent(event, 'keydown');
}, true);

// Event listener for mouseover
// document.addEventListener('mouseover', function (event) {
//   recordEvent(event, 'mouseover');
// }, true);

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
    const targetElement = event.target;
    let data = {
        sessionId: initializeSession(),
        url: window.location.href,
        pageStructure: document.documentElement.outerHTML,
        eventType: eventType,
        timeStamp: event.timeStamp,
        tag: targetElement.tagName,
        targetId: targetElement.id,
        //classes: targetElement.className,
        xpath: getAbsoluteXPath(targetElement),
        fullXpath: getFullXPath(targetElement),
        cssPath: getCssSelectorPath(targetElement),
        textContent: targetElement.textContent.trim().substring(0, 100), // Truncate long text
    };

    // Include mouse position for relevant events
    if (['click', 'mouseover', 'dragstart', 'drop'].includes(eventType)) {
        data.mouseX = event.clientX;
        data.mouseY = event.clientY;
    }

    // Include key value for keydown events
    if (eventType === 'keydown') {
        data.key = event.key;
    }

    // Send the captured data to the server
    saveData(data);
}

// Implement the helper functions: getUrl, getCssSelectorPath, generateSelector, getAbsoluteXPath
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

    let ix = 0; // Position of the element among siblings
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

// Initialize session with UUID
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

// Function to get XPath of an element
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