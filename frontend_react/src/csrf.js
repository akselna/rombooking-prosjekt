// Hent CSRF-token fra cookies
export const getCSRFToken = () => {
  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="));
  return csrfCookie ? csrfCookie.split("=")[1] : null;
};

// Hjelpefunksjon for å inkludere CSRF-token automatisk
export const csrfFetch = async (url, options = {}) => {
  const csrfToken = getCSRFToken();

  const headers = options.headers || {};
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken; // Legg til CSRF-token i header
  }

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
};
