import { listen } from "./server";
import { testClipper } from "./nfp";

testClipper();

listen(5001);
