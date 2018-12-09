import * as excel from "xlsx";

import leaseSKUModel from "../LeaseSKU/models/leaseSKUModel";
import cartridgeModel from "../Cartridge/models/cartridgeModel";
import serviceSKUModel from "../ServiceSKU/models/serviceSKUModel";
import hardwareModel from "../Hardware/models/hardwareModel";
import cartridgeController from "../Cartridge/controllers/cartridgeController";
import serviceSKUController from "../ServiceSKU/controllers/serviceSKUController";
import hardwareController from "../Hardware/controllers/hardwareController";
import currencyFormat from "./currencyFormat";
import leaseSKUController from "../LeaseSKU/controllers/leaseSKUController";

class CreateXLSX {
	createXLSXFile = async () => {
		try {
			const Workbook = excel.utils.book_new();
			const promiseArr = [];

			console.log(">>>>>>>>>>>>>>>Creating XLSX File<<<<<<<<<<<<<<<<<<<");

			console.log("----------Creating CMP IG-------------");
			promiseArr.push(this.createLeaseXLSX(Workbook));

			console.log("----------Creating Service IG-------------");
			promiseArr.push(this.createServiceXLSX(Workbook));

			console.log("----------Creating Hardware IG-------------");
			promiseArr.push(this.createHardwareXLSX(Workbook));

			console.log("----------Creating Cartridge IG-------------");
			promiseArr.push(this.createCartridgeXLSX(Workbook));

			Promise.all(promiseArr).then((result) => {
				console.log("Result ", result);
				excel.writeFile(Workbook, "/home/anand/Desktop/SKULoad.xlsx");
				console.log(">>>>>>>>>>>>>>>>>>>XLSX file created successfully<<<<<<<<<<<<<<<<<<");
			});

			console.log("----_____DONE");
		} catch (error) {
			console.log("Error for createXLSXFile in leaseSKUController ", error);
		}
	};

	createHardwareXLSX = (Workbook) => {
		return new Promise(async (resolve, reject) => {
			// Hardware Data
			console.log("Createing HARDWARE IG file.........");
			const hardwareRecords = [];
			let hardwareSKUResult;
			try {
				hardwareSKUResult = await hardwareModel.getHardwareSKU();
			} catch (error) {
				console.log("Error for hardwareModel.getHardwareSKU in createHardwareXLSX ", error);
			}

			if (hardwareSKUResult.success && hardwareSKUResult.data.length > 0) {
				let hardwarePrice;
				for (const obj of hardwareSKUResult.data) {
					const hardwareSKUArr = obj.HardwareSKUCode.split("-");
					let hardwarePrice;
					try {
						hardwarePrice = await hardwareController.calculateHardwarePrice(
							hardwareSKUArr[0],
							hardwareSKUArr[hardwareSKUArr.length - 1]
						);
					} catch (error) {
						console.log("Error for hardwareController.calculateHardwarePrice in createXLSX ", error);
					}

					let hardwareItemObj = {};
					if (hardwareSKUArr.length === 3) {
						hardwareItemObj.item1 = hardwareSKUArr[0] + "-" + hardwareSKUArr[hardwareSKUArr.length - 1];
						hardwareItemObj.item2 = "CART-" + hardwareSKUArr[1];
					} else {
						hardwareItemObj.item1 = hardwareSKUArr[0] + "-" + hardwareSKUArr[hardwareSKUArr.length - 1];
						hardwareItemObj.item2 = "CART-" + hardwareSKUArr[1] + "-" + hardwareSKUArr[2];
					}

					hardwareRecords.push({
						SKU: obj.HardwareSKUCode,
						Description: obj.HardwareSKUName,
						["Item 1"]: hardwareItemObj.item1,
						["Item 2"]: hardwareItemObj.item2,
						USD: "$" + currencyFormat.numberWithCommas(hardwarePrice.USD),
						CAD: "$" + currencyFormat.numberWithCommas(hardwarePrice.CAD),
						GBP: "$" + currencyFormat.numberWithCommas(hardwarePrice.GBP),
						EUR: "$" + currencyFormat.numberWithCommas(hardwarePrice.EUR),
						AUD: "$" + currencyFormat.numberWithCommas(hardwarePrice.AUD)
					});
				}
			}
			const hardwareSheet = excel.utils.json_to_sheet(hardwareRecords, {
				dateNF: "mm/dd/yy hh:mm:ss"
			});
			excel.utils.book_append_sheet(Workbook, hardwareSheet, "Hardware IG");
			console.log("HARDWARE IG file created");
			// End Hardware Data

			return resolve({ success: true, message: "Hardware SKU file created successfullly" });
		});
	};

