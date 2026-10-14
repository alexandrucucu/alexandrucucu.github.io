/**
 * APP.JS - Lógica de control de la pantalla de creación/edición de facturas
 * Versión de producción con validaciones reforzadas y soporte multi-lote.
 */

const IVA_POR_DEFECTO = 21;
const CONCEPTOS_PREDEFINIDOS = ["Piercing", "Tatuaje", "Joyería"];

/**
 * Fabrica dinámicamente un nodo del DOM con los controles de un concepto.
 * @param {Object|null} datos - Datos previos si se rehidrata desde URL o CSV.
 * @returns {HTMLElement} Div contenedor con la fila del concepto.
 */
function crearConcepto(datos = null) {
  const div = document.createElement("div");
  div.classList.add("concepto");

  const descripcion = datos ? datos.descripcion : "Piercing";
  const esOtroDesc = datos && !CONCEPTOS_PREDEFINIDOS.includes(descripcion);

  const cantidadInicial = datos ? datos.cantidad : 1;
  const esCantidadOtro = cantidadInicial > 9;

  div.innerHTML = `
    <select class="descripcion" aria-label="Descripción del servicio">
      <option value="Piercing" ${descripcion === "Piercing" ? "selected" : ""}>Piercing</option>
      <option value="Tatuaje" ${descripcion === "Tatuaje" ? "selected" : ""}>Tatuaje</option>
      <option value="Joyería" ${descripcion === "Joyería" ? "selected" : ""}>Joyería</option>
      <option value="Otro" ${esOtroDesc ? "selected" : ""}>Otro...</option>
    </select>

    <select class="cantidadSelect" aria-label="Cantidad prestada" style="${esCantidadOtro ? 'display:none;' : 'display:block;'}">
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
      aria-label="Cantidad personalizada"
      style="${esCantidadOtro ? 'display:block;' : 'display:none;'}"
      value="${esCantidadOtro ? cantidadInicial : ''}"
    >

    <input
      type="number"
      class="precio"
      placeholder="Precio"
      min="0"
      step="0.01"
      aria-label="Precio unitario en euros"
      value="${datos && datos.precio !== undefined ? datos.precio : ''}"
    >

    <button type="button" class="btnEliminar" title="Eliminar concepto" aria-label="Eliminar concepto">&times;</button>

    <input
      type="text"
      class="otroConcepto"
      placeholder="Escribir concepto"
      aria-label="Concepto personalizado"
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

/**
 * Muestra el panel de error con estilo visual de alerta.
 * @param {string} mensaje - Texto explicativo del error.
 */
function mostrarError(mensaje) {
  const divError = document.getElementById("mensajeError");
  if (divError) {
    divError.innerText = mensaje;
    divError.style.backgroundColor = "#f8d7da";
    divError.style.color = "#721c24";
    divError.style.borderColor = "#f5c6cb";
    divError.style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Oculta la barra de alertas.
 */
function ocultarError() {
  const divError = document.getElementById("mensajeError");
  if (divError) {
    divError.style.display = "none";
    divError.innerText = "";
  }
}

/**
 * Convierte un texto a número float soportando coma o punto decimal.
 * @param {string} val 
 * @returns {number}
 */
function parsearNumeroSeguro(val) {
  if (!val) return 0;
  const numSanitizado = val.toString().replace(",", ".");
  const num = parseFloat(numSanitizado);
  return isNaN(num) ? 0 : num;
}

/**
 * Parsea el texto CSV, agrupa filas por factura y aplica validaciones estrictas.
 * @param {string} textoCsv 
 * @returns {Array<Object>|null} Lista de facturas o null si falla la validación.
 */
function parsearCsvLoteConValidaciones(textoCsv) {
  const lineas = textoCsv.split(/\r?\n/).filter(l => l.trim().length > 0);
  const facturasMap = new Map();

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const partesRaw = linea.includes(";") ? linea.split(";") : linea.split(",");
    const partes = partesRaw.map(p => p.trim());

    if (partes.length >= 5) {
      const numFactura = partes[0];

      // Filtro de cabeceras
      if (isNaN(numFactura) && (
        numFactura.toLowerCase().includes("numero") || 
        numFactura.toLowerCase().includes("factura") || 
        numFactura.toLowerCase().includes("nº")
      )) {
        continue;
      }

      let fechaRaw = partes[1];
      let fechaIso = "";

      if (fechaRaw.includes("/")) {
        const [d, m, a] = fechaRaw.split("/");
        if (d && m && a) fechaIso = `${a.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (fechaRaw.includes("-")) {
        const partesFecha = fechaRaw.split("-");
        if (partesFecha[0].length === 4) {
          fechaIso = fechaRaw;
        } else if (partesFecha.length === 3) {
          const [d, m, a] = partesFecha;
          fechaIso = `${a.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }

      if (!fechaIso) {
        mostrarError(`La fecha "${fechaRaw}" en la fila ${i + 1} no es válida (Usar DD/MM/AAAA o AAAA-MM-DD).`);
        return null;
      }

      const conceptoVal = partes[2];
      const cantidadVal = parsearNumeroSeguro(partes[3]) || 1;
      const precioVal = parsearNumeroSeguro(partes[4]);

      const valIvaRaw = partes[5] !== undefined ? partes[5] : "";
      const tieneIvaEstaFila = valIvaRaw !== "" && !isNaN(parsearNumeroSeguro(valIvaRaw));
      const pctIvaFila = tieneIvaEstaFila ? parsearNumeroSeguro(valIvaRaw) : IVA_POR_DEFECTO;

      if (!facturasMap.has(numFactura)) {
        facturasMap.set(numFactura, {
          numeroFactura: numFactura,
          fecha: fechaIso,
          fechaIso: fechaIso,
          desglosarIva: tieneIvaEstaFila,
          porcentajeIva: pctIvaFila,
          conceptos: []
        });
      }

      const facActual = facturasMap.get(numFactura);

      // Validaciones de consistencia
      if (facActual.fechaIso !== fechaIso) {
        mostrarError(`Incoherencia en CSV: La factura ${numFactura} tiene fechas distintas.`);
        return null;
      }
      if (facActual.desglosarIva !== tieneIvaEstaFila) {
        mostrarError(`Incoherencia en CSV: No se pueden mezclar filas con y sin IVA en la factura ${numFactura}.`);
        return null;
      }
      if (tieneIvaEstaFila && facActual.porcentajeIva !== pctIvaFila) {
        mostrarError(`Incoherencia en CSV: La factura ${numFactura} tiene porcentajes de IVA distintos (${facActual.porcentajeIva}% y ${pctIvaFila}%).`);
        return null;
      }

      facActual.conceptos.push({
        descripcion: conceptoVal,
        cantidad: cantidadVal,
        precio: precioVal
      });
    }
  }

  const resultado = Array.from(facturasMap.values());
  if (resultado.length === 0) {
    mostrarError("Formato CSV no válido. Columnas requeridas: Nº, Fecha, Concepto, Cantidad, Precio, [IVA%]");
    return null;
  }

  return resultado;
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
  const chkDesglose = document.getElementById("chkDesglosarIva");

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

  const datosGuardados = urlParams.get("datos");

  if (datosGuardados) {
    try {
      const factura = JSON.parse(datosGuardados);
      document.getElementById("numeroFactura").value = factura.numeroFactura || "";
      document.getElementById("fecha").value = factura.fecha || factura.fechaIso || "";
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
      console.error("Error al rehidratar datos:", e);
      contenedorConceptos.appendChild(crearConcepto());
    }
  } else {
    contenedorConceptos.appendChild(crearConcepto());
  }

  // CONTROLES CSV
  const btnToggleCsv = document.getElementById("btnToggleCsv");
  const bloqueCsv = document.getElementById("bloqueCsv");
  const btnCargarCsv = document.getElementById("btnCargarCsv");
  const btnDirectoCsv = document.getElementById("btnDirectoCsv");
  const inputCsv = document.getElementById("inputCsv");

  if (btnToggleCsv && bloqueCsv) {
    btnToggleCsv.addEventListener("click", () => {
      bloqueCsv.style.display = bloqueCsv.style.display === "none" ? "block" : "none";
      if (bloqueCsv.style.display === "block") inputCsv.focus();
    });

    btnCargarCsv.addEventListener("click", () => {
      ocultarError();
      const textoCsv = inputCsv.value.trim();
      if (!textoCsv) return;

      const lote = parsearCsvLoteConValidaciones(textoCsv);
      if (!lote) return;

      const primera = lote[0];
      document.getElementById("numeroFactura").value = primera.numeroFactura;
      document.getElementById("fecha").value = primera.fechaIso;
      chkDesglose.checked = primera.desglosarIva;
      document.getElementById("porcentajeIva").value = primera.porcentajeIva;

      contenedorConceptos.innerHTML = "";
      primera.conceptos.forEach(c => {
        contenedorConceptos.appendChild(crearConcepto(c));
      });

      bloqueCsv.style.display = "none";
      inputCsv.value = "";

      if (lote.length > 1) {
        mostrarError(`Nota: Se ha cargado en el formulario la primera factura (Nº ${primera.numeroFactura}) de las ${lote.length} detectadas. Para generarlas todas juntas en un PDF, usa "Ir Directo a Factura 🚀".`);
        const divError = document.getElementById("mensajeError");
        if (divError) {
          divError.style.backgroundColor = "#e8f4f8";
          divError.style.color = "#1d6f8a";
          divError.style.borderColor = "#bce8f1";
        }
      }
    });

    if (btnDirectoCsv) {
      btnDirectoCsv.addEventListener("click", () => {
        ocultarError();
        const textoCsv = inputCsv.value.trim();
        if (!textoCsv) return;

        const lote = parsearCsvLoteConValidaciones(textoCsv);
        if (!lote) return;

        const emisor = {
          negocio: urlParams.get("emisorNegocio") || "",
          nombre: urlParams.get("emisorNombre") || "",
          dni: urlParams.get("emisorDni") || "",
          dir: urlParams.get("emisorDir") || "",
          poblacion: urlParams.get("emisorPoblacion") || "",
          tel: urlParams.get("emisorTel") || "",
          email: urlParams.get("emisorEmail") || ""
        };

        lote.forEach(f => f.emisor = emisor);

        const targetParams = new URLSearchParams(window.location.search);
        let payloadString = "";

        if (lote.length === 1) {
          payloadString = JSON.stringify(lote[0]);
          targetParams.set("datos", payloadString);
          targetParams.delete("lote");
        } else {
          payloadString = JSON.stringify(lote);
          targetParams.set("lote", payloadString);
          targetParams.delete("datos");
        }

        // Control preventivo de longitud de la URL
        if (targetParams.toString().length > 15000) {
          mostrarError("El lote pegado es demasiado grande para enviarlo directamente. Reduce el número de facturas por lote.");
          return;
        }

        window.location.href = `factura.html?${targetParams.toString()}`;
      });
    }
  }

  function limpiarFormulario() {
    ocultarError();

    document.getElementById("numeroFactura").value = "";
    document.getElementById("fecha").value = "";

    const chkDesglose = document.getElementById("chkDesglosarIva");
    chkDesglose.checked = false;
    chkDesglose.disabled = false;
    document.getElementById("porcentajeIva").value = IVA_POR_DEFECTO;

    const seccionReceptor = document.getElementById("seccionReceptor");
    seccionReceptor.style.display = "none";
    document.getElementById("btnToggleReceptor").innerText = "+ Añadir datos cliente (Receptor)";

    document.getElementById("receptorNombre").value = "";
    document.getElementById("receptorDni").value = "";
    document.getElementById("receptorDireccion").value = "";
    document.getElementById("receptorCiudad").value = "";
    document.getElementById("receptorTelefono").value = "";
    document.getElementById("receptorEmail").value = "";

    contenedorConceptos.innerHTML = "";
    contenedorConceptos.appendChild(crearConcepto());

    const currentParams = new URLSearchParams(window.location.search);
    let modificado = false;

    if (currentParams.has("datos")) {
      currentParams.delete("datos");
      modificado = true;
    }
    if (currentParams.has("lote")) {
      currentParams.delete("lote");
      modificado = true;
    }

    if (modificado) {
      const nuevaUrl = window.location.pathname + "?" + currentParams.toString();
      window.history.replaceState({}, document.title, nuevaUrl);
    }
  }

  const btnLimpiar = document.getElementById("btnLimpiar");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      if (confirm("¿Seguro que quieres vaciar los datos del formulario?")) {
        limpiarFormulario();
      }
    });
  }

  document.getElementById("agregarConcepto").addEventListener("click", () => {
    document.getElementById("conceptosContainer").appendChild(crearConcepto());
  });

  document.getElementById("fechaHoy").addEventListener("click", () => {
    document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
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
        cantidad = parsearNumeroSeguro(cantidadInput.value.trim());
        if (cantidad <= 0) {
          mostrarError(`En el concepto #${index + 1}, introduce una cantidad válida mayor que 0.`);
          return;
        }
      } else {
        cantidad = parsearNumeroSeguro(selectCant.value);
      }

      const precioInput = c.querySelector(".precio").value.trim();
      const precio = parsearNumeroSeguro(precioInput);

      if (precioInput === "" || precio <= 0) {
        mostrarError(`En el concepto #${index + 1}, debes indicar un precio válido mayor que 0€.`);
        return;
      }

      conceptos.push({ descripcion, cantidad, precio });
    }

    const emisor = {
      negocio: urlParams.get("emisorNegocio") || "",
      nombre: urlParams.get("emisorNombre") || "",
      dni: urlParams.get("emisorDni") || "",
      dir: urlParams.get("emisorDir") || "",
      poblacion: urlParams.get("emisorPoblacion") || "",
      tel: urlParams.get("emisorTel") || "",
      email: urlParams.get("emisorEmail") || ""
    };

    const valIva = parsearNumeroSeguro(document.getElementById("porcentajeIva").value);
    const porcentajeIva = valIva >= 0 ? valIva : IVA_POR_DEFECTO;

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
    targetParams.delete("lote");

    window.location.href = `factura.html?${targetParams.toString()}`;
  });

  // Modal Calculadora IVA
  const modalCalc = document.getElementById("modalCalc");
  const btnAbrirCalc = document.getElementById("btnAbrirCalc");
  const btnCerrarCalc = document.getElementById("btnCerrarCalc");
  const calcPrecioInput = document.getElementById("calcPrecioTotal");
  const calcIvaInput = document.getElementById("calcPctIva");

  function calcularIvaRapido() {
    const total = parsearNumeroSeguro(calcPrecioInput.value);
    const pct = parsearNumeroSeguro(calcIvaInput.value) || IVA_POR_DEFECTO;

    const base = total / (1 + (pct / 100));
    const cuota = total - base;

    document.getElementById("calcBase").innerText = `${base.toFixed(2)} €`;
    document.getElementById("calcCuota").innerText = `${cuota.toFixed(2)} €`;
    document.getElementById("calcTotal").innerText = `${total.toFixed(2)} €`;
  }

  if (btnAbrirCalc && modalCalc) {
    btnAbrirCalc.addEventListener("click", () => {
      modalCalc.style.display = "flex";
      modalCalc.setAttribute("aria-hidden", "false");
      calcPrecioInput.focus();
    });

    const cerrarModal = () => {
      modalCalc.style.display = "none";
      modalCalc.setAttribute("aria-hidden", "true");
    };

    if (btnCerrarCalc) {
      btnCerrarCalc.addEventListener("click", cerrarModal);
      btnCerrarCalc.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") cerrarModal();
      });
    }

    window.addEventListener("click", (e) => {
      if (e.target === modalCalc) cerrarModal();
    });

    calcPrecioInput.addEventListener("input", calcularIvaRapido);
    calcIvaInput.addEventListener("input", calcularIvaRapido);
  }
});
