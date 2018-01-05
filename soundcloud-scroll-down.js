// Copyright (c) 21.12.2017 Ralph Metel. All rights reserved.
// Email: ralph.metel@gmail.com
// For free use

var interval, desiredDate, desiredDateMilliseconds, extensionId;

function scrollSc() {
    scrollTo({
        'top': document.body.scrollHeight
    });

    var allPosts = document.getElementsByClassName('relativeTime'),
        lastPost = allPosts[allPosts.length - 1],
        lastPostDateMilliseconds = new Date(lastPost.getAttribute('datetime')).getTime();

    if(lastPostDateMilliseconds <= desiredDateMilliseconds) {
        // Cancel scrolling
        clearInterval(interval);
        // Notify extension
        notifyExtensionScrollingStopped();

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
 * Notifies extension about stopped scrolling
 */
function notifyExtensionScrollingStopped(){
    chrome.runtime.sendMessage({'message': 'stopped'});
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.message == 'stop') {
        // Cancel scrolling
        clearInterval(interval);
        // Notify extension
        notifyExtensionScrollingStopped();
    }
});

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
        // Notify extension
        notifyExtensionScrollingStopped();
    } else {
        // Start scrolling down the page
        interval = setInterval(scrollSc, 100);
    }
});