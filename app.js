/**
 * APP.JS - Lógica de control de la pantalla de creación/edición de facturas
 */

// Constantes de configuración global
const IVA_POR_DEFECTO = 21;
const CONCEPTOS_PREDEFINIDOS = ["Piercing", "Tatuaje", "Joyería"];

/**
 * Fabrica dinámicamente un nodo del DOM con los controles de un concepto (servicio/producto).
 * @param {Object|null} datos - Datos previos si estamos en modo edición.
 * @returns {HTMLElement} Div container con la fila del concepto.
 */
function crearConcepto(datos = null) {
  const div = document.createElement("div");
  div.classList.add("concepto");

  const descripcion = datos ? datos.descripcion : "Piercing";
  const esOtroDesc = datos && !CONCEPTOS_PREDEFINIDOS.includes(descripcion);

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

  // Asignación de listeners a elementos internos del concepto generado
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
      // Reseteo limpio si es el único elemento
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

/**
 * Muestra el panel de alerta con el mensaje de error de validación.
 * @param {string} mensaje 
 */
function mostrarError(mensaje) {
  const divError = document.getElementById("mensajeError");
  if (divError) {
    divError.innerText = mensaje;
    divError.style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Oculta el panel de alerta de errores.
 */
function ocultarError() {
  const divError = document.getElementById("mensajeError");
  if (divError) {
    divError.style.display = "none";
    divError.innerText = "";
  }
}

// Inicialización de controladores de eventos al cargar la ventana
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
  const chkDesglose = document.getElementById("chkDesglosarIva");

  // Toggle visual y regla de negocio: Para Facturas Ordinarias el desglosado de IVA es legalmente obligatorio
  btnToggleReceptor.addEventListener("click", () => {
    if (seccionReceptor.style.display === "none") {
      seccionReceptor.style.display = "block";
      btnToggleReceptor.innerText = "- Quitar datos cliente (Receptor)";
      chkDesglose.checked = true;
      chkDesglose.disabled = true;
    } else {
      seccionReceptor.style.display = "none";
      btnToggleReceptor.innerText = "+ Añadir datos cliente (Receptor)";
      chkDesglose.disabled = false;
    }
  });

  // Rehidratación de estado desde URL si estamos en modo edición
  const datosGuardados = urlParams.get("datos");

  if (datosGuardados) {
    try {
      const factura = JSON.parse(datosGuardados);
      document.getElementById("numeroFactura").value = factura.numeroFactura || "";
      document.getElementById("fecha").value = factura.fecha || "";
      document.getElementById("porcentajeIva").value = factura.porcentajeIva !== undefined ? factura.porcentajeIva : IVA_POR_DEFECTO;
      
      if (factura.desglosarIva !== undefined) {
        chkDesglose.checked = factura.desglosarIva;
      }

      if (factura.receptor) {
        seccionReceptor.style.display = "block";
        btnToggleReceptor.innerText = "- Quitar datos cliente (Receptor)";
        chkDesglose.checked = true;
        chkDesglose.disabled = true;

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
      console.error("Error al rehidrata los datos de la factura:", e);
      contenedorConceptos.appendChild(crearConcepto());
    }
  } else {
    contenedorConceptos.appendChild(crearConcepto());
  }

  // Handlers para botones de acción secundarias
  document.getElementById("agregarConcepto").addEventListener("click", () => {
    document.getElementById("conceptosContainer").appendChild(crearConcepto());
  });

  document.getElementById("fechaHoy").addEventListener("click", () => {
    document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
  });

  // Envío del formulario y serialización a URL
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

    // Extracción de datos del Emisor recibidos originalmente por URL
    const emisor = {
      negocio: urlParams.get("emisorNegocio") || "",
      nombre: urlParams.get("emisorNombre") || "",
      dni: urlParams.get("emisorDni") || "",
      dir: urlParams.get("emisorDir") || "",
      poblacion: urlParams.get("emisorPoblacion") || "",
      tel: urlParams.get("emisorTel") || "",
      email: urlParams.get("emisorEmail") || ""
    };

    const valIva = parseFloat(document.getElementById("porcentajeIva").value);
    const porcentajeIva = (!isNaN(valIva) && valIva >= 0) ? valIva : IVA_POR_DEFECTO;

    let receptor = null;
    if (seccionReceptor.style.display !== "none") {
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
      desglosarIva: chkDesglose.checked,
      porcentajeIva,
      emisor
    };

    const targetParams = new URLSearchParams(window.location.search);
    targetParams.set("datos", JSON.stringify(factura));

    window.location.href = `factura.html?${targetParams.toString()}`;
  });

  // Lógica de la Calculadora Modal Flotante de IVA
  const modalCalc = document.getElementById("modalCalc");
  const btnAbrirCalc = document.getElementById("btnAbrirCalc");
  const btnCerrarCalc = document.getElementById("btnCerrarCalc");
  const calcPrecioInput = document.getElementById("calcPrecioTotal");
  const calcIvaInput = document.getElementById("calcPctIva");

  /**
   * Recalcula la base imponible e IVA de forma reactiva en el modal.
   * Fórmula oficial Agencia Tributaria: Base = Total / (1 + IVA%)
   */
  function calcularIvaRapido() {
    const total = parseFloat(calcPrecioInput.value) || 0;
    const pct = parseFloat(calcIvaInput.value) || IVA_POR_DEFECTO;

    const base = total / (1 + (pct / 100));
    const cuota = total - base;

    document.getElementById("calcBase").innerText = `${base.toFixed(2)} €`;
    document.getElementById("calcCuota").innerText = `${cuota.toFixed(2)} €`;
    document.getElementById("calcTotal").innerText = `${total.toFixed(2)} €`;
  }

  if (btnAbrirCalc && modalCalc) {
    btnAbrirCalc.addEventListener("click", () => {
      modalCalc.style.display = "flex";
      calcPrecioInput.focus();
    });

    if (btnCerrarCalc) {
      btnCerrarCalc.addEventListener("click", () => {
        modalCalc.style.display = "none";
      });
    }

    // Cierre al pulsar fuera de la tarjeta emergente (Backdrop click)
    window.addEventListener("click", (e) => {
      if (e.target === modalCalc) modalCalc.style.display = "none";
    });

    calcPrecioInput.addEventListener("input", calcularIvaRapido);
    calcIvaInput.addEventListener("input", calcularIvaRapido);
  }
});
