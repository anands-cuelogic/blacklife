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
      "INSERT INTO CartridgeCombination (CartridgeCombinationCode, CartridgeCombinationName, CartridgeGroupName) VALUES(?,?,?)";
    const queryParameter = [
      parameters.cartridgeCombinationCode,
      parameters.cartridgeCombinationName,
      parameters.groupName
    ];

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        queryParameter,
        (err, result) => {
          if (err) {
            if (err.errno === 1062) console.log("Duplicate entry error");
            else
              console.log(
                "Error for createCartridgeCobination in cartridgeModel ",
                err
              );
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
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
          } else if (result.length > 0) {
            return resolve({ success: false, data: result });
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
}

export default new CartridgeModel();
