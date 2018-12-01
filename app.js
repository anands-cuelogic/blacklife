import _ from "lodash";
import createCSV from "csv-writer";

import cartridgeModel from "./modules/v1/Cartridge/models/cartridgeModel";
import hardwareModel from "./modules/v1/Hardware/models/hardwareModel";
import serviceSKUModel from "./modules/v1/ServiceSKU/models/serviceSKUModel";
import { resolve } from "url";

async function cartrigeData() {
	try {
		const cartridgeModelResult = await cartridgeModel.getCartridge();

		if (cartridgeModelResult && cartridgeModelResult.data && cartridgeModelResult.data.length > 0) {
			const cartridgeGroupResult = _.chain(cartridgeModelResult.data)
				.groupBy("GroupName")
				.map((value, key) => {
					return {
						key: key,
						record: value
					};
				})
				.value();

			const cartridgeCombination = [];
			for (const cartridgeObj of cartridgeGroupResult) {
				cartridgeCombination.push(await createCartridge(cartridgeObj));
			}

			// Store the cartridge combination in the database
			storeCartridgeCombination(cartridgeCombination);

			// Create the CSV File
			createCSVFile();
		}
	} catch (error) {
		console.log("Error for cartridgeModelResult in app ", error);
	}
}

async function createCartridge(cartridgeObj) {
	const cartridgeCombination = [];

	//console.log("Cartridge Data ", cartridgeObj.key);

	if (cartridgeObj.key === "STANDARD") {
		return [ { firstRecord: cartridgeObj.record[0] } ];
	} else if (cartridgeObj.key === "SINGLE") {
		// console.log(cartridgeObj.key, " ", cartridgeObj.record.length);

		for (const singleObj of cartridgeObj.record) {
			// singleGasGenerator(cartridgeObj.record[0].CartridgeCode);

			cartridgeCombination.push(await singleGasGenerator(singleObj));
		}
	} else if (cartridgeObj.key === "MULTI") {
		console.log(cartridgeObj.key, " ", cartridgeObj.record.length);
		const multiGroupSeqResult = _.chain(cartridgeObj.record)
			.groupBy("SequenceNo")
			.map((value, key) => {
				return {
					key: key,
					record: value
				};
			})
			.value();

		const secondRecord = [
			{
				GasCode: multiGroupSeqResult[1].record[0].CartridgeCode,
				GasName: multiGroupSeqResult[1].record[0].CartridgeName,
				SequenceNo: multiGroupSeqResult[1].record[0].SequenceNo
			}
		];

		const multiGasCombination = await multiGasGenerator(
			multiGroupSeqResult[0].record,
			multiGroupSeqResult[1].record
		);

		cartridgeCombination.push(multiGasCombination);
	}
	return cartridgeCombination;
}

async function singleGasGenerator(singleGas) {
	try {
		// Fetch the record from the Single Gas table

		const singleGasResult = await cartridgeModel.getSingleGas();
		const singleGasCombination = [];
		if (singleGasResult && singleGasResult.data) {
			singleGasResult.data.forEach((singleGasObj) => {
				// Combine with the cartridge.CartridgeCode - singleGas.code

				singleGasCombination.push({
					firstRecord: singleGas,
					seperator: "-",
					secondRecord: singleGasObj
				});
			});
		}
		return singleGasCombination;
	} catch (error) {
		console.log("Error for getSingleGas in singleGasGenerator ", error);
	}
}

async function multiGasGenerator(firstRecord, secondRecord) {
	const multiGasCombination = [];

	// Get the multi gas
	let multiGasResult;
	try {
		multiGasResult = await cartridgeModel.getMultiGas();
	} catch (error) {
		console.log("Error for getMultiGas in app", error);
	}

	const multiGasGroupResult = _.chain(multiGasResult.data)
		.groupBy("SequenceNo")
		.map((value, key) => {
			return {
				key: key,
				record: value
			};
		})
		.value();

	if (multiGasResult) {
		firstRecord.forEach((firstRecordObj) => {
			secondRecord.forEach((secondRecordObj) => {
				const multiGas = {
					firstRecord: firstRecordObj,
					seperator: "-",
					secondRecord: {
						GasCode: secondRecordObj.CartridgeCode,
						GasName: secondRecordObj.CartridgeName,
						SequenceNo: secondRecordObj.SequenceNo
					}
				};

				// Call the third column of multi gas
				const multiGasThirdColumnResult = multiGasThirdColumn(
					multiGas,
					multiGasGroupResult[0].record,
					multiGasGroupResult[1].record,
					multiGasGroupResult[2].record
				);
				multiGasCombination.push(multiGasThirdColumnResult);
			});
		});
	}
	return multiGasCombination;
}

