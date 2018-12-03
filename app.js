import leaseSKUModel from "./modules/v1/LeaseSKU/models/leaseSKUModel";
import cartridgeController from "./modules/v1/Cartridge/controllers/cartridgeController";
import hardwareController from "./modules/v1/Hardware/controllers/hardwareController";
import serviceSKUController from "./modules/v1/ServiceSKU/controllers/serviceSKUController";
import leaseSKUController from "./modules/v1/LeaseSKU/controllers/leaseSKUController";

// To create cartridge combination
// cartridgeController.cartrigeData();

// To create Hardware SKU
// hardwareController.createHardwareSKU();

// To create serviceSKU
// serviceSKUController.createServiceSKU();

// To create LeaseSKU
leaseSKUController.createLeaseSKU();
