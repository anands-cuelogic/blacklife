import _ from "lodash";

import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import leaseSKUModel from "../models/leaseSKUModel";
import cartridgeController from "../../Cartridge/controllers/cartridgeController";
import serviceSKUController from "../../ServiceSKU/controllers/serviceSKUController";
import hardwareController from "../../Hardware/controllers/hardwareController";

class LeaseSKUController {
	createLeaseSKU = async () => {
		let leaseSKUResult;
		try {
			leaseSKUResult = await leaseSKUModel.getLeaseSKUMatrix();
		} catch (error) {
			console.log("Error for getLeaseSKUMatrix createLeaseSKU in app", error);
		}
		let cartridgeCombinationResult;
		try {
			cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
		} catch (error) {
			console.log("Error for createLeaseSKU in app", error);
		}

		if (
			leaseSKUResult.success &&
			leaseSKUResult.data.length > 0 &&
			cartridgeCombinationResult.success &&
			cartridgeCombinationResult.data.length > 0
		) {
			const leaseSKUCombination = await this.generateLeaseSKUCombination(
				leaseSKUResult.data,
				cartridgeCombinationResult.data
			);
		}
	};

	generateLeaseSKUCombination = async (leaseSKUResult, cartridgeCombinationResult) => {
		try {
			const leaseSKUArr = [];
			for (const leaseSKU of leaseSKUResult) {
				for (const cartrigeObj of cartridgeCombinationResult) {
					const leaseSKUCode =
						"CMP-" +
						leaseSKU.ServiceCode +
						"-" +
						leaseSKU.HardwareCode +
						"-" +
						cartrigeObj.CartridgeCombinationCode +
						"-" +
						leaseSKU.CountryCode;

					const leaseSKUName =
						"Blackline Complete, " +
						leaseSKU.ServiceName +
						", " +
						leaseSKU.HardwareName +
						", " +
						cartrigeObj.CartridgeCombinationName +
						", " +
						leaseSKU.CountryName;

					const item1 = "CMP-" + leaseSKU.HardwareCode + "-" + leaseSKU.CountryCode;

					const item2 = "CMP-CART-" + cartrigeObj.CartridgeCombinationCode;
					const item3 = "SER-CMP-" + leaseSKU.HardwareCode + "-" + leaseSKU.ServiceCode + "-1M";

					const item4 = "SER-CMP-CART-" + cartrigeObj.CartridgeCombinationCode + "-1M";
					leaseSKUArr.push({
						LeaseSKUCode: leaseSKUCode,
						LeaseSKUName: leaseSKUName,
						Item1: item1,
						Item2: item2,
						Item3: item3,
						Item4: item4
					});
				}
			}

			let uniqueLeaseSKU;
			try {
				uniqueLeaseSKU = await this.getUniqueLeaseSKUCombination(leaseSKUArr);

				console.log("__________________________________________________________________________");
				console.log(">>>>> New combinations for LeaseSKU ::: Total New Records : ", uniqueLeaseSKU.length);
				console.log("\t", uniqueLeaseSKU);
				console.log("__________________________________________________________________________");
			} catch (error) {
				console.log("Error for getUniqueSerivceSKUCombination in leaseSKUController ", error);
			}

			// Chunk the data
			let i,
				j,
				temparray,
				chunk = 100;

			for (i = 0, j = uniqueLeaseSKU.length; i < j; i += chunk) {
				temparray = uniqueLeaseSKU.slice(i, i + chunk);

				console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
				console.log("LEASE CHUNK :::::: ", i, temparray);
				console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

				try {
					this.storeLeaseSKU(temparray);
				} catch (error) {
					console.log("Error for storing ", error);
				}
			}
		} catch (error) {
			console.log("Error for generateLeaseSKUCombination in leaseSKUController ", error);
		}
	};

	getUniqueLeaseSKUCombination = (leaseSKUCombination) => {
		return new Promise(async (resolve, reject) => {
			try {
				const leaseSKU = await leaseSKUModel.getLeaseSKU();

				if (leaseSKU.success) {
					const dbResult = leaseSKU.data;

					const uniqueCombination = _.differenceBy(leaseSKUCombination, dbResult, "LeaseSKUCode");

					return resolve(uniqueCombination);
				}
			} catch (error) {
				console.log("Error for getCartridgeCombinationByGroupName in cartridgeController ", error);
			}
		});
	};

