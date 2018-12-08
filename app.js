import leaseSKUModel from "./modules/v1/LeaseSKU/models/leaseSKUModel";
import cartridgeController from "./modules/v1/Cartridge/controllers/cartridgeController";
import hardwareController from "./modules/v1/Hardware/controllers/hardwareController";
import serviceSKUController from "./modules/v1/ServiceSKU/controllers/serviceSKUController";
import leaseSKUController from "./modules/v1/LeaseSKU/controllers/leaseSKUController";
import createXLSX from "./modules/v1/lib/createXLSX";

async function generateSKUMasterRecord() {
	// To create cartridge combination
	await cartridgeController.createCartridge();

	// To create Hardware SKU
	hardwareController.createHardwareSKU();

	// To create serviceSKU
	serviceSKUController.createServiceSKU();

	// To create LeaseSKU
	leaseSKUController.createLeaseSKU();
}

function timeout(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
generateSKUMasterRecord();

// Generate XLSX file
// createXLSX.createXLSXFile();
