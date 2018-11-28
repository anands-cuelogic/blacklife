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

      console.log("Cartridge Combination are");
      console.log(JSON.stringify(cartridgeCombination));
    }
  } catch (error) {
    console.log("Error for cartridgeModelResult in app ", error);
  }
}

async function createCartridge(cartridgeObj) {
  const cartridgeCombination = [];
  console.log("Cartridge Data ", cartridgeObj.key);
  if (cartridgeObj.key === "STANDARD") {
    return cartridgeObj.record[0].CartridgeCode;
  } else if (cartridgeObj.key === "SINGLE") {
    console.log(cartridgeObj.key, " ", cartridgeObj.record.length);

    for (const singleObj of cartridgeObj.record) {
      // singleGasGenerator(cartridgeObj.record[0].CartridgeCode);

      cartridgeCombination.push(
        await singleGasGenerator(singleObj.CartridgeCode)
      );
    }

    console.log("Single Result ");
    console.log(cartridgeCombination);

    cartridgeCombination.forEach(singleObj => {
      console.log(singleObj);
    });
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

    cartridgeCombination.push({ multiGas: multiGasCombination[0] });
    // console.log("Multi Group Sequence ", multiGasCombination);

    // Fetch the record from the Multi Gas table
  }
  return cartridgeCombination;
}

async function singleGasGenerator(singleCode) {
  try {
    // Fetch the record from the Single Gas table

    const singleGasResult = await cartridgeModel.getSingleGas();
    const singleGasCombination = [];
    if (singleGasResult && singleGasResult.data) {
      singleGasResult.data.forEach(singleGasObj => {
        // Combine with the cartridge.CartridgeCode - singleGas.code

        singleGasCombination.push({
          singleCode: singleCode,
          seperator: "-",
          singleGasObj: singleGasObj
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
        //firstRecordObj.CartridgeCode + "-" + secondRecordObj.CartridgeCode;

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
        multiGas.thirdRecord = thirdObj;
        multiGas.fourthRecord = fourthObj;
        multiGas.fifthRecord = fifthObj;
        /*const gasStr = {
          multiGas,
          thirdRecord: thirdObj,
          fourthRecord: fourthObj,
          fifthRecord: fifthObj
        };
        // multiGas + thirdObj.GasCode + fourthObj.GasCode + fifthObj.GasCode;
        /*const gasStr = gasStrSplit[1]
          .split("")
          .sort()
          .join("");
          */
        thirdColumnResult.push(multiGas);
      });
    });
  });

  return thirdColumnResult;
}

cartrigeData();
