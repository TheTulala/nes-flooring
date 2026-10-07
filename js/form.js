// Quote form: accessible inline validation + Web3Forms delivery, with a phone fallback on any failure.
{
  const form = document.getElementById("quote-form");

  if (form) {
    const thankYou = document.getElementById("quote-thankyou");
    const status = form.querySelector(".form-status");
    const submitButton = form.querySelector('button[type="submit"]');
    const phone = form.dataset.phone;
    const fallback = `We couldn't send your request just now. Please call ${phone} and we'll get your quote started.`;

    const messageFor = (field) => {
      if (field.validity.valueMissing) {
        return `Please enter your ${field.dataset.label}.`;
      }
      if (field.validity.typeMismatch || field.validity.patternMismatch) {
        return `Please enter a valid ${field.dataset.label}.`;
      }
      return `Please check your ${field.dataset.label}.`;
    };

    const setError = (field, message) => {
      const error = document.getElementById(`${field.id}-error`);
      if (error) {
        error.textContent = message;
      }
      if (message) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    };

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => setError(field, ""));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";

      const invalid = [...form.querySelectorAll("[required], [type='email']")].filter((field) => !field.checkValidity());
      form.querySelectorAll("[aria-invalid]").forEach((field) => setError(field, ""));
      if (invalid.length) {
        invalid.forEach((field) => setError(field, messageFor(field)));
        invalid[0].focus();
        return;
      }

      const key = form.querySelector('[name="access_key"]').value;
      if (!key || key.startsWith("[")) {
        status.textContent = `Online quote requests aren't switched on for this preview yet. Please call ${phone} to request your quote.`;
        return;
      }

      submitButton.disabled = true;
      try {
        const response = await window.fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
          signal: window.AbortSignal.timeout(15000),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) {
          throw new Error("Submission failed");
        }
        form.hidden = true;
        thankYou.hidden = false;
        thankYou.focus();
      } catch {
        status.textContent = fallback;
        submitButton.disabled = false;
      }
    });
  }
}
