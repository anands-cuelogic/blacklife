import hardwareModel from "../models/hardwareModel";
import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import _ from "lodash";
import createCSV from "csv-writer";
import cartridgeController from "../../Cartridge/controllers/cartridgeController";

class HardwareController {
	createHardwareSKU = async () => {
		try {
			const countryHardwareMatrixResult = await hardwareModel.getCountryHardwareMatrix();

			if (countryHardwareMatrixResult.success && countryHardwareMatrixResult.data.length > 0) {
				const countryHardwareMatrixGroupResult = _.chain(countryHardwareMatrixResult.data)
					.groupBy("HardwareCode")
					.map((value, key) => {
						return {
							hardwareCode: key,
							hardwareRecord: value
						};
					})
					.value();

				countryHardwareMatrixGroupResult.forEach((hardwarecodeObj) => {
					hardwarecodeObj.hardwareRecord.forEach((hardwareRecordObj) => {
						this.generateHardwareCombination(hardwareRecordObj);
					});
				});
			}
		} catch (error) {
			console.log("Error for createHardwareSKU in app ", error);
		}
	};

	generateHardwareCombination = async (hardwareRecord) => {
		try {
			const cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
			if (cartridgeCombinationResult.success && cartridgeCombinationResult.data.length > 0) {
				const hardwareIGArr = [];
				for (const cartridgeObj of cartridgeCombinationResult.data) {
					const hardwareSKUCode =
						hardwareRecord.HardwareCode +
						"-" +
						cartridgeObj.CartridgeCombinationCode +
						"-" +
						hardwareRecord.CountryCode;

					const hardwareSKUCombinationName =
						"Device, " +
						hardwareRecord.HardwareName +
						", " +
						cartridgeObj.CartridgeCombinationName +
						", " +
						hardwareRecord.CountryName;

					hardwareIGArr.push({
						HardwareSKUCode: hardwareSKUCode,
						HardwareSKUName: hardwareSKUCombinationName
					});
				}

				let uniqueHardwareSKU;
				try {
					uniqueHardwareSKU = await this.getUniqueHardwareCombination(hardwareIGArr);

					console.log("__________________________________________________________________________");
					console.log(
						">>>>> New combinations for HardwareSKU ::: Total New Records : ",
						uniqueHardwareSKU.length
					);
					console.log("\t", uniqueHardwareSKU);
					console.log("__________________________________________________________________________");
				} catch (error) {
					console.log("Error for getUniqueHardwareCombination in hardwareController ", error);
				}

				// Chunk the data in 100
				let i,
					j,
					temparray,
					chunk = 100;

				for (i = 0, j = uniqueHardwareSKU.length; i < j; i += chunk) {
					temparray = uniqueHardwareSKU.slice(i, i + chunk);

					let hardwareCombinationResponse;
					try {
						console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
						console.log("HARDWARE CHUNK :::::: ", i, temparray);
						console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
						hardwareCombinationResponse = this.storeHardwareSKU(temparray);
					} catch (error) {
						console.log("Error for storing ", hardwareCombinationResponse.requestedCombination);
					}
				}

				// this.createHardwareCSVFile();
			}
		} catch (error) {
			console.log("Error for generateHardwareCombination in app", error);
		}
	};

	getUniqueHardwareCombination = (hardwareSKUCombination) => {
		return new Promise(async (resolve, reject) => {
			try {
				const hardwareSKU = await hardwareModel.getHardwareSKU();

				if (hardwareSKU.success) {
					const dbResult = hardwareSKU.data;

					const uniqueCombination = _.differenceBy(hardwareSKUCombination, dbResult, "HardwareSKUCode");

					return resolve(uniqueCombination);
				}
			} catch (error) {
				console.log("Error for getCartridgeCombinationByGroupName in cartridgeController ", error);
			}
		});
	};

	storeHardwareSKU = async (hardwareSKUObj) => {
		try {
			await hardwareModel.createHardwareSKU(hardwareSKUObj);
		} catch (error) {
			console.log("Error for createHardwareSKU in storeHardwareSKU hardwareModel", error);
		}
	};

	// createHardwareCSVFile = async () => {
	// 	const createCsvWriter = createCSV.createObjectCsvWriter;

	// 	const csvWriter = createCsvWriter({
	// 		path: "/home/anandsingh/Desktop/hardwareIG.csv",
	// 		header: [ { id: "SKU", title: "SKU" }, { id: "Description", title: "Description" } ]
	// 	});

	// 	const records = [];

	// 	try {
	// 		const hardwareSKUResult = await hardwareModel.getHardwareSKU();
	// 		if (hardwareSKUResult.success && hardwareSKUResult.data.length > 0) {
	// 			hardwareSKUResult.data.forEach((obj) => {
	// 				records.push({
	// 					SKU: obj.HardwareSKUCode,
	// 					Description: obj.HardwareSKUName
	// 				});
	// 			});
	// 		}
	// 	} catch (error) {
	// 		console.log("Error for getCartridgeCombination in app ", error);
	// 	}

	// 	csvWriter
	// 		.writeRecords(records) // returns a promise
	// 		.then(() => {
	// 			console.log("...Done");
	// 		});
	// };

	calculateHardwarePrice = (hardwareCode, countryCode) => {
		return new Promise(async (resolve, reject) => {
			const HardwarePrice = {
				USD: 0,
				CAD: 0,
				GBP: 0,
				EUR: 0,
				AUD: 0
			};

			let HardwarePriceResult;
			try {
				HardwarePriceResult = await hardwareModel.getHardwarePrice({
					HardwareCode: hardwareCode,
					CountryCode: countryCode
				});
			} catch (error) {
				console.log("Error for getHardwarePrice in hardwareController ", error);
			}

			if (HardwarePriceResult.success && HardwarePriceResult.data.length > 0) {
				cartridgeController.getPriceForRegion(HardwarePriceResult.data, HardwarePrice);
			}

			return resolve(HardwarePrice);
		});
	};
}

export default new HardwareController();
