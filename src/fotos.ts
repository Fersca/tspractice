//Loguearse a la api de google

//Obtener el listado de las fotos, todas.

//Ponerlas todas en memoria.

//Analizar las fotos que parecen ser las mismas según su nombre y tamaño.

//Listar las fotos, para confirmación del usuario.

//Eliminar las fotos duplicadas.

//Librería para realizar peticiones HTTP
import axios from 'axios';
import formDataToStream from './node_modules/axios/lib/helpers/formDataToStream.js';
import open from 'open';

// obtiene las credenciales del archivo
const filePath = "/Users/Fernando.Scasserra/code/tspractice/src/client_secret_google.json";
const credentials = getAuthCredentials(filePath);

const CLIENT_ID = credentials.clientId;
const CLIENT_SECRET = credentials.clientSecret;
const REDIRECT_URI = credentials.redirectUri;
const TOKEN_URI = credentials.tokenUri;
const AUTH_URI = credentials.authUri;

const SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';
let code:string = "";
let accessToken:string = "";

console.log("---------------------------");
console.log("Client ID:", credentials.clientId);
console.log("Client Secret:", credentials.clientSecret);
console.log("Redirect URI:", credentials.redirectUri);
console.log("---------------------------");


// Función para leer y extraer variables específicas de un archivo JSON
function getAuthCredentials(filePath: string) {
    try {
        // Leer el archivo JSON
        const jsonData = Deno.readTextFileSync(filePath);
        const config = JSON.parse(jsonData);

        // Extraer las variables
        const clientId = config.installed?.client_id || null;
        const clientSecret = config.installed?.client_secret || null;
        const redirectUri = config.installed?.redirect_uris?.[0] || null;
        const tokenUri = config.installed?.token_uri || null;
        const authUri = config.installed?.auth_uri || null;

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error("Faltan claves necesarias en el archivo JSON.");
        }

        return {
            clientId,
            clientSecret,
            redirectUri,
            tokenUri,
            authUri
        };
    } catch (error) {
        console.error("Error al leer el archivo JSON:", error);
        throw error;
    }
}

function getAuthURL(): string {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline'
    });
    return AUTH_URI+`?${params.toString()}`;
}

function getAuthorizationCode(){
    console.log('Abre esta URL en tu navegador para autorizar el acceso:');
    console.log(getAuthURL());
    open(getAuthURL());
}

function readLineSync(prompt: string): string {
    // Mostrar el prompt al usuario
    Deno.stdout.writeSync(new TextEncoder().encode(prompt));

    // Crear un buffer para almacenar la entrada
    const buffer = new Uint8Array(1024);
    const n = Deno.stdin.readSync(buffer);
    
    if (n === null) {
        throw new Error("Error al leer de la entrada estándar");
    }

    // Decodificar y retornar el texto ingresado
    return new TextDecoder().decode(buffer.subarray(0, n)).trim();
}

async function getAccessToken(authCode: string): Promise<string> {

    const payload = {
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
    };

    console.log("POST: ");
    console.log(payload);

    const response = await axios.post(TOKEN_URI, payload);

    if (response) {
        const data = (response as any).data;
        console.log('Token de acceso obtenido:', data.access_token);
        return data.access_token;
    } else {
        //obtener el error del response
        console.log("Error: ");
        console.log(response);
        throw new Error('Error al obtener el token de acceso');
    }
}