	storeLeaseSKU = async (serviceSKUObj) => {
		try {
			await leaseSKUModel.createLeaseSKU(serviceSKUObj);
		} catch (error) {
			console.log("Error for createLeaseSKU in storeLeaseSKU app", error);
		}
	};

	// createLeaseSKUCSVFile = async leaseSKUCombination => {
	//   const createCsvWriter = createCSV.createObjectCsvWriter;

	//   const csvWriter = createCsvWriter({
	//     path: "/home/anandsingh/Desktop/CMP_IG.csv",
	//     header: [
	//       { id: "leaseSKUCode", title: "SKU" },
	//       { id: "leaseSKUName", title: "Description" },
	//       { id: "item1", title: "Item 1" },
	//       { id: "item2", title: "Item 2" },
	//       { id: "item3", title: "Item 3" },
	//       { id: "item4", title: "Item 4" }
	//     ]
	//   });

	//   const records = [];

	//   try {
	//     const leaseSKUResult = await leaseSKUModel.getLeaseSKU();
	//     if (leaseSKUResult.success && leaseSKUResult.data.length > 0) {
	//       leaseSKUResult.data.forEach(obj => {
	//         records.push({
	//           leaseSKUCode: obj.LeaseSKUCode,
	//           leaseSKUName: obj.LeaseSKUName,
	//           item1: obj.Item1,
	//           item2: obj.Item2,
	//           item3: obj.Item3,
	//           item4: obj.Item4
	//         });
	//       });
	//     }

	//     //   leaseSKUCombination.forEach(obj => {
	//     //     console.log("-----------OBJ ", obj);
	//     //     records.push({ ...obj });
	//     //   });

	//     csvWriter
	//       .writeRecords(records) // returns a promise
	//       .then(() => {
	//         console.log("...Done");
	//       });
	//   } catch (error) {
	//     console.log("Error for getLeaseSKU in leaseSKUController ", error);
	//   }
	// };

	calculateSKUPrice = (SKUObj) => {
		return new Promise(async (resolve, reject) => {
			const CMPPrice = {
				USD: 0,
				CAD: 0,
				GBP: 0,
				EUR: 0,
				AUD: 0
			};
			const SKUArr = SKUObj.LeaseSKUCode.split("-");

			if (SKUArr.length > 4) {
				let ServiceSKUPrice;
				try {
					// Service SKU Price
					ServiceSKUPrice = await serviceSKUController.calculateServiceSKUPrice(SKUArr[1]);
				} catch (error) {
					console.log("Error for calculateServiceSKUPrice in leaseSKUController", error);
				}

				let HardwarePrice;
				try {
					// Get the Hardware Price
					HardwarePrice = await hardwareController.calculateHardwarePrice(
						SKUArr[2],
						SKUArr[SKUArr.length - 1]
					);
				} catch (error) {
					console.log("Error for calculateHardwarePrice in leaseSKUController", error);
				}
				let cartridgePrice;
				if (SKUArr.length === 5) {
					// Standard Cartridge
					cartridgePrice = {
						USD: 0,
						CAD: 0,
						GBP: 0,
						EUR: 0,
						AUD: 0
					};
				} else if (SKUArr.length === 6) {
					// Single

					// Calculate MultiCartridge price
					try {
						cartridgePrice = await cartridgeController.calculateCartridgePrice({
							CartridgeCombinationCode: SKUArr[3] + "-" + SKUArr[4]
						});
					} catch (error) {
						console.log(
							"Error for calculateCartridgePrice for cartridgeController in leaseSKUController",
							error
						);
					}
				}
				CMPPrice.USD = this.getCPMPrice(HardwarePrice.USD, ServiceSKUPrice.USD, cartridgePrice.USD);

				CMPPrice.CAD = this.getCPMPrice(HardwarePrice.CAD, ServiceSKUPrice.CAD, cartridgePrice.CAD);

				CMPPrice.GBP = this.getCPMPrice(HardwarePrice.GBP, ServiceSKUPrice.GBP, cartridgePrice.GBP);

				CMPPrice.EUR = this.getCPMPrice(HardwarePrice.EUR, ServiceSKUPrice.EUR, cartridgePrice.EUR);

				CMPPrice.AUD = this.getCPMPrice(HardwarePrice.AUD, ServiceSKUPrice.AUD, cartridgePrice.AUD);
			}
			return resolve(CMPPrice);
		});
	};

	getCPMPrice = (hardware, service, cartridge) => {
		return Math.round(((hardware + 3 * service) * 1.1 + 3 * cartridge) / 36);
	};
}

export default new LeaseSKUController();
