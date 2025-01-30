// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('userLoginForm');
    const eventsSection = document.getElementById('eventsSection');
    const eventsList = document.getElementById('eventsList');
    const homeLink = document.getElementById('homeLink');
    const loginLink = document.getElementById('loginLink');
    const loginFormContainer = document.getElementById('loginForm');
    const coordinatorDashboard = document.getElementById('coordinatorDashboard');
    const createEventForm = document.getElementById('createEventForm');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.role === 'coordinator') {
            showCoordinatorDashboard();
        } else {
            showEvents();
        }
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    homeLink.addEventListener('click', showEvents);
    loginLink.addEventListener('click', showLoginForm);
    if (createEventForm) {
        createEventForm.addEventListener('submit', createEvent);
    }

    // Login Handler
    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };

        console.log('Attempting login with:', loginData); // Debug log

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            console.log('Server response status:', response.status); // Debug log

            const data = await response.json();
            console.log('Server response:', data); // Debug log

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    role: loginData.role,
                    userId: data.userId
                }));

                if (loginData.role === 'coordinator') {
                    showCoordinatorDashboard();
                } else {
                    showEvents();
                }
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
        if (coordinatorDashboard) {
            coordinatorDashboard.style.display = 'none';
        }
        eventsSection.style.display = 'block';
        await loadEvents();
    }

    // Show Login Form
    function showLoginForm() {
        loginFormContainer.style.display = 'block';
        eventsSection.style.display = 'none';
        if (coordinatorDashboard) {
            coordinatorDashboard.style.display = 'none';
        }
    }

    // Show Coordinator Dashboard
    function showCoordinatorDashboard() {
        if (coordinatorDashboard) {
            loginFormContainer.style.display = 'none';
            eventsSection.style.display = 'block';
            coordinatorDashboard.style.display = 'block';
        }
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
        const user = JSON.parse(localStorage.getItem('user'));
        
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
                <p>Venue: ${event.venue || 'TBA'}</p>
                <p>Available Spots: ${event.maxParticipants ? 
                    (event.maxParticipants - (event.registrations?.length || 0)) : 
                    'Unlimited'}</p>
                ${user?.role === 'student' ? `
                    <button onclick="registerForEvent('${event._id}')" 
                        ${event.registrations?.some(r => r.student === user.userId) ? 'disabled' : ''}>
                        ${event.registrations?.some(r => r.student === user.userId) ? 'Registered' : 'Register'}
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    // Create Event
    async function createEvent(e) {
        e.preventDefault();
        const formData = new FormData(createEventForm);
        const eventData = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                alert('Event created successfully');
                createEventForm.reset();
                loadEvents();
            } else {
                const data = await response.json();
                alert('Failed to create event: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
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
                loadEvents(); // Refresh the events list
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

    // Logout Function
    window.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLoginForm();
    }
});