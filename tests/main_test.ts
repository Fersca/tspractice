import { assertEquals } from "jsr:@std/assert";
import { delay } from "jsr:@std/async";
import { User } from "../src/User.ts";
import { printUser } from "../src/main.ts";

//Crea un test case para probar la clase usuario
Deno.test("test de la clase usaurio", async () => {
    const user = new User(1, "Test", "AR", "Calle Falsa 123");
    await delay(100);
    assertEquals(user.id, 1);
    assertEquals(user.nickname, "Test");
    assertEquals(user.getCountryId(), "AR");
    assertEquals(user.getAddress(), "Calle Falsa 123");
  });

//Ejemplo de un benchmark
Deno.bench({
  name: "test de la clase usuario",
  fn(){
    const user = new User(1, "Test", "AR", "Calle Falsa 123");
    printUser(user);
  } 
})





