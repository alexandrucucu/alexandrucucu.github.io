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

    // 1. DATOS DEL EMISOR MAPPING CON TUS PARÁMETROS EXACTOS
    const emisor = factura.emisor || {};
    const negocio = emisor.negocio || urlParams.get("emisorNegocio") || "";
    const nombre = emisor.nombre || urlParams.get("emisorNombre") || "";
    const dni = emisor.dni || urlParams.get("emisorDni") || "";
    const dir = emisor.dir || urlParams.get("emisorDir") || "";
    const poblacion = emisor.poblacion || urlParams.get("emisorPoblacion") || "";
    const tel = emisor.tel || urlParams.get("emisorTel") || "";
    const email = emisor.email || urlParams.get("emisorEmail") || "";

    // Insertar en la vista HTML
    document.getElementById("nombreEmisor").innerText = negocio;
    document.getElementById("emisorNombre").innerHTML = nombre ? `<strong>${nombre}</strong>` : "";
    document.getElementById("emisorDni").innerText = dni;
    document.getElementById("emisorDireccion").innerText = dir;
    document.getElementById("emisorCiudad").innerText = poblacion;
    document.getElementById("emisorTelefono").innerText = tel;
    document.getElementById("emisorEmail").innerText = email;

    // 2. DATOS GENERALES DE LA FACTURA
    document.getElementById("numFactura").innerText = factura.numeroFactura || "";
    
    if (factura.fecha) {
      const partes = factura.fecha.split("-");
      if (partes.length === 3) {
        document.getElementById("fechaFactura").innerText = `${partes[2]}/${partes[1]}/${partes[0].slice(-2)}`;
      } else {
        document.getElementById("fechaFactura").innerText = factura.fecha;
      }
    }

    // 3. DATOS DEL RECEPTOR Y TIPO DE FACTURA
    const bloqueReceptor = document.getElementById("bloqueReceptor");
    const tipoFactura = document.getElementById("tipoFactura");
    const desgloseOrdinaria = document.getElementById("desgloseOrdinaria");
    const avisoIvaIncluido = document.getElementById("avisoIvaIncluido");

    const esOrdinaria = factura.receptor && factura.receptor.nombre;

    if (esOrdinaria) {
      tipoFactura.innerText = "Factura ordinaria";
      bloqueReceptor.style.display = "block";
      desgloseOrdinaria.style.display = "block";
      avisoIvaIncluido.style.display = "none";

      document.getElementById("receptorNombre").innerText = factura.receptor.nombre;
      document.getElementById("receptorDni").innerText = factura.receptor.dni || "";
      document.getElementById("receptorDireccion").innerText = factura.receptor.direccion || "";
      document.getElementById("receptorCiudad").innerText = factura.receptor.ciudad || "";
      document.getElementById("receptorTelefono").innerText = factura.receptor.telefono || "";
      document.getElementById("receptorEmail").innerText = factura.receptor.email || "";
    } else {
      tipoFactura.innerText = "Factura simplificada";
      bloqueReceptor.style.display = "none";
      desgloseOrdinaria.style.display = "none";
      avisoIvaIncluido.style.display = "block";
    }

    // 4. TABLA DE CONCEPTOS
    const tabla = document.getElementById("tablaConceptos");
    tabla.innerHTML = "";
    let sumaImportes = 0;

    factura.conceptos.forEach(c => {
      const importe = c.cantidad * c.precio;
      sumaImportes += importe;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align: left;">${c.descripcion}</td>
        <td>${c.cantidad}</td>
        <td>${c.precio.toFixed(2)}€</td>
        <td>${importe.toFixed(2)}€</td>
      `;
      tabla.appendChild(tr);
    });

    // 5. TOTALES E IVA
    if (esOrdinaria) {
      const pctIva = factura.porcentajeIva !== undefined ? factura.porcentajeIva : 21;
      const base = sumaImportes;
      const cuota = base * (pctIva / 100);
      const total = base + cuota;

      document.getElementById("lblIva").innerText = pctIva;
      document.getElementById("baseImponible").innerText = `${base.toFixed(2)}€`;
      document.getElementById("cuotaIva").innerText = `${cuota.toFixed(2)}€`;
      document.getElementById("totalFactura").innerText = `${total.toFixed(2)}€`;
    } else {
      document.getElementById("totalFactura").innerText = `${sumaImportes.toFixed(2)}€`;
    }

    // BOTONES DE NAVEGACIÓN
    document.getElementById("btnEditar").addEventListener("click", () => {
      window.location.href = `index.html?${urlParams.toString()}`;
    });

    document.getElementById("btnNueva").addEventListener("click", () => {
      // Mantiene intacta la URL original con los parámetros del emisor
      const paramsOriginales = new URLSearchParams(window.location.search);
      paramsOriginales.delete("datos");
      window.location.href = `index.html?${paramsOriginales.toString()}`;
    });

  } catch (e) {
    console.error("Error al procesar la factura:", e);
    alert("Error al cargar la factura.");
  }
});
