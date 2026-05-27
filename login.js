// Verificar que electronAPI esté disponible
if (typeof window.electronAPI === 'undefined') {
    console.error('electronAPI no está disponible');
    document.getElementById('errorMessage').textContent = 'Error: La API de Electron no está disponible. Por favor, recarga la aplicación.';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = '';
    
    if (typeof window.electronAPI === 'undefined') {
        errorMessage.textContent = 'Error: La API de Electron no está disponible. Por favor, recarga la aplicación.';
        return;
    }
    
    try {
        const result = await window.electronAPI.login({ usuario, password });
        
        if (result.success) {
            // Mostrar mensaje de éxito
            errorMessage.textContent = '✅ ¡Conexión exitosa! Redirigiendo...';
            errorMessage.style.color = '#22c55e';
            errorMessage.style.fontWeight = '600';
            
            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            errorMessage.textContent = '❌ Usuario o contraseña incorrectos';
            errorMessage.style.color = '#ef4444';
        }
    } catch (error) {
        errorMessage.textContent = '❌ Error al iniciar sesión: ' + error.message;
        errorMessage.style.color = '#ef4444';
    }
});


