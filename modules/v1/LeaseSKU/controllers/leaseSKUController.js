import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import leaseSKUModel from "../models/leaseSKUModel";
import createCSV from "csv-writer";
import * as excel from "xlsx";
import { cpus } from "os";
import serviceSKUModel from "../../ServiceSKU/models/serviceSKUModel";
import hardwareModel from "../../Hardware/models/hardwareModel";

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
      // this.createLeaseSKUCSVFile(leaseSKUCombination);
      this.createXLSXFile(leaseSKUCombination);
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
            "-G7" +
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
            "CMP-G7" + leaseSKU.HardwareCode + "-" + leaseSKU.CountryCode;

          const item2 = "CMP-CART-" + cartrigeObj.CartridgeCombinationCode;
          const item3 =
            "SER-CMP-G7" +
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

  createXLSXFile = async leaseSKUCombination => {
    const records = [];

    try {
      const leaseSKUResult = await leaseSKUModel.getLeaseSKU();
      if (leaseSKUResult.success && leaseSKUResult.data.length > 0) {
        leaseSKUResult.data.forEach(obj => {
          records.push({
            LeaseSKUCode: obj.LeaseSKUCode,
            LeaseSKUName: obj.LeaseSKUName,
            ["Item 1"]: obj.Item1,
            ["Item 2"]: obj.Item2,
            ["Item 3"]: obj.Item3,
            ["Item 4"]: obj.Item4
          });
        });
      }

      const Workbook = excel.utils.book_new();
      const leaseSKUSheet = excel.utils.json_to_sheet(records, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, leaseSKUSheet, "CMP IG");

      // Cartridge Data
      const cartridgeRecords = [];
      const cartridgeSKUResult = await cartridgeModel.getCartridgeCombination();
      if (cartridgeSKUResult.success && cartridgeSKUResult.data.length > 0) {
        cartridgeSKUResult.data.forEach(obj => {
          cartridgeRecords.push({
            SKU: obj.CartridgeCombinationCode,
            Description: obj.CartridgeCombinationName
          });
        });
      }
      const cartridgeSheet = excel.utils.json_to_sheet(cartridgeRecords, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, cartridgeSheet, "Cartridge IG");

      // End cartridge Data

      // Service Data
      const serviceRecords = [];
      const serviceSKUResult = await serviceSKUModel.getServiceSKU();
      if (serviceSKUResult.success && serviceSKUResult.data.length > 0) {
        serviceSKUResult.data.forEach(obj => {
          serviceRecords.push({
            SKU: obj.ServiceSKUCode,
            Description: obj.ServiceSKUName
          });
        });
      }
      const serviceSheet = excel.utils.json_to_sheet(serviceRecords, {
        dateNF: "mm/dd/yy hh:mm:ss"
      });
      excel.utils.book_append_sheet(Workbook, serviceSheet, "Service IG");
      // End service Data

      // Hardware Data
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
      // End Hardware Data

      excel.writeFile(Workbook, "/home/anandsingh/Desktop/SKULoad.xlsx");
      console.log("......Done");
    } catch (error) {
      console.log("Error for createXLSXFile in leaseSKUController ", error);
    }
  };
}

export default new LeaseSKUController();
