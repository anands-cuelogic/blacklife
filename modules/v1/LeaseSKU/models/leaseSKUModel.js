import mySqlConnection from "../../Services/mySQLConnection";

class LeaseSKUModel {
	getLeaseSKUMatrix = () => {
		const query = "Call getLeaseSKUMatrix()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getLeaseMatrix in leaseSKUModel ", error);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	createLeaseSKU = (parameters) => {
		const query = "INSERT INTO LeaseSKU (LeaseSKUCode, LeaseSKUName, Item1, Item2, Item3, Item4)VALUES ?";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(
				query,
				[
					parameters.map((item) => [
						item.LeaseSKUCode,
						item.LeaseSKUName,
						item.Item1,
						item.Item2,
						item.Item3,
						item.Item4
					])
				],
				(err, result) => {
					// console.log("Temp ", temp.sql);
					if (err) {
						console.log("Error for LeaseSKU in LeaseSKUModel ", err);
						return reject({ success: false, message: err });
					}
					return resolve({ success: true, data: result });
				}
			);
		});
	};

	getLeaseSKU = () => {
		const query = "Call getLeaseSKU()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getLeaseSKU in leaseSKUModel ", error);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};
}

export default new LeaseSKUModel();
