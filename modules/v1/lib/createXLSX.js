import * as excel from "xlsx";

import leaseSKUModel from "../LeaseSKU/models/leaseSKUModel";
import cartridgeModel from "../Cartridge/models/cartridgeModel";
import serviceSKUModel from "../ServiceSKU/models/serviceSKUModel";
import hardwareModel from "../Hardware/models/hardwareModel";
import cartridgeController from "../Cartridge/controllers/cartridgeController";
import serviceSKUController from "../ServiceSKU/controllers/serviceSKUController";
import hardwareController from "../Hardware/controllers/hardwareController";
import currencyFormat from "./currencyFormat";
import leaseSKUController from "../LeaseSKU/controllers/leaseSKUController";

class CreateXLSX {
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

          const SKUPrice = await leaseSKUController.calculateSKUPrice(obj);

          records.push({
            LeaseSKUCode: obj.LeaseSKUCode,
            LeaseSKUName: obj.LeaseSKUName,
            ["Item 1"]: obj.Item1,
            ["Item 2"]: obj.Item2,
            ["Item 3"]: obj.Item3,
            ["Item 4"]: obj.Item4,
            USD: "$" + currencyFormat.numberWithCommas(SKUPrice.USD),
            CAD: "$" + currencyFormat.numberWithCommas(SKUPrice.CAD),
            GBP: "$" + currencyFormat.numberWithCommas(SKUPrice.GBP),
            EUR: "$" + currencyFormat.numberWithCommas(SKUPrice.EUR),
            AUD: "$" + currencyFormat.numberWithCommas(SKUPrice.AUD)
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
            SKU: "SER-CART-" + obj.CartridgeCombinationCode + "-1Y",
            Description: obj.CartridgeCombinationName,
            USD: "$" + currencyFormat.numberWithCommas(cartridgePrice.USD),
            CAD: "$" + currencyFormat.numberWithCommas(cartridgePrice.CAD),
            GBP: "$" + currencyFormat.numberWithCommas(cartridgePrice.GBP),
            EUR: "$" + currencyFormat.numberWithCommas(cartridgePrice.EUR),
            AUD: "$" + currencyFormat.numberWithCommas(cartridgePrice.AUD)
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
            USD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.USD),
            CAD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.CAD),
            GBP: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.GBP),
            EUR: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.EUR),
            AUD: "$" + currencyFormat.numberWithCommas(serviceSKUPrice.AUD)
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
        const hardwarePrice = hardwareController.calculateHardwarePrice();
        for (const obj of hardwareSKUResult.data) {
          const hardwareSKUArr = obj.HardwareSKUCode.split("-");
          const hardwarePrice = await hardwareController.calculateHardwarePrice(
            hardwareSKUArr[0],
            hardwareSKUArr[hardwareSKUArr.length - 1]
          );

          let hardwareItemObj = {};
          if (hardwareSKUArr.length === 3) {
            hardwareItemObj.item1 =
              hardwareSKUArr[0] +
              "-" +
              hardwareSKUArr[hardwareSKUArr.length - 1];
            hardwareItemObj.item2 = "CART-" + hardwareSKUArr[1];
          } else {
            hardwareItemObj.item1 =
              hardwareSKUArr[0] +
              "-" +
              hardwareSKUArr[hardwareSKUArr.length - 1];
            hardwareItemObj.item2 =
              "CART-" + hardwareSKUArr[1] + "-" + hardwareSKUArr[2];
          }

          hardwareRecords.push({
            SKU: obj.HardwareSKUCode,
            Description: obj.HardwareSKUName,
            ["Item 1"]: hardwareItemObj.item1,
            ["Item 2"]: hardwareItemObj.item2,
            USD: "$" + currencyFormat.numberWithCommas(hardwarePrice.USD),
            CAD: "$" + currencyFormat.numberWithCommas(hardwarePrice.CAD),
            GBP: "$" + currencyFormat.numberWithCommas(hardwarePrice.GBP),
            EUR: "$" + currencyFormat.numberWithCommas(hardwarePrice.EUR),
            AUD: "$" + currencyFormat.numberWithCommas(hardwarePrice.AUD)
          });
        }
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
}

export default new CreateXLSX();
