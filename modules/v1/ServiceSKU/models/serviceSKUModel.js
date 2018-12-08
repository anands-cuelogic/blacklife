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

	getServiceSKUByCode = (serviceSKUCode) => {
		const query = "SELECT ServiceSKUCode FROM ServiceSKU WHERE ServiceSKUCode IN (?)";

		const queryParameter = [ serviceSKUCode ];
		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, queryParameter, (err, result) => {
				if (err) {
					console.log("Error for getServiceSKYByCode in ServiceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};

	getServiceSKU = () => {
		const query = "SELECT ServiceSKUCode, ServiceSKUName FROM ServiceSKU";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getServiceSKUU in serviceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};

	getServiceSKUPrice = (parameters) => {
		const query = `SELECT  Price, ServiceCode,CurrencyName,GroupName FROM ServiceCurrencyMatrix scm
		JOIN Service s ON s.idService = scm.ServiceId AND s.ServiceCode IN (?)
		JOIN Currency c ON c.idCurrency = scm.CurrencyId`;

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, parameters, (err, result) => {
				if (err) {
					console.log("Error for getServicreSKUPrice in serviceSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};
}

export default new ServiceSKUModel();
