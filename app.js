// Wait for DOM to be fully loaded
// Modify the loadEvents function in app.js
async function loadEvents(category = '') {
    const url = category ? `/api/events/category/${category}` : '/api/events';
    try {
        const response = await fetch(url, {
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

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const registrationForm = document.getElementById('userRegistrationForm');
    const registrationFormContainer = document.getElementById('registrationForm');
    const loginFormContainer = document.getElementById('loginForm');
    const switchToLoginLink = document.getElementById('switchToLogin');
    const switchToRegisterLink = document.getElementById('switchToRegister');
    const roleSelect = document.getElementById('roleSelect');
    const yearField = document.getElementById('yearField');
    const logoutLink = document.getElementById('logoutLink');
    const loginForm = document.getElementById('userLoginForm');
    const eventsSection = document.getElementById('eventsSection');
    const eventsList = document.getElementById('eventsList');
    const homeLink = document.getElementById('homeLink');
    const loginLink = document.getElementById('loginLink');
    const coordinatorDashboard = document.getElementById('coordinatorDashboard');
    const createEventForm = document.getElementById('createEventForm');
    const categoryFilter = document.getElementById('categoryFilter');

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

    // Add event listeners only if elements exist
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (homeLink) {
        homeLink.addEventListener('click', showEvents);
    }

    if (loginLink) {
        loginLink.addEventListener('click', showLoginForm);
    }

    if (createEventForm) {
        createEventForm.addEventListener('submit', createEvent);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }

    // Role select functionality
    if (roleSelect && yearField) {
        roleSelect.addEventListener('change', () => {
            yearField.style.display = roleSelect.value === 'student' ? 'block' : 'none';
            yearField.required = roleSelect.value === 'student';
        });
    }

    // Form switching functionality
    if (switchToLoginLink) {
        switchToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (registrationFormContainer && loginFormContainer) {
                registrationFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'block';
            }
        });
    }

    if (switchToRegisterLink) {
        switchToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginFormContainer && registrationFormContainer) {
                loginFormContainer.style.display = 'none';
                registrationFormContainer.style.display = 'block';
            }
        });
    }

    // Registration form handler
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registrationForm);
            
            // Basic validation
            if (formData.get('password') !== formData.get('confirmPassword')) {
                alert('Passwords do not match!');
                return;
            }

            // Validate password strength
            if (formData.get('password').length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }

            const registrationData = {
                email: formData.get('email'),
                password: formData.get('password'),
                fullName: formData.get('fullName'),
                studentId: formData.get('studentId'),
                phone: formData.get('phone'),
                department: formData.get('department'),
                year: formData.get('year')
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(registrationData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Registration successful! Please login with your preferred role.');
                    registrationForm.reset();
                    if (loginFormContainer && registrationFormContainer) {
                        loginFormContainer.style.display = 'block';
                        registrationFormContainer.style.display = 'none';
                    }
                } else {
                    alert(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }


    // Switch between login and registration forms
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registrationFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });

    switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        registrationFormContainer.style.display = 'block';
    });

    // Handle Registration