function sort(obj) {
	var newArray = [];
	var newObj = {};
	for (let a in obj.multiGas) {
		if (obj.multiGas[a].GasCode) {
			newObj[a] = {
				[a]: obj.multiGas[a]
			};
			newArray.push(newObj[a]);
			delete obj.multiGas[a];
		}
	}

	newArray.sort(function(a, b) {
		if (a[Object.keys(a)].GasCode < b[Object.keys(b)].GasCode) return -1;
		if (a[Object.keys(a)].GasCode > b[Object.keys(b)].GasCode) return 1;
		return 0;
	});

	const tempObj = {};
	newArray.forEach((obj, index) => {
		if (index === 0) {
			tempObj.secondRecord = obj[Object.keys(obj)];
		} else if (index === 1) {
			tempObj.thirdRecord = obj[Object.keys(obj)];
		} else if (index === 2) {
			tempObj.fourthRecord = obj[Object.keys(obj)];
		} else if (index === 3) {
			tempObj.fifthRecord = obj[Object.keys(obj)];
		}
	});
	Object.assign(obj.multiGas, tempObj);

	return obj.multiGas;
}

function multiGasThirdColumn(multiGas, third, fourth, fifth) {
	const thirdColumnResult = [];
	third.forEach((thirdObj) => {
		fourth.forEach((fourthObj) => {
			fifth.forEach((fifthObj) => {
				const obj = {};
				obj.thirdRecord = thirdObj;
				obj.fourthRecord = fourthObj;
				obj.fifthRecord = fifthObj;

				const multiGasCopy = Object.assign({}, multiGas);
				const record = Object.assign(multiGasCopy, obj);
				// console.log("---------RECORD ", record);
				const sortedRecord = Object.assign({}, sort({ multiGas: record }));

				// console.log("------_Sorted Record ", sortedRecord);

				thirdColumnResult.push({ multiGas: sortedRecord });
			});
		});
	});
	return thirdColumnResult;
}

function storeCartridgeCombination(cartridgeCombination) {
	// For Standard Gas
	createStandardGas(cartridgeCombination[0]);

	// For Single Gas Combination
	createSingleGas(cartridgeCombination[1][0]);

	// For Multi Gas Combination
	createMultiGas(cartridgeCombination[2][0]);
}

function standardGasCombination(standardGas) {
	return new Promise(async (resolve, reject) => {
		const cartCombination = [];
		for (const obj of standardGas) {
			const cartridgeCombinationCode = obj.firstRecord.CartridgeCode;
			const cartridgeCombinationName = obj.firstRecord.CartridgeName;
			const groupName = obj.firstRecord.GroupName;

			let isExist = false;
			try {
				const cartObj = await cartridgeModel.getCartridgeCombinationByCode(cartridgeCombinationCode);
				if (cartObj.success && cartObj.data.length > 0) {
					isExist = true;
				}
			} catch (error) {
				console.log("Error for getCartridgeCombinationByCode in app", error);
			}
			if (!isExist) {
				cartCombination.push([ cartridgeCombinationCode, cartridgeCombinationName, groupName ]);
			}
		}
		return resolve(cartCombination);
	});
}

async function createStandardGas(standardGas) {
	try {
		const standardGasCombinationResult = await standardGasCombination(standardGas);
		if (standardGasCombinationResult.length > 0) {
			storeCartCombination(standardGasCombinationResult);
		}
	} catch (error) {
		console.log("Error for createStandardGas ", error);
	}
}

