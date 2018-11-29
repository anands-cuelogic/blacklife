import cartridgeModel from "./modules/v1/Cartridge/models/cartridgeModel";
import _ from "lodash";

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

      // console.log("Cartridge Combination are");
      // console.log(JSON.stringify(cartridgeCombination));

      // Store the cartridge combination in the database

      storeCartridgeCombination(cartridgeCombination);
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

    const multiGasCombination = await multiGasGenerator(
      multiGroupSeqResult[0].record,
      multiGroupSeqResult[1].record
    );

    cartridgeCombination.push(multiGasCombination);
    // console.log("Multi Group Sequence ", multiGasCombination);

    // Fetch the record from the Multi Gas table
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
  console.log("-------------Insode ");

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
        obj.multiGas.secondRecord.CartridgeCode +
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
        obj.multiGas.secondRecord.CartridgeName +
        "," +
        obj.multiGas.thirdRecord.GasName +
        fourthGasName +
        fifthGasName;

      const cartridgeCombinationObj = {
        cartridgeCombinationCode,
        cartridgeCombinationName,
        groupName: obj.multiGas.firstRecord.GroupName
      };

      storeCartCombination(cartridgeCombinationObj);
    });
  });
}

async function storeCartCombination(cartridgeCombinationObj) {
  // Check the combination before store in the database
  let isExist;
  try {
    isExist = await cartridgeModel.getCartridgeCombination(
      cartridgeCombinationObj.cartridgeCombinationCode
    );
  } catch (error) {
    console.log("Error for getCartridgeCombination in app ", error);
  }

  // Insert in the database
  if (isExist.success && !(isExist.data.length > 0)) {
    try {
      await cartridgeModel.createCartridgeCombination(cartridgeCombinationObj);
    } catch (error) {
      console.log(
        "Error for getCartridgeCombination for Standard in app ",
        error
      );
    }
  }
}

cartrigeData();
