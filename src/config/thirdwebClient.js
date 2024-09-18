import { createThirdwebClient } from "thirdweb";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
// const clientId = import.meta.env.VITE_TEMPLATE_CLIENT_ID;
const clientId = "0x2092b525fdffddd85979ba4414d43fe3";
console.log("clientId", clientId);

export const client = createThirdwebClient({
  clientId: clientId,
});
