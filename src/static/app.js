document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Générer la liste des participants avec icône de suppression
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `<ul class="participants-ul">` +
            details.participants.map(email =>
              `<li class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}">
                <span class="participant-email">${email}</span>
                <span class="delete-participant" title="Unregister" style="cursor:pointer;color:#c62828;margin-left:8px;font-weight:bold;">&#10006;</span>
              </li>`
            ).join('') + `</ul>`;
        } else {
          participantsHTML = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-list">
            <p><strong>Current participants:</strong></p>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Ajouter gestionnaire d'événement pour la suppression
      document.querySelectorAll('.delete-participant').forEach(icon => {
        icon.addEventListener('click', async function(e) {
          const li = this.closest('li');
          const activity = decodeURIComponent(li.getAttribute('data-activity'));
          const email = decodeURIComponent(li.getAttribute('data-email'));
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message || 'Participant removed.';
              messageDiv.className = 'success';
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'An error occurred';
              messageDiv.className = 'error';
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
          } catch (error) {
            messageDiv.textContent = 'Failed to unregister. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
            console.error('Error unregistering:', error);
          }
        });
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
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Rafraîchir la liste des activités pour afficher le participant ajouté
        fetchActivities();
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
