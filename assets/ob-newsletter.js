document.addEventListener('DOMContentLoaded', function() {
  // Show interest list when click on interest label
  const interestLabel = document.querySelector('.ob-newsletter__interest-label');
  const interestOptionsList = document.querySelector('.ob-newsletter__interest-options-wrapper');
  interestLabel.addEventListener('click', function() {
    this.classList.toggle('active');
    interestOptionsList.classList.toggle('active');
  });

  const newsletterForm = document.querySelector('.ob-newsletter__form');
  const submitButton = newsletterForm.querySelector('.ob-newsletter__button');

  // Enable the submit button when the form is valid
  function checkFormValidity() {
    const nameInput = newsletterForm.querySelector('input[name="contact[name]"]');
    const emailInput = newsletterForm.querySelector('input[name="contact[email]"]');
    const interestOptions = newsletterForm.querySelectorAll('input[name="contact[interests]"]');
    
    let isValid = true;
    
    // Check name field
    if (!nameInput.value.trim()) {
      isValid = false;
    }
    
    // Check email field with proper format validation
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue || !emailRegex.test(emailValue)) {
      isValid = false;
    }
    
    // Check if interest options exist and if one is selected
    if (interestOptions.length > 0) {
      const hasSelectedInterest = Array.from(interestOptions).some(option => option.checked);
      if (!hasSelectedInterest) {
        isValid = false;
      }
    }
    submitButton.disabled = !isValid;
  }

  // Listen for input changes on all form fields
  newsletterForm.addEventListener('input', checkFormValidity);
  newsletterForm.addEventListener('change', checkFormValidity);
});