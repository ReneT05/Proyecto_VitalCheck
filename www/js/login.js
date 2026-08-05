document.addEventListener('DOMContentLoaded', () => {

    if (getAppToken()) {
        window.location.href = 'inicio.html';
        return;
    }


    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginError');


    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        errorMessage.textContent = "";


        const username = document
            .getElementById('usernameInput')
            .value
            .trim();


        const password = document
            .getElementById('passwordInput')
            .value
            .trim();


        const pin = document
            .getElementById('pinInput')
            .value
            .trim();



        let payload = {};



        if(username && password){

            payload = {
                accion: "login",
                usuario: username,
                contrasena: password
            };

        }
        else if(pin){

            payload = {
                accion: "login",
                pin: pin
            };

        }
        else{

            errorMessage.textContent =
            "Ingresa usuario/contraseña o PIN.";

            return;
        }




        try {


            const response = await backendFetch(
                'usuarios.php',
                {
                    method:'POST',
                    body:JSON.stringify(payload)
                }
            );



            const text = await response.text();

            console.log("Respuesta PHP:", text);



            let result;

            try{

                result = JSON.parse(text);

            }catch(e){

                errorMessage.textContent =
                "Respuesta inválida del servidor";

                return;

            }



            console.log("Resultado login:", result);



            if(!response.ok || !result.success){

                errorMessage.textContent =
                result.error || "Datos incorrectos";

                return;

            }



            // GUARDAR SESIÓN

            const token = result.jwt;
            if (!token) {
                errorMessage.textContent =
                    "JWT no recibido del servidor.";
                return;
            }

            setAppToken(token);
            setCurrentUser(result.usuario);



            console.log(
                "Usuario guardado:",
                localStorage.getItem('vital_user')
            );



            window.location.href='inicio.html';



        }catch(error){

            console.error(error);

            errorMessage.textContent =
            "Error conectando con el servidor.";

        }


    });


});