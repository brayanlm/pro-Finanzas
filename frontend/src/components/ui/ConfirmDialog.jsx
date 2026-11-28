import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const modernStyles = {
  popup: {
    borderRadius: '1.25rem',
    padding: '0 0.5rem',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 24px 48px -8px rgb(0 0 0 / 0.28), 0 0 0 1px rgb(0 0 0 / 0.04)'
  },
  htmlContainerHighlighter: {
    pointerEvents: 'none'
  },
  title: {
    color: '#11141B',
    fontSize: '1.125rem',
    fontWeight: '600',
    lineHeight: '1.5'
  },
  text: {
    color: '#64748B',
    fontSize: '0.9rem',
    maxWidth: '420px'
  },
  icon: {
    marginBottom: '0.25rem'
  },
  confirmButton: {
    borderRadius: '0.75rem',
    padding: '0.625rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  cancelButton: {
    borderRadius: '0.75rem',
    padding: '0.625rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: '500'
  }
};

export const confirmDialog = async ({
  title = '¿Estás seguro?',
  text,
  icon = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = '#4f46e5',
  showCancelButton = true
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#64748B',
    reverseButtons: true,
    buttonsStyling: false,
    customClass: modernStyles
  });

  return result.isConfirmed;
};

export const alertDialog = async ({
  title,
  text,
  icon = 'info',
  confirmText = 'Entendido',
  confirmColor = '#4f46e5'
}) => {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: confirmText,
    confirmButtonColor: confirmColor,
    buttonsStyling: false,
    customClass: { ...modernStyles, confirmButton: `${modernStyles.confirmButton} text-white bg-primary-600` }
  });
};

export const toast = ({
  title,
  icon = 'success',
  timer = 3000,
  position = 'top-end'
}) => {
  Swal.fire({
    title,
    icon,
    timer,
    position,
    toast: true,
    showConfirmButton: false,
    timerProgressBar: true,
    buttonsStyling: false,
    customClass: {
      popup: `${modernStyles.popup} toast-container-custom`,
      ...modernStyles
    }
  });
};

export const inputDialog = async ({
  title,
  text,
  inputPlaceholder,
  inputValue = '',
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  confirmColor = '#4f46e5',
  validationMessage = 'Este campo es requerido',
  showCancelButton = true
}) => {
  const result = await Swal.fire({
    title,
    text,
    input: 'text',
    inputPlaceholder,
    inputValue,
    showCancelButton,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#64748B',
    inputValidator: (value) => {
      if (!value) return validationMessage;
    },
    buttonsStyling: false,
    customClass: { ...modernStyles, input: 'rounded-lg border-gray-300 dark:border-gray-600 py-2.5 px-3 text-sm' }
  });

  return result.value;
};
