/**
 * Form Validation Handler
 * 
 * This immediately invoked function expression (IIFE) implements custom
 * Bootstrap form validation handling.
 */
(() => {
    'use strict'
  
    // Select all forms that need Bootstrap validation
    const forms = document.querySelectorAll('.needs-validation')
  
    // Process each form in the collection
    Array.from(forms).forEach(form => {
      // Add submit event listener to each form
      form.addEventListener('submit', event => {
        // Check if the form is valid
        if (!form.checkValidity()) {
          // Prevent form submission if validation fails
          event.preventDefault()
          event.stopPropagation()
        }
  
        // Add validation feedback styles
        form.classList.add('was-validated')
      }, false)
    })
  })()