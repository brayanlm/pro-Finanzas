import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

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
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2'
    },
    buttonsStyling: false
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
    customClass: {
      popup: 'rounded-xl',
      confirmButton: 'rounded-lg px-4 py-2'
    },
    buttonsStyling: false
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
    customClass: {
      popup: 'rounded-xl'
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
  validationMessage = 'Este campo es requerido'
}) => {
  const result = await Swal.fire({
    title,
    text,
    input: 'text',
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#6b7280',
    inputValidator: (value) => {
      if (!value) return validationMessage;
    },
    customClass: {
      popup: 'rounded-xl',
      confirmButton: 'rounded-lg px-4 py-2',
      cancelButton: 'rounded-lg px-4 py-2',
      input: 'rounded-lg border-gray-300 dark:border-gray-600'
    },
    buttonsStyling: false
  });

  return result.value;
};