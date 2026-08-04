document.addEventListener('DOMContentLoaded', () => {

    if (!requireLogin()) return;

    const form = document.getElementById('pressureForm');
    const summary = document.getElementById('lastSummary');


    form.addEventListener('submit', async (event) => {

        event.preventDefault();


        const systolic = document
            .getElementById('systolicValue')
            .value.trim();

        const diastolic = document
            .getElementById('diastolicValue')
            .value.trim();

        const pulse = document
            .getElementById('pulseValue')
            .value.trim();



        if (!systolic || !diastolic || !pulse) {

            updateStatusBanner({
                status: 'yellow',
                title: 'Faltan datos',
                text: 'Completa todos los campos.'
            });

            return;
        }


        updateStatusBanner(
            evaluatePressure(systolic, diastolic)
        );



        const response = await backendFetch('data.php', {

            method: 'POST',

            body: JSON.stringify({

                tipo_registro: 'Presión',

                metric: `${systolic}/${diastolic}`,

                valor: Number(pulse)

            })

        });



        if (!response) {

            summary.textContent = "Error de conexión";

            return;

        }



        const text = await response.text();

        console.log("Respuesta PHP:", text);



        let result;

        try {

            result = JSON.parse(text);

        } catch(error) {

            summary.textContent = "Error del servidor";

            return;

        }




        if(result.success){

            summary.textContent =
                `Guardado: ${systolic}/${diastolic} mmHg · Pulso ${pulse}`;

            form.reset();


        }else{

            summary.textContent =
                `Error: ${result.error}`;

        }


    });

});