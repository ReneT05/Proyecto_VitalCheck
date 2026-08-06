function initLogin() {

    if (window.loginInicializado) return;
    window.loginInicializado = true;


    if (getAppToken()) {
        window.location.href = "inicio.html";
        return;
    }


    const form = document.getElementById("loginForm");
    const errorMessage = document.getElementById("loginError");


    if (!form) {
        console.error("No existe loginForm");
        return;
    }



    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        errorMessage.textContent = "";


        const username =
            document.getElementById("usernameInput")
            .value.trim();


        const password =
            document.getElementById("passwordInput")
            .value.trim();


        const pin =
            document.getElementById("pinInput")
            .value.trim();



        let payload;



        if (username && password) {

            payload = {
                accion: "login",
                usuario: username,
                contrasena: password
            };


        } else if (pin) {


            payload = {
                accion: "login",
                pin: pin
            };


        } else {


            errorMessage.textContent =
                "Ingresa usuario y contraseña o PIN.";

            return;
        }



        console.log(
            "LOGIN ENVIADO:",
            payload
        );



        try {


            const response = await backendFetch(
                "usuarios.php",
                {
                    method:"POST",
                    body:JSON.stringify(payload)
                }
            );


            const result =
                await response.json();



            console.log(
                "RESPUESTA LOGIN:",
                result
            );



            if (!response.ok || !result.success) {


                errorMessage.textContent =
                    result.error || "Error login";

                return;

            }



            if (!result.jwt) {

                console.error(
                    "No llegó JWT"
                );

                return;
            }



            // ==========================
            // GUARDAR JWT
            // ==========================


            setAppToken(result.jwt);

            setCurrentUser(result.usuario);



            console.log(
                "JWT GUARDADO",
                result.jwt
            );



            console.log(
                "USUARIO",
                result.usuario
            );




            // ==========================
            // FIREBASE TOKEN
            // ==========================


            guardarFirebaseToken(
                result.usuario.id_usuario
            );



        } catch(error){


            console.error(
                "ERROR LOGIN:",
                error
            );


            errorMessage.textContent =
                "Error conectando servidor.";

        }


    });


}





function guardarFirebaseToken(idUsuario){


    if (!window.FirebasePlugin) {


        console.log(
            "Firebase no disponible (navegador)"
        );


        window.location.href =
            "inicio.html";

        return;

    }



    console.log(
        "Firebase disponible"
    );



    FirebasePlugin.grantPermission(
        
        function(){


            console.log(
                "Permiso Firebase aceptado"
            );



            FirebasePlugin.getToken(


                async function(firebaseToken){


                    console.log(
                        "TOKEN FIREBASE:",
                        firebaseToken
                    );



                    try{


                        const response =
                            await backendFetch(

                            `usuarios.php?id=${idUsuario}`,

                            {

                                method:"PUT",

                                body:JSON.stringify({

                                    firebase_token:
                                        firebaseToken

                                })

                            }

                        );



                        console.log(
                            "RESPUESTA STATUS:",
                            response.status
                        );



                        const result =
                            await response.json();



                        console.log(
                            "RESPUESTA GUARDAR TOKEN:",
                            result
                        );



                        if (!result.success) {
                            console.error(
                                "Error guardando token:",
                                result.error
                            );
                        } else {
                            console.log(
                                "✓ Token guardado correctamente en BD"
                            );
                        }


                    }catch(error){


                        console.error(
                            "ERROR GUARDANDO TOKEN:",
                            error
                        );

                    }



                    window.location.href =
                        "inicio.html";



                },


                function(error){


                    console.error(
                        "ERROR TOKEN FIREBASE:",
                        error
                    );


                    window.location.href =
                        "inicio.html";

                }


            );



        },


        function(error){


            console.error(
                "ERROR PERMISO FIREBASE:",
                error
            );


            window.location.href =
                "inicio.html";


        }

    );

}







// ===============================
// NAVEGADOR
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    initLogin
);



// ===============================
// APK CORDOVA
// ===============================

document.addEventListener(
    "deviceready",
    function(){

        console.log(
            "CORDOVA LISTO"
        );

        initLogin();

    }
);