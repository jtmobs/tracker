// Constants
const servicePath = "https://collectdataapp-583785287d33.herokuapp.com/webPage";

// Initialize session with UUID
function initializeSession() {
    let sessionId = sessionStorage.getItem('uuid');
    if (!sessionId) {
        sessionId = generateUuid();
        sessionStorage.setItem('uuid', sessionId);
    }
    return sessionId;
}

// Functions to generate a UUID
function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

// Helper functions for generating CSS and XPath selectors
function getCssSelectorPath(element) {
    if (!element.parentElement) {
        return element.tagName.toLowerCase();
    }
    var index = Array.prototype.indexOf.call(element.parentElement.children, element) + 1;
    var parentSelector = getCssSelectorPath(element.parentElement);
    return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
}

function getAbsoluteXPath(element) {
    if (element.id) {
        return `id("${element.id}")`;
    }
    let ix = 1; // Position of the element among siblings of the same tag
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) break;
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
    return `${getAbsoluteXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix}]`;
}

// Function to record different events
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
        xpath: getAbsoluteXPath(targetElement),
        cssPath: getCssSelectorPath(targetElement),
        textContent: targetElement.textContent.trim().substring(0, 100) // Truncate long text
    };

    // Include mouse position for mouse-related events
    if (['click', 'dragstart', 'drop'].includes(eventType)) {
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

// Event listeners for user actions
document.addEventListener('click', event => recordEvent(event, 'click'), true);
document.addEventListener('keydown', event => recordEvent(event, 'keydown'), true);
document.addEventListener('dragstart', event => recordEvent(event, 'dragstart'), true);
document.addEventListener('drop', event => recordEvent(event, 'drop'), true);
