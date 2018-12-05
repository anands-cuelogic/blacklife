import mySqlConnection from "../../Services/mySQLConnection";

class YearsModel {
  getYearDiscount = parameters => {
    const query = `SELECT Discount FROM Years WHERE YearCode IN (?)`;
    return new Promise((resolve, reject) => {
      const temp = mySqlConnection.query(query, parameters, (err, result) => {
        if (err) {
          console.log("Error for getYearDiscount in yearsModel", err);
          return reject({ success: false, message: err });
        }
        return resolve({ success: true, data: result });
      });
    });
  };
}
export default new YearsModel();