function singleGasCombination(singleGas) {
	return new Promise(async (resolve, reject) => {
		const singleGasCartCombination = [];
		for (const obj of singleGas) {
			const cartridgeCombinationCode = obj.firstRecord.CartridgeCode + obj.seperator + obj.secondRecord.GasCode;
			const cartridgeCombinationName = obj.firstRecord.CartridgeName + " , " + obj.secondRecord.GasName;
			const groupName = obj.firstRecord.GroupName;

			let isExist = false;
			try {
				const cartObj = await cartridgeModel.getCartridgeCombinationByCode(cartridgeCombinationCode);

				if (cartObj.success && cartObj.data.length > 0) {
					isExist = true;
				}

				if (!isExist) {
					singleGasCartCombination.push([ cartridgeCombinationCode, cartridgeCombinationName, groupName ]);
				}
			} catch (error) {
				console.log("Error for getCartridgeCombinationByCode in app", error);
			}
		}
		return resolve(singleGasCartCombination);
	});
}

async function createSingleGas(singleGas) {
	try {
		const singleGasCartCombination = await singleGasCombination(singleGas);
		if (singleGasCartCombination.length > 0) {
			storeCartCombination(singleGasCartCombination);
		}
	} catch (error) {
		console.log("Error for createSingleGas in app", error);
	}
}

function multiGasCombination(multiGas) {
	return new Promise(async (resolve, reject) => {
		const cartridgeCombinationArr = [];

		for (const objArray of multiGas) {
			for (const obj of objArray) {
				const cartridgeCombinationCode =
					obj.multiGas.firstRecord.CartridgeCode +
					obj.multiGas.seperator +
					obj.multiGas.secondRecord.GasCode +
					obj.multiGas.thirdRecord.GasCode +
					obj.multiGas.fourthRecord.GasCode +
					obj.multiGas.fifthRecord.GasCode;

				const secondGasName =
					obj.multiGas.secondRecord.GasCode === "X" ? "" : "," + obj.multiGas.secondRecord.GasName;
				const thirdGasName =
					obj.multiGas.thirdRecord.GasCode === "X" ? "" : "," + obj.multiGas.thirdRecord.GasName;
				const fourthGasName =
					obj.multiGas.fourthRecord.GasCode === "X" ? "" : "," + obj.multiGas.fourthRecord.GasName;
				const fifthGasName =
					obj.multiGas.fifthRecord.GasCode === "X" ? "" : "," + obj.multiGas.fifthRecord.GasName;

				const cartridgeCombinationName =
					obj.multiGas.firstRecord.CartridgeName +
					secondGasName +
					thirdGasName +
					fourthGasName +
					fifthGasName;

				const cartCombination = [
					cartridgeCombinationCode,
					cartridgeCombinationName,
					obj.multiGas.firstRecord.GroupName
				];

				let isExist = false;

				try {
					const cartObj = await cartridgeModel.getCartridgeCombinationByCode(cartCombination[0]);

					if (cartObj.success && cartObj.data.length > 0) {
						isExist = true;
						break;
					}
				} catch (error) {
					console.log("Error for getCartridgeCombinationByCode in app", error);
				}
				for (const obj of cartridgeCombinationArr) {
					if (_.includes(obj, cartCombination[0])) {
						isExist = true;
						break;
					}
				}
				if (!isExist) {
					cartridgeCombinationArr.push(cartCombination);
				}
			}
		}
		return resolve(cartridgeCombinationArr);
	});
}

async function createMultiGas(multiGas) {
	try {
		const cartridgeCombinationArr = await multiGasCombination(multiGas);

		// Chunk the data in 10
		let i,
			j,
			temparray,
			chunk = 100;

		for (i = 0, j = cartridgeCombinationArr.length; i < j; i += chunk) {
			temparray = cartridgeCombinationArr.slice(i, i + chunk);
			let storeCartCombinationResponse;
			try {
				storeCartCombinationResponse = await storeCartCombination(temparray);
			} catch (error) {
				console.log("Error for storing ", storeCartCombination.requestedCombination);
			}
		}
	} catch (error) {
		console.log("Error for storeCartCombination in createMultiGas app ", error);
	}
}

