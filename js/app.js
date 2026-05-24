const API =
"https://home311-api.1dylanroeder1.workers.dev/";

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

        ${
          ticket.status !==
          "Resolved"

          ? `
            <button
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

  await fetch(
    API + "/offenses",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        name,
        days
      })
    }
  );

  loadOffenses();

}

async function createTicket() {

  await fetch(
    API + "/tickets",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({

        offense:
          ticketOffense.value,

        notes:
          ticketNotes.value,

        expiresInDays:
          ticketDays.value

      })
    }
  );

  modal.classList.add(
    "hidden"
  );

  ticketNotes.value = "";
  ticketDays.value = "";

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

      if (ticket.id === id) {
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

      body: JSON.stringify(
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
