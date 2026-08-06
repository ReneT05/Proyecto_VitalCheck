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
            console.log("JWT guardado:", localStorage.getItem("jwt"));
            setCurrentUser(result.usuario);


            console.log(
                "JWT GUARDADO",
                result.jwt
            );
            console.log(
                "USUARIO",
                result.usuario
            );
            window.location.href =
                "inicio.html";
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
