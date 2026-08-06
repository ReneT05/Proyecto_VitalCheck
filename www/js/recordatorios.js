function obtenerRecordatoriosFormulario() {
    return [
        {
            tipo: "azucar",
            momento: "manana",
            hora: document
                .getElementById("azucarManana")
                .value,
            activo: true
        },
        {
            tipo: "azucar",
            momento: "noche",
            hora: document
                .getElementById("azucarNoche")
                .value,
            activo: true
        },
        {
            tipo: "presion",
            momento: "manana",
            hora: document
                .getElementById("presionManana")
                .value,
            activo: true
        },
        {
            tipo: "presion",
            momento: "tarde",
            hora: document
                .getElementById("presionTarde")
                .value,
            activo: true
        },
        {
            tipo: "presion",
            momento: "noche",
            hora: document
                .getElementById("presionNoche")
                .value,
            activo: true
        }
    ];
}


function colocarHora(tipo, momento, hora) {
    const ids = {
        azucar_manana: "azucarManana",
        azucar_noche: "azucarNoche",
        presion_manana: "presionManana",
        presion_tarde: "presionTarde",
        presion_noche: "presionNoche"
    };

    const idCampo =
        ids[`${tipo}_${momento}`];

    if (!idCampo) {
        return;
    }

    const input =
        document.getElementById(idCampo);

    if (input && hora) {
        input.value = hora.substring(0, 5);
    }
}


async function cargarRecordatorios() {
    const mensaje =
        document.getElementById(
            "mensajeRecordatorios"
        );

    try {
        const response = await backendFetch(
            "recordatorios.php",
            {
                method: "GET"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error ||
                "No se pudieron cargar los horarios"
            );
        }

        result.data.forEach((recordatorio) => {
            colocarHora(
                recordatorio.tipo,
                recordatorio.momento,
                recordatorio.hora
            );
        });

    } catch (error) {
        console.error(
            "Error cargando recordatorios:",
            error
        );

        mensaje.textContent =
            "No se pudieron cargar los horarios guardados.";
    }
}


async function guardarRecordatorios(event) {
    event.preventDefault();

    const mensaje =
        document.getElementById(
            "mensajeRecordatorios"
        );

    const boton =
        document.getElementById("saveButton");

    mensaje.textContent = "Guardando...";
    boton.disabled = true;

    try {
        const recordatorios =
            obtenerRecordatoriosFormulario();

        const hayHorasVacias =
            recordatorios.some(
                recordatorio => !recordatorio.hora
            );

        if (hayHorasVacias) {
            throw new Error(
                "Selecciona todos los horarios"
            );
        }

        const response = await backendFetch(
            "recordatorios.php",
            {
                method: "POST",
                body: JSON.stringify({
                    recordatorios
                })
            }
        );

        const texto = await response.text();

        let result;

        try {
            result = JSON.parse(texto);
        } catch {
            throw new Error(
                "El servidor no devolvió JSON: " +
                texto
            );
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.error ||
                "No se pudieron guardar los horarios"
            );
        }

        mensaje.textContent =
            "Horarios guardados correctamente.";

    } catch (error) {
        console.error(
            "Error guardando recordatorios:",
            error
        );

        mensaje.textContent =
            error.message ||
            "No se pudieron guardar los horarios.";

    } finally {
        boton.disabled = false;
    }
}


function iniciarRecordatorios() {
    if (!requireLogin()) {
        return;
    }

    const formulario =
        document.getElementById(
            "recordatoriosForm"
        );

    if (!formulario) {
        console.error(
            "No existe recordatoriosForm"
        );

        return;
    }

    formulario.addEventListener(
        "submit",
        guardarRecordatorios
    );

    cargarRecordatorios();
}


document.addEventListener(
    "DOMContentLoaded",
    iniciarRecordatorios
);