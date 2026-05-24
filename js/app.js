const API =
"https://home311-api.1dylanroeder1.workers.dev";

const offenseList =
  document.getElementById(
    "offenseList"
  );

const ticketList =
  document.getElementById(
    "ticketList"
  );

const activeCount =
  document.getElementById(
    "activeCount"
  );

const resolvedCount =
  document.getElementById(
    "resolvedCount"
  );

const modal =
  document.getElementById(
    "ticketModal"
  );

const ticketOffense =
  document.getElementById(
    "ticketOffense"
  );

const ticketNotes =
  document.getElementById(
    "ticketNotes"
  );

const ticketDays =
  document.getElementById(
    "ticketDays"
  );

async function loadOffenses() {

  const res =
    await fetch(
      API + "/offenses"
    );

  const offenses =
    await res.json();

  offenseList.innerHTML = "";

  ticketOffense.innerHTML = "";

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

        <div class="actions">

          <button
            onclick="editOffense('${offense.id}')"
          >
            Edit
          </button>

          <button
            onclick="deleteOffense('${offense.id}')"
          >
            Delete
          </button>

        </div>

      </div>
    `;

    ticketOffense.innerHTML += `
      <option>
        ${offense.name}
      </option>
    `;

  });

}

async function loadTickets() {

  const res =
    await fetch(
      API + "/tickets"
    );

  const tickets =
    await res.json();

  ticketList.innerHTML = "";

  let active = 0;
  let resolved = 0;

  tickets.forEach((ticket) => {

    if (
      ticket.status ===
      "Resolved"
    ) {
      resolved++;
    } else {
      active++;
    }

    ticketList.innerHTML += `
      <div class="ticket-card">

        <h3>
          ${ticket.offense}
        </h3>

        <p>
          ${ticket.notes}
        </p>

        <div class="ticket-status">
          ${ticket.status}
        </div>

        <div class="actions">

          ${
            ticket.status !==
            "Resolved"

            ? `
              <button
                onclick="resolveTicket('${ticket.id}')"
              >
                Resolve
              </button>
            `

            : ""
          }

          <button
            onclick="deleteTicket('${ticket.id}')"
          >
            Delete
          </button>

        </div>

      </div>
    `;

  });

  activeCount.innerText =
    active;

  resolvedCount.innerText =
    resolved;

}

async function addOffense() {

  const name =
    prompt(
      "Offense Name"
    );

  const days =
    prompt(
      "Auto Remove Days"
    );

  if (!name || !days) return;

  const res =
    await fetch(
      API + "/offenses"
    );

  let offenses =
    await res.json();

  offenses.push({

    id:
      crypto.randomUUID(),

    name,
    days

  });

  await fetch(
    API + "/saveOffenses",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          offenses
        )

    }
  );

  loadOffenses();

}

async function editOffense(id) {

  const res =
    await fetch(
      API + "/offenses"
    );

  let offenses =
    await res.json();

  const offense =
    offenses.find(
      o => o.id === id
    );

  const newName =
    prompt(
      "Edit offense name",
      offense.name
    );

  const newDays =
    prompt(
      "Edit days",
      offense.days
    );

  offense.name =
    newName;

  offense.days =
    newDays;

  await fetch(
    API + "/saveOffenses",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          offenses
        )

    }
  );

  loadOffenses();

}

async function deleteOffense(id) {

  const res =
    await fetch(
      API + "/offenses"
    );

  let offenses =
    await res.json();

  offenses =
    offenses.filter(
      o => o.id !== id
    );

  await fetch(
    API + "/saveOffenses",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          offenses
        )

    }
  );

  loadOffenses();

}

async function createTicket() {

  const res =
    await fetch(
      API + "/tickets"
    );

  let tickets =
    await res.json();

  tickets.push({

    id:
      crypto.randomUUID(),

    offense:
      ticketOffense.value,

    notes:
      ticketNotes.value,

    status:
      "Active",

    createdAt:
      Date.now(),

    expiresInDays:
      ticketDays.value

  });

  await fetch(
    API + "/saveTickets",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          tickets
        )

    }
  );

  modal.classList.add(
    "hidden"
  );

  loadTickets();

}

async function resolveTicket(id) {

  const res =
    await fetch(
      API + "/tickets"
    );

  let tickets =
    await res.json();

  tickets =
    tickets.map((ticket) => {

      if (
        ticket.id === id
      ) {

        ticket.status =
          "Resolved";

      }

      return ticket;

    });

  await fetch(
    API + "/saveTickets",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          tickets
        )

    }
  );

  loadTickets();

}

async function deleteTicket(id) {

  const res =
    await fetch(
      API + "/tickets"
    );

  let tickets =
    await res.json();

  tickets =
    tickets.filter(
      t => t.id !== id
    );

  await fetch(
    API + "/saveTickets",
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          tickets
        )

    }
  );

  loadTickets();

}

document
  .getElementById(
    "addOffenseBtn"
  )
  .addEventListener(
    "click",
    addOffense
  );

document
  .getElementById(
    "newTicketBtn"
  )
  .addEventListener(
    "click",
    () => {

      modal.classList.remove(
        "hidden"
      );

    }
  );

document
  .getElementById(
    "createTicketBtn"
  )
  .addEventListener(
    "click",
    createTicket
  );

loadOffenses();
loadTickets();
