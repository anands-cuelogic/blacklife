import createCSV from "csv-writer";
import cartridgeModel from "../models/cartridgeModel";

import _ from "lodash";

class CartridgeController {
  cartrigeData = async () => {
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
          cartridgeCombination.push(await this.createCartridge(cartridgeObj));
        }

        // Store the cartridge combination in the database
        this.storeCartridgeCombination(cartridgeCombination);

        // Create the CSV File
        this.createCSVFile();
      }
    } catch (error) {
      console.log("Error for cartridgeModelResult in app ", error);
    }
  };

  createCartridge = async cartridgeObj => {
    const cartridgeCombination = [];

    if (cartridgeObj.key === "STANDARD") {
      return [{ firstRecord: cartridgeObj.record[0] }];
    } else if (cartridgeObj.key === "SINGLE") {
      for (const singleObj of cartridgeObj.record) {
        cartridgeCombination.push(await this.singleGasGenerator(singleObj));
      }
    } else if (cartridgeObj.key === "MULTI") {
      const multiGroupSeqResult = _.chain(cartridgeObj.record)
        .groupBy("SequenceNo")
        .map((value, key) => {
          return {
            key: key,
            record: value
          };
        })
        .value();

      const multiGasCombination = await this.multiGasGenerator(
        multiGroupSeqResult[0].record
      );

      cartridgeCombination.push(multiGasCombination);
    }
    return cartridgeCombination;
  };

  singleGasGenerator = async singleGas => {
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
  };

  multiGasGenerator = async firstRecord => {
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
        const multiGas = {
          firstRecord: firstRecordObj,
          seperator: "-"
        };

        // Call the third column of multi gas
        const multiGasThirdColumnResult = this.multiGasThirdColumn(
          multiGas,
          multiGasGroupResult[0].record,
          multiGasGroupResult[1].record,
          multiGasGroupResult[2].record,
          multiGasGroupResult[3].record
        );
        multiGasCombination.push(multiGasThirdColumnResult);
      });
    }
    return multiGasCombination;
  };

  sort = obj => {
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
  };

  multiGasThirdColumn = (multiGas, second, third, fourth, fifth) => {
    const thirdColumnResult = [];
    second.forEach(secondObj => {
      third.forEach(thirdObj => {
        fourth.forEach(fourthObj => {
          fifth.forEach(fifthObj => {
            const obj = {};
            obj.secondRecord = secondObj;
            obj.thirdRecord = thirdObj;
            obj.fourthRecord = fourthObj;
            obj.fifthRecord = fifthObj;

            const multiGasCopy = Object.assign({}, multiGas);
            const record = Object.assign(multiGasCopy, obj);

            const sortedRecord = Object.assign(
              {},
              this.sort({ multiGas: record })
            );

            thirdColumnResult.push({ multiGas: sortedRecord });
          });
        });
      });
    });

    return thirdColumnResult;
  };

  storeCartridgeCombination = cartridgeCombination => {
    // For Standard Gas
    //this.createStandardGas(cartridgeCombination[0]);

    // For Single Gas Combination
    this.createSingleGas(cartridgeCombination[1][0]);

    // For Multi Gas Combination
    //this.createMultiGas(cartridgeCombination[2][0]);
  };

  standardGasCombination = standardGas => {
    return new Promise(async (resolve, reject) => {
      const cartCombination = [];
      for (const obj of standardGas) {
        const cartridgeCombinationCode = obj.firstRecord.CartridgeCode;
        const cartridgeCombinationName = obj.firstRecord.CartridgeName;
        const groupName = obj.firstRecord.GroupName;

        let isExist = false;
        try {
          const cartObj = await cartridgeModel.getCartridgeCombinationByCode(
            cartridgeCombinationCode
          );
          if (cartObj.success && cartObj.data.length > 0) {
            isExist = true;
          }
        } catch (error) {
          console.log("Error for getCartridgeCombinationByCode in app", error);
        }
        if (!isExist) {
          cartCombination.push([
            cartridgeCombinationCode,
            cartridgeCombinationName,
            groupName
          ]);
        }
      }
      return resolve(cartCombination);
    });
  };

  createStandardGas = async standardGas => {
    try {
      const standardGasCombinationResult = await this.standardGasCombination(
        standardGas
      );
      if (standardGasCombinationResult.length > 0) {
        this.storeCartCombination(standardGasCombinationResult);
      }
    } catch (error) {
      console.log("Error for createStandardGas ", error);
    }
  };

  singleGasCombination = singleGas => {
    return new Promise(async (resolve, reject) => {
      const singleGasCartCombination = [];
      for (const obj of singleGas) {
        const cartridgeCombinationCode =
          obj.firstRecord.CartridgeCode +
          obj.seperator +
          obj.secondRecord.GasCode;
        const cartridgeCombinationName =
          obj.firstRecord.CartridgeName + " , " + obj.secondRecord.GasName;
        const groupName = obj.firstRecord.GroupName;

        singleGasCartCombination.push({
          CartridgeCombinationCode: cartridgeCombinationCode,
          CartridgeCombinationName: cartridgeCombinationName,
          CartridgeGroupName: groupName
        });
      }
      return resolve(singleGasCartCombination);
    });
  };

  createSingleGas = async singleGas => {
    try {
      const singleGasCartCombination = await this.singleGasCombination(
        singleGas
      );

      let uniqueSingleGasCombination;
      try {
        const singleCartridgeCombination = await cartridgeModel.getCartridgeCombinationByGroupName(
          "SINGLE"
        );

        if (singleCartridgeCombination.success) {
          const dbResult = singleCartridgeCombination.data;
          const combinationArray = singleGasCartCombination;

          uniqueSingleGasCombination = _.differenceBy(
            combinationArray,
            dbResult,
            "CartridgeCombinationCode"
          );
          console.log("Unique ", uniqueSingleGasCombination);
        }
      } catch (error) {
        console.log(
          "Error for getCartridgeCombinationByGroupName in cartridgeController ",
          error
        );
      }

      if (uniqueSingleGasCombination.length > 0) {
        this.storeCartCombination(uniqueSingleGasCombination);
      }
    } catch (error) {
      console.log("Error for createSingleGas in app", error);
    }
  };

  multiGasCombination = multiGas => {
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
            obj.multiGas.secondRecord.GasCode === "X"
              ? ""
              : "," + obj.multiGas.secondRecord.GasName;
          const thirdGasName =
            obj.multiGas.thirdRecord.GasCode === "X"
              ? ""
              : "," + obj.multiGas.thirdRecord.GasName;
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
            const cartObj = await cartridgeModel.getCartridgeCombinationByCode(
              cartCombination[0]
            );

            if (cartObj.success && cartObj.data.length > 0) {
              isExist = true;
              break;
            }
          } catch (error) {
            console.log(
              "Error for getCartridgeCombinationByCode in app",
              error
            );
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
  };

  createMultiGas = async multiGas => {
    try {
      const cartridgeCombinationArr = await this.multiGasCombination(multiGas);

      // Chunk the data in 100
      let i,
        j,
        temparray,
        chunk = 100;

      for (i = 0, j = cartridgeCombinationArr.length; i < j; i += chunk) {
        temparray = cartridgeCombinationArr.slice(i, i + chunk);
        let storeCartCombinationResponse;
        try {
          storeCartCombinationResponse = await this.storeCartCombination(
            temparray
          );
        } catch (error) {
          console.log(
            "Error for storing ",
            storeCartCombination.requestedCombination
          );
        }
      }
    } catch (error) {
      console.log(
        "Error for storeCartCombination in createMultiGas app ",
        error
      );
    }
  };

  storeCartCombination = async cartridgeCombinationObj => {
    return new Promise(async (resolve, reject) => {
      // Insert in the database
      try {
        const storeCartCombinationResult = await cartridgeModel.createCartridgeCombination(
          cartridgeCombinationObj
        );
        return resolve(storeCartCombinationResult);
      } catch (error) {
        console.log(
          "Error for getCartridgeCombinationByCode for Standard in app ",
          error
        );
      }
    });
  };

  createCSVFile = async () => {
    const createCsvWriter = createCSV.createObjectCsvWriter;

    const csvWriter = createCsvWriter({
      path: "/home/anandsingh/Desktop/cartridgeIG.csv",
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
  };

  calculateCartridgePrice = cartridgeObj => {
    return new Promise(async (resolve, reject) => {
      const cartridgeArr = cartridgeObj.CartridgeCombinationCode.split("-");

      const regionCurrency = {
        USD: 0,
        CAD: 0,
        GBP: 0,
        EUR: 0,
        AUD: 0
      };

      if (cartridgeArr.length > 1) {
        const gasArr = cartridgeArr[1].split("");
        // console.log(gasArr);

        const filteredGas = gasArr.filter(obj => obj !== "X");
        for (const gasObj of filteredGas) {
          try {
            const priceResult = await cartridgeModel.getGasPrice(gasObj);

            if (priceResult.success && priceResult.data.length > 0) {
              // Store the price of respective currency
              this.getPriceForRegion(priceResult.data, regionCurrency);
            }
          } catch (error) {
            console.log("Error for getPrice in cartridgeController ", error);
          }
        }

        if (cartridgeArr[0] === "P") {
          try {
            const cartridgePriceResult = await cartridgeModel.getCartridgeCurrency(
              {
                quantity: 4,
                CartridgeCode: "P"
              }
            );
            if (
              cartridgePriceResult.success &&
              cartridgePriceResult.data.length > 0
            ) {
              // Store the price of respective currency
              this.getPriceForRegion(cartridgePriceResult.data, regionCurrency);
            }
          } catch (error) {
            console.log(
              "Error for getCartridgeCurrency in cartridgeController ",
              error
            );
          }
          await this.calculatePrice(filteredGas, regionCurrency);
        } else {
          await this.calculatePrice(filteredGas, regionCurrency);
        }
      }
      return resolve(regionCurrency);
    });
  };

  calculatePrice = (filteredGas, regionCurrency) => {
    return new Promise(async (resolve, reject) => {
      let cartridgeCode;
      if (filteredGas.length === 0) {
        cartridgeCode = "Z";
      } else if (filteredGas.length === 1) {
        cartridgeCode = "S";
      } else if (filteredGas.length === 2) {
        cartridgeCode = "M2";
      } else if (filteredGas.length === 3) {
        cartridgeCode = "M3";
      } else if (filteredGas.length === 4) {
        cartridgeCode = "M";
      }
      try {
        const cartridgePriceResult = await cartridgeModel.getCartridgeCurrency({
          quantity: filteredGas.length,
          CartridgeCode: cartridgeCode
        });
        if (
          cartridgePriceResult.success &&
          cartridgePriceResult.data.length > 0
        ) {
          // Store the price of respective currency
          this.getPriceForRegion(cartridgePriceResult.data, regionCurrency);
        }
        return resolve(true);
      } catch (error) {
        console.log(
          "Error for getCartridgeCurrency in cartridgeController ",
          error
        );
      }
    });
  };

  getPriceForRegion = (priceResult, regionCurrency) => {
    priceResult.forEach(obj => {
      if (obj.CurrencyName === "USD") {
        regionCurrency.USD += obj.Price;
      } else if (obj.CurrencyName === "CAD") {
        regionCurrency.CAD += obj.Price;
      } else if (obj.CurrencyName === "GBP") {
        regionCurrency.GBP += obj.Price;
      } else if (obj.CurrencyName === "EUR") {
        regionCurrency.EUR += obj.Price;
      } else if (obj.CurrencyName === "AUD") {
        regionCurrency.AUD += obj.Price;
      }
    });
  };
}

export default new CartridgeController();