async function storeCartCombination(cartridgeCombinationObj) {
	return new Promise(async (resolve, reject) => {
		// Insert in the database
		try {
			const storeCartCombinationResult = await cartridgeModel.createCartridgeCombination(cartridgeCombinationObj);
			return resolve(storeCartCombinationResult);
		} catch (error) {
			console.log("Error for getCartridgeCombinationByCode for Standard in app ", error);
		}
	});
}

async function createHardwareSKU() {
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
					console.log("-------- ", hardwarecodeObj.hardwareCode, " - ", hardwareRecordObj);

					generateHardwareCombination(hardwareRecordObj);
				});
			});
		}
	} catch (error) {
		console.log("Error for createHardwareSKU in app ", error);
	}
}

async function generateHardwareCombination(hardwareRecord) {
	try {
		const cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
		if (cartridgeCombinationResult.success && cartridgeCombinationResult.data.length > 0) {
			const hardwareIGArr = [];
			for (const cartridgeObj of cartridgeCombinationResult.data) {
				const hardwareSKUCode =
					"G7" +
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

				hardwareIGArr.push([ hardwareSKUCode, hardwareSKUCombinationName ]);
			}

			// Chunk the data in 10
			let i,
				j,
				temparray,
				chunk = 100;

			for (i = 0, j = hardwareIGArr.length; i < j; i += chunk) {
				temparray = hardwareIGArr.slice(i, i + chunk);

				let hardwareCombinationResponse;
				try {
					hardwareCombinationResponse = await storeHardwareSKU(temparray);
				} catch (error) {
					console.log("Error for storing ", storeCartCombination.requestedCombination);
				}
			}

			createHardwareCSVFile();
		}
	} catch (error) {
		console.log("Error for generateHardwareCombination in app", error);
	}
}

async function storeHardwareSKU(hardwareSKUObj) {
	// Check the combination before store in the database
	// let isExist;
	// try {
	// 	isExist = await hardwareModel.getHardwareSKUByCode(hardwareSKUObj.hardwareCode);
	// } catch (error) {
	// 	console.log("Error for getHardwareSKUByCode in storeHardwareSKU app ", error);
	// }

	// // Insert in the database
	// if (isExist.success && !(isExist.data.length > 0)) {
	try {
		await hardwareModel.createHardwareSKU(hardwareSKUObj);
	} catch (error) {
		// console.log("Error for generateHardwareCombination in createHardwareSKU app", error);
	}
	//}
}

async function createCSVFile() {
	const createCsvWriter = createCSV.createObjectCsvWriter;

	const csvWriter = createCsvWriter({
		path: "/home/anand/Desktop/file.csv",
		header: [ { id: "cartridgeCode", title: "CartridgeCode" }, { id: "cartridgeName", title: "CartridgeName" } ]
	});

	const records = [];

	try {
		const cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
		if (cartridgeCombinationResult.success && cartridgeCombinationResult.data.length > 0) {
			cartridgeCombinationResult.data.forEach((obj) => {
				records.push({
					cartridgeCode: obj.CartridgeCombinationCode,
					cartridgeName: obj.CartridgeCombinationName
				});
			});
		}
	} catch (error) {
		console.log("Error for getCartridgeCombination in app ", error);
	}

	csvWriter
		.writeRecords(records) // returns a promise
		.then(() => {
			console.log("...Done");
		});
}

async function createServiceCSVFile() {
	const createCsvWriter = createCSV.createObjectCsvWriter;

	const csvWriter = createCsvWriter({
		path: "/home/anand/Desktop/serviceIG.csv",
		header: [ { id: "serviceSKUCode", title: "ServiceSKUCode" }, { id: "serviceSKUName", title: "ServiceSKUName" } ]
	});

	const records = [];

	try {
		const serviceSKUResult = await serviceSKUModel.getServiceSKU();
		if (serviceSKUResult.success && serviceSKUResult.data.length > 0) {
			serviceSKUResult.data.forEach((obj) => {
				records.push({
					serviceSKUCode: obj.ServiceSKUCode,
					serviceSKUName: obj.ServiceSKUName
				});
			});
		}
	} catch (error) {
		console.log("Error for getCartridgeCombination in app ", error);
	}

	csvWriter
		.writeRecords(records) // returns a promise
		.then(() => {
			console.log("...Done");
		});
}

