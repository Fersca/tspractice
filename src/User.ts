export { User };

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
