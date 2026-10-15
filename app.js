/**
 * APP.JS - Lógica de control del formulario de facturación
 * Soporta importación CSV extensible (Simplificadas y Ordinarias), estadísticas e IVA.
 */

const IVA_POR_DEFECTO = 21;
const CONCEPTOS_PREDEFINIDOS = ["Piercing", "Tatuaje", "Joyería"];

/**
 * Formateador oficial de moneda para España (EUR).
 */
const formateadorMoneda = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Crea la estructura HTML para una fila de concepto/servicio.
 * @param {Object|null} datos - Datos opcionales para rellenar.
 * @returns {HTMLElement}
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

function ocultarError() {
  const divError = document.getElementById("mensajeError");
  if (divError) {
    divError.style.display = "none";
    divError.innerText = "";
  }
}

function parsearNumeroSeguro(val) {
  if (!val) return 0;
  const numSanitizado = val.toString().trim().replace(/^"|"$/g, '').replace(",", ".");
  const num = parseFloat(numSanitizado);
  return isNaN(num) ? 0 : num;
}

function dividirLineaCsv(linea) {
  let partes = [];
  if (linea.includes(";")) partes = linea.split(";");
  else if (linea.includes("\t")) partes = linea.split("\t");
  else partes = linea.split(",");

  return partes.map(p => p.trim().replace(/^"|"$/g, ''));
}

/**
 * Parser de CSV extensible a Facturas Simplificadas y Ordinarias (con cliente).
 * Esquema: Nº; Fecha; Concepto; Cantidad; Precio; [% IVA]; [NombreCliente]; [DNI]; [Dirección]; [Ciudad]; [Tel]; [Email]
 * @param {string} textoCsv 
 * @returns {Array<Object>|null}
 */
