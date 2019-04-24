// Copyright (c) 21.12.2017 Ralph Metel. All rights reserved.
// Email: ralph.metel@gmail.com
// For free use

var interval, desiredDate, desiredDateMilliseconds, isRunning = false;

function scrollPage() {
    // permanent status check
    isRunning = (document.getElementById("isScrolling").innerHTML === "true");

    if(!isRunning) {
        // Cancel scrolling
        clearInterval(interval);
        isRunning = false;
        document.getElementById("isScrolling").innerHTML = isRunning.toString();
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
        document.getElementById("isScrolling").innerHTML = isRunning.toString();
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
            document.getElementById("isScrolling").innerHTML = isRunning.toString();
            sendStatus();
        }
    });
}

/* Start execute code */
/* ------------------------------------------------ */

if(document.getElementById("isScrolling") == null) {
    var node = document.createElement("div");
    var textNode = document.createTextNode(isRunning.toString());
    node.setAttribute("id", "isScrolling");
    node.style.display = "none";
    node.appendChild(textNode);
    document.body.appendChild(node);
} else {
    isRunning = (document.getElementById("isScrolling").innerHTML === "true");
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
            document.getElementById("isScrolling").innerHTML = isRunning.toString();
            sendStatus();
            break;
    }
});