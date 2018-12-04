import mySqlConnection from "../../Services/mySQLConnection";

class CartridgeModel {
  getCartridge = () => {
    const query =
      "SELECT CartridgeCode , CartridgeName, SequenceNo, GroupName FROM Cartridge";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getCartridge cartridgeModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getSingleGas = () => {
    const query =
      "SELECT GasName, GasCode, sg.SequenceNo AS SingleGasSequence FROM Gas g JOIN SingleGas sg ON g.idGas = sg.GasId";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getSingleGas in cartridgeModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getMultiGas = () => {
    const query =
      "SELECT GasName, GasCode, mg.SequenceNo FROM Gas g JOIN MultiGas mg ON g.idGas = mg.GasId Order By mg.SequenceNo";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getMultiGas in cartridgeModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  createCartridgeCombination = parameters => {
    const query =
      "INSERT INTO CartridgeCombination (CartridgeCombinationCode, CartridgeCombinationName, CartridgeGroupName) VALUES ?";
    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, [parameters], (err, result) => {
        // console.log("-------Temp ", temp.sql);
        if (err) {
          if (err.errno === 1062) {
            console.log("Duplicate entry error for ", parameters);
            return resolve({
              success: true,
              data: result,
              requestedCombination: parameters
            });
          } else {
            // console.log("Error for createCartridgeCobination in cartridgeModel ", err);
            return reject({
              success: false,
              message: err,
              requestedCombination: parameters
            });
          }
        }
        return resolve({
          success: true,
          data: result,
          requestedCombination: parameters
        });
      });
    });
  };

  getCartridgeCombinationByCode = cartridgeCombinationCode => {
    const query =
      "SELECT CartridgeCombinationCode FROM CartridgeCombination WHERE CartridgeCombinationCode IN (?)";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        cartridgeCombinationCode,
        (err, result) => {
          if (err) {
            console.log(
              "Error for getCartridgeCombinationByCode in cartridgeModel ",
              err
            );
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
    });
  };

  getCartridgeCombination = () => {
    const query =
      "SELECT CartridgeCombinationCode, CartridgeCombinationName FROM CartridgeCombination";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log(
            "Error for getCartridgeCombination in cartidgeModel ",
            err
          );
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getGasPrice = parameters => {
    const query = `SELECT  GasCode, Price, CurrencyName FROM GasCurrencyMatrix gcm
		JOIN Gas g on g.idGas = gcm.GasId AND g.GasCode IN (?)
		JOIN Currency c ON c.idCurrency = gcm.CurrencyId`;

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, parameters, (err, result) => {
        if (err) {
          console.log("Error for getPrice in cartridgeModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getCartridgeCurrency = parameters => {
    const query = `SELECT CurrencyName, Price FROM blacklinesafetySKU.CartridgeCurrency cc
	JOIN Currency c ON c.idCurrency = cc.CurrencyId AND Quantity IN(?) AND CartridgeCode IN (?)`;
    const queryParameters = [parameters.quantity, parameters.CartridgeCode];

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        queryParameters,
        (err, result) => {
          if (err) {
            console.log(
              "Error for getCartridgeCurrency in cartridgeModel ",
              err
            );
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
    });
  };
}

export default new CartridgeModel();
