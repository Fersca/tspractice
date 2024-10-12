console.log("Iniciando Deno server");

//Crea el servidor que recibe peticiones
//Deno.serve({port: 8080}, handler);

//Llama a una URL de ejemplo y muestra los datos
const response = await fetch("https://api.mercadolibre.com/users/20");
console.log(response.status);     // e.g. 200
console.log(response.statusText); // e.g. "OK"

//obtiene el json del request
const jsonData = await response.json();

//crea una clase usuario
class User {

    //Devuelve una representaicón del usuario en texto
    public getTotalInfo(): string {
      return "ID: " + this.id + "\nNickname: " + this.nickname + "\nCountry ID: " + this.country_id + "\nAddress: " + this.address;
    }

    id: number;                         //si no pongo nada es public
    public nickname: string;          
    private country_id: string;
    private readonly address: string;   //readonly es para que solo se pueda asignar y listo
  
    constructor(id: number, nickname: string, country_id: string, address: string) {
      this.id = id;
      this.nickname = nickname;
      this.country_id = country_id;
      this.address = address;
    }

    //ejemplo de como hacer getters
    public getCountryId(): string {
      return this.country_id;
    }
    public getAddress(): string {
      return this.address;
    }

    public saludar() {
      console.log("Hola, soy " + this.nickname);
    }

  }

//crea un objeto usuario en base a los datos del json
const user = new User(jsonData.id, jsonData.nickname, jsonData.country_id, jsonData.address.state);
//llamo al método saludar
user.saludar();

//crear un array de usuarios. Agrego al usuario al array
const users: User[] = [];
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

//recorre el mapa y muestra los datos de los usuarios
for (const [_key, value] of userMap) {
    printUser(value);
}

//Funcion que maneja las solicitudes
function _handler(req: Request): Response {

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


function printUser(user: User) {

  //imprime en pantalla los datos del usuario
  console.log("------------------------------------------");
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

import { assertEquals } from "jsr:@std/assert";
import { delay } from "jsr:@std/async";

//Crea un test case para probar la clase usuario
Deno.test("test de la clase usaurio", async () => {
    const user = new User(1, "Test", "AR", "Calle Falsa 123");
    await delay(100);
    assertEquals(user.id, 1);
    assertEquals(user.nickname, "Test");
    assertEquals(user.getCountryId(), "AR");
    assertEquals(user.getAddress(), "Calle Falsa 123");
  });

Deno.bench({
  name: "test de la clase usuario",
  fn(){
    const user = new User(1, "Test", "AR", "Calle Falsa 123");
    printUser(user);
  } 
})
