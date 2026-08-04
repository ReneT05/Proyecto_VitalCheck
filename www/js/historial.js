document.addEventListener('DOMContentLoaded', () => {

    if (!requireLogin()) return;


    const searchInput = document.getElementById('recordSearch');
    const list = document.getElementById('historyList');


    async function fetchRecords(query = '') {

        try {

            const response = await backendFetch(
                `data.php?q=${encodeURIComponent(query)}&limit=50&offset=0`
            );


            console.log("Respuesta status:", response.status);
            console.log("URL:", response.url);


            const result = await response.json();


            console.log("Datos historial:", result);



            if(!result.success){

                list.innerHTML = `
                <div class="record-card">
                    <strong>Error:</strong>
                    ${result.error}
                </div>`;

                return [];

            }


            return result.data || [];


        } catch(error){

            console.error("Error historial:", error);

            list.innerHTML = `
            <div class="record-card">
                Error cargando historial
            </div>`;

            return [];

        }

    }





    function renderHistory(records){


        list.innerHTML="";


        if(records.length===0){

            list.innerHTML=`
            <div class="record-card">
                <strong>No hay registros</strong>
            </div>`;

            return;

        }



        records.forEach(record=>{


            const card=document.createElement('article');


            card.className="record-card";



            let icon =
                record.tipo_registro === "Azúcar"
                ? "fa-droplet"
                : "fa-heart-pulse";



            let valor;



            if(record.tipo_registro==="Azúcar"){

                valor = `${record.value} mg/dL`;

            }else{

                valor = `${record.metric} mmHg`;

            }




            card.innerHTML=`

            <div class="record-icon">
                <i class="fas ${icon}"></i>
            </div>


            <div class="record-content">

                <strong>
                    ${valor}
                </strong>


                <div>
                    ${record.tipo_registro}
                </div>


                <small>
                    ${new Date(record.created_at)
                    .toLocaleString('es-MX')}
                </small>


            </div>

            `;


            list.appendChild(card);


        });


    }





    async function refresh(){

        const data = await fetchRecords(
            searchInput.value
        );

        renderHistory(data);

    }





    searchInput.addEventListener(
        "input",
        refresh
    );


    refresh();


});
