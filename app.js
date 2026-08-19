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
  `;

  const select = div.querySelector(".descripcion");
  const otroInput = div.querySelector(".otroConcepto");

  select.addEventListener("change", () => {
    if (select.value === "Otro") {
      otroInput.style.display = "block";
    } else {
      otroInput.style.display = "none";
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
    const precio = parseFloat(c.querySelector(".precio").value) || 0;

    conceptos.push({
      descripcion,
      cantidad,
      precio
    });
  });

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