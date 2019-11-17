// Copyright (c) 21.12.2017 Ralph Metel. All rights reserved.
// Email: ralph.metel@gmail.com
// For free use

var interval, desiredDate, desiredDateMilliseconds, isRunning = false;

function scrollPage() {
    // permanent status check
    isRunning = getStatus();

    if(!isRunning) {
        // Cancel scrolling
        clearInterval(interval);
        isRunning = false;
        setStatus(isRunning);
        sendStatus();
        return false;
    }

    scrollTo({
        'top': document.body.scrollHeight
    });

    var allPosts = document.getElementsByClassName('relativeTime'),
        lastPost = allPosts[allPosts.length - 1],
        lastPostDateMilliseconds = new Date(lastPost.getAttribute('datetime')).getTime();

    if(lastPostDateMilliseconds <= desiredDateMilliseconds) {
        // Cancel scrolling
        clearInterval(interval);
        isRunning = false;
        setStatus(isRunning);
        sendStatus();

        // Adjust the page, scroll to first post within desired date
        for (i = allPosts.length - 1; i > 0; i--) {
            if(new Date(allPosts[i].getAttribute('datetime')).getTime() >= desiredDateMilliseconds) {
                if(i < (allPosts.length - 1)) i++; // Go back to previous item

                allPosts[i].scrollIntoView();
                scrollTo(0, document.documentElement.scrollTop - 100);
                break;
            }
        }
    }
}

/**
 * Notifies extension about scrolling status
 */
function sendStatus(){
    chrome.runtime.sendMessage({'message': 'update', 'running': isRunning});
}

/**
 * Sets current plugin status
 * @param {boolean} isRunning
 */
function setStatus(isRunning) {
    document.getElementById("isRunning").setAttribute("value", isRunning);
}

/**
 * Returns current plugin status (running or not)
 * @return {boolean}
 */
function getStatus() {
    return (document.getElementById("isRunning").getAttribute("value") === "true");
}

function startScrolling() {
    // First get the dates
    chrome.storage.sync.get('desiredDate', (items) => {
        desiredDate = items['desiredDate'];
        desiredDateMilliseconds = new Date(desiredDate).getTime();

        var allPosts = document.getElementsByClassName('relativeTime'),
            lastPost = allPosts[allPosts.length - 1],
            lastPostDateMilliseconds = new Date(lastPost.getAttribute('datetime')).getTime();

        // If last post date is smaller than the desired date (last post is older that the desired one), it means the needed item is already on page
        if (lastPostDateMilliseconds <= desiredDateMilliseconds) {
            // Adjust the page, scroll to first post within desired date
            for (i = allPosts.length - 1; i > 0; i--) {
                if (new Date(allPosts[i].getAttribute('datetime')).getTime() >= desiredDateMilliseconds) {
                    if(i < (allPosts.length - 1)) i++; // Go back to previous item

                    allPosts[i].scrollIntoView();
                    scrollTo(0, document.documentElement.scrollTop - 100);
                    break;
                }
            }
        } else {
            // Start scrolling down the page
            interval = setInterval(scrollPage, 100);
            isRunning = true;
            setStatus(isRunning);
            sendStatus();
        }
    });
}

/* Start execute code */
/* ------------------------------------------------ */

if(document.getElementById("isRunning") === null) {
    var node = document.createElement("input");
    node.setAttribute("id", "isRunning");
    node.setAttribute("value", isRunning.toString());
    node.setAttribute("data-plugin", "SoundCloud ScrollDown");
    node.setAttribute("data-author", "ralph.metel@gmail.com");
    node.setAttribute("data-url", "https://chrome.google.com/webstore/detail/soundcloud-scrolldown/ljcpijkmgbnknjhepfbhekkmnhpnmbfp?hl=de&authuser=0");
    node.style.display = "none";
    document.body.appendChild(node);
} else {
    isRunning = getStatus();
}

// notify extension about state
sendStatus();

// listen for messages from extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    switch (request.message) {
        case "start":
            startScrolling();
            break;

        case "stop":
            // Cancel scrolling
            clearInterval(interval);
            isRunning = false;
            setStatus(isRunning);
            sendStatus();
            break;
    }
});