// Modified registration handler
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registrationForm);
    
    // Basic validation
    if (formData.get('password') !== formData.get('confirmPassword')) {
        alert('Passwords do not match!');
        return;
    }

    // Validate password strength
    if (formData.get('password').length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    const registrationData = {
        email: formData.get('email'),
        password: formData.get('password'),
        fullName: formData.get('fullName'),
        studentId: formData.get('studentId'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        year: formData.get('year')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please login with your preferred role.');
            registrationForm.reset();
            loginFormContainer.style.display = 'block';
            registrationFormContainer.style.display = 'none';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});
    
    // Login Handler
    async function handleLogin(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(loginForm);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role')
            };
    
            // Validate required fields
            if (!loginData.email || !loginData.password || !loginData.role) {
                alert('Please fill in all fields');
                return;
            }
    
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });
    
            const data = await response.json();
    
            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    role: data.role,
                    userId: data.userId
                }));
    
                // Hide login form
                loginFormContainer.style.display = 'none';
                registrationFormContainer.style.display = 'none';
    
                // Update UI based on user role
                if (data.role === 'coordinator') {
                    showCoordinatorDashboard();
                } else {
                    showEvents();
                }
    
                // Update navigation
                updateNavigation(true);
                
                // Clear form
                loginForm.reset();
                
                alert('Login successful!');
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    function updateNavigation(isLoggedIn) {
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const logoutLink = document.getElementById('logoutLink');
        const homeLink = document.getElementById('homeLink');
    
        if (isLoggedIn) {
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutLink.style.display = 'block';
            homeLink.style.display = 'block';
        } else {
            loginLink.style.display = 'block';
            registerLink.style.display = 'block';
            logoutLink.style.display = 'none';
            homeLink.style.display = 'none';
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
    
//// Modify the loadEvents function in app.js
async function loadEvents(category = '') {
    const url = category ? `/api/events/category/${category}` : '/api/events';
    try {
        const response = await fetch(url, {
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

    // Modified displayEvents function
    function displayEvents(events) {
        const user = JSON.parse(localStorage.getItem('user'));
        eventsList.innerHTML = '';
    
        if (events.length === 0) {
            eventsList.innerHTML = '<p>No upcoming events found.</p>';
            return;
        }
    
        events.forEach(event => {
            const progressWidth = (event.registrations?.length / event.maxParticipants) * 100 || 0;
            const isRegistered = event.registrations?.some(r => r.student === user?.userId);
            
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <img src="${event.flyer}" class="event-image" alt="${event.title}">
                <div class="event-content">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    
                    <div class="highlight-grid">
                        ${event.highlightPoints?.map(point => `
                            <div class="highlight-item">${point}</div>
                        `).join('')}
                    </div>
    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressWidth}%"></div>
                    </div>
    
                    <div class="event-meta">
                        <p><i class="clock-icon"></i> ${new Date(event.date).toLocaleDateString()}</p>
                        <p>Spots left: ${event.maxParticipants - (event.registrations?.length || 0)}</p>
                    </div>
    
                    <button class="toggle-details" onclick="toggleEventDetails('${event._id}')">
                        Show More Details
                        <i class="chevron-icon" data-icon="chevron-down"></i>
                    </button>
    
                    <div class="event-details" id="details-${event._id}" style="display: none;">
                        <div class="documents-list">
                            ${event.documents?.map(doc => `
                                <div class="document-item">
                                    <span>${doc.name}</span>
                                    <a href="${doc.url}" download>Download</a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
    
                    <button class="register-button" 
                        onclick="registerForEvent('${event._id}')"
                        ${isRegistered ? 'disabled' : ''}>
                        ${isRegistered ? 'Registered' : 'Register Now'}
                    </button>
                </div>
            `;
            
            eventsList.appendChild(eventCard);
        });
    }
    // Create Event
    async function createEvent(e) {
        e.preventDefault();
        const formData = new FormData(createEventForm);
        const fileInput = document.querySelector('input[type="file"]');
        
        try {
            // Validate file size
            if(fileInput.files[0].size > 2 * 1024 * 1024) {
                alert('File size exceeds 2MB limit');
                return;
            }
    
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            if(response.ok) {
                alert('Event created successfully');
                createEventForm.reset();
                loadEvents();
            } else {
                const data = await response.json();
                alert('Error: ' + (data.message || 'Failed to create event'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create event');
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

// New handler function
async function handleCategoryFilter() {
  const category = categoryFilter.value;
  await loadEvents(category);
}

// Add these new functions
window.toggleEventDetails = function(eventId) {
    const details = document.getElementById(`details-${eventId}`);
    const icon = details.previousElementSibling.querySelector('.chevron-icon');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.setAttribute('data-icon', 'chevron-up');
    } else {
        details.style.display = 'none';
        icon.setAttribute('data-icon', 'chevron-down');
    }
    
    // Refresh icons
    lucide.createIcons();
}

async function handleCategoryFilter() {
    const category = categoryFilter.value;
    await loadEvents(category);
}

function displayEvents(events) {
    const user = JSON.parse(localStorage.getItem('user'));
    eventsList.innerHTML = '';

    if (events.length === 0) {
        eventsList.innerHTML = '<p>No upcoming events found.</p>';
        return;
    }

    events.forEach(event => {
        const progressWidth = (event.registrations?.length / event.maxParticipants) * 100 || 0;
        const isRegistered = event.registrations?.some(r => r.student === user?.userId);
        const isOwnEvent = user?.role === 'coordinator' && event.coordinator === user?.userId;
        
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <img src="${event.flyer}" class="event-image" alt="${event.title}">
            <div class="event-content">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                
                <div class="event-meta">
                    <span><i class="calendar-icon"></i>${new Date(event.date).toLocaleDateString()}</span>
                    <span><i class="users-icon"></i>Spots: ${event.maxParticipants - (event.registrations?.length || 0)}</span>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressWidth}%"></div>
                </div>

                <div class="event-actions">
                    ${!isOwnEvent ? `
                        <button class="register-button" 
                            onclick="registerForEvent('${event._id}')"
                            ${isRegistered ? 'disabled' : ''}>
                            ${isRegistered ? 'Registered' : 'Register Now'}
                        </button>
                    ` : `
                        <button class="delete-button" onclick="deleteEvent('${event._id}')">
                            Delete Event
                        </button>
                    `}
                </div>
            </div>
        `;
        
        eventsList.appendChild(eventCard);
    });
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            alert('Event deleted successfully');
            loadEvents(); // Refresh events list
        } else {
            alert('Failed to delete event: ' + data.message);
        }
    } catch (error) {
        console.error('Delete event error:', error);
        alert('Failed to delete event');
    }
}

// Initialize Lucide icons (add at bottom)
lucide.createIcons();
