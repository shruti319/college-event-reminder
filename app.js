document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('userLoginForm');
    const eventsList = document.getElementById('eventsList');

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);

    // Functions
    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
    
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                showEvents();
                console.log('Login successful');
            } else {
                console.error('Login failed:', data.message);
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check the console for details.');
        }
    }
    async function loadEvents() {
        try {
            const response = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const events = await response.json();
            displayEvents(events);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }

    function displayEvents(events) {
        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
                <p>Time: ${event.time}</p>
                <button onclick="registerForEvent('${event._id}')">Register</button>
            </div>
        `).join('');
    }

    // Notification Functions
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    function setEventReminder(event) {
        const eventTime = new Date(event.date + ' ' + event.time);
        const reminderTime = new Date(eventTime.getTime() - 30 * 60000); // 30 minutes before

        const timeUntilReminder = reminderTime - new Date();
        if (timeUntilReminder > 0) {
            setTimeout(() => {
                new Notification(`Reminder: ${event.title}`, {
                    body: `Event starts in 30 minutes!`
                });
            }, timeUntilReminder);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('userLoginForm');
    const eventsSection = document.getElementById('eventsSection');
    const eventsList = document.getElementById('eventsList');
    const homeLink = document.getElementById('homeLink');
    const loginLink = document.getElementById('loginLink');
    const loginFormContainer = document.getElementById('loginForm');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        showEvents();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    homeLink.addEventListener('click', showEvents);
    loginLink.addEventListener('click', showLoginForm);

    // Login Handler
    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                showEvents();
                alert('Login successful!');
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    // Show Events Section
    async function showEvents() {
        loginFormContainer.style.display = 'none';
        eventsSection.style.display = 'block';
        await loadEvents();
    }

    // Show Login Form
    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        eventsSection.style.display = 'none';
    }

    // Load Events from Server
    async function loadEvents() {
        try {
            const response = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load events');
            }

            const events = await response.json();
            displayEvents(events);
        } catch (error) {
            console.error('Failed to load events:', error);
            alert('Failed to load events. Please try again.');
        }
    }

    // Display Events in UI
    function displayEvents(events) {
        if (events.length === 0) {
            eventsList.innerHTML = '<p>No upcoming events.</p>';
            return;
        }

        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
                <p>Time: ${event.time}</p>
                <button onclick="registerForEvent('${event._id}')">Register</button>
            </div>
        `).join('');
    }

    // Register for Event
    window.registerForEvent = async function(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                alert('Successfully registered for event!');
                // Set up notification reminder
                requestNotificationPermission();
            } else {
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Failed to register for event. Please try again.');
        }
    }

    // Notification Functions
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }
});

// Add to app.js
async function createEvent(e) {
    e.preventDefault();
    const form = document.getElementById('createEventForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        
        if (response.ok) {
            alert('Event created successfully');
            loadEvents();
        } else {
            alert('Failed to create event');
        }
    } catch (error) {
        console.error('Error creating event:', error);
    }
}

// Update event display with registration
function displayEvents(events) {
    const user = JSON.parse(localStorage.getItem('user'));
    const eventsList = document.getElementById('eventsList');
    
    eventsList.innerHTML = events.map(event => `
        <div class="event-card">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
            <p>Time: ${event.time}</p>
            <p>Venue: ${event.venue}</p>
            <p>Available Spots: ${event.maxParticipants - event.registrations.length}</p>
            ${user.role === 'student' ? `
                <button onclick="registerForEvent('${event._id}')" 
                    ${event.registrations.some(r => r.student === user.userId) ? 'disabled' : ''}>
                    ${event.registrations.some(r => r.student === user.userId) ? 'Registered' : 'Register'}
                </button>
            ` : ''}
        </div>
    `).join('');
}