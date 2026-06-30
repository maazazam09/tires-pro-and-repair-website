import { auth } from "../src/auth";

(async () => {
  const session = await auth();
  console.log(session ? "AUTH_OK" : "AUTH_NO_SESSION");
})();
