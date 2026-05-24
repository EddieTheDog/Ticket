let offenses = [
  {
    id: 1,
    name: "Abandoned Item",
    days: 3
  },
  {
    id: 2,
    name: "Hallway Obstruction",
    days: 2
  }
];

let tickets = [
  {
    id: "TK-1001",
    offense: "Abandoned Item",
    status: "Active"
  }
];

const offenseList =
  document.getElementById("offenseList");

const ticketList =
  document.getElementById("ticketList");

const activeCount =
  document.getElementById("activeCount");

const resolvedCount =
  document.getElementById("resolvedCount");

function renderOffenses() {

  offenseList.innerHTML = "";

  offenses.forEach((offense) => {

    offenseList.innerHTML += `
      <div class="offense-card">

        <h3>
          ${offense.name}
        </h3>

        <p>
          Auto Remove:
          ${offense.days} days
        </p>

        <div class="offense-actions">

          <button
            class="edit-btn"
            onclick="editOffense(${offense.id})"
          >
            Edit
          </button>

          <button
            class="delete-btn"
            onclick="deleteOffense(${offense.id})"
          >
            Delete
          </button>

        </div>

      </div>
    `;

  });

}

function renderTickets() {

  ticketList.innerHTML = "";

  let active = 0;
  let resolved = 0;

  tickets.forEach((ticket) => {

    if (ticket.status === "Active") {
      active++;
    } else {
      resolved++;
    }

    ticketList.innerHTML += `
      <div class="ticket-card">

        <h3>
          ${ticket.offense}
        </h3>

        <p>
          Ticket ID:
          ${ticket.id}
        </p>

        <div class="ticket-status">
          ${ticket.status}
        </div>

        ${
          ticket.status === "Active"
          ? `
            <button
              class="resolve-btn"
              onclick="resolveTicket('${ticket.id}')"
            >
              Mark Resolved
            </button>
          `
          : ""
        }

      </div>
    `;

  });

  activeCount.innerText = active;
  resolvedCount.innerText = resolved;

}

function editOffense(id) {

  const offense =
    offenses.find(o => o.id === id);

  const newName =
    prompt(
      "Edit offense name",
      offense.name
    );

  if (newName) {
    offense.name = newName;
    renderOffenses();
  }

}

function deleteOffense(id) {

  offenses =
    offenses.filter(o => o.id !== id);

  renderOffenses();

}

function resolveTicket(id) {

  const ticket =
    tickets.find(t => t.id === id);

  ticket.status = "Resolved";

  renderTickets();

}

document
  .getElementById("addOffenseBtn")
  .addEventListener("click", () => {

    const name =
      prompt("Offense Name");

    const days =
      prompt("Auto remove after days");

    if (!name || !days) return;

    offenses.push({
      id: Date.now(),
      name,
      days
    });

    renderOffenses();

  });

renderOffenses();
renderTickets();
