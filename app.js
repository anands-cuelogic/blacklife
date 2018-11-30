import _ from "lodash";
import createCSV from "csv-writer";

import cartridgeModel from "./modules/v1/Cartridge/models/cartridgeModel";
import hardwareModel from "./modules/v1/Hardware/models/hardwareModel";
import serviceSKUModel from "./modules/v1/ServiceSKU/models/serviceSKUModel";
import { resolve } from "url";

async function cartrigeData() {
  try {
    const cartridgeModelResult = await cartridgeModel.getCartridge();

    if (
      cartridgeModelResult &&
      cartridgeModelResult.data &&
      cartridgeModelResult.data.length > 0
    ) {
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
    return [{ firstRecord: cartridgeObj.record[0] }];
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
      secondRecord
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
      singleGasResult.data.forEach(singleGasObj => {
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
    firstRecord.forEach(firstRecordObj => {
      secondRecord.forEach(secondRecordObj => {
        const multiGas = {
          firstRecord: firstRecordObj,
          seperator: "-",
          secondRecord: secondRecordObj
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
  third.forEach(thirdObj => {
    fourth.forEach(fourthObj => {
      fifth.forEach(fifthObj => {
        const obj = {};
        obj.thirdRecord = thirdObj;
        obj.fourthRecord = fourthObj;
        obj.fifthRecord = fifthObj;

        const multiGasCopy = Object.assign({}, multiGas);
        const record = Object.assign(multiGasCopy, obj);
        // console.log("---------RECORD ", record);
        // const sortedRecord = Object.assign({}, sort({ multiGas: record }));

        // console.log("------_Sorted Record ", sortedRecord);

        thirdColumnResult.push({ multiGas: record });
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

function createStandardGas(standardGas) {
  standardGas.forEach(async obj => {
    const cartridgeCombinationObj = {
      cartridgeCombinationCode: obj.firstRecord.CartridgeCode,
      cartridgeCombinationName: obj.firstRecord.CartridgeName,
      groupName: obj.firstRecord.GroupName
    };

    storeCartCombination(cartridgeCombinationObj);
  });
}

function createSingleGas(singleGas) {
  singleGas.forEach(async obj => {
    const cartridgeCombinationObj = {
      cartridgeCombinationCode:
        obj.firstRecord.CartridgeCode +
        obj.seperator +
        obj.secondRecord.GasCode,
      cartridgeCombinationName:
        obj.firstRecord.CartridgeName + " , " + obj.secondRecord.GasName,
      groupName: obj.firstRecord.GroupName
    };

    storeCartCombination(cartridgeCombinationObj);
  });
}

function createMultiGas(multiGas) {
  multiGas.forEach(objArray => {
    objArray.forEach(async obj => {
      const cartridgeCombinationCode =
        obj.multiGas.firstRecord.CartridgeCode +
        obj.multiGas.seperator +
        obj.multiGas.secondRecord.GasCode +
        obj.multiGas.thirdRecord.GasCode +
        obj.multiGas.fourthRecord.GasCode +
        obj.multiGas.fifthRecord.GasCode;

      const fourthGasName =
        obj.multiGas.fourthRecord.GasCode === "X"
          ? ""
          : "," + obj.multiGas.fourthRecord.GasName;
      const fifthGasName =
        obj.multiGas.fifthRecord.GasCode === "X"
          ? ""
          : "," + obj.multiGas.fifthRecord.GasName;

      const cartridgeCombinationName =
        obj.multiGas.firstRecord.CartridgeName +
        "," +
        obj.multiGas.secondRecord.GasName +
        "," +
        obj.multiGas.thirdRecord.GasName +
        fourthGasName +
        fifthGasName;

      const cartridgeCombinationObj = {
        cartridgeCombinationCode,
        cartridgeCombinationName,
        groupName: obj.multiGas.firstRecord.GroupName
      };

      await storeCartCombination(cartridgeCombinationObj);
    });
  });
}

async function storeCartCombination(cartridgeCombinationObj) {
  // Check the combination before store in the database
  let isExist;
  try {
    isExist = await cartridgeModel.getCartridgeCombinationByCode(
      cartridgeCombinationObj.cartridgeCombinationCode
    );
  } catch (error) {
    console.log("Error for getCartridgeCombinationByCode in app ", error);
  }

  return new Promise(async (resolve, reject) => {
    // Insert in the database
    if (isExist.success && !(isExist.data.length > 0)) {
      console.log(
        "---------",
        isExist,
        "cartridgeCombinationObj",
        cartridgeCombinationObj
      );
      try {
        await cartridgeModel.createCartridgeCombination(
          cartridgeCombinationObj
        );
        return resolve(true);
      } catch (error) {
        console.log(
          "Error for getCartridgeCombinationByCode for Standard in app ",
          error
        );
      }
    } else {
      return resolve(true);
    }
  });
}

async function createCSVFile() {
  const createCsvWriter = createCSV.createObjectCsvWriter;

  const csvWriter = createCsvWriter({
    path: "/home/anandsingh/Desktop/file.csv",
    header: [
      { id: "cartridgeCode", title: "CartridgeCode" },
      { id: "cartridgeName", title: "CartridgeName" }
    ]
  });

  const records = [];

  try {
    const cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
    if (
      cartridgeCombinationResult.success &&
      cartridgeCombinationResult.data.length > 0
    ) {
      cartridgeCombinationResult.data.forEach(obj => {
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

async function createHardwareSKU() {
  try {
    const countryHardwareMatrixResult = await hardwareModel.getCountryHardwareMatrix();

    if (
      countryHardwareMatrixResult.success &&
      countryHardwareMatrixResult.data.length > 0
    ) {
      const countryHardwareMatrixGroupResult = _.chain(
        countryHardwareMatrixResult.data
      )
        .groupBy("HardwareCode")
        .map((value, key) => {
          return {
            hardwareCode: key,
            hardwareRecord: value
          };
        })
        .value();

      countryHardwareMatrixGroupResult.forEach(hardwarecodeObj => {
        hardwarecodeObj.hardwareRecord.forEach(hardwareRecordObj => {
          console.log(
            "-------- ",
            hardwarecodeObj.hardwareCode,
            " - ",
            hardwareRecordObj
          );

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
    if (
      cartridgeCombinationResult.success &&
      cartridgeCombinationResult.data.length > 0
    ) {
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

        await storeHardwareSKU({
          hardwareCode: hardwareSKUCode,
          hardwareCombinationName: hardwareSKUCombinationName
        });
      }
      createHardwareCSVFile();
    }
  } catch (error) {
    console.log("Error for generateHardwareCombination in app", error);
  }
}

async function storeHardwareSKU(hardwareSKUObj) {
  // Check the combination before store in the database
  let isExist;
  try {
    isExist = await hardwareModel.getHardwareSKUByCode(
      hardwareSKUObj.hardwareCode
    );
  } catch (error) {
    console.log(
      "Error for getHardwareSKUByCode in storeHardwareSKU app ",
      error
    );
  }

  // Insert in the database
  if (isExist.success && !(isExist.data.length > 0)) {
    try {
      await hardwareModel.createHardwareSKU(hardwareSKUObj);
    } catch (error) {
      console.log(
        "Error for generateHardwareCombination in createHardwareSKU app",
        error
      );
    }
  }
}

async function createHardwareCSVFile() {
  const createCsvWriter = createCSV.createObjectCsvWriter;

  const csvWriter = createCsvWriter({
    path: "/home/anandsingh/Desktop/hardwareIG.csv",
    header: [
      { id: "SKU", title: "SKU" },
      { id: "Description", title: "Description" }
    ]
  });

  const records = [];

  try {
    const hardwareSKUResult = await hardwareModel.getHardwareSKU();
    if (hardwareSKUResult.success && hardwareSKUResult.data.length > 0) {
      hardwareSKUResult.data.forEach(obj => {
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
    if (
      serviceResult.data.length > 0 &&
      yearResult.data.length > 0 &&
      cartridgeCombinationResult.data.length > 0
    ) {
      serviceResult.data.forEach(serviceObj => {
        yearResult.data.forEach(yearObj => {
          cartridgeCombinationResult.data.forEach(cartridgeObj => {
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

            serviceSKUCombination.push(serviceSKUObj);
            storeServiceSKU(serviceSKUObj);
          });
        });
      });
    }
  }

  // console.log("--------Service SKU ", serviceSKUCombination);
}

async function storeServiceSKU(serviceSKUObj) {
  // Check the combination before store in the database
  let isExist;
  try {
    isExist = await serviceSKUModel.getServiceSKUByCode(
      serviceSKUObj.serviceSKUCode
    );
  } catch (error) {
    console.log(
      "Error for getHardwareSKUByCode in storeHardwareSKU app ",
      error
    );
  }

  // Insert in the database
  if (isExist.success && !(isExist.data.length > 0)) {
    try {
      await serviceSKUModel.createServiceSKU(serviceSKUObj);
    } catch (error) {
      console.log(
        "Error for generateHardwareCombination in createHardwareSKU app",
        error
      );
    }
  }
}

// To create cartridge combination
cartrigeData();

// To create Hardware SKU
// createHardwareSKU();

// To create serviceSKU
// createServiceSKU();
