import hardwareModel from "../models/hardwareModel";
import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import _ from "lodash";
import createCSV from "csv-writer";
import { resolve } from "dns";
import cartridgeController from "../../Cartridge/controllers/cartridgeController";

class HardwareController {
  createHardwareSKU = async () => {
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
            this.generateHardwareCombination(hardwareRecordObj);
          });
        });
      }
    } catch (error) {
      console.log("Error for createHardwareSKU in app ", error);
    }
  };

  generateHardwareCombination = async hardwareRecord => {
    try {
      const cartridgeCombinationResult = await cartridgeModel.getCartridgeCombination();
      if (
        cartridgeCombinationResult.success &&
        cartridgeCombinationResult.data.length > 0
      ) {
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

          hardwareIGArr.push([hardwareSKUCode, hardwareSKUCombinationName]);
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
            hardwareCombinationResponse = await this.storeHardwareSKU(
              temparray
            );
          } catch (error) {
            console.log(
              "Error for storing "
              //storeCartCombination.requestedCombination
            );
          }
        }

        this.createHardwareCSVFile();
      }
    } catch (error) {
      console.log("Error for generateHardwareCombination in app", error);
    }
  };

  storeHardwareSKU = async hardwareSKUObj => {
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
  };
  createHardwareCSVFile = async () => {
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
  };

  calculateHardware = (hardwareCode, countryCode) => {
    return new Promise(async (resolve, reject) => {
      const HardwarePrice = {
        USD: 0,
        CAD: 0,
        GBP: 0,
        EUR: 0,
        AUD: 0
      };

      const HardwarePriceResult = await hardwareModel.getHardwarePrice({
        HardwareCode: hardwareCode,
        CountryCode: countryCode
      });

      if (HardwarePriceResult.success && HardwarePriceResult.data.length > 0) {
        cartridgeController.getPriceForRegion(
          HardwarePriceResult.data,
          HardwarePrice
        );
      }

      return resolve(HardwarePrice);
    });
  };
}

export default new HardwareController();
