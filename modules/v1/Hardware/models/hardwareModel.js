import mySqlConnection from "../../Services/mySQLConnection";

class HardwareModel {
	getCountryHardwareMatrix = () => {
		const query = "Call getCountryHardwareMatrix()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getCountryHardwareMatrix in HardwareModel ", err);
					return reject({ success: false, message: error });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	createHardwareSKU = (parameters) => {
		const query = "INSERT INTO HardwareSKU (HardwareSKUCode, HardwareSKUName) VALUES ?";
		// const queryParameters = [ parameters.hardwareCode, parameters.hardwareCombinationName ];
		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(
				query,
				[ parameters.map((item) => [ item.HardwareSKUCode, item.HardwareSKUName ]) ],
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

	getHardwareSKUByCode = (HardwareSKUCode) => {
		const query = "Call getHardwareSKUByCode(?)";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, HardwareSKUCode, (err, result) => {
				if (err) {
					console.log("Error for getHardwareSKUByCode in hardwareModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getHardwareSKU = () => {
		const query = "Call getHardwareSKU()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getHardwareSKU in hardwareModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getHardwarePrice = (parameters) => {
		const query = "Call getHardwarePrice(?,?)";

		const queryParameters = [ parameters.HardwareCode, parameters.CountryCode ];
		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, queryParameters, (err, result) => {
				if (err) {
					console.log("Error for getHardwarePrice in hardwareModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};
}

export default new HardwareModel();