async function getPhotos() {
    
    //obtener el último número de página
    let lastPage: number = 0;
    try {
        lastPage = Number(Deno.readTextFileSync("lastPage.txt"));
    } catch (_error){
        console.log("Archivo lastPage.txt no encontrado");
        lastPage = 0;
    }

    //si no hay next token empieza desde el inicio
    let nextPageToken: string | null = null;
    try {
        nextPageToken = Deno.readTextFileSync("nextPageToken.txt");
    } catch (_error){
        console.log("Archivo nextPageToken.txt no encontrado");
        nextPageToken = null;
        lastPage = 0;
    }


    do {

        const url:string = `https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        console.log('GET:', url);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });
    
        if (response) {
            const datos = (response as any).data

            //aplanar el json y guardarlo en el archivo paginas.txt
            const jsonString = JSON.stringify(datos);
            const photos = datos.mediaItems;
            nextPageToken = datos.nextPageToken;
            lastPage++;

            Deno.writeTextFileSync(`./paginas/pagina${lastPage}.txt`, jsonString);
            Deno.writeTextFileSync(`lastPage.txt`, lastPage.toString());
            //guarda el nextPageToken en un archivo llamado nextPageToken.txt
            if (nextPageToken){
                Deno.writeTextFileSync("nextPageToken.txt", nextPageToken);
            }

            if (photos) {
                photos.forEach((item: any) => {
                    console.log(item.filename);
                    //console.log(`${item.filename} - ${item.baseUrl}`);
                });
            } else {
                console.log('No se encontraron fotos.');
            }     
    
        } else {
            console.log('Error al obtener fotos');
            nextPageToken = null;
        }
    
    } while (nextPageToken);


}

async function handler(req: Request): Promise<Response> {

    //obtiene el valor del parametro code
    const url = new URL(req.url);
    const localCode = url.searchParams.get("code");

    if (localCode) {
        console.log('Código de autorización recibido:', code);
        code = localCode;
        const accessToken = await getAccessToken(code);

        //graba en un archivo el accessToken
        Deno.writeTextFileSync("accessToken.txt", accessToken);

        //getPhotos(accessToken);
        return new Response("OK, Code: " + code);
    }  
    return new Response("OK");
}

class Photo{
    filename:   string="";
    productUrl: string="";
    width:      string="";
    height:     string="";
}

function getPhotosInfo(){
    let lastPage: number = 0;
    try {
        lastPage = Number(Deno.readTextFileSync("lastPage.txt"));
    } catch (_error){
        console.log("Archivo lastPage.txt no encontrado");
        lastPage = 0;
    }

    const photoMap = new Map<string, Photo[]>();
      
    let countPhotos = 0;
    for (let i = 1; i <= lastPage; i++){
        const jsonString = Deno.readTextFileSync(`./paginas/pagina${i}.txt`);
        const datos = JSON.parse(jsonString);
        const photos = datos.mediaItems;
        if (photos) {

            photos.forEach((item: any) => {
                
                if (photoMap.has(item.filename)){
                    //la foto está duplicada
                    console.log("Foto duplicada:", item.filename);
                    //obtiene el array anterior
                    let fotosAntes = photoMap.get(item.filename);
                    //le suma el item nuevo
                    let foto = new Photo();
                    foto.filename = item.filename;
                    foto.productUrl = item.productUrl;
                    foto.width = item.mediaMetadata.width;
                    foto.height = item.mediaMetadata.height;
                    if (!fotosAntes) {
                        fotosAntes = [];
                    }
                    fotosAntes.push(foto);      
                    //lo vuelve a guardar en el mapa              
                    photoMap.set(item.filename, fotosAntes);
                } else {
                    const fotos = [];
                    fotos.push(item);
                    photoMap.set(item.filename, fotos);
                }

                console.log(item.filename);            
                countPhotos++;
            });
        } else {
            console.log('No se encontraron fotos.');
        }     
    }
    
    console.log("Cantidad de fotos:", countPhotos);

    //recorre el mapa y muestra los elementos que tienen un array con más de 1 elemento
    for (const [key, value] of photoMap) {
        if (value.length > 1){
            console.log("Foto duplicada:", key);
            value.forEach((foto: Photo) => {
                console.log(`  ${foto.productUrl} - ${foto.width}x${foto.height}`);
            });
        }
    }

    //crear un archivo html con la lista de las fotos duplicadas con un tamaño de 50x50
    let html = "<html><head></head><body>";
    for (const [key, value] of photoMap) {
        if (value.length > 1){
            html += `<h2>${key}</h2>`;
            value.forEach((foto: Photo) => {
                html += `<img src="${foto.productUrl}" >`;
            });
        }
    }
    html += "</body></html>";
    Deno.writeTextFileSync("fotosDuplicadas.html", html);

}

//Crea el servidor que recibe peticiones en un puerto y llama a la función handler
Deno.serve({port: 80}, handler);
console.log('Servidor iniciado en el puerto 80');

//con esta condición se ejecuta el código solo si se ejecuta el archivo directamente
if (import.meta.main) {
    //leer el archivo accessToken.txt obtener el contenido y guardardo en la variable accessToken
    accessToken = Deno.readTextFileSync("accessToken.txt");
    
    //preguntarle al usuario qué quiere hacer de diferentes opciones numeradas
    let option = 0;
    
        console.log("1 - Obtener nuevo Token");
        console.log("2 - Obtener Fotos");
        console.log("3 - Obtener Información de las Fotos");
        console.log("4 - Salir");
        option = parseInt(readLineSync("Ingrese una opción: "));

        switch(option){
            case 1:
                getAuthorizationCode();
                break;
            case 2:
                getPhotos();
                break;    
            case 3:
                getPhotosInfo();
                break;        
            case 4:
                console.log("Saliendo...");
                Deno.exit();   
                break;
            default:
                console.log("Opción inválida");
        }

}


