
// Só comportamentos visuais e placeholders.
document.addEventListener('DOMContentLoaded', () => {
  const mic = document.querySelector('#micBtn');
  const phone = document.querySelector('#phoneBtn');
  const input = document.querySelector('#userInput');
  const callModal = document.querySelector('#callModal');
  const closeCall = document.querySelector('#closeCall');
  const otpForm = document.querySelector('#otpForm');

  if (mic) mic.addEventListener('click', () => {
    alert('Microfone: gravar e transcrever (placeholder).');
  });

  if (phone) phone.addEventListener('click', () => {
    callModal.style.display = 'block';
    setTimeout(() => {
      const s = document.querySelector('#callStatus');
      if (s) s.textContent = 'Conectado com Dra. Clarice (simulação)';
    }, 1200);
  });

  if (closeCall) closeCall.addEventListener('click', () => {
    callModal.style.display = 'none';
    const s = document.querySelector('#callStatus');
    if (s) s.textContent = 'Ligando para Dra. Clarice…';
  });

  if (otpForm) otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Verificação enviada (placeholder).');
  });
});
