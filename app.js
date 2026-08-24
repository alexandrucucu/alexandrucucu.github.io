function crearConcepto(datos = null) {
  const div = document.createElement("div");
  div.classList.add("concepto");

  const descripcion = datos ? datos.descripcion : "Piercing";
  const esOtroDesc = datos && !["Piercing", "Tatuaje", "Joyería"].includes(descripcion);

  const cantidadInicial = datos ? datos.cantidad : 1;
  const esCantidadOtro = cantidadInicial > 9;

  div.innerHTML = `
    <select class="descripcion">
      <option value="Piercing" ${descripcion === "Piercing" ? "selected" : ""}>Piercing</option>
      <option value="Tatuaje" ${descripcion === "Tatuaje" ? "selected" : ""}>Tatuaje</option>
      <option value="Joyería" ${descripcion === "Joyería" ? "selected" : ""}>Joyería</option>
      <option value="Otro" ${esOtroDesc ? "selected" : ""}>Otro...</option>
    </select>

    <select class="cantidadSelect" style="${esCantidadOtro ? 'display:none;' : 'display:block;'}">
      <option value="1" ${cantidadInicial === 1 ? "selected" : ""}>1</option>
      <option value="2" ${cantidadInicial === 2 ? "selected" : ""}>2</option>
      <option value="3" ${cantidadInicial === 3 ? "selected" : ""}>3</option>
      <option value="4" ${cantidadInicial === 4 ? "selected" : ""}>4</option>
      <option value="5" ${cantidadInicial === 5 ? "selected" : ""}>5</option>
      <option value="6" ${cantidadInicial === 6 ? "selected" : ""}>6</option>
      <option value="7" ${cantidadInicial === 7 ? "selected" : ""}>7</option>
      <option value="8" ${cantidadInicial === 8 ? "selected" : ""}>8</option>
      <option value="9" ${cantidadInicial === 9 ? "selected" : ""}>9</option>
      <option value="Otro" ${esCantidadOtro ? "selected" : ""}>+9</option>
    </select>

    <input
      type="number"
      class="cantidadInput"
      placeholder="Cant."
      min="1"
      style="${esCantidadOtro ? 'display:block;' : 'display:none;'}"
      value="${esCantidadOtro ? cantidadInicial : ''}"
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

    <input
      type="text"
      class="otroConcepto"
      placeholder="Escribir concepto"
      style="${esOtroDesc ? 'display:block;width:100%;' : 'display:none;width:100%;'}"
      value="${esOtroDesc ? descripcion : ''}"
    >
  `;

  const selectDesc = div.querySelector(".descripcion");
  const otroDescInput = div.querySelector(".otroConcepto");
  const selectCant = div.querySelector(".cantidadSelect");
  const otroCantInput = div.querySelector(".cantidadInput");
  const btnEliminar = div.querySelector(".btnEliminar");

  selectDesc.addEventListener("change", () => {
    otroDescInput.style.display = selectDesc.value === "Otro" ? "block" : "none";
  });

  selectCant.addEventListener("change", () => {
    if (selectCant.value === "Otro") {
      selectCant.style.display = "none";
      otroCantInput.style.display = "block";
      otroCantInput.focus();
    }
  });

  btnEliminar.addEventListener("click", () => {
    const contenedor = document.getElementById("conceptosContainer");
    if (contenedor.querySelectorAll(".concepto").length > 1) {
      div.remove();
    } else {
      selectDesc.value = "Piercing";
      otroDescInput.style.display = "none";
      otroDescInput.value = "";
      selectCant.value = "1";
      selectCant.style.display = "block";
      otroCantInput.style.display = "none";
      otroCantInput.value = "";
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

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const negocio = urlParams.get("emisorNegocio");

  if (negocio) {
    document.getElementById("tituloNegocio").innerText = `${negocio} - Nueva factura`;
  }

  const contenedorConceptos = document.getElementById("conceptosContainer");
  contenedorConceptos.innerHTML = "";

  const btnToggleReceptor = document.getElementById("btnToggleReceptor");
  const seccionReceptor = document.getElementById("seccionReceptor");

  btnToggleReceptor.addEventListener("click", () => {
    if (seccionReceptor.style.display === "none") {
      seccionReceptor.style.display = "block";
      btnToggleReceptor.innerText = "- Quitar datos cliente (Receptor)";
    } else {
      seccionReceptor.style.display = "none";
      btnToggleReceptor.innerText = "+ Añadir datos cliente (Receptor)";
    }
  });

  const datosGuardados = urlParams.get("datos");

  if (datosGuardados) {
    try {
      const factura = JSON.parse(datosGuardados);
      document.getElementById("numeroFactura").value = factura.numeroFactura || "";
      document.getElementById("fecha").value = factura.fecha || "";

      if (factura.receptor) {
        seccionReceptor.style.display = "block";
        btnToggleReceptor.innerText = "- Quitar datos cliente (Receptor)";
        document.getElementById("porcentajeIva").value = factura.porcentajeIva !== undefined ? factura.porcentajeIva : 21;
        document.getElementById("receptorNombre").value = factura.receptor.nombre || "";
        document.getElementById("receptorDni").value = factura.receptor.dni || "";
        document.getElementById("receptorDireccion").value = factura.receptor.direccion || "";
        document.getElementById("receptorCiudad").value = factura.receptor.ciudad || "";
        document.getElementById("receptorTelefono").value = factura.receptor.telefono || "";
        document.getElementById("receptorEmail").value = factura.receptor.email || "";
      }

      if (factura.conceptos && factura.conceptos.length > 0) {
        factura.conceptos.forEach(conceptoData => {
          contenedorConceptos.appendChild(crearConcepto(conceptoData));
        });
      } else {
        contenedorConceptos.appendChild(crearConcepto());
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
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
    const selectDesc = c.querySelector(".descripcion");
    let descripcion = selectDesc.value;
    const otroDescInput = c.querySelector(".otroConcepto");

    if (descripcion === "Otro") {
      descripcion = otroDescInput.value.trim();
      if (!descripcion) {
        mostrarError(`En el concepto #${index + 1}, debes escribir una descripción.`);
        return;
      }
    }

    const selectCant = c.querySelector(".cantidadSelect");
    const cantidadInput = c.querySelector(".cantidadInput");
    let cantidad;

    if (selectCant.style.display === "none") {
      cantidad = parseFloat(cantidadInput.value.trim());
      if (isNaN(cantidad) || cantidad <= 0) {
        mostrarError(`En el concepto #${index + 1}, introduce una cantidad válida mayor que 0.`);
        return;
      }
    } else {
      cantidad = parseFloat(selectCant.value);
    }

    const precioInput = c.querySelector(".precio").value.trim();
    const precio = parseFloat(precioInput);

    if (precioInput === "" || isNaN(precio) || precio <= 0) {
      mostrarError(`En el concepto #${index + 1}, debes indicar un precio válido mayor que 0€.`);
      return;
    }

    conceptos.push({ descripcion, cantidad, precio });
  }

  let receptor = null;
  let porcentajeIva = 21;
  const seccionReceptor = document.getElementById("seccionReceptor");
  
  if (seccionReceptor.style.display !== "none") {
    const valIva = parseFloat(document.getElementById("porcentajeIva").value);
    if (isNaN(valIva) || valIva < 0) {
      mostrarError("Debes indicar un porcentaje de IVA válido.");
      return;
    }
    porcentajeIva = valIva;

    const nombre = document.getElementById("receptorNombre").value.trim();
    const dni = document.getElementById("receptorDni").value.trim();
    const direccion = document.getElementById("receptorDireccion").value.trim();
    const ciudad = document.getElementById("receptorCiudad").value.trim();
    const telefono = document.getElementById("receptorTelefono").value.trim();
    const email = document.getElementById("receptorEmail").value.trim();

    if (!nombre || !dni || !direccion || !ciudad) {
      mostrarError("Para facturas ordinarias debes indicar Nombre, NIF/DNI, Dirección y Ciudad/CP.");
      return;
    }

    receptor = { nombre, dni, direccion, ciudad, telefono, email };
  }

  const factura = {
    numeroFactura,
    fecha,
    conceptos,
    receptor,
    porcentajeIva
  };

  const targetParams = new URLSearchParams(window.location.search);
  targetParams.set("datos", JSON.stringify(factura));

  window.location.href = `factura.html?${targetParams.toString()}`;
});

document.getElementById("fechaHoy").addEventListener("click", () => {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
});
