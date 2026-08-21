function crearConcepto() {
  const div = document.createElement("div");
  div.classList.add("concepto");

  div.innerHTML = `
    <select class="descripcion">
      <option value="Piercing">Piercing</option>
      <option value="Tatuaje">Tatuaje</option>
      <option value="Joyería">Joyería</option>
      <option value="Otro">Otro...</option>
    </select>

    <input
      type="text"
      class="otroConcepto"
      placeholder="Escribir concepto"
      style="display:none;width:100%;"
    >

    <input
      type="number"
      class="cantidad"
      value="1"
      min="1"
    >

    <input
      type="number"
      class="precio"
      placeholder="Precio"
      min="0"
      step="0.01"
    >

    <button type="button" class="btnEliminar" title="Eliminar concepto">&times;</button>
  `;

  const select = div.querySelector(".descripcion");
  const otroInput = div.querySelector(".otroConcepto");
  const btnEliminar = div.querySelector(".btnEliminar");

  // Mostrar / ocultar campo "Otro"
  select.addEventListener("change", () => {
    if (select.value === "Otro") {
      otroInput.style.display = "block";
    } else {
      otroInput.style.display = "none";
    }
  });

  // Evento para eliminar la fila al hacer clic en la "X"
  btnEliminar.addEventListener("click", () => {
    const contenedor = document.getElementById("conceptosContainer");
    if (contenedor.querySelectorAll(".concepto").length > 1) {
      div.remove();
    } else {
      select.value = "Piercing";
      otroInput.style.display = "none";
      otroInput.value = "";
      div.querySelector(".cantidad").value = "1";
      div.querySelector(".precio").value = "";
    }
  });

  return div;
}

// Inicializar primer concepto
document.getElementById("conceptosContainer").appendChild(crearConcepto());

document.getElementById("agregarConcepto").addEventListener("click", () => {
  const container = document.getElementById("conceptosContainer");
  container.appendChild(crearConcepto());
});

// Mostrar el nombre del negocio en el título si viene por URL
const urlParams = new URLSearchParams(window.location.search);
const negocio = urlParams.get("emisorNegocio");
if (negocio) {
  document.getElementById("tituloNegocio").innerText = `${negocio} - Nueva factura`;
}

function mostrarError(mensaje) {
  const divError = document.getElementById("mensajeError");
  divError.innerText = mensaje;
  divError.style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ocultarError() {
  const divError = document.getElementById("mensajeError");
  divError.style.display = "none";
  divError.innerText = "";
}

document.getElementById("generarFactura").addEventListener("click", () => {
  ocultarError();

  const numeroFactura = document.getElementById("numeroFactura").value.trim();
  const fecha = document.getElementById("fecha").value;

  // 1. Validar número de factura
  if (!numeroFactura) {
    mostrarError("Por favor, introduce el número de factura.");
    return;
  }

  // 2. Validar fecha
  if (!fecha) {
    mostrarError("Por favor, selecciona una fecha para la factura.");
    return;
  }

  const conceptosDOM = Array.from(document.querySelectorAll(".concepto"));
  const conceptos = [];

  // Usamos for...of para poder cortar la ejecución con return al primer error
  for (let index = 0; index < conceptosDOM.length; index++) {
    const c = conceptosDOM[index];
    const select = c.querySelector(".descripcion");
    let descripcion = select.value;
    const otroInput = c.querySelector(".otroConcepto");

    if (descripcion === "Otro") {
      descripcion = otroInput.value.trim();
      if (!descripcion) {
        mostrarError(`En el concepto #${index + 1}, debes escribir una descripción.`);
        return;
      }
    }

    const cantidadInput = c.querySelector(".cantidad").value;
    const cantidad = parseFloat(cantidadInput);

    if (isNaN(cantidad) || cantidad <= 0) {
      mostrarError(`En el concepto #${index + 1}, la cantidad debe ser mayor que 0.`);
      return;
    }

    const precioInput = c.querySelector(".precio").value.trim();
    const precio = parseFloat(precioInput);

    // Si algún precio está vacío, no es número o es <= 0, se bloquea la salida
    if (precioInput === "" || isNaN(precio) || precio <= 0) {
      mostrarError(`En el concepto #${index + 1}, debes indicar un precio válido mayor que 0€.`);
      return;
    }

    conceptos.push({
      descripcion,
      cantidad,
      precio
    });
  }

  if (conceptos.length === 0) {
    mostrarError("Debes incluir al menos un concepto en la factura.");
    return;
  }

  const factura = {
    numeroFactura,
    fecha,
    conceptos
  };

  // Mantenemos los parámetros de la URL y añadimos la factura
  const targetParams = new URLSearchParams(window.location.search);
  targetParams.set("datos", JSON.stringify(factura));

  window.location.href = `factura.html?${targetParams.toString()}`;
});

document.getElementById("fechaHoy").addEventListener("click", () => {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
});
