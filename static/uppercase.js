function forceUppercaseTextFields(root = document) {
  const selector = 'input[type="text"], input:not([type]), textarea';
  const fields = root.querySelectorAll(selector);

  fields.forEach((field) => {
    const normalize = () => {
      if (typeof field.value !== 'string') {
        return;
      }
      field.value = field.value.toUpperCase();
    };

    normalize();
    field.addEventListener('input', normalize);
    field.addEventListener('blur', normalize);
    field.addEventListener('paste', () => {
      setTimeout(normalize, 0);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => forceUppercaseTextFields());
} else {
  forceUppercaseTextFields();
}
