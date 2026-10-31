import {format} from "@d3plus/format";

format(",.2f")(1234.567);
format("$,.0f")(1234567);
format(".1%")(0.256);
format("08.2f")(3.14159);
format(".2e")(123456);
