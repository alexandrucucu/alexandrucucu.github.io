/**
 * FACTURA.JS - Renderizador seguro e impresor por lote
 * Formatea importes según la normativa oficial española (Intl.NumberFormat).
 */

const formateadorMoneda = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function escaparHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
          <td>${formateadorMoneda.format(precio)}</td>
          <td style="text-align: right;">${formateadorMoneda.format(importe)}</td>
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
      <p style="margin: 3px 0;">Base Imponible: <strong>${formateadorMoneda.format(base)}</strong></p>
      <p style="margin: 3px 0;">IVA (${pctIva}%): <strong>${formateadorMoneda.format(cuota)}</strong></p>
    </div>
    <div class="totalLineaH2">
      <span>Total factura:</span>
      <h2>${formateadorMoneda.format(total)}</h2>
    </div>
  ` : `
    <div class="totalLineaH2">
      <span>Total factura:</span>
      <h2>${formateadorMoneda.format(sumaImportes)}</h2>
    </div>
    <p style="margin-top: 5px; font-weight: bold;">IVA INCLUIDO</p>
  `;

  const bloqueReceptorHtml = esOrdinaria ? `
    <div class="bloque-datos">
      <span class="tituloBloque">DATOS DEL RECEPTOR</span>
      <p><strong>${escaparHtml(factura.receptor.nombre)}</strong></p>
      ${factura.receptor.dni ? `<p>${escaparHtml(factura.receptor.dni)}</p>` : ''}
      ${factura.receptor.direccion ? `<p>${escaparHtml(factura.receptor.direccion)}</p>` : ''}
      ${factura.receptor.ciudad ? `<p>${escaparHtml(factura.receptor.ciudad)}</p>` : ''}
      ${factura.receptor.telefono ? `<p>${escaparHtml(factura.receptor.telefono)}</p>` : ''}
      ${factura.receptor.email ? `<p>${escaparHtml(factura.receptor.email)}</p>` : ''}
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
  const contenedorLote = document.getElementById("contenedorLote");
  const btnEditar = document.getElementById("btnEditar");

  let listaFacturas = [];

  const loteStorage = sessionStorage.getItem("factura_lote");
  const activaStorage = sessionStorage.getItem("factura_activa");

  if (loteStorage) {
    try { listaFacturas = JSON.parse(loteStorage); } catch (e) { console.error(e); }
  } else if (activaStorage) {
    try { listaFacturas = [JSON.parse(activaStorage)]; } catch (e) { console.error(e); }
  } else {
    const datosParam = urlParams.get("datos");
    const loteParam = urlParams.get("lote");
    if (loteParam) {
      try { listaFacturas = JSON.parse(loteParam); } catch (e) { console.error(e); }
    } else if (datosParam) {
      try { listaFacturas = [JSON.parse(datosParam)]; } catch (e) { console.error(e); }
    }
  }

  if (listaFacturas.length === 0) {
    alert("No hay datos de factura para mostrar.");
    window.location.href = `index.html?${urlParams.toString()}`;
    return;
  }

  if (btnEditar) {
    btnEditar.style.display = listaFacturas.length > 1 ? "none" : "inline-block";
  }

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
      sessionStorage.removeItem("factura_activa");
      sessionStorage.removeItem("factura_lote");
      const paramsOriginales = new URLSearchParams(window.location.search);
      paramsOriginales.delete("datos");
      paramsOriginales.delete("lote");
      window.location.href = `index.html?${paramsOriginales.toString()}`;
    });
  }
});
