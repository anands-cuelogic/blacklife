import mySqlConnection from "../../Services/mySQLConnection";

class HardwareModel {
  getCountryHardwareMatrix = () => {
    const query = `SELECT HardwareCode, HardwareName, CountryCode, CountryName FROM CountryHardwareMatrix chm
        JOIN Hardware h ON h.idHardware = chm.HardwareId AND chm.isActive = 1
        JOIN Country c ON c.idCountry = chm.CountryId`;

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log(
            "Error for getCountryHardwareMatrix in HardwareModel ",
            err
          );
          return reject({ success: false, message: error });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  createHardwareSKU = parameters => {
    const query =
      "INSERT INTO HardwareSKU (HardwareSKUCode, HardwareSKUName) VALUES(?,?)";
    const queryParameters = [
      parameters.hardwareCode,
      parameters.hardwareCombinationName
    ];
    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        queryParameters,
        (err, result) => {
          if (err) {
            console.log("Error for createHardwareSKU in hardwareModel ", err);
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
    });
  };

  getHardwareSKUByCode = HardwareSKUCode => {
    const query =
      "SELECT HardwareSKUCode FROM HardwareSKU WHERE HardwareSKUCode IN (?)";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        HardwareSKUCode,
        (err, result) => {
          if (err) {
            console.log(
              "Error for getHardwareSKUByCode in hardwareModel ",
              err
            );
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
    });
  };

  getHardwareSKU = () => {
    const query = "SELECT HardwareSKUCode, HardwareSKUName FROM HardwareSKU";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getHardwareSKU in hardwareModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };
}

export default new HardwareModel();