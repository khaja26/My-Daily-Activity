let currentActivityElement = null;
let currentActivityIndex = null; // To track the index of the current activity

// Load activities from localStorage on page load
window.onload = function() {
    loadActivitiesFromDatabase();
    checkForNotifications(); // Check for notifications when the page loads
    setInterval(checkForNotifications, 60000); // Check every minute
};

document.getElementById("add-activity-btn").addEventListener("click", () => {
    document.getElementById("add-activity-popup").classList.remove("hidden");
});

document.getElementById("close-popup-btn").addEventListener("click", () => {
    document.getElementById("add-activity-popup").classList.add("hidden");
});

document.getElementById("add-activity-form").addEventListener("submit", (event) => {
    event.preventDefault();
    
    const activityDesc = document.getElementById("activity-desc").value;
    const activityTime = document.getElementById("activity-time").value;
    const activityDate = new Date().toLocaleDateString(); // Auto-fill date with today's date

    const activityItem = {
        description: activityDesc,
        time: activityTime,
        date: activityDate,
        completed: false, // New flag for completion status
        completionDate: null // To store the date of completion
    };

    saveActivityToDatabase(activityItem); // Save to the database (localStorage)
    displayActivity(activityItem); // Display on the screen

    document.getElementById("activity-desc").value = "";
    document.getElementById("activity-time").value = "";
    document.getElementById("add-activity-popup").classList.add("hidden");
});

function saveActivityToDatabase(activity) {
    let activities = JSON.parse(localStorage.getItem('activities')) || [];
    activities.push(activity); // Add new activity to the list
    localStorage.setItem('activities', JSON.stringify(activities)); // Update localStorage
}

function loadActivitiesFromDatabase() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const today = new Date().toLocaleDateString(); // Current date

    activities.forEach(activity => {
        // Check if the activity was completed and if the completion date is today
        if (activity.completed && activity.completionDate === today) {
            activity.fontColor = 'green'; // Keep in green if completed today
        } else {
            activity.fontColor = 'black'; // Reset to black for previous days
            activity.completed = false; // Mark as not completed
        }
        displayActivity(activity);
    });
}

function displayActivity(activity) {
    const activityItem = document.createElement("div");
    activityItem.classList.add("activity-item");
    activityItem.style.color = activity.fontColor || 'black'; // Set font color based on activity status
    activityItem.textContent = `${activity.description} at ${activity.time} on ${activity.date}`;
    
    activityItem.addEventListener("click", () => {
        displayBottomNav(activityItem);
    });

    document.getElementById("activities").appendChild(activityItem);
}

function displayBottomNav(activityElement) {
    const bottomNav = document.getElementById("bottom-nav");
    const selectedActivity = document.getElementById("selected-activity");

    currentActivityElement = activityElement;
    const activityText = activityElement.textContent;
    selectedActivity.textContent = activityText;

    bottomNav.classList.remove("hidden");

    // Find the index of the current activity
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    currentActivityIndex = activities.findIndex(activity => `${activity.description} at ${activity.time} on ${activity.date}` === activityText);

    document.getElementById("complete-btn").onclick = () => {
        // Change the color of the completed activity to green and update the database
        activityElement.style.color = 'green';
        activities[currentActivityIndex].completed = true; // Mark as completed
        activities[currentActivityIndex].completionDate = new Date().toLocaleDateString(); // Set today's date as completion date
        localStorage.setItem('activities', JSON.stringify(activities)); // Update localStorage
        alert(`Marked as completed: ${activityText}`);
        bottomNav.classList.add("hidden");
    };

    document.getElementById("edit-btn").onclick = () => {
        openEditPopup(currentActivityIndex);
    };

    document.getElementById("share-btn").onclick = () => {
        shareActivity(activityText);
    };

    document.getElementById("delete-btn").onclick = () => {
        if (confirm(`Are you sure you want to delete: ${activityText}?`)) {
            deleteActivityFromDatabase(currentActivityIndex); // Permanently delete from the database
            currentActivityElement.remove(); // Remove from the UI
            bottomNav.classList.add("hidden");
        }
    };
}

