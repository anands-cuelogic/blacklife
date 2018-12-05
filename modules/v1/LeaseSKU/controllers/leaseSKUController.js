import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import leaseSKUModel from "../models/leaseSKUModel";
import createCSV from "csv-writer";
import * as excel from "xlsx";
import { cpus } from "os";
import serviceSKUModel from "../../ServiceSKU/models/serviceSKUModel";
import hardwareModel from "../../Hardware/models/hardwareModel";
import cartridgeController from "../../Cartridge/controllers/cartridgeController";
import { resolve } from "path";
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
      //   const leaseSKUCombination = await this.generateLeaseSKUCombination(
      //     leaseSKUResult.data,
      //     cartridgeCombinationResult.data
      //   );
      // this.createLeaseSKUCSVFile(leaseSKUCombination);
      this.createXLSXFile();
    }
  };

  generateLeaseSKUCombination = async (
    leaseSKUResult,
    cartridgeCombinationResult
  ) => {
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

          const item1 =
            "CMP-" + leaseSKU.HardwareCode + "-" + leaseSKU.CountryCode;

          const item2 = "CMP-CART-" + cartrigeObj.CartridgeCombinationCode;
          const item3 =
            "SER-CMP-" +
            leaseSKU.HardwareCode +
            "-" +
            leaseSKU.ServiceCode +
            "-1M";

          const item4 =
            "SER-CMP-CART-" + cartrigeObj.CartridgeCombinationCode + "-1M";
          leaseSKUArr.push([
            leaseSKUCode,
            leaseSKUName,
            item1,
            item2,
            item3,
            item4
          ]);
        }
      }

      // Chunk the data in 100
      let i,
        j,
        temparray,
        chunk = 100;

      for (i = 0, j = leaseSKUArr.length; i < j; i += chunk) {
        temparray = leaseSKUArr.slice(i, i + chunk);

        try {
          await this.storeLeaseSKU(temparray);
        } catch (error) {
          console.log(
            "Error for storing ",
            storeCartCombination.requestedCombination
          );
        }
      }
    } catch (error) {}
  };

  storeLeaseSKU = async serviceSKUObj => {
    try {
      await leaseSKUModel.createLeaseSKU(serviceSKUObj);
    } catch (error) {
      console.log("Error for createLeaseSKU in storeLeaseSKU app", error);
    }
  };

  createLeaseSKUCSVFile = async leaseSKUCombination => {
    const createCsvWriter = createCSV.createObjectCsvWriter;

    const csvWriter = createCsvWriter({
      path: "/home/anandsingh/Desktop/CMP_IG.csv",
      header: [
        { id: "leaseSKUCode", title: "SKU" },
        { id: "leaseSKUName", title: "Description" },
        { id: "item1", title: "Item 1" },
        { id: "item2", title: "Item 2" },
        { id: "item3", title: "Item 3" },
        { id: "item4", title: "Item 4" }
      ]
    });

    const records = [];

    try {
      const leaseSKUResult = await leaseSKUModel.getLeaseSKU();
      if (leaseSKUResult.success && leaseSKUResult.data.length > 0) {
        leaseSKUResult.data.forEach(obj => {
          records.push({
            leaseSKUCode: obj.LeaseSKUCode,
            leaseSKUName: obj.LeaseSKUName,
            item1: obj.Item1,
            item2: obj.Item2,
            item3: obj.Item3,
            item4: obj.Item4
          });
        });
      }

      //   leaseSKUCombination.forEach(obj => {
      //     console.log("-----------OBJ ", obj);
      //     records.push({ ...obj });
      //   });

      csvWriter
        .writeRecords(records) // returns a promise
        .then(() => {
          console.log("...Done");
        });
    } catch (error) {
      console.log("Error for getLeaseSKU in leaseSKUController ", error);
    }
  };

  createXLSXFile = async () => {
    const records = [];

    try {
      // CMP IG data
      console.log("Creating Excel file");
      console.log("Creating CMP IG...........");
      const leaseSKUResult = await leaseSKUModel.getLeaseSKU();
      if (leaseSKUResult.success && leaseSKUResult.data.length > 0) {
        for (const obj of leaseSKUResult.data) {
          // Calculate SKU Price

          const SKUPrice = await this.calculateSKUPrice(obj);

          records.push({
            LeaseSKUCode: obj.LeaseSKUCode,
            LeaseSKUName: obj.LeaseSKUName,
            ["Item 1"]: obj.Item1,
            ["Item 2"]: obj.Item2,
            ["Item 3"]: obj.Item3,
            ["Item 4"]: obj.Item4,
            USD: SKUPrice.USD,
            CAD: SKUPrice.CAD,
            GBP: SKUPrice.GBP,
            EUR: SKUPrice.EUR,
            AUD: SKUPrice.AUD
          });
        }
      }

      const Workbook = excel.utils.book_new();
      const leaseSKUSheet = excel.utils.json_to_sheet(records, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, leaseSKUSheet, "CMP IG");
      console.log("CMP IG file created");
      // End CMP IG data

      // Cartridge Data
      console.log("Creating CART IG file.........");
      const cartridgeRecords = [];
      const cartridgeSKUResult = await cartridgeModel.getCartridgeCombination();

      if (cartridgeSKUResult.success && cartridgeSKUResult.data.length > 0) {
        for (const obj of cartridgeSKUResult.data) {
          // Calculate the price
          const cartridgePrice = await cartridgeController.calculateCartridgePrice(
            obj
          );
          cartridgeRecords.push({
            SKU: "CART-" + obj.CartridgeCombinationCode,
            Description: obj.CartridgeCombinationName,
            USD: cartridgePrice.USD,
            CAD: cartridgePrice.CAD,
            GBP: cartridgePrice.GBP,
            EUR: cartridgePrice.EUR,
            AUD: cartridgePrice.AUD
          });
        }
      }
      const cartridgeSheet = excel.utils.json_to_sheet(cartridgeRecords, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, cartridgeSheet, "Cartridge IG");
      console.log("CART IG file created");
      // End cartridge Data

      // Service Data
      console.log("Creating SERVICE IG file.......");
      const serviceRecords = [];
      const serviceSKUResult = await serviceSKUModel.getServiceSKU();
      if (serviceSKUResult.success && serviceSKUResult.data.length > 0) {
        for (const obj of serviceSKUResult.data) {
          // Service IG Price
          const serviceSKUPrice = await serviceSKUController.getServiceSKUPrice(
            obj
          );

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
            USD: serviceSKUPrice.USD,
            CAD: serviceSKUPrice.CAD,
            GBP: serviceSKUPrice.GBP,
            EUR: serviceSKUPrice.EUR,
            AUD: serviceSKUPrice.AUD
          });
        }
      }
      const serviceSheet = excel.utils.json_to_sheet(serviceRecords, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, serviceSheet, "Service IG");
      console.log("SERVICE IG file created");
      // End service Data

      // Hardware Data
      console.log("Createing HARDWARE IG file.........");
      const hardwareRecords = [];
      const hardwareSKUResult = await hardwareModel.getHardwareSKU();
      if (hardwareSKUResult.success && hardwareSKUResult.data.length > 0) {
        hardwareSKUResult.data.forEach(obj => {
          hardwareRecords.push({
            SKU: obj.HardwareSKUCode,
            Description: obj.HardwareSKUName
          });
        });
      }
      const hardwareSheet = excel.utils.json_to_sheet(hardwareRecords, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, hardwareSheet, "Hardware IG");
      console.log("HARDWARE IG file created");
      // End Hardware Data

      excel.writeFile(Workbook, "/home/anandsingh/Desktop/SKULoad.xlsx");
      console.log("......Done");
    } catch (error) {
      console.log("Error for createXLSXFile in leaseSKUController ", error);
    }
  };

  calculateSKUPrice = SKUObj => {
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
        // Service SKU Price
        const ServiceSKUPrice = await serviceSKUController.calculateServiceSKUPrice(
          SKUArr[1]
        );

        // Get the Hardware Price
        const HardwarePrice = await hardwareController.calculateHardware(
          SKUArr[2],
          SKUArr[SKUArr.length - 1]
        );
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
          cartridgePrice = await cartridgeController.calculateCartridgePrice({
            CartridgeCombinationCode: SKUArr[3] + "-" + SKUArr[4]
          });
        }
        CMPPrice.USD = this.getCPMPrice(
          HardwarePrice.USD,
          ServiceSKUPrice.USD,
          cartridgePrice.USD
        );

        CMPPrice.CAD = this.getCPMPrice(
          HardwarePrice.CAD,
          ServiceSKUPrice.CAD,
          cartridgePrice.CAD
        );

        CMPPrice.GBP = this.getCPMPrice(
          HardwarePrice.GBP,
          ServiceSKUPrice.GBP,
          cartridgePrice.GBP
        );

        CMPPrice.EUR = this.getCPMPrice(
          HardwarePrice.EUR,
          ServiceSKUPrice.EUR,
          cartridgePrice.EUR
        );

        CMPPrice.AUD = this.getCPMPrice(
          HardwarePrice.AUD,
          ServiceSKUPrice.AUD,
          cartridgePrice.AUD
        );
      }
      return resolve(CMPPrice);
    });
  };

  getCPMPrice = (hardware, service, cartridge) => {
    return Math.round(((hardware + 3 * service) * 1.1 + 3 * cartridge) / 36);
  };
}

export default new LeaseSKUController();
