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
    // Solo permitir eliminar si hay más de un concepto visible
    if (contenedor.querySelectorAll(".concepto").length > 1) {
      div.remove();
    } else {
      // Si es la única fila, limpiar los campos en lugar de borrarla
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

document.getElementById("generarFactura").addEventListener("click", () => {
  const numeroFactura = document.getElementById("numeroFactura").value;
  const fecha = document.getElementById("fecha").value;
  const conceptosDOM = document.querySelectorAll(".concepto");
  const conceptos = [];

  conceptosDOM.forEach(c => {
    const select = c.querySelector(".descripcion");
    let descripcion = select.value;

    if (descripcion === "Otro") {
      descripcion = c.querySelector(".otroConcepto").value;
    }

    const cantidad = parseFloat(c.querySelector(".cantidad").value) || 0;
    const precioInput = c.querySelector(".precio").value;
    const precio = parseFloat(precioInput);

    // Solo se tiene en cuenta si el precio se ha rellenado, no está vacío y es mayor que 0
    if (precioInput !== "" && !isNaN(precio) && precio > 0 && cantidad > 0) {
      conceptos.push({
        descripcion: descripcion || "Concepto",
        cantidad,
        precio
      });
    }
  });

  // Validación básica: si no hay conceptos válidos
  if (conceptos.length === 0) {
    alert("Por favor, introduce al menos un concepto con un precio válido.");
    return;
  }

  const factura = {
    numeroFactura,
    fecha,
    conceptos
  };

  // Mantenemos todos los parámetros actuales de la URL y añadimos los datos de la factura
  const targetParams = new URLSearchParams(window.location.search);
  targetParams.set("datos", JSON.stringify(factura));

  window.location.href = `factura.html?${targetParams.toString()}`;
});

document.getElementById("fechaHoy").addEventListener("click", () => {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
});
