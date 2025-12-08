import { logout, currentToken } from '../auth.js';
import { APP_NAME, SOURCE_URL } from '../constants.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 20;
    }

    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.75rem;
      background: rgba(17, 24, 39, 0.92);
      color: #f9fafb;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
      backdrop-filter: blur(16px);
    }

    a.brand {
      font-weight: 700;
      font-size: 1.15rem;
      text-decoration: none;
      color: inherit;
      letter-spacing: 0.02em;
    }

    .links {
      display: inline-flex;
      gap: 1.25rem;
      align-items: center;
    }

    a.external {
      color: rgba(255, 255, 255, 0.86);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
    }

    a.external:hover {
      text-decoration: underline;
    }

    button {
      font: inherit;
      padding: 0.45rem 1.1rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.65);
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: transform 0.12s ease, background 0.12s ease;
    }

    button:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }

    @media (max-width: 640px) {
      nav {
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem;
      }

      .links {
        width: 100%;
        justify-content: space-between;
      }
    }
  </style>
  <nav>
    <a class="brand" href="/">${APP_NAME}</a>
    <div class="links">
      <a class="external" href="${SOURCE_URL}" target="_blank" rel="noopener">Source</a>
      <button type="button" data-action="logout" hidden>Logout</button>
    </div>
  </nav>
`;

class SpotVaultNavbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.logoutButton = this.shadowRoot.querySelector('[data-action="logout"]');
    this.handleLogout = this.handleLogout.bind(this);
  }

  connectedCallback() {
    if (this.logoutButton) {
      this.logoutButton.addEventListener('click', this.handleLogout);
      if (currentToken.notNull) {
        this.logoutButton.hidden = false;
      }
    }
  }

  disconnectedCallback() {
    if (this.logoutButton) {
      this.logoutButton.removeEventListener('click', this.handleLogout);
    }
  }

  handleLogout() {
    logout();
  }
}

customElements.define('sv-navbar', SpotVaultNavbar);
