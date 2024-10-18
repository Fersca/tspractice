
//De esta forma se importa un file y sus funciones y clases
import { User } from "./User.ts";

//de esta forma se exporta una función para que pueda ser usada en otros archivos
export {printUser}

//objeto para enviar desde el server mensahes a los clientes
let globalSocket: WebSocket | null = null;

//con esta condición se ejecuta el código solo si se ejecuta el archivo directamente
if (import.meta.main) {

  //Llama a una URL de ejemplo y muestra los datos
  const response = await fetch("https://api.mercadolibre.com/users/20");
  console.log(response.status);     // e.g. 200
  console.log(response.statusText); // e.g. "OK"

  //obtiene el json del request
  const jsonData = await response.json();

  //crea un objeto usuario en base a los datos del json
  const user = new User(jsonData.id, jsonData.nickname, jsonData.country_id, jsonData.address.state);
  
  //llamo al método saludar
  user.saludar();

  //crear un array de usuarios. Agrego al usuario al array
  const users: User[] = [];
  //const users2: Array<User> = []; esta es otra forma de hacerlo.
  users.push(user);

  //Hago 2 clones del objeto usuario. Ccambio el nickname y lo agrego al array
  const user2 = new User(user.id, user.nickname, user.getCountryId(), user.getAddress());
  const user3 = new User(user.id, user.nickname, user.getCountryId(), user.getAddress());
  user2.nickname = "Nuevo Nickname 2";
  user3.nickname = "Nickname 3";
  users.push(user2);
  users.push(user3);

  //Recorro el arrray y proceso cada usuario, con un if para mostrar la sintaxis
  for (const user of users) {
      //si el nickname del usaurio contiene la palabra "Nuevo" lo imprime
      if (user.nickname.includes("Nuevo")) {
        printUser(user);
      }
  }

  //obtiene el úlitmo usuario del array
  const lastUser = users[users.length - 1];

  //guarda el ultimo usuario en un archivo
  saveUser(lastUser);

  //crea un mapa en donde guardar los usuarios poniendo como clave un nombre
  const userMap = new Map<string, User>();
  userMap.set(user.nickname, user);
  userMap.set(user2.nickname, user2);
  userMap.set(user3.nickname, user3);

  console.log(`*** ID del Proceso: ${getSystemPID()} ***`);

  //recorre el mapa y muestra los datos de los usuarios
  //si se usa guin bajo es que no se va a usar la variable
  for (const [_key, value] of userMap) {
      printUser(value);
  }
  

  //ejenplo de print en consola
  console.log("Iniciando Deno server");

  //Crea el servidor que recibe peticiones en un puerto y llama a la función handler
  Deno.serve({port: 8080}, handler);
 
  //leer texto de la consola
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const text = decoder.decode(chunk);
    sendMessageFromTerminal(text)
  }  

}

function getSystemPID(): number{

  // Ruta al estándar de la biblioteca C en macOS
  const libcPath = "/usr/lib/libc.dylib";

  // Define las funciones que vas a usar desde la biblioteca
  const libc = Deno.dlopen(libcPath, {
    "getpid": { parameters: [], result: "i32" },
  });

  // Llama a la función getpid
  const pid = libc.symbols.getpid();

  // Cierra la biblioteca cuando ya no la necesitas
  libc.close();

  return pid;

}


//Funcion que maneja las solicitudes
function handler(req: Request): Response {

    //obtiene el pathname
    const { pathname } = new URL(req.url);

    //si el path es /we y viene con el header upgrade en "websoket" es una solicitud de websocket
    if (pathname === "/ws" && req.headers.get("upgrade") === "websocket") {

      //se hace el upgrade del protocolo
      const { socket, response } = Deno.upgradeWebSocket(req);

      // Asignar el socket a la variable global
      globalSocket = socket;

      socket.onopen = () => {
        console.log("WebSocket connection opened");
        socket.send("<<< Bienvenido!");
      };
  
      socket.onmessage = (event) => {
        console.log("Message from client: ", event.data);
        // Responder al mensaje recibido
        socket.send(`${event.data}`);
      };
  
      socket.onerror = (event) => {
        console.error("WebSocket error:", event);
      };
  
      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
  
      return response;
      
    }

    //Imprime en consola la solicitud
    console.log("Method:", req.method);
  
    //Imprime en consola la URL
    const url = new URL(req.url);
    console.log("Path:", url.pathname);
    console.log("Query parameters:", url.searchParams);
    console.log("Headers:", req.headers);
  
    //Imprime en consola el cuerpo de la solicitud
    if (req.body) {
      const body = req.text();
      console.log("Body:", body);
    }
  
    //crea un objeto json para responder los headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    //crea el json del mensaje
    const jsonResp = JSON.stringify({ message: "Hello, Deno!" });

    //crea un json para pasarle a la respuesta
    const respHttp = {
      status: 200,
      headers,
    }

    //crea un response con el json y los headers
    const resp = new Response(jsonResp, respHttp); 

    //devuelve el objeto response
    return resp;

  }

// Ejemplo de cómo enviar un mensaje desde la terminal
function sendMessageFromTerminal(message: string) {
  if (globalSocket) {
    globalSocket.send(">>> "+message);
    console.log("Mensaje enviado:", message);
  } else {
    console.log("No hay conexión WebSocket abierta.");
  }
}

function printUser(user: User) {

  //ejemplo de como con la comita se pueden hacer textos de varias lineas, usando la comilla simple
  const linea = `
--------------------------------
--------------------------------
  `;

  //imprime en pantalla los datos del usuario
  console.log(linea);
  console.log("Usuario ID:", user.id);
  console.log("Nickname:", user.nickname);
  console.log("Country ID:", user.getCountryId());
  console.log("Address:", user.getAddress());
  
}

/*
Esta función recibe un objeti del tipo Usuario y crea un archivo en el disco igual a su nombre y guarda el él los datos del usuario
*/
function saveUser(user: User) :void {
  Deno.writeTextFileSync(user.nickname + ".txt", user.getTotalInfo());
}