async function createHardwareCSVFile() {
	const createCsvWriter = createCSV.createObjectCsvWriter;

	const csvWriter = createCsvWriter({
		path: "/home/anand/Desktop/hardwareIG.csv",
		header: [ { id: "SKU", title: "SKU" }, { id: "Description", title: "Description" } ]
	});

	const records = [];

	try {
		const hardwareSKUResult = await hardwareModel.getHardwareSKU();
		if (hardwareSKUResult.success && hardwareSKUResult.data.length > 0) {
			hardwareSKUResult.data.forEach((obj) => {
				records.push({
					SKU: obj.HardwareSKUCode,
					Description: obj.HardwareSKUName
				});
			});
		}
	} catch (error) {
		console.log("Error for getCartridgeCombination in app ", error);
	}

	csvWriter
		.writeRecords(records) // returns a promise
		.then(() => {
			console.log("...Done");
		});
}

async function createServiceSKU() {
	let serviceResult;
	try {
		serviceResult = await serviceSKUModel.getService();
	} catch (error) {
		console.log("Error for getService in createServiceSKU ", error);
	}

	let yearResult;
	try {
		yearResult = await serviceSKUModel.getYear();
	} catch (error) {
		console.log("Error for getYear in createServiceSKU ", error);
	}

	let cartridgeCombinationResult;
	try {
		cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
	} catch (error) {
		console.log("Erorr for getCartridgeCombination in app", error);
	}

	const serviceSKUCombination = [];

	if (
		serviceResult &&
		serviceResult.success &&
		yearResult &&
		yearResult.success &&
		cartridgeCombinationResult &&
		cartridgeCombinationResult.success
	) {
		if (serviceResult.data.length > 0 && yearResult.data.length > 0 && cartridgeCombinationResult.data.length > 0) {
			for (const serviceObj of serviceResult.data) {
				for (const yearObj of yearResult.data) {
					for (const cartridgeObj of cartridgeCombinationResult.data) {
						const serviceSKUCode =
							"SER - " +
							serviceObj.ServiceCode +
							" - " +
							cartridgeObj.CartridgeCombinationCode +
							" - " +
							yearObj.YearCode;

						const yearStr = yearObj.YearName.split(" ");

						const serviceSKUName =
							"Service, " +
							serviceObj.ServiceName +
							", " +
							cartridgeObj.CartridgeCombinationName +
							", " +
							yearStr[0] +
							"-" +
							yearStr[1].toLowerCase();

						const serviceSKUObj = {
							serviceSKUCode,
							serviceSKUName
						};

						serviceSKUCombination.push([ serviceSKUCode, serviceSKUName ]);
						// storeServiceSKU(serviceSKUObj);
					}
				}
			}

			// Chunk the data in 10
			let i,
				j,
				temparray,
				chunk = 100;

			for (i = 0, j = serviceSKUCombination.length; i < j; i += chunk) {
				temparray = serviceSKUCombination.slice(i, i + chunk);

				let serviceIGCombination;
				try {
					serviceIGCombination = await storeServiceSKU(temparray);
				} catch (error) {
					console.log("Error for storing ", error);
				}
			}

			createServiceCSVFile();
		}
	}

	// console.log("--------Service SKU ", serviceSKUCombination);
}

async function storeServiceSKU(serviceSKUObj) {
	// Check the combination before store in the database
	// let isExist;
	// try {
	// 	isExist = await serviceSKUModel.getServiceSKUByCode(serviceSKUObj.serviceSKUCode);
	// } catch (error) {
	// 	console.log("Error for getHardwareSKUByCode in storeHardwareSKU app ", error);
	// }

	// Insert in the database
	//if (isExist.success && !(isExist.data.length > 0)) {
	try {
		await serviceSKUModel.createServiceSKU(serviceSKUObj);
	} catch (error) {
		console.log("Error for generateHardwareCombination in createHardwareSKU app", error);
	}
	//}
}

// To create cartridge combination
// cartrigeData();

// To create Hardware SKU
// createHardwareSKU();

// To create serviceSKU
createServiceSKU();