function openEditPopup(activityIndex) {
    const editPopup = document.getElementById("edit-activity-popup");
    const editDesc = document.getElementById("edit-activity-desc");
    const editTime = document.getElementById("edit-activity-time");

    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const activityToEdit = activities[activityIndex];

    editDesc.value = activityToEdit.description;
    editTime.value = activityToEdit.time;

    editPopup.classList.remove("hidden");

    // Save the updated activity
    document.getElementById("save-edit-btn").onclick = (e) => {
        e.preventDefault();

        activityToEdit.description = editDesc.value;
        activityToEdit.time = editTime.value;

        // Update the database (localStorage)
        activities[activityIndex] = activityToEdit;
        localStorage.setItem('activities', JSON.stringify(activities));

        // Update the UI
        currentActivityElement.textContent = `${activityToEdit.description} at ${activityToEdit.time} on ${activityToEdit.date}`;
        editPopup.classList.add("hidden");
        document.getElementById("bottom-nav").classList.add("hidden");
    };

    document.getElementById("close-edit-popup-btn").onclick = () => {
        editPopup.classList.add("hidden");
    };
}

function deleteActivityFromDatabase(activityIndex) {
    let activities = JSON.parse(localStorage.getItem('activities')) || [];
    
    // Remove the activity from the array
    activities.splice(activityIndex, 1);
    
    // Save the updated activities array back to the localStorage
    localStorage.setItem('activities', JSON.stringify(activities));
}

function shareActivity(activityText) {
    if (navigator.share) {
        navigator.share({
            title: 'My Daily Activity',
            text: `Check out this activity: ${activityText}`,
            url: window.location.href // URL of the current page
        })
        .then(() => console.log('Share was successful.'))
        .catch((error) => console.log('Sharing failed:', error));
    } else {
        alert('Sharing is not supported in this browser.');
    }
}

function checkForNotifications() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const currentDate = new Date();
    
    activities.forEach(activity => {
        const [activityHour, activityMinute] = activity.time.split(":").map(Number);
        const activityDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), activityHour, activityMinute);

        // Check if the activity's date and time match the current date and time
        if (activity.date === currentDate.toLocaleDateString() && 
            activityDateTime.getTime() <= currentDate.getTime() && 
            !activity.completed) {

            // Display alert for the activity
            alert(`Reminder: ${activity.description} at ${activity.time}`);

            // Show browser notification
            showNotification(activity.description, activity.time);

            // Play an audio alarm
            playAlarm();

            // Mark activity as completed after notification
            activity.completed = true;
            localStorage.setItem('activities', JSON.stringify(activities)); // Update localStorage
        }
    });
}

function showNotification(title, time) {
    if (Notification.permission === "granted") {
        new Notification(`Activity Reminder: ${title}`, {
            body: `Scheduled time: ${time}`,
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                showNotification(title, time);
            }
        });
    }
}

// Function to play an audio alarm
function playAlarm() {
    const audio = new Audio('alarm.mp3'); // Specify your alarm audio file path
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
}

// Check for notifications every minute
setInterval(checkForNotifications, 60000);


function copyActivitiesForTomorrow() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Get tomorrow's date
    const tomorrowDate = tomorrow.toLocaleDateString(); // Format as today's date

    const newActivities = activities.map(activity => {
        return {
            description: activity.description, 
            time: activity.time, 
            date: tomorrowDate, 
            completed: false, 
            completionDate: null 
        };
    });

    localStorage.setItem('activities', JSON.stringify(newActivities));
}

function scheduleActivityCopy() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Set time to midnight

    const msUntilMidnight = midnight - now;

    // Set a timeout to copy activities at midnight
    setTimeout(() => {
        copyActivitiesForTomorrow();
        scheduleActivityCopy(); // Reschedule for the next day
    }, msUntilMidnight);
}

// Call this function when the app starts
scheduleActivityCopy();

