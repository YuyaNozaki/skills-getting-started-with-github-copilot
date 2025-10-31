document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to unregister a participant
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(`/unregister/${activity}/${email}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to unregister');
      }

      // Refresh the activities list
      await fetchActivities();
      messageDiv.textContent = 'Successfully unregistered from the activity';
      messageDiv.style.color = '#4caf50';
    } catch (error) {
      messageDiv.textContent = error.message;
      messageDiv.style.color = '#f44336';
      console.error('Error unregistering:', error);
    }
  }

  // Event listener for delete buttons
  activitiesList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-participant')) {
      const activity = event.target.dataset.activity;
      const email = event.target.dataset.email;
      await unregisterParticipant(activity, email);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p class="participants-header">Current Participants:</p>
          <ul class="participants-list">
            ${details.participants.length > 0 
              ? details.participants.map(email => `
                <li class="participant-item">
                  <span class="delete-participant" data-activity="${name}" data-email="${email}">×</span>
                  ${email}
                </li>`).join('')
              : '<li>No participants yet</li>'
            }
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/signup/${encodeURIComponent(activity)}/${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list after successful registration
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
