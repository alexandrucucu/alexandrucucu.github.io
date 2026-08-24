document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const datosParam = urlParams.get("datos");

  if (!datosParam) {
    alert("No hay datos de factura para mostrar.");
    window.location.href = "index.html";
    return;
  }

  try {
    const factura = JSON.parse(datosParam);

    // 1. DATOS DEL EMISOR (Mapeo directo de tu URL)
    const emisor = factura.emisor || {};
    const negocio = emisor.negocio || urlParams.get("emisorNegocio") || "";
    const nombre = emisor.nombre || urlParams.get("emisorNombre") || "";
    const dni = emisor.dni || urlParams.get("emisorDni") || "";
    const dir = emisor.dir || urlParams.get("emisorDir") || "";
    const poblacion = emisor.poblacion || urlParams.get("emisorPoblacion") || "";
    const tel = emisor.tel || urlParams.get("emisorTel") || "";
    const email = emisor.email || urlParams.get("emisorEmail") || "";

    // Renderizar datos del emisor exactos a la segunda captura
    document.getElementById("nombreEmisor").innerText = negocio;
    
    const elNombre = document.getElementById("emisorNombre");
    if (elNombre) elNombre.innerHTML = nombre ? `<strong>${nombre}</strong>` : "";
    
    const elDni = document.getElementById("emisorDni");
    if (elDni) elDni.innerText = dni;
    
    const elDir = document.getElementById("emisorDireccion");
    if (elDir) elDir.innerText = dir;

    const elPoblacion = document.getElementById("emisorCiudad");
    if (elPoblacion) elPoblacion.innerText = poblacion;

    const elTel = document.getElementById("emisorTelefono");
    if (elTel) elTel.innerText = tel;

    const elEmail = document.getElementById("emisorEmail");
    if (elEmail) elEmail.innerText = email;

    // 2. DATOS GENERALES DE LA FACTURA
    const elNum = document.getElementById("numFactura");
    if (elNum) elNum.innerText = factura.numeroFactura || "";
    
    const elFecha = document.getElementById("fechaFactura");
    if (elFecha && factura.fecha) {
      const partes = factura.fecha.split("-");
      if (partes.length === 3) {
        // Formato DD-MM-YYYY idéntico a la segunda captura
        elFecha.innerText = `${partes[2]}-${partes[1]}-${partes[0]}`;
      } else {
        elFecha.innerText = factura.fecha;
      }
    }

    // 3. RECEPTOR Y TIPO DE FACTURA
    const bloqueReceptor = document.getElementById("bloqueReceptor");
    const tipoFactura = document.getElementById("tipoFactura");
    const desgloseOrdinaria = document.getElementById("desgloseOrdinaria");
    const avisoIvaIncluido = document.getElementById("avisoIvaIncluido");

    const esOrdinaria = factura.receptor && factura.receptor.nombre;

    if (esOrdinaria) {
      if (tipoFactura) tipoFactura.innerText = "Factura ordinaria";
      if (bloqueReceptor) bloqueReceptor.style.display = "block";
      if (desgloseOrdinaria) desgloseOrdinaria.style.display = "block";
      if (avisoIvaIncluido) avisoIvaIncluido.style.display = "none";

      document.getElementById("receptorNombre").innerText = factura.receptor.nombre;
      document.getElementById("receptorDni").innerText = factura.receptor.dni || "";
      document.getElementById("receptorDireccion").innerText = factura.receptor.direccion || "";
      document.getElementById("receptorCiudad").innerText = factura.receptor.ciudad || "";
      if (document.getElementById("receptorTelefono")) document.getElementById("receptorTelefono").innerText = factura.receptor.telefono || "";
      if (document.getElementById("receptorEmail")) document.getElementById("receptorEmail").innerText = factura.receptor.email || "";
    } else {
      if (tipoFactura) tipoFactura.innerText = "Factura simplificada";
      if (bloqueReceptor) bloqueReceptor.style.display = "none";
      if (desgloseOrdinaria) desgloseOrdinaria.style.display = "none";
      if (avisoIvaIncluido) avisoIvaIncluido.style.display = "block";
    }

    // 4. TABLA DE CONCEPTOS
    const tabla = document.getElementById("tablaConceptos");
    if (tabla) {
      tabla.innerHTML = "";
      let sumaImportes = 0;

      factura.conceptos.forEach(c => {
        const importe = c.cantidad * c.precio;
        sumaImportes += importe;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="text-align: left;">${c.descripcion}</td>
          <td>${c.cantidad}</td>
          <td>${c.precio}€</td>
          <td style="text-align: right;">${importe.toFixed(2)}€</td>
        `;
        tabla.appendChild(tr);
      });

      // 5. TOTALES E IVA
      if (esOrdinaria) {
        const pctIva = factura.porcentajeIva !== undefined ? factura.porcentajeIva : 21;
        const base = sumaImportes;
        const cuota = base * (pctIva / 100);
        const total = base + cuota;

        if (document.getElementById("lblIva")) document.getElementById("lblIva").innerText = pctIva;
        if (document.getElementById("baseImponible")) document.getElementById("baseImponible").innerText = `${base.toFixed(2)}€`;
        if (document.getElementById("cuotaIva")) document.getElementById("cuotaIva").innerText = `${cuota.toFixed(2)}€`;
        if (document.getElementById("totalFactura")) document.getElementById("totalFactura").innerText = `${total.toFixed(2)}€`;
      } else {
        if (document.getElementById("totalFactura")) document.getElementById("totalFactura").innerText = `${sumaImportes.toFixed(2)}€`;
      }
    }

    // BOTONES
    const btnEditar = document.getElementById("btnEditar");
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
        window.location.href = `index.html?${paramsOriginales.toString()}`;
      });
    }

  } catch (e) {
    console.error("Error al procesar la factura:", e);
    alert("Error al cargar la factura.");
  }
});
