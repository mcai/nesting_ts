import { listen } from "./server";
import { testClipper } from "./core";

testClipper();

listen(5001);
