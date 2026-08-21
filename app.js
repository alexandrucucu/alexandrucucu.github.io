function crearConcepto(datos = null) {
  const div = document.createElement("div");
  div.classList.add("concepto");

  const descripcion = datos ? datos.descripcion : "Piercing";
  const esOtro = datos && !["Piercing", "Tatuaje", "Joyería"].includes(descripcion);

  div.innerHTML = `
    <select class="descripcion">
      <option value="Piercing" ${descripcion === "Piercing" ? "selected" : ""}>Piercing</option>
      <option value="Tatuaje" ${descripcion === "Tatuaje" ? "selected" : ""}>Tatuaje</option>
      <option value="Joyería" ${descripcion === "Joyería" ? "selected" : ""}>Joyería</option>
      <option value="Otro" ${esOtro ? "selected" : ""}>Otro...</option>
    </select>

    <input
      type="text"
      class="otroConcepto"
      placeholder="Escribir concepto"
      style="${esOtro ? 'display:block;width:100%;' : 'display:none;width:100%;'}"
      value="${esOtro ? descripcion : ''}"
    >

    <input
      type="number"
      class="cantidad"
      value="${datos ? datos.cantidad : 1}"
      min="1"
    >

    <input
      type="number"
      class="precio"
      placeholder="Precio"
      min="0"
      step="0.01"
      value="${datos && datos.precio !== undefined ? datos.precio : ''}"
    >

    <button type="button" class="btnEliminar" title="Eliminar concepto">&times;</button>
  `;

  const select = div.querySelector(".descripcion");
  const otroInput = div.querySelector(".otroConcepto");
  const btnEliminar = div.querySelector(".btnEliminar");

  select.addEventListener("change", () => {
    if (select.value === "Otro") {
      otroInput.style.display = "block";
    } else {
      otroInput.style.display = "none";
    }
  });

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

// Cargar estado inicial al abrir la página
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const negocio = urlParams.get("emisorNegocio");

  if (negocio) {
    document.getElementById("tituloNegocio").innerText = `${negocio} - Nueva factura`;
  }

  const contenedorConceptos = document.getElementById("conceptosContainer");
  contenedorConceptos.innerHTML = "";

  const datosGuardados = urlParams.get("datos");

  if (datosGuardados) {
    try {
      const factura = JSON.parse(datosGuardados);
      
      document.getElementById("numeroFactura").value = factura.numeroFactura || "";
      document.getElementById("fecha").value = factura.fecha || "";

      if (factura.conceptos && factura.conceptos.length > 0) {
        factura.conceptos.forEach(conceptoData => {
          contenedorConceptos.appendChild(crearConcepto(conceptoData));
        });
      } else {
        contenedorConceptos.appendChild(crearConcepto());
      }
    } catch (e) {
      console.error("Error al cargar los datos guardados:", e);
      contenedorConceptos.appendChild(crearConcepto());
    }
  } else {
    contenedorConceptos.appendChild(crearConcepto());
  }
});

document.getElementById("agregarConcepto").addEventListener("click", () => {
  document.getElementById("conceptosContainer").appendChild(crearConcepto());
});

document.getElementById("generarFactura").addEventListener("click", () => {
  ocultarError();

  const numeroFactura = document.getElementById("numeroFactura").value.trim();
  const fecha = document.getElementById("fecha").value;

  if (!numeroFactura) {
    mostrarError("Por favor, introduce el número de factura.");
    return;
  }

  if (!fecha) {
    mostrarError("Por favor, selecciona una fecha para la factura.");
    return;
  }

  const conceptosDOM = Array.from(document.querySelectorAll(".concepto"));
  const conceptos = [];

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

  const targetParams = new URLSearchParams(window.location.search);
  targetParams.set("datos", JSON.stringify(factura));

  window.location.href = `factura.html?${targetParams.toString()}`;
});

document.getElementById("fechaHoy").addEventListener("click", () => {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
});
