import _ from "lodash";
import createCSV from "csv-writer";

import serviceSKUModel from "../models/serviceSKUModel";
import cartridgeModel from "../../Cartridge/models/cartridgeModel";
import cartridgeController from "../../Cartridge/controllers/cartridgeController";
import yearsModel from "../../Years/models/yearsModel";

class ServiceSKUController {
  createServiceCSVFile = async () => {
    const createCsvWriter = createCSV.createObjectCsvWriter;

    const csvWriter = createCsvWriter({
      path: "/home/anandsingh/Desktop/serviceIG.csv",
      header: [
        { id: "serviceSKUCode", title: "ServiceSKUCode" },
        { id: "serviceSKUName", title: "ServiceSKUName" }
      ]
    });

    const records = [];

    try {
      const serviceSKUResult = await serviceSKUModel.getServiceSKU();
      if (serviceSKUResult.success && serviceSKUResult.data.length > 0) {
        serviceSKUResult.data.forEach(obj => {
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
  };

  createServiceSKU = async () => {
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
        for (const serviceObj of serviceResult.data) {
          for (const yearObj of yearResult.data) {
            for (const cartridgeObj of cartridgeCombinationResult.data) {
              const serviceSKUCode =
                "SER-" +
                serviceObj.ServiceCode +
                "-" +
                cartridgeObj.CartridgeCombinationCode +
                "-" +
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

              serviceSKUCombination.push([serviceSKUCode, serviceSKUName]);
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
            serviceIGCombination = await this.storeServiceSKU(temparray);
          } catch (error) {
            console.log("Error for storing ", error);
          }
        }

        this.createServiceCSVFile();
      }
    }

    // console.log("--------Service SKU ", serviceSKUCombination);
  };

  storeServiceSKU = async serviceSKUObj => {
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
      console.log(
        "Error for generateHardwareCombination in createHardwareSKU app",
        error
      );
    }
    //}
  };

  getServiceSKUPrice = serviceSKUObj => {
    return new Promise(async (resolve, reject) => {
      const serviceSKUArr = serviceSKUObj.ServiceSKUCode.split("-");
      const servicePrice = await this.calculateServiceSKUPrice(
        serviceSKUArr[1]
      );

      let cartridgePrice;
      if (serviceSKUArr.length === 5) {
        // Standard Cartridge
        cartridgePrice = {
          USD: 0,
          CAD: 0,
          GBP: 0,
          EUR: 0,
          AUD: 0
        };
      } else {
        cartridgePrice = await cartridgeController.calculateCartridgePrice({
          CartridgeCombinationCode: serviceSKUArr[2] + "-" + serviceSKUArr[3]
        });
      }
      const yearStr = serviceSKUArr[serviceSKUArr.length - 1];
      const yearArr = yearStr.split("");

      if (yearArr[1].toLowerCase() === "y") {
        const discountPercentage = await yearsModel.getYearDiscount(yearStr);
        const discount =
          parseInt(discountPercentage.data[0].Discount, 10) / 100;

        servicePrice.USD = Math.round(
          parseInt(yearArr[0], 10) *
            (servicePrice.USD -
              servicePrice.USD * discount +
              (cartridgePrice.USD - cartridgePrice.USD * discount))
        );

        servicePrice.CAD = Math.round(
          parseInt(yearArr[0], 10) *
            (servicePrice.CAD -
              servicePrice.CAD * discount +
              (cartridgePrice.CAD - cartridgePrice.CAD * discount))
        );
        servicePrice.GBP = Math.round(
          parseInt(yearArr[0], 10) *
            (servicePrice.GBP -
              servicePrice.GBP * discount +
              (cartridgePrice.GBP - cartridgePrice.GBP * discount))
        );
        servicePrice.EUR = Math.round(
          parseInt(yearArr[0], 10) *
            (servicePrice.EUR -
              servicePrice.EUR * discount +
              (cartridgePrice.EUR - cartridgePrice.EUR * discount))
        );
        servicePrice.AUD = Math.round(
          parseInt(yearArr[0], 10) *
            (servicePrice.AUD -
              servicePrice.AUD * discount +
              (cartridgePrice.AUD - cartridgePrice.AUD * discount))
        );
      }
      return resolve(servicePrice);
    });
  };

  calculateServiceSKUPrice = serviceSKUCode => {
    return new Promise(async (resolve, reject) => {
      const ServiceSKUPriceResult = await serviceSKUModel.getServiceSKUPrice(
        serviceSKUCode
      );
      const ServiceSKUPrice = {
        USD: 0,
        CAD: 0,
        GBP: 0,
        EUR: 0,
        AUD: 0
      };

      if (
        ServiceSKUPriceResult.success &&
        ServiceSKUPriceResult.data.length > 0
      ) {
        cartridgeController.getPriceForRegion(
          ServiceSKUPriceResult.data,
          ServiceSKUPrice
        );
      }
      return resolve(ServiceSKUPrice);
    });
  };
}
export default new ServiceSKUController();
