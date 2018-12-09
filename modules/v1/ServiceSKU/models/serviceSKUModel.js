import mySqlConnection from "../../Services/mySQLConnection";

class ServiceSKUModel {
	createServiceSKU = (parameters) => {
		const query = "INSERT INTO ServiceSKU (ServiceSKUCode, ServiceSKUName)VALUES ?";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(
				query,
				[ parameters.map((item) => [ item.ServiceSKUCode, item.ServiceSKUName ]) ],
				(err, result) => {
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
		const query = "Call getService()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getService in ServiceSKUModel  ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getYear = () => {
		const query = "Call getYear()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getYear im serviceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getServiceSKUByCode = (serviceSKUCode) => {
		const query = "Call serviceSKUCode(?)";

		const queryParameter = [ serviceSKUCode ];
		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, queryParameter, (err, result) => {
				if (err) {
					console.log("Error for getServiceSKYByCode in ServiceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getServiceSKU = () => {
		const query = "Call getServiceSKU()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getServiceSKUU in serviceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getServiceSKUPrice = (parameters) => {
		const query = "Call getServiceSKUPrice(?)";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, parameters, (err, result) => {
				if (err) {
					console.log("Error for getServicreSKUPrice in serviceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};
}

export default new ServiceSKUModel();
