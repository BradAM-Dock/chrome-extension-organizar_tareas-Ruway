document.addEventListener('DOMContentLoaded', () => {
    const contenedorTareas = document.getElementById('contenedorTareas');
    const btnAgregarTarea = document.getElementById('btnAgregarTarea');
  
    let listaDeTareas = [];
  
    // 1. CARGAR TAREAS GUARDADAS EN EL ALMACENAMIENTO DE CHROME
    chrome.storage.local.get(['ruwayTareas'], (result) => {
      if (result.ruwayTareas) {
        listaDeTareas = result.ruwayTareas;
        renderizarTareas();
      }
    });
  
    // 2. GUARDAR TAREAS
    function guardarEnStorage() {
      chrome.storage.local.set({ ruwayTareas: listaDeTareas });
    }
  
    // 3. AGREGAR NUEVA TAREA
    btnAgregarTarea.addEventListener('click', () => {
      const ahora = new Date();
      
      // Fecha y hora actual formateada
      const fechaCreacion = ahora.toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
  
      // Fecha por defecto para entregar: Hoy a las 23:59
      const hoyAnio = ahora.getFullYear();
      const hoyMes = String(ahora.getMonth() + 1).padStart(2, '0');
      const hoyDia = String(ahora.getDate()).padStart(2, '0');
      const fechaLimiteDefault = `${hoyAnio}-${hoyMes}-${hoyDia}T23:59`;
  
      const nuevaTarea = {
        id: Date.now(),
        fechaCreacion: fechaCreacion,
        fechaEntrega: fechaLimiteDefault,
        descripcion: '',
        editando: true // Inicia en modo edición
      };
  
      listaDeTareas.push(nuevaTarea);
      guardarEnStorage();
      renderizarTareas();
    });
  
    // 4. CALCULAR TIEMPO RESTANTE
    function obtenerTiempoRestante(fechaEntregaStr) {
      const ahora = new Date();
      const entrega = new Date(fechaEntregaStr);
      const diferenciaMs = entrega - ahora;
  
      if (diferenciaMs <= 0) {
        return "⚠️ ¡Tiempo agotado / Vencida!";
      }
  
      const minutosTotales = Math.floor(diferenciaMs / (1000 * 60));
      const horasTotales = Math.floor(minutosTotales / 60);
      const dias = Math.floor(horasTotales / 24);
  
      const horasRestantes = horasTotales % 24;
      const minutosRestantes = minutosTotales % 60;
  
      return `Faltan ${dias} d, ${horasRestantes} h y ${minutosRestantes} m`;
    }
  
    // 5. DIBUJAR Y ACTUALIZAR LA LISTA EN PANTALLA
    function renderizarTareas() {
      contenedorTareas.innerHTML = '';
  
      listaDeTareas.forEach((tarea, index) => {
        const card = document.createElement('div');
        card.className = 'card-tarea';
  
        if (tarea.editando) {
          // --- MODO EDICIÓN ---
          card.innerHTML = `
            <div class="card-acciones">
              <button class="btn-icon btn-guardar">✔ Listo</button>
              <button class="btn-icon btn-eliminar">✖</button>
            </div>
            <div class="label-info">
              <strong>Creado el:</strong> ${tarea.fechaCreacion}
            </div>
            <div class="label-info">
              <strong>Entregar el (Fecha y Hora):</strong>
              <input type="datetime-local" class="input-editar input-fecha" value="${tarea.fechaEntrega}">
            </div>
            <div class="label-info">
              <strong>Curso / Pendiente:</strong>
              <input type="text" class="input-editar input-desc" placeholder="Ej. Tarea 1 de Algoritmos..." value="${tarea.descripcion}">
            </div>
          `;
  
          // Eventos en modo edición
          card.querySelector('.btn-guardar').addEventListener('click', () => {
            const nuevaFecha = card.querySelector('.input-fecha').value;
            const nuevaDesc = card.querySelector('.input-desc').value;
  
            listaDeTareas[index].fechaEntrega = nuevaFecha || tarea.fechaEntrega;
            listaDeTareas[index].descripcion = nuevaDesc;
            listaDeTareas[index].editando = false;
  
            guardarEnStorage();
            renderizarTareas();
          });
  
        } else {
          // --- MODO VISTA FINAL (LISTO) ---
          const tiempoTexto = obtenerTiempoRestante(tarea.fechaEntrega);
  
          card.innerHTML = `
            <div class="card-acciones">
              <button class="btn-icon btn-editar">✏ Editar</button>
              <button class="btn-icon btn-completado">✔ Completado</button>
            </div>
            <div class="tiempo-restante-box">
              <span class="tiempo-texto">${tiempoTexto}</span>
            </div>
            <div class="label-info">
              <strong>Curso/Tarea:</strong> ${tarea.descripcion || 'Sin descripción'}
            </div>
            <div class="label-info">
              <strong>Fecha límite:</strong> ${new Date(tarea.fechaEntrega).toLocaleString()}
            </div>
          `;
  
          // Evento botón Editar
          card.querySelector('.btn-editar').addEventListener('click', () => {
            listaDeTareas[index].editando = true;
            guardarEnStorage();
            renderizarTareas();
          });
  
          // Evento botón Completado (Elimina la tarea realizada)
          card.querySelector('.btn-completado').addEventListener('click', () => {
            listaDeTareas.splice(index, 1);
            guardarEnStorage();
            renderizarTareas();
          });
        }
  
        // Evento eliminar en modo edición
        const btnEliminar = card.querySelector('.btn-eliminar');
        if (btnEliminar) {
          btnEliminar.addEventListener('click', () => {
            listaDeTareas.splice(index, 1);
            guardarEnStorage();
            renderizarTareas();
          });
        }
  
        contenedorTareas.appendChild(card);
      });
    }
  });