	createServiceXLSX = (Workbook) => {
		return new Promise(async (resolve, reject) => {
			// Service Data
			console.log("Creating SERVICE IG file.......");
			const serviceRecords = [];
			let serviceSKUResult;
			try {
				serviceSKUResult = await serviceSKUModel.getServiceSKU();
			} catch (error) {
				console.log("Error for serviceSKUModel.getServiceSKU in createServiceXLSX ", error);
			}
			if (serviceSKUResult.success && serviceSKUResult.data.length > 0) {
				for (const obj of serviceSKUResult.data) {
					// Service IG Price
					let serviceSKUPrice;
					try {
						serviceSKUPrice = await serviceSKUController.getServiceSKUPrice(obj);
					} catch (error) {
						console.log("Error for serviceSKUController.getServiceSKUPrice in createServiceXLSX", error);
					}
					const serviceSKUCodeArr = obj.ServiceSKUCode.split("-");
					let gas = "";
					if (serviceSKUCodeArr.length > 4) {
						gas = "-" + serviceSKUCodeArr[3];
					}
					serviceRecords.push({
						SKU: obj.ServiceSKUCode,
						Description: obj.ServiceSKUName,
						["Item 1"]:
							serviceSKUCodeArr[0] +
							"-" +
							serviceSKUCodeArr[1] +
							"-" +
							serviceSKUCodeArr[serviceSKUCodeArr.length - 1],
						["Item 2"]:
							serviceSKUCodeArr[0] +
							"-CART-" +
							serviceSKUCodeArr[2] +
							gas +
							"-" +
							serviceSKUCodeArr[serviceSKUCodeArr.length - 1],
						USD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.USD),
						CAD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.CAD),
						GBP: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.GBP),
						EUR: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.EUR),
						AUD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.AUD)
					});
				}
			}
			const serviceSheet = excel.utils.json_to_sheet(serviceRecords, {
				dateNF: "mm/dd/yy hh:mm:ss"
			});
			excel.utils.book_append_sheet(Workbook, serviceSheet, "Service IG");
			console.log("SERVICE IG file created");
			// End service Data

			return resolve({ success: true, message: "Service SKU file created successfully" });
		});
	};

	createCartridgeXLSX = (Workbook) => {
		return new Promise(async (resolve, reject) => {
			// Cartridge Data
			console.log("Creating CART IG file.........");
			const cartridgeRecords = [];
			const cartridgeSKUResult = await cartridgeModel.getCartridgeCombination();

			if (cartridgeSKUResult.success && cartridgeSKUResult.data.length > 0) {
				for (const obj of cartridgeSKUResult.data) {
					// Calculate the price
					const cartridgePrice = await cartridgeController.calculateCartridgePrice(obj);
					cartridgeRecords.push({
						SKU: "SER-CART-" + obj.CartridgeCombinationCode + "-1Y",
						Description: obj.CartridgeCombinationName,
						USD: "$" + currencyFormat.numberWithCommas(cartridgePrice.USD),
						CAD: "$" + currencyFormat.numberWithCommas(cartridgePrice.CAD),
						GBP: "$" + currencyFormat.numberWithCommas(cartridgePrice.GBP),
						EUR: "$" + currencyFormat.numberWithCommas(cartridgePrice.EUR),
						AUD: "$" + currencyFormat.numberWithCommas(cartridgePrice.AUD)
					});
				}
			}
			const cartridgeSheet = excel.utils.json_to_sheet(cartridgeRecords, {
				dateNF: "mm/dd/yy hh:mm:ss"
			});
			const Workbook1 = excel.utils.book_new();
			excel.utils.book_append_sheet(Workbook1, cartridgeSheet, "Cartridge IG");
			console.log("CART IG file created");
			// End cartridge Data

			return resolve({ success: true, message: "Cartridge File created Successfully" });
		});
	};

	createLeaseXLSX = (Workbook) => {
		return new Promise(async (resolve, reject) => {
			// CMP IG data
			console.log("Creating CMP IG...........");
			const records = [];

			const leaseSKUResult = await leaseSKUModel.getLeaseSKU();
			if (leaseSKUResult.success && leaseSKUResult.data.length > 0) {
				let i = 0;
				for (const obj of leaseSKUResult.data) {
					// Calculate SKU Price

					const SKUPrice = await leaseSKUController.calculateSKUPrice(obj);

					records.push({
						LeaseSKUCode: obj.LeaseSKUCode,
						LeaseSKUName: obj.LeaseSKUName,
						["Item 1"]: obj.Item1,
						["Item 2"]: obj.Item2,
						["Item 3"]: obj.Item3,
						["Item 4"]: obj.Item4,
						USD: "$" + currencyFormat.numberWithCommas(SKUPrice.USD),
						CAD: "$" + currencyFormat.numberWithCommas(SKUPrice.CAD),
						GBP: "$" + currencyFormat.numberWithCommas(SKUPrice.GBP),
						EUR: "$" + currencyFormat.numberWithCommas(SKUPrice.EUR),
						AUD: "$" + currencyFormat.numberWithCommas(SKUPrice.AUD)
					});
				}
			}

			const leaseSKUSheet = excel.utils.json_to_sheet(records, {
				dateNF: "mm/dd/yy hh:mm:ss"
			});
			excel.utils.book_append_sheet(Workbook, leaseSKUSheet, "CMP IG");
			console.log(">>>>>>>>>>>CMP IG file created<<<<<<<<<<<<<<<<");
			// End CMP IG data

			return resolve({ success: true, message: "Lease SKU file created" });
		});
	};
}

export default new CreateXLSX();