function parsearCsvLoteConValidaciones(textoCsv) {
  const lineas = textoCsv.split(/\r?\n/).filter(l => l.trim().length > 0);
  const facturasMap = new Map();

  for (let i = 0; i < lineas.length; i++) {
    const partes = dividirLineaCsv(lineas[i]);

    if (partes.length >= 5) {
      const numFactura = partes[0];

      // Omitir encabezados
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

      // Lectura opcional de cliente para Facturas Ordinarias desde CSV (Columna 6 en adelante)
      let receptor = null;
      if (partes.length >= 7 && partes[6] && partes[6].trim() !== "") {
        receptor = {
          nombre: partes[6].trim(),
          dni: partes[7] ? partes[7].trim() : "",
          direccion: partes[8] ? partes[8].trim() : "",
          ciudad: partes[9] ? partes[9].trim() : "",
          telefono: partes[10] ? partes[10].trim() : "",
          email: partes[11] ? partes[11].trim() : ""
        };
      }

      if (!facturasMap.has(numFactura)) {
        facturasMap.set(numFactura, {
          numeroFactura: numFactura,
          fecha: fechaIso,
          fechaIso: fechaIso,
          desglosarIva: tieneIvaEstaFila || Boolean(receptor),
          porcentajeIva: pctIvaFila,
          receptor: receptor,
          conceptos: []
        });
      }

      const facActual = facturasMap.get(numFactura);

      // Validaciones de consistencia
      if (facActual.fechaIso !== fechaIso) {
        mostrarError(`Incoherencia en CSV: La factura ${numFactura} contiene fechas distintas.`);
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
    mostrarError("Formato CSV no válido. Columnas esperadas separadas por ';': Nº; Fecha; Concepto; Cantidad; Precio; [% IVA]");
    return null;
  }

  return resultado;
}

/**
 * Calcula y renderiza el resumen analítico e impuestos del lote CSV.
 * Desglosa siempre Total, Base Imponible y Cuota de IVA suponiendo IVA incluido.
 * @param {Array<Object>} lote 
 */
function calcularYMostrarEstadisticas(lote) {
  let totalFacturado = 0;
  let totalBaseAcumulada = 0;
  let totalCuotaIvaAcumulada = 0;
  let totalServiciosCount = 0;

  const mesesMap = {};
  const categoriasMap = {};

  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  lote.forEach(f => {
    let subtotalFactura = 0;
    const pctIva = f.porcentajeIva !== undefined && f.porcentajeIva >= 0 ? f.porcentajeIva : IVA_POR_DEFECTO;

    f.conceptos.forEach(c => {
      const imp = c.cantidad * c.precio;
      subtotalFactura += imp;
      totalServiciosCount += c.cantidad;

      let cat = c.descripcion.trim();
      const catLower = cat.toLowerCase();
      if (catLower.includes("tatuaje") || catLower.includes("tattoo")) cat = "Tatuaje";
      else if (catLower.includes("piercing")) cat = "Piercing";
      else if (catLower.includes("joya") || catLower.includes("joyería")) cat = "Joyería";

      if (!categoriasMap[cat]) categoriasMap[cat] = { importe: 0, cantidad: 0 };
      categoriasMap[cat].importe += imp;
      categoriasMap[cat].cantidad += c.cantidad;
    });

    totalFacturado += subtotalFactura;

    // Desglose de IVA siempre incluido en el precio cobrado
    const baseFactura = subtotalFactura / (1 + (pctIva / 100));
    const cuotaFactura = subtotalFactura - baseFactura;

    totalBaseAcumulada += baseFactura;
    totalCuotaIvaAcumulada += cuotaFactura;

    if (f.fechaIso && f.fechaIso.includes("-")) {
      const [year, month] = f.fechaIso.split("-");
      const keyMes = `${year}-${month}`;
      const nombreMes = `${nombresMeses[parseInt(month, 10) - 1]} ${year}`;

      if (!mesesMap[keyMes]) mesesMap[keyMes] = { nombre: nombreMes, importe: 0, count: 0 };
      mesesMap[keyMes].importe += subtotalFactura;
      mesesMap[keyMes].count += 1;
    }
  });

  let html = `
    <div style="font-family: Arial, sans-serif;">
      <!-- Tarjetas Principales -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div style="background: #f1f8f3; padding: 10px; border-radius: 6px; border: 1px solid #c8e6c9; text-align: center;">
          <span style="font-size: 11px; color: #2e7d32; font-weight: bold; text-transform: uppercase;">Total Facturado (IVA incl.)</span>
          <div style="font-size: 18px; font-weight: bold; color: #1b5e20; margin-top: 2px;">${formateadorMoneda.format(totalFacturado)}</div>
        </div>
        <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
          <span style="font-size: 11px; color: #4b5563; font-weight: bold; text-transform: uppercase;">Facturas / Servicios</span>
          <div style="font-size: 18px; font-weight: bold; color: #111827; margin-top: 2px;">${lote.length} <span style="font-size: 12px; font-weight: normal;">(${totalServiciosCount} serv.)</span></div>
        </div>
      </div>

      <!-- Resumen Desglosado de Impuestos (Base + IVA) -->
      <div style="background: #fdffe0; padding: 10px 12px; border-radius: 6px; border: 1px solid #f0e68c; margin-bottom: 12px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Base Imponible Acumulada:</span>
          <strong>${formateadorMoneda.format(totalBaseAcumulada)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Cuota de IVA Acumulada:</span>
          <strong>${formateadorMoneda.format(totalCuotaIvaAcumulada)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed #d4c851; padding-top: 4px; margin-top: 4px;">
          <span><strong>Total Final:</strong></span>
          <strong style="color: #27ae60;">${formateadorMoneda.format(totalFacturado)}</strong>
        </div>
      </div>

      <h4 style="margin: 10px 0 6px 0; font-size: 13px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 3px;">📅 Evolución por Meses</h4>
      <div style="margin-bottom: 12px;">
  `;

  Object.keys(mesesMap).sort().forEach(k => {
    const m = mesesMap[k];
    html += `
      <div class="calc-fila" style="font-size: 12px; margin-bottom: 4px;">
        <span><strong>${m.nombre}</strong> (${m.count} fac.)</span>
        <strong>${formateadorMoneda.format(m.importe)}</strong>
      </div>
    `;
  });

  html += `
      </div>
      <h4 style="margin: 10px 0 6px 0; font-size: 13px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 3px;">🎨 Reparto por Categorías</h4>
      <div>
  `;

  Object.keys(categoriasMap).forEach(cat => {
    const c = categoriasMap[cat];
    const pct = totalFacturado > 0 ? ((c.importe / totalFacturado) * 100).toFixed(1) : 0;
    html += `
      <div class="calc-fila" style="font-size: 12px; margin-bottom: 4px;">
        <span><strong>${cat}</strong> (${c.cantidad} uds. - ${pct}%)</span>
        <strong>${formateadorMoneda.format(c.importe)}</strong>
      </div>
    `;
  });

  html += `</div></div>`;

  const contenedorStats = document.getElementById("contenidoStats");
  if (contenedorStats) contenedorStats.innerHTML = html;

  const modalStats = document.getElementById("modalStats");
  if (modalStats) {
    modalStats.style.display = "flex";
    modalStats.setAttribute("aria-hidden", "false");
  }
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

  // Rehidratación inteligente
  let datosGuardados = sessionStorage.getItem("factura_activa");
  if (!datosGuardados) {
    datosGuardados = urlParams.get("datos");
  }

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
  const btnEstadisticasCsv = document.getElementById("btnEstadisticasCsv");
  const inputCsv = document.getElementById("inputCsv");

  if (btnToggleCsv && bloqueCsv) {
    btnToggleCsv.addEventListener("click", () => {
      bloqueCsv.style.display = bloqueCsv.style.display === "none" ? "block" : "none";
      if (bloqueCsv.style.display === "block") inputCsv.focus();
    });

    if (btnEstadisticasCsv) {
      btnEstadisticasCsv.addEventListener("click", () => {
        ocultarError();
        const textoCsv = inputCsv.value.trim();
        if (!textoCsv) {
          mostrarError("Pega primero unas líneas CSV para calcular las estadísticas.");
          return;
        }

        const lote = parsearCsvLoteConValidaciones(textoCsv);
        if (!lote) return;

        calcularYMostrarEstadisticas(lote);
      });
    }

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

      if (primera.receptor) {
        seccionReceptor.style.display = "block";
        btnToggleReceptor.innerText = "- Quitar datos cliente (Receptor)";
        chkDesglose.checked = true;
        chkDesglose.disabled = true;

        document.getElementById("receptorNombre").value = primera.receptor.nombre || "";
        document.getElementById("receptorDni").value = primera.receptor.dni || "";
        document.getElementById("receptorDireccion").value = primera.receptor.direccion || "";
        document.getElementById("receptorCiudad").value = primera.receptor.ciudad || "";
        document.getElementById("receptorTelefono").value = primera.receptor.telefono || "";
        document.getElementById("receptorEmail").value = primera.receptor.email || "";
      } else {
        seccionReceptor.style.display = "none";
        btnToggleReceptor.innerText = "+ Añadir datos cliente (Receptor)";
        chkDesglose.disabled = false;
      }

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

        sessionStorage.setItem("factura_lote", JSON.stringify(lote));
        sessionStorage.removeItem("factura_activa");

        const targetParams = new URLSearchParams(window.location.search);
        targetParams.delete("datos");
        targetParams.delete("lote");

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

    sessionStorage.removeItem("factura_activa");
    sessionStorage.removeItem("factura_lote");

    const currentParams = new URLSearchParams(window.location.search);
    let modificado = false;

    if (currentParams.has("datos")) { currentParams.delete("datos"); modificado = true; }
    if (currentParams.has("lote")) { currentParams.delete("lote"); modificado = true; }

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

    sessionStorage.setItem("factura_activa", JSON.stringify(factura));
    sessionStorage.removeItem("factura_lote");

    const targetParams = new URLSearchParams(window.location.search);
    targetParams.delete("datos");
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

    document.getElementById("calcBase").innerText = formateadorMoneda.format(base);
    document.getElementById("calcCuota").innerText = formateadorMoneda.format(cuota);
    document.getElementById("calcTotal").innerText = formateadorMoneda.format(total);
  }

  if (btnAbrirCalc && modalCalc) {
    btnAbrirCalc.addEventListener("click", () => {
      modalCalc.style.display = "flex";
      modalCalc.setAttribute("aria-hidden", "false");
      calcPrecioInput.focus();
    });

    const cerrarModalCalc = () => {
      modalCalc.style.display = "none";
      modalCalc.setAttribute("aria-hidden", "true");
    };

    if (btnCerrarCalc) {
      btnCerrarCalc.addEventListener("click", cerrarModalCalc);
      btnCerrarCalc.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") cerrarModalCalc();
      });
    }

    window.addEventListener("click", (e) => {
      if (e.target === modalCalc) cerrarModalCalc();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalCalc.style.display === "flex") {
        cerrarModalCalc();
      }
    });

    calcPrecioInput.addEventListener("input", calcularIvaRapido);
    calcIvaInput.addEventListener("input", calcularIvaRapido);
  }

  // Modal Estadísticas
  const modalStats = document.getElementById("modalStats");
  const btnCerrarStats = document.getElementById("btnCerrarStats");

  if (modalStats && btnCerrarStats) {
    const cerrarModalStats = () => {
      modalStats.style.display = "none";
      modalStats.setAttribute("aria-hidden", "true");
    };

    btnCerrarStats.addEventListener("click", cerrarModalStats);
    btnCerrarStats.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") cerrarModalStats();
    });

    window.addEventListener("click", (e) => {
      if (e.target === modalStats) cerrarModalStats();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalStats.style.display === "flex") {
        cerrarModalStats();
      }
    });
  }
});
