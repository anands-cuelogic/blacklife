import mySqlConnection from "../../Services/mySQLConnection";

class ServiceSKUModel {
  createServiceSKU = parameters => {
    const query =
      "INSERT INTO ServiceSKU (ServiceSKUCode, ServiceSKUName)VALUES (?,?)";
    const queryParameters = [
      parameters.serviceSKUCode,
      parameters.serviceSKUName
    ];

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        queryParameters,
        (err, result) => {
          console.log("Temp ", temp.sql);
          if (err) {
            console.log("Error for createServiceSKU in ServiceSKUModel ", err);
            return reject({ success: false, message: err });
          }
          return resolve({ success: true, data: result });
        }
      );
    });
  };

  getService = () => {
    const query = "SELECT ServiceName, ServiceCode FROM Service";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getService in ServiceSKUModel  ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getYear = () => {
    const query = "SELECT YearName, YearCode from Years";

    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, (err, result) => {
        if (err) {
          console.log("Error for getYear im serviceSKUModel ", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };

  getServiceSKUByCode = serviceSKUCode => {
    const query =
      "SELECT ServiceSKUCode FROM ServiceSKU WHERE ServiceSKUCode IN (?)";

    const queryParameter = [serviceSKUCode];
    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(
        query,
        queryParameter,
        (err, result) => {
          if (err) {
            console.log(
              "Error for getServiceSKYByCode in ServiceSKUModel ",
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

export default new ServiceSKUModel();
