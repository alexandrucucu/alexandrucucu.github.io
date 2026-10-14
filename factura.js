/**
 * FACTURA.JS - Renderizador seguro e impresor por lote
 */

/**
 * Escapa caracteres especiales de HTML para prevenir inyecciones XSS.
 * @param {string} str 
 * @returns {string}
 */
function escaparHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Genera el marcado HTML de un ticket/factura saneado.
 * @param {Object} factura 
 * @param {URLSearchParams} urlParams 
 * @returns {string} HTML seguro.
 */
function generarHtmlFactura(factura, urlParams) {
  const emisor = factura.emisor || {};
  const negocio = emisor.negocio || urlParams.get("emisorNegocio") || "";
  const nombre = emisor.nombre || urlParams.get("emisorNombre") || "";
  const dni = emisor.dni || urlParams.get("emisorDni") || "";
  const dir = emisor.dir || urlParams.get("emisorDir") || "";
  const poblacion = emisor.poblacion || urlParams.get("emisorPoblacion") || "";
  const tel = emisor.tel || urlParams.get("emisorTel") || "";
  const email = emisor.email || urlParams.get("emisorEmail") || "";

  const esOrdinaria = Boolean(factura.receptor && factura.receptor.nombre);
  
  const rawFecha = factura.fecha || factura.fechaIso || "-";
  let fechaFormateada = rawFecha;

  if (rawFecha && rawFecha.includes("-")) {
    const partes = rawFecha.split("-");
    if (partes.length === 3) fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  let filasConceptosHtml = "";
  let sumaImportes = 0;

  if (factura.conceptos && Array.isArray(factura.conceptos)) {
    factura.conceptos.forEach(c => {
      const cant = parseFloat(c.cantidad) || 0;
      const precio = parseFloat(c.precio) || 0;
      const importe = cant * precio;
      sumaImportes += importe;

      filasConceptosHtml += `
        <tr>
          <td style="text-align: left;">${escaparHtml(c.descripcion)}</td>
          <td>${cant}</td>
          <td>${precio.toFixed(2)}€</td>
          <td style="text-align: right;">${importe.toFixed(2)}€</td>
        </tr>
      `;
    });
  }

  const debeDesglosar = factura.desglosarIva || esOrdinaria;
  const pctIva = factura.porcentajeIva !== undefined ? parseFloat(factura.porcentajeIva) : 21;
  const total = sumaImportes;
  const base = total / (1 + (pctIva / 100));
  const cuota = total - base;

  const bloqueTotalesHtml = debeDesglosar ? `
    <div>
      <p style="margin: 3px 0;">Base Imponible: <strong>${base.toFixed(2)}€</strong></p>
      <p style="margin: 3px 0;">IVA (${pctIva}%): <strong>${cuota.toFixed(2)}€</strong></p>
    </div>
    <div class="totalLineaH2">
      <span>Total factura:</span>
      <h2>${total.toFixed(2)}€</h2>
    </div>
  ` : `
    <div class="totalLineaH2">
      <span>Total factura:</span>
      <h2>${sumaImportes.toFixed(2)}€</h2>
    </div>
    <p style="margin-top: 5px; font-weight: bold;">IVA INCLUIDO</p>
  `;

  const bloqueReceptorHtml = esOrdinaria ? `
    <div class="bloque-datos">
      <span class="tituloBloque">DATOS DEL RECEPTOR</span>
      <p><strong>${escaparHtml(factura.receptor.nombre)}</strong></p>
      <p>${escaparHtml(factura.receptor.dni)}</p>
      <p>${escaparHtml(factura.receptor.direccion)}</p>
      <p>${escaparHtml(factura.receptor.ciudad)}</p>
      <p>${escaparHtml(factura.receptor.telefono)}</p>
      <p>${escaparHtml(factura.receptor.email)}</p>
    </div>
  ` : '';

  return `
    <article class="ticket pagina-factura">
      <h1>${esOrdinaria ? 'Factura ordinaria' : 'Factura simplificada'}</h1>
      <h2>${escaparHtml(negocio)}</h2>

      <div class="bloque-personas">
        <div class="bloque-datos">
          <span class="tituloBloque">DATOS DEL EMISOR</span>
          <p><strong>${escaparHtml(nombre)}</strong></p>
          <p>${escaparHtml(dni)}</p>
          <p>${escaparHtml(dir)}</p>
          <p>${escaparHtml(poblacion)}</p>
          <p>${escaparHtml(tel)}</p>
          <p>${escaparHtml(email)}</p>
        </div>
        ${bloqueReceptorHtml}
      </div>

      <div class="datosFactura">
        <p><span class="etiquetaFondo">Número de factura:</span> <strong>${escaparHtml(factura.numeroFactura)}</strong></p>
        <p><span class="etiquetaFondo">Fecha:</span> <strong>${escaparHtml(fechaFormateada)}</strong></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Concepto/Descripción</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          ${filasConceptosHtml}
        </tbody>
      </table>

      <div class="total">
        ${bloqueTotalesHtml}
      </div>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const datosParam = urlParams.get("datos");
  const loteParam = urlParams.get("lote");
  const contenedorLote = document.getElementById("contenedorLote");
  const btnEditar = document.getElementById("btnEditar");

  let listaFacturas = [];

  if (loteParam) {
    try {
      listaFacturas = JSON.parse(loteParam);
    } catch (e) { console.error(e); }
  } else if (datosParam) {
    try {
      listaFacturas = [JSON.parse(datosParam)];
    } catch (e) { console.error(e); }
  }

  if (listaFacturas.length === 0) {
    alert("No hay datos de factura para mostrar.");
    window.location.href = "index.html";
    return;
  }

  // Ocultar Modificar en lotes
  if (btnEditar) {
    btnEditar.style.display = listaFacturas.length > 1 ? "none" : "inline-block";
  }

  // Título inteligente para la exportación PDF
  if (listaFacturas.length === 1) {
    document.title = `Factura_${listaFacturas[0].numeroFactura}`;
  } else {
    const primerNum = listaFacturas[0].numeroFactura;
    const ultimoNum = listaFacturas[listaFacturas.length - 1].numeroFactura;
    document.title = `Facturas_${primerNum}_a_${ultimoNum}`;
  }

  contenedorLote.innerHTML = listaFacturas.map(f => generarHtmlFactura(f, urlParams)).join("");

  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      window.location.href = `index.html?${urlParams.toString()}`;
    });
  }

  const btnNueva = document.getElementById("btnNueva");
  if (btnNueva) {
    btnNueva.addEventListener("click", () => {
      const paramsOriginales = new URLSearchParams(window.location.search);
      paramsOriginales.delete("datos");
      paramsOriginales.delete("lote");
      window.location.href = `index.html?${paramsOriginales.toString()}`;
    });
  }
});
